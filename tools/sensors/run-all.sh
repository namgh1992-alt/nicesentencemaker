#!/bin/sh
# 전체 점검. 저장소 뿌리에서: sh tools/sensors/run-all.sh
cd "$(dirname "$0")/../.." || exit 1
FAIL=0
echo "════════════════════════════════════════════════"
echo " 나이스 문장 도우미 — 자동 점검"
echo "════════════════════════════════════════════════"
for S in tools/sensors/0[1236]*.sh; do sh "$S" index.html || FAIL=1; echo; done
node tools/sensors/04-corpus.mjs src/corpus/*.js || FAIL=1; echo
node tools/sensors/07-past-tense.mjs src/corpus/*.js || FAIL=1; echo
python3 tools/sensors/05-diversity.py index.html || FAIL=1; echo
echo "════════════════════════════════════════════════"
[ "$FAIL" -eq 0 ] && echo " 모든 점검 통과" || echo " ✗ 통과하지 못한 점검이 있습니다"
echo "════════════════════════════════════════════════"
exit $FAIL
