/**
 * @namespace: addons/core/events/roleDelete.js
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

module.exports = async (bot, role) => {
	if (!role.guild) return;
	const container = bot.client.container;
	const { models, helpers } = container;
	const { ServerSetting } = models;
	const { convertColor } = helpers.color;

	try {
		const settings = await ServerSetting.getCache({ guildId: role.guild.id });
		if (!settings || !settings.auditLogChannelId) return;

		const logChannel = await role.guild.channels
			.fetch(settings.auditLogChannelId)
			.catch(() => null);
		if (!logChannel || !logChannel.isTextBased()) return;

		const audit = await role.guild.fetchAuditLogs({
			type: AuditLogEvent.RoleDelete,
			limit: 1,
		});

		const entry = audit.entries.find(
			(e) => e.target?.id === role.id && e.createdTimestamp > Date.now() - 5000,
		);

		if (!entry) return;

		const executor = entry.executor;
		const components = [
			new ContainerBuilder()
				.setAccentColor(convertColor('Red', { from: 'discord', to: 'decimal' }))
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`➖ **Role Deleted** by <@${executor?.id || 'Unknown'}>\n\n` +
							`**Role Name:** ${role.name}\n` +
							`**Color:** ${role.hexColor || 'Default'}\n` +
							`**Position:** ${role.position}\n` +
							`**Mentionable:** ${role.mentionable ? 'Yes' : 'No'}\n` +
							`**Hoisted:** ${role.hoist ? 'Yes' : 'No'}\n` +
							`**Managed:** ${role.managed ? 'Yes' : 'No'}` +
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
		console.error('Error in guildRoleDelete audit log:', err);
	}
};
