/**
 * @namespace: addons/core/commands/moderation/warn.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const { PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
	slashCommand: (subcommand) =>
		subcommand
			.setName('warn')
			.setDescription('⚠️ Warns a user.')
			.addUserOption((option) =>
				option
					.setName('user')
					.setDescription('The user to warn')
					.setRequired(true),
			)
			.addStringOption((option) =>
				option
					.setName('reason')
					.setDescription('Reason for the warning')
					.setRequired(false),
			),
	permissions: PermissionFlagsBits.ModerateMembers,
	botPermissions: PermissionFlagsBits.ModerateMembers,
	async execute(interaction, container) {
		const { t, helpers, models, kythiaConfig } = container;
		const { createContainer, simpleContainer, getTextChannelSafe } =
			helpers.discord;
		const { User } = models;

		await interaction.deferReply({ ephemeral: true });

		const targetUser = interaction.options.getUser('user');
		const reason =
			interaction.options.getString('reason') ||
			(await t(interaction, 'core.moderation.warn.default.reason'));

		// Prevent self-warn
		if (targetUser.id === interaction.user.id) {
			const reply = await simpleContainer(
				interaction,
				await t(interaction, 'core.moderation.warn.cannot.self'),
				{ color: 'Red' },
			);
			return interaction.editReply({
				components: reply,
				flags: MessageFlags.IsComponentsV2,
				ephemeral: true,
			});
		}

		try {
			// 1. Save to DB
			const userRecord = await User.getCache({
				userId: targetUser.id,
				guildId: interaction.guild.id,
			});
			if (!userRecord.warnings) userRecord.warnings = [];
			userRecord.warnings.push({
				moderator: interaction.user.id,
				reason,
				date: new Date(),
			});
			await userRecord.saveAndUpdateCache();

			// 2. DM the user
			try {
				const dmReply = await createContainer(interaction, {
					color: 'Orange',
					title: await t(interaction, 'core.moderation.warn.dm.title', {
						guild: interaction.guild.name,
					}),
					description: await t(interaction, 'core.moderation.warn.dm.desc', {
						reason,
						moderator: interaction.user.tag,
					}),
					thumbnail: interaction.guild.iconURL(),
				});
				await targetUser.send({ components: dmReply });
			} catch (_) {
				// Ignore DM errors
			}

			// 3. Modlog
			const modLogChannelId = await kythiaConfig.channels.modlog;
			const modLogChannel = await getTextChannelSafe(
				interaction.guild,
				modLogChannelId,
			);
			if (modLogChannel) {
				const modLogReply = await createContainer(interaction, {
					color: 'Orange',
					title: 'Warn',
					description: await t(
						interaction,
						'core.moderation.warn.modlog.desc',
						{
							user: `${targetUser.tag} (${targetUser.id})`,
							moderator: interaction.user.tag,
							reason,
						},
					),
					thumbnail: targetUser.displayAvatarURL(),
				});
				await modLogChannel.send({ components: modLogReply });
			}

			// 4. Reply to interaction
			const reply = await createContainer(interaction, {
				color: kythiaConfig.bot.color,
				title: await t(interaction, 'core.moderation.warn.success.title'),
				description: await t(interaction, 'core.moderation.warn.success.desc', {
					user: targetUser.tag,
					reason,
				}),
				thumbnail: targetUser.displayAvatarURL(),
			});
			return interaction.editReply({
				components: reply,
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			const reply = await simpleContainer(
				interaction,
				await t(interaction, 'core.moderation.warn.failed', {
					error: error.message,
				}),
				{ color: 'Red' },
			);
			return interaction.editReply({
				components: reply,
				flags: MessageFlags.IsComponentsV2,
				ephemeral: true,
			});
		}
	},
};
