/* ============================================================
   11-R. 규칙 엔진용 화면 — 자동 배정 · 창체 일괄 · 문장 자산 · 점검 지표
   ============================================================ */
function openAutoAssign(){
  openModal("특성 자동 배정", (b, close)=>{
    b.append(el("div",{style:"font-size:13.5px;line-height:1.85;margin-bottom:10px"},
      "번호마다 ", el("b",null,"서로 다른 갈래 조합"), "을 깔아 줍니다. 깔린 뒤에 번호별로 고쳐 주세요. ",
      el("b",null,"이미 고른 것은 덮어씁니다."), " 관찰 장면은 지워집니다."));
    const mk=(label,def)=>{ const i=el("input",{type:"checkbox"}); i.checked=def;
      b.append(el("label",{style:"display:flex;gap:6px;align-items:center;margin:5px 0;font-size:13px"}, i, label)); return i; };
    const beh = mk("행동특성 갈래를 배정한다", true);
    const behN = el("select"); [2,3,4,5].forEach(n=>behN.append(el("option",{value:n},n+"갈래"))); behN.value=4;
    b.append(el("div",{style:"margin:3px 0 10px 22px;display:flex;gap:6px;align-items:center"},"한 학생당 ",behN));
    const term = mk("학기말 갈래를 배정한다", true);
    const termN = el("select"); [2,3,4].forEach(n=>termN.append(el("option",{value:n},n+"갈래"))); termN.value=3;
    b.append(el("div",{style:"margin:3px 0 10px 22px;display:flex;gap:6px;align-items:center"},"한 학생당 ",termN));
    b.append(el("div",{class:"hint"},
      "※ 학기말은 갈래 선택이 과목 공통입니다. 과목마다 다른 문장이 나오도록 엔진이 갈라 뽑습니다."));
    b.append(el("div",{class:"hint"},
      "※ 창의적 체험활동은 반마다 한 일이 달라 자동 배정하지 않습니다. 아래 ‘창체 일괄 설정’을 쓰세요."));
    b.append(el("div",{style:"display:flex;gap:6px;justify-content:flex-end;margin-top:14px"},
      el("button",{class:"btn",onClick:close},"취소"),
      el("button",{class:"btn pri",onClick:async()=>{
        autoAssign({beh:beh.checked, behN:+behN.value, term:term.checked, termN:+termN.value});
        for(let i=0;i<S.students.length;i++) ruleGenerate(i, SEM);
        repairDiversity(SEM); save(true); close(); render();
        toast("배정하고 "+S.students.length+"명 생성했습니다.", 2800);
      }},"배정하고 생성")));
  },{width:"620px"});
}

