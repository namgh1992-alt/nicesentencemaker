#!/bin/sh
# 나이스 비접촉 — 나이스 화면을 건드리거나 콘솔을 쓰게 하면 안 됩니다.
SRC="${1:-index.html}"; FAIL=0
echo "[02] 나이스 비접촉 — $SRC"
for PAT in 'buildScript' '__NEIS' '개발자 도구' 'F12' '콘솔에 붙여' 'javascript:' 'contentWindow' 'postMessage' 'document.domain'; do
  N=$(grep -cF "$PAT" "$SRC" 2>/dev/null); N=${N:-0}
  [ "$N" -gt 0 ] && { echo "    ✗ 금지 패턴: $PAT ($N건)"; FAIL=1; }
done
[ "$FAIL" -eq 0 ] && echo "    ✓ 통과"
exit $FAIL
