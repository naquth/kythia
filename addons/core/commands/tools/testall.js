/**
 * @namespace: addons/core/commands/tools/testall.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	SlashCommandBuilder,
	MessageFlags,
	PermissionFlagsBits,
	ApplicationCommandOptionType,
	ChannelType,
	ContainerBuilder,
	TextDisplayBuilder,
} = require('discord.js');

const BLACKLIST_COMMANDS = [
	'ban',
	'kick',
	'mute',
	'nuke',
	'prune',
	'purge',
	'shutdown',
	'restart',
	'eval',
	'exec',
	'testall', // Prevent recursion
	'giveaway-start',
	'giveaway-end',
	'giveaway-reroll',
	'ascii',
	'convert',
	'presence',
];

// ─── Mock Message ─────────────────────────────────────────────────────────────
/**
 * A mock Discord Message that is returned from reply/editReply/followUp.
 * Implements every method that commands typically call on a sent message.
 */
function createMockMessage(channel) {
	const noop = () => {};
	const asyncNoop = async () => {};

	const collectorEvents = {};

	const mockCollector = {
		on(event, fn) {
			collectorEvents[event] = fn;
			return mockCollector;
		},
		off: () => mockCollector,
		once: () => mockCollector,
		stop: noop,
		resetTimer: noop,
		// Never fire 'collect' or 'end' automatically — this is a dry run.
	};

	const mockMessage = {
		id: '000000000000000000',
		content: '',
		embeds: [],
		components: [],
		attachments: new Map(),
		channel: channel,
		author: channel?.guild?.members?.me?.user ?? {
			id: '0',
			username: 'MockBot',
			bot: true,
		},
		guild: channel?.guild ?? null,
		createdTimestamp: Date.now(),
		url: 'https://discord.com/channels/0/0/0',
		flags: { has: () => false },

		// Core message methods
		edit: async () => mockMessage,
		delete: asyncNoop,
		reply: async () => mockMessage,
		react: asyncNoop,
		pin: asyncNoop,
		unpin: asyncNoop,
		fetch: async () => mockMessage,
		crosspost: async () => mockMessage,
		suppressEmbeds: async () => mockMessage,
		removeAttachments: async () => mockMessage,
		startThread: async () => ({
			id: '000000000000000001',
			send: async () => mockMessage,
			join: asyncNoop,
		}),

		// Collectors — the most commonly missing thing
		createMessageComponentCollector: (options) => {
			void options;
			return mockCollector;
		},
		createReactionCollector: (options) => {
			void options;
			return mockCollector;
		},
		awaitMessageComponent: async () => null,
		awaitReactions: async () => new Map(),

		// Permissions / misc
		inGuild: () => true,
		inCachedGuild: () => true,
		toString: () => '[Mock Message]',
	};

	return mockMessage;
}

// ─── Mock Interaction ─────────────────────────────────────────────────────────
/**
 * Creates a mock ChatInputCommandInteraction that looks exactly like what
 * Discord.js hands to a command's execute() function.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} originalInteraction
 * @param {string} commandName
 * @param {Record<string,*>} optionsData - pre-populated option values
 */
