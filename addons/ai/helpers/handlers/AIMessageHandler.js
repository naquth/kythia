/**
 * @namespace: addons/ai/helpers/handlers/AIMessageHandler.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	GoogleGenAI,
	HarmCategory,
	HarmBlockThreshold,
} = require('@google/genai');
const { ChannelType } = require('discord.js');
const { utils } = require('kythia-core');
const { buildSystemInstruction } = require('../prompt-builder');
const { getAndUseNextAvailableToken } = require('../gemini');

/**
 * AIMessageHandler
 * Main handler for AI message processing with all dependencies injected.
 */
class AIMessageHandler {
	/**
	 * @param {Object} container - Full DI container
	 */
	constructor(container) {
		this.container = container;
		this.logger = container.logger;
		this.t = container.t;
		this.ServerSetting = container.sequelize.models.ServerSetting;
		this.isOwner = container.helpers.discord.isOwner;
		this.config = container.kythiaConfig;
		this.aiConfig = this.config.addons.ai;

		// Initialize helper classes
		const AIResponseFilter = require('../AIResponseFilter');
		const UserFactsManager = require('../UserFactsManager');
		const ConversationManager = require('../ConversationManager');
		const MediaProcessor = require('../MediaProcessor');

		this.responseFilter = new AIResponseFilter();
		this.factsManager = new UserFactsManager({
			UserFact: container.sequelize.models.UserFact,
			logger: this.logger,
			config: this.config,
		});
		this.conversationManager = new ConversationManager({
			cacheTimeout: 30 * 60 * 1000,
			cleanupInterval: 5 * 60 * 1000,
			maxHistoryLength: 12,
		});

		const path = require('node:path');
		this.mediaProcessor = new MediaProcessor({
			tempDir: path.join(__dirname, '..', 'temp'),
			logger: this.logger,
			geminiApiKey: this.aiConfig.geminiApiKeys.split(',')[0],
		});

		// Per-user cooldown: Map<userId, number[]> (timestamps of recent requests)
		this.userCooldowns = new Map();
	}

	/**
	 * Main message handler entry point
	 * @param {Object} bot - Bot instance
	 * @param {import('discord.js').Message} message - Discord message
	 */
	async handleMessage(bot, message) {
		const client = bot.client;

		// Ignore bots and system messages
		if (message.author?.bot || message.system) return;

		// Ignore messages starting with bot prefix
		const content =
			typeof message.content === 'string' ? message.content.trim() : '';
		if (
			Array.isArray(this.config?.bot?.prefixes) &&
			this.config.bot.prefixes.some(
				(prefix) => prefix && content.startsWith(prefix),
			)
		) {
			return;
		}

		// Check if should respond (DM, mention, or AI enabled channel)
		const isDm =
			message.channel.type === ChannelType.DM || message.channel.type === 1;
		const isMentioned =
			message.mentions.users.has(client.user.id) &&
			!message.mentions.everyone &&
			(!message.mentions.roles || message.mentions.roles.size === 0);

		// ── Modmail collision guard ──────────────────────────────────────────
		// If the user DMs the bot while having an active modmail session (or
		// while the modmail addon is routing them to pick a server), skip AI
		// entirely so modmail has exclusive handling of the DM.
		if (isDm) {
			const activeDMs = client.modmailActiveDMs;
			if (activeDMs instanceof Set && activeDMs.has(message.author.id)) {
				return;
			}
		}
		// ───────────────────────────────────────────────────────────────────

		let isAiChannel = false;
		if (message.guild) {
			try {
				const serverSetting = await this.ServerSetting.getCache({
					guildId: message.guild.id,
				});
				if (serverSetting?.aiChannelIds?.includes(message.channel.id)) {
					isAiChannel = true;
				}
			} catch (e) {
				this.logger.error(`Error getting ServerSetting: ${e.message || e}`, {
					label: 'ai',
				});
			}
		}

		if (!(isAiChannel || isDm || isMentioned)) {
			return;
		}

		// Check per-user cooldown (owners can bypass if ownerBypassFilter is true)
		const isOwnerUser = this.isOwner(message.author.id);
		if (!isOwnerUser || !this.aiConfig.ownerBypassFilter) {
			const cooldownResult = this.checkUserCooldown(message.author.id);
			if (cooldownResult.limited) {
				const seconds = Math.ceil(cooldownResult.resetIn / 1000);
				const cooldownMsg = (
					await this.t(message, 'ai.events.messageCreate.cooldown')
				).replace('{seconds}', seconds);
				await message.reply(cooldownMsg).catch(() => {});
				return;
			}
		}

		// Check for memory command
		const memoryResult = await this.checkMemoryCommand(content, message);
		if (memoryResult) return;

		// Process AI request
		await this.processAIRequest(bot, message, client);
	}

