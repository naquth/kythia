/**
 * @namespace: addons/economy/commands/hack.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { MessageFlags } = require('discord.js');
const banks = require('../helpers/banks');
const { toBigIntSafe } = require('../helpers/bigint');

module.exports = {
	subcommand: true,
	slashCommand: (subcommand) =>
		subcommand
			.setName('hack')
			.setDescription('💵 Hack another user.')
			.addUserOption((option) =>
				option
					.setName('target')
					.setDescription('User you want to hack')
					.setRequired(true),
			),
	guildOnly: true,

	async execute(interaction, container) {
		const { t, models, kythiaConfig, helpers } = container;
		const { KythiaUser, Inventory } = models;
		const { simpleContainer } = helpers.discord;
		const { checkCooldown } = helpers.time;

		await interaction.deferReply();

		const targetUser = interaction.options.getUser('target');
		const user = await KythiaUser.getCache({ userId: interaction.user.id });
		const target = await KythiaUser.getCache({ userId: targetUser.id });

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

		const cooldown = checkCooldown(
			user.lastHack,
			kythiaConfig.addons.economy.hackCooldown || 7200,
			interaction,
		);
		if (cooldown.remaining) {
			const msg = await t(interaction, 'economy.hack.hack.cooldown', {
				time: cooldown.time,
			});
			const components = await simpleContainer(interaction, msg, {
				color: 'Yellow',
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		if (!user || !target) {
			const msg = await t(
				interaction,
				'economy.hack.hack.user.or.target.not.found',
			);
			const components = await simpleContainer(interaction, msg, {
				color: 'Red',
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		if (targetUser.id === interaction.user.id) {
			const msg = await t(interaction, 'economy.hack.hack.self');
			const components = await simpleContainer(interaction, msg, {
				color: 'Red',
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		if (target.kythiaBank <= 0) {
			const msg = await t(interaction, 'economy.hack.hack.target.no.bank');
			const components = await simpleContainer(interaction, msg, {
				color: 'Red',
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		if (user.kythiaBank <= 20) {
			const msg = await t(interaction, 'economy.hack.hack.user.no.bank');
			const components = await simpleContainer(interaction, msg, {
				color: 'Red',
			});
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}

		const msg = await t(interaction, 'economy.hack.hack.in.progress', {
			user: interaction.user.username,
			target: targetUser.username,
			chance: user.hackMastered || 10,
		});
		const components = await simpleContainer(interaction, msg, {
			color: kythiaConfig.bot.color,
		});

		await interaction.editReply({
			components,
			flags: MessageFlags.IsComponentsV2,
		});

		const desktop = await Inventory.getCache({
			userId: interaction.user.id,
			itemName: '🖥️ Desktop',
		});
		let successChance = 1;
		if (desktop) {
			successChance = 1.5;
		}

		setTimeout(async () => {
			const hackResult =
				Math.random() < ((user.hackMastered || 10) / 100) * successChance
					? 'success'
					: 'failure';

			if (hackResult === 'success') {
				const userBank = banks.getBank(user.bankType);
				const robSuccessBonusPercent = userBank.robSuccessBonusPercent;
				const hackBonus = Math.floor(
					target.kythiaBank * (robSuccessBonusPercent / 100),
				);
				const totalHacked = target.kythiaBank + hackBonus;

				user.kythiaBank =
					toBigIntSafe(user.kythiaBank) + toBigIntSafe(totalHacked);
				if (user.hackMastered < 100) {
					user.hackMastered = (user.hackMastered || 10) + 1;
				}
				target.kythiaBank = 0;
				user.lastHack = Date.now();

				user.changed('kythiaBank', true);
				user.changed('lastHack', true);
				target.changed('kythiaBank', true);

				await user.saveAndUpdateCache('userId');
				await target.saveAndUpdateCache('userId');

				const dmMsg = await t(interaction, 'economy.hack.hack.success.dm', {
					hacker: interaction.user.username,
					amount: totalHacked,
				});
				const dmComponents = await simpleContainer(interaction, dmMsg, {
					color: 'Red',
				});
				try {
					await targetUser.send({
						components: dmComponents,
						flags: MessageFlags.IsComponentsV2,
					});
				} catch (_err) {}

				const successMsg = await t(
					interaction,
					'economy.hack.hack.success.text',
					{
						target: targetUser.username,
					},
				);
				const successComponents = await simpleContainer(
					interaction,
					successMsg,
					{
						color: kythiaConfig.bot.color,
					},
				);

				await interaction.editReply({
					components: successComponents,
					flags: MessageFlags.IsComponentsV2,
				});
			} else {
				const userBank = banks.getBank(user.bankType || 'solara_mutual');
				const robPenaltyMultiplier = userBank
					? userBank.robPenaltyMultiplier
					: 1;
				const basePenalty = Math.floor(Math.random() * 20) + 1;
				const penalty = Math.floor(basePenalty * robPenaltyMultiplier);

				if (user.kythiaBank >= penalty) {
					user.kythiaBank =
						toBigIntSafe(user.kythiaBank) - toBigIntSafe(penalty);
					target.kythiaBank =
						toBigIntSafe(target.kythiaBank) + toBigIntSafe(penalty);

					user.changed('kythiaBank', true);
					target.changed('kythiaBank', true);

					await user.saveAndUpdateCache('userId');
					await target.saveAndUpdateCache('userId');
				}

				user.lastHack = Date.now();
				user.changed('lastHack', true);
				await user.saveAndUpdateCache('userId');

				const failMsg = await t(interaction, 'economy.hack.hack.failure', {
					target: targetUser.username,
					penalty,
				});
				const failComponents = await simpleContainer(interaction, failMsg, {
					color: 'Red',
				});

				await interaction.editReply({
					components: failComponents,
					flags: MessageFlags.IsComponentsV2,
				});
			}
		}, 5000);
	},
};
