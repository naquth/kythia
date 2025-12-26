/**
 * @namespace: addons/core/events/roleUpdate.js
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

function formatChanges(changes) {
	if (!changes || changes.length === 0) return 'No changes detected.';
	return changes
		.map((change) => {
			const key = change.key
				.replace(/_/g, ' ')
				.replace(/\b\w/g, (l) => l.toUpperCase());
			const oldValue = change.old ?? 'Nothing';
			const newValue = change.new ?? 'Nothing';

			return `**${key}**: \`${oldValue}\` ➔ \`${newValue}\``;
		})
		.join('\n');
}

module.exports = async (bot, _oldRole, newRole) => {
	if (!newRole.guild) return;
	const container = bot.client.container;
	const { models, helpers } = container;
	const { ServerSetting } = models;
	const { convertColor } = helpers.color;

	try {
		const settings = await ServerSetting.getCache({
			guildId: newRole.guild.id,
		});
		if (!settings || !settings.auditLogChannelId) return;

		const logChannel = await newRole.guild.channels
			.fetch(settings.auditLogChannelId)
			.catch(() => null);
		if (!logChannel || !logChannel.isTextBased()) return;

		const audit = await newRole.guild.fetchAuditLogs({
			type: AuditLogEvent.RoleUpdate,
			limit: 1,
		});

		const entry = audit.entries.find(
			(e) =>
				e.target?.id === newRole.id && e.createdTimestamp > Date.now() - 5000,
		);

		if (!entry) return;

		const executor = entry.executor;
		const components = [
			new ContainerBuilder()
				.setAccentColor(
					convertColor('Blurple', { from: 'discord', to: 'decimal' }),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`🔄 **Role Updated** by <@${executor?.id || 'Unknown'}>\n\n` +
							`**Role:** <@&${newRole.id}>\n\n` +
							`**Changes:**\n${formatChanges(entry.changes)}` +
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
		console.error('Error in guildRoleUpdate audit log:', err);
	}
};
