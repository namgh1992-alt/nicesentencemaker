/* ============================================================
   12. 문장 생성 — 규칙 조립 (AI를 부르지 않습니다)

   고른 갈래 항목마다 문장 변형을 하나씩 뽑아 이어 붙인다.
   번호마다 다른 변형이 가도록 i를 n진수로 풀어 더하고,
   그래도 겹치는 자리가 남으면 생성 뒤에 보정 단계가 다시 뽑는다.
   ============================================================ */
const JOIN = ["", "또한 ", "아울러 ", "이와 함께 ", "한편 "];

function tri(s){ const g=new Set(); const t=String(s).replace(/\s/g,""); for(let i=0;i<=t.length-3;i++) g.add(t.slice(i,i+3)); return g; }
function sim(a,b){ const A=tri(a),B=tri(b); if(!A.size||!B.size) return 0; let n=0; A.forEach(x=>{if(B.has(x))n++;}); return n/(A.size+B.size-n); }

/* 받침이 있으면 '으로서', 없으면 '로서' */
function roseo(w){ const c=w.charCodeAt(w.length-1)-0xAC00; if(c<0||c>11171) return "으로서"; return (c%28)===0? "로서":"으로서"; }

/* 변형 고르기.
   i를 n진수로 풀어 더하지 않으면 배정 주기와 변형 개수가 맞물릴 때 겹친다
   (1·11·21번이 같은 문장). 첫 자리에는 i/L 을 한 번 더 더해 첫 문장을 갈라 놓는다.
   한 학생 안에서는 같은 문장도, 거의 같은 문장도 두 번 쓰지 않는다. */
function pickV(list, i, pos, L, used, seed){
  const n = list.length;
  if(!n) return "";
  const base = (i*(pos+1) + Math.floor(i/n) + Math.floor(i/(n*n))
              + (pos===0 ? Math.floor(i/L) : 0) + seed + pos*3) % n;
  let fallback = null;
  for(let t=0;t<n;t++){
    const v = list[((base+t)%n+n)%n];
    if(used.has(v)) continue;
    if(fallback===null) fallback = v;
    let near=false;
    for(const u of used){ if(sim(u,v) >= 0.6){ near=true; break; } }
    if(!near){ used.add(v); return v; }
  }
  const v = fallback!==null? fallback : list[((base%n)+n)%n];
  used.add(v); return v;
}
function joinTrim(parts, i, limit){
  parts = parts.filter(x=>x && x.trim());
  if(!parts.length) return "";
  const build = ps => ps.map((p,j)=>(j===0?"":JOIN[(i+j)%JOIN.length]) + p.replace(/\.+$/,"") + ".").join(" ");
  let out = build(parts);
  while(out.length > limit && parts.length > 1){ parts = parts.slice(0,-1); out = build(parts); }
  return out;
}
/* parts: [{v:[문장...], obs:"관찰 장면", lead:{name,period}|null}] */
function assembleParts(parts, i, used, seed, limit, tailObs){
  parts = parts.filter(p=>p && ((p.v&&p.v.length) || (p.obs&&p.obs.trim())));
  if(!parts.length){
    const ck = checkObs(tailObs);
    return (tailObs && !ck.blocks.length) ? joinTrim([tailObs], i, limit) : "";
  }
  const L = parts.length;
  const rot = i % L;
  const order = parts.slice(rot).concat(parts.slice(0, rot));
  const out = [];
  order.forEach((p,pos)=>{
    if(p.v && p.v.length){
      let s = pickV(p.v, i, pos, L, used, seed);
      if(p.lead) s = p.lead.name + roseo(p.lead.name) + " (" + ((p.lead.period||"").trim() || "기간 미입력") + ") 동안 " + s;
      out.push(s);
    }
    /* 관찰 장면은 그 갈래 문장 바로 뒤에 붙인다. 막힌 장면은 넣지 않는다. */
    if(p.obs && p.obs.trim() && !checkObs(p.obs).blocks.length) out.push(p.obs.trim());
  });
  if(tailObs && tailObs.trim() && !checkObs(tailObs).blocks.length) out.push(tailObs.trim());
  return joinTrim(out, i, limit);
}

/* 갈래 선택 → 조립 재료 */
function behavParts(sm){
  const out=[];
  S.behavTax.forEach(cat=>{
    const s = sm.behavior[cat.id]; if(!s) return;
    const key = (cat.keys||[])[s.i] || null;
    out.push({v: key? (SENT[key]||[]) : [], obs: s.obs||""});
  });
  return out;
}
function termParts(sm){
  const out=[];
  S.termTax.forEach(cat=>{
    const s = sm.term[cat.id]; if(!s) return;
    const key = (cat.keys||[])[s.i] || null;
    out.push({v: key? (SENT[key]||[]) : [], obs: s.obs||""});
  });
  return out;
}
function ccaParts(sm, area, i, seed){
  const arr = sm.cca[area]||[];
  if(!arr.length) return [];
  const cat = S.ccaCat[area];
  const parts = arr.map(sel=>{
    const meta = (cat.items||[]).find(x=>x.n===sel.n) || {};
    const key = meta.k || null;
    return { v: key? (SENT[key]||[]) : [],
             obs: sel.obs||"",
             lead: (meta.role || ROLE_NAMES.includes(sel.n)) ? {name:sel.n, period:sel.period||""} : null };
  });
  /* 활동이 적으면 꼬리(참여 태도·역할·기여·전이)를 더 붙인다.
     학급이 다 함께 한 활동이어도 번호마다 문장이 갈린다. */
  const TN = TAIL_KEYS.length;
  const ai = CCA_KEYS.indexOf(area);
  const want = parts.length===1 ? 3 : parts.length===2 ? 2 : 1;
  const picked=[];
  for(let t=0;t<want;t++){
    const k = TAIL_KEYS[(i + ai*3 + seed + t*(1 + (i%(TN-1)))) % TN];
    if(!picked.includes(k)) picked.push(k);
  }
  picked.forEach(k=>parts.push({v: SENT[k]||[], obs:""}));
  return parts;
}

