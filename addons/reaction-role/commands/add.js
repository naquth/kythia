/**
 * @namespace: addons/reaction-role/commands/add.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 1.0.0
 */
const {
	MessageFlags,
	ContainerBuilder,
	TextDisplayBuilder,
	ChannelType,
} = require('discord.js');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('add')
			.setDescription('➕ Add a reaction role to a message.')
			.addStringOption((option) =>
				option
					.setName('message_id')
					.setDescription('The ID of the message.')
					.setRequired(true),
			)
			.addStringOption((option) =>
				option
					.setName('emoji')
					.setDescription('The emoji to react with.')
					.setRequired(true),
			)
			.addRoleOption((option) =>
				option
					.setName('role')
					.setDescription('The role to assign.')
					.setRequired(true),
			)
			.addChannelOption((option) =>
				option
					.setName('channel')
					.setDescription(
						'The channel where the message is (defaults to current).',
					)
					.addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
					.setRequired(false),
			),
	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, models, helpers, logger } = container;
		const { ReactionRole } = models;
		const { convertColor } = helpers.color;

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const messageId = interaction.options.getString('message_id');
		const emojiInput = interaction.options.getString('emoji');
		const role = interaction.options.getRole('role');
		const channel =
			interaction.options.getChannel('channel') || interaction.channel;

		if (!channel || !channel.isTextBased()) {
			return interaction.editReply({
				content: await t(interaction, 'reaction-role.invalid_channel'),
			});
		}

		try {
			const message = await channel.messages.fetch(messageId).catch(() => null);

			if (!message) {
				return interaction.editReply({
					content: await t(interaction, 'reaction-role.invalid_message'),
				});
			}

			// Validate emoji by trying to react
			try {
				await message.react(emojiInput);
			} catch (error) {
				logger.error(error, { label: 'reaction-role:react' });
				return interaction.editReply({
					content: await t(interaction, 'reaction-role.invalid_emoji'),
				});
			}

			// Check if exists
			const existing = await ReactionRole.findOne({
				where: {
					guildId: interaction.guildId,
					messageId,
					emoji: emojiInput,
				},
			});

			if (existing) {
				existing.roleId = role.id;
				existing.channelId = channel.id; // Update channel just in case
				await existing.save();
			} else {
				await ReactionRole.create({
					guildId: interaction.guildId,
					channelId: channel.id,
					messageId,
					emoji: emojiInput,
					roleId: role.id,
				});
			}

			const successContainer = new ContainerBuilder()
				.setAccentColor(
					convertColor('Green', { from: 'discord', to: 'decimal' }),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`✅ **Reaction Role Configured!**\n\n` +
							`**Message:** [Jump to Message](${message.url})\n` +
							`**Emoji:** ${emojiInput}\n` +
							`**Role:** ${role}`,
					),
				);

			return interaction.editReply({
				components: [successContainer],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			logger.error(error, { label: 'reaction-role:add' });
			return interaction.editReply({
				content: await t(interaction, 'common.error.generic'),
			});
		}
	},
};
