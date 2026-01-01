/**
 * @namespace: addons/api/routes/metrics.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { Hono } = require('hono');
const app = new Hono();

app.get('/', async (c) => {
	const container = c.get('container');
	const { metrics } = container;

	if (!metrics) {
		return c.text('Metrics unavailable', 503);
	}

	const rawMetrics = await metrics.getMetrics();
	c.header('Content-Type', metrics.getContentType());
	return c.body(rawMetrics);
});

module.exports = app;
