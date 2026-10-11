#!/bin/sh
# #TASK-ES-672 측정 한 벌(작업자 측정 — 판정 아님). main 을 합친 뒤에는 생성기를 main 판 index.html 로 다시 돌리고 이것을 다시 돌린다.
# 사용(작업 폴더에서): sh reports/TASK-ES-672/tools/run-all.sh <기준 트리> <저장소 밖 임시 폴더>
# 기준 트리 = origin/main(merge-base)을 분리 HEAD 로 꺼낸 작업 폴더. node_modules 는 작업 폴더 것을 NODE_PATH 로 같이 쓴다.
set -u
BASE="$1"; TMP="$2"; WORK="$(pwd)"; D=reports/TASK-ES-672; T=$D/tools
export NODE_PATH="$WORK/node_modules"
mkdir -p "$TMP" "$D/raw"
echo "== 1 검사기(verify-inline-hard)"; MODULE_SPLIT_OUT="$WORK/$D" node docs/design/harness/module-split/verify-inline-hard.js "$BASE/index.html" . $D/proof.json | tail -1
echo "== 2 줄 단위 접두-만 비교"; node $T/prefix-only-check.cjs "$BASE/index.html" . $D/gen-inline-hard-meta.json $D/proof.json $D/prefix-only-check.json | cut -c1-260
echo "== 3 조각 호출 순서·등록 의존"; node $T/order-check.cjs . $D/proof.json $D/order-check.json | cut -c1-120
echo "== 4 새 getter 시점 · 통로 접근자"; node $T/expose-window.cjs index.html $D/gen-inline-hard-meta.json $D/expose-window.json | cut -c1-160
node $T/accessor-probe.cjs . . $D/gen-inline-hard-meta.json $D/accessor-probe.json | cut -c1-260
echo "== 5 이름 지문"; node scripts/probes/cell-registry-compare.js "$BASE" $D/cell-registry-compare.base.json --fingerprints | tail -1
node scripts/probes/cell-registry-compare.js . $D/cell-registry-compare.json --fingerprints --names-from $D/cell-registry-compare.base.json | tail -1
node $T/name-fingerprints.cjs $D/cell-registry-compare.base.json $D/cell-registry-compare.json $D/gen-inline-hard-meta.json $D/name-fingerprints.json openProTemplateRecordModal | cut -c1-600
echo "== 6 모듈 로드"; node $T/module-load.cjs "$BASE" "$WORK" $D/module-load.json | head -1 | cut -c1-200
echo "== 7 CSV 내려받기 · 사진 첨부·Notion 본문 탐침"; node $T/csv-download-probe.cjs "$BASE" . $D/csv-download.json | tail -1 | cut -c1-200
node $T/photo-notion-probe.cjs "$BASE" . $D/photo-notion-probe.json | tail -2
echo "== 8 npm test (기준 · 작업, 전경)"
(cd "$BASE" && npm test > "$WORK/$D/raw/npm-test.base.log" 2>&1; echo $? > "$WORK/$D/raw/npm-test.base.exit")
npm test > $D/raw/npm-test.work.log 2>&1; echo $? > $D/raw/npm-test.work.exit
echo "exit base=$(cat $D/raw/npm-test.base.exit) work=$(cat $D/raw/npm-test.work.exit)"
echo "== 9 시험 파일 전부"
node $T/run-tests.cjs "$BASE" "$TMP/tests-all.base.json" "$NODE_PATH"
node $T/run-tests.cjs . "$TMP/tests-all.work.json" "$NODE_PATH"
echo "== 10 시나리오(기준 2회 · 작업 1회) — 주장에 건 15개 + 작업자 전용 1개"; node $T/scenario-local.cjs "$BASE" . $D/scenario-local.json $D/scenarios/*.json $D/scenarios-local/*.json > $D/raw/scenario-local.log 2>&1; tail -1 $D/raw/scenario-local.log
echo "== 11 측정 모음"; node $T/measure.cjs "$BASE" . "$TMP/tests-all.base.json" "$TMP/tests-all.work.json" | cut -c1-1200
echo "== 12 주장 파일"; node $T/build-claims.cjs
