/**
 * @namespace: addons/core/commands/utils/presence.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	ActivityType,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
	PresenceUpdateStatus,
	InteractionContextType,
} = require('discord.js');

const STATUS_OPTIONS = Object.entries(PresenceUpdateStatus)
	.filter(([_k, v]) => typeof v === 'string')
	.map(([k, _v]) => ({ name: k, value: k }));

const ACTIVITY_TYPE_OPTIONS = Object.entries(ActivityType)
	.filter(([_k, v]) => typeof v === 'number')
	.map(([k, _v]) => ({ name: k, value: k }));

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('presence')
		.setDescription('🔄 Manage bot client user settings')
		.addSubcommand((sub) =>
			sub
				.setName('set')
				.setDescription('🔄 Set bot presence (status + activity)')
				.addStringOption((opt) =>
					opt
						.setName('status')
						.setDescription('Bot status')
						.setRequired(true)
						.addChoices(...STATUS_OPTIONS),
				)
				.addStringOption((opt) =>
					opt
						.setName('type')
						.setDescription('Activity type')
						.setRequired(true)
						.addChoices(...ACTIVITY_TYPE_OPTIONS),
				)
				.addStringOption((opt) =>
					opt
						.setName('activity')
						.setDescription('Activity name')
						.setRequired(true),
				)
				.addStringOption((opt) =>
					opt
						.setName('url')
						.setDescription(
							'Streaming URL (Twitch/YouTube, required for streaming)',
						)
						.setRequired(false),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('status')
				.setDescription('📊 Set bot status only')
				.addStringOption((opt) =>
					opt
						.setName('status')
						.setDescription('Bot status')
						.setRequired(true)
						.addChoices(...STATUS_OPTIONS),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('activity')
				.setDescription('🎮 Set bot activity only')
				.addStringOption((opt) =>
					opt
						.setName('type')
						.setDescription('Activity type')
						.setRequired(true)
						.addChoices(...ACTIVITY_TYPE_OPTIONS),
				)
				.addStringOption((opt) =>
					opt.setName('name').setDescription('Activity name').setRequired(true),
				)
				.addStringOption((opt) =>
					opt
						.setName('url')
						.setDescription('Streaming URL (Twitch/YouTube)')
						.setRequired(false),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('afk')
				.setDescription('😴 Set bot AFK status')
				.addBooleanOption((opt) =>
					opt
						.setName('afk')
						.setDescription('Whether to set as AFK')
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('username')
				.setDescription('👤 Change bot username')
				.addStringOption((opt) =>
					opt
						.setName('username')
						.setDescription('New username (2-32 characters)')
						.setRequired(true)
						.setMinLength(2)
						.setMaxLength(32),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('avatar')
				.setDescription('🖼️ Change bot avatar')
				.addAttachmentOption((opt) =>
					opt
						.setName('image')
						.setDescription('New avatar image')
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('banner')
				.setDescription('🎨 Change bot banner')
				.addAttachmentOption((opt) =>
					opt
						.setName('image')
						.setDescription('New banner image')
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('bio')
				.setDescription('📝 Change bot bio/about me')
				.addStringOption((opt) =>
					opt
						.setName('bio')
						.setDescription('New bio text (max 190 characters)')
						.setRequired(true)
						.setMaxLength(190),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setContexts(InteractionContextType.Guild),
	ownerOnly: true,
	mainGuildOnly: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, helpers, logger } = container;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply();

		const subcommand = interaction.options.getSubcommand();

		try {
			switch (subcommand) {
				case 'set': {
					const status = interaction.options.getString('status');
					const type = interaction.options.getString('type');
					const activityName = interaction.options.getString('activity');
					const url = interaction.options.getString('url');

					const activityPayload = {
						name: activityName,
						type: ActivityType[type],
					};

					if (activityPayload.type === ActivityType.Streaming) {
						if (
							!url ||
							(!url.startsWith('https://www.twitch.tv/') &&
								!url.startsWith('https://www.youtube.com/'))
						) {
							const components = await simpleContainer(
								interaction,
								await t(interaction, 'core.utils.presence.invalid.url'),
								{ color: 'Red' },
							);
							return interaction.editReply({
								components,
								flags: MessageFlags.IsComponentsV2,
							});
						}
						activityPayload.url = url;
					}

					await interaction.client.user.setPresence({
						activities: [activityPayload],
						status: status,
					});

					const components = await simpleContainer(
						interaction,
						`✅ Presence updated!\n**Status:** ${status}\n**Activity:** ${activityName} (${type})`,
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}

				case 'status': {
					const status = interaction.options.getString('status');
					await interaction.client.user.setStatus(status);

					const components = await simpleContainer(
						interaction,
						`✅ Status set to **${status}**`,
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}

				case 'activity': {
					const type = interaction.options.getString('type');
					const activityName = interaction.options.getString('name');
					const url = interaction.options.getString('url');

					const activityPayload = {
						name: activityName,
						type: ActivityType[type],
					};

					if (activityPayload.type === ActivityType.Streaming && url) {
						activityPayload.url = url;
					}

					await interaction.client.user.setActivity(activityPayload);

					const components = await simpleContainer(
						interaction,
						`✅ Activity set to **${activityName}** (${type})`,
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}

				case 'afk': {
					const afk = interaction.options.getBoolean('afk');
					await interaction.client.user.setAFK(afk);

					const components = await simpleContainer(
						interaction,
						`✅ AFK status set to **${afk ? 'enabled' : 'disabled'}**`,
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}

				case 'username': {
					const username = interaction.options.getString('username');
					const oldUsername = interaction.client.user.username;

					await interaction.client.user.setUsername(username);

					const components = await simpleContainer(
						interaction,
						`✅ Username changed!\n**Old:** ${oldUsername}\n**New:** ${username}`,
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}

				case 'avatar': {
					const attachment = interaction.options.getAttachment('image');

					if (!attachment.contentType?.startsWith('image/')) {
						const components = await simpleContainer(
							interaction,
							'❌ Please provide a valid image file!',
							{ color: 'Red' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}

					await interaction.client.user.setAvatar(attachment.url);

					const components = await simpleContainer(
						interaction,
						'✅ Avatar updated successfully!',
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}

				case 'banner': {
					const attachment = interaction.options.getAttachment('image');

					if (!attachment.contentType?.startsWith('image/')) {
						const components = await simpleContainer(
							interaction,
							'❌ Please provide a valid image file!',
							{ color: 'Red' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}

					await interaction.client.user.setBanner(attachment.url);

					const components = await simpleContainer(
						interaction,
						'✅ Banner updated successfully!',
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}

				case 'bio': {
					const bio = interaction.options.getString('bio');

					await interaction.client.user.edit({ bio });

					const components = await simpleContainer(
						interaction,
						`✅ Bio updated!\n**New bio:** ${bio}`,
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}

				default: {
					const components = await simpleContainer(
						interaction,
						'❌ Unknown subcommand!',
						{ color: 'Red' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
			}
		} catch (error) {
			logger.error('Error setting presence:', error, {
				label: 'core:utils:presence',
			});
			const components = await simpleContainer(
				interaction,
				`❌ Error: ${error.message}`,
				{ color: 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
