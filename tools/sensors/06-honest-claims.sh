#!/bin/sh
# 정직한 표현 — 확인 못 한 것을 확인한 척하면 안 됩니다.
SRC="${1:-index.html}"; FAIL=0
echo "[06] 정직한 표현 — $SRC"
HITS=$(grep -nE '검사 ?완료|모두 ?맞습니다|오류가 ?없습니다|완벽' "$SRC" 2>/dev/null \
       | grep -vE '쓰지 ?않|않습니다|BLOCK|FIX_SP|금지|re:/')
if [ -n "$HITS" ]; then echo "    ✗ 완전성을 주장하는 문구:"; echo "$HITS" | cut -c1-110 | head -5; FAIL=1
else echo "    ✓ 통과 (부정형과 금지어 사전 항목은 빼고 셉니다)"; fi
exit $FAIL
