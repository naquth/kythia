/**
 * @namespace: addons/core/events/guildMemberRemove.js
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

module.exports = async (bot, member) => {
	if (!member.guild) return;
	const container = bot.client.container;
	const { models, helpers } = container;
	const { ServerSetting } = models;
	const { convertColor } = helpers.color;

	try {
		const settings = await ServerSetting.getCache({ guildId: member.guild.id });
		if (!settings || !settings.auditLogChannelId) return;

		const logChannel = await member.guild.channels
			.fetch(settings.auditLogChannelId)
			.catch(() => null);
		if (!logChannel || !logChannel.isTextBased()) return;

		// Check if it was a kick
		const kickAudit = await member.guild.fetchAuditLogs({
			type: AuditLogEvent.MemberKick,
			limit: 1,
		});

		const kickEntry = kickAudit.entries.find(
			(e) =>
				e.target?.id === member.id && e.createdTimestamp > Date.now() - 5000,
		);

		if (kickEntry) {
			const executor = kickEntry.executor;
			const components = [
				new ContainerBuilder()
					.setAccentColor(
						convertColor('Red', { from: 'discord', to: 'decimal' }),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							`👢 **Member Kicked** by <@${executor?.id || 'Unknown'}>\n\n` +
								`**User:** ${member.user.tag} (<@${member.user.id}>)\n` +
								`**User ID:** ${member.user.id}\n` +
								`**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>\n` +
								`**Joined Server:** ${member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>` : 'Unknown'}` +
								(kickEntry.reason ? `\n\n**Reason:** ${kickEntry.reason}` : ''),
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
			return;
		}

		// Regular leave (not kicked)
		const components = [
			new ContainerBuilder()
				.setAccentColor(
					convertColor('Orange', { from: 'discord', to: 'decimal' }),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`👋 **Member Left**\n\n` +
							`**User:** ${member.user.tag} (<@${member.user.id}>)\n` +
							`**User ID:** ${member.user.id}\n` +
							`**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>\n` +
							`**Joined Server:**  ${member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>` : 'Unknown'}\n` +
							`**Member Count:** ${member.guild.memberCount}`,
					),
				)
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`👤 **User:** ${member.user.tag}\n` +
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
		console.error('Error in guildMemberRemove audit log:', err);
	}
};
