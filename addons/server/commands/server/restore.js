/**
 * @namespace: addons/server/commands/server/restore.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { MessageFlags, ChannelType, OverwriteType } = require('discord.js');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('restore')
			.setDescription('Restore server structure from a JSON backup file')
			.addAttachmentOption((option) =>
				option
					.setName('file')
					.setDescription('Server backup file (.json)')
					.setRequired(true),
			)
			.addBooleanOption((option) =>
				option
					.setName('clear')
					.setDescription('Delete all channels & roles first?')
					.setRequired(false),
			),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, helpers, logger, kythiaConfig } = container;
		const { simpleContainer } = helpers.discord;
		const { guild } = interaction;

		await interaction.deferReply();

		let components = await simpleContainer(
			interaction,
			`## ${await t(interaction, 'server.server.restore.progress.start')}`,
			{ color: kythiaConfig.bot.color },
		);
		await interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});

		const file = interaction.options.getAttachment('file');
		if (!file || !file.name.endsWith('.json')) {
			components = await simpleContainer(
				interaction,
				`## ${await t(interaction, 'server.server.restore.file.invalid')}`,
				{ color: 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const fetchAssetBuffer = async (url) => {
			if (!url) return null;
			const { default: fetch } = await import('node-fetch');
			const res = await fetch(url);
			if (!res.ok) throw new Error(`Failed to download asset from ${url}`);
			return Buffer.from(await res.arrayBuffer());
		};

		try {
			const { default: fetch } = await import('node-fetch');
			const res = await fetch(file.url);
			const backup = await res.json();
			const clearBefore = interaction.options.getBoolean('clear') ?? false;

			if (!backup) {
				components = await simpleContainer(
					interaction,
					`## ${await t(interaction, 'server.server.restore.data.invalid')}`,
					{ color: 'Red' },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			if (clearBefore) {
				await simpleContainer(
					interaction,
					`## ${await t(interaction, 'server.server.restore.clearing')}`,
					{ color: kythiaConfig.bot.color, editReply: true },
				);
				await Promise.all(
					guild.channels.cache.map((c) => c.delete().catch(() => {})),
				);
				await Promise.all(
					guild.roles.cache
						.filter((r) => r.editable && r.name !== '@everyone')
						.map((r) => r.delete().catch(() => {})),
				);
				await Promise.all(
					guild.emojis.cache.map((e) => e.delete().catch(() => {})),
				);
				await guild.stickers
					.fetch()
					.then((stickers) =>
						Promise.all(stickers.map((s) => s.delete().catch(() => {}))),
					);
			}

			await simpleContainer(
				interaction,
				`## ${await t(interaction, 'server.server.restore.settings')}`,
				{ color: kythiaConfig.bot.color, editReply: true },
			);
			const settings = backup.settings;
			await guild
				.edit({
					name: settings.name,
					verificationLevel: settings.verificationLevel,
					explicitContentFilter: settings.explicitContentFilter,
					defaultMessageNotifications: settings.defaultMessageNotifications,
					icon: await fetchAssetBuffer(settings.iconURL),
					banner: await fetchAssetBuffer(settings.bannerURL),
				})
				.catch((e) =>
					logger.warn(`Failed to update server settings: ${e.message}`, {
						label: 'restore',
					}),
				);

			await simpleContainer(
				interaction,
				`## ${await t(interaction, 'server.server.restore.roles.text')}`,
				{ color: kythiaConfig.bot.color, editReply: true },
			);
			const roleMap = new Map();
			let roleIdx = 0;
			for (const roleData of backup.roles.slice().reverse()) {
				const role = await guild.roles
					.create({
						name: roleData.name,
						color: roleData.color,
						hoist: roleData.hoist,
						permissions: BigInt(roleData.permissions),
						mentionable: roleData.mentionable,
						reason: 'Restore backup',
					})
					.catch(() => null);
				if (role) roleMap.set(roleData.id, role);
				roleIdx++;
				if (roleIdx % 5 === 0 || roleIdx === backup.roles.length) {
					await simpleContainer(
						interaction,
						`## ${await t(interaction, 'server.server.restore.roles.progress', { current: roleIdx, total: backup.roles.length })}`,
						{ color: kythiaConfig.bot.color, editReply: true },
					);
				}
			}

			await simpleContainer(
				interaction,
				`## ${await t(interaction, 'server.server.restore.channels.text')}`,
				{ color: kythiaConfig.bot.color, editReply: true },
			);
			const categoryMap = new Map();
			let catIdx = 0;
			const categories = backup.channels.filter(
				(c) => c.type === ChannelType.GuildCategory,
			);
			for (const catData of categories) {
				const category = await guild.channels.create({
					name: catData.name,
					type: ChannelType.GuildCategory,
					position: catData.position,
				});
				categoryMap.set(catData.name, category);
				catIdx++;
				if (catIdx % 2 === 0 || catIdx === categories.length) {
					await simpleContainer(
						interaction,
						`## ${await t(interaction, 'server.server.restore.categories.progress', { current: catIdx, total: categories.length })}`,
						{ color: kythiaConfig.bot.color, editReply: true },
					);
				}
			}

			let chIdx = 0;
			const nonCatChannels = backup.channels.filter(
				(c) => c.type !== ChannelType.GuildCategory,
			);
			for (const chanData of nonCatChannels) {
				const parent = chanData.parent
					? categoryMap.get(chanData.parent)?.id
					: null;
				await guild.channels.create({
					name: chanData.name,
					type: chanData.type,
					topic: chanData.topic,
					nsfw: chanData.nsfw,
					rateLimitPerUser: chanData.rateLimitPerUser,
					position: chanData.position,
					parent,
					permissionOverwrites: chanData.permissionOverwrites?.map((po) => ({
						id: roleMap.get(po.id)?.id || po.id,
						allow: BigInt(po.allow),
						deny: BigInt(po.deny),
						type:
							po.type === 'role' ? OverwriteType.Role : OverwriteType.Member,
					})),
				});
				chIdx++;
				if (chIdx % 5 === 0 || chIdx === nonCatChannels.length) {
					await simpleContainer(
						interaction,
						`## ${await t(interaction, 'server.server.restore.channels.progress', { current: chIdx, total: nonCatChannels.length })}`,
						{ color: kythiaConfig.bot.color, editReply: true },
					);
				}
			}

			await simpleContainer(
				interaction,
				`## ${await t(interaction, 'server.server.restore.assets')}`,
				{ color: kythiaConfig.bot.color, editReply: true },
			);
			const assetPromises = [];
			backup.emojis?.forEach((emoji) => {
				assetPromises.push(
					fetchAssetBuffer(emoji.url)
						.then((buffer) =>
							guild.emojis.create({ name: emoji.name, attachment: buffer }),
						)
						.catch((e) =>
							logger.warn(`Failed to restore emoji: ${e.message}`, {
								label: 'restore',
							}),
						),
				);
			});
			backup.stickers?.forEach((sticker) => {
				assetPromises.push(
					fetchAssetBuffer(sticker.url)
						.then((buffer) =>
							guild.stickers.create({
								name: sticker.name,
								tags: sticker.tags.split(',')[0],
								file: buffer,
							}),
						)
						.catch((e) =>
							logger.warn(`Failed to restore sticker: ${e.message}`, {
								label: 'restore',
							}),
						),
				);
			});
			backup.soundboard?.forEach((sound) => {
				assetPromises.push(
					fetchAssetBuffer(sound.url)
						.then((buffer) =>
							guild.soundboard.sounds.create({
								name: sound.name,
								sound: buffer,
								emoji: sound.emoji,
							}),
						)
						.catch((e) =>
							logger.warn(`Failed to restore sound: ${e.message}`, {
								label: 'restore',
							}),
						),
				);
			});
			await Promise.allSettled(assetPromises);

			components = await simpleContainer(
				interaction,
				`## ${await t(interaction, 'server.server.restore.success', { name: backup.metadata.guildName })}`,
				{ color: 'Green' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (err) {
			logger.error(err);
			components = await simpleContainer(
				interaction,
				`## ${await t(interaction, 'server.server.restore.failed')}`,
				{ color: 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