	/**
	 * Check and enforce per-user AI request cooldown.
	 * Records the current timestamp and evicts old ones outside the window.
	 * @param {string} userId - Discord user ID
	 * @returns {{ limited: boolean, resetIn?: number }} Result with ms until reset if limited
	 */
	checkUserCooldown(userId) {
		const maxRequests = this.aiConfig.userCooldownRequests ?? 2;
		const windowMs = (this.aiConfig.userCooldownWindowSec ?? 60) * 1000;
		const now = Date.now();

		let timestamps = this.userCooldowns.get(userId) || [];

		// Evict timestamps outside the window
		timestamps = timestamps.filter((ts) => now - ts < windowMs);

		if (timestamps.length >= maxRequests) {
			// Time until the oldest request expires
			const resetIn = windowMs - (now - timestamps[0]);
			this.userCooldowns.set(userId, timestamps);
			return { limited: true, resetIn };
		}

		timestamps.push(now);
		this.userCooldowns.set(userId, timestamps);
		return { limited: false };
	}

	/**
	 * Check if message is a memory/remember command
	 * @param {string} content - Message content
	 * @param {import('discord.js').Message} message - Discord message
	 * @returns {Promise<boolean>} True if was memory command
	 */
	async checkMemoryCommand(_content, message) {
		const cleanContent =
			typeof message.content === 'string'
				? message.content
						.replace(/<@!?\d+>/g, '')
						.trim()
						.slice(0, 1500)
				: '';

		const memoryKeywords = [
			'ingat(?: ya)?',
			'catat',
			'simpan',
			'tambahkan',
			'tulis',
			'remember',
			'note',
			'save',
			'store',
			'add',
			'keep',
		].join('|');

		const memoryRegex = new RegExp(
			`^(?:<@!?\\d+>|kythia)?[\\s,.]*?(?:tolong\\s+)?(?:${memoryKeywords})[\\s,.:]+(.+)$`,
			'i',
		);
		const memoryMatch = cleanContent.match(memoryRegex);

		if (memoryMatch?.[1]) {
			let fact = memoryMatch[1].trim();
			fact = fact.replace(/^(<@!?\d+>|kythia)[\s,.:]*/i, '').trim();

			if (fact.length > 0) {
				const status = await this.factsManager.appendFact(
					message.author.id,
					fact,
				);
				if (status === 'added') {
					await message.reply(
						await this.t(message, 'ai.events.messageCreate.memory.added'),
					);
				} else if (status === 'duplicate') {
					await message.reply(
						await this.t(message, 'ai.events.messageCreate.memory.duplicate'),
					);
				}
			} else {
				await message.reply(
					await this.t(message, 'ai.events.messageCreate.memory.empty'),
				);
			}
			return true;
		}

		return false;
	}

