/**
 * @namespace: addons/core/commands/utils/presence/avatar.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { MessageFlags } = require('discord.js');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('avatar')
			.setDescription('🖼️ Change bot avatar')
			.addAttachmentOption((opt) =>
				opt
					.setName('image')
					.setDescription('New avatar image')
					.setRequired(true),
			),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, helpers, logger } = container;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply();

		try {
			const attachment = interaction.options.getAttachment('image');

			if (!attachment.contentType?.startsWith('image/')) {
				const components = await simpleContainer(
					interaction,
					await t(interaction, 'core.utils.presence.avatar.invalid'),
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
				await t(interaction, 'core.utils.presence.avatar.success'),
				{ color: 'Green' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			logger.error('Error setting avatar:', error, {
				label: 'core:utils:presence',
			});
			const components = await simpleContainer(
				interaction,
				await t(interaction, 'core.utils.presence.error', {
					error: error.message,
				}),
				{ color: 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
