/**
 * @namespace: addons/core/events/messageCreate.js
 * @type: Event Handler
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const PrefixCommandHandler = require('../helpers/handlers/PrefixCommandHandler');
const AFKHandler = require('../helpers/handlers/AFKHandler');
const StickyMessageHandler = require('../helpers/handlers/StickyMessageHandler');
const ErrorHandler = require('../helpers/handlers/ErrorHandler');
const { automodSystem } = require('../helpers/automod');

module.exports = async (bot, message) => {
	const client = bot.client;
	const container = client.container;
	const { helpers } = container;
	const { isOwner } = helpers.discord;

	try {
		// 1. Try prefix command handling
		const prefixHandler = new PrefixCommandHandler();
		const handled = await prefixHandler.handle(message, container);
		if (handled) return;

		// 2. Guild-only features
		if (message.guild) {
			// Automod system (skip for owners/admins)
			if (
				!isOwner(message.author.id) &&
				!message.member?.permissions.has(['Administrator', 'ManageGuild'])
			) {
				const isFlagged = await automodSystem(message, client);
				if (isFlagged) return true;
			}

			// AFK system
			const afkHandler = new AFKHandler();
			await afkHandler.handle(message, container);

			// Sticky messages
			const stickyHandler = new StickyMessageHandler();
			await stickyHandler.handle(message, container);
		}
	} catch (error) {
		// Centralized error handling
		const errorHandler = new ErrorHandler();
		await errorHandler.handle(error, message, container);
	}
};