function openCcaBulk(){
  const sel = {auto:[],club:[],career:[],service:[]};
  let mode = "add";
  openModal("창의적 체험활동 일괄 설정", (b, close)=>{
    b.append(el("div",{style:"font-size:13.5px;line-height:1.85;margin-bottom:10px"},
      "학급이 ", el("b",null,"다 함께 한 활동"), "을 골라 전체 번호에 한 번에 깝니다. 깐 뒤에 번호별로 더하거나 빼면 됩니다. ",
      el("b",{style:"color:var(--warn)"},"직위 항목은 여기서 깔지 않습니다"), " — 기간이 사람마다 달라 번호별로 넣어야 합니다."));
    CCA_KEYS.forEach(k=>{
      const cat = S.ccaCat[k];
      const box = el("div",{class:"cat"});
      const cnt = el("span",{class:"code"},"0개");
      box.append(el("div",{class:"cat-h"}, cat.label, cnt));
      const body = el("div",{class:"cat-b"});
      const chips = el("div",{class:"chips"});
      cat.items.forEach(it=>{
        if(it.role || ROLE_NAMES.includes(it.n)) return;
        const c = el("button",{class:"chip","aria-pressed":"false",onClick:()=>{
          const p = sel[k];
          const on = p.includes(it.n);
          if(on){ sel[k] = p.filter(x=>x!==it.n); c.setAttribute("aria-pressed","false"); }
          else { if(p.length>=3){ toast("영역마다 최대 3개까지 고를 수 있습니다."); return; } p.push(it.n); c.setAttribute("aria-pressed","true"); }
          cnt.textContent = sel[k].length+"개";
        }}, it.n);
        chips.append(c);
      });
      body.append(chips); box.append(body); b.append(box);
    });
    const ms = el("select");
    ms.append(el("option",{value:"add"},"지금 고른 것에 더하기"));
    ms.append(el("option",{value:"replace"},"지금 고른 것으로 바꾸기 (기존 선택을 지웁니다)"));
    ms.addEventListener("change",()=>{ mode=ms.value; });
    b.append(el("div",{style:"display:flex;gap:7px;align-items:center;margin-top:12px"},
      el("span",{style:"font-size:12.5px;font-weight:700"},"적용 방식"), ms));
    b.append(el("div",{style:"display:flex;gap:6px;justify-content:flex-end;margin-top:14px"},
      el("button",{class:"btn",onClick:close},"취소"),
      el("button",{class:"btn pri",onClick:()=>{
        const total = CCA_KEYS.reduce((a,k)=>a+sel[k].length,0);
        if(!total){ toast("고른 활동이 없습니다."); return; }
        S.students.forEach(stu=>{
          const sm = sem(stu, SEM);
          CCA_KEYS.forEach(k=>{
            if(!sel[k].length) return;
            const keep = mode==="replace"
              ? (sm.cca[k]||[]).filter(x=>ROLE_NAMES.includes(x.n))
              : (sm.cca[k]||[]).slice();
            sel[k].forEach(nm=>{ if(!keep.some(x=>x.n===nm)) keep.push({n:nm, obs:"", period:""}); });
            sm.cca[k] = keep.slice(0,3);
          });
        });
        for(let i=0;i<S.students.length;i++) ruleGenerate(i, SEM);
        repairDiversity(SEM); save(true); close(); render();
        toast("전체 "+S.students.length+"명에 적용하고 생성했습니다.", 2800);
      }},"전체 번호에 적용")));
  },{width:"880px"});
}

