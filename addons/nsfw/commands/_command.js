/**
 * @namespace: addons/nsfw/commands/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */
const { InteractionContextType, SlashCommandBuilder } = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('nsfw')
		.setDescription('🔞 NSFW random content (only in nsfw channel)')
		.setContexts(InteractionContextType.Guild)
		.setNSFW(true),
};
