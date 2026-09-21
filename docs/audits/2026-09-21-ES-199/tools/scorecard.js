'use strict';
// ES-199 "118/118 ALL PASS" 의 정직한 성적표 생성기.
// 왜 스크립트인가: 수치를 손으로 옮기면 또 하나의 "지어낸 성적표"가 된다. SCORECARD-118.md 의 모든 숫자는 여기서 계산한다.
// 입력: ../evidence/classify118.json (118개 검사가 실제로 한 일을 정적 분석한 산출)
//       ../evidence/tree-1c61f5f.txt   (작업 커밋에 실제로 들어 있는 파일 목록. 없으면 그 열은 '측정불가')
//       <저장소>/court/grade-floors.json (법정의 분야별 "최소한 이 수준으로는 확인해야 한다" 하한표)
// 출력: ../SCORECARD-118.md + 표준출력 요약
// 쓰는 법: node docs/audits/2026-09-21-ES-199/tools/scorecard.js
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const AUDIT_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(AUDIT_DIR, '..', '..', '..');
const IN_CLASSIFY = path.join(AUDIT_DIR, 'evidence', 'classify118.json');
const IN_TREE = path.join(AUDIT_DIR, 'evidence', 'tree-1c61f5f.txt');
const IN_FLOORS = path.join(REPO_ROOT, 'court', 'grade-floors.json');
const OUT_MD = path.join(AUDIT_DIR, 'SCORECARD-118.md');

