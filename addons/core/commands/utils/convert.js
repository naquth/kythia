/**
 * @namespace: addons/core/commands/utils/convert.js
 * @type: Command
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.11.0-beta
 */

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const fetch = require('node-fetch');

const lengthUnits = {
	m: 1,
	km: 1000,
	ft: 0.3048,
	mi: 1609.34,
	in: 0.0254,
	cm: 0.01,
	mm: 0.001,
	yd: 0.9144,
	nm: 1852,
	au: 1.496e11,
	ly: 9.461e15,
};

const massUnits = {
	kg: 1,
	g: 0.001,
	lb: 0.453592,
	oz: 0.0283495,
	mg: 0.000001,
	ton: 1000,
	st: 6.35029,
	ct: 0.0002,
	slug: 14.5939,
};

const tempUnits = ['c', 'f', 'k', 'r', 're'];

const dataUnits = {
	b: 1,
	kb: 1024,
	mb: 1024 * 1024,
	gb: 1024 * 1024 * 1024,
	tb: 1024 * 1024 * 1024 * 1024,
	pb: 1024 * 1024 * 1024 * 1024 * 1024,
	eb: 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
	zb: 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
	yb: 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
	bit: 1 / 8,
};

const areaUnits = {
	sqm: 1,
	sqkm: 1e6,
	sqmi: 2.59e6,
	sqyd: 0.836127,
	sqft: 0.092903,
	sqin: 0.00064516,
	ha: 10000,
	acre: 4046.86,
};

const volumeUnits = {
	l: 1,
	ml: 0.001,
	m3: 1000,
	cm3: 0.001,
	gal: 3.78541,
	qt: 0.946353,
	pt: 0.473176,
	cup: 0.24,
	floz: 0.0295735,
	tbsp: 0.0147868,
	tsp: 0.00492892,
};

function convertLength(value, from, to) {
	if (!(from in lengthUnits) || !(to in lengthUnits)) return null;
	return value * (lengthUnits[from] / lengthUnits[to]);
}

function convertMass(value, from, to) {
	if (!(from in massUnits) || !(to in massUnits)) return null;
	return value * (massUnits[from] / massUnits[to]);
}

function convertTemperature(value, from, to) {
	from = from.toLowerCase();
	to = to.toLowerCase();
	if (!tempUnits.includes(from) || !tempUnits.includes(to)) return null;
	let c;

	if (from === 'c') c = value;
	else if (from === 'f') c = ((value - 32) * 5) / 9;
	else if (from === 'k') c = value - 273.15;
	else if (from === 'r') c = ((value - 491.67) * 5) / 9;
	else if (from === 're') c = value * 1.25;
	else return null;

	let result;
	if (to === 'c') result = c;
	else if (to === 'f') result = (c * 9) / 5 + 32;
	else if (to === 'k') result = c + 273.15;
	else if (to === 'r') result = ((c + 273.15) * 9) / 5;
	else if (to === 're') result = c * 0.8;
	else return null;
	return result;
}

function convertData(value, from, to) {
	from = from.toLowerCase();
	to = to.toLowerCase();
	if (!(from in dataUnits) || !(to in dataUnits)) return null;
	return value * (dataUnits[from] / dataUnits[to]);
}

function convertArea(value, from, to) {
	from = from.toLowerCase();
	to = to.toLowerCase();
	if (!(from in areaUnits) || !(to in areaUnits)) return null;
	return value * (areaUnits[from] / areaUnits[to]);
}

function convertVolume(value, from, to) {
	from = from.toLowerCase();
	to = to.toLowerCase();
	if (!(from in volumeUnits) || !(to in volumeUnits)) return null;
	return value * (volumeUnits[from] / volumeUnits[to]);
}

async function convertCurrency(container, amount, from, to) {
	const { kythiaConfig } = container;
	const accessKey = kythiaConfig?.addons?.core?.exchangerateApi;
	if (!accessKey) return null;

	const url = `https://api.exchangerate.host/convert?access_key=${encodeURIComponent(accessKey)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${amount}`;
	let res, data;
	try {
		res = await fetch(url);
		if (!res.ok) return null;
		data = await res.json();

		if (typeof data.result !== 'number') return null;
		return data.result;
	} catch (err) {
		console.error('Currency API error:', err);
		return null;
	}
}

