/**
 * @namespace: docs/generate.js
 * @type: Module
 * @copyright © 2025 kenndeclouv
 * @assistant chaa & graa
 * @version 0.10.0-beta
 */

require('@dotenvx/dotenvx').config({ quiet: true });
require('../../kythia.config.js');
require('module-alias/register');

const fs = require('node:fs');
const path = require('node:path');
const {
	ApplicationCommandOptionType,
	PermissionsBitField,
	SlashCommandSubcommandBuilder,
	SlashCommandSubcommandGroupBuilder,
} = require('discord.js');

const rootAddonsDir = path.join(__dirname, '..', '..', 'addons');
const outputDir = path.join(__dirname, 'commands');

const markdownBuffers = {};

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * 💡 Gets the valid slash command builder from a command module.
 * Ignores contextMenuCommand as it's not relevant for this documentation format.
 * @param {object} commandModule - The required command module.
 * @returns {object|null} The valid builder or null.
 */
function getSlashCommandBuilder(commandModule) {
	if (!commandModule) return null;
	return commandModule.slashCommand || commandModule.data || null;
}

/**
 * Gets the string representation of an option type.
 * @param {ApplicationCommandOptionType} type - The option type.
 * @returns {string}
 */
function getOptionType(type) {
	switch (type) {
		case ApplicationCommandOptionType.String:
			return 'Text';
		case ApplicationCommandOptionType.Integer:
			return 'Integer';
		case ApplicationCommandOptionType.Number:
			return 'Number';
		case ApplicationCommandOptionType.Boolean:
			return 'Boolean';
		case ApplicationCommandOptionType.User:
			return 'User';
		case ApplicationCommandOptionType.Channel:
			return 'Channel';
		case ApplicationCommandOptionType.Role:
			return 'Role';
		case ApplicationCommandOptionType.Mentionable:
			return 'Mentionable';
		case ApplicationCommandOptionType.Attachment:
			return 'Attachment';
		default:
			return 'Unknown';
	}
}

/**
 * ✨ [UPGRADED] Generates Markdown documentation for command options.
 * Now includes an asterisk (*) for required options.
 * @param {Array} optionsData - The options array from the command JSON.
 * @param {boolean} [isListStyle=false] - Whether to render as a list or a section.
 * @returns {string} The generated Markdown string.
 */
function generateOptionsDocs(optionsData, isListStyle = false) {
	let md = isListStyle ? '' : '### ⚙️ Options\n\n';
	for (const opt of optionsData) {
		md += `- **\`${opt.name}${opt.required ? '*' : ''}\`**\n`;
		md += `  - **Description:** ${opt.description}\n`;
		md += `  - **Type:** ${getOptionType(opt.type)}\n`;
		if (opt.choices) {
			const choicesString = opt.choices
				.map((c) => `\`${c.name}\` (\`${c.value}\`)`)
				.join(', ');
			md += `  - **Choices:** ${choicesString}\n`;
		}
	}
	return md;
}

/**
 * 📝 Generates Markdown for a subcommand.
 * Accepts extraSubMeta, optionally containing aliases and metadata for the subcommand.
 * @param {string} parentName - The name of the root command.
 * @param {object} subData - The subcommand's JSON data.
 * @param {string|null} [groupName=null] - The name of the subcommand group, if any.
 * @param {object} [extraSubMeta=null] - Metadata for this subcommand (e.g. aliases).
 * @returns {string} The generated Markdown string.
 */
