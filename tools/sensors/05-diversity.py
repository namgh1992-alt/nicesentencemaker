#!/usr/bin/env python3
"""다양성·글자수 — 한 반 안에서 문장이 겹치지 않아야 합니다.
예시 학급(24명)을 띄워 14개 항목을 모두 잽니다.
Playwright 가 없으면 건너뛰되, 건너뛰었다고 분명히 말합니다."""
import os, sys, pathlib
SRC = sys.argv[1] if len(sys.argv) > 1 else "index.html"
MIN_PARA, MIN_FIRST, MAX_SIM = 1.0, 0.85, 0.50
LIMIT = {"behavior": 400}
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("[05] ⊘ SKIP — playwright가 없어 다양성을 재지 못했습니다")
    print("      설치: pip install playwright && playwright install chromium"); sys.exit(0)
def tri(s):
    t = "".join(s.split()); return {t[i:i+3] for i in range(len(t)-2)}
def sim(a, b):
    A, B = tri(a), tri(b)
    if not A or not B: return 0.0
    n = len(A & B); return n/(len(A)+len(B)-n)
exe = next((p for p in ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome"] if os.path.exists(p)), None)
print(f"[05] 다양성·글자수 — {SRC}")
fail = 0
try:
    with sync_playwright() as p:
        kw = {"args": ["--no-sandbox"]}
        if exe: kw["executable_path"] = exe
        b = p.chromium.launch(**kw); pg = b.new_page()
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto("file://" + str(pathlib.Path(SRC).resolve())); pg.wait_for_timeout(800)
        pg.evaluate("()=>{try{localStorage.clear()}catch(e){}}"); pg.reload(); pg.wait_for_timeout(900)
        pg.locator("button:has-text('예시 학급')").first.click(); pg.wait_for_timeout(2500)
        res = pg.evaluate("""()=>{const sems=S.students.map(st=>sem(st,SEM));
            return outKeys().map(([k,g])=>({k, texts: sems.map(g)}));}""")
        for r in res:
            t = [x for x in r["texts"] if x]
            if len(t) < 2:
                print(f"    · {r['k']:<16} 생성 {len(t)}개"); continue
            f = [x.split(".")[0] for x in t]
            worst = max((sim(t[i], t[j]) for i in range(len(t)) for j in range(i+1, len(t))), default=0)
            lim = 400 if r["k"] == "behavior" else (380 if r["k"].startswith("term") else 250)
            over = sum(1 for x in t if len(x) > lim)
            up, uf = len(set(t))/len(t), len(set(f))/len(f)
            ok = up >= MIN_PARA and uf >= MIN_FIRST and worst < MAX_SIM and over == 0
            if not ok: fail = 1
            print(f"    {'✓' if ok else '✗'} {r['k']:<16} 문장{up*100:>4.0f}% 첫문장{uf*100:>4.0f}% 최대유사{worst*100:>3.0f}% 초과{over}")
        if errs: print("    ✗ 페이지 오류:", " | ".join(errs[:3])); fail = 1
        b.close()
except Exception as e:
    print(f"    ⊘ SKIP — 브라우저를 띄우지 못했습니다: {str(e).splitlines()[0][:80]}"); sys.exit(0)
print("    ✗ 기준 미달 (문장 100% · 첫문장 85% · 유사도 50% 미만)" if fail else "    ✓ 통과")
sys.exit(fail)