	/**
	 * Process AI request with typing indicator and error handling
	 * @param {Object} bot - Bot instance
	 * @param {import('discord.js').Message} message - Discord message
	 * @param {Object} client - Discord client
	 */
	async processAIRequest(bot, message, client) {
		let typingInterval;

		try {
			await message.channel.sendTyping();
			typingInterval = setInterval(() => {
				message.channel.sendTyping().catch((err) => {
					this.logger.warn(
						`Error sending typing indicator: ${err.message || err}`,
						{
							label: 'AIMessageHandler',
						},
					);
					clearInterval(typingInterval);
				});
			}, 8000);

			// Build context for AI
			const context = await this.buildContext(message, client);
			const cleanContent = this.cleanMessageContent(message.content);

			// Check for empty content
			const mediaParts = await this.mediaProcessor.processAttachments(message);
			const youtubeParts = this.mediaProcessor.extractYouTubeUrls(
				message.content,
			);
			mediaParts.push(...youtubeParts);

			if (!cleanContent && mediaParts.length === 0) {
				if (message.mentions.users.has(client.user.id)) {
					await message.reply(
						await this.t(message, 'ai.events.messageCreate.mention'),
					);
				}
				if (typingInterval) clearInterval(typingInterval);
				return;
			}

			// Get or load conversation
			const userConv = this.conversationManager.getConversation(
				message.author.id,
			);
			if (userConv.history.length === 0) {
				await this.loadConversationHistory(message, client, userConv);
			}

			this.conversationManager.updateActivity(message.author.id);
			this.conversationManager.addToHistory(
				message.author.id,
				'user',
				cleanContent,
			);

			// Build contents array
			const contents = this.conversationManager.buildContentsArray(
				message.author.id,
			);

			// Append media to last user message
			if (mediaParts.length > 0) {
				let lastUserIdx = -1;
				for (let i = contents.length - 1; i >= 0; i--) {
					if (contents[i].role === 'user') {
						lastUserIdx = i;
						break;
					}
				}
				if (lastUserIdx !== -1) {
					contents[lastUserIdx].parts = [
						...mediaParts,
						{ text: cleanContent || 'Describe this image/video.' },
					];
				} else {
					contents.push({
						role: 'user',
						parts: [
							...mediaParts,
							{ text: cleanContent || 'Describe this image/video.' },
						],
					});
				}
			}

			// Determine pathway and execute AI request
			const pathway = this.determinePathway(cleanContent);
			const success = await this.executeAIRequest(
				message,
				context,
				contents,
				pathway,
				bot,
				client,
			);

			if (typingInterval) clearInterval(typingInterval);

			if (!success) {
				this.logger.error(
					'❌ All AI tokens failed (likely 429). Informing user.',
					{ label: 'ai' },
				);
				await message
					.reply(
						await this.t(message, 'ai.events.messageCreate.memory.token.limit'),
					)
					.catch(() => {});
			}
		} catch (err) {
			this.logger.error(`AI Pre-flight Error: ${err.message || err}`, {
				label: 'AIMessageHandler',
			});
			await message.channel
				.send(await this.t(message, 'ai.events.messageCreate.error'))
				.catch(() => {});
			if (typingInterval) clearInterval(typingInterval);
		}
	}

	/**
	 * Build context object for AI
	 * @param {import('discord.js').Message} message - Discord message
	 * @param {Object} client - Discord client
	 * @returns {Promise<Object>} Context object
	 */
	async buildContext(message, client) {
		const userDisplayName =
			message.member?.displayName || message.author.username;
		const userTag =
			message.author.tag ||
			`${message.author.username}#${message.author.discriminator}`;
		const userFactsString = await this.factsManager.getFactsString(
			message.author.id,
		);
		const userBio = await this.getUserBio(message.author.id, client);
		const guildName = message.guild?.name || 'Direct Message';
		const channelName = message.channel.name || 'Direct Message';

		// Get user personality preference
		const { KythiaUser } = this.container.sequelize.models;
		const user = await KythiaUser.getCache({
			userId: message.author.id,
		});
		// Fallback to config default, then 'friendly' if not set in config
		const userPersonality =
			user?.aiPersonality || this.aiConfig.defaultPersonality || 'friendly';

		return {
			userId: message.author.id,
			userDisplayName,
			userFactsString,
			userTag,
			userBio,
			guildName,
			channelName,
			userPersonality,
		};
	}

	/**
	 * Get user's bio from Discord profile
	 * @param {string} userId - User ID
	 * @param {Object} client - Discord client
	 * @returns {Promise<string>} User bio
	 */
	async getUserBio(userId, client) {
		try {
			const user = await client.users.fetch(userId, { force: true });
			return user.bio || 'Not set';
		} catch {
			return 'Cannot get bio';
		}
	}

