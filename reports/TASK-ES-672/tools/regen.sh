#!/bin/sh
# #TASK-ES-672 — 생성 결과 한 벌을 지금 HEAD 의 index.html 로 다시 만든다(L010: main 이 움직이면 손으로 맞추지 않고 다시 돌린다).
# 커밋 전(생성 결과가 작업 트리에만 있을 때) 쓰는 순서: 이 스크립트를 --revert 로 → git merge --ff-only origin/main → 이 스크립트를 인자 없이.
# 사용(작업 폴더에서): sh reports/TASK-ES-672/tools/regen.sh [--revert] <티켓 줄을 담은 파일>
set -eu
D=reports/TASK-ES-672
CELLS="modal table tools trend-chart stopwatch save"
if [ "${1:-}" = "--revert" ]; then
  for f in $CELLS; do git rm -q --cached --ignore-unmatch js/tabs/records/pro-record-$f.js; rm -f js/tabs/records/pro-record-$f.js; done
  # HEAD 판으로 되돌린다(스테이징된 생성 결과가 있어도 — 그냥 checkout -- 는 스테이징된 판을 꺼내 와서 되돌려지지 않는다: 실제로 한 번 겪음)
  git checkout HEAD -- index.html docs/architecture/cell-descriptions.json docs/architecture/module-baseline.json docs/architecture/modules.json docs/rules/TICKETS.md
  echo "되돌림: index.html · 신고서 · 세포 설명 · 기준선 · 티켓 · 새 세포 여섯"; exit 0
fi
TICKET="$1"
MODULE_SPLIT_OUT="$(pwd)/$D" node docs/design/harness/module-split/gen-inline-hard.js . $D/proof.json | tail -1
for f in $CELLS; do git add js/tabs/records/pro-record-$f.js; done   # 세포 지도 시험은 git 이 추적하는 파일만 읽는다
node scripts/module-specs.js --write | tail -1
node $D/tools/cell-descriptions-add.cjs
node scripts/module-guard.js --update | tail -1
node scripts/module-guard.js > /dev/null; echo "module-guard 종료 코드 $?"
cat "$TICKET" >> docs/rules/TICKETS.md
git diff --numstat -- index.html docs/architecture docs/rules/TICKETS.md
