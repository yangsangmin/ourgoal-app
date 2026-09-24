/**
 * [TASK-ES-257] 맞춤 템플릿 스톱워치 표 시간기입 안내문구 추가 및 시간 컬럼 빈칸 UX 단위 검증
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SUITE_TASK = 'TASK-ES-257';

console.log('[TEST] stopwatch-table-hint.test.js: starting execution for ' + SUITE_TASK + '...');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// 1. 소스 정적 검증: 스톱워치 안내 힌트 문구, ID, 속성 및 window 바인딩
{
  assert.ok(
    indexHtml.includes('id="swInjectHint"'),
    '스톱워치 안내문구 전용 ID "swInjectHint" 속성 확인'
  );
  assert.ok(
    indexHtml.includes('넣을 칸 누르고 ‘표에시간기입’ 누르면 바로입력됨 (분:초 또는 초 기입)'),
    '스톱워치 위젯 내 시간 기입(분:초 또는 초 기입) 안내문구 원문 확인'
  );
  assert.ok(
    indexHtml.includes("toast('넣을 칸 누르고 ‘표에시간기입’ 누르면 바로입력됨')"),
    '미선택 셀 클릭 시 안내 토스트 문구 일원화 확인'
  );
  assert.ok(
    indexHtml.includes('window.renderStopwatchWidgetHtml = renderStopwatchWidgetHtml;'),
    'window.renderStopwatchWidgetHtml 전역 바인딩 노출 확인'
  );
  assert.ok(
    indexHtml.includes('isTimeCol = /(시간|타임|휴식|초|time|duration|sec|min)/i.test'),
    '시간 관련 열 판별 정규식 탑재 확인'
  );
  assert.ok(
    indexHtml.includes("colName + ' (분:초 또는 초)'"),
    '시간 관련 열 placeholder 분기 처리 확인'
  );
}

// 2. 표 셀 렌더러 placeholder 스마트 분기 시뮬레이션 검증
{
  function simulateRenderRowsHtml(rList, cList) {
    return rList.map(function(row, rIdx) {
      return cList.map(function(colName, cIdx) {
        var val = row[cIdx] !== undefined ? row[cIdx] : '';
        var isFirst = (cIdx === 0);
        var isTimeCol = /(시간|타임|휴식|초|time|duration|sec|min)/i.test(String(colName || ''));
        var ph = isFirst ? (rIdx + 1) : (isTimeCol ? colName + ' (분:초 또는 초)' : colName);
        return { rIdx: rIdx, cIdx: cIdx, colName: colName, val: val, placeholder: String(ph), isTimeCol: isTimeCol };
      });
    });
  }

  const columns = ['세트', '운동명', '무게(kg)', '횟수', '휴식시간', '수행시간(초)'];
  const rows = [
    ['1', '벤치프레스', '80', '10', '', ''],
    ['2', '벤치프레스', '85', '8', '', '']
  ];

  const rendered = simulateRenderRowsHtml(rows, columns);

  // 2-1. 첫 번째 열(세트)은 행 번호 placeholder
  assert.strictEqual(rendered[0][0].placeholder, '1', '첫 열은 행 번호 placeholder');
  assert.strictEqual(rendered[1][0].placeholder, '2', '첫 열은 행 번호 placeholder');

  // 2-2. 일반 열(운동명, 무게, 횟수)은 컬럼명 유지
  assert.strictEqual(rendered[0][1].placeholder, '운동명', '일반 열 컬럼명 유지');
  assert.strictEqual(rendered[0][2].placeholder, '무게(kg)', '일반 열 컬럼명 유지');
  assert.strictEqual(rendered[0][3].placeholder, '횟수', '일반 열 컬럼명 유지');

  // 2-3. 시간 관련 열(휴식시간, 수행시간)은 '(분:초 또는 초)' 안내가 결합된 placeholder 제공
  assert.strictEqual(rendered[0][4].placeholder, '휴식시간 (분:초 또는 초)', '시간 열 빈칸 사용자 안내 placeholder 검증');
  assert.strictEqual(rendered[0][5].placeholder, '수행시간(초) (분:초 또는 초)', '초 단위 열 빈칸 사용자 안내 placeholder 검증');
  assert.strictEqual(rendered[0][4].isTimeCol, true, '휴식시간 시간 열 판별 정상');
  assert.strictEqual(rendered[0][5].isTimeCol, true, '수행시간 시간 열 판별 정상');
}

// 3. 스톱워치 시간 주입 힌트 DOM 배치 구조 검증
{
  const widgetRegex = /<div class="pro-sw-display-row">[\s\S]*?id="swDisplay"[\s\S]*?id="swInjectBtn"[\s\S]*?id="swInjectHint"[\s\S]*?💡 넣을 칸 누르고 ‘표에시간기입’ 누르면 바로입력됨 \(분:초 또는 초 기입\)/;
  assert.ok(
    widgetRegex.test(indexHtml),
    '스톱워치 디스플레이 및 컨트롤 직하단에 swInjectHint 안내 배치 구조 정합성 검증'
  );
}

console.log('[TEST] stopwatch-table-hint.test.js: All assertions passed successfully.');
