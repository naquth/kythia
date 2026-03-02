/**
 * @namespace: addons/api/routes/invite.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { Hono } = require('hono');
const app = new Hono();

// Helper to get models
const getModels = (c) => c.get('client').container.models;

// --- Invite Stats Endpoints ---

// GET /api/invite - List invite stats (with optional filters)
app.get('/', async (c) => {
	const { Invite } = getModels(c);
	const guildId = c.req.query('guildId');
	const userId = c.req.query('userId');

	const where = {};
	if (guildId) where.guildId = guildId;
	if (userId) where.userId = userId;

	try {
		const data = await Invite.findAll({ where });
		return c.json({ success: true, count: data.length, data });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// GET /api/invite/:id - Get a specific invite record
app.get('/:id', async (c) => {
	const { Invite } = getModels(c);
	const id = c.req.param('id');

	try {
		const result = await Invite.findByPk(id);
		if (!result)
			return c.json({ success: false, error: 'Invite not found' }, 404);
		return c.json({ success: true, data: result });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// POST /api/invite - Create or Update invite record
app.post('/', async (c) => {
	const { Invite } = getModels(c);
	const body = await c.req.json();
	const { guildId, userId } = body;

	if (!guildId || !userId) {
		return c.json({ success: false, error: 'Missing guildId or userId' }, 400);
	}

	try {
		let result = await Invite.getCache({ userId, guildId });
		if (result) {
			await result.update(body);
			await result.saveAndUpdateCache();
		} else {
			result = await Invite.create(body);
			await result.saveAndUpdateCache();
		}
		return c.json({ success: true, data: result });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// DELETE /api/invite/:id - Delete an invite record
app.delete('/:id', async (c) => {
	const { Invite } = getModels(c);
	const id = c.req.param('id');

	try {
		const result = await Invite.findByPk(id);
		if (!result)
			return c.json({ success: false, error: 'Invite not found' }, 404);

		await result.destroy();
		return c.json({ success: true, message: 'Invite deleted successfully' });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// --- Invite History Endpoints ---

// GET /api/invite/histories - List invite histories (with optional filters)
app.get('/histories', async (c) => {
	const { InviteHistory } = getModels(c);
	const guildId = c.req.query('guildId');
	const inviterId = c.req.query('inviterId');
	const memberId = c.req.query('memberId');
	const status = c.req.query('status');

	const where = {};
	if (guildId) where.guildId = guildId;
	if (inviterId) where.inviterId = inviterId;
	if (memberId) where.memberId = memberId;
	if (status) where.status = status;

	try {
		const data = await InviteHistory.findAll({ where });
		return c.json({ success: true, count: data.length, data });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// DELETE /api/invite/histories/:id - Delete a history record
app.delete('/histories/:id', async (c) => {
	const { InviteHistory } = getModels(c);
	const id = c.req.param('id');

	try {
		const result = await InviteHistory.findByPk(id);
		if (!result)
			return c.json({ success: false, error: 'History record not found' }, 404);

		await result.destroy();
		return c.json({
			success: true,
			message: 'History record deleted successfully',
		});
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

module.exports = app;