// ───────────────────────────── 매핑 규칙 표 ─────────────────────────────
// 118 검증기의 "분야"(8개)·"테마"를 법정 하한표(court/grade-floors.json)의 분야 id 로 옮긴다.
// 원칙 하나: "이 주장이 참인지 알려면 최소한 무엇을 해 봐야 하는가."
//   · 다른 사람 데이터·권한·서버 처리 → 진짜 계정끼리 주고받아 봐야 안다
//   · 폰의 뒤로가기·진동·키보드·노치     → 진짜 폰에서 해 봐야 안다
//   · 화면 동작·오프라인·성능 수치        → PC 화면에서 눌러 보고 재 봐야 안다
//   · 계산·변환 규칙                      → 그 부품을 돌려 봐야 안다
//   · 문구·설정값·링크가 "적혀 있다"       → 글자만 봐도 된다
// 분야 기본값을 먼저 적용하고, 테마가 그 기본값과 성격이 다르면 아래 예외표로 바꾼다. 예외마다 이유를 적는다.
const DOMAIN_DEFAULT = {
  '소셜 상호작용': ['multi-user', '내가 한 일이 상대 화면에 가는지는 계정 2개가 있어야 안다'],
  '계정/영속성': ['persistence', '저장하고 새로고침해도 남는지는 화면에서 해 봐야 안다'],
  '4대 뷰 동시 전파': ['ui-behavior', '한 화면에서 한 일이 다른 화면에 반영되는지는 눌러 봐야 안다'],
  '모바일 네이티브': ['native-device', '폰의 뒤로가기·진동·키보드·노치는 진짜 폰이 있어야 안다'],
  '오프라인/네트워크': ['offline', '통신을 끊고 해 봐야 안다'],
  '클라우드 보안/RLS': ['security-server', '남의 비공개 데이터를 못 읽는지는 실서버와 계정 2개가 있어야 안다'],
  '성능/메모리': ['performance', '시간·프레임·메모리는 수치를 실제로 재야 안다'],
  '스토어 규정/접근성': ['store-policy', '약관·방침 문구가 있고 링크가 맞는지는 글자로 확인된다'],
};
const THEME_OVERRIDE = {
  // 소셜: 상대가 없어도 확인되는 것, 서버 호출이 본체인 것
  '소셜 상호작용 / 팀 달성률 롤업': ['logic', '달성률 계산 규칙이다'],
  '소셜 상호작용 / 방장 권한 제어': ['security-server', '권한은 서버에서 막아야 막힌 것이다'],
  '소셜 상호작용 / 댓글 실시간 알림': ['server-api', '푸시 발송은 서버 함수다'],
  '소셜 상호작용 / 프로필/아바타': ['ui-behavior', '혼자서 확인되는 화면 동작이다'],
  '소셜 상호작용 / 불량 유저 신고': ['server-api', '신고는 서버에 기록돼야 한다'],
  '소셜 상호작용 / 바이럴 공유 카드': ['ui-behavior', '카드 그리기·공유 창은 혼자서 확인되는 화면 동작이다'],
  // 계정: 실서버 로그인·탈퇴가 본체인 것, 계산·변환인 것
  '계정/영속성 / 계정 병합 (Merge)': ['server-api', '게스트 데이터를 클라우드로 옮기려면 실서버 로그인이 있어야 한다'],
  '계정/영속성 / 토큰 자동 갱신': ['server-api', '실서버 세션이 있어야 한다'],
  '계정/영속성 / 회원 탈퇴 API': ['server-api', '서버 함수(api/withdraw.js)다'],
  '계정/영속성 / 탈퇴 후 라우팅': ['server-api', '실제 탈퇴가 일어나야 그 뒤 화면을 볼 수 있다'],
  '계정/영속성 / 다중 기기 동시성': ['multi-user', '다른 기기의 변경이 내 화면에 오는지다'],
  '계정/영속성 / JSON 복원 무결성': ['logic', '복원·유효성 검사 규칙이다'],
  '계정/영속성 / CSV 내보내기': ['logic', '파일 변환 규칙이다'],
  // 4대 뷰
  '4대 뷰 동시 전파 / AI 설계 목표 전파': ['server-api', 'AI 추천은 서버 함수(api/goalagent.js)를 거친다'],
  // 모바일
  '모바일 네이티브 / OS 다크 테마 감지': ['ui-behavior', 'PC 브라우저에서 시스템 테마를 바꿔 확인할 수 있다'],
  // 오프라인
  '오프라인/네트워크 / 온라인 자동 복구': ['server-api', '클라우드로 실제 동기화되는지는 실서버가 있어야 안다'],
  '오프라인/네트워크 / 충돌 해결 (LWW)': ['server-api', '서버 데이터와의 충돌은 실서버가 있어야 안다'],
  // 보안: 화면 쪽 보안, "그 글자가 코드에 없다"는 주장
  '클라우드 보안/RLS / XSS 스크립트 인젝션': ['security-client', '입력한 스크립트가 실행되지 않는지는 화면에서 넣어 봐야 안다'],
  '클라우드 보안/RLS / 피드 XSS 방어': ['security-client', '입력한 스크립트가 실행되지 않는지는 화면에서 넣어 봐야 안다'],
  '클라우드 보안/RLS / 대용량 페이로드 방어': ['security-client', '입력 길이 제한은 화면에서 넣어 봐야 안다'],
  '클라우드 보안/RLS / 서버리스 CORS 검증': ['server-api', '서버 함수의 응답이다'],
  '클라우드 보안/RLS / 서비스 키 누출 감사': ['config', '"그 글자가 코드에 없다"는 주장이라 글자 검사로 충분하다(단, 제대로 된 검사일 때)'],
  '클라우드 보안/RLS / 민감정보 콘솔 노출': ['config', '"그 글자가 코드에 없다"는 주장이다'],
  '클라우드 보안/RLS / 전송 구간 암호화': ['config', '설정 파일의 값이다'],
  '클라우드 보안/RLS / 로컬 토큰 보관 안전성': ['config', '"그 글자가 코드에 없다"는 주장이다'],
  // 성능
  '성능/메모리 / 번들 최적화': ['config', '"무거운 라이브러리를 싣지 않았다"는 주장이라 글자 검사로 충분하다'],
  // 스토어: 문구 존재가 아닌 것들
  '스토어 규정/접근성 / 회원 탈퇴 접근성': ['navigation', '3번 눌러 도달하는지는 눌러 봐야 안다'],
  '스토어 규정/접근성 / UGC 상시 신고 버튼': ['ui-behavior', '버튼이 보이고 눌리는지다'],
  '스토어 규정/접근성 / UGC 상시 차단 버튼': ['ui-behavior', '버튼이 보이고 눌리는지다'],
  '스토어 규정/접근성 / 개발자 문의 창구': ['server-api', '문의는 서버 함수(api/feedback.js)로 간다'],
  '스토어 규정/접근성 / 다크패턴 배제': ['ui-behavior', '닫기 버튼이 보이고 눌리는지다'],
  '스토어 규정/접근성 / 외부 이탈 방지': ['config', '"mailto 링크가 없다"는 주장이다'],
  '스토어 규정/접근성 / 최소 터치 영역': ['ui-layout', '버튼 크기는 화면에서 재야 안다'],
  '스토어 규정/접근성 / 명도 대비 규격': ['accessibility', '대비는 계산하거나 화면에서 봐야 안다'],
  '스토어 규정/접근성 / 스크린리더 레이블': ['accessibility', '아이콘 버튼마다 붙었는지는 화면에서 세어 봐야 안다'],
  '스토어 규정/접근성 / 시스템 폰트 확대': ['accessibility', '글자를 키웠을 때 잘리는지는 화면에서 봐야 안다'],
  '스토어 규정/접근성 / 첫 실행 무네트워크': ['offline', '통신을 끊고 처음 열어 봐야 안다'],
  '스토어 규정/접근성 / TWA/assetlinks 일치': ['config', '설정 파일의 값이다'],
  '스토어 규정/접근성 / 최소 권한 원칙': ['config', '설정 파일에 그 권한이 없다는 주장이다'],
};
// ────────────────────────────────────────────────────────────────────────

