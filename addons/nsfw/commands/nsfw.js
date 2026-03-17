/**
 * @namespace: addons/nsfw/commands/nsfw.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant chaa & graa
 * @version 1.0.0-rc
 */

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { buildComponentRows } = require('../helpers/buttons.js');
const { fetchContent } = require('../helpers/api.js');

const ALLOWED_CATEGORIES = [
	'hass',
	'hmidriff',
	'pgif',
	'4k',
	'hentai',
	'holo',
	'hneko',
	'neko',
	'hkitsune',
	'kemonomimi',
	'anal',
	'hanal',
	'gonewild',
	'kanna',
	'ass',
	'pussy',
	'thigh',
	'hthigh',
	'coffee',
	'food',
	'paizuri',
	'tentacle',
	'boobs',
	'hboobs',
	'yaoi',
];

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('nsfw')
		.setDescription('🔞 NSFW random content (only in nsfw channel)')
		.setNSFW(true)
		.addStringOption((option) =>
			option
				.setName('category')
				.setDescription('Content category')
				.setRequired(true)
				.addChoices(
					...ALLOWED_CATEGORIES.map((cat) => ({ name: cat, value: cat })),
				),
		)
		.addBooleanOption((option) =>
			option
				.setName('private')
				.setDescription('Make the message private?')
				.setRequired(true),
		)
		.addIntegerOption((option) =>
			option
				.setName('amount')
				.setDescription('Amount of images to send (1-3)')
				.setMinValue(1)
				.setMaxValue(3)
				.setRequired(false),
		),
	voteLocked: true,

	async execute(interaction, container) {
		const { helpers, models, logger } = container;
		const { NsfwUser } = models;

		const ephemeral = interaction.options.getBoolean('private') ?? false;
		const amount = interaction.options.getInteger('amount') ?? 1;
		const category = interaction.options.getString('category');

		await interaction.deferReply({ ephemeral });

		// Get user data
		let user = await NsfwUser.getCache({ userId: interaction.user.id });
		if (!user) {
			user = await NsfwUser.create({
				userId: interaction.user.id,
				nsfwFav: [],
				nsfwCount: 0,
			});
		}

		// State for current images
		let currentImages = [];

		const sendContent = async () => {
			const fetchPromises = Array.from({ length: amount }, () =>
				fetchContent(category, logger),
			);
			const fetched = await Promise.all(fetchPromises);
			currentImages = fetched.filter((img) => img !== null);

			if (currentImages.length === 0) {
				return interaction.editReply({
					content:
						'Oops, the image servers seem to be down right now 😭. Please try again later!',
				});
			}

			// Update nsfwCount only for successfully fetched images
			if (user) {
				user.nsfwCount = (user.nsfwCount || 0) + currentImages.length;
				await user.save();
			}

			const [containerBody] = await helpers.discord.createContainer(
				interaction,
				{
					title: category,
					media: currentImages,
					components: buildComponentRows(currentImages, user?.nsfwFav || []),
				},
			);

			await interaction.editReply({
				components: [containerBody],
				flags: MessageFlags.IsComponentsV2,
			});
		};

		// Send initial content
		await sendContent();
	},
};
