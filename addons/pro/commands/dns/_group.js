/**
 * @namespace: addons/pro/commands/dns/_group.js
 * @type: Subcommand Group Definition
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */
module.exports = {
	subcommand: true,
	slashCommand: (subcommandGroup) =>
		subcommandGroup
			.setName('dns')
			.setDescription('Kelola DNS record untuk subdomain Pro-mu.'),
};
