/**
 * @namespace: addons/minecraft/commands/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	guildOnly: false,
	slashCommand: new SlashCommandBuilder()
		.setName('minecraft')
		.setDescription('⛏️ Minecraft: Java Edition player lookup commands'),
};
