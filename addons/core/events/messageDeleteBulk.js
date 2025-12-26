/**
 * @namespace: addons/core/events/messageDeleteBulk.js
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

module.exports = async (bot, messages, channel) => {
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

		const audit = await channel.guild.fetchAuditLogs({
			type: AuditLogEvent.MessageBulkDelete,
			limit: 1,
		});

		const entry = audit.entries.find(
			(e) =>
				e.extra?.channel?.id === channel.id &&
				e.createdTimestamp > Date.now() - 5000,
		);

		if (!entry) return;

		const executor = entry.executor;
		const messageIds = Array.from(messages.keys()).slice(0, 10).join(', ');
		const components = [
			new ContainerBuilder()
				.setAccentColor(convertColor('Red', { from: 'discord', to: 'decimal' }))
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`🗑️ **Bulk Message Delete** by <@${executor?.id || 'Unknown'}>\n\n` +
							`**Channel:** <#${channel.id}>\n` +
							`**Messages Deleted:** ${messages.size}\n` +
							`**Message IDs:** ${messageIds}${messages.size > 10 ? '...' : ''}` +
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
		console.error('Error in messageBulkDelete audit log:', err);
	}
};
