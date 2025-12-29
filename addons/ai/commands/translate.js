/**
 * @namespace: addons/ai/commands/translate.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const {
	SlashCommandBuilder,
	ApplicationCommandType,
	ContextMenuCommandBuilder,
	MessageFlags,
} = require('discord.js');
const { getAndUseNextAvailableToken } = require('../helpers/gemini');
const { GoogleGenAI } = require('@google/genai');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('translate')
		.setDescription('🌐 Translate text to another language using Gemini AI.')
		.addStringOption((option) =>
			option
				.setName('text')
				.setDescription('Text to translate')
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName('lang')
				.setDescription('Target language (e.g. en, id, ja, etc)')
				.setRequired(true),
		),

	contextMenuCommand: new ContextMenuCommandBuilder()
		.setName('Translate Message')
		.setType(ApplicationCommandType.Message),

	contextMenuDescription:
		'🌐 Translate message to another language using Gemini AI.',

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, kythiaConfig, helpers, logger } = container;
		const { simpleContainer } = helpers.discord;

		const text =
			interaction.options?.getString('text') ||
			interaction.targetMessage?.content;
		const lang = interaction.options?.getString('lang') || 'en';

		await interaction.deferReply();

		const totalTokens = kythiaConfig.addons.ai.geminiApiKeys.split(',').length;
		let success = false;
		let finalResponse = null;
		let lastError = null;

		for (let attempt = 0; attempt < totalTokens; attempt++) {
			logger.debug(`🧠 AI translate attempt ${attempt + 1}/${totalTokens}...`);

			const tokenIdx = await getAndUseNextAvailableToken();
			if (tokenIdx === -1) {
				const msg = await t(interaction, 'ai.translate.limit');
				const components = await simpleContainer(interaction, msg, {
					color: 'Red',
				});
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const GEMINI_API_KEY =
				kythiaConfig.addons.ai.geminiApiKeys.split(',')[tokenIdx];
			if (!GEMINI_API_KEY) {
				logger.warn(`Token index ${tokenIdx} is invalid. Skipping.`);
				continue;
			}

			const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

			const prompt = `Translate the following text to ${lang}:\n\n${text}\n\nOnly return the translated text, no explanation.`;

			try {
				const response = await ai.models.generateContent({
					model: kythiaConfig.addons.ai.model,
					contents: prompt,
				});

				let rawText = response.text || response.response?.text || '';
				rawText = rawText.replace(/[`]/g, '');
				finalResponse = { ...response, text: rawText };
				success = true;
				logger.debug(
					`✅ AI translate request successful on attempt ${attempt + 1}`,
				);
				break;
			} catch (error) {
				lastError = error;
				if (
					error.message &&
					(error.message.includes('429') ||
						error.toString().includes('RESOURCE_EXHAUSTED'))
				) {
					logger.warn(
						`Token index ${tokenIdx} hit 429 limit. Retrying with next token...`,
					);
				} else {
					logger.error('❌ Error in /translate (non-429):', error);
					break;
				}
			}
		}

		if (success && finalResponse) {
			const translated =
				finalResponse.text ||
				finalResponse.response?.text ||
				(await t(interaction, 'ai.translate.no.result'));
			const msg = await t(interaction, 'ai.translate.success', {
				lang,
				text,
				translated,
			});
			const components = await simpleContainer(interaction, msg);
			await interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} else {
			logger.error('Error in /translate:', lastError);
			const msg = await t(interaction, 'ai.translate.error');
			const components = await simpleContainer(interaction, msg, {
				color: 'Red',
			});
			await interaction.editReply({
				components,
			});
		}
	},
};
