# -*- coding: utf-8 -*-
"""본편(학교생활기록부 문장 도우미)의 AI 생성 경로를 규칙 엔진으로 갈아끼운다."""
import io, re, sys

SRC = "src/base-app.html"
OUT = "index.html"
s = io.open(SRC, encoding="utf-8").read()
orig_len = len(s)
steps = []
def rep(name, old, new, count=1):
    global s
    if old not in s:
        print("✗ 실패:", name); sys.exit(1)
    s = s.replace(old, new, count)
    steps.append(name)

read = lambda f: io.open("src/parts/"+f, encoding="utf-8").read()

# ── 1. CSS 추가 ───────────────────────────────────────────────
rep("CSS", "</style>", """
/* 규칙 엔진 점검 표시 */
.rchk{display:flex;gap:7px;align-items:baseline;flex-wrap:wrap;font-size:11.5px;margin-top:4px;padding:4px 8px;border-left:3px solid var(--line)}
.rchk b{flex:0 0 auto;font-size:11px;padding:0 5px;border-radius:2px;color:#fff}
.rchk .muted{font-size:11px}
.rchk.blk{background:#fdeceb;border-left-color:#b4291a}.rchk.blk b{background:#b4291a}
.rchk.fix{background:#fdf4e6;border-left-color:#B5812A}.rchk.fix b{background:#B5812A}
.rchk.warn{background:#fff9e3;border-left-color:#8a6d13}.rchk.warn b{background:#8a6d13}
.rchk.note{background:var(--panel-2);border-left-color:var(--line);color:var(--ink-2);font-size:11px}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .rchk.blk{background:#3a211e}
 :root:not([data-theme="light"]) .rchk.fix{background:#352c1c}
 :root:not([data-theme="light"]) .rchk.warn{background:#322e1a}}
.hint{color:var(--blue-t,#1d5fa8);font-size:12px;margin:7px 2px;line-height:1.7}
</style>""")

# ── 2. 문장 자산 교체 ─────────────────────────────────────────
i = s.index("const BEHAV_TAXONOMY_DEFAULT = [")
j = s.index('const ROLE_NAMES = ["학급회장","전교학생회장","학급부회장","전교학생부회장"];')
tail = 'const CCA_KEYS = ["auto","club","career","service"];\nconst ROLE_NAMES = ["학급회장","전교학생회장","학급부회장","전교학생부회장"];\n'
s = s[:i] + read("rule-data.js") + "\n" + tail + \
    "/* 처음 상태 — '처음 상태로' 단추가 되돌릴 기준 */\n" + \
    "const SENT_BASE = JSON.parse(JSON.stringify(SENT));\n" + s[j+len(tail.split('\n')[1])+1:]
steps.append("문장 자산 교체")

# ── 3. 상태: seed / 자산 복원 / 옛 갈래 이주 ───────────────────
rep("newSession seed", "    key: sessKey(meta), meta: meta, _ts: Date.now(),",
    "    key: sessKey(meta), meta: meta, _ts: Date.now(), seed: 0,")
rep("ensureShape 이주", """  st.behavTax = st.behavTax||JSON.parse(JSON.stringify(BEHAV_TAXONOMY_DEFAULT));
  st.termTax  = st.termTax ||JSON.parse(JSON.stringify(TERM_TAXONOMY_DEFAULT));
  st.ccaCat   = st.ccaCat  ||JSON.parse(JSON.stringify(CCA_DEFAULT));""",
"""  st.seed = st.seed|0;
  /* 규칙 엔진 이전에 저장한 학급은 갈래에 키가 없다.
     키가 없으면 문장을 찾을 수 없으므로 갈래를 새로 깔고 선택만 비운다.
     이미 만들어 둔 문장은 그대로 남는다. */
  const needsMigrate = !st.behavTax || !st.behavTax.length || !st.behavTax[0].keys;
  if(needsMigrate){
    st.behavTax = JSON.parse(JSON.stringify(BEHAV_TAXONOMY_DEFAULT));
    st.termTax  = JSON.parse(JSON.stringify(TERM_TAXONOMY_DEFAULT));
    st.ccaCat   = JSON.parse(JSON.stringify(CCA_DEFAULT));
    (st.students||[]).forEach(s2=>["s1","s2"].forEach(k=>{
      if(!s2[k]) return;
      s2[k].behavior = {}; s2[k].term = {};
      s2[k].cca = {auto:[],club:[],career:[],service:[]};
    }));
    st._migrated = true;
  }
  st.behavTax = st.behavTax||JSON.parse(JSON.stringify(BEHAV_TAXONOMY_DEFAULT));
  st.termTax  = st.termTax ||JSON.parse(JSON.stringify(TERM_TAXONOMY_DEFAULT));
  st.ccaCat   = st.ccaCat  ||JSON.parse(JSON.stringify(CCA_DEFAULT));
  /* 교사가 고친 문장을 되살린다 */
  if(st.lib){ Object.keys(st.lib).forEach(k=>{ if(SENT[k] && Array.isArray(st.lib[k]) && st.lib[k].length) SENT[k]=st.lib[k].slice(); }); }
  else { Object.keys(SENT_BASE).forEach(k=>{ SENT[k]=SENT_BASE[k].slice(); }); }""")
