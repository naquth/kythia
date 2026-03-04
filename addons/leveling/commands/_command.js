/**
 * @namespace: addons/leveling/commands/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { InteractionContextType, SlashCommandBuilder } = require('discord.js');

module.exports = {
	guildOnly: true,
	slashCommand: new SlashCommandBuilder()
		.setName('level')
		.setDescription('🏅 All commands related to the leveling system.')
		.setContexts(InteractionContextType.Guild),
};