	/**
	 * Clean message content
	 * @param {string} content - Raw content
	 * @returns {string} Cleaned content
	 */
	cleanMessageContent(content) {
		return typeof content === 'string'
			? content
					.replace(/<@!?\d+>/g, '')
					.trim()
					.slice(0, 1500)
			: '';
	}

	/**
	 * Load conversation history from channel
	 * @param {import('discord.js').Message} message - Discord message
	 * @param {Object} client - Discord client
	 * @param {Object} userConv - User conversation object
	 */
	async loadConversationHistory(message, client, userConv) {
		this.logger.info(
			`🧠 Cache miss for ${message.author.tag}. Reconstructing history...`,
			{ label: 'ai' },
		);

		const CONTEXT_MESSAGES_TO_FETCH =
			this.aiConfig.getMessageHistoryLength || 10;
		const lastMessages = await message.channel.messages.fetch({
			limit: CONTEXT_MESSAGES_TO_FETCH,
		});

		const relevantMessages = Array.from(lastMessages.values())
			.filter(
				(msg) =>
					msg.author.id === message.author.id ||
					(msg.author.id === client.user.id &&
						msg.reference &&
						lastMessages.has(msg.reference.messageId) &&
						lastMessages.get(msg.reference.messageId).author.id ===
							message.author.id) ||
					(msg.author.id === client.user.id && !msg.reference),
			)
			.reverse();

		for (const msg of relevantMessages) {
			const c =
				typeof msg.content === 'string'
					? msg.content.replace(/<@!?\d+>/g, '').trim()
					: '';
			if (!c && msg.attachments.size === 0) continue;
			const role = msg.author.id === client.user.id ? 'model' : 'user';
			userConv.history.push({ role, content: c });
		}
	}

	/**
	 * Determine AI pathway (function calling vs search)
	 * @param {string} content - Message content
	 * @returns {'function_calling'|'google_search'} Pathway
	 */
	determinePathway(content) {
		const clean = content.toLowerCase();
		const additionalCommandKeywords =
			this.aiConfig?.additionalCommandKeywords || [];
		const safeCommands = this.aiConfig?.safeCommands || [];

		const commandKeywords = Array.isArray(safeCommands)
			? [...safeCommands, ...additionalCommandKeywords]
			: additionalCommandKeywords;

		const commandRegex = new RegExp(
			`\\b(${commandKeywords.join('|')})\\b`,
			'i',
		);

		if (commandRegex.test(clean)) {
			this.logger.info(
				`🧠 Intent detected as Command. Using Function Calling pathway.`,
				{ label: 'ai' },
			);
			return 'function_calling';
		}

		this.logger.info(
			`🧠 Intent not specific. Using Google Search pathway (Default).`,
			{ label: 'ai' },
		);
		return 'google_search';
	}