rep("ensureShape termObs", "      s[k].out=s[k].out||{behavior:\"\",term:{},auto:\"\",club:\"\",career:\"\",service:\"\"};",
    "      s[k].termObs = s[k].termObs||{};\n      s[k].off = s[k].off||{};\n      s[k].out=s[k].out||{behavior:\"\",term:{},auto:\"\",club:\"\",career:\"\",service:\"\"};")

# ── 4. 갈래 편집: 키도 함께 움직인다 ───────────────────────────
rep("catEditor 삭제시 키", """            cat.items.splice(i,1);
            const s=cur(); if(s){ if(s.i===i) delete store[cat.id]; else if(s.i>i) s.i--; }""",
"""            cat.items.splice(i,1);
            if(cat.keys) cat.keys.splice(i,1);
            const s=cur(); if(s){ if(s.i===i) delete store[cat.id]; else if(s.i>i) s.i--; }""")
rep("catEditor 추가시 키", """      if(v){ cat.items.push(v); drawChips(); onChange&&onChange(); }""",
"""      if(v){ cat.items.push(v); (cat.keys=cat.keys||[]).push(null); drawChips(); onChange&&onChange();
             toast("직접 더한 항목에는 문장 자산이 없습니다. 관찰 장면만 들어갑니다.", 4200); }""")
rep("ccaSection 추가 안내", """    cat.items.push({n:n, d:d||""}); save(); drawChips(); toast("활동을 추가했습니다.");""",
"""    cat.items.push({n:n, d:d||"", k:null}); save(); drawChips();
    toast("직접 더한 활동에는 문장 자산이 없습니다. 관찰 장면만 들어갑니다.", 4200);""")

# ── 5. 관찰 장면 점검 표시 ────────────────────────────────────
rep("catEditor 점검", """      ta.addEventListener("input",()=>{ s.obs=ta.value; onChange&&onChange(); });
      obsWrap.append(lab,ta);""",
"""      let ck = obsCheckNode(s.obs, nv=>{ s.obs=nv; ta.value=nv; onChange&&onChange(); redraw(); });
      let tmr=null;
      function redraw(){ const n2=obsCheckNode(s.obs, nv=>{ s.obs=nv; ta.value=nv; onChange&&onChange(); redraw(); });
        ck.replaceWith(n2); ck=n2; }
      ta.addEventListener("input",()=>{ s.obs=ta.value; onChange&&onChange();
        clearTimeout(tmr); tmr=setTimeout(redraw, 600); });
      obsWrap.append(lab,ta,ck);""")
rep("ccaSection 점검", """      ta.addEventListener("input",()=>{ sel.obs=ta.value; save(); });
      box.append(el("label",{style:"display:block;color:var(--ink-2);font-size:12px;margin:6px 0 3px"},"관찰 장면"), ta);""",
"""      let ck = obsCheckNode(sel.obs, nv=>{ sel.obs=nv; ta.value=nv; save(); redraw(); });
      let tmr=null;
      function redraw(){ const n2=obsCheckNode(sel.obs, nv=>{ sel.obs=nv; ta.value=nv; save(); redraw(); });
        ck.replaceWith(n2); ck=n2; }
      ta.addEventListener("input",()=>{ sel.obs=ta.value; save(); clearTimeout(tmr); tmr=setTimeout(redraw,600); });
      box.append(el("label",{style:"display:block;color:var(--ink-2);font-size:12px;margin:6px 0 3px"},"관찰 장면"), ta, ck);""")