/* 학생 한 명 */
function ruleGenerate(idx, n){
  const stu = S.students[idx], sm = sem(stu, n), i = stu.no - 1;
  const base = (S.seed|0);
  sm.off = sm.off || {};
  const sd = key => base + (sm.off[key]||0);
  const used = new Set();

  sm.out.behavior = assembleParts(behavParts(sm), i, used, sd("behavior"), LIMITS.behavior, sm.extra||"");

  sm.out.term = sm.out.term || {};
  const tp = termParts(sm);
  sm.termObs = sm.termObs || {};
  S.subjects.forEach((sj, si)=>{
    sm.out.term[sj] = assembleParts(tp.map(p=>({v:p.v, obs:p.obs})), i, used,
                                    sd("term:"+sj) + si*7, LIMITS.term, sm.termObs[sj]||"");
  });
  CCA_KEYS.forEach(area=>{
    sm.out[area] = assembleParts(ccaParts(sm, area, i, sd("cca:"+area)), i, used, sd("cca:"+area), LIMITS.cca, "");
  });
}

/* 생성 뒤에 겹친 번호만 골라 다시 뽑는다.
   공식을 아무리 다듬어도 학급 전원이 같은 활동을 하면 겹치는 자리가 남는다. */
const REPAIR_SIM = 0.5;
function outKeys(){
  const ks = [["behavior", sm=>sm.out.behavior]];
  S.subjects.forEach(sj=>ks.push(["term:"+sj, sm=>(sm.out.term||{})[sj]||""]));
  CCA_KEYS.forEach(a=>ks.push(["cca:"+a, sm=>sm.out[a]||""]));
  return ks;
}
function repairDiversity(n){
  const sems = S.students.map(st=>sem(st, n));
  for(const [key, get] of outKeys()){
    for(let round=0; round<120; round++){
      const texts = sems.map(get);
      let worstIdx=-1, worst=0;
      for(let a=0;a<sems.length;a++){
        if(!texts[a]) continue;
        for(let b2=0;b2<a;b2++){
          if(!texts[b2]) continue;
          const v = texts[a]===texts[b2] ? 1
                  : (texts[a].split(".")[0]===texts[b2].split(".")[0] ? 0.99 : sim(texts[a],texts[b2]));
          if(v >= REPAIR_SIM && v > worst){ worst=v; worstIdx=a; }
        }
      }
      if(worstIdx<0) break;
      const sm = sems[worstIdx];
      sm.off = sm.off || {};
      sm.off[key] = (sm.off[key]||0) + 1;
      ruleGenerate(worstIdx, n);
    }
  }
}

function generateOne(idx, n, alone){
  ruleGenerate(idx, n);
  save(true);
  if(alone){ openState[idx]=true; render(); toast(S.students[idx].no+"번 문장을 만들었습니다."); }
  return true;
}
async function generateAll(n){
  if(!S.students.length){ toast("학생이 없습니다."); return; }
  const ok = await confirmBox("전체 문장 생성",
    S.students.length+"명의 "+n+"학기 문장을 규칙으로 만듭니다.\n이미 적어 둔 내용은 새 문장으로 덮어씁니다.\nAI를 쓰지 않아 바로 끝납니다.");
  if(!ok) return;
  const t0 = (window.performance&&performance.now)? performance.now() : 0;
  for(let i=0;i<S.students.length;i++) ruleGenerate(i, n);
  repairDiversity(n);
  save(true); render();
  const ms = t0? Math.round(performance.now()-t0) : 0;
  toast(S.students.length+"명 완료"+(ms? " ("+ms+"ms)":""), 2600);
}
function reseedAll(n){
  S.seed = ((S.seed|0)+1)%97;
  S.students.forEach(st=>{ const sm=sem(st,n); sm.off={}; });
  for(let i=0;i<S.students.length;i++) ruleGenerate(i, n);
  repairDiversity(n);
  save(true); render();
  toast("다른 변형으로 다시 만들었습니다.", 2400);
}

/* 번호마다 서로 다른 갈래 조합을 깔아 준다 (교사가 고칠 수 있다) */
function autoAssign(opt){
  const bc = S.behavTax, tc = S.termTax;
  S.students.forEach((stu,i)=>{
    const sm = sem(stu, SEM);
    if(opt.beh && bc.length){
      sm.behavior = {};
      for(let slot=0; slot<opt.behN; slot++){
        const cat = bc[(i*(slot*2+3) + slot*5) % bc.length];
        if(!cat || !cat.items.length) continue;
        if(sm.behavior[cat.id]) continue;
        sm.behavior[cat.id] = {i: (i*(slot+2)+slot*3) % cat.items.length, obs:""};
      }
    }
    if(opt.term && tc.length){
      sm.term = {};
      for(let slot=0; slot<opt.termN; slot++){
        const cat = tc[(i*(slot+2) + slot) % tc.length];
        if(!cat || !cat.items.length) continue;
        if(sm.term[cat.id]) continue;
        sm.term[cat.id] = {i: (i*(slot+3)) % cat.items.length, obs:""};
      }
    }
  });
}
