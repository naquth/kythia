/**
 * @namespace: addons/api/routes/reaction-roles.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 1.0.0
 */

const { Hono } = require('hono');
const app = new Hono();

// Helpers
const getBot = (c) => c.get('client');
const getContainer = (c) => getBot(c).container;
const getModels = (c) => getContainer(c).models;

// Import reaction-role helpers
const rrHelpers = require('../../reaction-role/helpers/index.js');

// =============================================================================
// LIST / GET endpoints
// =============================================================================

// GET /api/reaction-roles
// Query: ?guildId, ?channelId, ?messageId
app.get('/', async (c) => {
	const { ReactionRole } = getModels(c);
	const where = {};

	const guildId = c.req.query('guildId');
	const channelId = c.req.query('channelId');
	const messageId = c.req.query('messageId');

	if (guildId) where.guildId = guildId;
	if (channelId) where.channelId = channelId;
	if (messageId) where.messageId = messageId;

	try {
		const data = await ReactionRole.findAll({ where });
		return c.json({ success: true, count: data.length, data });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// GET /api/reaction-roles/:id
app.get('/:id', async (c) => {
	const { ReactionRole } = getModels(c);
	const id = c.req.param('id');

	try {
		const rr = await ReactionRole.findByPk(id);
		if (!rr)
			return c.json({ success: false, error: 'ReactionRole not found' }, 404);
		return c.json({ success: true, data: rr });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// CREATE endpoint
// =============================================================================

/**
 * POST /api/reaction-roles
 * Body: { guildId, channelId, messageId, emoji, roleId }
 *
 * - Validates the emoji by actually reacting to the message (same as the bot command).
 * - Upserts (create or update) the DB record.
 * - Calls refreshReactionRoleMessage to re-edit the live Discord message.
 */
app.post('/', async (c) => {
	const client = getBot(c);
	const container = getContainer(c);
	const { ReactionRole } = getModels(c);
	const body = await c.req.json();
	const { guildId, channelId, messageId, emoji, roleId } = body;

	if (!guildId || !channelId || !messageId || !emoji || !roleId) {
		return c.json(
			{
				success: false,
				error:
					'Missing required fields: guildId, channelId, messageId, emoji, roleId',
			},
			400,
		);
	}

	try {
		// Fetch the Discord channel & message
		const channel = await client.channels.fetch(channelId).catch(() => null);
		if (!channel)
			return c.json(
				{ success: false, error: `Channel ${channelId} not found` },
				404,
			);

		const message = await channel.messages.fetch(messageId).catch(() => null);
		if (!message)
			return c.json(
				{ success: false, error: `Message ${messageId} not found` },
				404,
			);

		// Validate emoji by reacting — mirrors bot command behaviour
		try {
			await message.react(emoji);
		} catch (_) {
			return c.json({ success: false, error: `Invalid emoji: ${emoji}` }, 400);
		}

		// Upsert — find existing or create new
		const [rr, created] = await ReactionRole.findOrCreate({
			where: { guildId, messageId, emoji },
			defaults: { guildId, channelId, messageId, emoji, roleId },
		});

		if (!created) {
			// Update role & channel on existing record
			rr.roleId = roleId;
			rr.channelId = channelId;
			await rr.save();
		}

		// Refresh the live Discord message
		await rrHelpers.refreshReactionRoleMessage(messageId, container);

		return c.json({ success: true, created, data: rr });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// UPDATE endpoint
// =============================================================================

/**
 * PATCH /api/reaction-roles/:id
 * Body: { emoji?, roleId?, channelId? }
 *
 * - If emoji changed: removes the old bot reaction, adds the new one.
 * - Saves updated record.
 * - Calls refreshReactionRoleMessage so the Discord message reflects the change.
 */
app.patch('/:id', async (c) => {
	const client = getBot(c);
	const container = getContainer(c);
	const { ReactionRole } = getModels(c);
	const id = c.req.param('id');
	const body = await c.req.json();

	try {
		const rr = await ReactionRole.findByPk(id);
		if (!rr)
			return c.json({ success: false, error: 'ReactionRole not found' }, 404);

		const oldEmoji = rr.emoji;
		const newEmoji = body.emoji ?? rr.emoji;
		const emojiChanged = newEmoji !== oldEmoji;

		// If emoji is changing, validate the new emoji first
		if (emojiChanged) {
			const channel = await client.channels
				.fetch(body.channelId ?? rr.channelId)
				.catch(() => null);

			if (channel) {
				const message = await channel.messages
					.fetch(rr.messageId)
					.catch(() => null);

				if (message) {
					// Remove old bot reaction
					try {
						const oldReaction = message.reactions.cache.find((r) => {
							const reactEmoji = r.emoji.id ?? r.emoji.name;
							return (
								reactEmoji === oldEmoji ||
								`<:${r.emoji.name}:${r.emoji.id}>` === oldEmoji
							);
						});
						if (oldReaction) {
							await oldReaction.users.remove(client.user.id);
						}
					} catch (_) {
						// Best-effort; continue even if removal fails
					}

					// Validate & add new emoji reaction
					try {
						await message.react(newEmoji);
					} catch (_) {
						return c.json(
							{ success: false, error: `Invalid emoji: ${newEmoji}` },
							400,
						);
					}
				}
			}
		}

		// Persist updates
		await rr.update({
			emoji: newEmoji,
			roleId: body.roleId ?? rr.roleId,
			channelId: body.channelId ?? rr.channelId,
		});

		// Refresh the live Discord message
		await rrHelpers.refreshReactionRoleMessage(rr.messageId, container);

		return c.json({ success: true, data: rr });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// DELETE endpoints
// =============================================================================

/**
 * DELETE /api/reaction-roles/:id
 *
 * - Removes the bot reaction from the Discord message (best-effort).
 * - Destroys the DB record.
 * - Calls refreshReactionRoleMessage so remaining RRs are reflected.
 */
app.delete('/:id', async (c) => {
	const client = getBot(c);
	const container = getContainer(c);
	const { ReactionRole } = getModels(c);
	const id = c.req.param('id');

	try {
		const rr = await ReactionRole.findByPk(id);
		if (!rr)
			return c.json({ success: false, error: 'ReactionRole not found' }, 404);

		const { channelId, messageId, emoji } = rr;

		// Destroy DB record first
		await rr.destroy();

		// Remove bot reaction (best-effort)
		try {
			const channel = await client.channels.fetch(channelId).catch(() => null);
			if (channel) {
				const message = await channel.messages
					.fetch(messageId)
					.catch(() => null);
				if (message) {
					const botReaction = message.reactions.cache.find((r) => {
						const reactEmoji = r.emoji.id ?? r.emoji.name;
						return (
							reactEmoji === emoji ||
							`<:${r.emoji.name}:${r.emoji.id}>` === emoji
						);
					});
					if (botReaction) {
						await botReaction.users.remove(client.user.id);
					}
				}
			}
		} catch (_) {
			// Non-critical — continue
		}

		// Refresh the live Discord message with remaining reaction roles
		await rrHelpers.refreshReactionRoleMessage(messageId, container);

		return c.json({
			success: true,
			message: `ReactionRole (id=${id}) deleted successfully`,
		});
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

/**
 * DELETE /api/reaction-roles/message/:messageId
 *
 * Bulk-delete ALL reaction roles tied to a Discord message.
 * Removes every bot reaction from the message, then destroys all DB records.
 */
app.delete('/message/:messageId', async (c) => {
	const client = getBot(c);
	const { ReactionRole } = getModels(c);
	const messageId = c.req.param('messageId');

	try {
		const records = await ReactionRole.findAll({ where: { messageId } });

		if (records.length === 0) {
			return c.json(
				{ success: false, error: 'No reaction roles found for this message' },
				404,
			);
		}

		const channelId = records[0].channelId;

		// Remove all bot reactions (best-effort)
		try {
			const channel = await client.channels.fetch(channelId).catch(() => null);
			if (channel) {
				const message = await channel.messages
					.fetch(messageId)
					.catch(() => null);
				if (message) {
					for (const rr of records) {
						try {
							const botReaction = message.reactions.cache.find((r) => {
								const reactEmoji = r.emoji.id ?? r.emoji.name;
								return (
									reactEmoji === rr.emoji ||
									`<:${r.emoji.name}:${r.emoji.id}>` === rr.emoji
								);
							});
							if (botReaction) {
								await botReaction.users.remove(client.user.id);
							}
						} catch (_) {
							// Continue on individual reaction removal failure
						}
					}
				}
			}
		} catch (_) {
			// Non-critical
		}

		// Bulk destroy all records for this message
		const deletedCount = await ReactionRole.destroy({ where: { messageId } });

		return c.json({
			success: true,
			message: `Deleted ${deletedCount} reaction role(s) for message ${messageId}`,
		});
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

// =============================================================================
// REFRESH endpoint
// =============================================================================

/**
 * POST /api/reaction-roles/message/:messageId/refresh
 *
 * Force-refresh the Discord message for the given messageId.
 * Reads all current DB records and re-edits the message.
 */
app.post('/message/:messageId/refresh', async (c) => {
	const container = getContainer(c);
	const messageId = c.req.param('messageId');

	try {
		await rrHelpers.refreshReactionRoleMessage(messageId, container);
		return c.json({ success: true, message: `Message ${messageId} refreshed` });
	} catch (error) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

module.exports = app;
