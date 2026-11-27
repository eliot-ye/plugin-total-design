// 断言共用工具：发现 skills/、读 SKILL.md、聚合结果
// 开发态工具 —— 不进 skills/、不随 plugin 分发、不在使用态加载
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '..');
export const SKILLS_DIR = join(ROOT, 'skills');

/** 返回 [{ name, dir, skillMd, refs[] }] —— 每个 skill 一条 */
export function discoverSkills() {
  return readdirSync(SKILLS_DIR)
    .filter((e) => statSync(join(SKILLS_DIR, e)).isDirectory())
    .sort()
    .map((name) => {
      const dir = join(SKILLS_DIR, name);
      const skillMd = readFileSync(join(dir, 'SKILL.md'), 'utf8');
      const refs = listFiles(join(dir, 'references'));
      return { name, dir, skillMd, refs };
    });
}

function listFiles(dir) {
  try {
    return readdirSync(dir).map((f) => join(dir, f)).filter((p) => statSync(p).isFile());
  } catch {
    return [];
  }
}

/** 统一结果对象 */
export function result(name, failures) {
  return { name, pass: failures.length === 0, failures };
}

/** 打印并返回聚合退出码（0 = 全绿） */
export function report(results) {
  let failed = 0;
  for (const r of results) {
    if (r.pass) {
      console.log(`  ✓ ${r.name}`);
    } else {
      failed++;
      console.log(`  ✗ ${r.name}`);
      for (const f of r.failures) console.log(`      ${f}`);
    }
  }
  return failed;
}