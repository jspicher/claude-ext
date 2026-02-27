import chalk from "chalk";
import {
	getAllMcpServers,
	getConfigLabel,
	readClaudeConfig,
	readClaudeExtConfig,
	writeClaudeConfig,
	writeClaudeExtConfig,
} from "./config.js";

export function toggleMcpServers(selectedServers: string[]): void {
	const { active, disabled } = getAllMcpServers();
	const claudeConfig = readClaudeConfig();
	const claudeExtConfig = readClaudeExtConfig();
	const configLabel = getConfigLabel();

	// Initialize mcpServers if they don't exist
	if (!claudeConfig.mcpServers) {
		claudeConfig.mcpServers = {};
	}
	if (!claudeExtConfig.mcpServers) {
		claudeExtConfig.mcpServers = {};
	}

	const allServers = { ...active, ...disabled };
	const selectedSet = new Set(selectedServers);

	// Clear both configs' mcpServers
	claudeConfig.mcpServers = {};
	claudeExtConfig.mcpServers = {};

	// Distribute servers based on selection
	for (const [serverName, serverConfig] of Object.entries(allServers)) {
		if (selectedSet.has(serverName)) {
			claudeConfig.mcpServers[serverName] = serverConfig;
			console.log(chalk.green(`✓ Enabled: ${serverName}`));
		} else {
			claudeExtConfig.mcpServers[serverName] = serverConfig;
			console.log(chalk.red(`✗ Disabled: ${serverName}`));
		}
	}

	// Write updated configs
	try {
		writeClaudeConfig(claudeConfig);
		writeClaudeExtConfig(claudeExtConfig);

		console.log();
		console.log(chalk.blue("Configuration updated successfully!"));
		console.log(
			chalk.gray(
				`Active servers: ${Object.keys(claudeConfig.mcpServers).length} (in ${configLabel})`,
			),
		);
		console.log(
			chalk.gray(
				`Disabled servers: ${Object.keys(claudeExtConfig.mcpServers).length} (in ~/.claude-ext.json)`,
			),
		);
	} catch (error) {
		console.error(chalk.red("Failed to save configuration:"), error);
		process.exit(1);
	}
}
