/**
 * @namespace: addons/core/events/channelDelete.js
 * @type: Event Handler
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	AuditLogEvent,
	ChannelType,
	MessageFlags,
	ContainerBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
	SeparatorSpacingSize,
} = require('discord.js');
const Sentry = require('@sentry/node');

/**
 * Handle anti-nuke system for channel deletion spam.
 */
async function handleAntiNuke(bot, channel, entry) {
	if (!entry || !entry.executor || entry.executor.bot) return;

	const container = bot.client.container;
	const { t, models, logger } = container;
	const { ServerSetting } = models;

	if (!bot.client.channelDeleteTracker) {
		bot.client.channelDeleteTracker = new Map();
	}
	const userActionMap = bot.client.channelDeleteTracker;

	const MAX_ACTIONS = 3;
	const TIME_WINDOW = 10000;
	const userId = entry.executor.id;
	const guildId = channel.guild.id;
	const now = Date.now();

	if (!userActionMap.has(guildId)) userActionMap.set(guildId, new Map());
	const guildData = userActionMap.get(guildId);

	const userData = guildData.get(userId) || { count: 0, last: 0 };

	const diff = now - userData.last;
	userData.count = diff < TIME_WINDOW ? userData.count + 1 : 1;
	userData.last = now;

	guildData.set(userId, userData);

	if (userData.count >= MAX_ACTIONS) {
		const member = await channel.guild.members.fetch(userId).catch(() => null);
		if (!member || !member.kickable) return;

		try {
			await member.kick(
				await t(
					channel.guild,
					'core.events.channelDelete.events.channel.delete.antinuke.reason',
				),
			);

			const settings = await ServerSetting.getCache({
				guildId: channel.guild.id,
			});
			if (!settings || !settings.auditLogChannelId) return;

			const logChannel = await channel.guild.channels
				.fetch(settings.auditLogChannelId)
				.catch(() => null);
			if (logChannel?.isTextBased()) {
				const message = await t(
					channel.guild,
					'core.events.channelDelete.events.channel.delete.antinuke.kick.log',
					{
						user: member.user.tag,
					},
				);
				await logChannel.send(message);
			}
		} catch (err) {
			logger.error(
				`Failed to kick member for anti-nuke (channelDelete):`,
				err,
				{
					label: 'core:events:channelDelete',
				},
			);
		}

		userData.count = 0;
		guildData.set(userId, userData);
	}
}

module.exports = async (bot, channel) => {
	if (!channel.guild) return;
	const container = bot.client.container;
	const { models, helpers, logger } = container;
	const { ServerSetting } = models;
	const { convertColor } = helpers.color;

	try {
		const audit = await channel.guild.fetchAuditLogs({
			type: AuditLogEvent.ChannelDelete,
			limit: 1,
		});

		// Try to match by .target?.id first (like in update), fallback to name if not found
		let entry = audit.entries.find(
			(e) =>
				e.target?.id === channel.id && e.createdTimestamp > Date.now() - 5000,
		);

		if (!entry) {
			entry = audit.entries.find(
				(e) =>
					e.changes?.some((c) => c.key === 'name' && c.old === channel.name) &&
					e.createdTimestamp > Date.now() - 5000,
			);
		}

		await handleAntiNuke(bot, channel, entry);

		// Send audit log embed if audit entry found and server configured
		const settings = await ServerSetting.getCache({
			guildId: channel.guild.id,
		});
		if (!settings || !settings.auditLogChannelId) return;

		const logChannel = await channel.guild.channels
			.fetch(settings.auditLogChannelId)
			.catch(() => null);
		const executor = entry.executor;
		const channelTypeNames = {
			[ChannelType.GuildText]: 'Text Channel',
			[ChannelType.GuildVoice]: 'Voice Channel',
			[ChannelType.GuildCategory]: 'Category',
			[ChannelType.GuildAnnouncement]: 'Announcement Channel',
			[ChannelType.AnnouncementThread]: 'Announcement Thread',
			[ChannelType.PublicThread]: 'Public Thread',
			[ChannelType.PrivateThread]: 'Private Thread',
			[ChannelType.GuildStageVoice]: 'Stage Channel',
			[ChannelType.GuildForum]: 'Forum Channel',
			[ChannelType.GuildMedia]: 'Media Channel',
			[ChannelType.GuildDirectory]: 'Directory Channel',
			[ChannelType.GuildStore]: 'Store Channel',
			[ChannelType.DM]: 'Direct Message',
			[ChannelType.GroupDM]: 'Group DM',
		};
		const channelTypeName =
			channelTypeNames[channel.type] || `Unknown (${channel.type})`;

		const components = [
			new ContainerBuilder()
				.setAccentColor(convertColor('Red', { from: 'discord', to: 'decimal' }))
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`🗑️ **Channel Deleted** by <@${executor?.id || 'Unknown'}>\n\n` +
							`**Channel Name:** ${channel.name || 'Unknown'}\n` +
							`**Type:** ${channelTypeName}` +
							(entry.reason ? `\n\n**Reason:** ${entry.reason}` : ''),
					),
				)
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`👤 **Executor:** ${executor?.tag || 'Unknown'} (${executor?.id || 'Unknown'})\n` +
							`🕒 **Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`,
					),
				),
		];

		await logChannel.send({
			components,
			flags: MessageFlags.IsComponentsV2,
			allowedMentions: {
				parse: [],
			},
		});
	} catch (err) {
		logger.error('Error fetching audit logs for channelDelete:', err, {
			label: 'core:events:channelDelete',
		});
		if (bot.config?.sentry?.dsn) {
			Sentry.captureException(err);
		}
	}
};
