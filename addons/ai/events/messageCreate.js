/**
 * @namespace: addons/ai/events/messageCreate.js
 * @type: Event Handler
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
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
