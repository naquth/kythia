/**
 * @namespace: addons/core/events/autoModerationRuleUpdate.js
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

module.exports = async (bot, oldRule, newRule) => {
	if (!newRule.guild) return;
	const container = bot.client.container;
	const { models, helpers } = container;
	const { ServerSetting } = models;
	const { convertColor } = helpers.color;

	try {
		const settings = await ServerSetting.getCache({
			guildId: newRule.guild.id,
		});
		if (!settings || !settings.auditLogChannelId) return;

		const logChannel = await newRule.guild.channels
			.fetch(settings.auditLogChannelId)
			.catch(() => null);
		if (!logChannel || !logChannel.isTextBased()) return;

		const audit = await newRule.guild.fetchAuditLogs({
			type: AuditLogEvent.AutoModerationRuleUpdate,
			limit: 1,
		});

		const entry = audit.entries.find(
			(e) =>
				e.target?.id === newRule.id && e.createdTimestamp > Date.now() - 5000,
		);

		if (!entry) return;

		const changes = [];
		if (oldRule.name !== newRule.name) {
			changes.push(`**Name**: \`${oldRule.name}\` ➔ \`${newRule.name}\``);
		}
		if (oldRule.enabled !== newRule.enabled) {
			changes.push(
				`**Enabled**: \`${oldRule.enabled ? 'Yes' : 'No'}\` ➔ \`${newRule.enabled ? 'Yes' : 'No'}\``,
			);
		}

		if (changes.length === 0) return;

		const executor = entry.executor;
		const components = [
			new ContainerBuilder()
				.setAccentColor(
					convertColor('Blurple', { from: 'discord', to: 'decimal' }),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`🛡️ **AutoMod Rule Updated** by <@${executor?.id || 'Unknown'}>\n\n` +
							`**Rule:** ${newRule.name}\n\n` +
							`**Changes:**\n${changes.join('\n')}` +
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
		console.error('Error in autoModerationRuleUpdate audit log:', err);
	}
};
