/**
 * @namespace: addons/activity/commands/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { InteractionContextType, SlashCommandBuilder } = require('discord.js');

module.exports = {
	guildOnly: true,
	slashCommand: new SlashCommandBuilder()
		.setName('activity')
		.setDescription('📊 All commands related to activity statistics.')
		.setContexts(InteractionContextType.Guild),
};
