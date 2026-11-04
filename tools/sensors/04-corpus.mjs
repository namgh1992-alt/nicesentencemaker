import fs from "node:fs";
const BANNED=[
 [/(?<![가-힣])착하|성실하|성실함|훌륭|우수하|뛰어난|똑똑|영리|모범적|최고|완벽|대단/,"추상평가어"],
 [/내성적|외향적|소극적|산만|이기적|게으|무기력|소심/,"성격단정"],
 [/부족|못함|못하|떨어짐|뒤처|미흡|서툴|실패/,"약점서술"],
 [/대회|경진|올림피아드|공모전|영재원|초등학교|중학교|교육청/,"고유정보"],
 [/[가-힣]*(었|았|였)(음|으나|으며|지만|고|기|던|다|어|을|는)/,"과거형"],
 [/(했|됐|왔|갔|냈|섰|켰|쳤|졌|렸|겼|혔|꼈)(음|으나|지만|고|기|던|다|어|을|는|습)/,"과거형"]];
const nom=s=>{const t=s.trim().replace(/[.\s]+$/,"");if(!t)return false;
  const c=t.charCodeAt(t.length-1)-0xAC00,j=c%28;return c>=0&&c<=11171&&(j===16||j===10);};
const group=f=>f.includes("beh")?"행동특성":f.includes("term")?"학기말":"창체";
let bad=[],byGroup={},perItem=[];
for(const f of process.argv.slice(2)){
  const g=group(f); byGroup[g]=byGroup[g]||[];
  const src=fs.readFileSync(f,"utf8");
  const i=src.indexOf("= {");
  const lit=src.slice(i+2, src.indexOf("};", i)+1);
  const obj=eval("("+lit+")");
  // push 로 뒤에 더한 항목까지 본다
  const pushAt=src.indexOf(".items.push(");
  if(pushAt>=0){
    const arr=eval("["+src.slice(src.indexOf("(",pushAt)+1, src.lastIndexOf(");"))+"]");
    const firstCat=Object.keys(obj)[0];
    obj[firstCat].items = obj[firstCat].items.concat(arr.flat());
  }
  for(const cat of Object.keys(obj)) for(const it of obj[cat].items){
    perItem.push([it.k,it.v.length]);
    for(const v of it.v){ byGroup[g].push(v);
      if(!nom(v)) bad.push([it.k,v,"어미 ✗"]);
      for(const [re,w] of BANNED){const m=v.match(re); if(m) bad.push([it.k,v,w+": "+m[0]]);}
      if(v.length>60) bad.push([it.k,v,v.length+"자 너무 김"]);
    }
  }
}
const total=Object.values(byGroup).flat().length;
console.log(`문장 ${total}개 · 항목 ${perItem.length}개`);
const wrong=perItem.filter(([k,n])=>n!==10 && n!==12);
if(wrong.length) console.log("✗ 변형이 10개가 아닌 항목:", wrong.map(x=>x.join("=")).join(", "));
let dupFail=0;
for(const g of Object.keys(byGroup)){
  const a=byGroup[g], d=[...new Set(a.filter((x,i)=>a.indexOf(x)!==i))];
  console.log(`  ${g} 내부 중복: ${d.length?"✗ "+d.length+"건 — "+d.slice(0,8).join(" / "):"없음"}`);
  if(d.length) dupFail=1;
}
const gs=Object.keys(byGroup);
if(gs.length>1){
  let cross=0;
  for(let i=0;i<gs.length;i++)for(let j=i+1;j<gs.length;j++){
    const s=new Set(byGroup[gs[j]]); const c=byGroup[gs[i]].filter(x=>s.has(x));
    if(c.length) { cross+=c.length; console.log(`  ${gs[i]}↔${gs[j]} 겹침: ${c.length}건 (조립 때 같은 학생에게 두 번 나가지 않게 엔진이 막음)`); }
  }
  if(!cross) console.log("  묶음 사이 겹침: 없음");
}
if(bad.length){ console.log(`\n✗ 규칙 위반 ${bad.length}건`); bad.slice(0,25).forEach(b=>console.log("  ",b[0],"|",b[1],"→",b[2])); }
else console.log("✓ 어미·금지어·길이 모두 통과");
process.exit(bad.length||dupFail?1:0);
