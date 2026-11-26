// 断言：skills/ 下不得把 agent 指令文件（AGENTS.md 等）当规则来源引用
// 对应规则：「SKILL 不可引用 AGENTS 文件」+「禁止开发态语句」
// 豁免：agents-md-hygiene 的职责就是操作用户项目同名文件 —— 操作对象身份合法，
//       但即便它也不得从该文件"引入规则"。故对所有 skill 统一检测"规则来源"句式。
import { discoverSkills, result, report } from './lib.mjs';

const AGENT_FILES = ['AGENTS.md', 'CLAUDE.md', '.atomcode.md', '.codex.md'];
// "见 AGENTS.md" / "规则见 AGENTS.md" / "参考 AGENTS.md" —— 把它当规则来源
const RULE_SOURCE_PATTERNS = [
  /见\s*`?(AGENTS\.md|CLAUDE\.md|\.atomcode\.md|\.codex\.md)`?/g,
  /参考\s*`?(AGENTS\.md|CLAUDE\.md|\.atomcode\.md|\.codex\.md)`?/g,
  /按\s*`?(AGENTS\.md|CLAUDE\.md|\.atomcode\.md|\.codex\.md)`?/g,
  /(?:规则|约定|判据|定义)(?:在|来自|以)[^，。]{0,12}`?(AGENTS\.md|CLAUDE\.md)`?/g,
];
// 编辑指令句式（开发态泄漏，对应「禁止开发态语句」三类形态）
const DEV_INSTRUCTION_PATTERNS = [
  /只改本文件/g,
  /引用本文件/g,
  /由[^，。]{0,10}合并而来/g,
  /不重复定义/g,
  /被[^，。]{0,20}引用本文件/g,
];

function check(text, label, patterns, failures, scope) {
  for (const p of patterns) {
    p.lastIndex = 0;
    let m;
    while ((m = p.exec(text))) {
      const line = text.slice(0, m.index).split('\n').length;
      failures.push(`${label}:${line} 命中「${scope}」规则 → "${m[0]}"`);
    }
  }
}

const skills = discoverSkills();
const results = skills.map((s) => {
  const failures = [];
  for (const f of AGENT_FILES) {
    // 裸提及不算违规（操作对象合法），只有"规则来源"句式才算 —— 见 patterns
  }
  check(s.skillMd, `${s.name}/SKILL.md`, RULE_SOURCE_PATTERNS, failures, 'agent指令文件作规则来源');
  check(s.skillMd, `${s.name}/SKILL.md`, DEV_INSTRUCTION_PATTERNS, failures, '编辑指令');
  for (const ref of s.refs) {
    const text = readText(ref);
    check(text, refPath(ref), RULE_SOURCE_PATTERNS, failures, 'agent指令文件作规则来源');
    check(text, refPath(ref), DEV_INSTRUCTION_PATTERNS, failures, '编辑指令');
  }
  return result(`no-dev-files / ${s.name}`, failures);
});

import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
function readText(p) { return readFileSync(p, 'utf8'); }
function refPath(p) { return relative(process.cwd(), p); }

console.log('\n断言 1/2：skills/ 下无 agent 指令文件作规则来源、无开发态编辑指令\n');
const failed = report(results);
console.log(failed === 0 ? '\n✓ 全部通过\n' : `\n✗ ${failed} 个 skill 未通过\n`);
process.exit(failed === 0 ? 0 : 1);