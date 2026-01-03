/**
 * @namespace: addons/autoreply/commands/autoreply/remove.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const { MessageFlags } = require('discord.js');
const { Op } = require('sequelize');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) => {
		return subcommand
			.setName('remove')
			.setDescription('➖ Remove an auto-reply.')
			.addStringOption((option) =>
				option
					.setName('trigger')
					.setDescription('The trigger content to remove.')
					.setRequired(true)
					.setAutocomplete(true),
			);
	},
	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async autocomplete(interaction, container) {
		const { models } = container;
		const { AutoReply } = models;
		const focusedValue = interaction.options.getFocused();

		const choices = await AutoReply.findAll({
			where: {
				guildId: interaction.guild.id,
				trigger: { [Op.like]: `%${focusedValue}%` },
			},
			limit: 25,
		});

		await interaction.respond(
			choices.map((choice) => ({
				name: choice.trigger,
				value: choice.trigger,
			})),
		);
	},

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, models, helpers } = container;
		const { AutoReply } = models;
		const { simpleContainer } = helpers.container;

		await interaction.deferReply();

		const trigger = interaction.options.getString('trigger');

		const deleted = await AutoReply.destroy({
			where: {
				guildId: interaction.guild.id,
				trigger: trigger,
			},
		});

		if (!deleted) {
			const msg = await t(interaction, 'autoreply.remove.error.not_found');
			const components = await simpleContainer(interaction, msg, {
				color: 'Red',
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const msg = await t(interaction, 'autoreply.remove.success.plain', {
			trigger: trigger,
		});
		const components = await simpleContainer(interaction, msg, {
			color: 'Red',
		});
		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