# ── 6. 학기말 탭에 과목별 관찰 장면 ───────────────────────────
rep("과목별 관찰 장면", """      } else if(cur==="term"){
        panel.append(catEditor(S.termTax, sm.term, ()=>save(), {}));""",
"""      } else if(cur==="term"){
        panel.append(catEditor(S.termTax, sm.term, ()=>save(), {}));
        panel.append(el("div",{class:"sub-title",style:"margin-top:14px"},"과목별 관찰 장면"));
        panel.append(el("div",{class:"hint",style:"margin-top:0"},
          "위 갈래는 과목 공통입니다. 과목마다 다른 내용을 넣고 싶으면 여기에 적어 주세요. 그 과목 문장 끝에 붙습니다."));
        sm.termObs = sm.termObs || {};
        (S.subjects.length? S.subjects : []).forEach(sj=>{
          const w = el("div",{style:"margin-bottom:8px"});
          w.append(el("label",{style:"display:block;color:var(--ink-2);font-size:12px;margin:4px 0 3px"}, sj));
          const ta2 = el("textarea",{rows:"2",placeholder:"예) 분수의 덧셈에서 그림으로 풀이를 나타내 설명함"});
          ta2.value = sm.termObs[sj]||"";
          let ck2 = obsCheckNode(ta2.value, nv=>{ sm.termObs[sj]=nv; ta2.value=nv; save(); redraw2(); });
          let t2=null;
          function redraw2(){ const n3=obsCheckNode(sm.termObs[sj]||"", nv=>{ sm.termObs[sj]=nv; ta2.value=nv; save(); redraw2(); });
            ck2.replaceWith(n3); ck2=n3; }
          ta2.addEventListener("input",()=>{ sm.termObs[sj]=ta2.value; save(); clearTimeout(t2); t2=setTimeout(redraw2,600); });
          w.append(ta2, ck2); panel.append(w);
        });
        if(!S.subjects.length) panel.append(el("div",{class:"muted",style:"font-size:12px"},"과목이 설정되어 있지 않습니다."));""")

# ── 7. 문장 생성 섹션 통째 교체 ───────────────────────────────
i = s.index("function codeLines(tax, store){")
j = s.index("/* ============================================================\n   13. 표 내려받기")
keep_subj = """function subjectsWithEval(n){
  const evs = S.evals[n]||[];
  return S.subjects.filter(sj=> evs.some(e=>e.subject===sj));
}
"""
s = s[:i] + keep_subj + read("rule-engine.js") + "\n" + read("rule-ui.js") + "\n" + s[j:]
steps.append("문장 생성 교체")

# ── 8. 맞춤법: 규칙 기반으로 ─────────────────────────────────
i = s.index("async function runSpell(scope, onProg){")
j = s.index("function spellLogPanel(){")
s = s[:i] + read("rule-check.js") + "\n" + s[j:]
steps.append("맞춤법 교체")

# ── 9. sample 걷어내기 ───────────────────────────────────────
rep("capInit", """  const [db, sp, dl, us] = await Promise.all([get("db"), get("sample"), get("downloads"), get("user")]);
  DB = db || null; SAMPLE = sp || null; DL = dl || null;""",
"""  const [db, dl, us] = await Promise.all([get("db"), get("downloads"), get("user")]);
  DB = db || null; DL = dl || null;   /* sample(AI)은 쓰지 않는다 */""")
rep("capInit 끝", """  capState = SAMPLE ? "ready" : "nosample";
  if(capState==="nosample" && S && screen==="main") render();   // 단추까지 다시 그려 잠근다
  else refreshCapWarn();""",
"""  capState = "ready";   /* 문장은 규칙으로 만든다. AI 허용 여부와 무관하다. */
  refreshCapWarn();""")
rep("capInit 초입", """    capState = "nosample"; refreshCapWarn(); return;""",
"""    capState = "ready"; refreshCapWarn(); return;   /* 브라우저만으로도 문장 생성이 된다 */""")
rep("refreshCapWarn", """  if(capState !== "nosample") return;""", """  return;   /* AI를 쓰지 않으므로 안내할 것이 없다 */""")
s = s.replace(""" disabled: capState==="nosample"? "disabled":null,
      title: capState==="nosample"? "이 창에서는 쓸 수 없습니다":null,
""", "")
s = s.replace(""" disabled: capState==="nosample"? "disabled":null,
      title: capState==="nosample"? "이 창에서는 쓸 수 없습니다":null,""", "")
steps.append("sample 제거")

# ── 10. saveFile: 브라우저 내려받기로 대체 가능하게 ───────────
rep("saveFile 대체", """  if(!DL){ await capInit(); }
  if(!DL){ toast("이 화면에서는 파일 내려받기를 쓸 수 없습니다.", 3200); return; }""",
"""  if(!DL){ await capInit(); }
  if(!DL){
    /* 아티팩트 밖(깃허브 Pages 등)에서는 브라우저 내려받기를 쓴다 */
    try{
      const blob = (data instanceof Blob) ? data : new Blob([data], {type:"application/octet-stream"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; document.body.append(a); a.click();
      setTimeout(()=>{ a.remove(); URL.revokeObjectURL(url); }, 1200);
      toast("저장했습니다.");
    }catch(e){ toast("저장하지 못했습니다.", 3200); }
    return;
  }""")


