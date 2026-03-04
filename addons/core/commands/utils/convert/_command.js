/**
 * @namespace: addons/core/commands/utils/convert/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('convert')
		.setDescription('🔄 Convert between units, currencies, etc.'),
};
