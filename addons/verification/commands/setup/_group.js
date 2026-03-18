/**
 * @namespace: addons/verification/commands/setup/_group.js
 * @type: Subcommand Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { SlashCommandSubcommandGroupBuilder } = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandSubcommandGroupBuilder()
		.setName('setup')
		.setDescription('Configure the verification system'),
};
