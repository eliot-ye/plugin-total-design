// 开发态断言聚合入口 —— 跑全部 skill 质量断言，任一失败即非零退出。
// 运行：node tests/run-all.mjs  或  pnpm test
// 不进 skills/、不随 plugin 分发、不在使用态加载。
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const tests = ['test-no-dev-files-in-skills.mjs', 'test-skill-size.mjs'];

let failed = 0;
for (const t of tests) {
  const r = spawnSync('node', [join(import.meta.dirname, t)], { stdio: 'inherit' });
  if (r.status !== 0) failed++;
}

console.log(failed === 0 ? '═'.repeat(50) + '\n✓ 全部断言通过\n' : '═'.repeat(50) + `\n✗ ${failed}/${tests.length} 个断言未通过\n`);
process.exit(failed === 0 ? 0 : 1);