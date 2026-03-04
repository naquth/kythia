/**
 * @namespace: addons/core/commands/utils/convert/data.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { MessageFlags } = require('discord.js');
const { convertData, dataChoices } = require('./_helpers');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('data')
			.setDescription('💾 Convert data storage units (e.g. MB to GB)')
			.addStringOption((opt) =>
				opt
					.setName('from')
					.setDescription('From unit')
					.setRequired(true)
					.addChoices(...dataChoices),
			)
			.addStringOption((opt) =>
				opt
					.setName('to')
					.setDescription('To unit')
					.setRequired(true)
					.addChoices(...dataChoices),
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
		const result = convertData(value, from, to);

		if (result == null) {
			const components = await simpleContainer(
				interaction,
				`## ${await t(interaction, 'core.utils.convert.data.failed')}`,
				{ color: 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const desc =
			'## ' +
			(await t(interaction, 'core.utils.convert.data.title')) +
			'\n' +
			(await t(interaction, 'core.utils.convert.data.result', {
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
