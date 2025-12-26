/**
 * @namespace: addons/core/events/channelCreate.js
 * @type: Event Handler
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
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
 * Handle anti-nuke system for channel creation spam.
 */
async function handleAntiNuke(bot, channel, entry) {
	if (!entry || !entry.executor || entry.executor.bot) return;

	const container = bot.client.container;
	const { t, models } = container;
	const { ServerSetting } = models;

	if (!bot.client.channelCreateTracker) {
		bot.client.channelCreateTracker = new Map();
	}
	const userActionMap = bot.client.channelCreateTracker;

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
					'core.events.channelCreate.events.channel.create.antinuke.reason',
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
					'core.events.channelCreate.events.channel.create.antinuke.kick.log',
					{
						user: member.user.tag,
					},
				);
				await logChannel.send(message);
			}
		} catch (err) {
			console.error(
				`Failed to kick member for anti-nuke (channelCreate):`,
				err,
			);
		}

		userData.count = 0;
		guildData.set(userId, userData);
	}
}

module.exports = async (bot, channel) => {
	if (!channel.guild) return;
	const container = bot.client.container;
	const { models, helpers } = container;
	const { ServerSetting } = models;
	const { convertColor } = helpers.color;

	try {
		const audit = await channel.guild.fetchAuditLogs({
			type: AuditLogEvent.ChannelCreate,
			limit: 1,
		});

		let entry = audit.entries.find(
			(e) =>
				e.target?.id === channel.id && e.createdTimestamp > Date.now() - 5000,
		);

		if (!entry) {
			entry = audit.entries.find(
				(e) =>
					e.changes?.some((c) => c.key === 'name' && c.new === channel.name) &&
					e.createdTimestamp > Date.now() - 5000,
			);
		}

		await handleAntiNuke(bot, channel, entry);

		const settings = await ServerSetting.getCache({
			guildId: channel.guild.id,
		});
		if (!settings || !settings.auditLogChannelId) return;

		const logChannel = await channel.guild.channels
			.fetch(settings.auditLogChannelId)
			.catch(() => null);
		if (!logChannel || !logChannel.isTextBased() || !entry) return;

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
				.setAccentColor(
					convertColor('Green', { from: 'discord', to: 'decimal' }),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`➕ **Channel Created** by <@${executor?.id || 'Unknown'}>\n\n` +
							`**Channel:** <#${channel.id}>\n` +
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
		console.error('Error fetching audit logs for channelCreate:', err);
		if (bot.config?.sentry?.dsn) {
			Sentry.captureException(err);
		}
	}
};
