/**
 * @namespace: addons/core/events/channelPinsUpdate.js
 * @type: Event Handler
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	AuditLogEvent,
	MessageFlags,
	ContainerBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
	SeparatorSpacingSize,
} = require('discord.js');

module.exports = async (bot, channel, _time) => {
	if (!channel.guild) return;
	const container = bot.client.container;
	const { models, helpers } = container;
	const { ServerSetting } = models;
	const { convertColor } = helpers.color;

	try {
		const settings = await ServerSetting.getCache({
			guildId: channel.guild.id,
		});
		if (!settings || !settings.auditLogChannelId) return;

		const logChannel = await channel.guild.channels
			.fetch(settings.auditLogChannelId)
			.catch(() => null);
		if (!logChannel || !logChannel.isTextBased()) return;

		// Try to determine if it was a pin or unpin
		const pinAudit = await channel.guild.fetchAuditLogs({
			type: AuditLogEvent.MessagePin,
			limit: 1,
		});

		const unpinAudit = await channel.guild.fetchAuditLogs({
			type: AuditLogEvent.MessageUnpin,
			limit: 1,
		});

		const pinEntry = pinAudit.entries.find(
			(e) =>
				e.extra?.channel?.id === channel.id &&
				e.createdTimestamp > Date.now() - 5000,
		);

		const unpinEntry = unpinAudit.entries.find(
			(e) =>
				e.extra?.channel?.id === channel.id &&
				e.createdTimestamp > Date.now() - 5000,
		);

		const entry = pinEntry || unpinEntry;
		if (!entry) return;

		const isPinned = !!pinEntry;
		const executor = entry.executor;

		const components = [
			new ContainerBuilder()
				.setAccentColor(
					convertColor(isPinned ? 'Green' : 'Orange', {
						from: 'discord',
						to: 'decimal',
					}),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`📌 **Message ${isPinned ? 'Pinned' : 'Unpinned'}** by <@${executor?.id || 'Unknown'}>\n\n` +
							`**Channel:** <#${channel.id}>\n` +
							`**Message ID:** ${entry.extra?.messageId || 'Unknown'}` +
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
		console.error('Error in channelPinsUpdate audit log:', err);
	}
};
