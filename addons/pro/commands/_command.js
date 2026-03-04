/**
 * @namespace: addons/pro/commands/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */
const { InteractionContextType, SlashCommandBuilder } = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('pro')
		.setDescription('🌸 All commands related to the Kythia Pro users.')
		.setContexts(InteractionContextType.Guild),
};
