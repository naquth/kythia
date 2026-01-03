/**
 * @namespace: addons/fun/commands/marry/_command.js
 * @type: Command Group Definition
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { InteractionContextType, SlashCommandBuilder } = require('discord.js');

module.exports = {
	guildOnly: true,
	slashCommand: new SlashCommandBuilder()
		.setName('marry')
		.setDescription('💍 Marriage system commands')
		.setContexts(InteractionContextType.Guild),
};