// 등급 말. court/lib/grade.js 와 같은 말을 쓴다(그 파일은 다른 담당이 고치는 중이라 불러 쓰지 않고 값만 맞춘다).
const LABEL = { L0: '확인 못 함', L1: '글자만 봄', L2: '부품만 돌려 봄', L3: 'PC 화면에서 눌러 봄', L4: '진짜 계정끼리 주고받아 봄', L5: '진짜 폰에서 해 봄' };
const RANK = { L0: 0, L1: 1, L2: 2, L3: 3, L4: 4, L5: 5 };
const NOTHING = '사실상 아무것도 안 봄';

function sha256File(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }
function cell(s) { return String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' '); }

// 원자 설명문에서 "어느 파일을 봤는가"를 뽑는다. classify118 의 설명문 형식은 세 가지뿐이다.
function filesOfAtom(desc) {
  const d = desc.replace(/^NOT /, '');
  const m = /^(?:파일존재\(비어있지않음\)|파일존재|파일 길이>0)\s+(\S+)$/.exec(d);
  if (m) return [m[1]];
  const i = d.indexOf(' 에 ');
  if (i < 0) throw new Error('원자 설명문 형식을 모른다: ' + desc);
  return d.slice(0, i).split('+');
}

// 검증기가 실제로 한 일을 쉬운 말로. 숫자는 원자(판정의 최소 단위) 개수다.
function whatItDid(c) {
  const n = { find: 0, regex: 0, exists: 0, neg: 0 };
  for (const a of c.atoms) {
    if (a.negated) n.neg++;
    else if (a.kind === 'includes') n.find++;
    else if (a.kind === 'regex') n.regex++;
    else n.exists++;
  }
  const parts = [];
  if (n.find) parts.push('파일에 그 글자가 있는지 찾기 ' + n.find);
  if (n.regex) parts.push('글자 무늬(정규식) 찾기 ' + n.regex);
  if (n.exists) parts.push('파일이 있는지만 보기 ' + n.exists);
  if (n.neg) parts.push('그 글자가 없는지 보기 ' + n.neg);
  const files = [...new Set(c.atoms.flatMap(a => filesOfAtom(a.desc)))];
  let s = parts.join(' · ') + ' — 본 파일: ' + files.join(', ');
  const flags = [];
  if (c.F1_vacuous) flags.push('파일이 비었거나 없어도 통과하는 검사');
  if (c.F2_saturated) flags.push('그 파일에 20번 넘게 나오는 흔한 낱말만으로 통과');
  if (c.zeroHitAtoms && c.zeroHitAtoms.length) flags.push('주장 고유의 낱말 ' + c.zeroHitAtoms.length + '개는 0번 나옴(다른 "또는" 조건으로 통과)');
  if (c.duplicateOf && c.duplicateOf.length) flags.push('검사식이 ' + c.duplicateOf.join('·') + ' 와 글자까지 같음');
  if (flags.length) s += ' / ' + flags.join(' / ');
  return { text: s, files };
}

