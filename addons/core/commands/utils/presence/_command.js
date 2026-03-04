/**
 * @namespace: addons/core/commands/utils/presence/_command.js
 * @type: Command Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	ActivityType,
	PermissionFlagsBits,
	SlashCommandBuilder,
	PresenceUpdateStatus,
	InteractionContextType,
} = require('discord.js');

const STATUS_OPTIONS = Object.entries(PresenceUpdateStatus)
	.filter(([_k, v]) => typeof v === 'string')
	.map(([k]) => ({ name: k, value: k }));

const ACTIVITY_TYPE_OPTIONS = Object.entries(ActivityType)
	.filter(([_k, v]) => typeof v === 'number')
	.map(([k]) => ({ name: k, value: k }));

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('presence')
		.setDescription('🔄 Manage bot client user settings')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setContexts(InteractionContextType.Guild),
	ownerOnly: true,
	mainGuildOnly: true,

	// Export shared constants for use by subcommands
	STATUS_OPTIONS,
	ACTIVITY_TYPE_OPTIONS,
};
