/**
 * @namespace: addons/api/routes/activity.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { Hono } = require('hono');

const app = new Hono();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getModels = (c) => c.get('client').container.models;
const getLogger = (c) => c.get('client').container.logger;

// ---------------------------------------------------------------------------
// PATCH /api/activity/:guildId/toggle
// Enables or disables activity tracking for a guild
// Body: { enabled: boolean }
// ---------------------------------------------------------------------------
app.patch('/:guildId/toggle', async (c) => {
	const models = getModels(c);
	const { ServerSetting } = models;
	const { guildId } = c.req.param();

	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ error: "Missing or invalid 'enabled' field" }, 400);
	}

	if (typeof body?.enabled !== 'boolean') {
		return c.json({ error: "Missing or invalid 'enabled' field" }, 400);
	}

	try {
		const [setting] = await ServerSetting.findOrCreateWithCache({
			where: { guildId },
			defaults: {
				guildId,
				guildName: guildId,
			},
		});

		setting.activityOn = body.enabled;
		await setting.save();

		return c.json({ success: true, activityOn: setting.activityOn });
	} catch (error) {
		getLogger(c).error(
			`PATCH /api/activity/:guildId/toggle error: ${error.message || error}`,
			{ label: 'api:activity' },
		);
		return c.json({ error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// GET /api/activity/:guildId
// Returns the top-N activity leaderboard for a guild
// Query: { sort?: 'messages' | 'voice', limit?: number }
// ---------------------------------------------------------------------------
app.get('/:guildId', async (c) => {
	const models = getModels(c);
	const { ActivityStat } = models;
	const { guildId } = c.req.param();

	const { sort = 'messages', limit = '10' } = c.req.query();

	const sortKey = sort === 'voice' ? 'voice' : 'messages';
	const limitNum = Math.min(25, Math.max(1, parseInt(limit, 10) || 10));

	const orderColumn = sortKey === 'voice' ? 'totalVoiceTime' : 'totalMessages';

	try {
		const rows = await ActivityStat.getAllCache({
			where: { guildId },
			order: [[orderColumn, 'DESC']],
			limit: limitNum,
		});

		const leaderboard = rows.map((row, i) => ({
			rank: i + 1,
			userId: row.userId,
			totalMessages: row.totalMessages ?? 0,
			totalVoiceTime: row.totalVoiceTime ?? 0,
		}));

		return c.json({
			success: true,
			guildId,
			sort: sortKey,
			leaderboard,
		});
	} catch (error) {
		getLogger(c).error(
			`GET /api/activity/:guildId error: ${error.message || error}`,
			{ label: 'api:activity' },
		);
		return c.json({ success: false, error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// GET /api/activity/:guildId/id/:userId
// Returns the activity stats for a single user in a guild
// ---------------------------------------------------------------------------
app.get('/:guildId/id/:userId', async (c) => {
	const models = getModels(c);
	const { ActivityStat } = models;
	const { guildId, userId } = c.req.param();

	try {
		const stat = await ActivityStat.getCache({ guildId, userId });
		if (!stat) {
			return c.json({ success: false, error: 'User stats not found' }, 404);
		}

		return c.json({
			success: true,
			guildId,
			userId,
			totalMessages: stat.totalMessages ?? 0,
			totalVoiceTime: stat.totalVoiceTime ?? 0,
		});
	} catch (error) {
		getLogger(c).error(
			`GET /api/activity/:guildId/id/:userId error: ${error.message || error}`,
			{ label: 'api:activity' },
		);
		return c.json({ success: false, error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// DELETE /api/activity/:guildId/id/:userId
// Deletes the activity stats record for a single user in a guild
// ---------------------------------------------------------------------------
app.delete('/:guildId/id/:userId', async (c) => {
	const models = getModels(c);
	const { ActivityStat } = models;
	const { guildId, userId } = c.req.param();

	try {
		const deleted = await ActivityStat.destroyAndClearCache({
			where: { guildId, userId },
		});
		if (!deleted) {
			return c.json({ success: false, error: 'User stats not found' }, 404);
		}

		return c.json({ success: true });
	} catch (error) {
		getLogger(c).error(
			`DELETE /api/activity/:guildId/id/:userId error: ${error.message || error}`,
			{ label: 'api:activity' },
		);
		return c.json({ success: false, error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// DELETE /api/activity/:guildId
// Wipes all activity stats for every member in a guild
// ---------------------------------------------------------------------------
app.delete('/:guildId', async (c) => {
	const models = getModels(c);
	const { ActivityStat } = models;
	const { guildId } = c.req.param();

	try {
		const deleted = await ActivityStat.destroyAndClearCache({
			where: { guildId },
		});
		return c.json({ success: true, deleted });
	} catch (error) {
		getLogger(c).error(
			`DELETE /api/activity/:guildId error: ${error.message || error}`,
			{ label: 'api:activity' },
		);
		return c.json({ success: false, error: error.message }, 500);
	}
});

module.exports = app;
