/**
 * @namespace: addons/core/commands/utils/convert/_command.js
 * @type: Command Group Definition
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('convert')
		.setDescription('🔄 Convert between units, currencies, etc.'),
};
