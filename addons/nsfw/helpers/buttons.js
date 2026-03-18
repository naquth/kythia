/**
 * @namespace: addons/nsfw/helpers/buttons.js
 * @type: Helper Script
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
} = require('discord.js');

const buildComponentRows = (images, userNsfwFav = [], disabled = false) => {
	const favRow = new ActionRowBuilder();
	const actionRow = new ActionRowBuilder();

	images.forEach((imgUrl, index) => {
		const isFavorited = userNsfwFav.includes(imgUrl);
		favRow.addComponents(
			new ButtonBuilder()
				.setCustomId(`nsfw_fav_${index}`)
				.setLabel(isFavorited ? 'Unfavorite' : `Favorite ${index + 1}`)
				.setEmoji(isFavorited ? '💔' : '❤️')
				.setStyle(isFavorited ? ButtonStyle.Secondary : ButtonStyle.Success)
				.setDisabled(disabled),
		);
	});

	actionRow.addComponents(
		new ButtonBuilder()
			.setCustomId('nsfw_refresh')
			.setLabel('🔁 Refresh')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(disabled),
		new ButtonBuilder()
			.setCustomId('nsfw_delete')
			.setLabel('🗑️ Delete')
			.setStyle(ButtonStyle.Danger)
			.setDisabled(disabled),
	);

	return [favRow, actionRow].filter((row) => row.components.length > 0);
};

const handleFavorite = async (interaction, container, index) => {
	const { t, helpers, models } = container;
	const { NsfwUser } = models;

	const ownerId = interaction.message.interaction?.user?.id;
	if (ownerId && ownerId !== interaction.user.id) {
		return interaction.reply({
			content: await t(interaction, 'common.pagination.not.your.interaction'),
			flags: MessageFlags.Ephemeral,
		});
	}

	await interaction.deferUpdate();

	let user = await NsfwUser.getCache({ userId: interaction.user.id });
	if (!user) {
		user = await NsfwUser.create({
			userId: interaction.user.id,
			nsfwFav: [],
			nsfwCount: 0,
		});
	}

	const category = interaction.message.embeds[0]?.title ?? 'neko';
	const currentImages = interaction.message.embeds
		.map((e) => e.image?.url)
		.filter(Boolean);
	const imageUrl = currentImages[index];

	if (!imageUrl) return;

	const favSet = new Set(user.nsfwFav || []);

	if (favSet.has(imageUrl)) {
		favSet.delete(imageUrl);
	} else {
		favSet.add(imageUrl);
	}

	user.nsfwFav = Array.from(favSet);
	await user.save();

	const [updatedContainer] = await helpers.discord.createContainer(
		interaction,
		{
			title: category,
			media: currentImages,
			components: buildComponentRows(currentImages, user.nsfwFav || []),
		},
	);

	await interaction.editReply({ components: [updatedContainer] });
};

module.exports = {
	buildComponentRows,
	handleFavorite,
};
