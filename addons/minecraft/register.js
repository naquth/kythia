/**
 * @namespace: addons/minecraft/register.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 *
 * All commands are auto-loaded from the commands/ folder.
 * The Minecraft server stats cron runs on Shard 0 only (every 5 minutes).
 */

const cron = require('node-cron');
const { runMinecraftStatsUpdater } = require('./helpers/mcstats');

module.exports = {
	initialize(bot) {
		const client = bot.client;
		const { logger } = client.container;
		const summary = [];

		// Only run on Shard 0 to avoid duplicate channel renames
		const isShardZeroOrNoShard = !client.shard || client.shard.ids.includes(0);

		if (isShardZeroOrNoShard) {
			cron.schedule('*/5 * * * *', () => runMinecraftStatsUpdater(client));
			summary.push(
				'  └─ Cron: Minecraft server stats updater (every 5 minutes, Shard 0 only)',
			);
		} else {
			logger.info(
				`🚫 Minecraft stats cron disabled on Shard ${client.shard.ids[0]}`,
			);
		}

		return summary;
	},
};
