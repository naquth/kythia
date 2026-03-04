/**
 * @namespace: addons/api/routes/list.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { Hono } = require('hono');
const app = new Hono();

app.get('/', (c) => {
	const mainApp = c.get('app');
	const routes = [];

	mainApp.routes.forEach((route) => {
		if (route.method !== 'ALL') {
			routes.push({
				method: route.method,
				path: route.path,
			});
		}
	});

	routes.sort((a, b) => a.path.localeCompare(b.path));

	return c.json({
		success: true,
		count: routes.length,
		routes: routes,
	});
});

module.exports = app;
