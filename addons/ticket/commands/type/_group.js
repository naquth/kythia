/**
 * @namespace: addons/ticket/commands/type/_group.js
 * @type: Subcommand Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

module.exports = {
	subcommand: true,
	slashCommand: (subcommandGroup) =>
		subcommandGroup
			.setName('type')
			.setDescription('Manage ticket types (e.g., "Report", "Ask")'),
};
