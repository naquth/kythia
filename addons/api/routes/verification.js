/**
 * @namespace: addons/api/routes/verification.js
 * @type: Route
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 *
 * REST API for the Verification addon.
 * Auto-mounted at: /api/verification
 *
 * Endpoints:
 *   GET    /:guildId                     — full config snapshot + enabled status
 *   PUT    /:guildId                     — replace entire config
 *   PATCH  /:guildId/toggle              — enable / disable system
 *   PATCH  /:guildId/captcha-type        — set captcha type (math|emoji|image)
 *   PATCH  /:guildId/roles               — set verified / unverified roles
 *   PATCH  /:guildId/channel             — set verification channel (null = DM)
 *   PATCH  /:guildId/timeout             — set timeout seconds
 *   PATCH  /:guildId/attempts            — set max attempts
 *   PATCH  /:guildId/kick                — set kickOnFail / kickOnTimeout
 *   PATCH  /:guildId/log-channel         — set log channel
 *   PATCH  /:guildId/welcome-message     — set welcome DM text
 *   GET    /:guildId/whitelist           — not applicable (verification has no whitelist)
 *
 * Action endpoints (bot side-effects):
 *   POST   /:guildId/members/:userId/reset   — resend captcha to a member
 *   POST   /:guildId/members/:userId/force   — manually verify a member
 *   DELETE /:guildId/members/:userId/revoke  — revoke verification from a member
 */

const { Hono } = require('hono');

const app = new Hono();

const getModels = (c) => c.get('client').container.models;
const getBot = (c) => c.get('client'); // discord.js Client-like (has .guilds, .container)
const getLogger = (c) => c.get('client').container.logger;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatConfig(config, systemEnabled) {
	return {
		systemEnabled: systemEnabled ?? false,
		verifiedRoleId: config?.verifiedRoleId ?? null,
		unverifiedRoleId: config?.unverifiedRoleId ?? null,
		channelId: config?.channelId ?? null,
		captchaType: config?.captchaType ?? 'math',
		maxAttempts: config?.maxAttempts ?? 3,
		timeoutSeconds: config?.timeoutSeconds ?? 180,
		kickOnFail: config?.kickOnFail ?? false,
		kickOnTimeout: config?.kickOnTimeout ?? false,
		dmFallback: config?.dmFallback ?? true,
		welcomeMessage: config?.welcomeMessage ?? null,
		logChannelId: config?.logChannelId ?? null,
	};
}

async function getOrCreateConfig(c) {
	const { VerificationConfig, ServerSetting } = getModels(c);
	const { guildId } = c.req.param();
	const setting = await ServerSetting.getCache({ guildId });
	const [config] = await VerificationConfig.findOrCreate({
		where: { guildId },
		defaults: { guildId },
	});
	return { config, setting, guildId, VerificationConfig, ServerSetting };
}

