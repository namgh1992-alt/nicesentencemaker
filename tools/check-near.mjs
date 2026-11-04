import fs from "node:fs";
const tri=s=>{const t=s.replace(/\s/g,""),g=new Set();for(let i=0;i<=t.length-3;i++)g.add(t.slice(i,i+3));return g;};
const sim=(a,b)=>{const A=tri(a),B=tri(b);if(!A.size||!B.size)return 0;let n=0;A.forEach(x=>{if(B.has(x))n++;});return n/(A.size+B.size-n);};
const G={};
for(const f of process.argv.slice(2).filter(x=>!x.startsWith("--"))){
  const g=f.includes("beh")?"행동특성":f.includes("term")?"학기말":"창체";
  const src=fs.readFileSync(f,"utf8"); const i=src.indexOf("= {");
  const obj=eval("("+src.slice(i+2,src.lastIndexOf("};")+1)+")");
  G[g]=G[g]||[];
  for(const cat of Object.keys(obj)) for(const it of obj[cat].items) for(const v of it.v) G[g].push([it.k,v,f]);
}
const TH=+(process.argv.find(x=>x.startsWith("--th="))||"--th=0.6").slice(5);
let total=0;
for(const g of Object.keys(G)){
  const a=G[g]; const hits=[];
  for(let i=0;i<a.length;i++) for(let j=i+1;j<a.length;j++){
    const v=sim(a[i][1],a[j][1]);
    if(v>=TH) hits.push([v,a[i],a[j]]);
  }
  hits.sort((x,y)=>y[0]-x[0]); total+=hits.length;
  console.log(`\n【${g}】 유사도 ${TH*100}% 이상: ${hits.length}쌍`);
  hits.slice(0,40).forEach(([v,x,y])=>console.log(`  ${(v*100).toFixed(0)}%  ${x[0]} ${x[1]}\n        ${y[0]} ${y[1]}`));
}
console.log("\n합계:",total,"쌍");
