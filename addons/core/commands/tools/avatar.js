/**
 * @namespace: addons/core/commands/tools/avatar.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	SlashCommandBuilder,
	MessageFlags,
	ApplicationCommandType,
	ContextMenuCommandBuilder,
} = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('🖼️ Show user avatar.')
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user whose avatar you want to see.')
				.setRequired(false),
		),

	contextMenuCommand: new ContextMenuCommandBuilder()
		.setName('User Avatar')
		.setType(ApplicationCommandType.User),

	contextMenuDescription: '🖼️ Show user avatar.',

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, kythiaConfig, helpers } = container;
		const { createContainer } = helpers.discord;

		await interaction.deferReply();

		const user =
			interaction.options.getUser('user') ||
			interaction.targetUser ||
			interaction.user;

		const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });

		const components = await createContainer(interaction, {
			title: user.tag,
			description: await t(interaction, 'core.tools.avatar.embed.desc', {
				url: avatarURL,
			}),
			media: [avatarURL],
			color: kythiaConfig.bot.color,
		});

		await interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
