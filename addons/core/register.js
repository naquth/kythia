/**
 * @namespace: addons/core/register.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const setupTopGGPoster = require('./helpers/topgg-poster.js');
const { runStatsUpdater } = require('./helpers/stats.js');
const { loadFonts } = require('kythia-arts');

const cron = require('node-cron');
const path = require('node:path');

const initialize = (bot) => {
	const container = bot.client.container;
	const { logger } = container;
	const summary = [];

	const topGGPoster = setupTopGGPoster(bot);
	if (topGGPoster) {
		summary.push('  └─ Task: Top.gg auto-poster initialized');
		process.on('exit', () => {
			topGGPoster.cleanup();
		});
	}

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
