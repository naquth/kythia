/**
 * @namespace: addons/streak/helpers/index.js
 * @type: Helper Script
 * @copyright © 2026 kenndeclouv
 * @assistant graa & chaa
 * @version 1.0.0-rc
 */

async function getOrCreateStreak(container, userId, guildId) {
	const { Streak } = container.models;
	let userStreak = await Streak.getCache({ userId: userId, guildId: guildId });
	if (!userStreak) {
		userStreak = await Streak.create({
			userId,
			guildId,
			currentStreak: 0,
			highestStreak: 0,
			lastClaimTimestamp: null,
			streakFreezes: 0,
		});
	}
	return userStreak;
}

async function updateNickname(
	member,
	streakCount,
	streakEmoji = '🔥',
	streakMinimum = 3,
) {
	let fetchedMember = member;
	try {
		fetchedMember = await member.guild.members.fetch(member.id);
	} catch (_e) {}

	if (!fetchedMember.manageable) {
		return;
	}
	try {
		let currentNickname = fetchedMember.displayName;

		const escapedEmoji = streakEmoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const streakRegex = new RegExp(`\\s${escapedEmoji}\\s\\d+$`);
		currentNickname = currentNickname.replace(streakRegex, '').trim();

		let newNickname = currentNickname;
		if (streakCount >= streakMinimum) {
			newNickname = `${currentNickname} ${streakEmoji} ${streakCount}`;
		}
		if (newNickname.length > 32) {
			newNickname = newNickname.substring(0, 32);
		}
		if (fetchedMember.displayName !== newNickname) {
			await fetchedMember.setNickname(newNickname);
		}
	} catch (_e) {}
}

function getTodayDateString() {
	return new Date().toISOString().slice(0, 10);
}

function getYesterdayDateString() {
	const yesterday = new Date();
	yesterday.setUTCDate(yesterday.getUTCDate() - 1);
	return yesterday.toISOString().slice(0, 10);
}

function getMissedDays(lastClaimDateStr) {
	if (!lastClaimDateStr) return Infinity;
	const todayMs = new Date(getTodayDateString()).getTime();
	const lastMs = new Date(lastClaimDateStr).getTime();
	const diff = (todayMs - lastMs) / (1000 * 60 * 60 * 24);
	return Math.round(diff);
}

async function syncStreakRoles(member, streakCount, streakRoleRewards) {
	if (!Array.isArray(streakRoleRewards) || streakRoleRewards.length === 0)
		return [];

	let fetchedMember;
	try {
		fetchedMember = await member.guild.members.fetch(member.id);
	} catch (_e) {
		return [];
	}

	if (!fetchedMember.manageable) return [];

	const allRewardRoles = [...new Set(streakRoleRewards.map((r) => r.role))];

	const rolesToHave = [
		...new Set(
			streakRoleRewards
				.filter((r) => streakCount >= r.streak)
				.map((r) => r.role),
		),
	];

	const rolesToRemove = allRewardRoles.filter(
		(roleId) => !rolesToHave.includes(roleId),
	);

	const currentRoles = fetchedMember.roles.cache;
	const toAdd = rolesToHave.filter((roleId) => !currentRoles.has(roleId));
	const toRemove = rolesToRemove.filter((roleId) => currentRoles.has(roleId));

	const rolesGiven = [];

	if (toAdd.length > 0) {
		try {
			await fetchedMember.roles.add(
				toAdd,
				`Streak reward: reached ${streakCount} days`,
			);
			rolesGiven.push(...toAdd);
		} catch (_e) {}
	}

	if (toRemove.length > 0) {
		try {
			await fetchedMember.roles.remove(
				toRemove,
				`Streak loss/reset: current streak ${streakCount} days`,
			);
		} catch (_e) {}
	}

	return rolesGiven;
}

async function restoreStreak(container, member, settings) {
	const userId = member.id;
	const guildId = member.guild.id;
	const today = getTodayDateString();
	const streak = await getOrCreateStreak(container, userId, guildId);

	const previousStreak = streak.currentStreak;
	streak.currentStreak = previousStreak + 1;

	if (streak.currentStreak > (streak.highestStreak || 0)) {
		streak.highestStreak = streak.currentStreak;
	}

	streak.lastClaimTimestamp = new Date(today);
	await streak.save();

	const streakEmoji = settings.streakEmoji || '🔥';
	const streakMinimum = settings.streakMinimum || 3;
	const updateStreakNickname = settings.streakNickname || false;

	if (updateStreakNickname) {
		await updateNickname(
			member,
			streak.currentStreak,
			streakEmoji,
			streakMinimum,
		);
	}

	const rewards = Array.isArray(settings.streakRoleRewards)
		? settings.streakRoleRewards
		: [];
	const rewardRolesGiven = await syncStreakRoles(
		member,
		streak.currentStreak,
		rewards,
	);

	return { streak, rewardRolesGiven };
}

async function claimStreak(container, member, settings) {
	const userId = member.id;
	const guildId = member.guild.id;
	const streak = await getOrCreateStreak(container, userId, guildId);
	const today = getTodayDateString();
	const yesterday = getYesterdayDateString();

	const lastClaimDateStr = streak.lastClaimTimestamp
		? streak.lastClaimTimestamp.toISOString().slice(0, 10)
		: null;

	if (lastClaimDateStr === today) {
		return { status: 'ALREADY_CLAIMED', streak };
	}

	let status = 'CONTINUE';
	if (lastClaimDateStr !== yesterday && streak.currentStreak > 0) {
		const missed = getMissedDays(lastClaimDateStr);
		if (streak.streakFreezes > 0) {
			streak.streakFreezes -= 1;
			streak.currentStreak += 1;
			status = 'FREEZE_USED';
		} else if (missed === 1) {
			// Missed exactly 1 day — offer restore via vote, don't save yet
			return { status: 'CAN_RESTORE', streak };
		} else {
			streak.currentStreak = 1;
			status = 'RESET';
		}
	} else if (lastClaimDateStr === yesterday) {
		streak.currentStreak += 1;
		status = 'CONTINUE';
	} else {
		streak.currentStreak = 1;
		status = 'NEW';
	}

	if (streak.currentStreak > (streak.highestStreak || 0)) {
		streak.highestStreak = streak.currentStreak;
	}

	streak.lastClaimTimestamp = new Date(today);
	await streak.save();

	const streakEmoji = settings.streakEmoji || '🔥';
	const streakMinimum = settings.streakMinimum || 3;
	const updateStreakNickname = settings.streakNickname || false;

	if (updateStreakNickname) {
		await updateNickname(
			member,
			streak.currentStreak,
			streakEmoji,
			streakMinimum,
		);
	}

	const rewards = Array.isArray(settings.streakRoleRewards)
		? settings.streakRoleRewards
		: [];
	let rewardRolesGiven = [];

	rewardRolesGiven = await syncStreakRoles(
		member,
		streak.currentStreak,
		rewards,
	);

	return { status, streak, rewardRolesGiven };
}

module.exports = {
	getOrCreateStreak,
	updateNickname,
	getTodayDateString,
	getYesterdayDateString,
	getMissedDays,
	syncStreakRoles,
	claimStreak,
	restoreStreak,
};
