/**
 * @namespace: addons/core/register.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const setupTopGGPoster = require('./helpers/topgg-poster.js');
const { runStatsUpdater } = require('./helpers/stats.js');
const { loadFonts } = require('kythia-arts');

const cron = require('node-cron');
const path = require('node:path');

const initialize = (bot) => {
	const container = bot.client.container;
	const { logger } = container;
	const client = bot.client;
	const summary = [];

	// Only run background tasks on Shard 0 to prevent duplicate executions
	const isShardZeroOrNoShard = !client.shard || client.shard.ids.includes(0);

	if (isShardZeroOrNoShard) {
		const topGGPoster = setupTopGGPoster(bot);
		if (topGGPoster) {
			summary.push('  └─ Task: Top.gg auto-poster initialized');
			process.on('exit', () => {
				topGGPoster.cleanup();
			});
		}

		cron.schedule('*/5 * * * *', () => runStatsUpdater(bot.client));
		summary.push(
			'  └─ Cron: server stats updater (every 5 minutes, Shard 0 only)',
		);
	} else {
		logger.info(
			`🚫 Core background tasks (Top.gg, Stats Cron) disabled on Shard ${client.shard.ids[0]}`,
		);
	}

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
