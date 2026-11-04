/* 과거형 — 기록부 문장은 현재형으로 씁니다. */
import fs from "node:fs";
const PAT=[/[가-힣]*(었|았|였)(음|으나|으며|지만|고|기|던|다|어|을|는)/,
           /(했|됐|왔|갔|냈|섰|켰|쳤|졌|렸|겼|혔|꼈)(음|으나|지만|고|기|던|다|어|을|는|습)/];
let total=0, hits=[];
for(const f of process.argv.slice(2)){
  const src=fs.readFileSync(f,"utf8");
  for(const m of src.matchAll(/"([^"\\]{6,120})"/g)){
    const v=m[1];
    if(!/[가-힣]/.test(v) || /^[①②③④]/.test(v)) continue;
    total++;
    for(const re of PAT){ const g=v.match(re); if(g){ hits.push([f,v,g[0]]); break; } }
  }
}
console.log(`[07] 과거형 — 문장 ${total}개 검사`);
if(hits.length){ console.log(`    ✗ 과거형 ${hits.length}개`); hits.slice(0,15).forEach(([f,v,m])=>console.log(`      ${v}  ← ${m}`)); }
else console.log("    ✓ 통과 — 과거형 0개");
process.exit(hits.length?1:0);
