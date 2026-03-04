/**
 * @namespace: addons/server/commands/server/reset.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { resetServer } = require('./_helpers');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('reset')
			.setDescription('Reset server structure to default')
			.addBooleanOption((opt) =>
				opt
					.setName('clear')
					.setDescription('Delete all channels & roles first?')
					.setRequired(false),
			),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 */
	async execute(interaction) {
		await interaction.deferReply();
		await resetServer(interaction);
	},
};