/* ---- 문장 자산 보기 · 고치기 · 주고받기 ---- */
function openCorpus(){
  openModal("문장 자산 "+CORPUS_COUNT.toLocaleString()+"개", (b, close)=>{
    b.append(el("div",{style:"font-size:13.5px;line-height:1.85;margin-bottom:9px"},
      "여기 있는 문장이 결과의 전부입니다. 고치면 바로 반영됩니다. ",
      el("b",null,"학교마다 자기 표현으로 다듬어 쓰면"), " 다른 학교와 겹칠 걱정이 사라집니다."));
    const tools = el("div",{style:"display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px"});
    tools.append(el("button",{class:"btn",onClick:()=>{
      const o={}; Object.keys(SENT).forEach(k=>o[k]=SENT[k]);
      saveFile("문장자산_"+(S.meta?S.meta.school:"")+".json",
        JSON.stringify({type:"neisrule-corpus", v:1, lib:o}, null, 1));
    }},"내보내기"));
    tools.append(el("button",{class:"btn",onClick:importCorpus},"들여오기"));
    tools.append(el("button",{class:"btn ghost",onClick:async()=>{
      if(!await confirmBox("처음 상태로","고친 문장을 모두 처음 상태로 되돌립니다.")) return;
      S.lib=null; Object.keys(SENT_BASE).forEach(k=>SENT[k]=SENT_BASE[k].slice());
      save(true); close(); toast("처음 상태로 되돌렸습니다.");
    }},"처음 상태로"));
    b.append(tools);
    const groups = [["행동특성", S.behavTax], ["학기말 종합의견", S.termTax]];
    groups.forEach(([title, tax])=>{
      b.append(el("div",{class:"sub-title",style:"margin-top:12px"}, title));
      tax.forEach(cat=>{
        const box = el("div",{class:"cat"});
        const body = el("div",{class:"cat-b",style:"display:none"});
        const h = el("div",{class:"cat-h",style:"cursor:pointer"}, cat.name,
          el("span",{class:"code"}, "항목 "+cat.items.length));
        h.addEventListener("click",()=>{ body.style.display = body.style.display==="none"?"":"none"; });
        cat.items.forEach((nm,i)=>{
          const key = (cat.keys||[])[i];
          const row = el("div",{style:"border-bottom:1px dashed var(--line-soft);padding:6px 0"});
          row.append(el("div",null, el("span",{class:"code"}, key||"직접 추가"), " ", el("b",null,nm)));
          if(!key){ row.append(el("div",{class:"hint"},"직접 더한 항목이라 문장 자산이 없습니다. 관찰 장면만 들어갑니다.")); }
          else (SENT[key]||[]).forEach((v,vi)=>{
            const line = el("div",{style:"display:flex;gap:6px;align-items:center;margin-top:3px"});
            line.append(el("span",{class:"muted",style:"font-size:11px;min-width:18px"},(vi+1)+"."));
            const ip = el("input",{type:"text",style:"flex:1"}); ip.value=v;
            let tm=null;
            ip.addEventListener("input",()=>{ SENT[key][vi]=ip.value; clearTimeout(tm);
              tm=setTimeout(()=>{ S.lib=S.lib||{}; S.lib[key]=SENT[key].slice(); save(true); },800); });
            line.append(ip); row.append(line);
          });
          body.append(row);
        });
        box.append(h, body); b.append(box);
      });
    });
    b.append(el("div",{class:"sub-title",style:"margin-top:12px"},"창의적 체험활동"));
    CCA_KEYS.forEach(k=>{
      const cat = S.ccaCat[k];
      const box = el("div",{class:"cat"});
      const body = el("div",{class:"cat-b",style:"display:none"});
      const h = el("div",{class:"cat-h",style:"cursor:pointer"}, cat.label, el("span",{class:"code"},"활동 "+cat.items.length));
      h.addEventListener("click",()=>{ body.style.display = body.style.display==="none"?"":"none"; });
      cat.items.forEach(it=>{
        const row = el("div",{style:"border-bottom:1px dashed var(--line-soft);padding:6px 0"});
        row.append(el("div",null, el("span",{class:"code"}, it.k||"직접 추가"), " ", el("b",null,it.n)));
        if(!it.k){ row.append(el("div",{class:"hint"},"직접 더한 활동이라 문장 자산이 없습니다. 관찰 장면만 들어갑니다.")); }
        else (SENT[it.k]||[]).forEach((v,vi)=>{
          const line = el("div",{style:"display:flex;gap:6px;align-items:center;margin-top:3px"});
          line.append(el("span",{class:"muted",style:"font-size:11px;min-width:18px"},(vi+1)+"."));
          const ip = el("input",{type:"text",style:"flex:1"}); ip.value=v;
          let tm=null;
          ip.addEventListener("input",()=>{ SENT[it.k][vi]=ip.value; clearTimeout(tm);
            tm=setTimeout(()=>{ S.lib=S.lib||{}; S.lib[it.k]=SENT[it.k].slice(); save(true); },800); });
          line.append(ip); row.append(line);
        });
        body.append(row);
      });
      box.append(h, body); b.append(box);
    });
    b.append(el("div",{class:"sub-title",style:"margin-top:12px"},"창체 꼬리 — 참여 태도·역할·기여·전이"));
    TAIL_KEYS.forEach((k,ti)=>{
      const box = el("div",{class:"cat"});
      const body = el("div",{class:"cat-b",style:"display:none"});
      const h = el("div",{class:"cat-h",style:"cursor:pointer"}, TAIL_NAMES[ti], el("span",{class:"code"}, k));
      h.addEventListener("click",()=>{ body.style.display = body.style.display==="none"?"":"none"; });
      (SENT[k]||[]).forEach((v,vi)=>{
        const line = el("div",{style:"display:flex;gap:6px;align-items:center;margin-top:3px"});
        line.append(el("span",{class:"muted",style:"font-size:11px;min-width:18px"},(vi+1)+"."));
        const ip = el("input",{type:"text",style:"flex:1"}); ip.value=v;
        let tm=null;
        ip.addEventListener("input",()=>{ SENT[k][vi]=ip.value; clearTimeout(tm);
          tm=setTimeout(()=>{ S.lib=S.lib||{}; S.lib[k]=SENT[k].slice(); save(true); },800); });
        line.append(ip); body.append(line);
      });
      box.append(h, body); b.append(box);
    });
    b.append(el("div",{style:"display:flex;justify-content:flex-end;margin-top:12px"},
      el("button",{class:"btn",onClick:()=>{ close(); render(); }},"닫기")));
  },{width:"940px"});
}
function importCorpus(){
  const inp = el("input",{type:"file",accept:".json",style:"display:none"});
  inp.addEventListener("change",()=>{
    const f = inp.files && inp.files[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = ()=>{ try{
      const o = JSON.parse(rd.result);
      if(!o || o.type!=="neisrule-corpus" || !o.lib){ toast("이 도우미에서 내보낸 문장 자산 파일이 아닙니다.",3400); return; }
      let n=0;
      Object.keys(o.lib).forEach(k=>{ if(SENT[k] && Array.isArray(o.lib[k]) && o.lib[k].length){ SENT[k]=o.lib[k].slice(); n++; } });
      S.lib = S.lib||{}; Object.keys(o.lib).forEach(k=>{ if(SENT[k]) S.lib[k]=SENT[k].slice(); });
      save(true); render(); toast("항목 "+n+"개의 문장을 들여왔습니다.", 3000);
    }catch(e){ toast("파일을 읽지 못했습니다.",3200); } };
    rd.readAsText(f,"utf-8");
  });
  document.body.append(inp); inp.click(); setTimeout(()=>inp.remove(),1000);
}

/* ---- 점검 지표 ---- */
function openMetrics(){
  openModal("점검 지표 · "+SEM+"학기", (b, close)=>{
    b.append(el("div",{style:"font-size:13.5px;line-height:1.85;margin-bottom:10px"},
      "한 반 안에서 문장이 겹치지 않는지 숫자로 봅니다. 겹침이 보이면 ",
      el("b",null,"↻ 다른 변형으로"), " 를 눌러 다시 뽑으세요."));
    const sems = S.students.map(st=>sem(st, SEM));
    outKeys().forEach(([key,get])=>{
      const label = key==="behavior" ? "행동특성 및 종합의견"
                  : key.startsWith("term:") ? "학기말 — "+key.slice(5)
                  : "창의적 체험활동 — "+({auto:"자율활동",club:"동아리활동",career:"진로활동",service:"봉사활동"}[key.slice(4)]);
      const t = sems.map(get).filter(Boolean);
      const box = el("div",{style:"border:1px solid var(--line-soft);padding:9px 11px;margin-bottom:6px"});
      box.append(el("div",{style:"font-weight:700;font-size:12.5px;margin-bottom:5px"}, label));
      if(t.length<2){ box.append(el("span",{class:"muted",style:"font-size:12px"},"생성된 문장이 "+t.length+"개입니다.")); }
      else{
        const f = t.map(x=>x.split(".")[0]);
        let worst=0, pair="";
        for(let i=0;i<t.length;i++) for(let j=i+1;j<t.length;j++){ const v=sim(t[i],t[j]); if(v>worst){worst=v;pair=(i+1)+"·"+(j+1);} }
        const u=new Set(t).size, uf=new Set(f).size;
        const row = el("div",{style:"display:flex;gap:10px;flex-wrap:wrap;font-size:12px"});
        const cell=(ttl,val,ok,sub)=>el("div",{style:"flex:1 1 140px;border:1px solid var(--line-soft);background:var(--panel-2);padding:7px 9px"},
          ttl, el("b",{style:"display:block;font-size:17px;margin-top:2px;color:"+(ok?"var(--ok)":"var(--warn)")}, val),
          sub? el("span",{class:"muted",style:"font-size:11px"},sub):null);
        row.append(cell("서로 다른 문장", u+" / "+t.length, u===t.length));
        row.append(cell("서로 다른 첫 문장", uf+" / "+t.length, uf>=t.length*0.85));
        row.append(cell("가장 비슷한 두 문장", Math.round(worst*100)+"%", worst<0.5, pair?pair+"번":""));
        box.append(row);
      }
      b.append(box);
    });
    b.append(el("div",{style:"display:flex;justify-content:flex-end;margin-top:12px"},
      el("button",{class:"btn",onClick:close},"닫기")));
  },{width:"860px"});
}
