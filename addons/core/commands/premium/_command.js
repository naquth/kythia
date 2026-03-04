/**
 * @namespace: addons/core/commands/premium/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('premium')
		.setDescription(
			'💰 Manage premium user status (add, delete, edit, list, info)',
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	ownerOnly: true,
	mainGuildOnly: true,
};