function createMockInteraction(originalInteraction, commandName, optionsData) {
	let _replied = false;
	let _deferred = false;
	const _mockMessage = createMockMessage(originalInteraction.channel);

	// ── Options proxy ─────────────────────────────────────────────────────
	const guild = originalInteraction.guild;
	const firstRole = guild?.roles?.cache?.first() ?? null;
	const firstChannel =
		guild?.channels?.cache
			?.filter((c) => c.type === ChannelType.GuildText)
			?.first() ?? originalInteraction.channel;
	const firstMember =
		guild?.members?.cache?.first() ?? originalInteraction.member;
	const firstUser = firstMember?.user ?? originalInteraction.user;
	// const firstCategoryChannel = // Unused
	// 	guild?.channels?.cache
	// 		?.filter((c) => c.type === ChannelType.GuildCategory)
	// 		?.first() ?? null;

	// Mock attachment with a valid contentType (image/png)
	const mockAttachment = {
		id: '000000000000000000',
		url: 'https://cdn.discordapp.com/attachments/0/0/mock.png',
		proxyURL: 'https://media.discordapp.net/attachments/0/0/mock.png',
		name: 'mock.png',
		filename: 'mock.png',
		contentType: 'image/png',
		size: 1024,
		height: 100,
		width: 100,
		ephemeral: false,
		duration: null,
		waveform: null,
		description: null,
		title: null,
	};

	// Sensible defaults per option type
	const TYPE_DEFAULTS = {
		[ApplicationCommandOptionType.String]: 'test_string',
		[ApplicationCommandOptionType.Integer]: 1,
		[ApplicationCommandOptionType.Number]: 1.0,
		[ApplicationCommandOptionType.Boolean]: true,
		[ApplicationCommandOptionType.User]: firstUser,
		[ApplicationCommandOptionType.Member]: firstMember,
		[ApplicationCommandOptionType.Role]: firstRole,
		[ApplicationCommandOptionType.Channel]: firstChannel,
		[ApplicationCommandOptionType.Mentionable]: firstMember ?? firstRole,
		[ApplicationCommandOptionType.Attachment]: mockAttachment,
	};

	// Smart string defaults based on option name — avoids DB/validation errors
	const STRING_NAME_DEFAULTS = {
		color: '#FFFFFF',
		embed_color: '#FFFFFF',
		embed_colour: '#FFFFFF',
		rarity: 'common',
		status: 'active',
		type: 'text',
		mode: 'default',
		hex: '#FFFFFF',
		url: 'https://example.com',
		image: 'https://example.com/image.png',
		banner: 'https://example.com/banner.png',
		emoji: '😀',
		link: 'https://example.com',
		message: 'Test message',
		reason: 'Testing',
		description: 'Test description',
		code: 'TESTCODE',
	};

	const resolveString = (name) => {
		const key = name?.toLowerCase().replace(/-/g, '_');
		return (
			STRING_NAME_DEFAULTS[key] ??
			TYPE_DEFAULTS[ApplicationCommandOptionType.String]
		);
	};

	const mockOptions = {
		// Subcommands
		getSubcommand: (required = false) => {
			void required;
			return null;
		},
		getSubcommandGroup: (required = false) => {
			void required;
			return null;
		},

		// Typed getters — all follow the same pattern
		getString: (name, required = false) => {
			void required;
			return optionsData[name] ?? resolveString(name);
		},
		getInteger: (name, required = false) => {
			void required;
			return (
				optionsData[name] ?? TYPE_DEFAULTS[ApplicationCommandOptionType.Integer]
			);
		},
		getNumber: (name, required = false) => {
			void required;
			return (
				optionsData[name] ?? TYPE_DEFAULTS[ApplicationCommandOptionType.Number]
			);
		},
		getBoolean: (name, required = false) => {
			void required;
			return (
				optionsData[name] ?? TYPE_DEFAULTS[ApplicationCommandOptionType.Boolean]
			);
		},
		getUser: (name, required = false) => {
			void required;
			return optionsData[name] ?? firstUser;
		},
		getMember: (name, required = false) => {
			void required;
			return optionsData[name] ?? firstMember;
		},
		getRole: (name, required = false) => {
			void required;
			return optionsData[name] ?? firstRole;
		},
		getChannel: (name, required = false) => {
			void required;
			return optionsData[name] ?? firstChannel;
		},
		getMentionable: (name, required = false) => {
			void required;
			return optionsData[name] ?? firstMember ?? firstRole;
		},
		getAttachment: (name, required = false) => {
			void required;
			return optionsData[name] ?? mockAttachment;
		},

		// Focused option (autocomplete)
		getFocused: (full = false) => {
			void full;
			return full
				? {
						name: 'query',
						value: 'test',
						focused: true,
						type: ApplicationCommandOptionType.String,
					}
				: 'test';
		},

		// Generic resolved getter
		get: (name, required = false) => {
			void required;
			return optionsData[name] ?? null;
		},

		// Resolved data (users, members, roles, channels, attachments)
		resolved: {
			users: new Map(),
			members: new Map(),
			roles: new Map(),
			channels: new Map(),
			attachments: new Map([[mockAttachment.id, mockAttachment]]),
			messages: new Map(),
		},

		data: [],
		_group: null,
		_subcommand: null,
		_hoistedOptions: [],
	};

	// ── Interaction object ────────────────────────────────────────────────
	return {
		// ── Identity ──────────────────────────────────────────────────────
		id: '000000000000000000',
		applicationId: originalInteraction.applicationId,
		token: 'mock_token',
		version: 1,
		type: 2, // APPLICATION_COMMAND
		commandType: 1, // CHAT_INPUT
		commandName: commandName,
		commandId: '000000000000000000',
		commandGuildId: guild?.id ?? null,
		appPermissions: originalInteraction.appPermissions ?? null,
		locale: originalInteraction.locale ?? 'en-US',
		guildLocale: originalInteraction.guildLocale ?? 'en-US',
		createdTimestamp: Date.now(),
		deferred: false,
		replied: false,
		ephemeral: null,

		// ── Context ───────────────────────────────────────────────────────
		client: originalInteraction.client,
		guild: guild,
		channel: originalInteraction.channel,
		channelId: originalInteraction.channelId,
		guildId: guild?.id ?? null,
		user: originalInteraction.user,
		member: originalInteraction.member,
		memberPermissions: originalInteraction.memberPermissions ?? null,

		// ── Options ───────────────────────────────────────────────────────
		options: mockOptions,

		// ── Reply methods — all resolve with a MockMessage ────────────────
		deferReply: (options) => {
			void options;
			_deferred = true;
			return _mockMessage;
		},
		reply: (options) => {
			void options;
			_replied = true;
			return _mockMessage;
		},
		editReply: (options) => {
			void options;
			_replied = true;
			return _mockMessage;
		},
		followUp: (options) => {
			void options;
			return _mockMessage;
		},
		deleteReply: () => {},
		fetchReply: () => _mockMessage,
		deferUpdate: () => {},
		update: async () => _mockMessage,
		showModal: async () => {},

		// ── Utility ───────────────────────────────────────────────────────
		isCommand: () => true,
		isChatInputCommand: () => true,
		isContextMenuCommand: () => false,
		isUserContextMenuCommand: () => false,
		isMessageContextMenuCommand: () => false,
		isAutocomplete: () => false,
		isButton: () => false,
		isSelectMenu: () => false,
		isStringSelectMenu: () => false,
		isModalSubmit: () => false,
		isRepliable: () => true,
		inGuild: () => !!guild,
		inCachedGuild: () => !!guild,
		toString: () => `[MockInteraction: ${commandName}]`,

		// ── Internal helpers (testall introspection) ──────────────────────
		_hasReplied: () => _replied,
		_isDeferred: () => _deferred,
	};
}

