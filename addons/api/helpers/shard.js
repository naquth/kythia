/**
 * @namespace: addons/api/helpers/shard.js
 * @type: Helper Script
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

/**
 * Collect the guild list from every shard and flatten into one array.
 *
 * @param {import('discord.js').Client} client
 * @returns {Promise<Array<{id:string,name:string,icon:string|null,memberCount:number,ownerId:string}>>}
 */
async function broadcastGetGuilds(client) {
	if (!client.shard) {
		// Non-sharded fallback
		return client.guilds.cache.map((g) => ({
			id: g.id,
			name: g.name,
			icon: g.iconURL(),
			memberCount: g.memberCount,
			ownerId: g.ownerId,
			shardId: 0,
		}));
	}

	/** @type {Array<Array<object>>} */
	const results = await client.shard.broadcastEval((c) => {
		const shardId = c.shard?.ids?.[0] ?? 0;
		return c.guilds.cache.map((g) => ({
			id: g.id,
			name: g.name,
			icon: g.iconURL(),
			memberCount: g.memberCount,
			ownerId: g.ownerId,
			shardId,
		}));
	});

	// results is [ [guilds from shard 0], [guilds from shard 1], … ]
	return results.flat();
}

/**
 * Find a single guild across all shards.
 * Returns null if the bot is not in that guild on any shard.
 *
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @returns {Promise<{
 *   shardId: number,
 *   guild: { id:string, name:string, icon:string|null },
 *   channels: { text: object[], voice: object[], categories: object[] },
 *   roles: object[],
 *   botUser: { username:string, avatar:string, id:string, discriminator:string }
 * } | null>}
 */
async function broadcastFindGuild(client, guildId) {
	if (!client.shard) {
		// Non-sharded fallback
		const guild = client.guilds.cache.get(guildId);
		if (!guild) return null;
		return _extractGuildData(guild, client, 0);
	}

	/** @type {Array<object|null>} */
	const results = await client.shard.broadcastEval(
		(c, { id }) => {
			const g = c.guilds.cache.get(id);
			if (!g) return null;

			const shardIds = c.shard?.ids ?? [0];

			return {
				shardId: shardIds[0],
				guild: { id: g.id, name: g.name, icon: g.iconURL() },
				channels: {
					text: g.channels.cache
						.filter((ch) => ch.type === 0)
						.map((ch) => ({ id: ch.id, name: ch.name })),
					voice: g.channels.cache
						.filter((ch) => ch.type === 2)
						.map((ch) => ({ id: ch.id, name: ch.name })),
					categories: g.channels.cache
						.filter((ch) => ch.type === 4)
						.map((ch) => ({ id: ch.id, name: ch.name })),
				},
				roles: g.roles.cache.map((r) => ({
					id: r.id,
					name: r.name,
					color: r.hexColor,
					managed: r.managed,
				})),
				botUser: {
					username: c.user.username,
					avatar: c.user.displayAvatarURL(),
					id: c.user.id,
					discriminator: c.user.discriminator,
				},
			};
		},
		{ context: { id: guildId } },
	);

	// Find the first shard that had the guild
	return results.find((r) => r !== null) ?? null;
}

/**
 * Collect aggregate stats (guild count, user count) from all shards.
 *
 * @param {import('discord.js').Client} client
 * @returns {Promise<{guilds: number, users: number}>}
 */