const lengthChoices = [
	{ name: 'Meter (m)', value: 'm' },
	{ name: 'Kilometer (km)', value: 'km' },
	{ name: 'Centimeter (cm)', value: 'cm' },
	{ name: 'Millimeter (mm)', value: 'mm' },
	{ name: 'Mile (mi)', value: 'mi' },
	{ name: 'Yard (yd)', value: 'yd' },
	{ name: 'Foot (ft)', value: 'ft' },
	{ name: 'Inch (in)', value: 'in' },
	{ name: 'Nautical Mile (nm)', value: 'nm' },
	{ name: 'Astronomical Unit (au)', value: 'au' },
	{ name: 'Light Year (ly)', value: 'ly' },
];
const massChoices = [
	{ name: 'Kilogram (kg)', value: 'kg' },
	{ name: 'Gram (g)', value: 'g' },
	{ name: 'Milligram (mg)', value: 'mg' },
	{ name: 'Ton (ton)', value: 'ton' },
	{ name: 'Pound (lb)', value: 'lb' },
	{ name: 'Ounce (oz)', value: 'oz' },
	{ name: 'Stone (st)', value: 'st' },
	{ name: 'Carat (ct)', value: 'ct' },
	{ name: 'Slug (slug)', value: 'slug' },
];
const tempChoices = [
	{ name: 'Celsius (C)', value: 'c' },
	{ name: 'Fahrenheit (F)', value: 'f' },
	{ name: 'Kelvin (K)', value: 'k' },
	{ name: 'Rankine (R)', value: 'r' },
	{ name: 'Réaumur (Re)', value: 're' },
];
const dataChoices = [
	{ name: 'Byte (B)', value: 'b' },
	{ name: 'Kilobyte (KB)', value: 'kb' },
	{ name: 'Megabyte (MB)', value: 'mb' },
	{ name: 'Gigabyte (GB)', value: 'gb' },
	{ name: 'Terabyte (TB)', value: 'tb' },
	{ name: 'Petabyte (PB)', value: 'pb' },
	{ name: 'Exabyte (EB)', value: 'eb' },
	{ name: 'Zettabyte (ZB)', value: 'zb' },
	{ name: 'Yottabyte (YB)', value: 'yb' },
	{ name: 'Bit (bit)', value: 'bit' },
];
const areaChoices = [
	{ name: 'Square Meter (m²)', value: 'sqm' },
	{ name: 'Square Kilometer (km²)', value: 'sqkm' },
	{ name: 'Square Mile (mi²)', value: 'sqmi' },
	{ name: 'Square Yard (yd²)', value: 'sqyd' },
	{ name: 'Square Foot (ft²)', value: 'sqft' },
	{ name: 'Square Inch (in²)', value: 'sqin' },
	{ name: 'Hectare (ha)', value: 'ha' },
	{ name: 'Acre (acre)', value: 'acre' },
];
const volumeChoices = [
	{ name: 'Liter (L)', value: 'l' },
	{ name: 'Milliliter (mL)', value: 'ml' },
	{ name: 'Cubic Meter (m³)', value: 'm3' },
	{ name: 'Cubic Centimeter (cm³)', value: 'cm3' },
	{ name: 'Gallon (gal)', value: 'gal' },
	{ name: 'Quart (qt)', value: 'qt' },
	{ name: 'Pint (pt)', value: 'pt' },
	{ name: 'Cup (cup)', value: 'cup' },
	{ name: 'Fluid Ounce (fl oz)', value: 'floz' },
	{ name: 'Tablespoon (tbsp)', value: 'tbsp' },
	{ name: 'Teaspoon (tsp)', value: 'tsp' },
];

