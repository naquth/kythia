/**
 * @namespace: addons/leveling/events/voiceStateUpdate.js
 * @type: Event Handler
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { addXp } = require('../helpers');

/**
 * Tracks active voice sessions.
 * Key: `${guildId}-${userId}`
 * Value: { joinedAt: number, lastXpAt: number }
 */
const voiceSessions = new Map();

/**
 * The global XP tick interval handle.
 * Started once on first join, ticks every 30s to award pending XP.
 */
let tickInterval = null;

const TICK_INTERVAL_MS = 30_000; // 30 seconds

const startTick = (botClient) => {
	if (tickInterval) return;
	tickInterval = setInterval(async () => {
		const now = Date.now();
		for (const [key, session] of voiceSessions.entries()) {
			const [guildId, userId] = key.split('-');

			try {
				const { models, helpers } = botClient.container;
				const { ServerSetting } = models;

				const setting = await ServerSetting.getCache({ guildId });
				if (
					!setting ||
					!setting.levelingOn ||
					setting.voiceXpEnabled === false
				) {
					continue;
				}

				// Cooldown in seconds from DB
				const cooldownSeconds =
					typeof setting.voiceXpCooldown === 'number'
						? setting.voiceXpCooldown
						: 180;
				const cooldownMs = cooldownSeconds * 1000;

				if (now - session.lastXpAt < cooldownMs) continue;

				// Check noXpChannels / noXpRoles
				const guild = botClient.guilds.cache.get(guildId);
				if (!guild) continue;

				const member = await helpers.discord.getMemberSafe(guild, userId);
				if (!member) continue;

				// Check if user is still in a voice channel
				const voiceState = guild.voiceStates.cache.get(userId);
				if (!voiceState || !voiceState.channelId) {
					voiceSessions.delete(key);
					continue;
				}

				// Anti-AFK: skip if user is self-deafened or server-deafened
				if (setting.voiceAntiAfk) {
					if (voiceState.selfDeaf || voiceState.serverDeaf) continue;
				}

				// noXpChannels check
				if (
					Array.isArray(setting.noXpChannels) &&
					setting.noXpChannels.includes(voiceState.channelId)
				) {
					continue;
				}

				// noXpRoles check
				if (
					Array.isArray(setting.noXpRoles) &&
					setting.noXpRoles.some((roleId) => member.roles.cache.has(roleId))
				) {
					continue;
				}

				// Minimum members check
				const voiceChannel = guild.channels.cache.get(voiceState.channelId);
				const minMembers =
					typeof setting.voiceMinMembers === 'number'
						? setting.voiceMinMembers
						: 2;
				if (
					voiceChannel &&
					voiceChannel.members.filter((m) => !m.user.bot).size < minMembers
				) {
					continue;
				}

				// Calculate random XP
				const xpMin =
					typeof setting.voiceXpMin === 'number' ? setting.voiceXpMin : 15;
				const xpMax =
					typeof setting.voiceXpMax === 'number' ? setting.voiceXpMax : 40;
				const xpToAdd =
					xpMin === xpMax
						? xpMin
						: Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin;

				session.lastXpAt = now;

				// Create a minimal message-like object that addXp accepts
				const fakeMessage = {
					client: botClient,
					guild,
					author: {
						id: userId,
						username: member.user.username,
						toString: () => `<@${userId}>`,
					},
					channel: null,
				};

				const levelingChannel = setting.levelingChannelId
					? await helpers.discord
							.getTextChannelSafe(guild, setting.levelingChannelId)
							.catch(() => null)
					: null;

				await addXp(guildId, userId, xpToAdd, fakeMessage, levelingChannel);
			} catch (err) {
				botClient.container.logger.error(
					`[leveling:voice] Failed to award XP to ${userId} in ${guildId}:`,
					err,
					{ label: 'leveling:voiceStateUpdate' },
				);
			}
		}
	}, TICK_INTERVAL_MS);
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

	const userId = member.id;
	const key = `${guildId}-${userId}`;
	const now = Date.now();

	const isJoin = !oldState.channelId && newState.channelId;
	const isLeave = oldState.channelId && !newState.channelId;

	if (isJoin) {
		voiceSessions.set(key, { joinedAt: now, lastXpAt: now });
		startTick(bot.client);
	} else if (isLeave) {
		voiceSessions.delete(key);
	}
	// Switches between channels: session stays active, no reset
};
