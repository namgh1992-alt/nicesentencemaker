import fs from "node:fs";
const read = f => {
  const src=fs.readFileSync("/home/claude/full/"+f,"utf8");
  const i=src.indexOf("= {");
  const obj=eval("("+src.slice(i+2, src.indexOf("};", i)+1)+")");
  const pushAt=src.indexOf(".items.push(");
  if(pushAt>=0){
    const arr=eval("["+src.slice(src.indexOf("(",pushAt)+1, src.lastIndexOf(");"))+"]");
    obj[Object.keys(obj)[0]].items = obj[Object.keys(obj)[0]].items.concat(arr.flat());
  }
  return obj;
};
const BEH  = Object.assign({}, read("corpus-beh-1.js"), read("corpus-beh-2.js"), read("corpus-beh-3.js"), read("corpus-beh-4.js"));
const TERM = Object.assign({}, read("corpus-term-1.js"), read("corpus-term-2.js"));
const CCA  = Object.assign({}, read("corpus-cca-1.js"), read("corpus-cca-2.js"));
const TAIL = read("corpus-cca-3.js").tail;
const J = x => JSON.stringify(x);
const L = [];
const SENT = {};
L.push("/* ============================================================");
L.push("   1-R. 규칙 기반 문장 자산  (AI를 쓰지 않습니다)");
L.push("   · *_TAXONOMY_DEFAULT : 선택 화면에 보이는 갈래와 항목 이름");
L.push("   · keys               : 항목마다 붙은 고정 키. 문장을 찾는 열쇠다.");
L.push("                          교사가 항목을 지우거나 더해도 어긋나지 않는다.");
L.push("                          직접 더한 항목의 키는 null 이고, 문장 자산이 없다.");
L.push("   · SENT               : 키 → 문장 변형 목록");
L.push("   ============================================================ */");

L.push("const BEHAV_TAXONOMY_DEFAULT = [");
for(const id of Object.keys(BEH)){
  const c=BEH[id];
  c.items.forEach(it=>SENT[it.k]=it.v);
  L.push(`  {id:${J(id)}, name:${J(c.name)}, items:${J(c.items.map(x=>x.n))}, keys:${J(c.items.map(x=>x.k))}},`);
}
L.push("];");
L.push("const TERM_TAXONOMY_DEFAULT = [");
for(const id of Object.keys(TERM)){
  const c=TERM[id];
  c.items.forEach(it=>SENT[it.k]=it.v);
  L.push(`  {id:${J(id)}, name:${J(c.name)}, items:${J(c.items.map(x=>x.n))}, keys:${J(c.items.map(x=>x.k))}},`);
}
L.push("];");
const LABEL={auto:"자율활동",club:"동아리활동",career:"진로활동",service:"봉사활동"};
const DESC={auto:"학급·학교에서 다 함께 하는 자율·자치 활동",club:"동아리에서 꾸준히 하는 활동",
            career:"진로를 알아보고 넓히는 활동",service:"남을 돕고 나누는 봉사 활동"};
L.push("const CCA_DEFAULT = {");
for(const area of ["auto","club","career","service"]){
  L.push(`  ${area}:{ label:${J(LABEL[area])}, items:[`);
  for(const it of CCA[area].items){
    SENT[it.k]=it.v;
    L.push(`    {n:${J(it.n)}, k:${J(it.k)}, d:${J(DESC[area])}${it.lead?", role:true":""}},`);
  }
  L.push("  ]},");
}
L.push("};");
L.push("const TAIL_KEYS = " + J(TAIL.items.map(x=>x.k)) + ";");
L.push("const TAIL_NAMES = " + J(TAIL.items.map(x=>x.n)) + ";");
for(const it of TAIL.items) SENT[it.k]=it.v;

L.push("const SENT = {");
for(const k of Object.keys(SENT)) L.push(`  ${J(k)}: ${J(SENT[k])},`);
L.push("};");
const n = Object.values(SENT).reduce((a,v)=>a+v.length,0);
L.push(`const CORPUS_COUNT = ${n};`);
fs.writeFileSync("rule-data.js", L.join("\n")+"\n");
console.log("rule-data.js — 키", Object.keys(SENT).length, "· 문장", n);
