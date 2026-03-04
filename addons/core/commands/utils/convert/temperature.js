/**
 * @namespace: addons/core/commands/utils/convert/temperature.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { MessageFlags } = require('discord.js');
const { convertTemperature, tempChoices } = require('./_helpers');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('temperature')
			.setDescription('🌡️ Convert temperature (C, F, K, R, Re)')
			.addStringOption((opt) =>
				opt
					.setName('from')
					.setDescription('From unit')
					.setRequired(true)
					.addChoices(...tempChoices),
			)
			.addStringOption((opt) =>
				opt
					.setName('to')
					.setDescription('To unit')
					.setRequired(true)
					.addChoices(...tempChoices),
			)
			.addNumberOption((opt) =>
				opt
					.setName('value')
					.setDescription('Value to convert')
					.setRequired(true),
			),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, helpers } = container;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply();

		const value = interaction.options.getNumber('value');
		const from = interaction.options.getString('from');
		const to = interaction.options.getString('to');
		const result = convertTemperature(value, from, to);

		if (result == null) {
			const components = await simpleContainer(
				interaction,
				`## ${await t(interaction, 'core.utils.convert.temperature.failed')}`,
				{ color: 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const desc =
			'## ' +
			(await t(interaction, 'core.utils.convert.temperature.title')) +
			'\n' +
			(await t(interaction, 'core.utils.convert.temperature.result', {
				value,
				from: from.toUpperCase(),
				result,
				to: to.toUpperCase(),
			}));

		const components = await simpleContainer(interaction, desc);
		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
