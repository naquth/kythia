/**
 * @namespace: addons/ai/commands/ai/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('ai')
		.setDescription('🧠 All commands related to kythia ai system.'),
};
