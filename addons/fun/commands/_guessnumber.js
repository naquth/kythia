/**
 * @namespace: addons/fun/commands/_guessnumber.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('guessnumber')
		.setDescription('Guess the number the bot is thinking of 😋')
		.addStringOption((option) =>
			option
				.setName('mode')
				.setDescription('Choose difficulty level')
				.setRequired(true)
				.addChoices(
					{ name: 'Easy (1 - 50)', value: 'easy' },
					{ name: 'Medium (1 - 100)', value: 'medium' },
					{ name: 'Hard (1 - 500)', value: 'hard' },
				),
		),

	async execute(interaction, container) {
		const { t, helpers } = container;
		const { simpleContainer } = helpers.discord;

		const mode = interaction.options.getString('mode');
		let maxNumber = 100;

		if (mode === 'easy') maxNumber = 50;
		if (mode === 'medium') maxNumber = 100;
		if (mode === 'hard') maxNumber = 500;

		const number = Math.floor(Math.random() * maxNumber) + 1;
		let attempts = 0;

		const duration = 60; // seconds
		const endTime = Math.floor((Date.now() + duration * 1000) / 1000);

		const components = await simpleContainer(
			interaction,
			(await t(interaction, 'fun.guessnumber.desc', { maxNumber })) +
				'\n\n-# ' +
				(await t(interaction, 'fun.guessnumber.hint')) +
				`\n\n**${await t(interaction, 'fun.guessnumber.mode.field')}:** ${mode.toUpperCase()}\n` +
				`**${await t(interaction, 'fun.guessnumber.timeleft.field')}:** <t:${endTime}:R>`,
			{ color: 'Blue' },
		);

		if (!interaction.channel) {
			const dm = await interaction.user.createDM();
			await dm.send({ components, flags: MessageFlags.IsComponentsV2 });
			const dmComponents = await simpleContainer(
				interaction,
				await t(interaction, 'fun.guessnumber.dm.sent.desc'),
				{ color: 'Blue' },
			);
			return interaction.reply({
				components: dmComponents,
				flags: MessageFlags.IsComponentsV2,
				ephemeral: true,
			});
		}

		const gameMessage = await interaction.reply({
			components,
			flags: MessageFlags.IsComponentsV2,
			fetchReply: true,
		});

		const filter = (m) =>
			m.author.id === interaction.user.id && !Number.isNaN(m.content);
		const collector = interaction.channel.createMessageCollector({
			filter,
			time: duration * 1000,
		});

		let lastUserMessage;
		let lastBotReply;

		collector.on('collect', async (m) => {
			const guess = parseInt(m.content, 10);
			attempts++;

			// Delete previous user/bot messages if exist
			if (lastUserMessage) {
				try {
					await lastUserMessage.delete();
				} catch {}
			}
			if (lastBotReply) {
				try {
					await lastBotReply.delete();
				} catch {}
			}

			lastUserMessage = m;

			if (guess === number) {
				collector.stop('guessed');

				const winComponents = await simpleContainer(
					interaction,
					await t(interaction, 'fun.guessnumber.win.desc', {
						number,
						attempts,
					}),
					{ color: 'Green' },
				);

				try {
					await gameMessage.edit({
						components: winComponents,
						flags: MessageFlags.IsComponentsV2,
					});
				} catch {
					try {
						await interaction.channel.send({
							components: winComponents,
							flags: MessageFlags.IsComponentsV2,
						});
					} catch {}
				}
				return;
			}

			const distance = Math.abs(guess - number);
			let feedbackKey = '';

			if (distance <= 5) {
				feedbackKey =
					guess < number
						? 'fun_guessnumber_feedback_almost_low'
						: 'fun_guessnumber_feedback_almost_high';
			} else {
				feedbackKey =
					guess < number
						? 'fun_guessnumber_feedback_low'
						: 'fun_guessnumber_feedback_high';
			}

			const feedback = await t(interaction, feedbackKey);

			const feedbackComponents = await simpleContainer(interaction, feedback, {
				color: 'Yellow',
			});

			lastBotReply = await interaction.channel.send({
				components: feedbackComponents,
				flags: MessageFlags.IsComponentsV2,
			});
		});

		collector.on('end', async (_, reason) => {
			if (reason !== 'guessed') {
				const loseComponents = await simpleContainer(
					interaction,
					await t(interaction, 'fun.guessnumber.lose.desc', { number }),
					{ color: 'Red' },
				);

				try {
					await gameMessage.edit({
						components: loseComponents,
						flags: MessageFlags.IsComponentsV2,
					});
				} catch {
					try {
						await interaction.channel.send({
							components: loseComponents,
							flags: MessageFlags.IsComponentsV2,
						});
					} catch {}
				}
			}
		});
	},
};
