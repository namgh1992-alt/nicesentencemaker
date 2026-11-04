/* ============================================================
   9-C-R. 관찰 장면 점검 · 맞춤법 (규칙 기반, AI를 부르지 않습니다)
   규칙에 있는 것만 잡습니다. 없는 것은 그냥 지나갑니다.
   ============================================================ */
const BLOCK = [
 {re:/(?<![가-힣])(착하|착함)|성실하|성실함|훌륭|우수하|우수함|뛰어난|뛰어남|똑똑|영리|모범적|최고|완벽|대단하|멋진|예의 ?바/,
  why:"추상 평가어", fix:"그렇게 보인 장면을 적어 주세요. (예: 훌륭함 → 맡은 자리를 끝까지 지킴)"},
 {re:/(내성적|외향적|소극적|적극적인 ?성격|산만|이기적|게으르|게을|무기력|덜렁|소심|급한 ?성격)/,
  why:"성격을 단정함", fix:"성격으로 못박지 말고 그날 있었던 일로 바꿔 주세요."},
 {re:/(부족|못함|못하|안 ?됨|떨어짐|뒤처|미흡|서툴|실패)/,
  why:"약점을 결과로 적음", fix:"‘변화 과정’으로 바꿔 주세요. (예: 어려워하였음 → 몇 차례 다시 해 보며 방법을 찾아 감)"},
 {re:/(대회|경진|올림피아드|공모전|영재원|○○)/,
  why:"고유 정보", fix:"대회명·기관명은 기록부에 쓸 수 없습니다."},
 {re:/([가-힣]{1,6}(초등학교|중학교|고등학교)|[가-힣]{2,4}(시청|군청|교육청|문화원))/,
  why:"지역·기관 이름", fix:"지역명과 기관명은 빼 주세요."}
];
const FIX_SP = [
 [/되요/g,"돼요"],[/됬/g,"됐"],[/할께/g,"할게"],[/할꺼/g,"할 거"],[/몇일/g,"며칠"],
 [/역활/g,"역할"],[/바램/g,"바람"],[/금새/g,"금세"],[/오랫만/g,"오랜만"],[/어떻해/g,"어떡해"],
 [/설겆이/g,"설거지"],[/일일히/g,"일일이"],[/깨끗히/g,"깨끗이"],[/번번히/g,"번번이"],
 [/틈틈히/g,"틈틈이"],[/꼼꼼이/g,"꼼꼼히"],[/곰곰히/g,"곰곰이"],[/([가-힣])로써(?=\s|$|,)/g,"$1로서"]
];
/* 과거형 표지. 기록부 문장은 현재형으로 씁니다. 자동으로 바꾸지 않고 짚어만 줍니다. */
const PAST = [
  /[가-힣]*(었|았|였)(음|으나|으며|지만|고|기|던|다|어|을|는)/,
  /(했|됐|왔|갔|냈|섰|켰|쳤|졌|렸|겼|혔|꼈)(음|으나|지만|고|기|던|다|어|을|는|습)/
];
function finalOf(ch){ const c=ch.charCodeAt(0)-0xAC00; return (c<0||c>11171)?-1:c%28; }
function endOk(t){
  const s=String(t||"").trim().replace(/[.\s]+$/,"");
  if(!s) return true;
  const c=s.charCodeAt(s.length-1)-0xAC00, j=c%28;
  return c>=0 && c<=11171 && (j===16 || j===10);   /* ㅁ 또는 ㄻ (풂·삶·앎) */
}
function fixSpacing(t){
  let out=t, hits=[];
  const push=(a,b)=>{ if(out.indexOf(a)>=0){ out=out.split(a).join(b); hits.push(a+" → "+b); } };
  push("뿐만아니라","뿐만 아니라"); push("기때문","기 때문"); push("그외","그 외");
  const scan=(word,cond)=>{ let r="";
    for(let i=0;i<out.length;i++){ const ch=out[i], nx=out.slice(i+1,i+1+word.length);
      if(nx===word && cond(ch, out.slice(i+1+word.length))){ r+=ch+" "; hits.push(ch+word+" → "+ch+" "+word); }
      else r+=ch; } out=r; };
  scan("수",(c,rest)=>finalOf(c)===8 && /^\s*(있|없)/.test(rest));
  push("수있","수 있"); push("수없","수 없");
  scan("것",(c)=> finalOf(c)===8 || finalOf(c)===4 || c==="는");
  scan("때",(c,rest)=>finalOf(c)===8 && /^(에|는|가|부터|까지|마다|,|\.|\s|$)/.test(rest));
  return {out, hits};
}
const CHECK_COUNT = BLOCK.length + FIX_SP.length + 5 + PAST.length + 2;
function checkObs(raw){
  const t=String(raw||"").trim();
  const r={blocks:[],fixes:[],warns:[],fixed:t};
  if(!t) return r;
  BLOCK.forEach(b=>{ const m=t.match(b.re); if(m) r.blocks.push({w:m[0].trim(), why:b.why, fix:b.fix}); });
  let f=t;
  FIX_SP.forEach(([re,to])=>{ const b=f; f=f.replace(re,to); if(b!==f){ const m=b.match(re); if(m) r.fixes.push(m[0]+" → "+m[0].replace(re,to)); } });
  const sp=fixSpacing(f); f=sp.out; sp.hits.forEach(h=>r.fixes.push(h));
  r.fixed=f;
  if(!endOk(t)) r.warns.push("어미가 ~함 / ~임 / ~보임 이 아닙니다");
  const pm = t.match(PAST[0]) || t.match(PAST[1]);
  if(pm) r.warns.push("‘"+pm[0]+"’ — 과거형입니다. 현재형으로 적어 주세요 (예: 했음 → 함)");
  if(t.length>120) r.warns.push("관찰 장면이 "+t.length+"자입니다. 한 장면만 적는 편이 낫습니다");
  return r;
}
/* 관찰 장면 입력칸 아래에 붙이는 표시 */
function obsCheckNode(obs, applyFix){
  const box = el("div");
  const ck = checkObs(obs);
  ck.blocks.forEach(x=>box.append(el("div",{class:"rchk blk"},
    el("b",null,"막음"), el("span",null,"‘"+x.w+"’ — "+x.why), el("span",{class:"muted"},x.fix))));
  if(ck.blocks.length) box.append(el("div",{class:"rchk note"},"위 표현이 있어 이 관찰 장면은 문장에 넣지 않습니다."));
  if(ck.fixes.length){
    const f = el("div",{class:"rchk fix"}, el("b",null,"고침 제안"), el("span",null,ck.fixes.join(" · ")));
    if(applyFix) f.append(el("button",{class:"btn sm",onClick:()=>applyFix(ck.fixed)},"이대로 고치기"));
    box.append(f);
  }
  ck.warns.forEach(w=>box.append(el("div",{class:"rchk warn"}, el("b",null,"확인"), el("span",null,w))));
  return box;
}