// ─── Command export ───────────────────────────────────────────────────────────
/**
 * Creates a mock interaction that forwards replies to the real channel.
 * Pass `realChannel` so that every reply/editReply/followUp the tested command
 * sends will appear in Discord as a real message.
 */
function createForwardingMockInteraction(
	originalInteraction,
	commandName,
	optionsData,
) {
	const realChannel = originalInteraction.channel;
	const mockBase = createMockInteraction(
		originalInteraction,
		commandName,
		optionsData,
	);

	// The collector on interaction.channel (some commands call this directly)
	const collectorEvents = {};
	const mockCollector = {
		on(event, fn) {
			collectorEvents[event] = fn;
			return mockCollector;
		},
		off: () => mockCollector,
		once: () => mockCollector,
		stop: () => {},
		resetTimer: () => {},
	};

	let _replied = false;
	let _deferred = false;

	// Forward any reply payload to the real channel so the user sees it
	const forward = async (payload) => {
		if (!payload) return createMockMessage(realChannel);
		try {
			// Strip ephemeral flag for forwarding so it actually shows
			const sent =
				payload.flags !== undefined
					? await realChannel.send({ ...payload, flags: payload.flags & ~64 })
					: await realChannel.send(payload);
			// Attach collector stubs onto real message
			return sent;
		} catch (_e) {
			return createMockMessage(realChannel);
		}
	};

	return {
		...mockBase,
		// Expose a real channel reference (used by eco give etc.)
		channel: {
			...realChannel,
			createMessageComponentCollector: (_opts) => mockCollector,
			createReactionCollector: (_opts) => mockCollector,
		},
		deferReply: (options) => {
			void options;
			_deferred = true;
			return createMockMessage(realChannel);
		},
		reply: (payload) => {
			_replied = true;
			return forward(payload);
		},
		editReply: (payload) => {
			_replied = true;
			return forward(payload);
		},
		followUp: (payload) => {
			return forward(payload);
		},
		_hasReplied: () => _replied,
		_isDeferred: () => _deferred,
	};
}
module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('testall')
		.setDescription(
			'🛠️ Developer Tool: Test all registered commands (DRY RUN-ish).',
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	ownerOnly: true,
	mainGuildOnly: true,
	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { logger } = container;

		// Acknowledge immediately so the interaction token stays alive
		await interaction.deferReply({ ephemeral: true });

		const results = {
			success: [],
			failed: [],
			skipped: [],
		};

		const commands = interaction.client.commands;
		if (!commands || commands.size === 0) {
			return interaction.editReply('❌ No commands found to test.');
		}

		const totalCommands = commands.size;
		let processed = 0;

		await interaction.editReply(
			`🔄 Starting test of ${totalCommands} commands...`,
		);

		// ── Iterate and mock-execute every command ─────────────────────────────
		for (const [name, command] of commands) {
			processed++;

			// SKIP checks
			if (BLACKLIST_COMMANDS.includes(name)) {
				results.skipped.push(name);
				continue;
			}
			if (!command.execute) {
				results.skipped.push(`${name} (no execute)`);
				continue;
			}

			// Build option data from the slash command builder definition
			const optionsData = {};
			const slashBuilder = command.slashCommand;

			if (slashBuilder?.options) {
				for (const opt of slashBuilder.options) {
					const optName = opt.name;
					const optType = opt.type;

					// Resolve a sensible guild-aware value for each option type
					const guild = interaction.guild;

					if (optType === ApplicationCommandOptionType.Role) {
						optionsData[optName] =
							guild?.roles?.cache
								?.filter((r) => !r.managed && r.id !== guild.id)
								?.random() ??
							guild?.roles?.cache?.first() ??
							null;
					} else if (optType === ApplicationCommandOptionType.User) {
						const member = guild?.members?.cache?.random();
						optionsData[optName] = member?.user ?? interaction.user;
					} else if (optType === ApplicationCommandOptionType.Member) {
						optionsData[optName] =
							guild?.members?.cache?.random() ?? interaction.member;
					} else if (optType === ApplicationCommandOptionType.Channel) {
						// Respect channelTypes restriction from the slash builder option
						const allowedTypes = opt.channel_types ?? opt.channelTypes ?? [];
						const wantsCategory = allowedTypes.includes(
							ChannelType.GuildCategory,
						);
						if (wantsCategory) {
							optionsData[optName] =
								guild?.channels?.cache
									?.filter((c) => c.type === ChannelType.GuildCategory)
									?.first() ?? null;
						} else if (allowedTypes.length > 0) {
							optionsData[optName] =
								guild?.channels?.cache
									?.filter((c) => allowedTypes.includes(c.type))
									?.random() ?? interaction.channel;
						} else {
							optionsData[optName] =
								guild?.channels?.cache
									?.filter((c) => c.type === ChannelType.GuildText)
									?.random() ?? interaction.channel;
						}
					} else if (optType === ApplicationCommandOptionType.Mentionable) {
						optionsData[optName] =
							guild?.members?.cache?.random() ??
							guild?.roles?.cache?.first() ??
							interaction.member;
					}
					// All other types fall back to the TYPE_DEFAULTS inside createMockInteraction
				}
			}

			// Execute with mock interaction
			try {
				const mock = createForwardingMockInteraction(
					interaction,
					name,
					optionsData,
				);
				logger.info(`🧪 Testing command: ${name}`);

				await command.execute(mock, container);

				if (mock._hasReplied() || mock._isDeferred()) {
					results.success.push(name);
				} else {
					results.failed.push({ name, reason: 'no reply' });
				}
			} catch (err) {
				logger.error(`❌ Test failed for ${name}:`, err);
				results.failed.push({ name, reason: err.message });
			}

			// Small delay to prevent rate limits
			await new Promise((r) => setTimeout(r, 100));
		}

		// ── Build a beautiful Components V2 report ────────────────────────────
		const { helpers, kythiaConfig: cfg } = container;
		const { convertColor } = helpers.color;
		const accentColor = convertColor(cfg.bot.color, {
			from: 'hex',
			to: 'decimal',
		});

		// Chunk long lists into segments that each fit in one TextDisplay (~1800 chars)
		const chunk = (arr) => {
			if (arr.length === 0) return [`*None*`];
			const lines = [];
			let current = '';
			for (const item of arr) {
				const next = current ? `${current}, ${item}` : item;
				if (next.length > 1800) {
					lines.push(current);
					current = item;
				} else current = next;
			}
			if (current) lines.push(current);
			return lines;
		};

		// Helper: send a ContainerBuilder and swallow errors
		const sendContainer = async (container) => {
			try {
				await interaction.channel.send({
					components: [container],
					flags: MessageFlags.IsComponentsV2,
				});
			} catch (err) {
				logger.error('❌ testall: failed to send report chunk:', err);
			}
		};

		const successRate =
			totalCommands > 0
				? Math.round(
						(results.success.length /
							(results.success.length + results.failed.length || 1)) *
							100,
					)
				: 100;
		const statusLine =
			results.failed.length === 0
				? '✅ **All commands passed!**'
				: `⚠️ **${results.failed.length} command(s) need attention**`;

		// ── Message 1: Header ─────────────────────────────────────────────────
		const headerContainer = new ContainerBuilder().setAccentColor(accentColor);
		headerContainer.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`## 🧪 Command Test Results\n${statusLine}\n-# Tested **${processed}/${totalCommands}** commands · Pass rate **${successRate}%** · <t:${Math.floor(Date.now() / 1000)}:R>`,
			),
		);
		await sendContainer(headerContainer);

		// ── Message 2: Success section ────────────────────────────────────────
		const successContainer = new ContainerBuilder().setAccentColor(accentColor);
		successContainer.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`### ✅ Passed (${results.success.length})`,
			),
		);
		for (const line of chunk(results.success)) {
			successContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`\`\`\`${line}\`\`\``),
			);
		}
		await sendContainer(successContainer);

		// ── Message 3: Failures section ───────────────────────────────────────
		if (results.failed.length > 0) {
			// Render each failure as its own line: `name` — truncated reason
			// Cap reason at 120 chars so nothing wraps out of control
			const MAX_REASON = 120;
			const failedLines = results.failed.map(({ name: n, reason }) => {
				const short =
					reason.length > MAX_REASON
						? `${reason.slice(0, MAX_REASON)}…`
						: reason;
				return `\`${n}\` — ${short}`;
			});

			// Split into containers of ≤1800 chars each
			const failedChunks = [];
			let buf = '';
			for (const line of failedLines) {
				const next = buf ? `${buf}\n${line}` : line;
				if (next.length > 1800) {
					failedChunks.push(buf);
					buf = line;
				} else buf = next;
			}
			if (buf) failedChunks.push(buf);

			const failedContainer = new ContainerBuilder().setAccentColor(
				accentColor,
			);
			failedContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`### ❌ Failed (${results.failed.length})`,
				),
			);
			for (const chunk of failedChunks) {
				failedContainer.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(chunk),
				);
			}
			await sendContainer(failedContainer);
		}

		// ── Message 4: Skipped section ────────────────────────────────────────
		if (results.skipped.length > 0) {
			const skippedContainer = new ContainerBuilder().setAccentColor(
				accentColor,
			);
			skippedContainer.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`### ⏭️ Skipped (${results.skipped.length})\n-# ${results.skipped.join(', ')}`,
				),
			);
			await sendContainer(skippedContainer);
		}

		// ── Message 5: Footer ─────────────────────────────────────────────────
		const footerContainer = new ContainerBuilder().setAccentColor(accentColor);
		footerContainer.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`-# 🛠️ ${interaction.client.user.username} · Developer Dry-Run`,
			),
		);
		await sendContainer(footerContainer);

		await interaction
			.editReply({ content: '✅ Done! Results posted above.' })
			.catch((err) => logger.warn('testall editReply failed:', err.message));
	},
};
