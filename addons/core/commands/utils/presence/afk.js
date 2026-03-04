/**
 * @namespace: addons/core/commands/utils/presence/afk.js
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
			.setName('afk')
			.setDescription('😴 Set bot AFK status')
			.addBooleanOption((opt) =>
				opt
					.setName('afk')
					.setDescription('Whether to set as AFK')
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
			const afk = interaction.options.getBoolean('afk');
			await interaction.client.user.setAFK(afk);

			const components = await simpleContainer(
				interaction,
				await t(interaction, 'core.utils.presence.afk.success', {
					state: afk ? 'enabled' : 'disabled',
				}),
				{ color: 'Green' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			logger.error('Error setting AFK:', error, {
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