function generateSubcommandDocs(
	parentName,
	subData,
	groupName = null,
	extraSubMeta = null,
) {
	const groupPrefix = groupName ? `${groupName} ` : '';
	const subOptions = subData.options || [];

	const usageString = subOptions
		.map((opt) => {
			const placeholder = `<${opt.name.toLowerCase()}>`;
			return opt.required ? placeholder : `[${placeholder}]`;
		})
		.join(' ');

	let md = `**\`/${parentName} ${groupPrefix}${subData.name}${usageString ? ` ${usageString}` : ''}\`**\n`;
	md += `> ${subData.description}\n`;

	if (
		extraSubMeta &&
		Array.isArray(extraSubMeta.aliases) &&
		extraSubMeta.aliases.length > 0
	) {
		md += `> _Aliases: ${extraSubMeta.aliases.map((a) => `\`${a}\``).join(', ')}_\n`;
	}
	if (extraSubMeta?.ownerOnly) {
		md += `> _Owner Only: Yes_\n`;
	}
	if (extraSubMeta?.cooldown) {
		md += `> _Cooldown: ${extraSubMeta.cooldown} seconds_\n`;
	}
	if (extraSubMeta?.permissions && extraSubMeta.permissions.length > 0) {
		const perms = new PermissionsBitField(extraSubMeta.permissions).toArray();
		md += `> _User Permissions: ${perms.map((p) => `\`${p}\``).join(', ')}_\n`;
	}
	if (extraSubMeta?.botPermissions && extraSubMeta.botPermissions.length > 0) {
		const perms = new PermissionsBitField(
			extraSubMeta.botPermissions,
		).toArray();
		md += `> _Bot Permissions: ${perms.map((p) => `\`${p}\``).join(', ')}_\n`;
	}
	md += '\n';

	if (subOptions.length > 0) {
		md += `**Options for this subcommand:**\n`;
		md += generateOptionsDocs(subOptions, true);
	} else {
		md += `\n`;
	}
	return md;
}

/**
 * ✨ [NEW] Generates the metadata block for a command (permissions, cooldown, etc.), and aliases if present.
 * @param {object} commandModule - The full command module object.
 * @returns {string} The generated Markdown string for the metadata section.
 */
function generateMetadataDocs(commandModule) {
	let md = '### 📋 Details\n\n';
	let hasMetadata = false;

	if (
		commandModule.aliases &&
		Array.isArray(commandModule.aliases) &&
		commandModule.aliases.length > 0
	) {
		md += `- **Aliases:** ${commandModule.aliases.map((a) => `\`${a}\``).join(', ')}\n`;
		hasMetadata = true;
	}

	if (commandModule.ownerOnly) {
		md += `- **Owner Only:** ✅ Yes\n`;
		hasMetadata = true;
	}
	if (commandModule.cooldown) {
		md += `- **Cooldown:** ${commandModule.cooldown} seconds\n`;
		hasMetadata = true;
	}
	if (commandModule.permissions && commandModule.permissions.length > 0) {
		const perms = new PermissionsBitField(commandModule.permissions).toArray();
		md += `- **User Permissions:** \`${perms.join('`, `')}\`\n`;
		hasMetadata = true;
	}
	if (commandModule.botPermissions && commandModule.botPermissions.length > 0) {
		const perms = new PermissionsBitField(
			commandModule.botPermissions,
		).toArray();
		md += `- **Bot Permissions:** \`${perms.join('`, `')}\`\n`;
		hasMetadata = true;
	}

	return hasMetadata ? md : '';
}

/**
 * ✨ [UPGRADED] Generates the complete Markdown for a command with a consistent structure.
 * Includes a "Usage" summary for ALL command types and lists aliases (if available).
 * Accepts subcommandExtraMeta: for split structure, so aliases from subcommand file bisa dimunculkan di dokumen.
 * @param {object} commandJSON - The command's toJSON() output.
 * @param {object} commandModule - The full command module object.
 * @param {object} [subcommandExtraMeta=null] - Mapping {subName: meta}, for split commands, for aliases and meta per sub.
 * @returns {string} The complete Markdown string for the command.
 */