# ── 아래는 위 단계들이 쓰는 긴 문자열 ──
CDN_OLD = ('<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>\n'
           '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>')
CDN_NEW = ("<!-- \ud55c\uae00\u00b7\uc5d1\uc140 \ud30c\uc77c\uc744 \ub9cc\ub4e4 \ub54c\ub9cc \uc4f0\ub294 \ub77c\uc774\ube0c\ub7ec\ub9ac\uc785\ub2c8\ub2e4. \uac19\uc740 \ud3f4\ub354\uc5d0 \ud568\uaed8 \ub450\uc5b4\n"
           "     \uc778\ud130\ub137\uc774 \ub04a\uae34 \uad50\uc2e4\uc5d0\uc11c\ub3c4 \ub3d9\uc791\ud569\ub2c8\ub2e4. (JSZip 3.10.1 MIT, SheetJS 0.18.5 Apache-2.0) -->\n"
           '<script src="vendor/jszip.min.js"></script>\n'
           '<script src="vendor/xlsx.full.min.js"></script>')

TOOLBAR_OLD = ('    el("button",{class:"btn",      onClick:openSpell},"\u2713 \ub9de\ucda4\ubc95 \uc810\uac80"),\n'
               '    el("button",{class:"btn pri",      onClick:()=>generateAll(SEM)},"\uc804\uccb4 \ubb38\uc7a5 \uc0dd\uc131")')
TOOLBAR_NEW = ('    el("button",{class:"btn",      onClick:openAutoAssign},"\ud2b9\uc131 \uc790\ub3d9 \ubc30\uc815"),\n'
               '    el("button",{class:"btn",      onClick:openCcaBulk},"\ucc3d\uccb4 \uc77c\uad04 \uc124\uc815"),\n'
               '    el("button",{class:"btn",      onClick:openCorpus},"\ubb38\uc7a5 \uc790\uc0b0"),\n'
               '    el("button",{class:"btn",      onClick:openMetrics},"\uc810\uac80 \uc9c0\ud45c"),\n'
               '    el("button",{class:"btn",      onClick:openSpell},"\u2713 \ub9de\ucda4\ubc95 \uc810\uac80"),\n'
               '    el("button",{class:"btn",      onClick:()=>reseedAll(SEM)},"\u21bb \ub2e4\ub978 \ubcc0\ud615\uc73c\ub85c"),\n'
               '    el("button",{class:"btn pri",      onClick:()=>generateAll(SEM)},"\uc804\uccb4 \ubb38\uc7a5 \uc0dd\uc131")')

MIGRATE_NOTICE = ("let migrateNoticed = false;\n"
 "function render(){\n"
 "  if(S && S._migrated && !migrateNoticed){\n"
 "    migrateNoticed = true;\n"
 '    setTimeout(()=>toast("\ubb38\uc7a5\uc744 \uaddc\uce59\uc73c\ub85c \ub9cc\ub4dc\ub294 \ubc29\uc2dd\uc73c\ub85c \ubc14\ub00c\uc5b4 \uac08\ub798 \ubaa9\ub85d\uc744 \uc0c8\ub85c \uae54\uc558\uc2b5\ub2c8\ub2e4. \ubc88\ud638\ubcc4 \ud2b9\uc131 \uc120\ud0dd\uc744 \ub2e4\uc2dc \uace8\ub77c \uc8fc\uc138\uc694. \uc774\ubbf8 \ub9cc\ub4e4\uc5b4 \ub454 \ubb38\uc7a5\uc740 \uadf8\ub300\ub85c \uc788\uc2b5\ub2c8\ub2e4.", 7000), 400);\n'
 "    S._migrated = false;\n"
 "  }")

DEMO_COMMENT = ("/* \uc608\uc2dc \ud559\uae09\uc758 \ubb38\uc7a5\uc740 \uaddc\uce59 \uc5d4\uc9c4\uc774 \uadf8 \uc790\ub9ac\uc5d0\uc11c \ub9cc\ub4ed\ub2c8\ub2e4.\n"
                "   (\uc804\uc5d0 \uc4f0\ub358 \uace0\uc815 \ubb38\uc7a5 \ub354\ubbf8\ub294 \uc9c0\uc6e0\uc2b5\ub2c8\ub2e4) */\n")

