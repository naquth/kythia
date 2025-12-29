/**
 * @namespace: addons/ai/commands/ai/_command.js
 * @type: Command Group Definition
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('ai')
		.setDescription('🧠 All commands related to kythia ai system.'),
};
