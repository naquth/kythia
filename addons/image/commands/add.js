/**
 * @namespace: addons/image/commands/add.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('add')
			.setDescription('Add a new image')
			.addAttachmentOption((option) =>
				option
					.setName('image')
					.setDescription('The image to add')
					.setRequired(true),
			),
	async execute(interaction, container) {
		const { models, helpers, t, kythiaConfig } = container;
		const { Image } = models;
		const { embedFooter } = helpers.discord;

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const attachment = interaction.options.getAttachment('image');

		if (!attachment.contentType.startsWith('image/')) {
			const embed = new EmbedBuilder()
				.setColor(kythiaConfig.bot.color)
				.setDescription(await t(interaction, 'image.add.invalid.type.desc'));
			return interaction.editReply({ embeds: [embed], ephemeral: true });
		}

		// Get storage server configuration
		const storageUrl =
			kythiaConfig.addons.image?.storageUrl ||
			process.env.KYTHIA_IMAGE_STORAGE_URL ||
			'http://localhost:3000';
		const apiKey =
			kythiaConfig.addons.image?.apiKey ||
			process.env.KYTHIA_IMAGE_STORAGE_API_KEY ||
			'';

		if (!apiKey) {
			const embed = new EmbedBuilder()
				.setColor(kythiaConfig.bot.color)
				.setDescription(
					'❌ **Storage API key not configured.** Please set `KYTHIA_IMAGE_STORAGE_API_KEY` in your environment or configure `kythiaConfig.addons.image.apiKey`.',
				);
			return interaction.editReply({ embeds: [embed], ephemeral: true });
		}

		try {
			// Download the image from Discord
			const response = await fetch(attachment.url);
			const buffer = await response.arrayBuffer();

			// Create FormData for file upload
			const formData = new FormData();
			const blob = new Blob([buffer], { type: attachment.contentType });
			formData.append('file', blob, attachment.name);

			// Upload to Kythia Storage Server
			const uploadResponse = await fetch(`${storageUrl}/api/upload`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
				body: formData,
			});

			if (!uploadResponse.ok) {
				const errorText = await uploadResponse.text();
				throw new Error(
					`Storage server error (${uploadResponse.status}): ${errorText}`,
				);
			}

			const uploadData = await uploadResponse.json();

			// Save metadata to database
			const savedImage = await Image.create({
				userId: interaction.user.id,
				filename: uploadData.metadata.stored_name,
				originalName: uploadData.metadata.original_name,
				fileId: uploadData.file_id,
				storageUrl: uploadData.url,
				mimetype: uploadData.metadata.mime_type,
				fileSize: uploadData.metadata.file_size,
			});

			const embed = new EmbedBuilder()
				.setColor(kythiaConfig.bot.color)
				.setDescription(
					await t(interaction, 'image.add.success.desc', {
						url: savedImage.storageUrl,
					}),
				)
				.setFooter(await embedFooter(interaction));

			await interaction.editReply({ embeds: [embed] });
		} catch (err) {
			const embed = new EmbedBuilder()
				.setColor(kythiaConfig.bot.color)
				.setDescription(
					`❌ **Failed to upload image:** ${err instanceof Error ? err.message : 'Unknown error'}`,
				);
			return interaction.editReply({ embeds: [embed], ephemeral: true });
		}
	},
};
