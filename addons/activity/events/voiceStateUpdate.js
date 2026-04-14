/**
 * @namespace: addons/activity/events/voiceStateUpdate.js
 * @type: Event Handler
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

/**
 * Tracks active voice sessions for activity stats.
 * Key: `${guildId}-${userId}`
 * Value: { joinedAt: number } — timestamp (ms) when the user joined.
 *
 * We only write to the DB on state change (leave / move to AFK),
 * never on a per-second tick, keeping writes minimal.
 */
const voiceSessions = new Map();

/**
 * Flush accumulated voice time (in seconds) to the DB.
 *
 * @param {import('kythia-core').Kythia} bot
 * @param {string} guildId
 * @param {string} userId
 * @param {number} durationSeconds
 */
const flushVoiceTime = async (bot, guildId, userId, durationSeconds) => {
	if (durationSeconds <= 0) return;

	const { models, logger } = bot.client.container;
	const { ActivityStat } = models;

	try {
		let stat = await ActivityStat.getCache({ guildId, userId });

		if (!stat) {
			stat = await ActivityStat.create({
				guildId,
				userId,
				totalMessages: 0,
				totalVoiceTime: durationSeconds,
			});
		} else {
			stat.totalVoiceTime =
				BigInt(stat.totalVoiceTime) + BigInt(durationSeconds);
			stat.changed('totalVoiceTime', true);
			await stat.save();
		}
	} catch (err) {
		logger.error(
			`Failed to flush voice time for ${userId} in ${guildId}: ${err.message}`,
			{ label: 'activity:voiceStateUpdate' },
		);
	}
};

/**
 * @param {import('kythia-core').Kythia} bot
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
 */
module.exports = async (bot, oldState, newState) => {
	const member = newState.member || oldState.member;
	if (!member || member.user.bot) return;

	const guildId = (newState.guild || oldState.guild)?.id;
	if (!guildId) return;

	const { models } = bot.client.container;
	const { ServerSetting } = models;

	// Feature flag check
	const serverSetting = await ServerSetting.getCache({ guildId });
	if (!serverSetting || !serverSetting.activityOn) return;

	const userId = member.id;
	const key = `${guildId}-${userId}`;
	const now = Date.now();

	const isJoin = !oldState.channelId && newState.channelId;
	const isLeave = oldState.channelId && !newState.channelId;
	const isMove =
		oldState.channelId &&
		newState.channelId &&
		oldState.channelId !== newState.channelId;

	if (isJoin) {
		// Start tracking: record join timestamp
		voiceSessions.set(key, { joinedAt: now });
		return;
	}

	// On leave or channel move: flush elapsed time and (for a move) restart the session
	if (isLeave || isMove) {
		const session = voiceSessions.get(key);

		if (session) {
			const elapsedSeconds = Math.floor((now - session.joinedAt) / 1000);
			voiceSessions.delete(key);

			// Fire-and-forget flush (non-blocking for the event loop)
			flushVoiceTime(bot, guildId, userId, elapsedSeconds);
		}

		if (isMove) {
			// Continue tracking in the new channel
			voiceSessions.set(key, { joinedAt: now });
		}
	}
};
