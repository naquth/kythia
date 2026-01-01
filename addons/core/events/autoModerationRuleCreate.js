/**
 * @namespace: addons/core/events/autoModerationRuleCreate.js
 * @type: Event Handler
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { Sentry } = require('@sentry/node');
const {
	AuditLogEvent,
	MessageFlags,
	ContainerBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
	SeparatorSpacingSize,
} = require('discord.js');

module.exports = async (bot, autoModerationRule) => {
	if (!autoModerationRule.guild) return;
	const container = bot.client.container;
	const { models, helpers, logger, t } = container;
	const { ServerSetting } = models;
	const { convertColor } = helpers.color;

	const guildId = autoModerationRule.guild.id;

	try {
		const settings = await ServerSetting.getCache({
			guildId,
		});
		if (!settings || !settings.auditLogChannelId) return;

		const logChannel = await autoModerationRule.guild.channels
			.fetch(settings.auditLogChannelId)
			.catch(() => null);
		if (!logChannel || !logChannel.isTextBased()) return;

		const audit = await autoModerationRule.guild.fetchAuditLogs({
			type: AuditLogEvent.AutoModerationRuleCreate,
			limit: 1,
		});

		const entry = audit.entries.find(
			(e) =>
				e.target?.id === autoModerationRule.id &&
				e.createdTimestamp > Date.now() - 5000,
		);

		if (!entry) return;

		const executor = entry.executor;
		const components = [
			new ContainerBuilder()
				.setAccentColor(
					convertColor('Green', { from: 'discord', to: 'decimal' }),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`🛡️ **AutoMod Rule Created** by <@${executor?.id || 'Unknown'}>\n\n` +
							`**Rule Name:** ${autoModerationRule.name}\n` +
							`**Trigger Type:** ${autoModerationRule.triggerType}\n` +
							`**Enabled:** ${autoModerationRule.enabled ? 'Yes' : 'No'}\n` +
							`**Exempt Roles:** ${autoModerationRule.exemptRoles.size || 'None'}\n` +
							`**Exempt Channels:** ${autoModerationRule.exemptChannels.size || 'None'}` +
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
		logger.error(err, { label: 'autoModerationRuleCreate' });
		if (bot.config?.sentry?.dsn) {
			Sentry.captureException(err);
		}
	}
};
