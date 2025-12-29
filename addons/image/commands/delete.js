/**
 * @namespace: addons/image/commands/delete.js
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
			.setName('delete')
			.setDescription('Delete an image by its code')
			.addStringOption((option) =>
				option
					.setName('code')
					.setDescription('The code of the image to delete')
					.setRequired(true),
			),
	async execute(interaction, container) {
		const { models, t, kythiaConfig } = container;
		const { Image } = models;

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const code = interaction.options.getString('code');

		const image = await Image.getCache({
			userId: interaction.user.id,
			filename: code,
		});

		if (!image) {
			const embed = new EmbedBuilder()
				.setColor(kythiaConfig.bot.color)
				.setDescription(
					`${await t(interaction, 'image.delete.not.found.desc')}`,
				);
			return await interaction.editReply({ embeds: [embed], ephemeral: true });
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
			// Delete from Kythia Storage Server
			const deleteResponse = await fetch(
				`${storageUrl}/api/files/${image.fileId}`,
				{
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
				},
			);

			if (!deleteResponse.ok && deleteResponse.status !== 404) {
				const errorText = await deleteResponse.text();
				throw new Error(
					`Storage server error (${deleteResponse.status}): ${errorText}`,
				);
			}

			// Delete from database
			await image.destroy();

			const embed = new EmbedBuilder()
				.setColor(kythiaConfig.bot.color)
				.setDescription(`${await t(interaction, 'image.delete.success.desc')}`);
			await interaction.editReply({ embeds: [embed], ephemeral: true });
		} catch (err) {
			const embed = new EmbedBuilder()
				.setColor(kythiaConfig.bot.color)
				.setDescription(
					`❌ **Failed to delete image:** ${err instanceof Error ? err.message : 'Unknown error'}`,
				);
			return await interaction.editReply({ embeds: [embed], ephemeral: true });
		}
	},
};
