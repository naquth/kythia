/**
 * @namespace: addons/server/commands/server/backup.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { MessageFlags } = require('discord.js');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('backup')
			.setDescription('Backup server structure to a JSON file'),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, helpers, logger } = container;
		const { simpleContainer } = helpers.discord;
		const { guild } = interaction;

		await interaction.deferReply();

		let components = await simpleContainer(
			interaction,
			`## ${await t(interaction, 'server.server.backup.start')}`,
			{ color: 'Blurple' },
		);
		await interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});

		try {
			const [channels, roles, emojis, stickers] = await Promise.all([
				guild.channels.fetch(),
				guild.roles.fetch(),
				guild.emojis.fetch(),
				guild.stickers.fetch(),
			]);

			const backup = {
				metadata: {
					guildId: guild.id,
					guildName: guild.name,
					createdAt: new Date().toISOString(),
				},
				settings: {
					name: guild.name,
					verificationLevel: guild.verificationLevel,
					explicitContentFilter: guild.explicitContentFilter,
					defaultMessageNotifications: guild.defaultMessageNotifications,
					iconURL: guild.iconURL({ forceStatic: true }),
					bannerURL: guild.bannerURL({ forceStatic: true }),
				},
				roles: roles
					.filter((r) => r.name !== '@everyone')
					.sort((a, b) => b.position - a.position)
					.map((role) => ({
						id: role.id,
						name: role.name,
						color: role.hexColor,
						hoist: role.hoist,
						mentionable: role.mentionable,
						permissions: role.permissions.bitfield.toString(),
						position: role.position,
					})),
				channels: channels.map((ch) => ({
					id: ch.id,
					name: ch.name,
					type: ch.type,
					parent: ch.parent?.name ?? null,
					topic: ch.topic ?? null,
					nsfw: ch.nsfw ?? false,
					rateLimitPerUser: ch.rateLimitPerUser ?? 0,
					position: ch.position,
					permissionOverwrites: ch.permissionOverwrites?.cache.map((po) => ({
						id: po.id,
						type: po.type === 0 ? 'role' : 'member',
						allow: po.allow.bitfield.toString(),
						deny: po.deny.bitfield.toString(),
					})),
				})),
				emojis: emojis.map((e) => ({ id: e.id, name: e.name, url: e.url })),
				stickers: stickers.map((s) => ({
					id: s.id,
					name: s.name,
					tags: s.tags,
					url: s.url,
				})),
			};

			const json = JSON.stringify(backup, null, 2);
			const buffer = Buffer.from(json, 'utf-8');

			if (buffer.length > 10 * 1024 * 1024) {
				components = await simpleContainer(
					interaction,
					`## ${await t(interaction, 'server.server.backup.too.large')}`,
					{ color: 'Red' },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			components = await simpleContainer(
				interaction,
				`## ${await t(interaction, 'server.server.backup.success', { name: guild.name })}`,
				{ color: 'Green' },
			);
			return interaction.editReply({
				components,
				files: [{ attachment: buffer, name: `server-backup-${guild.id}.json` }],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (err) {
			logger.error('Server backup error:', err, { label: 'server:backup' });
			components = await simpleContainer(
				interaction,
				`## ${await t(interaction, 'server.server.backup.failed')}`,
				{ color: 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