async function broadcastGetStats(client) {
	if (!client.shard) {
		return {
			guilds: client.guilds.cache.size,
			users: client.users.cache.size,
		};
	}

	const [guildCounts, userCounts] = await Promise.all([
		client.shard.fetchClientValues('guilds.cache.size'),
		client.shard.fetchClientValues('users.cache.size'),
	]);

	return {
		guilds: guildCounts.reduce((acc, n) => acc + n, 0),
		users: userCounts.reduce((acc, n) => acc + n, 0),
	};
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extract the same shape as broadcastFindGuild from a local Guild object.
 * Used by the non-sharded fallback path.
 */
function _extractGuildData(guild, client, shardId) {
	return {
		shardId,
		guild: { id: guild.id, name: guild.name, icon: guild.iconURL() },
		channels: {
			text: guild.channels.cache
				.filter((ch) => ch.type === 0)
				.map((ch) => ({ id: ch.id, name: ch.name })),
			voice: guild.channels.cache
				.filter((ch) => ch.type === 2)
				.map((ch) => ({ id: ch.id, name: ch.name })),
			categories: guild.channels.cache
				.filter((ch) => ch.type === 4)
				.map((ch) => ({ id: ch.id, name: ch.name })),
		},
		roles: guild.roles.cache.map((r) => ({
			id: r.id,
			name: r.name,
			color: r.hexColor,
			managed: r.managed,
		})),
		botUser: {
			username: client.user.username,
			avatar: client.user.displayAvatarURL(),
			id: client.user.id,
			discriminator: client.user.discriminator,
		},
	};
}

/**
 * Collect aggregate meta stats (server count + total member count) from all shards.
 * Used by the /api/meta/stats endpoint.
 *
 * @param {import('discord.js').Client} client
 * @returns {Promise<{totalServers: number, totalMembers: number}>}
 */
async function broadcastGetMeta(client) {
	if (!client.shard) {
		return {
			totalServers: client.guilds.cache.size,
			totalMembers: client.guilds.cache.reduce(
				(acc, g) => acc + (g.memberCount || 0),
				0,
			),
		};
	}

	const results = await client.shard.broadcastEval((c) => ({
		servers: c.guilds.cache.size,
		members: c.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0),
	}));

	return {
		totalServers: results.reduce((acc, r) => acc + r.servers, 0),
		totalMembers: results.reduce((acc, r) => acc + r.members, 0),
	};
}

/**
 * Collect detailed statistics for each shard.
 *
 * @param {import('discord.js').Client} client
 * @returns {Promise<Array<{id: number, ping: number, guilds: number, members: number, uptime: number, ram_usage: number}>>}
 */
async function broadcastGetDetailedShards(client) {
	if (!client.shard) {
		return [
			{
				id: 0,
				ping: Math.round(client.ws.ping),
				guilds: client.guilds.cache.size,
				members: client.guilds.cache.reduce(
					(acc, g) => acc + (g.memberCount || 0),
					0,
				),
				uptime: client.uptime,
				ram_usage: process.memoryUsage().rss,
			},
		];
	}

	const results = await client.shard.broadcastEval((c) => ({
		id: c.shard.ids[0],
		ping: Math.round(c.ws.ping),
		guilds: c.guilds.cache.size,
		members: c.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0),
		uptime: c.uptime,
		ram_usage: process.memoryUsage().rss,
	}));

	return results.sort((a, b) => a.id - b.id);
}

/**
 * Edit the bot's GuildMember on the shard that owns the given guild.
 * Returns `true` if the edit was applied, `false` if the guild wasn't found on any shard.
 * Throws if Discord rejects the edit (propagate to the caller for error handling).
 *
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @param {{ nick?: string|null, avatar?: string|null }} payload  Fields to pass to GuildMember#edit()
 * @returns {Promise<boolean>}
 */
async function broadcastEditMember(client, guildId, payload) {
	if (!client.shard) {
		const guild = client.guilds.cache.get(guildId);
		if (!guild) return false;
		await guild.members.me.edit(payload);
		return true;
	}

	const results = await client.shard.broadcastEval(
		async (c, { id, editPayload }) => {
			const g = c.guilds.cache.get(id);
			if (!g) return null; // not on this shard
			await g.members.me.edit(editPayload);
			return true;
		},
		{ context: { id: guildId, editPayload: payload } },
	);

	// true if any shard actually applied the edit
	return results.some((r) => r === true);
}

module.exports = {
	broadcastGetGuilds,
	broadcastFindGuild,
	broadcastGetStats,
	broadcastGetMeta,
	broadcastGetDetailedShards,
	broadcastEditMember,
};
