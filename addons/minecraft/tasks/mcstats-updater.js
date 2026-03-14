/**
 * @namespace: addons/minecraft/tasks/mcstats-updater.js
 * @type: Scheduled Task
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { runMinecraftStatsUpdater } = require('../helpers/mcstats');

module.exports = {
	taskName: 'mcstats-updater',
	schedule: '*/5 * * * *',
	active: true,

	execute: async (container) => {
		const { client } = container;

		// Only run on Shard 0 to prevent duplicate updates across shards
		if (client.shard && !client.shard.ids.includes(0)) {
			return;
		}

		await runMinecraftStatsUpdater(client);
	},
};