function main() {
  const classify = JSON.parse(fs.readFileSync(IN_CLASSIFY, 'utf8'));
  const floors = JSON.parse(fs.readFileSync(IN_FLOORS, 'utf8'));
  const checks = classify.checks;
  const tree = fs.existsSync(IN_TREE) ? new Set(fs.readFileSync(IN_TREE, 'utf8').split('\n').filter(l => l && !l.startsWith('#'))) : null;

  // 매핑표 자체 점검: 표에 없는 분야, 어떤 항목에도 안 걸리는 예외(오타)는 오류로 멈춘다.
  const usedOverride = new Set();
  const rows = checks.map(c => {
    const key = c.domain + ' / ' + c.theme;
    if (!DOMAIN_DEFAULT[c.domain]) throw new Error('매핑표에 없는 분야: ' + c.domain);
    const ov = THEME_OVERRIDE[key];
    if (ov) usedOverride.add(key);
    const [courtDomain, why] = ov || DOMAIN_DEFAULT[c.domain];
    const d = floors.domains[courtDomain];
    if (!d) throw new Error('court/grade-floors.json 에 없는 분야 id: ' + courtDomain);
    const need = d.floor;

    const did = whatItDid(c);
    const notInCommit = tree ? did.files.filter(f => !tree.has(f)) : [];
    let got = 'L1', gotLabel = LABEL.L1, gotWhy = '';
    if (c.F1_vacuous || c.F2_saturated) { got = 'L0'; gotLabel = NOTHING; gotWhy = c.F1_vacuous ? '빈 저장소에서도 통과' : '흔한 낱말만으로 통과'; }
    else if (notInCommit.length) { got = 'L0'; gotLabel = NOTHING; gotWhy = '본 파일이 커밋에 없음(이 PC 폴더에만 있음): ' + notInCommit.join(', '); }

    // 참고용: 법정은 분야 하한에 더해 주장 문장의 낱말·걸린 파일 경로로 하한을 올린다(court/claims.js effectiveFloor). 같은 규칙을 제목·본 파일에 대 본다.
    let strict = need, strictWhy = '';
    for (const r of floors.keywordFloors || []) if (new RegExp(r.pattern, 'i').test(c.title) && RANK[r.floor] > RANK[strict]) { strict = r.floor; strictWhy = '제목에 "' + r.label + '" 낱말'; }
    for (const r of floors.pathFloors || []) { const hit = did.files.find(f => new RegExp(r.pattern).test(f)); if (hit && RANK[r.floor] > RANK[strict]) { strict = r.floor; strictWhy = '본 파일 ' + hit; } }

    return { c, key, courtDomain, why, need, got, gotLabel, gotWhy, missingInCommit: notInCommit.length > 0, met: RANK[got] >= RANK[need], strict, strictWhy, metStrict: RANK[got] >= RANK[strict], did };
  });
  for (const k of Object.keys(THEME_OVERRIDE)) if (!usedOverride.has(k)) throw new Error('예외표의 "' + k + '" 에 해당하는 검사가 없다(오타?)');

  const total = rows.length;
  const count = (arr, f) => arr.filter(f).length;
  const met = count(rows, r => r.met);
  const l1Enough = rows.filter(r => r.need === 'L1');
  const p0 = rows.filter(r => r.c.severity === 'P0');
  const reportedPass = count(rows, r => r.c.staticPassOnWorkingTree);
  const gotDist = { [LABEL.L1]: count(rows, r => r.got === 'L1'), [NOTHING]: count(rows, r => r.got === 'L0') };
  const needDist = {};
  for (const r of rows) needDist[r.need] = (needDist[r.need] || 0) + 1;

  // 흔한 낱말 기준(K)을 바꿔도 결론이 같은지. K=20 은 분류 담당이 정한 규칙이라 다른 값도 같이 본다.
  const kLine = ['5', '20', '50', '100'].map(K => {
    const nothingAtK = r => r.c.F1_vacuous || r.missingInCommit || Boolean(r.c.saturatedAtK && r.c.saturatedAtK[K]);
    // 실제 확인 수준은 최대가 '글자만 봄'이므로, 채울 수 있는 것은 필요한 수준이 '글자만 봄'인 항목뿐이다.
    return 'K=' + K + ' → ' + NOTHING + ' ' + count(rows, nothingAtK) + '개, 채운 항목 ' + count(rows, r => r.need === 'L1' && !nothingAtK(r)) + '개';
  });

  const L = [];
  L.push('# ES-199 "118/118 ALL PASS" 의 정직한 성적표');
  L.push('');
  L.push('> 이 문서는 `tools/scorecard.js` 가 만들었습니다. 손으로 고치지 않습니다. 숫자는 전부 스크립트가 계산했습니다.');
  L.push('> 다시 만들기: `node docs/audits/2026-09-21-ES-199/tools/scorecard.js`');
  L.push('');
  L.push('## 한눈에');
  L.push('');
  L.push('- **필요한 수준을 채운 항목 ' + met + ' / ' + total + '**');
  L.push('- **글자만 봄으로 충분한 항목 ' + l1Enough.length + '개 중 실제로 채운 것 ' + count(l1Enough, r => r.met) + '**');
  L.push('- **P0 ' + p0.length + '개 중 필요한 수준을 채운 것 ' + count(p0, r => r.met) + '**');
  L.push('');
  L.push('- 작업자의 검증기는 ' + total + '개 중 ' + reportedPass + '개를 "통과"로 보고했습니다.');
  L.push('- 그 검증기가 실제로 한 일은 전부 "파일 글자 보기"입니다. 앱을 띄우거나 눌러 본 검사 ' + classify.summary.D_runtime + '개, 서버·폰에서 잰 검사 ' + classify.summary.E_external + '개.');
  L.push('- 실제 확인 수준: ' + Object.entries(gotDist).map(([k, v]) => k + ' ' + v + '개').join(' · '));
  L.push('- 필요한 수준: ' + ['L1', 'L2', 'L3', 'L4', 'L5'].filter(k => needDist[k]).map(k => LABEL[k] + ' ' + needDist[k] + '개').join(' · '));
  L.push('- 채운 항목: ' + (rows.filter(r => r.met).map(r => r.c.id).join(', ') || '없음'));
  L.push('');
  L.push('### 읽는 법');
  L.push('');
  L.push('- **실제 확인 수준**은 두 가지뿐입니다. "' + LABEL.L1 + '"(코드·설정에 그 글자가 적혀 있는 것만 봤다)와 "' + NOTHING + '"입니다.');
  L.push('- "' + NOTHING + '"은 세 경우입니다. ① 파일이 비었거나 없어도 통과하는 검사(' + count(rows, r => r.c.F1_vacuous) + '개) ② 그 파일에 20번 넘게 나오는 흔한 낱말만 있으면 통과하는 검사(' + count(rows, r => r.c.F2_saturated && !r.c.F1_vacuous) + '개) ③ 본 파일이 커밋에 없고 이 PC 폴더에만 있는 검사(' + count(rows, r => r.missingInCommit && !r.c.F1_vacuous && !r.c.F2_saturated) + '개' + (tree ? '' : ', 측정불가 — tree 목록 없음') + ').');
  L.push('- **필요한 수준**은 법정 하한표 `court/grade-floors.json` 의 분야 하한입니다. 118개 항목을 그 분야로 옮긴 규칙은 이 스크립트 맨 위의 표에 있고, 아래 "옮긴 규칙"에 그대로 찍었습니다.');
  L.push('- "필요한 수준을 채웠는가"는 실제 확인 수준이 필요한 수준 이상인지입니다. "아니오"는 "고장 났다"가 아니라 "그 수준으로는 확인된 적이 없다"는 뜻입니다.');
  L.push('- 흔한 낱말 기준(20번)은 분류 담당이 정한 규칙입니다. 기준을 바꿔 본 결과: ' + kLine.join(' / '));
  L.push('');
  L.push('### 분야별');
  L.push('');
  L.push('| 분야 | 항목 | 작업자 보고 "통과" | 글자만 봄 | 사실상 아무것도 안 봄 | 필요한 수준을 채움 |');
  L.push('|---|---|---|---|---|---|');
  for (const dom of Object.keys(DOMAIN_DEFAULT)) {
    const rs = rows.filter(r => r.c.domain === dom);
    L.push('| ' + [dom, rs.length, count(rs, r => r.c.staticPassOnWorkingTree), count(rs, r => r.got === 'L1'), count(rs, r => r.got === 'L0'), count(rs, r => r.met)].join(' | ') + ' |');
  }
  L.push('| **합계** | ' + [total, reportedPass, gotDist[LABEL.L1], gotDist[NOTHING], met].join(' | ') + ' |');
  L.push('');
  L.push('## 항목별 성적표');
  L.push('');
  L.push('| 점검 ID | 분야 | 작업자가 주장한 통과 기준(제목) | 작업자 검증기가 실제로 한 일 | 실제 확인 수준 | 이 종류에 필요한 수준 | 필요한 수준을 채웠는가 |');
  L.push('|---|---|---|---|---|---|---|');
  for (const r of rows) {
    L.push('| ' + [
      r.c.id + ' · ' + r.c.severity,
      cell(r.c.domain + ' / ' + r.c.theme),
      cell(r.c.title),
      cell(r.did.text),
      r.gotLabel + (r.gotWhy ? ' (' + cell(r.gotWhy) + ')' : ''),
      LABEL[r.need] + ' (' + cell(r.why) + ')',
      r.met ? '예' : '아니오',
    ].join(' | ') + ' |');
  }
  L.push('');
  L.push('## 옮긴 규칙 (118의 분야·테마 → 법정 하한표의 분야)');
  L.push('');
  L.push('분야 기본값:');
  L.push('');
  L.push('| 118 검증기의 분야 | 법정 분야 id | 필요한 수준 | 이유 |');
  L.push('|---|---|---|---|');
  for (const [dom, [id, why]] of Object.entries(DOMAIN_DEFAULT)) L.push('| ' + [dom, id, LABEL[floors.domains[id].floor], why].join(' | ') + ' |');
  L.push('');
  L.push('테마 예외(' + Object.keys(THEME_OVERRIDE).length + '개):');
  L.push('');
  L.push('| 분야 / 테마 | 법정 분야 id | 필요한 수준 | 이유 |');
  L.push('|---|---|---|---|');
  for (const [k, [id, why]] of Object.entries(THEME_OVERRIDE)) L.push('| ' + [cell(k), id, LABEL[floors.domains[id].floor], cell(why)].join(' | ') + ' |');
  L.push('');
  L.push('## 참고: 법정의 낱말·경로 규칙까지 대 보면');
  L.push('');
  L.push('법정은 분야 하한에 더해, 주장 문장의 낱말과 걸린 파일 경로로 하한을 올립니다. 같은 규칙을 제목과 "본 파일"에 대 보면 하한이 올라가는 항목이 ' + count(rows, r => r.strict !== r.need) + '개입니다. 이 경우 채운 항목은 ' + count(rows, r => r.metStrict) + ' / ' + total + ' 입니다. 위 성적표는 이 규칙을 적용하지 않은 값입니다(낱말 규칙은 제목에 우연히 걸리는 경우가 있어서입니다).');
  L.push('');
  L.push('| 점검 ID | 성적표의 필요 수준 | 규칙을 대 본 필요 수준 | 걸린 규칙 |');
  L.push('|---|---|---|---|');
  for (const r of rows.filter(x => x.strict !== x.need)) L.push('| ' + [r.c.id, LABEL[r.need], LABEL[r.strict], cell(r.strictWhy)].join(' | ') + ' |');
  L.push('');
  L.push('## 입력 파일 지문');
  L.push('');
  L.push('- `evidence/classify118.json` sha256 `' + sha256File(IN_CLASSIFY) + '`');
  L.push('- `court/grade-floors.json` sha256 `' + sha256File(IN_FLOORS) + '`');
  L.push('- `evidence/tree-1c61f5f.txt` ' + (tree ? 'sha256 `' + sha256File(IN_TREE) + '` (파일 ' + tree.size + '개)' : '없음 — "본 파일이 커밋에 있는가"는 측정불가로 처리'));
  L.push('');

  fs.writeFileSync(OUT_MD, L.join('\n'), 'utf8');

  console.log('SCORECARD-118.md 생성: ' + OUT_MD.replace(/\\/g, '/'));
  console.log('필요한 수준을 채운 항목 ' + met + ' / ' + total);
  console.log('글자만 봄으로 충분한 항목 ' + l1Enough.length + '개 중 실제로 채운 것 ' + count(l1Enough, r => r.met));
  console.log('P0 ' + p0.length + '개 중 필요한 수준을 채운 것 ' + count(p0, r => r.met));
  console.log('작업자 검증기 보고: 통과 ' + reportedPass + ' / ' + total);
  console.log('실제 확인 수준: ' + JSON.stringify(gotDist));
  console.log('필요한 수준 분포: ' + JSON.stringify(Object.fromEntries(Object.entries(needDist).map(([k, v]) => [LABEL[k], v]))));
  console.log('채운 항목: ' + (rows.filter(r => r.met).map(r => r.c.id).join(', ') || '없음'));
  console.log('글자만 봄으로 충분한데 못 채운 항목: ' + l1Enough.filter(r => !r.met).map(r => r.c.id + '(' + r.gotWhy + ')').join(', '));
  console.log('흔한 낱말 기준 민감도: ' + kLine.join(' / '));
  console.log('법정 낱말·경로 규칙까지 대 보면: 하한 상승 ' + count(rows, r => r.strict !== r.need) + '개, 채운 항목 ' + count(rows, r => r.metStrict) + ' / ' + total);
}

main();
