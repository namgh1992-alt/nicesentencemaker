import fs from "node:fs";
const PAT=[
 [/[가-힣]*(었|았|였)(음|으나|으며|지만|고|기|던|다|어|을|는)/, "과거 어미"],
 [/(했|됐|왔|갔|냈|섰|켰|쳤|졌|렸|겼|혔|꼈)(음|으나|지만|고|기|던|다|어|을|는|습)/, "과거 축약"],
];
let hits=[], total=0;
for(const f of process.argv.slice(2)){
  const src=fs.readFileSync(f,"utf8");
  // 모든 "..." 문자열 중 한글 문장만 본다
  for(const m of src.matchAll(/"([^"\\]{6,120})"/g)){
    const v=m[1];
    if(!/[가-힣]/.test(v)) continue;
    if(/^[①②③④]/.test(v)) continue;
    total++;
    for(const [re,w] of PAT){ const g=v.match(re); if(g){ hits.push([f,v,w,g[0]]); break; } }
  }
}
console.log(`검사 ${total}개 중 과거형 ${hits.length}개`);
hits.forEach(([f,v,w,m])=>console.log(`  ${f.replace("corpus-","").replace(".js","").padEnd(7)} ${v}   ← ${m}`));
