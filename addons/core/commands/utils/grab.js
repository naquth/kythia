/**
 * @namespace: addons/core/commands/utils/grab.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	MessageFlags,
	SlashCommandBuilder,
	PermissionFlagsBits,
	ApplicationCommandType,
	ContextMenuCommandBuilder,
} = require('discord.js');

function parseCustomEmoji(str) {
	const match = str.match(/<?a?:?(\w+):(\d+)>?/);
	if (!match) return null;
	const [, name, id] = match;
	const isAnimated = str.startsWith('<a:');
	return { name, id, isAnimated };
}

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('grab')
		.setDescription('🛍️ grab stickers or emojis from messages.')
		.addSubcommand((sub) =>
			sub
				.setName('sticker')
				.setDescription('grab a sticker from a message')
				.addStringOption((opt) =>
					opt
						.setName('sticker_id')
						.setDescription('Sticker ID to grab')
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('emoji')
				.setDescription('grab a custom emoji from a message')
				.addStringOption((opt) =>
					opt
						.setName('emoji')
						.setDescription('Emoji to grab (custom emoji format)')
						.setRequired(true),
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuildExpressions),

	contextMenuCommand: new ContextMenuCommandBuilder()
		.setName('Grab Sticker/Emoji')
		.setType(ApplicationCommandType.Message),

	contextMenuDescription: '🛍️ Grab sticker or emoji from this message.',

	permissions: PermissionFlagsBits.ManageGuildExpressions,
	botPermissions: PermissionFlagsBits.ManageGuildExpressions,
	voteLocked: true,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, helpers } = container;
		const { simpleContainer } = helpers.discord;

		if (
			interaction.isChatInputCommand?.() &&
			interaction.commandName === 'grab'
		) {
			const sub = interaction.options.getSubcommand();
			if (sub === 'sticker') {
				await interaction.deferReply();
				const stickerId = interaction.options.getString('sticker_id');
				try {
					const sticker = await interaction.client.fetchSticker(stickerId);
					if (!sticker) {
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.utils.grab.sticker.not.found'),
							{ color: 'Red' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}

					if (!interaction.guild?.stickers?.create) {
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.utils.grab.no.perm.sticker'),
							{ color: 'Red' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}

					const url = sticker.url || sticker.asset;
					if (!url) {
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.utils.grab.sticker.no.url'),
							{ color: 'Red' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					}

					try {
						const created = await interaction.guild.stickers.create({
							file: url,
							name: sticker.name || `stolen_sticker_${sticker.id}`,
							tags: sticker.tags || 'stolen',
						});
						const components = await simpleContainer(
							interaction,
							await t(interaction, 'core.utils.grab.sticker.success', {
								name: created.name,
							}),
							{ color: 'Green' },
						);
						return interaction.editReply({
							components,
							flags: MessageFlags.IsComponentsV2,
						});
					} catch (_e) {
						return interaction.editReply({
							content: await t(interaction, 'core.utils.grab.sticker.manual'),
							files: [url],
						});
					}
				} catch (_err) {
					return interaction.editReply({
						content: await t(interaction, 'core.utils.grab.sticker.error'),
					});
				}
			} else if (sub === 'emoji') {
				await interaction.deferReply();
				const emojiInput = interaction.options.getString('emoji');

				const match = emojiInput.match(/<?a?:?(\w+):(\d+)>?/);
				if (!match) {
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.utils.grab.emoji.invalid'),
						{ color: 'Red' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				const [, name, id] = match;
				const isAnimated = emojiInput.startsWith('<a:');
				const url = `https://cdn.discordapp.com/emojis/${id}.${isAnimated ? 'gif' : 'png'}?v=1`;
				try {
					if (!interaction.guild?.emojis?.create) {
						return interaction.editReply({
							content: await t(interaction, 'core.utils.grab.no.perm.emoji'),
						});
					}
					const created = await interaction.guild.emojis.create({
						attachment: url,
						name,
					});
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.utils.grab.emoji.success', {
							name: created.name,
						}),
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				} catch (_e) {
					return interaction.editReply({
						content: await t(interaction, 'core.utils.grab.emoji.manual'),
						files: [url],
					});
				}
			}
		}

		if (interaction.isMessageContextMenuCommand?.()) {
			await interaction.deferReply({ ephemeral: true });
			const message = interaction.targetMessage;

			if (message?.stickers && message.stickers.size > 0) {
				const sticker = message.stickers.first();
				if (!sticker) {
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.utils.grab.sticker.not.found'),
						{ color: 'Red' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				const url = sticker.url || sticker.asset;
				if (!url) {
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.utils.grab.sticker.no.url'),
						{ color: 'Red' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}

				try {
					if (!interaction.guild?.stickers?.create)
						throw new Error('No permission');
					const created = await interaction.guild.stickers.create({
						file: url,
						name: sticker.name || `stolen_sticker_${sticker.id}`,
						tags: sticker.tags || 'stolen',
					});
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.utils.grab.sticker.success', {
							name: created.name,
						}),
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				} catch (_e) {
					return interaction.editReply({
						content: await t(interaction, 'core.utils.grab.sticker.manual'),
						files: [url],
					});
				}
			}

			const emojiRegex = /<a?:\w+:\d+>/g;
			const found = message?.content?.match?.(emojiRegex);
			if (found && found.length > 0) {
				const emojiData = parseCustomEmoji(found[0]);
				if (!emojiData) {
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.utils.grab.emoji.invalid'),
						{ color: 'Red' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}
				const { name, id, isAnimated } = emojiData;
				const url = `https://cdn.discordapp.com/emojis/${id}.${isAnimated ? 'gif' : 'png'}?v=1`;
				try {
					if (!interaction.guild?.emojis?.create) {
						return interaction.editReply({
							content: await t(interaction, 'core.utils.grab.no.perm.emoji'),
						});
					}
					const created = await interaction.guild.emojis.create({
						attachment: url,
						name,
					});
					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.utils.grab.emoji.success', {
							name: created.name,
						}),
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				} catch (_e) {
					return interaction.editReply({
						content: await t(interaction, 'core.utils.grab.emoji.manual'),
						files: [url],
					});
				}
			}

			// Opsi 3: Cek Attachment (Image)
			const attachment = message?.attachments?.find((a) =>
				a.contentType?.startsWith('image/'),
			);
			if (attachment) {
				const url = attachment.url;
				try {
					if (!interaction.guild?.stickers?.create)
						throw new Error('No permission');

					const created = await interaction.guild.stickers.create({
						file: url,
						name: `grabbed_${attachment.name.split('.')[0]}`.slice(0, 30),
						tags: 'grabbed',
					});

					const components = await simpleContainer(
						interaction,
						await t(interaction, 'core.utils.grab.sticker.success', {
							name: created.name,
						}),
						{ color: 'Green' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				} catch (_e) {
					return interaction.editReply({
						content: await t(interaction, 'core.utils.grab.sticker.manual'),
						files: [url],
					});
				}
			}

			const components = await simpleContainer(
				interaction,
				await t(interaction, 'core.utils.grab.sticker.or.emoji.not.found'),
				{ color: 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
