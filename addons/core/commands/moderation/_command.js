/**
 * @namespace: addons/core/commands/moderation/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('mod')
		.setDescription('Moderation action')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
};
