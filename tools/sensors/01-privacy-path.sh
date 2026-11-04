#!/bin/sh
# 개인정보 격리 — 학급 데이터가 data/users/<내 계정>/ 밖으로 나가면 안 됩니다.
SRC="${1:-index.html}"; FAIL=0
echo "[01] 개인정보 경로 — $SRC"
TOTAL=$(grep -c 'DB\.doc(' "$SRC" 2>/dev/null); TOTAL=${TOTAL:-0}
OK=$(grep -o 'DB\.doc([^)]*)' "$SRC" 2>/dev/null | grep -cE 'docPath\(|"gradeEvals/"'); OK=${OK:-0}
echo "    DB.doc 호출 $TOTAL건 중 허용 경로 $OK건"
if [ "$TOTAL" -ne "$OK" ]; then
  echo "    ✗ 허용되지 않은 경로로 쓰는 호출:"; grep -no 'DB\.doc([^)]*)' "$SRC" | grep -vE 'docPath\(|"gradeEvals/"'; FAIL=1
fi
grep -q 'function docPath(key){ return UID ? ("data/users/"+UID+"/"+key) : null;' "$SRC" || { echo "    ✗ docPath()가 data/users/<UID>/ 로 시작하지 않습니다"; FAIL=1; }
[ "$FAIL" -eq 0 ] && echo "    ✓ 통과"
exit $FAIL
