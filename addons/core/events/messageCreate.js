const PrefixCommandHandler = require('../helpers/handlers/PrefixCommandHandler');
const AFKHandler = require('../helpers/handlers/AFKHandler');
const StickyMessageHandler = require('../helpers/handlers/StickyMessageHandler');
const ErrorHandler = require('../helpers/handlers/ErrorHandler');

module.exports = async (bot, message) => {
	const client = bot.client;
	const container = client.container;

	try {
		// 1. Try prefix command handling
		const prefixHandler = new PrefixCommandHandler();
		const handled = await prefixHandler.handle(message, container);
		if (handled) return;

		// 2. Guild-only features
		if (message.guild) {
			// Automod is now handled by the automod addon's own messageCreate listener

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