function generateCommandMarkdown(
	commandJSON,
	commandModule,
	subcommandExtraMeta = null,
) {
	const parentName = commandJSON.name;
	let mdContent = `### 💾 \`/${parentName}\`\n\n`;
	mdContent += `**Description:** ${commandJSON.description}\n\n`;
	mdContent += generateMetadataDocs(commandModule);

	const subcommands = commandJSON.options?.filter(
		(opt) =>
			opt.type === ApplicationCommandOptionType.Subcommand ||
			opt.type === ApplicationCommandOptionType.SubcommandGroup,
	);
	const regularOptions = commandJSON.options?.filter(
		(opt) =>
			opt.type !== ApplicationCommandOptionType.Subcommand &&
			opt.type !== ApplicationCommandOptionType.SubcommandGroup,
	);

	mdContent += '### 💻 Usage\n\n';
	if (subcommands && subcommands.length > 0) {
		subcommands.forEach((sub) => {
			if (sub.type === ApplicationCommandOptionType.SubcommandGroup) {
				sub.options.forEach((subInGroup) => {
					const usageString = (subInGroup.options || [])
						.map((opt) => (opt.required ? `<${opt.name}>` : `[${opt.name}]`))
						.join(' ');
					mdContent += `\`/${parentName} ${sub.name} ${subInGroup.name}${usageString ? ` ${usageString}` : ''}\`\n`;
				});
			} else {
				const usageString = (sub.options || [])
					.map((opt) => (opt.required ? `<${opt.name}>` : `[${opt.name}]`))
					.join(' ');
				mdContent += `\`/${parentName} ${sub.name}${usageString ? ` ${usageString}` : ''}\`\n`;
			}
		});
		mdContent += '\n';
	} else if (regularOptions && regularOptions.length > 0) {
		const usageString = regularOptions
			.map((opt) => (opt.required ? `<${opt.name}>` : `[${opt.name}]`))
			.join(' ');
		mdContent += `\`/${parentName}${usageString ? ` ${usageString}` : ''}\`\n\n`;
	} else {
		mdContent += `\`/${parentName}\`\n\n`;
	}

	if (subcommands && subcommands.length > 0) {
		mdContent += `### 🔧 Subcommands\n\n`;
		for (const sub of subcommands) {
			if (sub.type === ApplicationCommandOptionType.SubcommandGroup) {
				for (const subInGroup of sub.options) {
					const meta = subcommandExtraMeta?.[subInGroup.name]
						? subcommandExtraMeta[subInGroup.name]
						: null;
					mdContent += generateSubcommandDocs(
						parentName,
						subInGroup,
						sub.name,
						meta,
					);
				}
			} else {
				const meta = subcommandExtraMeta?.[sub.name]
					? subcommandExtraMeta[sub.name]
					: null;
				mdContent += generateSubcommandDocs(parentName, sub, null, meta);
			}
		}
	} else if (regularOptions && regularOptions.length > 0) {
		mdContent += generateOptionsDocs(regularOptions);
	}

	return mdContent;
}

function processSplitCommandDirectory(dirPath, categoryName) {
	console.log(`[SPLIT] Assembling '${categoryName}' from folder...`);
	try {
		const baseCommandPath = path.join(dirPath, '_command.js');
		const baseCommandModule = require(baseCommandPath);

		if (baseCommandModule.ownerOnly || baseCommandModule.teamOnly) return;

		const mainBuilder = getSlashCommandBuilder(baseCommandModule);
		if (!mainBuilder) return;

		const subcommandExtraMeta = {};
		const contents = fs.readdirSync(dirPath, { withFileTypes: true });

		for (const item of contents) {
			const itemPath = path.join(dirPath, item.name);

			if (
				item.isFile() &&
				item.name.endsWith('.js') &&
				item.name !== '_command.js'
			) {
				const subModule = require(itemPath);

				const subData = subModule.data || subModule.slashCommand;
				if (!subData) continue;

				const subBuilder = new SlashCommandSubcommandBuilder();

				if (typeof subData === 'function') {
					subData(subBuilder);
				} else if (typeof subData === 'object') {
					subBuilder.setName(subData.name).setDescription(subData.description);
					if (subData.options) {
						subBuilder.options = subData.options;
					}
				}

				if (subBuilder.name) {
					mainBuilder.addSubcommand(subBuilder);

					subcommandExtraMeta[subBuilder.name] = {
						aliases: subModule.aliases,
						ownerOnly: subModule.ownerOnly,
						cooldown: subModule.cooldown,
						permissions: subModule.permissions,
						botPermissions: subModule.botPermissions,
					};
				}
			} else if (item.isDirectory()) {
				const groupDefPath = path.join(itemPath, '_group.js');
				if (!fs.existsSync(groupDefPath)) continue;

				const groupModule = require(groupDefPath);
				const groupData = groupModule.data || groupModule.slashCommand;
				if (!groupData) continue;

				const groupBuilder = new SlashCommandSubcommandGroupBuilder();
				if (typeof groupData === 'function') groupData(groupBuilder);
				else {
					groupBuilder
						.setName(groupData.name)
						.setDescription(groupData.description);
				}

				const subFiles = fs
					.readdirSync(itemPath)
					.filter((f) => f.endsWith('.js') && !f.startsWith('_'));
				for (const file of subFiles) {
					const subModule = require(path.join(itemPath, file));
					const subData = subModule.data || subModule.slashCommand;
					if (!subData) continue;

					const subBuilder = new SlashCommandSubcommandBuilder();
					if (typeof subData === 'function') subData(subBuilder);
					else {
						subBuilder
							.setName(subData.name)
							.setDescription(subData.description);
						if (subData.options) subBuilder.options = subData.options;
					}

					groupBuilder.addSubcommand(subBuilder);
					subcommandExtraMeta[subBuilder.name] = {
						aliases: subModule.aliases,
						permissions: subModule.permissions,
					};
				}
				mainBuilder.addSubcommandGroup(groupBuilder);
			}
		}

		const commandJSON = mainBuilder.toJSON();
		const markdown = generateCommandMarkdown(
			commandJSON,
			baseCommandModule,
			subcommandExtraMeta,
		);

		if (!markdownBuffers[categoryName]) {
			markdownBuffers[categoryName] =
				`## 📁 Command Category: ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}\n\n`;
		}
		markdownBuffers[categoryName] += `${markdown}\n\n`;
	} catch (e) {
		console.error(`❌ Failed to assemble split command in ${categoryName}:`, e);
	}
}
/**
 * 🛠️ Helper to process files in a simple directory structure.
 */