module.exports = {
	slashCommand: new SlashCommandBuilder()
		.setName('convert')
		.setDescription('🔄 Convert between units, currencies, etc.')

		.addSubcommand((sub) =>
			sub
				.setName('currency')
				.setDescription('💰 Convert currency (e.g. USD to IDR)')
				.addStringOption((opt) =>
					opt
						.setName('from')
						.setDescription('Currency code (e.g. USD)')
						.setRequired(true)
						.setMinLength(3)
						.setMaxLength(3),
				)
				.addStringOption((opt) =>
					opt
						.setName('to')
						.setDescription('Currency code to convert to (e.g. IDR)')
						.setRequired(true)
						.setMinLength(3)
						.setMaxLength(3),
				)
				.addNumberOption((opt) =>
					opt
						.setName('amount')
						.setDescription('Amount to convert')
						.setRequired(true),
				),
		)

		.addSubcommand((sub) =>
			sub
				.setName('length')
				.setDescription('📏 Convert length units (e.g. m to km)')
				.addStringOption((opt) =>
					opt
						.setName('from')
						.setDescription('From unit')
						.setRequired(true)
						.addChoices(...lengthChoices),
				)
				.addStringOption((opt) =>
					opt
						.setName('to')
						.setDescription('To unit')
						.setRequired(true)
						.addChoices(...lengthChoices),
				)
				.addNumberOption((opt) =>
					opt
						.setName('value')
						.setDescription('Value to convert')
						.setRequired(true),
				),
		)

		.addSubcommand((sub) =>
			sub
				.setName('mass')
				.setDescription('⚖️ Convert mass units (e.g. kg to lb)')
				.addStringOption((opt) =>
					opt
						.setName('from')
						.setDescription('From unit')
						.setRequired(true)
						.addChoices(...massChoices),
				)
				.addStringOption((opt) =>
					opt
						.setName('to')
						.setDescription('To unit')
						.setRequired(true)
						.addChoices(...massChoices),
				)
				.addNumberOption((opt) =>
					opt
						.setName('value')
						.setDescription('Value to convert')
						.setRequired(true),
				),
		)

		.addSubcommand((sub) =>
			sub
				.setName('temperature')
				.setDescription('🌡️ Convert temperature (C, F, K, R, Re)')
				.addStringOption((opt) =>
					opt
						.setName('from')
						.setDescription('From unit')
						.setRequired(true)
						.addChoices(...tempChoices),
				)
				.addStringOption((opt) =>
					opt
						.setName('to')
						.setDescription('To unit')
						.setRequired(true)
						.addChoices(...tempChoices),
				)
				.addNumberOption((opt) =>
					opt
						.setName('value')
						.setDescription('Value to convert')
						.setRequired(true),
				),
		)

		.addSubcommand((sub) =>
			sub
				.setName('data')
				.setDescription('💾 Convert data storage units (e.g. MB to GB)')
				.addStringOption((opt) =>
					opt
						.setName('from')
						.setDescription('From unit')
						.setRequired(true)
						.addChoices(...dataChoices),
				)
				.addStringOption((opt) =>
					opt
						.setName('to')
						.setDescription('To unit')
						.setRequired(true)
						.addChoices(...dataChoices),
				)
				.addNumberOption((opt) =>
					opt
						.setName('value')
						.setDescription('Value to convert')
						.setRequired(true),
				),
		)

		.addSubcommand((sub) =>
			sub
				.setName('area')
				.setDescription('🟦 Convert area units (e.g. m² to acre)')
				.addStringOption((opt) =>
					opt
						.setName('from')
						.setDescription('From unit')
						.setRequired(true)
						.addChoices(...areaChoices),
				)
				.addStringOption((opt) =>
					opt
						.setName('to')
						.setDescription('To unit')
						.setRequired(true)
						.addChoices(...areaChoices),
				)
				.addNumberOption((opt) =>
					opt
						.setName('value')
						.setDescription('Value to convert')
						.setRequired(true),
				),
		)

		.addSubcommand((sub) =>
			sub
				.setName('volume')
				.setDescription('🧪 Convert volume units (e.g. L to gal)')
				.addStringOption((opt) =>
					opt
						.setName('from')
						.setDescription('From unit')
						.setRequired(true)
						.addChoices(...volumeChoices),
				)
				.addStringOption((opt) =>
					opt
						.setName('to')
						.setDescription('To unit')
						.setRequired(true)
						.addChoices(...volumeChoices),
				)
				.addNumberOption((opt) =>
					opt
						.setName('value')
						.setDescription('Value to convert')
						.setRequired(true),
				),
		),

	/**
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 * @param {KythiaDI.Container} container
	 */
	async execute(interaction, container) {
		const { t, helpers } = container;
		const { simpleContainer } = helpers.discord;

		const sub = interaction.options.getSubcommand();
		await interaction.deferReply();

		if (sub === 'currency') {
			const amount = interaction.options.getNumber('amount');
			const from = interaction.options.getString('from').toUpperCase();
			const to = interaction.options.getString('to').toUpperCase();
			try {
				const result = await convertCurrency(container, amount, from, to);
				if (result == null) {
					const components = await simpleContainer(
						interaction,
						'## ' +
							(await t(interaction, 'core.utils.convert.currency.failed')),
						{ color: 'Red' },
					);
					return interaction.editReply({
						components,
						flags: MessageFlags.IsComponentsV2,
					});
				}

				const desc =
					'## ' +
					(await t(interaction, 'core.utils.convert.currency.title')) +
					'\n' +
					(await t(interaction, 'core.utils.convert.currency.result', {
						amount: amount,
						from: from,
						result: result.toLocaleString(undefined, {
							maximumFractionDigits: 4,
						}),
						to: to,
					}));

				const components = await simpleContainer(interaction, desc);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			} catch (e) {
				console.error('Currency convert error:', e);
				const components = await simpleContainer(
					interaction,
					await t(interaction, 'core.utils.convert.currency.error'),
					{ color: 'Red' },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}
		} else if (sub === 'length') {
			const value = interaction.options.getNumber('value');
			const from = interaction.options.getString('from');
			const to = interaction.options.getString('to');
			const result = convertLength(value, from, to);
			if (result == null) {
				const components = await simpleContainer(
					interaction,
					`## ${await t(interaction, 'core.utils.convert.length.failed')}`,
					{ color: 'Red' },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const desc =
				'## ' +
				(await t(interaction, 'core.utils.convert.length.title')) +
				'\n' +
				(await t(interaction, 'core.utils.convert.length.result', {
					value: value,
					from: from,
					result: result,
					to: to,
				}));

			const components = await simpleContainer(interaction, desc);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} else if (sub === 'mass') {
			const value = interaction.options.getNumber('value');
			const from = interaction.options.getString('from');
			const to = interaction.options.getString('to');
			const result = convertMass(value, from, to);
			if (result == null) {
				const components = await simpleContainer(
					interaction,
					`## ${await t(interaction, 'core.utils.convert.mass.failed')}`,
					{ color: 'Red' },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const desc =
				'## ' +
				(await t(interaction, 'core.utils.convert.mass.title')) +
				'\n' +
				(await t(interaction, 'core.utils.convert.mass.result', {
					value: value,
					from: from,
					result: result,
					to: to,
				}));

			const components = await simpleContainer(interaction, desc);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} else if (sub === 'temperature') {
			const value = interaction.options.getNumber('value');
			const from = interaction.options.getString('from');
			const to = interaction.options.getString('to');
			const result = convertTemperature(value, from, to);
			if (result == null) {
				const components = await simpleContainer(
					interaction,
					'## ' +
						(await t(interaction, 'core.utils.convert.temperature.failed')),
					{ color: 'Red' },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const desc =
				'## ' +
				(await t(interaction, 'core.utils.convert.temperature.title')) +
				'\n' +
				(await t(interaction, 'core.utils.convert.temperature.result', {
					value: value,
					from: from.toUpperCase(),
					result: result,
					to: to.toUpperCase(),
				}));

			const components = await simpleContainer(interaction, desc);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} else if (sub === 'data') {
			const value = interaction.options.getNumber('value');
			const from = interaction.options.getString('from');
			const to = interaction.options.getString('to');
			const result = convertData(value, from, to);
			if (result == null) {
				const components = await simpleContainer(
					interaction,
					`## ${await t(interaction, 'core.utils.convert.data.failed')}`,
					{ color: 'Red' },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const desc =
				'## ' +
				(await t(interaction, 'core.utils.convert.data.title')) +
				'\n' +
				(await t(interaction, 'core.utils.convert.data.result', {
					value: value,
					from: from.toUpperCase(),
					result: result,
					to: to.toUpperCase(),
				}));

			const components = await simpleContainer(interaction, desc);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} else if (sub === 'area') {
			const value = interaction.options.getNumber('value');
			const from = interaction.options.getString('from');
			const to = interaction.options.getString('to');
			const result = convertArea(value, from, to);
			if (result == null) {
				const components = await simpleContainer(
					interaction,
					'## Area conversion failed. Please check your units.',
					{ color: 'Red' },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const desc = `## Area Conversion\n${value} ${from} = ${result} ${to}`;

			const components = await simpleContainer(interaction, desc);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} else if (sub === 'volume') {
			const value = interaction.options.getNumber('value');
			const from = interaction.options.getString('from');
			const to = interaction.options.getString('to');
			const result = convertVolume(value, from, to);
			if (result == null) {
				const components = await simpleContainer(
					interaction,
					'## Volume conversion failed. Please check your units.',
					{ color: 'Red' },
				);
				return interaction.editReply({
					components,
					flags: MessageFlags.IsComponentsV2,
				});
			}

			const desc = `## Volume Conversion\n${value} ${from} = ${result} ${to}`;

			const components = await simpleContainer(interaction, desc);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		} else {
			const components = await simpleContainer(
				interaction,
				`## ${await t(interaction, 'core.utils.convert.unknown.subcommand')}`,
				{ color: 'Red' },
			);
			return interaction.editReply({
				components,
				flags: MessageFlags.IsComponentsV2,
			});
		}
	},
};
