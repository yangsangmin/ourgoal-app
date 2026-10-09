'use strict';
/*
 * TASK-ES-605 — 양비스 아워골 지휘실 사용 안내서 측정 도구
 * 성격: 작업자 측정(판정 아님). 소스/부품 측정이며 실제 제어 단추 실행 E2E 가 아니다. 최종 판정은 GitHub Court 만 낸다.
 * 의존: node 내장 모듈만(fs · path · crypto · vm · child_process). 네트워크 호출 0. 인증값 · 헤더 · 토큰 · Git 설정 원문 · 신원은 출력하지 않는다(해시만).
 * 사용:
 *   node reports/TASK-ES-605/measure-guide.cjs            → 측정 결과 JSON 을 stdout 으로 (파일 쓰기 0)
 *   node reports/TASK-ES-605/measure-guide.cjs --assemble → 위 명령을 자식 프로세스로 전경 실행해 stdout 원문을 raw/measure.stdout.json 에 보존하고 measurement.json 을 조립
 * 읽기 전용 외부 경로: C:\dev\command-center\hud\yangvis\{index.html,app.js,styles.css}.
 *   읽기가 막히면 원시 실패를 보존하고 .yangvis-inputs/ui-source-excerpts.json 의 고정 발췌(frozen snapshot)로 잴 수 있는 부분만 잰다.
 * 자식 git 이 막히면 원시 실패를 보존하고 .yangvis-inputs/preservation-before.json 의 tracked 목록으로 전수 SHA 대조를 한다.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const TASK = 'TASK-ES-605';
const SCHEMA_STDOUT = 'ourgoal.task-es-605.measure-guide.stdout/1';
const SCHEMA_MEASUREMENT = 'ourgoal.task-es-605.measurement/1';
const ROOT = path.resolve(__dirname, '..', '..');
const REPORT_DIR = 'reports/TASK-ES-605';
const SCRIPT_REL = REPORT_DIR + '/measure-guide.cjs';
const RAW_STDOUT_REL = REPORT_DIR + '/raw/measure.stdout.json';
const MEASUREMENT_REL = REPORT_DIR + '/measurement.json';
const CLAIMS_REL = REPORT_DIR + '/claims.json';
const GUIDE_REL = 'docs/agents/YANGVIS-OURGOAL-OPERATOR-GUIDE.md';
const REQ_REL = 'docs/specs/REQ-TASK-ES-605-YANGVIS-GUIDE.md';
const PLAN_REL = '.claude/plan-TASK-ES-605.md';
const INPUT_DIR_REL = '.yangvis-inputs';
const PRODUCTION_DIR = 'C:\\dev\\command-center\\hud\\yangvis';
const EVIDENCE_HEADING = '## 9. 근거표';
const ALLOWED_WRITES = [GUIDE_REL, REQ_REL, SCRIPT_REL, MEASUREMENT_REL, CLAIMS_REL, RAW_STDOUT_REL, PLAN_REL];
const SELF_REFERENTIAL = [MEASUREMENT_REL, CLAIMS_REL, RAW_STDOUT_REL];
const INPUT_FILES = { request: 'request.json', prompt: 'prompt.md', uiSourceExcerpts: 'ui-source-excerpts.json', publicObservation: 'public-observation.json', transportSupport: 'transport-support.json', preservationBefore: 'preservation-before.json' };
const PRODUCTION_FILES = { indexHtml: 'index.html', appJs: 'app.js', stylesCss: 'styles.css' };
const STATUSES = ['query', 'plan', 'awaiting-selection', 'queued', 'admission-pending', 'running', 'blocked', 'pause-requested', 'paused', 'stop-requested', 'stopped', 'verification-pending', 'completed', 'failed', 'automation-finished-product-not-claimed', 'execution-unmeasured', 'recorded-intake', 'reported-complete', 'coordination'];
const ACTIONS = ['pause', 'stop', 'resume', 'change'];
const CONTROL_DEFS = [['pause', '보류 요청'], ['stop', '중단 요청'], ['resume', '재개 요청'], ['change', '지시 변경']];
const ANTI_PATTERNS = ['fake_', 'mock_streak', 'dummy_count', 'hard_coded_stat', 'force_pay', 'paywall_block', 'lock_feature', 'ad_force', 'burnout_care', 'give_up', 'rest_mode', 'skip_today'];

// ---------- helpers ----------
const abs = rel => path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');
const errInfo = e => e ? { code: e.code || null, message: String(e.message || e).slice(0, 300) } : null;
const has = (text, s) => typeof text === 'string' && typeof s === 'string' && s.length > 0 && text.includes(s);
const count = (text, s) => has(text, s) ? text.split(s).length - 1 : 0;
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = name => new RegExp('(^|[^A-Za-z0-9_$])' + escapeRe(name) + '($|[^A-Za-z0-9_$])');
function readFileInfo(absPath, label) {
  try {
    const buf = fs.readFileSync(absPath);
    const text = buf.toString('utf8');
    return { path: label || absPath, exists: true, bytes: buf.length, sha256: sha256(buf), eol: text.includes('\r\n') ? 'CRLF' : 'LF', lines: text.split(/\r?\n/).length, text, error: null };
  } catch (e) { return { path: label || absPath, exists: false, bytes: null, sha256: null, eol: null, lines: null, text: null, error: errInfo(e) }; }
}
const withoutText = info => { const o = { ...info }; delete o.text; return o; };
function gitRaw(args) {
  let r;
  try { r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 }); }
  catch (e) { return { ok: false, status: null, error: errInfo(e), stdout: '', stderr: '' }; }
  return { ok: !r.error && r.status === 0, status: r.error ? null : r.status, error: errInfo(r.error), stdout: r.stdout || '', stderr: (r.stderr || '').slice(0, 500) };
}
// 경로 출력에만 quotepath 해제를 붙인다. config 목록 해시는 gitRaw 로 잰다(-c 덮어쓰기가 목록에 섞이지 않게).
const git = args => gitRaw(['-c', 'core.quotepath=false', ...args]);
const gitSummary = r => ({ ok: r.ok, status: r.status, error: r.error, stderr: r.stderr || '' });

// ---------- stage spec: labels(화면 소스 문구) · mustExplain 요구 문구 ----------
const STAGE_SPEC = {
  S1: {
    labels: ['양비스에게 말하세요', '새 지시 쓰기', '실행 지시', '상태 질문', '계획만', '지시 보내기', '도구 선택', '지시할 대상', '아워골', '양비스 · 아워골 지원', '지시나 질문을 먼저 적어주세요.', '접수 확인 중…', '지시를 저장하고 접수 응답을 기다립니다.', '지시가 접수됐습니다. 실제 실행은 설정과 실행 조건 확인 후 시작합니다.', '상태 질문이 접수됐습니다. 작업 실행은 요청하지 않았습니다.', '계획 요청이 접수됐습니다. 작업 실행은 요청하지 않았습니다.', '접수 기록을 저장했습니다.', '작성한 지시와 요청 번호를 유지합니다.', '응답 시간이 초과됐습니다', '다음 행동', '양비스의 답변', '양비스의 계획', '답변 확인', '아직 확인된 답변이 없습니다.', '현재 지시 개정의 답변입니다. 실제 작업 실행 결과와 구분합니다.', '실행 지시는 접수 후 실행 조건을 확인합니다.', '상태를 묻습니다. 실행 지시를 보내지 않습니다.', '계획만 요청합니다. 실행 지시를 보내지 않습니다.', '설정 선택 대기', '실행 대기', '실행 조건 확인', '실행 중', '실행 시작', '담당 실행 관측'],
    mustExplain: {
      '아워골 대상': ['지시할 대상', '아워골', '양비스 · 아워골 지원'],
      '실행 지시·상태 질문·계획만의 차이': ['실행 지시', '상태 질문', '계획만', '세 방식의 차이'],
      '질문과 계획은 실제 실행하지 않음': ['질문과 계획은 실제로 실행하지 않습니다', '실행 지시를 보내지 않습니다', '작업 실행은 요청하지 않았습니다'],
      '접수와 실행 시작은 별개': ['접수와 실행 시작은 별개', '접수 기록을 저장했습니다.', '실행 시작'],
      '작업번호와 다음 행동 확인': ['작업번호', '다음 행동', '개정 N']
    }
  },
  S2: {
    labels: ['도구 선택', '지시할 대상', '실행 도구', '모델', '노력 설정', '선택 후 확인', '도구를 먼저 선택', '모델 선택', '모델을 먼저 선택', '설정 선택', '지원 설정 없음', '미지원', '지원 미확인', '지원 확인', '확인된 도구와 설정만 선택할 수 있습니다. 선택하지 않으면 접수 후 설정을 확인합니다.', '노력 설정은 내부에서 얼마나 생각했는지에 대한 측정이 아닙니다.', '실행 도구의 지원 근거가 아직 없습니다. 지시를 먼저 접수하고 설정 확인을 기다립니다.', '요청한 설정과 실제 설정', '요청', '실제 근거', '미확인', '실제 설정 관측', '노력 설정은 실행기에 전달된 설정이며 내부 사고량의 측정이 아닙니다.', '설정 근거 열기', '실행 설정을 선택해주세요', '현재 작업의 선택 질문에 답합니다. 요청한 설정의 지원 확인이 끝나야 실행으로 넘어갑니다.', '이 작업에 대한 권장 설정 근거는 아직 없습니다.', '이 설정으로 선택', '현재 답할 설정 선택 질문이 없습니다.', '도구별 확인된 지원', '출처 문서', '선택 저장과 개정 확인 중…', '설정을 선택했습니다. 실제 실행 조건을 확인합니다.', '지원이 확인된 실행 도구와 모델을 선택해주세요.', '지원이 확인된 실행 도구가 없어 선택할 수 없습니다.', '설정 · 선택', '막힌 이유'],
    mustExplain: {
      '지원 확인·미지원·미확인': ['지원 확인', '미지원', '지원 미확인', '실제로 실행에 성공했다는 뜻이 아닙니다'],
      'requested/configured/actual 구분': ['요청(requested)', '전달 설정(configured)', '실제 근거(actual)'],
      '현재 UI 비교는 요청·실제 근거 두 칸; configured는 실행기 전달 근거 개념으로만 설명': ['「요청」과 「실제 근거」 두 칸뿐', '별도 칸이 아니라'],
      'actual model/effort null을 요청값으로 채우지 않음': ['「미확인」을 요청값으로 채워 읽지 않습니다'],
      '노력은 전달 설정이며 실제 내부 사고량 측정 아님': ['노력 설정은 전달 설정입니다', '내부 사고량의 측정이 아닙니다'],
      '선택 저장 뒤 실행 조건 확인': ['선택 저장 뒤에도 실행 조건 확인이 남아 있습니다', '설정을 선택했습니다. 실제 실행 조건을 확인합니다.'],
      '기존 native 구독만·추가API과금/구매/extraUsage변경 금지·잔여quota 미확인': ['기존 구독 범위 안에서만', '추가 API 과금', '새 사용량 구매', '추가 사용량(extra usage) 설정 변경', '잔여 사용량과 비용은 측정하지 않았으므로 미확인']
    }
  },
  S3: {
    labels: ['아워골 지휘', '작업 흐름', '작업 상세', '마지막 관측', '확인되지 않은 진행률·예상 시각은 추정하지 않습니다.', '선택하면 다음으로', '풀어야 할 막힘', '중단을 확인하는 중', '결과를 확인할 차례', '지금 진행하는 일', '먼저 볼 작업', '이어지는 행동', '추가로 관측된 다음 작업이 없습니다.', '필수 가동 조건', '현재 조건 측정 미확인', '진행과 결과', '전체 작업 보기', '작업 / 다음 행동', '현재 상태', '실제 도구 · 모델', '관측 시각', '실행 관측 중', '실행 종료 확인', '실행 상태 미확인', 'EVENTS, NOT ESTIMATES', '일이 흘러온 길.', '기록된 사건', '대기 · 요청', '실패', '병렬·선후 관계는 기록된 연결만 표시', '마지막 확인', '이 작업의 실제 단계 사건이 아직 관측되지 않았습니다.', '선행 작업', '병렬 연결', '확인 필요', '진행 · 대기', '작업 완료', '양비스 운영', '제목이나 지시 원문으로 찾기', '완료된 작업과 정본 동기화 상태를 각각 표시합니다. 실행 종료만으로 작업 완료를 선언하지 않습니다.', '다음 행동', '막힌 이유', '처음 받은 지시', '끝났다고 말할 기준', '측정 가능한 완료 기준 미확인', '실행 관측', '실행 담당', '프로세스 생존 확인', '살아 있음 · 관측됨', '종료 관측됨', '진행률 미확인', '예상 종료 미확인', '실행 담당의 기술 근거 펼치기', '결과 검증 대기', '실행 종료', '정본 동기화 대기 · 작업 상태와 별도로 확인합니다.', '정본 동기화 확인', '정본 되읽기 기록', '정본 동기화 미확인', '자동화 종료 · 제품 미확인', '기존 완료 보고 · 검증 미확인', '지시 접수', '지시 접수·보관', '설정 선택', '설정 선택 확인', '실행 담당 확인', '실행 시작 요청', '실행 시작', '담당 실행 관측', '실행 실패', '결과 확인', '지휘 변경 접수', '실행 조건 확인 필요', '시작 확인 실패', '담당 확인 필요', '이전 실행 기록 보존', '수신 공백·현재 지시 확인', '권장 설정 확인', '답변·계획 확인', '지휘 개정 충돌 확인', '설계 검토 확인', '독립 검증 단계', '후속 담당에게 이관'],
    mustExplain: {
      '담당·막힌 이유·다음 행동·관측시각': ['담당 · 막힌 이유 · 다음 행동 · 관측 시각'],
      '실제 작업 흐름·병렬/대기/실패/재시도': ['작업 흐름은 실제로 남은 사건', '병렬', '대기', '실패', '재시도'],
      '진행률/ETA null은 미확인': ['「진행률 미확인」 · 「예상 종료 미확인」은 미확인입니다', '퍼센트와 예상 시각을 추정하지 않습니다'],
      '실행 종료·결과 검증 대기·작업 완료 구분': ['실행 종료 · 결과 검증 대기 · 작업 완료는 다른 말입니다'],
      '작업 완료와 정본 sync pending 구분': ['작업 완료와 정본 동기화는 별개입니다', '정본 동기화 대기 · 작업 상태와 별도로 확인합니다.']
    }
  },
  S4: {
    labels: ['작업 지휘', '보류 요청', '중단 요청', '재개 요청', '지시 변경', '변경할 지시', '변경 접수', '변경할 지시를 적어주세요.', '현재 상태에서 지원하지 않는 제어입니다.', '기존 정본을 읽는 작업입니다. 현재 실행을 제어하는 작업이 아니므로 제어할 수 없습니다.', '개정 번호가 확인되지 않아 제어할 수 없습니다.', '완료된 작업은 제어할 수 없습니다. 후속 지시는 새 작업으로 접수합니다.', '상태 질문·계획만 요청은 실행하지 않으므로 중단·재개가 없습니다.', '실행이 없거나 해당 상태에서 허용되지 않는 제어는 비활성화됩니다. 요청과 실제 확인은 구분됩니다.', '요청 저장과 상태 확인 중…', '보류 요청을 접수했습니다. 실제 확인을 기다립니다.', '중단 요청을 접수했습니다. 실제 종료 확인은 작업 상태에서 읽습니다.', '변경 요청을 접수했습니다.', '보류 요청 · 확인 전', '보류 확인', '중단 요청 · 확인 전', '중단 확인', '막힘', '실행 대기', '설정 선택 대기', '실행 조건 확인', '보류를 요청했습니다. 실행이 멈췄다는 근거는 아직 확인되지 않았습니다.', '중단을 요청했습니다. 실제 실행 종료는 아직 확인되지 않았습니다. 이미 반영된 결과와 기록은 보존됩니다.', '상태를 다시 읽어 확인해주세요.', '지휘 변경 접수', '지휘 개정 충돌 확인', '시작 전 지휘 반영', '실행 직전 최신 지휘 반영', '다른 작업들이 실행 자리를 사용 중입니다. 사용하지 않는 작업창을 닫거나 해당 작업이 끝나면 재개할 수 있습니다', '작업 완료', '결과 검증 대기'],
    mustExplain: {
      '보류 요청과 보류 확인 구분': ['보류 요청과 보류 확인은 다릅니다', '보류 요청 · 확인 전', '보류 확인'],
      '중단 요청과 중단 확인 구분': ['중단 요청과 중단 확인도 다릅니다', '중단 요청 · 확인 전', '중단 확인'],
      '중단은 이미 반영된 결과를 되돌린다는 약속 아님': ['중단은 이미 반영된 결과를 되돌린다는 약속이 아닙니다', '이미 반영된 결과와 기록은 보존됩니다.'],
      '재개 허용 상태와 조건 재확인': ['재개는 「보류 확인」 · 「중단 확인」 · 「막힘」에서만', '실행 조건(실행 자리 등)을 다시 확인합니다'],
      '비활성 이유': ['비활성 이유', '현재 상태에서 지원하지 않는 제어입니다.', '기존 정본을 읽는 작업입니다. 현재 실행을 제어하는 작업이 아니므로 제어할 수 없습니다.', '개정 번호가 확인되지 않아 제어할 수 없습니다.', '완료된 작업은 제어할 수 없습니다. 후속 지시는 새 작업으로 접수합니다.', '상태 질문·계획만 요청은 실행하지 않으므로 중단·재개가 없습니다.', '실행이 없거나 해당 상태에서 허용되지 않는 제어는 비활성화됩니다. 요청과 실제 확인은 구분됩니다.'],
      '개정 충돌은 최신 기록 다시 확인': ['개정 충돌', '지휘 개정 충돌 확인', '최신 기록을 다시 읽고']
    }
  },
  S5: {
    labels: ['세포 연결', '어디가, 무엇을 맡는지.', '전체 구조에서 세포의 책임으로. 구현과 실행 관측을 구분합니다.', '전체 구조', '세포 이름 · 책임으로 찾기', '찾기', '구성요소', '영역', '세포', '양비스 지휘 구조 · 등록된 연결', '아워골 구조 · 프로젝트에서 영역으로', '양비스 지휘 배선 · 아워골 영역', '책임과 연결 선택', '프로젝트 · 눌러서 영역 보기', '영역 · 눌러서 세포 보기', '등록된 지휘 요소', '화살표는 등록된 구조 연결입니다. 실제 실행의 순서는 ‘작업 흐름’에서 확인합니다. 표시 범위 바깥의 연결도 오른쪽에서 읽을 수 있습니다.', '세포 지도의 근거가 아직 없습니다', '책임과 연결을 추측해 그리지 않습니다.', 'CELL / RESPONSIBILITY', '세부 책임 설명 미확인', '등록', '등록 근거 있음', '등록 확인 안 됨', '구현', '구현 근거 있음', '파일 존재 확인', '정본에 로드 등록', '실행 관측', '관측 근거 있음', '책임 · 담당', '영향과 연결', '등록된 연결 없음', '출처 · 관측 시각', '구현 파일', '근거 열기', '경로 복사', '제공하는 능력', '필요한 능력', '보내는 신호', '받는 신호', '정본 기준 커밋', '관련 작업', '지도 출처', '지도 기준', '원격 main', '지도 기준과 최신 main에 차이가 있습니다.', '지도 기준 차이', '검증 · 결과', '검증과 결과', '검증 결과가 아직 없습니다', '산출물과 검증 근거가 확인되기 전에는 완료를 추정하지 않습니다.', '정본과 원시 기록', '정본 열기', '이 작업의 API 원시 기록', '현재 받은 작업 자료 펼치기', '변경 기록', '접수부터 지금까지', '유입 경로', '전체 변경 기록 읽기', '다음 기록 더 보기', '최신 기록에서 다시 읽기', '저장된 기록 시점', '현재 작업이 변경됐습니다. 읽던 기록 시점은 그대로 유지합니다.', '지식 · 개선', '다음 일을 바꾸는 근거.', '최신 작업참고와 교훈. 적용 여부와 효과 확인을 함께 읽습니다.', '근거, 교훈, 작업참고 찾기', '효과 상태', '아직 조회된 지식과 개선 근거가 없습니다', '교훈이 등록됐다는 사실과 실제 효과가 확인됐다는 사실을 나누어 표시합니다.'],
    mustExplain: {
      '전체 구조→영역→세포와 연결': ['전체 구조 → 영역 → 세포와 연결'],
      '등록·구현·실행 관측 구분': ['등록 · 구현 · 실행 관측은 다른 세 가지입니다'],
      '지도 화살표는 등록 구조이며 실제 작업 흐름 아님': ['지도의 화살표는 등록된 구조 연결', '실제 작업 흐름이 아닙니다'],
      '지도 기준 commit·최신 main 차이·관측시각': ['지도 기준 커밋과 원격 main 의 차이, 관측 시각', '지도 기준과 최신 main에 차이가 있습니다.'],
      '정본·원시·변경 근거': ['정본 · 원시 기록 · 변경 기록 셋을 구분합니다'],
      '교훈 등록과 장기 효과 확인은 별개': ['교훈이 등록된 것과 장기 효과가 확인된 것은 별개입니다', '효과 상태']
    }
  },
  S6: {
    labels: ['검증 · 결과', '검증과 결과', '근거 열기', '정본 동기화 대기 · 작업 상태와 별도로 확인합니다.', '정본 동기화 확인', '정본 되읽기 기록', '정본 동기화 미확인', '결과 검증 대기', '작업 완료', '독립 검증 단계', '실행 담당과 별도로 결과 근거를 확인합니다', '후속 담당에게 이관', '변경 기록'],
    mustExplain: {
      '작업자 측정·native 수신·독립 검토·GitHub Court 구분': ['작업자 측정', 'native 수신', '독립 검토', 'GitHub Court'],
      'Court artifact verdict/head/실행 근거가 정본': ['artifact', 'verdict', 'head', '정본'],
      '작업 완료와 배포/원격 검증/지도 sync 별개': ['작업 완료와 배포 · 원격 검증 · 지도 동기화는 별개'],
      '준비 당시 native605 산출물 미확인': ['준비 당시', 'TASK-ES-605', '산출물은 아직 없었으므로 미확인'],
      '실제 Telegram 왕복 미검사·Windows 전체 재부팅 미검사·Claude artifact 되읽기 미확인·장기 효과 null': ['Telegram 왕복(미검사)', 'Windows 전체 재부팅 뒤 동작(미검사)', 'Claude artifact 되읽기(미확인)', '장기 효과(없음, null)']
    }
  }
};

// ---------- inputs ----------
const DATA = {};
function loadInputs() {
  const out = {};
  for (const [key, name] of Object.entries(INPUT_FILES)) {
    const rel = INPUT_DIR_REL + '/' + name;
    const info = readFileInfo(abs(rel), rel);
    let parsed = null, parseError = null;
    if (info.exists && name.endsWith('.json')) { try { parsed = JSON.parse(info.text); } catch (e) { parseError = errInfo(e); } }
    DATA[key] = parsed;
    out[key] = { ...withoutText(info), parsed: parsed !== null, parseError, note: key === 'prompt' ? '지시 전문은 해시만 기록(중앙 복제 금지)' : undefined };
  }
  return out;
}
function guidelineRefs() {
  const files = [
    { key: 'agentsMd', rel: 'AGENTS.md' }, { key: 'claudeMd', rel: 'CLAUDE.md' },
    { key: 'workReferenceLocal', rel: 'C:/dev/agent-knowledge/WORK-REFERENCE.md' }, { key: 'workReferenceRepoCopy', rel: 'docs/agents/WORK-REFERENCE.md' },
    { key: 'moduleBlueprint', rel: 'docs/architecture/MODULE-BLUEPRINT.md' }, { key: 'modulesJson', rel: 'docs/architecture/modules.json' }
  ];
  const out = {};
  for (const f of files) {
    const info = readFileInfo(abs(f.rel), f.rel);
    const entry = withoutText(info);
    if (info.exists && /WORK-REFERENCE/.test(f.rel)) { const m = info.text.match(/기준 PR #(\d+)\*?\*?\s*\(([0-9a-f]{7,40})\)/); entry.basis = m ? { pr: Number(m[1]), commit: m[2] } : null; }
    if (info.exists && f.key === 'modulesJson') { try { entry.cells = JSON.parse(info.text).cells.length; } catch (e) { entry.cells = null; } }
    out[f.key] = entry;
  }
  const active = git(['show', 'origin/main:docs/directives/ACTIVE.md']);
  out.directivesOriginMain = active.ok ? { sha256: sha256(Buffer.from(active.stdout, 'utf8')), openDirectivesNone: active.stdout.includes('(열린 지시 없음)') } : { sha256: null, openDirectivesNone: null, rawFailure: gitSummary(active) };
  return out;
}
function sourceCommitInfo() {
  const head = git(['rev-parse', 'HEAD']); const originMain = git(['rev-parse', 'origin/main']);
  const requested = DATA.request && DATA.request.sourceCommit || null;
  const preserved = DATA.preservationBefore && DATA.preservationBefore.sourceCommit || null;
  const headSha = head.ok ? head.stdout.trim() : null; const originSha = originMain.ok ? originMain.stdout.trim() : null;
  return { requested, preservationBefore: preserved, headFromGit: headSha, originMainLocalRef: originSha, headMatchesRequested: headSha && requested ? headSha === requested : null, headMatchesOriginMain: headSha && originSha ? headSha === originSha : null, rawFailures: { head: head.ok ? null : gitSummary(head), originMain: originMain.ok ? null : gitSummary(originMain) }, note: '네트워크 fetch 는 이 스크립트가 하지 않는다(로컬 ref 값)' };
}

// ---------- production sources ----------
function readProductionSources() {
  const excerpts = DATA.uiSourceExcerpts || {}; const obs = DATA.publicObservation || {}; const pres = DATA.preservationBefore || {};
  const findSha = (list, name) => { const hit = (Array.isArray(list) ? list : []).find(item => typeof item.path === 'string' && item.path.replace(/\\/g, '/').endsWith('/' + name)); return hit ? hit.sha256 : null; };
  const files = {}; const rawFailures = []; const texts = {};
  for (const [key, name] of Object.entries(PRODUCTION_FILES)) {
    const absPath = path.join(PRODUCTION_DIR, name);
    const info = readFileInfo(absPath, absPath);
    const expected = { uiSourceExcerpts: findSha(excerpts.externalReadOnlyReferences, name), publicObservation: findSha(obs.sourceHashes, name), preservationBefore: findSha(pres.productionSources, name) };
    files[key] = { ...withoutText(info), expectedSha256: expected, matchesInputs: info.exists ? { uiSourceExcerpts: expected.uiSourceExcerpts ? expected.uiSourceExcerpts === info.sha256 : null, publicObservation: expected.publicObservation ? expected.publicObservation === info.sha256 : null, preservationBefore: expected.preservationBefore ? expected.preservationBefore === info.sha256 : null } : { uiSourceExcerpts: null, publicObservation: null, preservationBefore: null } };
    if (info.exists) texts[key] = info.text; else rawFailures.push({ file: name, error: info.error });
  }
  let mode = 'live-source';
  if (!texts.appJs || !texts.indexHtml) {
    mode = 'frozen-input-snapshot';
    for (const src of (Array.isArray(excerpts.sources) ? excerpts.sources : [])) {
      const name = String(src.sourcePath || '').replace(/\\/g, '/').split('/').pop();
      const key = Object.keys(PRODUCTION_FILES).find(k => PRODUCTION_FILES[k] === name);
      if (key && !texts[key]) texts[key] = (src.ranges || []).map(r => r.text).join('\n');
    }
  }
  return { mode, files, rawFailures, texts, partial: mode !== 'live-source' };
}
function excerptConsistency(src) {
  const excerpts = DATA.uiSourceExcerpts || {};
  if (src.mode !== 'live-source') return { checked: false, reason: 'frozen snapshot 모드 — 발췌가 곧 측정 텍스트라 자기 대조는 의미 없음', ranges: [], allEqual: null };
  const ranges = [];
  for (const source of (Array.isArray(excerpts.sources) ? excerpts.sources : [])) {
    const name = String(source.sourcePath || '').replace(/\\/g, '/').split('/').pop();
    const key = Object.keys(PRODUCTION_FILES).find(k => PRODUCTION_FILES[k] === name);
    const lines = key && src.texts[key] ? src.texts[key].replace(/\r\n/g, '\n').split('\n') : null;
    for (const r of (source.ranges || [])) {
      const live = lines ? lines.slice(r.firstLine - 1, r.lastLine).join('\n') : null;
      const expected = String(r.text || '').replace(/\r\n/g, '\n');
      ranges.push({ file: name, firstLine: r.firstLine, lastLine: r.lastLine, equal: live === null ? null : live === expected, liveSha256: live === null ? null : sha256(Buffer.from(live, 'utf8')), excerptSha256: sha256(Buffer.from(expected, 'utf8')) });
    }
  }
  return { checked: true, ranges, allEqual: ranges.length ? ranges.every(r => r.equal === true) : null };
}

// ---------- component probe (vm 격리 로드) ----------
function loadApi(appText, archive) {
  const sandbox = { module: { exports: {} }, console: { log() {}, warn() {}, error() {} } };
  if (archive) sandbox.__YANGVIS_ARCHIVE = true;
  const context = vm.createContext(sandbox);
  new vm.Script(appText, { filename: 'yangvis-app.js' }).runInContext(context, { timeout: 5000 });
  return sandbox.module.exports;
}
function probeComponents(src) {
  const out = { loaded: false, mode: src.mode, isolation: 'node:vm createContext — document · window · fetch · setInterval 없음, 네트워크 0, 실제 DOM 0', exportsKeys: [], error: null, statusLabels: {}, matrix: [], special: [], archiveMode: null, invariants: {}, capabilityFilter: null, note: '부품 측정(순수 함수 호출)이며 실제 제어 단추 실행 E2E 가 아니다' };
  if (src.mode !== 'live-source') { out.error = { code: 'SNAPSHOT_MODE', message: '전체 app.js 가 없어 vm 로드를 하지 않음(발췌만 있음)' }; return out; }
  let api, archiveApi;
  try { api = loadApi(src.texts.appJs, false); archiveApi = loadApi(src.texts.appJs, true); }
  catch (e) { out.error = errInfo(e); return out; }
  out.loaded = typeof api.controlAllowed === 'function' && typeof api.statusInfo === 'function';
  out.exportsKeys = Object.keys(api);
  if (!out.loaded) return out;
  for (const s of STATUSES) out.statusLabels[s] = api.statusInfo(s)[0];
  out.statusLabels['(unknown)'] = api.statusInfo('no-such-status')[0];
  const EXEC = { none: undefined, alive: { alive: true, exited: false, startedAt: '2026-10-09T00:00:00.000Z', endedAt: null }, ended: { alive: false, exited: true, startedAt: '2026-10-09T00:00:00.000Z', endedAt: '2026-10-09T00:10:00.000Z' } };
  const allowedFor = (a, task) => Object.fromEntries(ACTIONS.map(action => [action, a.controlAllowed(task, action)]));
  for (const status of STATUSES) for (const [execKey, execution] of Object.entries(EXEC)) {
    const task = { status, readOnly: false, revision: 1, execution };
    out.matrix.push({ status, execution: execKey, allowed: allowedFor(api, task) });
  }
  out.special = [
    { label: 'readOnly=true (running · alive)', allowed: allowedFor(api, { status: 'running', readOnly: true, revision: 1, execution: EXEC.alive }) },
    { label: 'revision=null (running · alive)', allowed: allowedFor(api, { status: 'running', readOnly: false, revision: null, execution: EXEC.alive }) },
    { label: 'completed (ended)', allowed: allowedFor(api, { status: 'completed', readOnly: false, revision: 3, execution: EXEC.ended }) },
    { label: 'task=null', allowed: allowedFor(api, null) }
  ];
  out.archiveMode = { label: 'running · alive · __YANGVIS_ARCHIVE=true', allowed: allowedFor(archiveApi, { status: 'running', readOnly: false, revision: 1, execution: EXEC.alive }) };
  const rows = out.matrix;
  const all = (pred) => rows.every(pred);
  const noExec = row => !row.allowed.pause && !row.allowed.stop && !row.allowed.resume;
  out.invariants = {
    queryPlanNoExecutionControls: all(r => !['query', 'plan'].includes(r.status) || (noExec(r) && r.allowed.change === true)),
    completedNoControls: all(r => r.status !== 'completed' || Object.values(r.allowed).every(v => v === false)) && Object.values(out.special[2].allowed).every(v => v === false),
    readOnlyNoControls: Object.values(out.special[0].allowed).every(v => v === false),
    revisionNullNoControls: Object.values(out.special[1].allowed).every(v => v === false),
    nullTaskNoControls: Object.values(out.special[3].allowed).every(v => v === false),
    archiveModeNoControls: Object.values(out.archiveMode.allowed).every(v => v === false),
    changeAlwaysAllowedUnlessCompletedReadOnlyOrNoRevision: all(r => r.status === 'completed' ? r.allowed.change === false : r.allowed.change === true),
    resumeOnlyPausedStoppedBlocked: all(r => r.allowed.resume === (['paused', 'stopped', 'blocked'].includes(r.status))),
    pauseStopNeverAfterRequestOrConfirm: all(r => !['paused', 'stopped', 'stop-requested', 'pause-requested'].includes(r.status) || (!r.allowed.pause && !r.allowed.stop)),
    pauseStopWhenAliveExecution: all(r => r.execution !== 'alive' || ['query', 'plan', 'completed', 'paused', 'stopped', 'stop-requested', 'pause-requested'].includes(r.status) || (r.allowed.pause && r.allowed.stop)),
    pauseStopWithoutExecutionOnlyQueuedLikeStatuses: all(r => r.execution !== 'none' || (['queued', 'awaiting-selection', 'blocked', 'admission-pending'].includes(r.status) ? (r.allowed.pause && r.allowed.stop) : (!r.allowed.pause && !r.allowed.stop))),
    pauseStopAfterEndedExecutionOnlyQueuedLikeStatuses: all(r => r.execution !== 'ended' || (['queued', 'awaiting-selection', 'blocked', 'admission-pending'].includes(r.status) ? (r.allowed.pause && r.allowed.stop) : (!r.allowed.pause && !r.allowed.stop))),
    verificationPendingEndedOnlyChange: (() => { const r = rows.find(x => x.status === 'verification-pending' && x.execution === 'ended'); return !!r && noExec(r) && r.allowed.change === true; })()
  };
  // 설정 지원 필터(지원 확인·미지원·미확인) — 준비 관측의 capabilities 로 부품 실행
  const caps = DATA.publicObservation && Array.isArray(DATA.publicObservation.capabilities) ? DATA.publicObservation.capabilities : [];
  out.capabilityFilter = caps.map(tool => { const models = api.modelsFor(tool); return { tool: tool.id, toolStatus: tool.status, modelsTotal: Array.isArray(tool.models) ? tool.models.length : 0, modelsSelectable: models.map(m => m.id), modelsExcluded: (tool.models || []).filter(m => !models.includes(m)).map(m => ({ id: m.id, status: m.status })), effortsOfFirstSelectable: models[0] ? api.effortsFor(models[0]).map(e => e.id) : [], executionVerifiedAny: (tool.models || []).some(m => m.executionVerified === true), accountModelAccessKnown: (tool.models || []).some(m => m.accountModelAccess !== null && m.accountModelAccess !== undefined) }; });
  return out;
}

// ---------- controls ----------
function measureControls(src, probe) {
  const appText = src.texts.appJs || ''; const indexText = src.texts.indexHtml || '';
  const four = CONTROL_DEFS.map(([action, label]) => ({ action, label, selector: '[data-control="' + action + '"]', labelPairInSource: has(appText, "['" + action + "','" + label + "']"), dataControlTemplateInSource: has(appText, 'data-control="${id}"'), dangerClass: action === 'stop' ? has(appText, "id === 'stop' ? 'danger-button'") : null }));
  const wiringItems = [
    ['controlAllowed 정의', /const controlAllowed = \(task, action\) =>/.test(appText)],
    ['control(action, instruction) 정의', /async function control\(action, instruction\)/.test(appText)],
    ['controls(task) 렌더 정의', /function controls\(task\)/.test(appText)],
    ['클릭 분기 target.dataset.control', has(appText, "target.dataset.control==='change'") && has(appText, 'control(target.dataset.control)')],
    ['허용 안 되면 disabled', has(appText, "${allowed ? '' : 'disabled'}")],
    ['controlPending 중 비활성', has(appText, 'controlAllowed(task,id) && !state.controlPending')],
    ['비활성 title 문구', has(appText, '현재 상태에서 지원하지 않는 제어입니다.')],
    ['피드백 자리 #control-feedback', has(appText, 'id="control-feedback"')],
    ['요청 중 문구', has(appText, '요청 저장과 상태 확인 중…')],
    ['변경 상자 #change-box · #change-instruction · 변경 접수', has(appText, 'id="change-box" hidden') && has(appText, 'id="change-instruction"') && has(appText, 'data-action="submit-change"') && has(appText, '변경 접수')],
    ['변경 접수 빈 입력 안내', has(appText, '변경할 지시를 적어주세요.')],
    ['expectedRevision 동봉', has(appText, 'expectedRevision:task.revision')],
    ['제어 요청 경로 /control', has(appText, '/control`')],
    ['토스트 · 중단', has(appText, '중단 요청을 접수했습니다. 실제 종료 확인은 작업 상태에서 읽습니다.')],
    ['토스트 · 보류', has(appText, '보류 요청을 접수했습니다. 실제 확인을 기다립니다.')],
    ['토스트 · 재개/변경', has(appText, '변경 요청을 접수했습니다.')],
    ['요청 알림 · stop-requested', has(appText, '중단을 요청했습니다. 실제 실행 종료는 아직 확인되지 않았습니다. 이미 반영된 결과와 기록은 보존됩니다.')],
    ['요청 알림 · pause-requested', has(appText, '보류를 요청했습니다. 실행이 멈췄다는 근거는 아직 확인되지 않았습니다.')],
    ['이유 · readOnly', has(appText, '기존 정본을 읽는 작업입니다. 현재 실행을 제어하는 작업이 아니므로 제어할 수 없습니다.')],
    ['이유 · revision null', has(appText, '개정 번호가 확인되지 않아 제어할 수 없습니다.')],
    ['이유 · completed', has(appText, '완료된 작업은 제어할 수 없습니다. 후속 지시는 새 작업으로 접수합니다.')],
    ['이유 · query/plan', has(appText, '상태 질문·계획만 요청은 실행하지 않으므로 중단·재개가 없습니다.')],
    ['이유 · 기본', has(appText, '실행이 없거나 해당 상태에서 허용되지 않는 제어는 비활성화됩니다. 요청과 실제 확인은 구분됩니다.')],
    ['오류 문구', has(appText, '상태를 다시 읽어 확인해주세요.')],
    ['상태 라벨 · pause-requested', has(appText, "'pause-requested': ['보류 요청 · 확인 전'")],
    ['상태 라벨 · paused', has(appText, "paused: ['보류 확인'")],
    ['상태 라벨 · stop-requested', has(appText, "'stop-requested': ['중단 요청 · 확인 전'")],
    ['상태 라벨 · stopped', has(appText, "stopped: ['중단 확인'")],
    ['사건 라벨 · 지휘 개정 충돌 확인', has(appText, "'input-reconciliation-blocked':'지휘 개정 충돌 확인'")],
    ['query/plan 접수 안내(비실행)', has(appText, '상태 질문이 접수됐습니다. 작업 실행은 요청하지 않았습니다.') && has(appText, '계획 요청이 접수됐습니다. 작업 실행은 요청하지 않았습니다.')],
    ['query/plan 모드 안내(비실행)', has(appText, '상태를 묻습니다. 실행 지시를 보내지 않습니다.') && has(appText, '계획만 요청합니다. 실행 지시를 보내지 않습니다.')],
    ['상세 창 작업 지휘 제목', has(appText, '<h2>작업 지휘</h2>')],
    ['index.html 에 제어 단추 없음(상세 창에서 동적 렌더)', !has(indexText, 'data-control=')]
  ];
  const wiring = wiringItems.map(([name, present]) => ({ name, present: !!present }));
  // 준비 담당 DOM 관측과 대조
  const obs = DATA.publicObservation || {};
  const observedButtons = obs.dom && obs.dom.taskDetail && Array.isArray(obs.dom.taskDetail.controls) ? obs.dom.taskDetail.controls : [];
  const detailPath = (Array.isArray(obs.observedGetPaths) ? obs.observedGetPaths : []).map(p => (String(p).match(/^\/api\/yangvis\/tasks\/([A-Za-z0-9_-]+)$/) || [])[1]).filter(Boolean).pop() || null;
  const observedTask = detailPath && Array.isArray(obs.tasks) ? obs.tasks.find(t => t.taskId === detailPath) || null : null;
  let consistent = null; const buttons = [];
  for (const [action, label] of CONTROL_DEFS) {
    const o = observedButtons.find(b => b.action === action) || null;
    const entry = { action, observed: o ? { selector: o.selector, label: o.label, disabled: o.disabled } : null, selectorMatchesSource: o ? o.selector === '[data-control="' + action + '"]' : null, labelMatchesSource: o ? o.label === label : null, controlAllowedForObservedTask: null, disabledConsistent: null };
    if (o && observedTask && probe.loaded) {
      try { const api = loadApi(src.texts.appJs, false); const t = { status: observedTask.status, readOnly: observedTask.readOnly, revision: observedTask.revision, execution: observedTask.execution }; entry.controlAllowedForObservedTask = api.controlAllowed(t, action); entry.disabledConsistent = (o.disabled === true) === (entry.controlAllowedForObservedTask === false); } catch (e) { entry.error = errInfo(e); }
    }
    buttons.push(entry);
  }
  if (buttons.every(b => b.disabledConsistent !== null)) consistent = buttons.every(b => b.disabledConsistent === true);
  const domObservation = { source: INPUT_DIR_REL + '/public-observation.json', kind: 'preparer observation (read-only GET/DOM), not native live remeasurement', measuredAt: obs.measuredAt || null, observedAppJsSha256: (Array.isArray(obs.sourceHashes) ? obs.sourceHashes : []).filter(h => /app\.js$/.test(String(h.path).replace(/\\/g, '/'))).map(h => h.sha256)[0] || null, liveAppJsSha256: src.files.appJs ? src.files.appJs.sha256 : null, observedTaskId: detailPath, observedTaskSummary: observedTask ? { status: observedTask.status, readOnly: observedTask.readOnly, revision: observedTask.revision, executionExited: observedTask.execution ? observedTask.execution.exited : null, executionEndedAt: observedTask.execution ? observedTask.execution.endedAt : null, progress: observedTask.progress, eta: observedTask.eta, requested: observedTask.requested, actual: observedTask.actual } : null, buttons, consistentWithControlAllowed: consistent, blockedMutationCount: obs.blockedMutationCount == null ? null : obs.blockedMutationCount, pageErrorCount: obs.pageErrorCount == null ? null : obs.pageErrorCount };
  domObservation.observedShaEqualsLive = domObservation.observedAppJsSha256 && domObservation.liveAppJsSha256 ? domObservation.observedAppJsSha256 === domObservation.liveAppJsSha256 : null;
  return { four, wiring, wiringAllPresent: wiring.every(w => w.present), domObservation, realClickE2E: null, serverBehaviorMeasured: false };
}

// ---------- stages ----------
function selectorInSource(selector, appText, indexText) {
  const both = appText + '\n' + indexText;
  let literal = false, template = false, idRef = false, valueInSource = null;
  const attr = selector.match(/^\[([a-z-]+)(?:="([^"]*)")?\]$/);
  if (attr) {
    const [, name, value] = attr;
    if (value === undefined) { literal = has(both, name + '="'); }
    else { literal = has(both, name + '="' + value + '"'); template = has(both, name + '="${'); valueInSource = has(both, "'" + value + "'") || has(both, '"' + value + '"') || has(both, "['" + value + "'"); }
  } else if (selector.startsWith('#')) {
    const id = selector.slice(1);
    literal = has(both, 'id="' + id + '"'); idRef = has(both, "'" + selector + "'") || has(both, '`' + selector + '`') || has(both, selector + "'");
    const dash = id.indexOf('-');
    if (dash > 0) { const prefix = id.slice(0, dash), rest = id.slice(dash + 1); template = has(both, 'id="${prefix}-' + rest + '"'); valueInSource = has(both, "'" + prefix + "'"); }
  } else if (selector.startsWith('.')) {
    const cls = selector.slice(1); literal = new RegExp('class="[^"]*(^|\\s)' + escapeRe(cls) + '(\\s|"|\\$)').test(both) || new RegExp('class="' + escapeRe(cls) + '[\\s"$]').test(both);
  }
  const resolvable = literal || idRef || (template && valueInSource === true);
  return { literal, template, valueInSource, idRef, resolvable };
}
function functionDefined(name, appText) {
  const re = new RegExp('(?:^|[^A-Za-z0-9_$])(?:async\\s+)?function\\s+' + escapeRe(name) + '\\s*\\(|(?:^|[^A-Za-z0-9_$])const\\s+' + escapeRe(name) + '\\s*=', 'g');
  const n = (appText.match(re) || []).length;
  return { definedInAppJs: n > 0, definitionCount: n };
}
function measureStages(src, guideText) {
  const appText = src.texts.appJs || ''; const indexText = src.texts.indexHtml || '';
  const idx = guideText.indexOf(EVIDENCE_HEADING);
  const body = idx >= 0 ? guideText.slice(0, idx) : guideText; const evidence = idx >= 0 ? guideText.slice(idx) : '';
  const stages = Array.isArray(DATA.request && DATA.request.stages) ? DATA.request.stages : [];
  return stages.map(stage => {
    const spec = STAGE_SPEC[stage.id] || { labels: [], mustExplain: {} };
    const selectors = (stage.selectors || []).map(selector => { const s = selectorInSource(selector, appText, indexText); return { selector, ...s, inGuideEvidence: has(evidence, selector), inGuideBody: has(body, selector) }; });
    const sourceFunctions = (stage.sourceFunctions || []).map(name => ({ name, ...functionDefined(name, appText), inGuideEvidence: wordRe(name).test(evidence), inGuideBody: wordRe(name).test(body) }));
    const labels = spec.labels.map(label => ({ label, inSource: has(appText, label) || has(indexText, label), inGuide: has(guideText, label) }));
    const mustExplain = (stage.mustExplain || []).map(text => { const phrases = spec.mustExplain[text] || null; const missingPhrases = phrases ? phrases.filter(p => !has(guideText, p)) : null; return { text, phrasesSpecified: !!phrases, phrases, missingPhrases, present: !!phrases && missingPhrases.length === 0 }; });
    const missing = {
      selectors: selectors.filter(s => !s.resolvable || !s.inGuideEvidence).map(s => s.selector),
      sourceFunctions: sourceFunctions.filter(f => !f.definedInAppJs || !f.inGuideEvidence).map(f => f.name),
      labels: labels.filter(l => !l.inSource || !l.inGuide).map(l => l.label),
      mustExplain: mustExplain.filter(m => !m.present).map(m => m.text)
    };
    return { id: stage.id, title: stage.title, titleInGuide: has(guideText, stage.title), counts: { selectors: selectors.length, sourceFunctions: sourceFunctions.length, labels: labels.length, mustExplain: mustExplain.length }, selectors, sourceFunctions, labels, mustExplain, identifiersInBody: selectors.filter(s => s.inGuideBody).map(s => s.selector), missing };
  });
}

// ---------- outputs: guide · req · plan ----------
function guideChecks(info, stages) {
  const text = info.text || '';
  const idx = text.indexOf(EVIDENCE_HEADING);
  const body = idx >= 0 ? text.slice(0, idx) : text;
  const commandLike = text.split(/\r?\n/).filter(line => /^\s*(?:\$\s*)?(?:node|git|npm|npx|gh|curl|powershell|pwsh|cmd|bash|sh)\b\s/i.test(line));
  const antiHits = ANTI_PATTERNS.map(p => ({ pattern: p, count: count(text, p) })).filter(h => h.count > 0);
  const stageHeadings = ['## 1단계. 지시하기', '## 2단계. 도구·모델·노력 선택', '## 3단계. 진행과 다음 행동 읽기', '## 4단계. 보류·중단·재개·지시 변경', '## 5단계. 지도와 근거 확인', '## 6단계. 법정과 완료 확인'].map(h => ({ heading: h, present: has(text, h) }));
  return { ...withoutText(info), hasEvidenceHeading: idx >= 0, stageHeadings, stageHeadingsAllPresent: stageHeadings.every(h => h.present), bodyFencedCodeBlocks: count(body, '```'), commandLikeLines: commandLike, escapedUnicodeCount: (text.match(/\\u[0-9a-fA-F]{4}/g) || []).length, forbidden77Count: count(text, '77종') + count(text, '77가지'), antiPatternHits: antiHits.reduce((n, h) => n + h.count, 0), antiPatternDetail: antiHits, configuredFakeColumn: /\|\s*요청\s*\|\s*(?:전달[^|]*|configured[^|]*)\|\s*실제/.test(text), identifiersOutsideEvidenceTable: stages.reduce((n, s) => n + s.identifiersInBody.length, 0), identifiersOutsideEvidenceTableDetail: stages.flatMap(s => s.identifiersInBody.map(sel => ({ stage: s.id, selector: sel }))), mentionsNotE2E: has(text, '실제 제어 단추 실행 E2E 가 아닙니다'), mentionsNotRegulation: has(text, '사용 설명서입니다'), statusDictionaryRows: (text.match(/^\|[^|\n]+\|[^|\n]+\|[^|\n]+\|$/gm) || []).length };
}
function lint8(text) {
  const issues = [];
  [...'①②③④⑤⑥⑦⑧'].forEach((s, i) => { if (!text.includes('## ' + (i + 1) + '. [원칙 ' + s + ']')) issues.push('missing independent header ' + s); });
  const step2 = (text.split('## 2.')[1] || '').split('## 3.')[0];
  for (const w of ['본질', '원인', '중심', '핵심']) if (!step2.includes(w)) issues.push('missing ' + w);
  if (!/## 6\.[^\n]*재검증/.test(text)) issues.push('missing revalidation');
  for (const w of ['반론1', '반론2']) if (!text.includes(w)) issues.push('missing ' + w);
  const headerLines = text.split('\n').filter(line => line.trim().startsWith('##'));
  for (const h of headerLines) if (/원칙\s*[①-⑧1-8]\s*[,·~+&]\s*[①-⑧1-8]|##.*원칙.*[,·~+&].*원칙/i.test(h)) issues.push('merged principle header: ' + h.trim());
  return issues;
}
function reqChecks() {
  const info = readFileInfo(abs(REQ_REL), REQ_REL); const text = info.text || '';
  const m = text.match(/\((가|나|다)\)\s*(표준|이탈|탐색)(?:\s*·\s*새 유형)?/);
  return { ...withoutText(info), lint8: { issues: info.exists ? lint8(text) : ['file missing'] }, has5Stage: ['이해', '분류', '예측', '반론', '선택'].every(w => has(text, w)) && has(text, '5단 추론 요약'), typeClassification: m ? m[0].trim().slice(0, 60) : null, hasTypeClassificationRationale: has(text, '유형 분류 근거'), hasRequirementIds: ['R1', 'R2', 'R3'].every(r => has(text, '**' + r + '**')), prematureCompletionMarks: (text.match(/\[x\]\s*\[(?:5|6)단계/g) || []).length, antiPatternHits: ANTI_PATTERNS.reduce((n, p) => n + count(text, p), 0), forbidden77Count: count(text, '77종') + count(text, '77가지') };
}
function planChecks() {
  const info = readFileInfo(abs(PLAN_REL), PLAN_REL); const text = info.text || '';
  return { ...withoutText(info), unchecked: (text.match(/^- \[ \]/gm) || []).length, checked: (text.match(/^- \[x\]/gmi) || []).length, has5Stage: ['이해', '분류', '예측', '반론', '선택'].every(w => has(text, w)) && has(text, '5단 추론 요약'), hasTypeClassification: /\((가|나|다)\)\s*(표준|이탈|탐색)/.test(text), prematureCompletionMarks: (text.match(/\[x\]\s*\[(?:5|6)단계/g) || []).length };
}

// ---------- preservation ----------
function preservation() {
  const pres = DATA.preservationBefore || {};
  const inputTracked = Array.isArray(pres.tracked) ? pres.tracked : [];
  const ls = git(['ls-files', '-z']);
  const gitList = ls.ok ? ls.stdout.split('\0').filter(Boolean) : null;
  const inputSet = new Set(inputTracked.map(t => t.path));
  const gitSet = gitList ? new Set(gitList) : null;
  const gitVsInput = gitList ? { gitCount: gitList.length, inputCount: inputTracked.length, inGitNotInInput: gitList.filter(p => !inputSet.has(p)), inInputNotInGit: inputTracked.map(t => t.path).filter(p => !gitSet.has(p)) } : null;
  const mismatched = [], missing = []; let compared = 0;
  for (const t of inputTracked) {
    try { const h = sha256(fs.readFileSync(abs(t.path))); compared++; if (h !== t.sha256) mismatched.push(t.path); }
    catch (e) { missing.push({ path: t.path, error: errInfo(e) }); }
  }
  const status = git(['status', '--porcelain']);
  const changes = status.ok ? status.stdout.split(/\r?\n/).filter(Boolean).map(line => { const code = line.slice(0, 2); const p = line.slice(3).trim().replace(/^"|"$/g, ''); const isInputDir = p === INPUT_DIR_REL + '/' || p.startsWith(INPUT_DIR_REL + '/'); const allowlisted = ALLOWED_WRITES.includes(p) || ALLOWED_WRITES.some(w => w.startsWith(p)); return { code, path: p, category: isInputDir ? 'input-dir(read-only, provided by root)' : allowlisted ? 'allowlisted-output' : 'other' }; }) : null;
  // Git config — 원문 출력 금지, 해시만. 준비 담당의 산출 방법을 모르므로 후보 방법별로 재고 일치 여부만 기록한다.
  const common = git(['rev-parse', '--git-common-dir']); const gitDir = git(['rev-parse', '--git-dir']);
  const candidates = [];
  const addFileCandidate = (label, p) => { try { candidates.push({ method: label, sha256: sha256(fs.readFileSync(p)) }); } catch (e) { candidates.push({ method: label, sha256: null, error: errInfo(e) }); } };
  if (common.ok) addFileCandidate('common-dir config file bytes', path.resolve(ROOT, common.stdout.trim(), 'config'));
  if (gitDir.ok) addFileCandidate('git-dir config.worktree file bytes', path.resolve(ROOT, gitDir.stdout.trim(), 'config.worktree'));
  for (const [label, args] of [['git config --list', ['config', '--list']], ['git config --local --list', ['config', '--local', '--list']], ['git config --list --show-origin', ['config', '--list', '--show-origin']], ['git config --global --list', ['config', '--global', '--list']], ['git config --system --list', ['config', '--system', '--list']], ['git config --worktree --list', ['config', '--worktree', '--list']]]) {
    const r = gitRaw(args);
    candidates.push(r.ok ? { method: label, sha256: sha256(Buffer.from(r.stdout, 'utf8')), sha256Crlf: sha256(Buffer.from(r.stdout.replace(/\r?\n/g, '\r\n'), 'utf8')) } : { method: label, sha256: null, error: r.error || { code: 'EXIT_' + r.status, message: r.stderr.slice(0, 120) } });
  }
  const want = pres.gitConfigSha256 || null;
  const matched = want ? (candidates.find(c => c.sha256 === want || c.sha256Crlf === want) || null) : null;
  return {
    trackedListSource: gitList ? 'git ls-files -z (대조) + preservation-before tracked 목록(해시 기준)' : 'preservation-before tracked 목록만(git 차단)',
    gitLsFilesRawFailure: ls.ok ? null : gitSummary(ls),
    gitVsInput,
    tracked: { inputCount: inputTracked.length, compared, mismatchedCount: mismatched.length, missingCount: missing.length, mismatched, missing: missing.slice(0, 50) },
    status: status.ok ? { changes, nonAllowlistedChanges: changes.filter(c => c.category === 'other').map(c => c.path) } : { rawFailure: gitSummary(status), changes: null, nonAllowlistedChanges: null },
    gitConfig: { inputSha256: want, candidates, matched: matched ? matched.method : null, note: matched ? '후보 방법 중 하나가 준비 담당 해시와 일치' : '준비 담당의 해시 산출 방법을 알 수 없어 동일성 미확인(null). 이 스크립트는 설정 원문·신원·토큰을 출력하지 않으며 설정 쓰기 명령을 실행하지 않는다', configWriteCommandsRun: false }
  };
}
function outputsAtMeasurement() {
  return ALLOWED_WRITES.map(rel => {
    if (SELF_REFERENTIAL.includes(rel)) { let exists = false; try { exists = fs.statSync(abs(rel)).isFile(); } catch (e) { exists = false; } return { path: rel, exists, hashed: false, reason: '후속 manifest 범위(자기 참조 방지) — SHA 는 커밋 트리 · PR diff 가 정본' }; }
    const info = readFileInfo(abs(rel), rel); return { path: rel, exists: info.exists, hashed: info.exists, bytes: info.bytes, sha256: info.sha256, eol: info.eol, lines: info.lines };
  });
}

// ---------- summary ----------
function summarize(out) {
  const sum = (key) => out.stages.reduce((n, s) => n + s.missing[key].length, 0);
  return {
    mode: out.mode,
    productionSourcesMatchAllInputs: Object.values(out.productionSources).every(f => f.exists && Object.values(f.matchesInputs).every(v => v === true)),
    excerptAllEqual: out.excerptConsistency.allEqual,
    componentProbeLoaded: out.componentProbe.loaded,
    componentInvariantsAllTrue: out.componentProbe.loaded ? Object.values(out.componentProbe.invariants).every(v => v === true) : null,
    controlsWiringAllPresent: out.controls.wiringAllPresent,
    controlsLabelSelectorAllInSource: out.controls.four.every(c => c.labelPairInSource && c.dataControlTemplateInSource),
    domObservationConsistent: out.controls.domObservation.consistentWithControlAllowed,
    stagesMeasured: out.stages.length,
    stagesWithMissing: out.stages.filter(s => Object.values(s.missing).some(a => a.length)).map(s => s.id),
    selectorsMissingTotal: sum('selectors'), functionsMissingTotal: sum('sourceFunctions'), labelsMissingTotal: sum('labels'), mustExplainMissingTotal: sum('mustExplain'),
    mustExplainTotal: out.stages.reduce((n, s) => n + s.mustExplain.length, 0),
    guideIdentifiersOutsideEvidenceTable: out.guide.identifiersOutsideEvidenceTable,
    guideBodyFencedCodeBlocks: out.guide.bodyFencedCodeBlocks,
    guideCommandLikeLines: out.guide.commandLikeLines.length,
    reqLintIssues: out.req.lint8.issues.length,
    preservationMismatchCount: out.preservation.tracked.mismatchedCount,
    preservationMissingCount: out.preservation.tracked.missingCount,
    gitConfigMatched: out.preservation.gitConfig.matched,
    nonAllowlistedChanges: out.preservation.status.nonAllowlistedChanges
  };
}

// ---------- measure ----------
function measure() {
  const out = { schema: SCHEMA_STDOUT, taskId: TASK, type: '작업자 측정, 판정 아님 — 소스/부품 측정이며 실제 제어 단추 실행 E2E 가 아니다', measuredAt: new Date().toISOString(), runtime: { node: process.version, platform: process.platform, arch: process.arch, cwd: process.cwd(), root: ROOT }, mode: null, notes: [] };
  out.inputs = loadInputs();
  out.guidelines = guidelineRefs();
  out.sourceCommit = sourceCommitInfo();
  const src = readProductionSources();
  out.mode = src.mode; out.productionDir = PRODUCTION_DIR; out.productionSources = src.files; out.productionReadFailures = src.rawFailures;
  if (src.mode !== 'live-source') out.notes.push('생산 파일 읽기 실패 — frozen snapshot 모드. 발췌로 잴 수 있는 부분만 쟀다.');
  out.excerptConsistency = excerptConsistency(src);
  out.componentProbe = probeComponents(src);
  out.controls = measureControls(src, out.componentProbe);
  const guideInfo = readFileInfo(abs(GUIDE_REL), GUIDE_REL);
  out.stages = measureStages(src, guideInfo.text || '');
  out.guide = guideChecks(guideInfo, out.stages);
  out.req = reqChecks();
  out.plan = planChecks();
  out.preservation = preservation();
  out.outputsAtMeasurement = outputsAtMeasurement();
  out.limitations = { realControlButtonE2E: null, realAccountExecutionSuccess: null, remainingQuotaOrCost: null, liveApiRead: null, liveApiReadNote: 'same-origin wrapper 인증이 Node 측정기에 없어 운영 API 를 읽지 않았다(GET 포함 0). 준비 담당 스냅샷(public-observation.json)만 사용', telegramRealRoundTrip: null, windowsFullReboot: null, claudeArtifactReadback: null, longTermEffect: null, courtVerdict: null, nativeOutputAtPreparation: null, serverSideControlHandling: null };
  for (const [k, f] of Object.entries(out.productionSources)) if (f.exists && Object.values(f.matchesInputs).some(v => v === false)) out.notes.push('생산 ' + PRODUCTION_FILES[k] + ' SHA 가 입력 기록과 다르다 — 안내서 문구가 낡았을 수 있음');
  out.summary = summarize(out);
  return out;
}

// ---------- assemble ----------
function assemble() {
  const startedAt = new Date().toISOString();
  let child = null, spawnError = null, stdoutText = null, exitCode = null, signal = null, stderrText = '';
  try { child = spawnSync(process.execPath, [abs(SCRIPT_REL)], { cwd: ROOT, encoding: 'utf8', windowsHide: true, maxBuffer: 256 * 1024 * 1024 }); }
  catch (e) { spawnError = errInfo(e); }
  if (child && !child.error) { stdoutText = child.stdout; exitCode = child.status; signal = child.signal || null; stderrText = (child.stderr || '').slice(0, 4000); }
  else {
    spawnError = spawnError || errInfo(child && child.error);
    const inProcess = measure(); inProcess.notes.push('자식 프로세스 생성 실패(' + JSON.stringify(spawnError) + ') — 같은 프로세스에서 측정, exitCode null');
    stdoutText = JSON.stringify(inProcess, null, 2) + '\n';
  }
  const endedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(abs(RAW_STDOUT_REL)), { recursive: true });
  fs.writeFileSync(abs(RAW_STDOUT_REL), stdoutText, 'utf8');
  const rawBuf = fs.readFileSync(abs(RAW_STDOUT_REL));
  let parsed = null, parseError = null; try { parsed = JSON.parse(rawBuf.toString('utf8')); } catch (e) { parseError = errInfo(e); }
  const doc = {
    schema: SCHEMA_MEASUREMENT, taskId: TASK, type: '작업자 측정, 판정 아님 — 소스/부품 측정이며 실제 제어 단추 실행 E2E · 실계정 · Court 판정이 아니다',
    command: ['node', SCRIPT_REL], cwd: process.cwd(), root: ROOT, environment: { node: process.version, platform: process.platform, arch: process.arch },
    startedAt, endedAt, exitCode, signal, spawnError, stderr: stderrText,
    measuredAt: parsed ? parsed.measuredAt : null, mode: parsed ? parsed.mode : null, sourceCommit: parsed ? parsed.sourceCommit : null,
    raw: { stdout: { path: RAW_STDOUT_REL, bytes: rawBuf.length, sha256: sha256(rawBuf), parsed: !!parsed, parseError }, note: 'stdout 의 SHA 는 stdout 바깥(이 파일)에만 있다' },
    inputs: parsed ? parsed.inputs : null, guidelines: parsed ? parsed.guidelines : null,
    productionDir: PRODUCTION_DIR, productionSources: parsed ? parsed.productionSources : null, productionReadFailures: parsed ? parsed.productionReadFailures : null, excerptConsistency: parsed ? parsed.excerptConsistency : null,
    componentProbe: parsed ? parsed.componentProbe : null, controls: parsed ? parsed.controls : null, stages: parsed ? parsed.stages : null,
    guide: parsed ? parsed.guide : null, req: parsed ? parsed.req : null, plan: parsed ? parsed.plan : null, preservation: parsed ? parsed.preservation : null,
    outputs: { atMeasurement: parsed ? parsed.outputsAtMeasurement : null, manifestScope: { hashedHere: ALLOWED_WRITES.filter(p => !SELF_REFERENTIAL.includes(p)), notHashedHere: SELF_REFERENTIAL, reason: 'measurement.json · claims.json · raw stdout 의 자기 SHA 는 자기 내용에 넣지 않는다. 그 SHA 는 커밋 트리 · PR diff 가 정본이다', claimsWrittenAfterThisFile: true } },
    limitations: parsed ? parsed.limitations : null, notes: parsed ? parsed.notes : null, summary: parsed ? parsed.summary : null,
    assembly: { command: ['node', SCRIPT_REL, '--assemble'], at: endedAt, writes: [RAW_STDOUT_REL, MEASUREMENT_REL] }
  };
  fs.writeFileSync(abs(MEASUREMENT_REL), JSON.stringify(doc, null, 2) + '\n', 'utf8');
  process.stdout.write(JSON.stringify({ assembled: true, measurement: MEASUREMENT_REL, rawStdout: RAW_STDOUT_REL, exitCode, spawnError, summary: doc.summary }, null, 2) + '\n');
  return exitCode === 0 ? 0 : 1;
}

if (require.main === module) {
  if (process.argv.includes('--assemble')) { process.exitCode = assemble(); }
  else {
    try { process.stdout.write(JSON.stringify(measure(), null, 2) + '\n'); process.exitCode = 0; }
    catch (e) { process.stdout.write(JSON.stringify({ schema: SCHEMA_STDOUT, taskId: TASK, fatal: errInfo(e), stack: String(e && e.stack || '').split('\n').slice(0, 6) }, null, 2) + '\n'); process.exitCode = 1; }
  }
} else { module.exports = { measure, assemble, STAGE_SPEC }; }
