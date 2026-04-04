/**
 * @namespace: addons/api/routes/streak.js
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
const getHelpers = (c) => c.get('client').container.helpers;

function getTodayDateString() {
	return new Date().toISOString().slice(0, 10);
}

function getYesterdayDateString() {
	const yesterday = new Date();
	yesterday.setUTCDate(yesterday.getUTCDate() - 1);
	return yesterday.toISOString().slice(0, 10);
}

/**
 * Resolve claim status for a streak — same logic as helpers/index.js claimStreak
 * Returns { status, streak } without touching Discord member/roles/nickname.
 */
function computeClaim(streak) {
	const today = getTodayDateString();
	const yesterday = getYesterdayDateString();
	const lastClaimDateStr = streak.lastClaimTimestamp
		? streak.lastClaimTimestamp.toISOString().slice(0, 10)
		: null;

	if (lastClaimDateStr === today) {
		return { status: 'ALREADY_CLAIMED', streak };
	}

	let status = 'CONTINUE';
	if (lastClaimDateStr !== yesterday && streak.currentStreak > 0) {
		if (streak.streakFreezes > 0) {
			streak.streakFreezes -= 1;
			streak.currentStreak += 1;
			status = 'FREEZE_USED';
		} else {
			streak.currentStreak = 1;
			status = 'RESET';
		}
	} else if (lastClaimDateStr === yesterday) {
		streak.currentStreak += 1;
		status = 'CONTINUE';
	} else {
		streak.currentStreak = 1;
		status = 'NEW';
	}

	if (streak.currentStreak > (streak.highestStreak || 0)) {
		streak.highestStreak = streak.currentStreak;
	}

	streak.lastClaimTimestamp = new Date(today);
	return { status, streak };
}

function formatStreak(s, rank = null) {
	const today = getTodayDateString();
	const lastClaim = s.lastClaimTimestamp
		? s.lastClaimTimestamp.toISOString().slice(0, 10)
		: null;

	const result = {
		id: s.id,
		userId: s.userId,
		guildId: s.guildId,
		currentStreak: s.currentStreak ?? 0,
		highestStreak: s.highestStreak ?? 0,
		streakFreezes: s.streakFreezes ?? 0,
		lastClaimTimestamp: s.lastClaimTimestamp,
		claimedToday: lastClaim === today,
		createdAt: s.createdAt,
		updatedAt: s.updatedAt,
	};
	if (rank !== null) result.rank = rank;
	return result;
}

