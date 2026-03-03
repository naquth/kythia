/**
 * @namespace: addons/welcomer/commands/welcomer.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 1.0.0
 */

const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	InteractionContextType,
	MessageFlags,
} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('welcomer')
		.setDescription('👋 Configure the welcome & farewell system')
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

		// ── Welcome In ──────────────────────────────────────────────
		.addSubcommand((sub) =>
			sub
				.setName('in-channel')
				.setDescription('👋 Set the welcome channel')
				.addChannelOption((opt) =>
					opt
						.setName('channel')
						.setDescription('Channel where welcome messages are sent')
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('out-channel')
				.setDescription('👋 Set the farewell channel')
				.addChannelOption((opt) =>
					opt
						.setName('channel')
						.setDescription('Channel where farewell messages are sent')
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('role')
				.setDescription('👋 Set auto-role given to new members on join')
				.addRoleOption((opt) =>
					opt
						.setName('role')
						.setDescription('Role to assign on join')
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('in-text')
				.setDescription('👋 Set welcome message text (supports placeholders)')
				.addStringOption((opt) =>
					opt
						.setName('text')
						.setDescription(
							'Welcome text. Placeholders: {username}, {guildName}, {memberCount}, etc.',
						)
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('out-text')
				.setDescription('👋 Set farewell message text (supports placeholders)')
				.addStringOption((opt) =>
					opt
						.setName('text')
						.setDescription(
							'Farewell text. Placeholders: {username}, {guildName}, etc.',
						)
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('in-background')
				.setDescription('👋 Set welcome banner background URL')
				.addStringOption((opt) =>
					opt
						.setName('url')
						.setDescription(
							'Direct URL to the background image (must start with http)',
						)
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('out-background')
				.setDescription('👋 Set farewell banner background URL')
				.addStringOption((opt) =>
					opt
						.setName('url')
						.setDescription(
							'Direct URL to the background image (must start with http)',
						)
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('in-style')
				.setDescription(
					'👋 Set welcome message style (banner card or plain text)',
				)
				.addStringOption((opt) =>
					opt
						.setName('style')
						.setDescription('Choose the message style')
						.setRequired(true)
						.addChoices(
							{
								name: '🖼️ Components V2 card (default)',
								value: 'components-v2',
							},
							{ name: '💬 Plain text only', value: 'plain-text' },
						),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('out-style')
				.setDescription(
					'👋 Set farewell message style (banner card or plain text)',
				)
				.addStringOption((opt) =>
					opt
						.setName('style')
						.setDescription('Choose the message style')
						.setRequired(true)
						.addChoices(
							{
								name: '🖼️ Components V2 card (default)',
								value: 'components-v2',
							},
							{ name: '💬 Plain text only', value: 'plain-text' },
						),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('dm-text')
				.setDescription('✉️ Set DM message sent to new members on join')
				.addStringOption((opt) =>
					opt
						.setName('text')
						.setDescription(
							'DM text. Supports placeholders like {username}, {guildName}.',
						)
						.setRequired(true),
				),
		),
	permissions: [PermissionFlagsBits.ManageGuild],
	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { models, helpers } = container;
		const { WelcomeSetting } = models;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply({ ephemeral: true });

		const serverSetting = await WelcomeSetting.getOrCreateCache({
			guildId: interaction.guild.id,
		});

		const sub = interaction.options.getSubcommand();
		let components;

		switch (sub) {
			case 'in-channel': {
				const ch = interaction.options.getChannel('channel');
				serverSetting.welcomeInChannelId = ch.id;
				await serverSetting.saveAndUpdateCache('guildId');
				components = await simpleContainer(
					interaction,
					`✅ Welcome channel set to <#${ch.id}>`,
					{ color: 'Green' },
				);
				break;
			}
			case 'out-channel': {
				const ch = interaction.options.getChannel('channel');
				serverSetting.welcomeOutChannelId = ch.id;
				await serverSetting.saveAndUpdateCache('guildId');
				components = await simpleContainer(
					interaction,
					`✅ Farewell channel set to <#${ch.id}>`,
					{ color: 'Green' },
				);
				break;
			}
			case 'role': {
				const role = interaction.options.getRole('role');
				serverSetting.welcomeRoleId = role.id;
				await serverSetting.saveAndUpdateCache('guildId');
				components = await simpleContainer(
					interaction,
					`✅ Welcome role set to <@&${role.id}>`,
					{ color: 'Green' },
				);
				break;
			}
			case 'in-text': {
				const text = interaction.options.getString('text');
				serverSetting.welcomeInEmbedText = text;
				await serverSetting.saveAndUpdateCache('guildId');
				components = await simpleContainer(
					interaction,
					`✅ Welcome text set to:\n> ${text}`,
					{ color: 'Green' },
				);
				break;
			}
			case 'out-text': {
				const text = interaction.options.getString('text');
				serverSetting.welcomeOutEmbedText = text;
				await serverSetting.saveAndUpdateCache('guildId');
				components = await simpleContainer(
					interaction,
					`✅ Farewell text set to:\n> ${text}`,
					{ color: 'Green' },
				);
				break;
			}
			case 'in-background': {
				const url = interaction.options.getString('url');
				if (!url.startsWith('http')) {
					components = await simpleContainer(
						interaction,
						'❌ Background URL must start with `http`.',
						{ color: 'Red' },
					);
					break;
				}
				serverSetting.welcomeInBackgroundUrl = url;
				await serverSetting.saveAndUpdateCache('guildId');
				components = await simpleContainer(
					interaction,
					`✅ Welcome background set to:\n${url}`,
					{ color: 'Green' },
				);
				break;
			}
			case 'out-background': {
				const url = interaction.options.getString('url');
				if (!url.startsWith('http')) {
					components = await simpleContainer(
						interaction,
						'❌ Background URL must start with `http`.',
						{ color: 'Red' },
					);
					break;
				}
				serverSetting.welcomeOutBackgroundUrl = url;
				await serverSetting.saveAndUpdateCache('guildId');
				components = await simpleContainer(
					interaction,
					`✅ Farewell background set to:\n${url}`,
					{ color: 'Green' },
				);
				break;
			}
			case 'in-style': {
				const style = interaction.options.getString('style');
				// null = CV2 card (default); { style: 'plain-text' } = plain text only
				serverSetting.welcomeInLayout =
					style === 'plain-text' ? { style: 'plain-text' } : null;
				await serverSetting.saveAndUpdateCache('guildId');
				const styleLabel =
					style === 'components-v2'
						? '🖼️ Components V2 card'
						: '💬 Plain text only';
				components = await simpleContainer(
					interaction,
					`✅ Welcome message style set to **${styleLabel}**.`,
					{ color: 'Green' },
				);
				break;
			}
			case 'out-style': {
				const style = interaction.options.getString('style');
				// null = CV2 card (default); { style: 'plain-text' } = plain text only
				serverSetting.welcomeOutLayout =
					style === 'plain-text' ? { style: 'plain-text' } : null;
				await serverSetting.saveAndUpdateCache('guildId');
				const styleLabel =
					style === 'components-v2'
						? '🖼️ Components V2 card'
						: '💬 Plain text only';
				components = await simpleContainer(
					interaction,
					`✅ Farewell message style set to **${styleLabel}**.`,
					{ color: 'Green' },
				);
				break;
			}
			case 'dm-text': {
				const text = interaction.options.getString('text');
				serverSetting.welcomeDmText = text;
				await serverSetting.saveAndUpdateCache('guildId');
				components = await simpleContainer(
					interaction,
					`✉️ Welcome DM text set to:\n> ${text}`,
					{ color: 'Green' },
				);
				break;
			}
			default:
				components = await simpleContainer(
					interaction,
					'❓ Unknown subcommand.',
					{
						color: 'Red',
					},
				);
		}

		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
