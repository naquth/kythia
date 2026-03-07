/**
 * @namespace: addons/automod/events/messageCreate.js
 * @type: Event Handler
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { automodSystem } = require('../helpers/automod');

module.exports = async (bot, message) => {
	const client = bot.client;
	const container = client.container;
	const { helpers } = container;
	const { isOwner } = helpers.discord;

	if (!message.guild) return;
	if (message.author?.bot) return;

	// Skip automod for owners and members with admin/manage guild permissions
	if (
		isOwner(message.author.id) ||
		message.member?.permissions.has(['Administrator', 'ManageGuild'])
	) {
		return;
	}

	try {
		await automodSystem(message, client);
	} catch (error) {
		container.logger.error(
			'❌ [Automod] Error in messageCreate handler:',
			error,
		);
	}
};