	/**
	 * Execute AI request with token rotation
	 * @param {import('discord.js').Message} message - Discord message
	 * @param {Object} context - AI context
	 * @param {Array} contents - Contents array
	 * @param {string} pathway - AI pathway
	 * @param {Object} bot - Bot instance
	 * @param {Object} client - Discord client
	 * @returns {Promise<boolean>} Success status
	 */
	async executeAIRequest(message, context, contents, pathway, bot, client) {
		const systemInstruction = buildSystemInstruction(context);
		const GEMINI_MODEL = this.aiConfig.model;

		const toolsConfig = [];
		if (pathway === 'google_search') {
			this.logger.info(`🧠 Using Google Search pathway.`, { label: 'ai' });
			toolsConfig.push({ googleSearch: {} });
		} else {
			this.logger.info(`🧠 Using Function Calling pathway (Default).`, {
				label: 'ai',
			});
			if (bot.aiCommandSchema && bot.aiCommandSchema.length > 0) {
				toolsConfig.push({
					functionDeclarations: bot.aiCommandSchema,
				});
			}
		}

		const totalTokens = (this.aiConfig.geminiApiKeys || '')
			.split(',')
			.map((k) => k.trim())
			.filter(Boolean).length;

		for (let attempt = 0; attempt < totalTokens; attempt++) {
			this.logger.info(`🧠 AI attempt ${attempt + 1}/${totalTokens}...`, {
				label: 'ai',
			});

			const tokenIdx = await getAndUseNextAvailableToken();
			if (tokenIdx === -1) {
				this.logger.warn(
					'⚠️ All tokens are locally rate-limited. Stopping retries.',
					{ label: 'ai' },
				);
				break;
			}

			const GEMINI_API_KEY = this.aiConfig.geminiApiKeys.split(',')[tokenIdx];
			if (!GEMINI_API_KEY) {
				this.logger.warn(`Token index ${tokenIdx} is invalid. Skipping.`, {
					label: 'ai',
				});
				continue;
			}

			const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

			try {
				const response = await genAI.models.generateContent({
					model: GEMINI_MODEL,
					contents: contents,
					config: {
						systemInstruction: {
							parts: [{ text: systemInstruction }],
						},
						tools: toolsConfig,
						safetySettings: [
							HarmCategory.HARM_CATEGORY_HARASSMENT,
							HarmCategory.HARM_CATEGORY_HATE_SPEECH,
							HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
							HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
						].map((category) => ({
							category,
							threshold: HarmBlockThreshold.BLOCK_NONE,
						})),
					},
				});

				this.logger.info(`✅ AI request successful on attempt ${attempt + 1}`, {
					label: 'ai',
				});
				await this.handleAIResponse(response, message, contents, bot, client);
				return true;
			} catch (err) {
				if (
					err.message &&
					(err.message.includes('429') ||
						err.toString().includes('RESOURCE_EXHAUSTED'))
				) {
					this.logger.warn(
						`Token index ${tokenIdx} hit 429 limit. Retrying with next token...`,
						{ label: 'AIMessageHandler' },
					);
				} else {
					this.logger.error(
						`AI Message Error (non-429): ${err.message || err}`,
						{
							label: 'AIMessageHandler',
						},
					);
					await message.channel
						.send(await this.t(message, 'ai.events.messageCreate.error'))
						.catch(() => {});
					return false;
				}
			}
		}

		return false;
	}

	/**
	 * Handle AI response (function call or normal reply)
	 * @param {Object} response - AI response
	 * @param {import('discord.js').Message} message - Discord message
	 * @param {Array} contents - Contents array
	 * @param {Object} bot - Bot instance
	 * @param {Object} client - Discord client
	 */
	async handleAIResponse(response, message, contents, bot, client) {
		let replyText = '';
		if (response && typeof response.text === 'function') {
			replyText = response.text();
		} else if (response && typeof response.text === 'string') {
			replyText = response.text;
		}
		replyText = typeof replyText === 'string' ? replyText.trim() : '';

		if (response.functionCalls && response.functionCalls.length > 0) {
			await this.handleFunctionCall(
				response.functionCalls[0],
				message,
				contents,
				bot,
				client,
			);
		} else {
			// Normal reply
			const filterResult = this.responseFilter.filterResponse(
				replyText,
				message.author?.id,
				this.isOwner,
				this.aiConfig,
			);

			if (!filterResult.allowed) {
				await message.reply(
					await this.t(message, 'ai.events.messageCreate.filter.blocked'),
				);
				return;
			}

			await this.sendSplitMessage(message, replyText);
			this.conversationManager.addToHistory(
				message.author.id,
				'model',
				replyText,
			);
		}
	}

