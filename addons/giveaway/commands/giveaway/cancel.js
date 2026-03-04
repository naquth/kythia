/**
 * @namespace: addons/giveaway/commands/giveaway/cancel.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('cancel')
			.setDescription('Cancel a running giveaway')
			.addStringOption((option) =>
				option
					.setName('giveaway')
					.setDescription('Search active giveaway')
					.setAutocomplete(true)
					.setRequired(true),
			),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	execute(interaction, container) {
		const { giveawayManager } = container;
		const messageId = interaction.options.getString('giveaway');
		return giveawayManager.cancelGiveaway(messageId, interaction);
	},
};
