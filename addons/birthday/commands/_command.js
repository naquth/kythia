/**
 * @namespace: addons/birthday/commands/_command.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	guildOnly: true,
	slashCommand: new SlashCommandBuilder()
		.setName('birthday')
		.setDescription('🎂 Manage your birthday settings.'),
};
