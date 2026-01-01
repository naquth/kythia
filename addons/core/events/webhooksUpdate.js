/**
 * @namespace: addons/core/events/webhooksUpdate.js
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
const Sentry = require('@sentry/node');

module.exports = async (bot, channel) => {
	if (!channel.guild) return;
	const container = bot.client.container;
	const { models, helpers, logger, t } = container;
	const { ServerSetting } = models;
	const { convertColor } = helpers.color;
	const guildId = channel.guild.id;

	try {
		const settings = await ServerSetting.getCache({
			guildId: channel.guild.id,
		});
		if (!settings || !settings.auditLogChannelId) return;

		const logChannel = await channel.guild.channels
			.fetch(settings.auditLogChannelId)
			.catch(() => null);
		if (!logChannel || !logChannel.isTextBased()) return;

		// Check for webhook creation, update, or deletion
		const createAudit = await channel.guild.fetchAuditLogs({
			type: AuditLogEvent.WebhookCreate,
			limit: 1,
		});

		const updateAudit = await channel.guild.fetchAuditLogs({
			type: AuditLogEvent.WebhookUpdate,
			limit: 1,
		});

		const deleteAudit = await channel.guild.fetchAuditLogs({
			type: AuditLogEvent.WebhookDelete,
			limit: 1,
		});

		const createEntry = createAudit.entries.find(
			(e) =>
				e.extra?.channel?.id === channel.id &&
				e.createdTimestamp > Date.now() - 5000,
		);

		const updateEntry = updateAudit.entries.find(
			(e) =>
				e.extra?.channel?.id === channel.id &&
				e.createdTimestamp > Date.now() - 5000,
		);

		const deleteEntry = deleteAudit.entries.find(
			(e) =>
				e.extra?.channel?.id === channel.id &&
				e.createdTimestamp > Date.now() - 5000,
		);

		const entry = createEntry || updateEntry || deleteEntry;
		if (!entry) return;

		const action = createEntry
			? 'Created'
			: updateEntry
				? 'Updated'
				: 'Deleted';
		const color = createEntry ? 'Green' : updateEntry ? 'Blurple' : 'Red';
		const executor = entry.executor;

		const components = [
			new ContainerBuilder()
				.setAccentColor(convertColor(color, { from: 'discord', to: 'decimal' }))
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`🪝 **Webhook ${action}** by <@${executor?.id || 'Unknown'}>\n\n` +
							`**Channel:** <#${channel.id}>\n` +
							`**Webhook Name:** ${entry.target?.name || 'Unknown'}` +
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
				)
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						await t({ guildId }, 'common.container.footer', {
							username: bot.client.user.username,
						}),
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
		logger.error(err, { label: 'webhooksUpdate' });
		if (bot.config?.sentry?.dsn) {
			Sentry.captureException(err);
		}
	}
};
