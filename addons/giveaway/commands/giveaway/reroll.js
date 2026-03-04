/**
 * @namespace: addons/giveaway/commands/giveaway/reroll.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('reroll')
			.setDescription('Reroll winners for a finished giveaway')
			.addStringOption((option) =>
				option
					.setName('giveaway')
					.setDescription('Search ended giveaway')
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
		return giveawayManager.rerollGiveaway(messageId, interaction);
	},
};
