/**
 * @namespace: addons/core/commands/tools/testall.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa & gemini
 * @version 1.8.0-smart-data
 */

const {
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	MessageFlags,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
} = require('discord.js');
const { utils } = require('kythia-core');

const RESULTS_PER_PAGE = 8; // Multi-line entries enabled

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('testall')
		.setDescription('🛠️ Developer Tool: Mock and test ALL registered commands.')
		.addBooleanOption((option) =>
			option
				.setName('verbose')
				.setDescription('Show detailed logs for each command')
				.setRequired(false),
		)
		.addBooleanOption((option) =>
			option
				.setName('stop_on_error')
				.setDescription('Stop testing if a command throws an error')
				.setRequired(false),
		)
		.addStringOption((option) =>
			option
				.setName('exclude')
				.setDescription(
					'Comma-separated list of commands to skip (e.g. "ban, kick")',
				)
				.setRequired(false),
		),
	ownerOnly: true,
	mainGuildOnly: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { helpers, logger } = container;
		const { convertColor } = helpers.color;

		await interaction.deferReply();

		const verbose = interaction.options.getBoolean('verbose') || false;
		const stopOnError =
			interaction.options.getBoolean('stop_on_error') || false;
		const excludeInput = interaction.options.getString('exclude') || '';

		const commands = interaction.client.commands;

		// Define Default Exclusions (Critical commands that stop the bot or the test)
		const ALWAYS_EXCLUDED = ['testall', 'restart', 'shutdown'];

		// Parse User Exclusions
		const userExclusions = excludeInput
			.split(',')
			.map((s) => s.trim().toLowerCase())
			.filter((s) => s.length > 0);
		const allExclusions = new Set([...ALWAYS_EXCLUDED, ...userExclusions]);

		const results = {
			total: 0,
			success: 0,
			failed: 0,
			skipped: 0,
			executionTimes: [],
			details: [],
		};

		// --- 1. Helper: Mock Argument Generator ---
		const generateMockArgs = (rawSchema) => {
			// Ensure we work with Cloned JSON data to avoid Builder quirks
			const schema =
				rawSchema && typeof rawSchema.toJSON === 'function'
					? rawSchema.toJSON()
					: rawSchema;

			if (!schema || !schema.options) return '';

			const args = [];
			// Filter options to only include valid types (non-subcommand)
			const options = schema.options.filter((opt) => opt.type > 2);

			for (const opt of options) {
				// Determine if we should include this option
				// Always include required options.
				// For optional ones, keep 50% chance
				if (!opt.required && Math.random() > 0.5) continue;

				const name = opt.name.toLowerCase();
				let val = '';

				switch (opt.type) {
					case 3: // STRING
						if (opt.choices && opt.choices.length > 0) {
							val = opt.choices[0].value;
						} else {
							// Smart Inference based on Option Name
							if (
								name.includes('id') ||
								name.includes('user') ||
								name.includes('target')
							)
								val = interaction.user.id;
							else if (name.includes('channel')) val = interaction.channel.id;
							else if (name.includes('role'))
								val = interaction.guild.roles.cache.first()?.id || '123';
							else if (name.includes('url') || name.includes('link'))
								val = interaction.user.displayAvatarURL();
							else if (name.includes('color')) val = '#FFFFFF';
							else if (name.includes('reason'))
								val = 'Automated Test Execution';
							else if (name.includes('name'))
								val = `Test-${Date.now().toString().slice(-4)}`;
							else val = 'test_string';

							// Respect Min/Max Length
							if (opt.min_length && val.length < opt.min_length)
								val = val.padEnd(opt.min_length, '_');
							if (opt.max_length && val.length > opt.max_length)
								val = val.substring(0, opt.max_length);
						}
						break;
					case 4: // INTEGER
					case 10: // NUMBER
						if (opt.choices && opt.choices.length > 0) {
							val = opt.choices[0].value.toString();
						} else {
							// Smart Number Inference
							let num = 10;
							if (name.includes('amount') || name.includes('count')) num = 50;
							if (name.includes('age') || name.includes('level')) num = 5;
							if (name.includes('duration')) num = 60;

							// Respect Constraints
							if (opt.min_value !== undefined)
								num = Math.max(num, opt.min_value);
							if (opt.max_value !== undefined)
								num = Math.min(num, opt.max_value);

							val = num.toString();
						}
						break;
					case 5: // BOOLEAN
						val = 'true';
						break;
					case 6: // USER
						// Always use the real executor's ID for safety and validity
						val = interaction.user.id;
						break;
					case 7: // CHANNEL
						// Smart Channel Selection
						if (name.includes('category') || name.includes('parent')) {
							const category = interaction.guild.channels.cache.find(
								(c) => c.type === 4,
							); // 4 = Category
							val = category ? category.id : interaction.channel.id;
						} else {
							// Try to match specific channel types if defined
							if (opt.channel_types && opt.channel_types.length > 0) {
								const matched = interaction.guild.channels.cache.find((c) =>
									opt.channel_types.includes(c.type),
								);
								val = matched ? matched.id : interaction.channel.id;
							} else {
								val = interaction.channel.id;
							}
						}
						break;
					case 8: // ROLE
						// Try to find a role that ISN'T @everyone to be safe
						val =
							interaction.guild.roles.cache
								.filter((r) => r.name !== '@everyone')
								.first()?.id || interaction.guild.id;
						break;
					case 9: // MENTIONABLE
						val = interaction.user.id;
						break;
					case 11: // ATTACHMENT
						// Handled in mock interaction customization
						break;
					default:
						val = '123';
				}
				if (val) args.push(`${opt.name}:${val}`);
			}
			return args.join(' ');
		};

		// --- 2. Helper: UI Report Generator ---
		const generateReport = (page) => {
			const totalPages = Math.max(
				1,
				Math.ceil(results.details.length / RESULTS_PER_PAGE),
			);
			const safePage = Math.max(1, Math.min(page, totalPages));
			const start = (safePage - 1) * RESULTS_PER_PAGE;
			const pageData = results.details.slice(start, start + RESULTS_PER_PAGE);

			const statusEmoji =
				results.failed > 0 ? '`⚠️` Issues Found' : '`✅` Stable';
			const accent = results.failed > 0 ? '#ED4245' : '#57F287';

			const avgTime =
				results.executionTimes.length > 0
					? (
							results.executionTimes.reduce((a, b) => a + b, 0) /
							results.executionTimes.length
						).toFixed(1)
					: 0;

			const containerUI = new ContainerBuilder()
				.setAccentColor(convertColor(accent, { from: 'hex', to: 'decimal' }))
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`## 🛠️ Command Integrity Report\n` +
							`**Status**: ${statusEmoji}\n` +
							`**Stats**: \`🟢\` ${results.success} Pass | \`🔴\` ${results.failed} Fail | \`⚪\` ${results.skipped} Skip\n` +
							`**Performance**: \`⏱️\` Avg ${avgTime}ms / command`,
					),
				)
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						pageData.join('\n') || '*Testing in progress...*',
					),
				)
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`Page ${safePage} of ${totalPages}`,
					),
				)
				.addActionRowComponents(
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId('prev')
							.setLabel('⬅️')
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(safePage === 1),
						new ButtonBuilder()
							.setCustomId('next')
							.setLabel('➡️')
							.setStyle(ButtonStyle.Secondary)
							.setDisabled(safePage === totalPages),
						new ButtonBuilder()
							.setCustomId('refresh')
							.setLabel('🔄 Refresh')
							.setStyle(ButtonStyle.Primary),
					),
				);

			return { components: [containerUI], page: safePage };
		};

		// --- 3. Filtering Target Commands ---
		const targetKeys = Array.from(commands.keys()).filter(
			(key) => !allExclusions.has(key),
		);
		results.total = targetKeys.length;

		// Visual feedback for excluded commands
		const skippedMsg =
			userExclusions.length > 0
				? `\n🚫 **User Excluded**: \`${userExclusions.join(', ')}\``
				: '';
		const systemSkippedMsg = `\n🔒 **System Protected**: \`${ALWAYS_EXCLUDED.join(', ')}\``;

		await interaction.editReply({
			content: `🚀 Starting detailed test for **${results.total}** command entities...${skippedMsg}${systemSkippedMsg}`,
		});

		// --- 4. Main Loop ---
		for (const key of targetKeys) {
			const module = commands.get(key);
			if (!module || typeof module.execute !== 'function') {
				results.skipped++;
				continue;
			}
			let schema = module.data || module.slashCommand;
			const argsString = generateMockArgs(schema);

			try {
				// Determine Schema for Arg Mocking
				// CRITICAL FIX: Handle Builder Functions for Subcommands
				// If module.slashCommand is a function, we MUST call it with a builder to get options

				if (typeof schema === 'function') {
					const builder = new SlashCommandSubcommandBuilder();
					schema = schema(builder);
				}
				// Fallback empty object if schema is still missing
				if (!schema) schema = {};

				// Mock Interaction Environment
				const mockMessage = {
					client: interaction.client,
					guild: interaction.guild,
					channel: interaction.channel,
					author: interaction.user,
					member: interaction.member,
					content: `/${key} ${argsString}`,
					createdTimestamp: Date.now(),
					attachments: new Map(),
					mentions: { users: new Map(), roles: new Map(), everyone: false },
				};

				const fakeInteraction = utils.InteractionFactory.create(
					mockMessage,
					key,
					argsString,
				);

				// Ensure Attachment Mock is present if needed
				if (schema.options?.some((o) => o.type === 11)) {
					fakeInteraction.options.getAttachment = () => ({
						id: 'mock_att_id',
						url: 'https://mock.com/img.png',
						contentType: 'image/png',
						name: 'mock.png',
					});
				}

				// --- HIJACK REPLIES ---
				const proxy = async (payload) => {
					const prefix =
						`> 🧪 **Test:** \`/${key}\`\n` +
						`> 📝 **Args:** \`${argsString || 'None'}\`\n` +
						`> 👇 **Output:**\n`;

					let finalPayload = {};

					if (typeof payload === 'string') {
						finalPayload = { content: prefix + payload };
					} else {
						finalPayload = { ...payload };

						// Handle Components V2
						if (finalPayload.flags & MessageFlags.IsComponentsV2) {
							if (!finalPayload.components) finalPayload.components = [];
							finalPayload.components.unshift(
								new TextDisplayBuilder().setContent(prefix),
							);
							delete finalPayload.content; // Strict V2 rule
						} else {
							// Legacy Content
							if (finalPayload.content)
								finalPayload.content = prefix + finalPayload.content;
							else finalPayload.content = prefix;
						}
					}

					try {
						return await interaction.followUp(finalPayload);
					} catch (e) {
						logger.warn(`Test Proxy Err: ${e.message}`);
						// Swallow error to keep test running
						return {
							createMessageComponentCollector: () => ({
								on: () => {},
								stop: () => {},
							}),
							delete: async () => {},
							edit: async () => {},
						};
					}
				};

				fakeInteraction.reply = proxy;
				fakeInteraction.editReply = proxy;
				fakeInteraction.followUp = proxy;
				fakeInteraction.deferReply = async () => {}; // Absorbed

				// Execution
				const start = Date.now();
				await module.execute(fakeInteraction, container);
				const duration = Date.now() - start;

				results.success++;
				results.executionTimes.push(duration);
				// Detailed Success Entry
				results.details.push(
					`\`🟢\` **/${key}** • \`⏱️\` ${duration}ms\n` +
						`   └ 📥 \`${argsString || 'No Args'}\``,
				);
			} catch (err) {
				results.failed++;
				const errMsg =
					err.message.length > 80
						? `${err.message.substring(0, 80)}...`
						: err.message;
				// Detailed Failure Entry
				results.details.push(
					`\`🔴\` **/${key}**\n` +
						`   ├ \`⚠️\` *${errMsg}*\n` +
						`   └ \`📥\` \`${argsString || 'No Args'}\``,
				);
				// Reduce log noise by guarding logging
				if (verbose) logger.error(`[TestAll] Failed /${key}:`, err);

				if (stopOnError) break;
			}

			// Spacing out to avoid rate limits
			await new Promise((r) => setTimeout(r, 2000));
		}

		// --- 5. Final Reporting ---
		let currentPage = 1;
		const finalReport = generateReport(currentPage);
		const reportMsg = await interaction.followUp({
			...finalReport,
			flags: MessageFlags.IsComponentsV2,
			fetchReply: true,
		});

		const collector = reportMsg.createMessageComponentCollector({
			time: 600000,
		});
		collector.on('collect', async (i) => {
			if (i.user.id !== interaction.user.id)
				return i.reply({ content: 'Not for you', ephemeral: true });

			if (i.customId === 'prev') currentPage--;
			if (i.customId === 'next') currentPage++;
			if (i.customId === 'refresh') {
				/* Just update view */
			}

			const updated = generateReport(currentPage);
			await i.update({ ...updated, flags: MessageFlags.IsComponentsV2 });
		});
	},
};