	/**
	 * Handle AI function call
	 * @param {Object} call - Function call object
	 * @param {import('discord.js').Message} message - Discord message
	 * @param {Array} contents - Contents array
	 * @param {Object} bot - Bot instance
	 * @param {Object} client - Discord client
	 */
	async handleFunctionCall(call, message, contents, _bot, client) {
		const fullFunctionName = call.name;
		const argsFromAi = call.args;

		const nameParts = fullFunctionName.split('_');
		const baseCommandName = nameParts[0];

		const command = client.commands.get(baseCommandName);

		if (!command) {
			await message.reply(
				await this.t(message, 'ai.events.messageCreate.command.not.found'),
			);
			return;
		}

		this.logger.info(
			`🧠 Executing command '/${baseCommandName}' (interpreted from '${fullFunctionName}') with args: ${JSON.stringify(argsFromAi)}`,
			{ label: 'ai' },
		);

		const fakeInteraction = utils.InteractionFactory.create(
			message,
			fullFunctionName,
			argsFromAi,
		);

		try {
			const executionResult = await command.execute(
				fakeInteraction,
				client.container,
			);

			const genAI = new GoogleGenAI({
				apiKey: this.aiConfig.geminiApiKeys.split(',')[0],
			});
			const followUpResponse = await genAI.models.generateContent({
				model: this.aiConfig.model,
				contents: [
					...contents,
					{ role: 'model', parts: [{ functionCall: call }] },
					{
						role: 'function',
						parts: [
							{
								functionResponse: {
									name: fullFunctionName,
									response: {
										content: JSON.stringify({
											success: true,
											result: executionResult,
										}),
									},
								},
							},
						],
					},
				],
				config: {
					safetySettings: [
						HarmCategory.HARM_CATEGORY_HARASSMENT,
						HarmCategory.HARM_CATEGORY_HATE_SPEECH,
						HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
						HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
					].map((category) => ({
						category,
						threshold: HarmBlockThreshold.BLOCK_NONE,
					})),
				},
			});

			let finalReply;
			if (followUpResponse && typeof followUpResponse.text === 'function') {
				finalReply = followUpResponse.text();
			} else if (
				followUpResponse &&
				typeof followUpResponse.text === 'string'
			) {
				finalReply = followUpResponse.text;
			}
			finalReply = typeof finalReply === 'string' ? finalReply.trim() : '';

			const filterResult = this.responseFilter.filterResponse(
				finalReply,
				message.author?.id,
				this.isOwner,
				this.aiConfig,
			);

			if (!filterResult.allowed) {
				await message.reply(
					await this.t(message, 'ai.events.messageCreate.filter.blocked'),
				);
				return;
			}

			await this.sendSplitMessage(message, finalReply);
			this.conversationManager.addToHistory(
				message.author.id,
				'model',
				finalReply,
			);
		} catch (err) {
			this.logger.error(
				`🧠 Error running '${fullFunctionName}': ${err.message || err}`,
				{ label: 'ai' },
			);
			await message.channel.send(
				await this.t(message, 'ai.events.messageCreate.command.error'),
			);
		}
	}

	/**
	 * Send AI response with [SPLIT] support
	 * @param {import('discord.js').Message} message - Discord message
	 * @param {string} text - Response text
	 */
	async sendSplitMessage(message, text) {
		const CHUNK_SIZE = 2000;
		text = typeof text === 'string' ? text : '';
		const parts = text.split('[SPLIT]');

		let hasReplied = false;

		for (const part of parts) {
			const chunk = part.trim();
			if (chunk.length === 0) continue;

			const filterResult = this.responseFilter.filterResponse(
				chunk,
				message.author?.id,
				this.isOwner,
				this.aiConfig,
			);

			if (!filterResult.allowed) {
				await message.reply(
					await this.t(message, 'ai.events.messageCreate.filter.blocked'),
				);
				return;
			}

			if (chunk.length > CHUNK_SIZE) {
				const subChunks =
					chunk.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'gs')) || [];
				for (const subChunk of subChunks) {
					const filterResultSub = this.responseFilter.filterResponse(
						subChunk,
						message.author?.id,
						this.isOwner,
						this.aiConfig,
					);

					if (!filterResultSub.allowed) {
						await message.reply(
							await this.t(message, 'ai.events.messageCreate.filter.blocked'),
						);
						return;
					}

					if (!hasReplied) {
						await message.reply({ content: subChunk });
						hasReplied = true;
					} else {
						await message.channel.send(subChunk);
					}
				}
			} else {
				if (!hasReplied) {
					await message.reply({ content: chunk });
					hasReplied = true;
				} else {
					await message.channel.send(chunk);
				}
			}
		}
	}
}

module.exports = AIMessageHandler;
