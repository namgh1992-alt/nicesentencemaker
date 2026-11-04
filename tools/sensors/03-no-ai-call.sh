#!/bin/sh
# 토큰 0 — 문장을 만드는 데 AI를 부르지 않습니다.
SRC="${1:-index.html}"; FAIL=0
echo "[03] AI 비호출 — $SRC"
for PAT in 'use("sample")' "use('sample')" 'SAMPLE' 'buildPrompt' 'modelTier'; do
  N=$(grep -cF "$PAT" "$SRC" 2>/dev/null); N=${N:-0}
  [ "$N" -gt 0 ] && { echo "    ✗ AI 호출 흔적: $PAT ($N건)"; FAIL=1; }
done
[ "$FAIL" -eq 0 ] && echo "    ✓ 통과 — AI 호출 0건, 토큰 0"
exit $FAIL
