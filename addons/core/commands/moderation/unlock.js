/**
 * @namespace: addons/core/commands/moderation/unlock.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const { PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
	slashCommand: (subcommand) =>
		subcommand
			.setName('unlock')
			.setDescription('🔓 Unlocks the current channel.')
			.addStringOption((option) =>
				option
					.setName('reason')
					.setDescription('Reason for unlocking the channel')
					.setRequired(false),
			),
	permissions: PermissionFlagsBits.ManageChannels,
	botPermissions: PermissionFlagsBits.ManageChannels,
	async execute(interaction, container) {
		const { t, helpers, kythiaConfig } = container;
		const { createContainer, simpleContainer } = helpers.discord;

		await interaction.deferReply({ ephemeral: true });

		const reason =
			interaction.options.getString('reason') ||
			(await t(interaction, 'core.moderation.unlock.default.reason'));

		try {
			await interaction.channel.permissionOverwrites.edit(
				interaction.guild.roles.everyone,
				{
					SendMessages: null,
				},
				{ reason },
			);

			const reply = await createContainer(interaction, {
				color: kythiaConfig.bot.color,
				title: await t(interaction, 'core.moderation.unlock.success.title'),
				description: await t(
					interaction,
					'core.moderation.unlock.success.desc',
					{
						channel: interaction.channel.toString(),
						reason,
					},
				),
				thumbnail: interaction.guild.iconURL(),
			});
			await interaction.channel.send({ components: reply });

			const confirmReply = await simpleContainer(
				interaction,
				await t(interaction, 'core.moderation.unlock.confirm'),
				{ color: 'Green' },
			);
			return interaction.editReply({
				components: confirmReply,
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			const reply = await simpleContainer(
				interaction,
				await t(interaction, 'core.moderation.unlock.failed', {
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
