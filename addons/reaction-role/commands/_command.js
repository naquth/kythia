/**
 * @namespace: addons/reaction-role/commands/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 1.0.0
 */
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	guildOnly: true,
	slashCommand: new SlashCommandBuilder()
		.setName('reaction-role')
		.setDescription('🎭 Manage reaction roles for your server.')
		.setDMPermission(false),
};
