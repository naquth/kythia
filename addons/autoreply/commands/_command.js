/**
 * @namespace: addons/autoreply/commands/_command.js
 * @type: Command Group Definition
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	guildOnly: true,
	slashCommand: new SlashCommandBuilder()
		.setName('autoreply')
		.setDescription('🤖 Manage custom auto-replies for your server.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
};
