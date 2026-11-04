#!/bin/sh
# index.html 을 다시 만듭니다.
#   src/corpus/*.js  →  src/parts/rule-data.js   (문장 자산을 코드로)
#   src/base-app.html + src/parts/*.js  →  index.html
# 문장을 고친 뒤에는 이 스크립트를 돌리세요.
set -e
cd "$(dirname "$0")/.."
echo "① 문장 자산을 코드로 바꿉니다"
node tools/gen-data.mjs
echo "② index.html 을 다시 만듭니다"
python3 tools/patch.py
echo "③ 점검을 돌립니다"
sh tools/sensors/run-all.sh

echo "④ 한 파일짜리 판을 만듭니다 (Claude 아티팩트 등 파일을 여럿 둘 수 없는 곳용)"
python3 - <<'PY'
import io
s=io.open("index.html",encoding="utf-8").read()
old=('<script src="vendor/jszip.min.js"></script>\n'
     '<script src="vendor/xlsx.full.min.js"></script>')
new=('<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>\n'
     '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>')
io.open("dist/artifact.html","w",encoding="utf-8").write(s.replace(old,new,1))
print("   dist/artifact.html")
PY
