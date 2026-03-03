/**
 * @namespace: addons/api/routes/stats.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { Hono } = require('hono');
const { broadcastGetStats } = require('../helpers/shard');

const app = new Hono();

app.get('/', async (c) => {
	const client = c.get('client');

	const { guilds, users } = await broadcastGetStats(client);

	return c.json({
		ping: client.ws.ping,
		uptime: client.uptime,
		guilds,
		users,
		ram_usage: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
	});
});

module.exports = app;
