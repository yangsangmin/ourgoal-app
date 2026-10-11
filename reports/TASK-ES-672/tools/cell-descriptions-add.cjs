'use strict';
// #TASK-ES-672 — 세포 설명(docs/architecture/cell-descriptions.json)에 새 세포 여섯의 짧은 이름과 하는 일을 넣는다(여러 번 돌려도 같은 결과).
// main 이 움직여 생성 결과를 다시 만들 때마다 같은 글자를 넣으려고 도구로 둔다. 사용: node reports/TASK-ES-672/tools/cell-descriptions-add.cjs
const fs = require('fs'), path = require('path');
const p = path.resolve(__dirname, '..', '..', '..', 'docs', 'architecture', 'cell-descriptions.json');
const raw = fs.readFileSync(p, 'utf8'); const j = JSON.parse(raw);
const crlf = raw.includes('\r\n');
const rt = JSON.stringify(j, null, 2) + '\n';
if (rt !== raw && rt.replace(/\n/g, '\r\n') !== raw) throw new Error('파일 꼴이 JSON.stringify(…, null, 2) 와 다르다 — 손으로 넣어야 한다');
const names = {
  'records/pro-record-modal': '전문 템플릿 기록 창',
  'records/pro-record-table': '전문 템플릿 기록 창의 표 편집',
  'records/pro-record-tools': '전문 템플릿 기록 창의 도구 단추',
  'records/pro-record-trend-chart': '전문 템플릿 기록 창의 성장 추이 차트',
  'records/pro-record-stopwatch': '전문 템플릿 기록 창의 스톱워치',
  'records/pro-record-save': '전문 템플릿 기록 창의 저장',
};
const cells = {
  'records/pro-record-modal': '전문(맞춤) 템플릿 기록 창을 열어 고른 템플릿·날짜·행을 꾸러미에 담고 창을 그린 뒤 조각 다섯을 정해진 순서로 연결한다',
  'records/pro-record-table': '표의 칸을 읽어 행에 담고 실시간 분석 띠와 표를 다시 그리며 행을 더하고 지운다',
  'records/pro-record-tools': '지난 루틴 불러오기·AI 코치·Notion 연동·CSV 가져오기와 내려받기·스마트워치·템플릿 마켓·AI 사진 인식·음성 입력·표 속성 편집·템플릿 변경과 생성·사진 첨부 단추를 연결한다',
  'records/pro-record-trend-chart': '성장 추이 차트의 기간 칩과 점 설명을 연결하고 템플릿이 바뀌면 차트를 다시 그린다',
  'records/pro-record-stopwatch': '스톱워치와 인터벌 타이머를 시작·정지·리셋하고 랩을 찍어 랩과 지금 시간을 표 칸에 넣는다',
  'records/pro-record-save': '기록을 기기에 바로 저장하고 목표·일정에 연동한 뒤 화면을 갱신하고 서버에 동기화하며 취소와 돌아가기를 연결한다',
};
Object.assign(j.names, names); Object.assign(j.cells, cells);
let out = JSON.stringify(j, null, 2) + '\n'; if (crlf) out = out.replace(/\n/g, '\r\n');
fs.writeFileSync(p, out, { encoding: 'utf8' });
console.log('세포 설명 ' + Object.keys(names).length + '개 넣음 · 줄 끝 ' + (crlf ? 'CRLF' : 'LF'));