function processSimpleDirectory(dirPath, categoryName) {
	const files = fs
		.readdirSync(dirPath)
		.filter((f) => f.endsWith('.js') && !f.startsWith('_'));
	for (const file of files) {
		try {
			const filePath = path.join(dirPath, file);
			const commandModule = require(filePath);

			if (commandModule.ownerOnly || commandModule.teamOnly) continue;

			const commandBuilder = getSlashCommandBuilder(commandModule);
			if (!commandBuilder) continue;

			let commandJSON;
			if (typeof commandBuilder.toJSON === 'function') {
				commandJSON = commandBuilder.toJSON();
			} else {
				commandJSON = commandBuilder;
			}

			const markdown = generateCommandMarkdown(commandJSON, commandModule);

			if (!markdownBuffers[categoryName]) {
				markdownBuffers[categoryName] =
					`## 📁 Command Category: ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}\n\n`;
			}
			markdownBuffers[categoryName] += `${markdown}\n\n`;
			console.log(
				`[${categoryName.toUpperCase()}] Added '${commandJSON.name || file}' to buffer`,
			);
		} catch (e) {
			console.error(
				`❌ Failed to process file ${file} in category ${categoryName}: ${e.message}`,
			);
		}
	}
}

/**
 * 🔄 Recursive function to scan command directories.
 */
function processDirectory(dirPath, categoryName) {
	const baseCommandPath = path.join(dirPath, '_command.js');

	if (fs.existsSync(baseCommandPath)) {
		processSplitCommandDirectory(dirPath, categoryName);
	} else {
		processSimpleDirectory(dirPath, categoryName);

		const items = fs.readdirSync(dirPath, { withFileTypes: true });
		for (const item of items) {
			if (item.isDirectory()) {
				const subPath = path.join(dirPath, item.name);

				const subCategory = categoryName === 'core' ? item.name : categoryName;
				processDirectory(subPath, subCategory);
			}
		}
	}
}

function runGenerator() {
	console.log('🚀 Starting documentation generator...');

	Object.keys(markdownBuffers).forEach((key) => {
		delete markdownBuffers[key];
	});

	const addons = fs
		.readdirSync(rootAddonsDir, { withFileTypes: true })
		.filter((d) => d.isDirectory());

	for (const addon of addons) {
		const commandsPath = path.join(rootAddonsDir, addon.name, 'commands');
		if (!fs.existsSync(commandsPath)) continue;

		console.log(`📦 Processing Addon: ${addon.name}`);
		processDirectory(commandsPath, addon.name);
	}

	console.log('\n✅ Writing to .md files...');
	for (const [cat, content] of Object.entries(markdownBuffers)) {
		const outputFilePath = path.join(outputDir, `${cat}.md`);
		fs.writeFileSync(outputFilePath, content);
		console.log(`   -> Generated: ${cat}.md`);
	}
	console.log('\n🎉 Finished!');
}

runGenerator();
