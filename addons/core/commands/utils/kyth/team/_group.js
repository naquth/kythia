/**
 * @namespace: addons/core/commands/utils/kyth/team/_group.js
 * @type: Subcommand Group Definition
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

module.exports = {
	subcommandGroup: true,
	slashCommand: (group) =>
		group.setName('team').setDescription('Manage Kythia Team members'),
};
