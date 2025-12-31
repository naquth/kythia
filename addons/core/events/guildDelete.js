/**
 * @namespace: addons/core/events/guildDelete.js
 * @type: Event Handler
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	MessageFlags,
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
} = require('discord.js');

module.exports = async (bot, guild) => {
	const container = bot.client.container;
	const { t, kythiaConfig, helpers } = container;
	const { convertColor } = helpers.color;

	const webhookUrl = kythiaConfig.api.webhookGuildInviteLeave;
	if (webhookUrl) {
		try {
			const accentColor = convertColor('Red', {
				from: 'discord',
				to: 'decimal',
			});

			const leaveContainer = new ContainerBuilder()
				.setAccentColor(accentColor)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						await t(
							guild,
							'core.events.guildDelete.events.guild.delete.webhook.desc',
							{
								bot: guild.client.user.username,
								guild: guild.name,
								guildId: guild.id,
								ownerId: guild.ownerId,
								memberCount: guild.memberCount ?? '?',
								createdAt: guild.createdAt.toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								}),
							},
						),
					),
				)
				.addSeparatorComponents(
					new SeparatorBuilder()
						.setSpacing(SeparatorSpacingSize.Small)
						.setDivider(true),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`-# Guild Delete Event | ${bot.client.user.username}`,
					),
				);

			const url = new URL(webhookUrl);
			url.searchParams.append('wait', 'true');
			url.searchParams.append('with_components', 'true');

			const payload = {
				flags: MessageFlags.IsComponentsV2,
				components: [leaveContainer.toJSON()],
			};

			await fetch(url.href, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
		} catch (err) {
			console.error('Failed to send guild delete webhook:', err);
		}
	}
};
