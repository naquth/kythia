/**
 * @namespace: addons/api/server.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { cors } = require('hono/cors');
const { logger: honoLogger } = require('hono/logger');
const fs = require('node:fs');
const path = require('node:path');
const { Server } = require('socket.io');
const addonGuard = require('./helpers/addon-guard');
// const { rateLimit } = require('./helpers/rateLimit');

module.exports = (bot) => {
	const client = bot.client;
	const container = client.container;
	const { logger } = container;
	const kythiaConfig = container.kythiaConfig;

	const PORT = kythiaConfig.addons.api?.port || 3000;
	const API_SECRET = kythiaConfig.addons.api?.secret || process.env.API_SECRET;

	// Parse comma-separated allowed origins, e.g. "http://localhost:8000,https://kythia.me"
	const rawAllowedOrigin =
		kythiaConfig.addons.api?.allowedOrigin ||
		process.env.API_ALLOWED_ORIGIN ||
		'';
	const API_ALLOWED_ORIGINS = rawAllowedOrigin
		.split(',')
		.map((o) => o.trim())
		.filter(Boolean);

	// Only start the API server on Shard 0 to avoid EADDRINUSE errors
	if (client.shard && !client.shard.ids.includes(0)) {
		logger.info(
			`🚫 API Server & Dashboard Socket.io disabled on Shard ${client.shard.ids[0]} (Run only on Shard 0)`,
		);
		return;
	}

	const app = new Hono();

	app.use('*', honoLogger());
	app.use('*', cors());
	// app.use('/api/*', rateLimit({ limit: 60, windowMs: 60 * 1000 }));

	app.use('*', async (c, next) => {
		c.set('client', client);
		c.set('container', container);
		c.set('config', kythiaConfig);
		c.set('app', app);
		await next();
	});

	app.use('/api/*', async (c, next) => {
		const url = c.req.url;

		const hang = () => {
			const nodeReq = c.env?.incoming;
			if (nodeReq?.socket) {
				nodeReq.socket.destroy();
			}
			return new Response(null, { status: 444 });
		};

		if (url.includes('/api/webhooks')) {
			return await next();
		}

		if (API_ALLOWED_ORIGINS.length > 0) {
			const origin =
				c.req.header('Origin') ||
				c.req.header('Referer')?.split('/').slice(0, 3).join('/');
			if (!origin || !API_ALLOWED_ORIGINS.includes(origin)) {
				return await hang();
			}
		}

		// Layer 2 — Bearer token
		if (!API_SECRET) {
			return await hang();
		}

		const authHeader = c.req.header('Authorization');
		if (authHeader !== `Bearer ${API_SECRET}`) {
			return await hang();
		}

		await next();
	});

	app.get('/', (c) =>
		c.json({
			message: 'Kythia API is running! 🚀',
			runtime: typeof globalThis.Bun !== 'undefined' ? 'Bun' : 'Node.js',
		}),
	);

	const routesDir = path.join(__dirname, 'routes');

	function loadRoutes(dirPath, urlPrefix = '/api') {
		if (!fs.existsSync(dirPath)) return;

		const files = fs.readdirSync(dirPath);

		files.forEach((file) => {
			const fullPath = path.join(dirPath, file);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				loadRoutes(fullPath, `${urlPrefix}/${file}`);
			} else if (file.endsWith('.js') && !file.startsWith('_')) {
				const routeName = file.replace('.js', '');

				const routePath =
					routeName === 'index' ? urlPrefix : `${urlPrefix}/${routeName}`;

				// Auto-guard: if an addon folder with the same name as this route
				// file exists, protect the entire route prefix with addonGuard.
				// e.g. routes/invite.js → addons/invite/ exists → guarded.
				const addonDir = path.join(process.cwd(), 'addons', routeName);
				if (fs.existsSync(addonDir) && fs.statSync(addonDir).isDirectory()) {
					app.use(routePath, addonGuard(routeName));
					app.use(`${routePath}/*`, addonGuard(routeName));
					logger.info(
						`   └─ 🛡️  Auto-guard: ${routePath} → addon '${routeName}'`,
					);
				}

				try {
					const routeModule = require(fullPath);

					app.route(routePath, routeModule);
					logger.info(`   └─ 🛤️  Route loaded: ${routePath} -> ${file}`);
				} catch (err) {
					logger.error(`  └─ ❌ Error loading route ${file}:`, err);
				}
			}
		});
	}

	logger.info('🔄 Loading API Routes...');
	loadRoutes(routesDir);

	logger.info(`🔥 API Server running on port ${PORT}`);

	const server = serve({
		fetch: app.fetch,
		port: Number(PORT),
	});

	const io = new Server(server, {
		cors: {
			origin: API_ALLOWED_ORIGINS.length > 0 ? API_ALLOWED_ORIGINS : '*',
			methods: ['GET', 'POST'],
		},
	});

	container.io = io;

	io.on('connection', (socket) => {
		logger.info(`🔌 Dashboard connected: ${socket.id}`);

		socket.on('join_guild', (guildId) => {
			socket.join(guildId);
			logger.info(`🔌 Socket ${socket.id} joined guild room: ${guildId}`);
		});
	});

	return server;
};
