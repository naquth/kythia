/**
 * @namespace: addons/core/commands/utils/convert/length.js
 * @type: Module
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const { MessageFlags } = require('discord.js');
const { convertLength, lengthChoices } = require('./_helpers');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('length')
			.setDescription('📏 Convert length units (e.g. m to km)')
			.addStringOption((opt) =>
				opt
					.setName('from')
					.setDescription('From unit')
					.setRequired(true)
					.addChoices(...lengthChoices),
			)
			.addStringOption((opt) =>
				opt
					.setName('to')
					.setDescription('To unit')
					.setRequired(true)
					.addChoices(...lengthChoices),
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
		const result = convertLength(value, from, to);

		if (result == null) {
			const components = await simpleContainer(
				interaction,
				`## ${await t(interaction, 'core.utils.convert.length.failed')}`,
				{ color: 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const desc =
			'## ' +
			(await t(interaction, 'core.utils.convert.length.title')) +
			'\n' +
			(await t(interaction, 'core.utils.convert.length.result', {
				value,
				from,
				result,
				to,
			}));

		const components = await simpleContainer(interaction, desc);
		return interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
