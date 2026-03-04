/**
 * @namespace: addons/ai/events/messageCreate.js
 * @type: Event Handler
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const AIMessageHandler = require('../helpers/handlers/AIMessageHandler');

let messageHandler;

/**
 * AI Message Create Event Handler
 * Delegates all processing to AIMessageHandler class
 */
module.exports = async (bot, message) => {
	// Lazy initialization of handler
	if (!messageHandler) {
		messageHandler = new AIMessageHandler(bot.container);
	}

	await messageHandler.handleMessage(bot, message);
};
