/**
 * @namespace: addons/api/routes/pro.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { Hono } = require('hono');
const app = new Hono();

// Helpers
const getBot = (c) => c.get('client');
const getContainer = (c) => getBot(c).container;
const getModels = (c) => getContainer(c).models;

// =============================================================================
// Subdomain — LIST / GET
// =============================================================================

// GET /api/pro/subdomains
// Query: ?userId
app.get('/subdomains', async (c) => {
	const { Subdomain } = getModels(c);
	const where = {};

	const userId = c.req.query('userId');
	if (userId) where.userId = userId;

	try {
		const data = await Subdomain.findAll({ where });
		return c.json({ success: true, count: data.length, data });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// GET /api/pro/subdomains/:id
// Includes associated DNS records
app.get('/subdomains/:id', async (c) => {
	const { Subdomain, DnsRecord } = getModels(c);
	const id = parseInt(c.req.param('id'), 10);

	try {
		const subdomain = await Subdomain.findByPk(id, {
			include: [{ model: DnsRecord, as: 'dnsRecords' }],
		});
		if (!subdomain)
			return c.json({ success: false, error: 'Subdomain not found' }, 404);
		return c.json({ success: true, data: subdomain });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// Subdomain — CREATE
// =============================================================================

// POST /api/pro/subdomains
// Body: { userId, name }
app.post('/subdomains', async (c) => {
	const { Subdomain } = getModels(c);
	const body = await c.req.json();
	const { userId, name } = body;

	if (!userId || !name) {
		return c.json(
			{ success: false, error: 'Missing required fields: userId, name' },
			400,
		);
	}

	try {
		const [record, created] = await Subdomain.findOrCreate({
			where: { name },
			defaults: { userId, name },
		});
		return c.json(
			{ success: true, created, data: record },
			created ? 201 : 200,
		);
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// Subdomain — DELETE
// =============================================================================

// DELETE /api/pro/subdomains/:id
// Cascades to DNS records in DB (honoring FK constraint)
app.delete('/subdomains/:id', async (c) => {
	const { Subdomain } = getModels(c);
	const id = parseInt(c.req.param('id'), 10);

	try {
		const subdomain = await Subdomain.findByPk(id);
		if (!subdomain)
			return c.json({ success: false, error: 'Subdomain not found' }, 404);

		await subdomain.destroy();
		return c.json({
			success: true,
			message: `Subdomain (id=${id}) deleted successfully`,
		});
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// DNS Records — LIST / GET
// =============================================================================

// GET /api/pro/dns
// Query: ?subdomainId
app.get('/dns', async (c) => {
	const { DnsRecord } = getModels(c);
	const where = {};

	const subdomainId = c.req.query('subdomainId');
	if (subdomainId) where.subdomainId = parseInt(subdomainId, 10);

	try {
		const data = await DnsRecord.findAll({ where });
		return c.json({ success: true, count: data.length, data });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// GET /api/pro/dns/:id
app.get('/dns/:id', async (c) => {
	const { DnsRecord } = getModels(c);
	const id = parseInt(c.req.param('id'), 10);

	try {
		const record = await DnsRecord.findByPk(id);
		if (!record)
			return c.json({ success: false, error: 'DNS record not found' }, 404);
		return c.json({ success: true, data: record });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// DNS Records — CREATE
// =============================================================================

// POST /api/pro/dns
// Body: { subdomainId, type, name, value, cloudflareId? }
// DB-only write — does not call Cloudflare
app.post('/dns', async (c) => {
	const { DnsRecord, Subdomain } = getModels(c);
	const body = await c.req.json();
	const { subdomainId, type, name, value, cloudflareId } = body;

	const VALID_TYPES = ['A', 'CNAME', 'TXT', 'MX'];

	if (!subdomainId || !type || !name || !value) {
		return c.json(
			{
				success: false,
				error: 'Missing required fields: subdomainId, type, name, value',
			},
			400,
		);
	}

	if (!VALID_TYPES.includes(type)) {
		return c.json(
			{
				success: false,
				error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
			},
			400,
		);
	}

	try {
		const subdomain = await Subdomain.findByPk(subdomainId);
		if (!subdomain)
			return c.json({ success: false, error: 'Subdomain not found' }, 404);

		const record = await DnsRecord.create({
			subdomainId,
			type,
			name,
			value,
			cloudflareId: cloudflareId ?? null,
		});
		return c.json({ success: true, data: record }, 201);
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// DNS Records — UPDATE
// =============================================================================

// PATCH /api/pro/dns/:id
// Body: { value?, cloudflareId? }
app.patch('/dns/:id', async (c) => {
	const { DnsRecord } = getModels(c);
	const id = parseInt(c.req.param('id'), 10);
	const body = await c.req.json();

	try {
		const record = await DnsRecord.findByPk(id);
		if (!record)
			return c.json({ success: false, error: 'DNS record not found' }, 404);

		await record.update({
			value: body.value ?? record.value,
			cloudflareId:
				'cloudflareId' in body
					? (body.cloudflareId ?? null)
					: record.cloudflareId,
		});
		return c.json({ success: true, data: record });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// DNS Records — DELETE
// =============================================================================

// DELETE /api/pro/dns/:id
// DB-only delete — does not call Cloudflare
app.delete('/dns/:id', async (c) => {
	const { DnsRecord } = getModels(c);
	const id = parseInt(c.req.param('id'), 10);

	try {
		const record = await DnsRecord.findByPk(id);
		if (!record)
			return c.json({ success: false, error: 'DNS record not found' }, 404);

		await record.destroy();
		return c.json({
			success: true,
			message: `DNS record (id=${id}) deleted successfully`,
		});
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// Monitors — LIST / GET
// =============================================================================

// GET /api/pro/monitors
// Query: ?userId, ?lastStatus
app.get('/monitors', async (c) => {
	const { Monitor } = getModels(c);
	const where = {};

	const userId = c.req.query('userId');
	const lastStatus = c.req.query('lastStatus');
	if (userId) where.userId = userId;
	if (lastStatus) where.lastStatus = lastStatus.toUpperCase();

	try {
		const data = await Monitor.findAll({ where });
		return c.json({ success: true, count: data.length, data });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// GET /api/pro/monitors/:userId
app.get('/monitors/:userId', async (c) => {
	const { Monitor } = getModels(c);
	const userId = c.req.param('userId');

	try {
		const monitor = await Monitor.findByPk(userId);
		if (!monitor)
			return c.json({ success: false, error: 'Monitor not found' }, 404);
		return c.json({ success: true, data: monitor });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// Monitors — CREATE / UPSERT
// =============================================================================

// POST /api/pro/monitors
// Body: { userId, urlToPing, lastStatus? }
app.post('/monitors', async (c) => {
	const { Monitor } = getModels(c);
	const body = await c.req.json();
	const { userId, urlToPing, lastStatus } = body;

	const VALID_STATUSES = ['UP', 'DOWN', 'PENDING'];

	if (!userId || !urlToPing) {
		return c.json(
			{ success: false, error: 'Missing required fields: userId, urlToPing' },
			400,
		);
	}

	if (lastStatus && !VALID_STATUSES.includes(lastStatus.toUpperCase())) {
		return c.json(
			{
				success: false,
				error: `Invalid lastStatus. Must be one of: ${VALID_STATUSES.join(', ')}`,
			},
			400,
		);
	}

	try {
		const [monitor, created] = await Monitor.findOrCreate({
			where: { userId },
			defaults: {
				userId,
				urlToPing,
				lastStatus: lastStatus?.toUpperCase() ?? 'PENDING',
			},
		});

		if (!created) {
			await monitor.update({
				urlToPing,
				lastStatus: lastStatus?.toUpperCase() ?? monitor.lastStatus,
			});
		}

		return c.json(
			{ success: true, created, data: monitor },
			created ? 201 : 200,
		);
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// Monitors — UPDATE
// =============================================================================

// PATCH /api/pro/monitors/:userId
// Body: { urlToPing?, lastStatus? }
app.patch('/monitors/:userId', async (c) => {
	const { Monitor } = getModels(c);
	const userId = c.req.param('userId');
	const body = await c.req.json();

	const VALID_STATUSES = ['UP', 'DOWN', 'PENDING'];

	if (
		body.lastStatus &&
		!VALID_STATUSES.includes(body.lastStatus.toUpperCase())
	) {
		return c.json(
			{
				success: false,
				error: `Invalid lastStatus. Must be one of: ${VALID_STATUSES.join(', ')}`,
			},
			400,
		);
	}

	try {
		const monitor = await Monitor.findByPk(userId);
		if (!monitor)
			return c.json({ success: false, error: 'Monitor not found' }, 404);

		await monitor.update({
			urlToPing: body.urlToPing ?? monitor.urlToPing,
			lastStatus: body.lastStatus?.toUpperCase() ?? monitor.lastStatus,
		});
		return c.json({ success: true, data: monitor });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// Monitors — DELETE
// =============================================================================

// DELETE /api/pro/monitors/:userId
app.delete('/monitors/:userId', async (c) => {
	const { Monitor } = getModels(c);
	const userId = c.req.param('userId');

	try {
		const monitor = await Monitor.findByPk(userId);
		if (!monitor)
			return c.json({ success: false, error: 'Monitor not found' }, 404);

		await monitor.destroy();
		return c.json({
			success: true,
			message: `Monitor for user (userId=${userId}) deleted successfully`,
		});
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

module.exports = app;