/* ---- 맞춤법 점검: 규칙으로 고친다 (AI 없음) ---- */
async function runSpell(scope, onProg){
  if(SPELLBUSY){ toast("이미 점검하고 있습니다."); return false; }
  const targets = spellTargets(scope);
  if(!targets.length){ toast("점검할 문장이 없습니다."); return false; }
  SPELLBUSY = true;
  const stamp = Date.now();
  let fixed=0, done=0;
  targets.forEach(t=>{
    let f = t.text, hits=[];
    FIX_SP.forEach(([re,to])=>{ const b=f; f=f.replace(re,to); if(b!==f){ const m=b.match(re); if(m) hits.push(m[0]); } });
    const sp = fixSpacing(f); f = sp.out;
    if(hits.length || sp.hits.length){
      const ops = diffOps(t.text, f);
      if(simRatio(ops, t.text, f) >= 0.82){
        t.def.set(t.sm, f);
        S.spellLog.unshift({sem:SEM, no:t.no, key:t.key, label:t.label, before:t.text, after:f, ts:stamp});
        fixed++;
      }
    }
    done++;
    onProg && onProg(done, targets.length, null);
  });
  if(S.spellLog.length>300) S.spellLog = S.spellLog.slice(0,300);
  SPELLBUSY=false;
  save(true);
  toast(fixed
    ? (fixed+"곳을 고쳤습니다. 규칙 "+CHECK_COUNT+"가지를 확인했습니다.")
    : ("규칙 "+CHECK_COUNT+"가지를 확인했습니다. 걸린 곳이 없습니다."), 4200);
  return true;
}
