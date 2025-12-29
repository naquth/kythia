/**
 * @namespace: addons/core/register.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

// const { cleanupUserCache } = require('./helpers/index.js');
const setupTopGGPoster = require('./helpers/topgg-poster.js');
const { runStatsUpdater } = require('./helpers/stats.js');
// const { userCache } = require('./helpers/automod.js');
const { loadFonts } = require('kythia-arts');

const cron = require('node-cron');
const path = require('node:path');

const initialize = (bot) => {
	const container = bot.client.container;
	const { logger } = container;
	const summary = [];

	try {
		const reactRoleHandler = require('./buttons/reactrole.js');

		bot.registerButtonHandler('reactrole', reactRoleHandler.execute);
		summary.push("  └─ Button: 'reactrole'");
	} catch (error) {
		logger.error("Error registering button handler 'reactrole':", error);
	}

	// Setup Top.gg auto-poster
	const topGGPoster = setupTopGGPoster(bot);
	if (topGGPoster) {
		summary.push('  └─ Task: Top.gg auto-poster initialized');
		process.on('exit', () => {
			topGGPoster.cleanup();
		});
	}

	// cron.schedule('0 * * * *', () => cleanupUserCache(container, userCache));
	// summary.push('  └─ Cron: cleanup user cache (per day at 00:00)');

	cron.schedule('*/5 * * * *', () => runStatsUpdater(bot.client));
	summary.push('  └─ Cron: cleanup user cache (every 5 minutes)');

	bot.addClientReadyHook(() => {
		logger.info(
			`🔠 Total Fonts Loaded: ${loadFonts(path.join(__dirname, 'assets', 'fonts'))}`,
		);
	});
	return summary;
};

module.exports = {
	initialize,
};
