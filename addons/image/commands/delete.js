/**
 * @namespace: addons/image/commands/delete.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { MessageFlags } = require('discord.js');

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

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { models, t, kythiaConfig, helpers } = container;
		const { Image } = models;
		const { simpleContainer } = helpers.discord;

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const code = interaction.options.getString('code');

		const image = await Image.getCache({
			userId: interaction.user.id,
			filename: code,
		});

		if (!image) {
			const components = await simpleContainer(
				interaction,
				`${await t(interaction, 'image.delete.not.found.desc')}`,
				{ color: kythiaConfig.bot.color },
			);
			return await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
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
			const components = await simpleContainer(
				interaction,
				'❌ **Storage API key not configured.** Please set `KYTHIA_IMAGE_STORAGE_API_KEY` in your environment or configure `kythiaConfig.addons.image.apiKey`.',
				{ color: kythiaConfig.bot.color },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
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

			const components = await simpleContainer(
				interaction,
				`${await t(interaction, 'image.delete.success.desc')}`,
				{ color: kythiaConfig.bot.color },
			);
			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} catch (err) {
			const components = await simpleContainer(
				interaction,
				`❌ **Failed to delete image:** ${err instanceof Error ? err.message : 'Unknown error'}`,
				{ color: kythiaConfig.bot.color },
			);
			return await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