// ---------------------------------------------------------------------------
// GET /api/verification/:guildId — full config
// ---------------------------------------------------------------------------
app.get('/:guildId', async (c) => {
	try {
		const { config, setting } = await getOrCreateConfig(c);
		return c.json({
			status: 'ok',
			data: formatConfig(config, setting?.verificationOn),
		});
	} catch (error) {
		getLogger(c).error('GET /api/verification/:guildId error:', error);
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// PUT /api/verification/:guildId — bulk replace config
// Body: any subset of configurable fields
// ---------------------------------------------------------------------------
app.put('/:guildId', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ status: 'error', error: 'Invalid JSON' }, 400);
	}

	const ALLOWED = [
		'verifiedRoleId',
		'unverifiedRoleId',
		'channelId',
		'captchaType',
		'maxAttempts',
		'timeoutSeconds',
		'kickOnFail',
		'kickOnTimeout',
		'dmFallback',
		'welcomeMessage',
		'logChannelId',
	];
	const CAPTCHA_TYPES = ['math', 'emoji', 'image'];

	try {
		const { config, setting } = await getOrCreateConfig(c);

		for (const field of ALLOWED) {
			if (field in body) config[field] = body[field];
		}

		// Validate captchaType
		if (config.captchaType && !CAPTCHA_TYPES.includes(config.captchaType)) {
			return c.json(
				{
					status: 'error',
					error: `captchaType must be one of: ${CAPTCHA_TYPES.join(', ')}`,
				},
				400,
			);
		}

		await config.save();
		return c.json({
			status: 'ok',
			data: formatConfig(config, setting?.verificationOn),
		});
	} catch (error) {
		getLogger(c).error('PUT /api/verification/:guildId error:', error);
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// PATCH /api/verification/:guildId/toggle — enable/disable
// Body: { enabled: true }
// ---------------------------------------------------------------------------
app.patch('/:guildId/toggle', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ status: 'error', error: 'Invalid JSON' }, 400);
	}
	if (typeof body.enabled !== 'boolean')
		return c.json(
			{ status: 'error', error: '"enabled" (boolean) required' },
			400,
		);

	try {
		const { ServerSetting } = getModels(c);
		const { guildId } = c.req.param();
		const [setting] =
			(await ServerSetting.findOrCreateWithCache?.({
				where: { guildId },
				defaults: { guildId },
			}).then((r) => r)) ??
			(await ServerSetting.findOrCreate({
				where: { guildId },
				defaults: { guildId },
			}));
		setting.verificationOn = body.enabled;
		await setting.save();
		return c.json({
			status: 'ok',
			data: { verificationOn: setting.verificationOn },
		});
	} catch (error) {
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// PATCH /api/verification/:guildId/captcha-type — set type
// Body: { type: "math"|"emoji"|"image" }
// ---------------------------------------------------------------------------
app.patch('/:guildId/captcha-type', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ status: 'error', error: 'Invalid JSON' }, 400);
	}
	if (!['math', 'emoji', 'image'].includes(body.type)) {
		return c.json(
			{ status: 'error', error: 'type must be: math, emoji, or image' },
			400,
		);
	}
	try {
		const { config } = await getOrCreateConfig(c);
		config.captchaType = body.type;
		await config.save();
		return c.json({ status: 'ok', data: { captchaType: config.captchaType } });
	} catch (error) {
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// PATCH /api/verification/:guildId/roles — set verified / unverified roles
// Body: { verifiedRoleId?, unverifiedRoleId? }
// ---------------------------------------------------------------------------
app.patch('/:guildId/roles', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ status: 'error', error: 'Invalid JSON' }, 400);
	}
	try {
		const { config } = await getOrCreateConfig(c);
		if ('verifiedRoleId' in body)
			config.verifiedRoleId = body.verifiedRoleId || null;
		if ('unverifiedRoleId' in body)
			config.unverifiedRoleId = body.unverifiedRoleId || null;
		await config.save();
		return c.json({
			status: 'ok',
			data: {
				verifiedRoleId: config.verifiedRoleId,
				unverifiedRoleId: config.unverifiedRoleId,
			},
		});
	} catch (error) {
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// PATCH /api/verification/:guildId/channel — set verify channel
// Body: { channelId: "..." | null }   (null = DM only)
// ---------------------------------------------------------------------------
app.patch('/:guildId/channel', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ status: 'error', error: 'Invalid JSON' }, 400);
	}
	try {
		const { config } = await getOrCreateConfig(c);
		config.channelId = body.channelId || null;
		await config.save();
		return c.json({ status: 'ok', data: { channelId: config.channelId } });
	} catch (error) {
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// PATCH /api/verification/:guildId/timeout — set timeout seconds
// Body: { seconds: 180 }
// ---------------------------------------------------------------------------
app.patch('/:guildId/timeout', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ status: 'error', error: 'Invalid JSON' }, 400);
	}
	const secs = Number(body.seconds);
	if (!Number.isInteger(secs) || secs < 30 || secs > 600) {
		return c.json(
			{
				status: 'error',
				error: '"seconds" must be an integer between 30 and 600',
			},
			400,
		);
	}
	try {
		const { config } = await getOrCreateConfig(c);
		config.timeoutSeconds = secs;
		await config.save();
		return c.json({
			status: 'ok',
			data: { timeoutSeconds: config.timeoutSeconds },
		});
	} catch (error) {
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// PATCH /api/verification/:guildId/attempts — set max attempts
// Body: { count: 3 }
// ---------------------------------------------------------------------------
app.patch('/:guildId/attempts', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ status: 'error', error: 'Invalid JSON' }, 400);
	}
	const count = Number(body.count);
	if (!Number.isInteger(count) || count < 1 || count > 10) {
		return c.json(
			{ status: 'error', error: '"count" must be an integer between 1 and 10' },
			400,
		);
	}
	try {
		const { config } = await getOrCreateConfig(c);
		config.maxAttempts = count;
		await config.save();
		return c.json({ status: 'ok', data: { maxAttempts: config.maxAttempts } });
	} catch (error) {
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// PATCH /api/verification/:guildId/kick — set kick behavior
// Body: { kickOnFail?: boolean, kickOnTimeout?: boolean }
// ---------------------------------------------------------------------------
app.patch('/:guildId/kick', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ status: 'error', error: 'Invalid JSON' }, 400);
	}
	try {
		const { config } = await getOrCreateConfig(c);
		if (typeof body.kickOnFail === 'boolean')
			config.kickOnFail = body.kickOnFail;
		if (typeof body.kickOnTimeout === 'boolean')
			config.kickOnTimeout = body.kickOnTimeout;
		await config.save();
		return c.json({
			status: 'ok',
			data: {
				kickOnFail: config.kickOnFail,
				kickOnTimeout: config.kickOnTimeout,
			},
		});
	} catch (error) {
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// PATCH /api/verification/:guildId/log-channel — set log channel
// Body: { channelId: "..." | null }
// ---------------------------------------------------------------------------
app.patch('/:guildId/log-channel', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ status: 'error', error: 'Invalid JSON' }, 400);
	}
	try {
		const { config } = await getOrCreateConfig(c);
		config.logChannelId = body.channelId || null;
		await config.save();
		return c.json({
			status: 'ok',
			data: { logChannelId: config.logChannelId },
		});
	} catch (error) {
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// PATCH /api/verification/:guildId/welcome-message — set welcome DM text
// Body: { message: "..." | null }
// ---------------------------------------------------------------------------
app.patch('/:guildId/welcome-message', async (c) => {
	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ status: 'error', error: 'Invalid JSON' }, 400);
	}
	try {
		const { config } = await getOrCreateConfig(c);
		config.welcomeMessage = body.message || null;
		await config.save();
		return c.json({
			status: 'ok',
			data: { welcomeMessage: config.welcomeMessage },
		});
	} catch (error) {
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// POST /api/verification/:guildId/members/:userId/reset — resend captcha
// ---------------------------------------------------------------------------
app.post('/:guildId/members/:userId/reset', async (c) => {
	const { guildId, userId } = c.req.param();
	try {
		const { config } = await getOrCreateConfig(c);
		if (!config.verifiedRoleId) {
			return c.json(
				{
					status: 'error',
					error: 'Verification not configured (no verifiedRoleId)',
				},
				422,
			);
		}

		const bot = getBot(c);
		const guild = await bot.guilds.fetch(guildId).catch(() => null);
		if (!guild)
			return c.json({ status: 'error', error: 'Guild not found' }, 404);

		const member = await guild.members.fetch(userId).catch(() => null);
		if (!member)
			return c.json({ status: 'error', error: 'Member not found' }, 404);

		// Lazy-require to avoid circular deps
		const { clearSession } = require('../../verification/helpers/session');
		const { sendCaptcha } = require('../../verification/helpers/verify');
		clearSession(guildId, userId);
		await sendCaptcha(member, config);

		return c.json({
			status: 'ok',
			message: `Captcha resent to ${member.user.tag}`,
		});
	} catch (error) {
		getLogger(c).error('POST verification/reset error:', error);
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// POST /api/verification/:guildId/members/:userId/force — manually verify
// ---------------------------------------------------------------------------
app.post('/:guildId/members/:userId/force', async (c) => {
	const { guildId, userId } = c.req.param();
	try {
		const { config } = await getOrCreateConfig(c);
		const bot = getBot(c);
		const guild = await bot.guilds.fetch(guildId).catch(() => null);
		if (!guild)
			return c.json({ status: 'error', error: 'Guild not found' }, 404);

		const member = await guild.members.fetch(userId).catch(() => null);
		if (!member)
			return c.json({ status: 'error', error: 'Member not found' }, 404);

		const { clearSession } = require('../../verification/helpers/session');
		const { handleSuccess } = require('../../verification/helpers/verify');
		clearSession(guildId, userId);
		await handleSuccess(member, config);

		return c.json({
			status: 'ok',
			message: `${member.user.tag} manually verified`,
		});
	} catch (error) {
		getLogger(c).error('POST verification/force error:', error);
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// DELETE /api/verification/:guildId/members/:userId/revoke — revoke verification
// ---------------------------------------------------------------------------
app.delete('/:guildId/members/:userId/revoke', async (c) => {
	const { guildId, userId } = c.req.param();
	try {
		const { config } = await getOrCreateConfig(c);
		const bot = getBot(c);
		const guild = await bot.guilds.fetch(guildId).catch(() => null);
		if (!guild)
			return c.json({ status: 'error', error: 'Guild not found' }, 404);

		const member = await guild.members.fetch(userId).catch(() => null);
		if (!member)
			return c.json({ status: 'error', error: 'Member not found' }, 404);

		if (config.verifiedRoleId) {
			const role = guild.roles.cache.get(config.verifiedRoleId);
			if (role) await member.roles.remove(role).catch(() => null);
		}
		if (config.unverifiedRoleId) {
			const role = guild.roles.cache.get(config.unverifiedRoleId);
			if (role) await member.roles.add(role).catch(() => null);
		}

		return c.json({
			status: 'ok',
			message: `Verification revoked for ${member.user.tag}`,
		});
	} catch (error) {
		getLogger(c).error('DELETE verification/revoke error:', error);
		return c.json({ status: 'error', error: error.message }, 500);
	}
});

module.exports = app;
