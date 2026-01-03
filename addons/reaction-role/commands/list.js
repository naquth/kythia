/**
 * @namespace: addons/reaction-role/commands/list.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 1.0.0
 */
const {
	TextDisplayBuilder,
	ContainerBuilder,
	MessageFlags,
} = require('discord.js');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('list')
			.setDescription('📜 List all reaction roles in this server.'),
	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, models, helpers, logger } = container;
		const { ReactionRole } = models;
		const { convertColor } = helpers.color;

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		try {
			const roles = await ReactionRole.findAll({
				where: {
					guildId: interaction.guildId,
				},
			});

			if (!roles || roles.length === 0) {
				return interaction.editReply({
					content: await t(interaction, 'reaction-role.list.empty'),
				});
			}

			// Group by channel -> message
			const grouped = {};
			for (const rr of roles) {
				const key = `${rr.channelId}-${rr.messageId}`;
				if (!grouped[key]) {
					grouped[key] = {
						channelId: rr.channelId,
						messageId: rr.messageId,
						roles: [],
					};
				}
				grouped[key].roles.push({
					emoji: rr.emoji,
					roleId: rr.roleId,
				});
			}

			let description = '';
			for (const group of Object.values(grouped)) {
				const jumpLink = `https://discord.com/channels/${interaction.guildId}/${group.channelId}/${group.messageId}`;
				description += `**Message:** [Link](${jumpLink}) in <#${group.channelId}>\n`;
				for (const rr of group.roles) {
					description += `• ${rr.emoji} ➡️ <@&${rr.roleId}>\n`;
				}
				description += '\n';
			}

			// Handle long descriptions (truncate if necessary, though simple list is usually fine)
			if (description.length > 4000) {
				description = `${description.substring(0, 3997)}...`;
			}

			const listContainer = new ContainerBuilder()
				.setAccentColor(
					convertColor('Blue', { from: 'discord', to: 'decimal' }),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`### ${await t(interaction, 'reaction-role.list.title')}\n\n${description}`,
					),
				);

			return interaction.editReply({
				components: [listContainer],
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (error) {
			logger.error(error, { label: 'reaction-role:list' });
			return interaction.editReply({
				content: await t(interaction, 'common.error.generic'),
			});
		}
	},
};
