#!/bin/sh
# #TASK-ES-646 측정 한 벌(작업자 측정 — 판정 아님). main 을 합친 뒤에는 이것을 다시 돌린다.
# 사용(작업 폴더에서): sh reports/TASK-ES-646/tools/run-all.sh <기준 트리> <저장소 밖 임시 폴더>
# 기준 트리 = origin/main 을 분리 HEAD 로 꺼낸 작업 폴더. node_modules 는 작업 폴더 것을 NODE_PATH 로 같이 쓴다.
set -u
BASE="$1"; TMP="$2"; WORK="$(pwd)"; D=reports/TASK-ES-646; T=$D/tools
export NODE_PATH="$WORK/node_modules"
mkdir -p "$TMP" "$D/raw"
echo "== 1 대조기"; node $T/verify-inplace.cjs "$BASE/index.html" index.html $D/verify-inplace.json | head -2
echo "== 2 대조군"; node $T/control-group.cjs "$BASE/index.html" index.html $D/control-group.json | tail -1
echo "== 3 이름 지문"; node scripts/probes/cell-registry-compare.js "$BASE" $D/cell-registry-compare.base.json --fingerprints | tail -1
node scripts/probes/cell-registry-compare.js . $D/cell-registry-compare.json --fingerprints --names-from $D/cell-registry-compare.base.json | tail -1
echo "== 4 모듈 로드"; node $T/module-load.cjs "$BASE" . $D/module-load.json | tail -1
echo "== 5 CSV 내려받기"; node $T/csv-download-probe.cjs "$BASE" . $D/csv-download.json | tail -1
echo "== 6 npm test (기준 · 작업, 전경)"
(cd "$BASE" && npm test > "$WORK/$D/raw/npm-test.base.log" 2>&1; echo $? > "$WORK/$D/raw/npm-test.base.exit")
npm test > $D/raw/npm-test.work.log 2>&1; echo $? > $D/raw/npm-test.work.exit
echo "exit base=$(cat $D/raw/npm-test.base.exit) work=$(cat $D/raw/npm-test.work.exit)"
echo "== 7 시험 파일 전부"
node $T/run-tests.cjs "$BASE" "$TMP/tests-all.base.json" "$NODE_PATH"
node $T/run-tests.cjs . "$TMP/tests-all.work.json" "$NODE_PATH"
echo "== 8a 1단계: 기준 2회 안정성"; node $T/scenario-local.cjs "$BASE" - $D/stage1-base-stability.json $D/scenarios/*.json > $D/raw/stage1-base-stability.log 2>&1; tail -1 $D/raw/stage1-base-stability.log
echo "== 8 시나리오(기준 2회 · 작업 1회)"; node $T/scenario-local.cjs "$BASE" . $D/scenario-local.json $D/scenarios/*.json > $D/raw/scenario-local.log 2>&1; tail -1 $D/raw/scenario-local.log
echo "== 9 측정 모음"; node $T/measure.cjs "$BASE" . "$TMP/tests-all.base.json" "$TMP/tests-all.work.json" | cut -c1-1500
echo "== 10 주장 파일"; node $T/build-claims.cjs