// ---------------------------------------------------------------------------
// GET /api/streak/:guildId
// Leaderboard — sorted by currentStreak desc, highestStreak desc
// ---------------------------------------------------------------------------
app.get('/:guildId', async (c) => {
	const { Streak } = getModels(c);
	const { getMemberSafe } = getHelpers(c).discord;
	const { guildId } = c.req.param();
	const { page = '1', limit = '50', sort = 'current' } = c.req.query();

	const pageNum = Math.max(1, parseInt(page, 10) || 1);
	const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
	const offset = (pageNum - 1) * limitNum;

	// Sort mode: 'current' (default) or 'highest'
	const order =
		sort === 'highest'
			? [
					['highestStreak', 'DESC'],
					['currentStreak', 'DESC'],
				]
			: [
					['currentStreak', 'DESC'],
					['highestStreak', 'DESC'],
				];

	try {
		const { count, rows } = await Streak.findAndCountAll({
			where: { guildId },
			order,
			limit: limitNum,
			offset,
		});

		const client = c.get('client');
		const guildObj = client.guilds.cache.get(guildId);
		const today = getTodayDateString();

		const data = await Promise.all(
			rows.map(async (s, i) => {
				let username = null;
				let avatar = null;
				if (guildObj) {
					const member = await getMemberSafe(guildObj, s.userId);
					const userObj = member?.user ?? null;
					if (userObj) {
						username = userObj.username;
						avatar = userObj.displayAvatarURL
							? userObj.displayAvatarURL({ size: 64 })
							: null;
					}
				}
				return {
					rank: offset + i + 1,
					userId: s.userId,
					username,
					avatar,
					currentStreak: s.currentStreak ?? 0,
					highestStreak: s.highestStreak ?? 0,
					streakFreezes: s.streakFreezes ?? 0,
					claimedToday: s.lastClaimTimestamp
						? s.lastClaimTimestamp.toISOString().slice(0, 10) === today
						: false,
					lastClaimTimestamp: s.lastClaimTimestamp,
				};
			}),
		);

		return c.json({
			success: true,
			count,
			page: pageNum,
			totalPages: Math.ceil(count / limitNum) || 1,
			sort,
			data,
		});
	} catch (error) {
		getLogger(c).error('GET /api/streak/:guildId error:', error);
		return c.json({ success: false, error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// GET /api/streak/:guildId/:userId
// Single user streak profile with rank
// ---------------------------------------------------------------------------
app.get('/:guildId/:userId', async (c) => {
	const { Streak } = getModels(c);
	const { getMemberSafe } = getHelpers(c).discord;
	const { guildId, userId } = c.req.param();
	const { Op } = require('sequelize');

	try {
		const streak = await Streak.findOne({ where: { guildId, userId } });
		if (!streak) {
			return c.json(
				{
					success: false,
					error: 'Streak not found for this user in this guild',
				},
				404,
			);
		}

		const aboveCount = await Streak.count({
			where: {
				guildId,
				[Op.or]: [
					{ currentStreak: { [Op.gt]: streak.currentStreak } },
					{
						currentStreak: streak.currentStreak,
						highestStreak: { [Op.gt]: streak.highestStreak },
					},
				],
			},
		});
		const totalMembers = await Streak.count({ where: { guildId } });

		const client = c.get('client');
		const guildObj = client.guilds.cache.get(guildId);
		let username = null;
		let avatar = null;
		if (guildObj) {
			const member = await getMemberSafe(guildObj, userId);
			const userObj = member?.user ?? null;
			if (userObj) {
				username = userObj.username;
				avatar = userObj.displayAvatarURL
					? userObj.displayAvatarURL({ size: 64 })
					: null;
			}
		}

		const formatted = formatStreak(streak, aboveCount + 1);
		return c.json({
			success: true,
			data: { ...formatted, username, avatar },
			totalMembers,
		});
	} catch (error) {
		getLogger(c).error('GET /api/streak/:guildId/:userId error:', error);
		return c.json({ success: false, error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// POST /api/streak/:guildId/:userId
// Create/initialize a streak record for a user
// Body (all optional): { currentStreak?, highestStreak?, streakFreezes?, lastClaimTimestamp? }
// ---------------------------------------------------------------------------
app.post('/:guildId/:userId', async (c) => {
	const { Streak } = getModels(c);
	const { guildId, userId } = c.req.param();

	let body = {};
	try {
		body = await c.req.json();
	} catch {}

	const existing = await Streak.findOne({ where: { guildId, userId } });
	if (existing) {
		return c.json(
			{
				success: false,
				error: 'Streak already exists for this user in this guild',
			},
			409,
		);
	}

	try {
		const streak = await Streak.create({
			guildId,
			userId,
			currentStreak: Math.max(0, parseInt(body.currentStreak, 10) || 0),
			highestStreak: Math.max(0, parseInt(body.highestStreak, 10) || 0),
			streakFreezes: Math.max(0, parseInt(body.streakFreezes, 10) || 0),
			lastClaimTimestamp: body.lastClaimTimestamp
				? new Date(body.lastClaimTimestamp)
				: null,
		});
		return c.json({ success: true, data: formatStreak(streak) }, 201);
	} catch (error) {
		getLogger(c).error('POST /api/streak/:guildId/:userId error:', error);
		return c.json({ success: false, error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// PATCH /api/streak/:guildId/:userId
// Update a streak. Supports action-based or direct field update.
//
// Actions:
//   "claim"           — simulate /streak claim (no Discord side-effects)
//   "reset-streak"    — reset currentStreak to 0, keep history
//   "set"             — directly set any combination of fields
//   "add-freeze"      — add N streak freeze(s)
//   "remove-freeze"   — remove N streak freeze(s)
// ---------------------------------------------------------------------------
app.patch('/:guildId/:userId', async (c) => {
	const { Streak } = getModels(c);
	const { guildId, userId } = c.req.param();

	let body;
	try {
		body = await c.req.json();
	} catch {
		return c.json({ success: false, error: 'Invalid JSON body' }, 400);
	}

	const { action } = body;
	const validActions = [
		'claim',
		'reset-streak',
		'set',
		'add-freeze',
		'remove-freeze',
	];
	if (!action || !validActions.includes(action)) {
		return c.json(
			{
				success: false,
				error: `Missing or invalid action. Must be one of: ${validActions.join(', ')}`,
			},
			400,
		);
	}

	try {
		let streak = await Streak.findOne({ where: { guildId, userId } });

		// Auto-create if not found (matches bot behavior with getOrCreateStreak)
		if (!streak) {
			streak = await Streak.create({
				guildId,
				userId,
				currentStreak: 0,
				highestStreak: 0,
				streakFreezes: 0,
				lastClaimTimestamp: null,
			});
		}

		let claimStatus = null;

		if (action === 'claim') {
			// Mirrors /streak claim logic (without Discord role/nickname side-effects)
			const result = await computeClaim(streak);
			if (result.status === 'ALREADY_CLAIMED') {
				return c.json(
					{
						success: false,
						error: 'Streak already claimed today',
						claimStatus: 'ALREADY_CLAIMED',
						data: formatStreak(streak),
					},
					409,
				);
			}
			claimStatus = result.status;
			streak = result.streak;
		} else if (action === 'reset-streak') {
			// Mirrors /streak reset
			streak.currentStreak = 0;
			streak.lastClaimTimestamp = null;
		} else if (action === 'set') {
			// Direct field set: { action: "set", currentStreak?, highestStreak?, streakFreezes?, lastClaimTimestamp? }
			if (body.currentStreak !== undefined) {
				const val = parseInt(body.currentStreak, 10);
				if (Number.isNaN(val) || val < 0)
					return c.json(
						{
							success: false,
							error: 'currentStreak must be a non-negative integer',
						},
						400,
					);
				streak.currentStreak = val;
			}
			if (body.highestStreak !== undefined) {
				const val = parseInt(body.highestStreak, 10);
				if (Number.isNaN(val) || val < 0)
					return c.json(
						{
							success: false,
							error: 'highestStreak must be a non-negative integer',
						},
						400,
					);
				streak.highestStreak = val;
			}
			if (body.streakFreezes !== undefined) {
				const val = parseInt(body.streakFreezes, 10);
				if (Number.isNaN(val) || val < 0)
					return c.json(
						{
							success: false,
							error: 'streakFreezes must be a non-negative integer',
						},
						400,
					);
				streak.streakFreezes = val;
			}
			if (body.lastClaimTimestamp !== undefined) {
				streak.lastClaimTimestamp = body.lastClaimTimestamp
					? new Date(body.lastClaimTimestamp)
					: null;
			}
			// Auto-update highestStreak if currentStreak exceeds it
			if (streak.currentStreak > streak.highestStreak) {
				streak.highestStreak = streak.currentStreak;
			}
		} else if (action === 'add-freeze') {
			// { action: "add-freeze", amount: number }
			const amount = Math.max(1, parseInt(body.amount, 10) || 1);
			streak.streakFreezes = (streak.streakFreezes ?? 0) + amount;
		} else if (action === 'remove-freeze') {
			// { action: "remove-freeze", amount: number }
			const amount = Math.max(1, parseInt(body.amount, 10) || 1);
			streak.streakFreezes = Math.max(0, (streak.streakFreezes ?? 0) - amount);
		}

		await streak.save();

		const response = {
			success: true,
			data: formatStreak(streak),
		};
		if (claimStatus) response.claimStatus = claimStatus;
		return c.json(response);
	} catch (error) {
		getLogger(c).error('PATCH /api/streak/:guildId/:userId error:', error);
		return c.json({ success: false, error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// DELETE /api/streak/:guildId/:userId
// Delete a single user's streak record
// ---------------------------------------------------------------------------
app.delete('/:guildId/:userId', async (c) => {
	const { Streak } = getModels(c);
	const { guildId, userId } = c.req.param();

	try {
		const streak = await Streak.findOne({ where: { guildId, userId } });
		if (!streak) {
			return c.json(
				{
					success: false,
					error: 'Streak not found for this user in this guild',
				},
				404,
			);
		}

		await streak.destroy({ individualHooks: true });
		return c.json({
			success: true,
			message: `Streak deleted for user ${userId} in guild ${guildId}`,
		});
	} catch (error) {
		getLogger(c).error('DELETE /api/streak/:guildId/:userId error:', error);
		return c.json({ success: false, error: error.message }, 500);
	}
});

// ---------------------------------------------------------------------------
// DELETE /api/streak/:guildId
// Wipe ALL streak records in a guild
// ---------------------------------------------------------------------------
app.delete('/:guildId', async (c) => {
	const { Streak } = getModels(c);
	const { guildId } = c.req.param();

	try {
		const deleted = await Streak.destroy({ where: { guildId } });
		return c.json({
			success: true,
			message: `Deleted ${deleted} streak record(s) in guild ${guildId}`,
			deleted,
		});
	} catch (error) {
		getLogger(c).error('DELETE /api/streak/:guildId error:', error);
		return c.json({ success: false, error: error.message }, 500);
	}
});

module.exports = app;
