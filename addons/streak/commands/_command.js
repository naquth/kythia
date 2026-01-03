/**
 * @namespace: addons/streak/commands/_command.js
 * @type: Command Group Definition
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { InteractionContextType, SlashCommandBuilder } = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('streak')
		.setDescription('All commands related to the streak system.')
		.setContexts(InteractionContextType.Guild),
	guildOnly: true,
};
