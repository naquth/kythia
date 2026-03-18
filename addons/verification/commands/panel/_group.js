/**
 * @namespace: addons/verification/commands/panel/_group.js
 * @type: Subcommand Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { SlashCommandSubcommandGroupBuilder } = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandSubcommandGroupBuilder()
		.setName('panel')
		.setDescription('Verification panel management'),
};
