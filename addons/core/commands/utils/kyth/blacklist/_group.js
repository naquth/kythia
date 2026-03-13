/**
 * @namespace: addons/core/commands/utils/kyth/blacklist/_group.js
 * @type: Subcommand Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

module.exports = {
	subcommandGroup: true,
	slashCommand: (group) =>
		group.setName('blacklist').setDescription('Manage Kythia blacklists'),
};
