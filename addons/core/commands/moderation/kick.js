/**
 * @namespace: addons/core/commands/moderation/kick.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
	slashCommand: (subcommand) =>
		subcommand
			.setName('kick')
			.setDescription('👢 Kicks a user from the server.')
			.addUserOption((option) =>
				option
					.setName('user')
					.setDescription('The user to kick')
					.setRequired(true),
			)
			.addStringOption((option) =>
				option
					.setName('reason')
					.setDescription('Reason for the kick')
					.setRequired(false),
			),
	permissions: PermissionFlagsBits.KickMembers,
	botPermissions: PermissionFlagsBits.KickMembers,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, helpers, kythiaConfig } = container;
		const { createContainer, simpleContainer, getTextChannelSafe } =
			helpers.discord;

		await interaction.deferReply();

		const user = interaction.options.getUser('user');
		const reason =
			interaction.options.getString('reason') ||
			(await t(interaction, 'core.moderation.kick.default.reason'));

		try {
			await interaction.guild.members.kick(user, reason);
			const reply = await createContainer(interaction, {
				color: kythiaConfig.bot.color,
				title: await t(interaction, 'core.moderation.kick.success.title'),
				description: await t(interaction, 'core.moderation.kick.success.desc', {
					user: user.tag,
					reason,
				}),
				thumbnail: user.displayAvatarURL(),
			});

			const modLogChannelId = await kythiaConfig.channels.modlog;
			const modLogChannel = await getTextChannelSafe(
				interaction.guild,
				modLogChannelId,
			);
			if (modLogChannel) {
				const modLogReply = await createContainer(interaction, {
					color: 'Orange',
					title: 'Kick',
					description: await t(
						interaction,
						'core.moderation.kick.modlog.desc',
						{
							user: `${user.tag} (${user.id})`,
							moderator: interaction.user.tag,
							reason,
						},
					),
					thumbnail: user.displayAvatarURL(),
				});
				await modLogChannel.send({
					components: modLogReply,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			return interaction.editReply({
				components: reply,
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			const reply = await simpleContainer(
				interaction,
				await t(interaction, 'core.moderation.kick.failed', {
					error: error.message,
				}),
				{ color: 'Red' },
			);
			return interaction.editReply({
				components: reply,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
