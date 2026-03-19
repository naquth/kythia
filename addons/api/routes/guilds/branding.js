/**
 * @namespace: addons/api/routes/guilds/branding.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { Hono } = require('hono');
const {
	broadcastFindGuild,
	broadcastEditMember,
} = require('../../helpers/shard');

const app = new Hono();

app.patch('/:guildId', async (c) => {
	const client = c.get('client');
	const container = client.container;
	const { models, logger } = container;
	const { ServerSetting } = models;
	const guildId = c.req.param('guildId');
	const body = await c.req.json();

	// Verify bot is in the guild (cross-shard aware)
	const shardData = await broadcastFindGuild(client, guildId);
	if (!shardData) return c.json({ error: 'Guild not found' }, 404);

	try {
		const updatePayload = {};

		if (body.nickname !== undefined) {
			updatePayload.nick = body.nickname || null;
		}

		if (body.avatar !== undefined) {
			updatePayload.avatar = body.avatar || null;
		}

		if (Object.keys(updatePayload).length > 0) {
			// Edit the bot member on whichever shard owns this guild
			await broadcastEditMember(client, guildId, updatePayload);
		}

		let settings = await ServerSetting.getCache({ where: { guildId } });
		if (!settings) {
			settings = await ServerSetting.create({
				guildId: guildId,
				guildName: shardData.guild.name,
			});
		}

		await settings.update({
			botName: body.nickname,
			botAvatarUrl: body.avatar,
			botBannerUrl: body.banner,
			botBio: body.bio,
		});

		return c.json({ success: true });
	} catch (e) {
		logger.error(`Error: ${e.message || e}`, { label: 'api' });

		if (e.code === 50013) {
			return c.json(
				{ error: 'Bot Missing Permissions: Cannot change nickname/avatar.' },
				403,
			);
		}

		return c.json(
			{ error: 'Failed to update bot profile.', details: e.message },
			500,
		);
	}
});

module.exports = app;
