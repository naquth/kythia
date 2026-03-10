/**
 * @namespace: addons/economy/commands/work.js
 * @type: Command
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

const {
	MessageFlags,
	ContainerBuilder,
	TextDisplayBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
} = require('discord.js');
const banks = require('../helpers/banks');
const jobs = require('../helpers/jobs');
const { toBigIntSafe } = require('../helpers/bigint');

module.exports = {
	subcommand: true,
	aliases: ['work'],
	slashCommand: (subcommand) =>
		subcommand
			.setName('work')
			.setDescription('⚒️ Work to earn money with various scenarios!'),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, models, kythiaConfig, helpers } = container;
		const { KythiaUser, Inventory } = models;
		const { simpleContainer } = helpers.discord;
		const { checkCooldown } = helpers.time;
		await interaction.deferReply();

		const user = await KythiaUser.getCache({ userId: interaction.user.id });

		if (!user) {
			const msg = await t(interaction, 'economy.withdraw.no.account.desc');
			const components = await simpleContainer(interaction, msg, {
				color: kythiaConfig.bot.color,
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const userInventory = await Inventory.getAllCache({ userId: user.userId });

		const cooldown = checkCooldown(
			user.lastWork,
			kythiaConfig.addons.economy.workCooldown || 28800,
			interaction,
		);

		if (cooldown.remaining) {
			const msg = `## ${await t(interaction, 'economy.work.work.cooldown.title')}\n${await t(interaction, 'economy.work.work.cooldown.desc', { time: cooldown.time })}`;
			const components = await simpleContainer(interaction, msg, {
				color: 'Yellow',
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		let availableJobs = [];
		const userItemNames = new Set(userInventory.map((item) => item.itemName));

		const tierKeys = Object.keys(jobs).sort().reverse();

		for (const tierKey of tierKeys) {
			const tier = jobs[tierKey];
			let hasRequirement = false;

			if (tier.requiredItem === null) {
				hasRequirement = true;
			} else if (Array.isArray(tier.requiredItem)) {
				if (tier.requiredItem.some((item) => userItemNames.has(item))) {
					hasRequirement = true;
				}
			} else {
				if (userItemNames.has(tier.requiredItem)) {
					hasRequirement = true;
				}
			}

			if (hasRequirement) {
				availableJobs = [...tier.jobs];
				break;
			}
		}

		if (availableJobs.length === 0) {
			const msg = `## ${await t(interaction, 'economy.work.work.no.job.title')}\n${await t(interaction, 'economy.work.work.no.job.desc')}`;
			const components = await simpleContainer(interaction, msg, {
				color: 'Red',
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const job = availableJobs[Math.floor(Math.random() * availableJobs.length)];
		const scenario =
			job.scenarios[Math.floor(Math.random() * job.scenarios.length)];

		const jobName = await t(interaction, job.nameKey);
		const scenarioDesc = await t(interaction, scenario.descKey);

		const baseEarning =
			Math.floor(Math.random() * (job.basePay[1] - job.basePay[0] + 1)) +
			job.basePay[0];
		const careerBonus = Math.floor(
			baseEarning * (user.careerLevel || 0) * 0.05,
		);

		const userBank = banks.getBank(user.bankType);
		const incomeBonusPercent = userBank.incomeBonusPercent;
		const bankBonus = Math.floor(baseEarning * (incomeBonusPercent / 100));

		const finalEarning =
			Math.floor(baseEarning * scenario.modifier) + careerBonus + bankBonus;

		user.kythiaCoin =
			toBigIntSafe(user.kythiaCoin) + toBigIntSafe(finalEarning);
		user.lastWork = new Date();

		let levelUpText = '';
		if (scenario.outcome === 'success' && (user.careerLevel || 0) < 50) {
			user.careerLevel = (user.careerLevel || 0) + 1;
			levelUpText = `\n\n${await t(interaction, 'economy.work.work.levelup.text', { level: user.careerLevel })}`;
		}

		user.changed('kythiaCoin', true);

		await user.save();

		const outcomeColors = {
			success: 'Green',
			neutral: 'Blue',
			failure: 'Red',
		};

		const { convertColor } = helpers.color;

		const accentColor = convertColor(outcomeColors[scenario.outcome], {
			from: 'discord',
			to: 'decimal',
		});

		const resultContainer = new ContainerBuilder()
			.setAccentColor(accentColor)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`## ${job.emoji} ${await t(interaction, 'economy.work.work.result.author', { job: jobName, emoji: job.emoji })}`,
				),
			)
			.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(true),
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`${await t(interaction, 'economy.work.result.title.outcome')}\n*${scenarioDesc}*${levelUpText}`,
				),
			)
			.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(true),
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`**${await t(interaction, 'economy.work.work.basepay.field')}:** 🪙 ${baseEarning.toLocaleString()}\n` +
						`**${await t(interaction, 'economy.work.work.bonus.field', { modifier: scenario.modifier })}:** 🪙 ${(finalEarning - baseEarning).toLocaleString()}\n` +
						`**${await t(interaction, 'economy.work.work.total.field')}:** 💰 ${finalEarning.toLocaleString()}`,
				),
			)
			.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(true),
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					await t(interaction, 'common.container.footer', {
						username: interaction.client.user.username,
					}),
				),
			);

		await interaction.editReply({
			components: [resultContainer],
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
