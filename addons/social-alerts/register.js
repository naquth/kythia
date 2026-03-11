/**
 * @namespace: addons/social-alerts/register.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const cron = require('node-cron');
const poller = require('./tasks/poller');

const initialize = (bot) => {
	const container = bot.client.container;
	const { logger } = container;
	const client = bot.client;
	const summary = [];

	// Only run the poller on Shard 0 to prevent duplicate posts
	const isShardZeroOrNoShard = !client.shard || client.shard.ids.includes(0);

	if (isShardZeroOrNoShard) {
		cron.schedule(poller.schedule, () => {
			poller.execute(container).catch((err) => {
				logger.error('[social-alerts] Poller crashed:', err);
			});
		});
		summary.push(
			`  └─ Cron: social-alert poller (${poller.schedule}, Shard 0 only)`,
		);
	} else {
		logger.info(
			`🚫 Social Alerts poller disabled on Shard ${client.shard.ids[0]}`,
		);
	}

	return summary;
};

module.exports = { initialize };
