import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";
import type { ClaudeConfig } from "./types.js";

const CLAUDE_SETTINGS_PATH = join(homedir(), ".claude", "settings.json");
const CLAUDE_LEGACY_CONFIG_PATH = join(homedir(), ".claude.json");
const CLAUDE_EXT_CONFIG_PATH = join(homedir(), ".claude-ext.json");

/**
 * Detect which config file holds MCP servers.
 * Prefers ~/.claude/settings.json (v2.1.61+), falls back to ~/.claude.json (legacy).
 */
function detectConfigPath(): string {
	// If settings.json exists and has mcpServers, use it
	if (existsSync(CLAUDE_SETTINGS_PATH)) {
		try {
			const content = readFileSync(CLAUDE_SETTINGS_PATH, "utf-8");
			const parsed = JSON.parse(content);
			if (parsed.mcpServers) {
				return CLAUDE_SETTINGS_PATH;
			}
		} catch {
			// Fall through
		}
	}

	// If legacy .claude.json has mcpServers, use it
	if (existsSync(CLAUDE_LEGACY_CONFIG_PATH)) {
		try {
			const content = readFileSync(CLAUDE_LEGACY_CONFIG_PATH, "utf-8");
			const parsed = JSON.parse(content);
			if (parsed.mcpServers) {
				return CLAUDE_LEGACY_CONFIG_PATH;
			}
		} catch {
			// Fall through
		}
	}

	// Default to settings.json for new installations
	return CLAUDE_SETTINGS_PATH;
}

let resolvedConfigPath: string | null = null;

export function getConfigPath(): string {
	if (!resolvedConfigPath) {
		resolvedConfigPath = detectConfigPath();
	}
	return resolvedConfigPath;
}

export function getConfigLabel(): string {
	const p = getConfigPath();
	if (p === CLAUDE_SETTINGS_PATH) {
		return "~/.claude/settings.json";
	}
	return "~/.claude.json";
}

export function readClaudeConfig(): ClaudeConfig {
	const configPath = getConfigPath();
	try {
		if (!existsSync(configPath)) {
			return {};
		}
		const content = readFileSync(configPath, "utf-8");
		return JSON.parse(content);
	} catch (error) {
		console.error(`Failed to read ${getConfigLabel()}:`, error);
		return {};
	}
}

export function readClaudeExtConfig(): ClaudeConfig {
	try {
		if (!existsSync(CLAUDE_EXT_CONFIG_PATH)) {
			return {};
		}
		const content = readFileSync(CLAUDE_EXT_CONFIG_PATH, "utf-8");
		return JSON.parse(content);
	} catch (error) {
		console.error("Failed to read ~/.claude-ext.json:", error);
		return {};
	}
}

export function writeClaudeConfig(config: ClaudeConfig): void {
	const configPath = getConfigPath();
	try {
		const dir = dirname(configPath);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		writeFileSync(configPath, JSON.stringify(config, null, 2));
	} catch (error) {
		console.error(`Failed to write ${getConfigLabel()}:`, error);
		throw error;
	}
}

export function writeClaudeExtConfig(config: ClaudeConfig): void {
	try {
		writeFileSync(CLAUDE_EXT_CONFIG_PATH, JSON.stringify(config, null, 2));
	} catch (error) {
		console.error("Failed to write ~/.claude-ext.json:", error);
		throw error;
	}
}

export function getAllMcpServers(): {
	active: Record<string, any>;
	disabled: Record<string, any>;
} {
	const claudeConfig = readClaudeConfig();
	const claudeExtConfig = readClaudeExtConfig();

	return {
		active: claudeConfig.mcpServers || {},
		disabled: claudeExtConfig.mcpServers || {},
	};
}
