// 断言：单个 SKILL.md 字符数不超上限
// 为什么只测 SKILL.md 本体：触发即全量加载进上下文，是每次触发的固定成本；
// references/ 按需读取、不总是进上下文，不在此强制（避免过度仪式）。
// 口径用字符数（wc -m）不用字节：中文文档，tokenizer 按字符/token 计，字符数才反映上下文成本。
// 阈值 16000 字符：当前 max 为 td-propose 12181，留 ~31% 余量——防继续膨胀而不卡现状。
import { discoverSkills, result, report } from './lib.mjs';

const LIMIT = 16000;

const skills = discoverSkills();
const results = skills.map((s) => {
  const chars = s.skillMd.length;
  const failures = [];
  if (chars > LIMIT) {
    failures.push(`${s.name}/SKILL.md = ${chars} 字符，超上限 ${LIMIT}（超出 ${chars - LIMIT}）`);
  }
  return { ...result(`skill-size / ${s.name}`, failures), chars };
});

console.log(`\n断言 2/2：单个 SKILL.md ≤ ${LIMIT} 字符（实测 max ${Math.max(...results.map((r) => r.chars))}）\n`);
// skill-size 额外显示体积，便于发现膨胀趋势
let failed = 0;
for (const r of [...results].sort((a, b) => b.chars - a.chars)) {
  const bar = '#'.repeat(Math.round(r.chars / 500));
  if (r.pass) console.log(`  ✓ ${String(r.chars).padStart(6)} ${bar} ${r.name.replace('skill-size / ', '')}`);
  else {
    failed++;
    console.log(`  ✗ ${String(r.chars).padStart(6)} 超限 ${r.name.replace('skill-size / ', '')}`);
    for (const f of r.failures) console.log(`      ${f}`);
  }
}
console.log(failed === 0 ? '\n✓ 全部通过\n' : `\n✗ ${failed} 个超限\n`);
process.exit(failed === 0 ? 0 : 1);