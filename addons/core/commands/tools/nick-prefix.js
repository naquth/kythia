/**
 * @namespace: addons/core/commands/tools/nickprefix.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	InteractionContextType,
} = require('discord.js');
const { rolePrefix, roleUnprefix } = require('../../helpers');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('nickprefix')
		.setDescription('📛 Adds or removes a prefix from member nicknames.')
		.addSubcommand((sub) =>
			sub
				.setName('add')
				.setDescription('📛 Adds the highest role prefix to member nicknames.'),
		)
		.addSubcommand((sub) =>
			sub
				.setName('remove')
				.setDescription('📛 Removes the prefix from member nicknames.'),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
		.setContexts(InteractionContextType.Guild),

	guildOnly: true,
	permissions: PermissionFlagsBits.ManageNicknames,
	botPermissions: PermissionFlagsBits.ManageNicknames,

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t } = container;

		await interaction.deferReply();

		const subcommand = interaction.options.getSubcommand();
		let updated = 0;

		if (subcommand === 'add') {
			updated = await rolePrefix(interaction.guild, container);
			await interaction.editReply({
				content: await t(interaction, 'core.tools.prefix.add.success', {
					count: updated,
				}),
			});
		} else if (subcommand === 'remove') {
			updated = await roleUnprefix(interaction.guild, container);
			await interaction.editReply({
				content: await t(interaction, 'core.tools.prefix.remove.success', {
					count: updated,
				}),
			});
		}
	},
};
