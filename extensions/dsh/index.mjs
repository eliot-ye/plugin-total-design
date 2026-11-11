// DSH (DeepSeek Harness) skill provider for total-design.
//
// Registers the 18 bundled skills under <repo>/skills/*/SKILL.md with the
// session skill registry. Mirrors @deepseek-ai/dsh-skill-office's provider
// shape so the loader contract stays identical; zero runtime dependencies
// (BUNDLED_SKILL_RANK is inlined as 600, the documented value).
//
// Loaded by extensions/dsh/cordis.patch.yml as a Cordis plugin entry. This file is ESM
// (.mjs), so the root package.json does not need "type": "module" and the
// CommonJS hooks/td_state_sync.js stays CommonJS.

import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, sep } from "node:path";

/** Precedence rank for packaged skill providers; mirrors BUNDLED_SKILL_RANK. */
const BUNDLED_SKILL_RANK = 600;

/** The skill registry service this plugin injects. */
const inject = ["skills"];

/** Cordis plugin identity. */
const name = "total-design-skill-provider";

/** Absolute directory holding the SKILL.md bundles (../../skills relative to this file). */
const SKILLS_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "skills");

/** Public skill-name grammar, mirrors dsh-skill's isSkillName. */
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Parse a strict invocation policy from frontmatter data; legacy camelCase keys are rejected. */
function parseInvocationPolicy(data) {
	for (const legacy of ["disableModelInvocation", "modelInvocable"]) {
		if (Object.hasOwn(data, legacy)) {
			throw new Error(`frontmatter field "${legacy}" is unsupported; use "disable-model-invocation"`);
		}
	}
	if (Object.hasOwn(data, "userInvocable")) {
		throw new Error('frontmatter field "userInvocable" is unsupported; use "user-invocable"');
	}
	const disableModelInvocation = frontmatterBoolean(data, "disable-model-invocation");
	const userInvocable = frontmatterBoolean(data, "user-invocable");
	return { modelInvocable: disableModelInvocation !== true, userInvocable: userInvocable !== false };
}

/** Read a YAML boolean with the same accepted spellings as the filesystem provider. */
function frontmatterBoolean(data, key) {
	if (!Object.hasOwn(data, key)) return undefined;
	const value = data[key];
	if (typeof value === "boolean") return value;
	if (value === 1 || value === "1") return true;
	if (value === 0 || value === "0") return false;
	if (typeof value === "string") {
		switch (value.toLowerCase()) {
			case "true":
			case "yes":
			case "on":
				return true;
			case "false":
			case "no":
			case "off":
				return false;
		}
	}
	throw new TypeError(`frontmatter field "${key}" must be a boolean`);
}

/** Read a non-empty string field; returns undefined when absent or empty. */
function stringField(data, key) {
	const value = data[key];
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Parse a SKILL.md file into a registry candidate; returns null when invalid. */
function parseSkill(raw, path) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(raw);
	if (match === null) throw new Error(`${path} has no YAML frontmatter`);
	const frontmatter = match[1];
	const data = {};
	for (const line of frontmatter.split(/\r?\n/)) {
		const eq = line.indexOf(":");
		if (eq <= 0) continue;
		const key = line.slice(0, eq).trim();
		let value = line.slice(eq + 1).trim();
		// Strip surrounding quotes and the leading space after a colon (YAML plain scalar).
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		if (key === "description" || key === "name") data[key] = value;
		else if (key === "user-invocable" || key === "disable-model-invocation") {
			data[key] = value === "true" ? true : value === "false" ? false : value;
		}
	}
	const skillName = stringField(data, "name");
	const description = stringField(data, "description");
	if (skillName === undefined || description === undefined) {
		throw new Error(`${path} frontmatter requires name and description`);
	}
	if (!SKILL_NAME.test(skillName)) throw new Error(`${path} invalid skill name "${skillName}"`);
	const invocation = parseInvocationPolicy(data);
	return { name: skillName, description, invocation, content: raw.slice(match[0].length).trim() };
}

/**
 * Register the bundled total-design skills with the session registry.
 * @param ctx - context carrying the skill registry.
 * @param config - optional; provider-specific config is not currently used.
 */
function apply(ctx, config = {}) {
	void config;
	const candidates = [];
	const discover = async () => {
		const entries = await readdir(SKILLS_ROOT, { withFileTypes: true });
		const found = [];
		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			const directory = join(SKILLS_ROOT, entry.name);
			const path = join(directory, "SKILL.md");
			try {
				const parsed = parseSkill(await readFile(path, "utf8"), path);
				found.push({
					name: parsed.name,
					description: parsed.description,
					invocation: parsed.invocation,
					provider: "total-design",
					source: "bundled",
					rank: BUNDLED_SKILL_RANK,
					resourceBase: { kind: "directory", path: directory.split(sep).join("/") },
					locator: path,
				});
			} catch (error) {
				ctx.logger.warn(`total-design: skipping ${path}: ${String(error)}`);
			}
		}
		return found;
	};
	const provider = {
		name: "total-design",
		list: () => discover(),
		async get(candidate, options) {
			const { rank: _rank, locator, ...summary } = candidate;
			const parsed = parseSkill(
				await readFile(locator, { encoding: "utf8", signal: options?.signal }),
				locator,
			);
			return { ...summary, content: parsed.content };
		},
	};
	ctx.skills.registerProvider(() => provider);
}

export { apply, inject, name, SKILLS_ROOT };