DEMO_ANCHOR_A = '  const roles = {1:"\ud559\uae09\ud68c\uc7a5", 2:"\ud559\uae09\ubd80\ud68c\uc7a5", 3:"\uc804\uad50\ud559\uc0dd\ud68c\uc7a5"};'
DEMO_ANCHOR_B = "    st.students.push(stu);\n  }\n  inheritSem2Of(st);"

DEMO_GEN_OLD = ("  inheritSem2Of(st);\n"
                "  st._ts = Date.now();\n"
                "  return st;\n}")
DEMO_GEN_NEW = ("  inheritSem2Of(st);\n"
 "  /* \ubb38\uc7a5\uc740 \uaddc\uce59 \uc5d4\uc9c4\uc774 \uadf8 \uc790\ub9ac\uc5d0\uc11c \ub9cc\ub4e0\ub2e4. \uc2e4\uc81c\ub85c \ub098\uc624\ub294 \uacb0\uacfc\ub97c \uadf8\ub300\ub85c \ubcf4\uc5ec \uc8fc\uae30 \uc704\ud574\uc11c\ub2e4. */\n"
 "  const keepS = S, keepSem = SEM;\n"
 "  S = st; SEM = 1;\n"
 "  try{\n"
 "    for(let i=0;i<st.students.length;i++) ruleGenerate(i, 1);\n"
 "    repairDiversity(1);\n"
 "  } finally { S = keepS; SEM = keepSem; }\n"
 "  st._ts = Date.now();\n"
 "  return st;\n}")

# ── 11. 라이브러리를 저장소 안에서 읽는다 (인터넷이 끊긴 교실에서도 동작) ──
rep("라이브러리",
 CDN_OLD, CDN_NEW)

# ── 12. 툴바에 규칙 엔진 단추 ──
rep("툴바", TOOLBAR_OLD, TOOLBAR_NEW)
rep("SAMPLE 변수", "let DB = null, SAMPLE = null, DL = null;", "let DB = null, DL = null;")

# ── 13. 이주 안내 한 번만 ──
rep("이주 안내", "function render(){", MIGRATE_NOTICE)

# ── 14. 예시 학급도 규칙 엔진으로 ──
i2 = s.index("const D_BEH_1 = [")
j2 = s.index("function buildDemo(){")
s = s[:i2] + DEMO_COMMENT + s[j2:]
steps.append("옛 고정 문장 더미 삭제")

a2 = s.index(DEMO_ANCHOR_A)
b2 = s.index(DEMO_ANCHOR_B)
s = s[:a2] + read("demo-body.js") + s[b2:]
steps.append("예시 학급 선택 교체")

rep("예시 학급 생성", DEMO_GEN_OLD, DEMO_GEN_NEW)



# ── 15. AI 시절 문구 정리 ──
rep("예시 학급 안내",
 '"실제 학생이 아니라 지어낸 4학년 24명입니다. 문장은 미리 채워 둔 것이라 \u2018전체 문장 생성\u2019을 누르지 않아도 됩니다. ",\n'
 '          "마음껏 눌러 보고 고쳐 보세요. 내려받기와 나이스 붙여넣기도 그대로 됩니다. ",\n'
 '          el("span",{style:"color:#8A5A12"},"문장을 새로 만드는 단추는 잠겨 있습니다."))),',
 '"실제 학생이 아니라 지어낸 4학년 24명입니다. 문장은 규칙으로 만들어 둔 것이라 그대로 둘러보셔도 되고, ",\n'
 '          "\u2018전체 문장 생성\u2019이나 \u21bb \u2018다른 변형으로\u2019를 눌러 다시 만들어 보셔도 됩니다. ",\n'
 '          el("span",{style:"color:#8A5A12"},"여기서 한 일은 계정에 저장되지 않습니다."))),')

rep("평가 내역 안내",
 '    panel.append(el("div",{class:"hint"},\n'
 '      "* 평가 내역이 없는 과목은 문장을 만들지 않습니다 \u2192 "+noEv.join(", ")+" \u00b7 \u2018평가 관리\u2019에서 성취기준과 평가 내용을 넣어 주세요."));',
 '    panel.append(el("div",{class:"hint"},\n'
 '      "* \u2018평가 관리\u2019에 성취기준과 평가 내용이 없는 과목 \u2192 "+noEv.join(", ")+"\\n"+\n'
 '      "   문장은 고른 갈래로 모든 과목에 만들어집니다. 과목마다 다른 내용을 넣고 싶으면 \u2018특성\u00b7활동 설정 \u2192 학기말\u2019의 과목별 관찰 장면에 적어 주세요."));')

io.open(OUT, "w", encoding="utf-8").write(s)
print("패치 완료:", ", ".join(steps))
print("크기:", orig_len, "->", len(s))
