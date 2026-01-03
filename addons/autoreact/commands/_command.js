/**
 * @namespace: addons/autoreact/commands/_command.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	guildOnly: true,
	slashCommand: new SlashCommandBuilder()
		.setName('autoreact')
		.setDescription('🤖 Manage automatic reactions for the server.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
};
