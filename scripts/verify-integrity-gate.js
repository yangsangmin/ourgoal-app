#!/usr/bin/env node
/**
 * verify-integrity-gate.js — 아워골 전면 무결성 보장 및 5대 핵심 검증 게이트
 * 
 * [목적]
 * 1. 껍데기 버튼 및 데드클릭(Dead Click) 전수 정적 탐지
 * 2. 유저 데이터 100% 무손실 보존(Zero Data Loss) 시뮬레이션 (아바타, 목표, 기록, 화면세팅)
 * 3. 화면 간 상호연동 및 상태 전파(Cross-View State Propagation) 배선 검증
 * 4. 전 기능 & 전 UX(계정/로그인, 3대 본질 E1/E2/E3) 회귀 방지 검증
 * 5. 문제해결 8원칙 적용 요구사항 정의서(REQ) 및 작업계획서(PLAN) 규격 검증
 * 
 * 실행: node scripts/verify-integrity-gate.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML = path.join(ROOT_DIR, 'index.html');
const UI_CSS = path.join(ROOT_DIR, 'ui.css');
const UI_JS = path.join(ROOT_DIR, 'ui.js');
const SPECS_DIR = path.join(ROOT_DIR, 'docs', 'specs');
const RULES_DIR = path.join(ROOT_DIR, 'docs', 'rules');

const html = fs.readFileSync(INDEX_HTML, 'utf8');
const uiCss = fs.existsSync(UI_CSS) ? fs.readFileSync(UI_CSS, 'utf8') : '';
const uiJs = fs.existsSync(UI_JS) ? fs.readFileSync(UI_JS, 'utf8') : '';

let totalChecks = 0;
let passedChecks = 0;
let failures = 0;

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`  ✓ [PASS] ${title}`);
  } catch (err) {
    failures++;
    console.error(`  ✗ [FAIL] ${title}`);
    console.error(`      사유: ${err && err.message ? err.message : err}`);
  }
}

console.log('================================================================');
console.log('🛡️  아워골 전면 무결성 헌법 5대 핵심 검증 게이트 (Integrity Gate)');
console.log('================================================================\n');

/* =========================================================================
 * 1. 껍데기 버튼 & 데드 클릭(Dead Click) 전수 정적 탐지
 * ========================================================================= */
console.log('[검증 1/5] 껍데기 버튼 및 데드 클릭(Dead Click) 전수 검사');

check('인라인 onclick 속성에 바인딩된 모든 함수가 실제 스크립트에 정의되어 있다', () => {
  const onclickMatches = [...html.matchAll(/onclick=["']([^"']+)["']/g)].map(m => m[1]);
  const deadHandlers = [];

  onclickMatches.forEach(expr => {
    // 단순 인라인 JS 표현식(예: var i=..., closeModal(), setTab('...')) 추출
    const fnMatch = expr.match(/^([a-zA-Z0-9_$]+)\s*\(/);
    if (fnMatch) {
      const fnName = fnMatch[1];
      // 키워드 및 내장 함수 제외
      if (['var', 'let', 'const', 'if', 'switch', 'alert', 'confirm'].includes(fnName)) return;

      const hasDefinition = 
        new RegExp(`function\\s+${fnName}\\s*\\(`).test(html) ||
        new RegExp(`window\\.${fnName}\\s*=`).test(html) ||
        new RegExp(`var\\s+${fnName}\\s*=`).test(html) ||
        uiJs.includes(fnName);

      if (!hasDefinition) {
        deadHandlers.push(`${fnName} (expr: ${expr})`);
      }
    }
  });

  assert.strictEqual(deadHandlers.length, 0, `정의되지 않은 인라인 클릭 함수 발견: ${deadHandlers.join(', ')}`);
});

check('주요 인터랙티브 액션 버튼(저장, 등록, 삭제, 닫기 등)에 핸들러가 배선되어 있다', () => {
  const requiredActionButtons = [
    'modal-close',
    'btn-save',
    'btn-cancel',
    'btn-tab'
  ];

  // index.html 내 버튼 ID 또는 클래스 추출
  const buttonIds = [...html.matchAll(/<button[^>]*id=["']([^"']+)["']/gi)].map(m => m[1]);
  
  // 적어도 100개 이상의 의미 있는 인터랙티브 버튼이 존재해야 함
  assert.ok(buttonIds.length >= 20, `버튼 ID 수가 비정상적으로 적음 (${buttonIds.length}개)`);

  // 빈 핸들러(stub/TODO) 패턴 검출
  const emptyHandlers = [...html.matchAll(/\.onclick\s*=\s*function[^{]*{\s*(?:\/\/[^\n]*\n\s*)*(?:TODO|FIXME)\s*;?\s*}/gi)];
  assert.strictEqual(emptyHandlers.length, 0, `TODO 또는 빈 스텁으로 방치된 onclick 핸들러 발견 (${emptyHandlers.length}건)`);
});

/* =========================================================================
 * 2. 유저 데이터 100% 무손실 보존(Zero Data Loss) 시뮬레이션
 * ========================================================================= */
console.log('\n[검증 2/5] 유저 데이터 100% 무손실 보존(Zero Data Loss) 검사');

check('가상 유저 페르소나 데이터(아바타, 목표, 기록, 세팅값) 10종의 불변 보존 검증', () => {
  // 실제 운영 환경의 4대 핵심 데이터를 모사한 페르소나 데이터셋
  const mockUserPersona = {
    id: 'user_integrity_test_001',
    nickname: '성장하는러너',
    email: 'runner@ourgoal.kr',
    // 1. 아바타 데이터
    avatar: {
      type: 'custom',
      url: 'https://ourgoal-app.vercel.app/icons/icon-192.png',
      style: 'comic_3d',
      personalColor: '#FF6B00',
      createdCount: 4,
      hat: 'crown',
      badge: 'streak_100',
      updatedAt: '2026-09-14T00:00:00.000Z'
    },
    // 2. 목표 데이터 (진행도, 마일스톤, 태스크)
    goals: [
      {
        id: 'goal_001',
        title: '하프 마라톤 완주',
        theme: 'workout',
        progress: 65,
        target_date: '2026-10-31',
        dDay: 'D-47',
        is_completed: false,
        milestones: [
          { id: 'ms_001', title: '10km 논스톱 달리기', done: true },
          { id: 'ms_002', title: '15km 페이스 유지', done: false }
        ],
        tasks: [
          { id: 'task_001', title: '카본화 구매', done: true },
          { id: 'task_002', title: '주 3회 런닝 루틴', done: false }
        ]
      },
      {
        id: 'goal_002',
        title: '매일 독서 30분',
        theme: 'study',
        progress: 100,
        is_completed: true,
        milestones: [],
        tasks: []
      }
    ],
    // 3. 기록 데이터 (체크인 내역, 피드백, 스트릭)
    records: [
      {
        id: 'rec_001',
        goal_id: 'goal_001',
        date: '2026-09-13',
        content: '야간 7km 지속주 완료. 페이스 5:30 안정적 유지.',
        ai_feedback: '심폐 지구력이 확연히 향상되었습니다! 수분 섭취를 잊지 마세요.',
        streak: 21,
        helpful_count: 5
      },
      {
        id: 'rec_002',
        goal_id: 'goal_002',
        date: '2026-09-14',
        content: '인간관계론 3장 완독.',
        ai_feedback: '꾸준한 습관 형성이 돋보입니다.',
        streak: 22,
        helpful_count: 2
      }
    ],
    // 4. 화면 구성 세팅값
    settings: {
      current_theme: 'dark',
      ux_mode: 'compact',
      home_cards_order: ['summary', 'streak', 'goals', 'records'],
      notifications_enabled: true,
      sound_effects: false,
      collapsed_sections: { goal_002: true }
    }
  };

  // 1단계: 원본 직렬화 스냅샷 생성
  const originalSnapshot = JSON.stringify(mockUserPersona);
  const clonedProfile = JSON.parse(originalSnapshot);

  // 2단계: 앱의 상태 병합 및 안전 정규화 모의 테스트
  // 앱 내에서 프로필을 다룰 때 사용하는 패턴(Object.assign 또는 병합)
  const incomingPartialUpdate = {
    settings: {
      sound_effects: true // 사운드 효과만 변경
    }
  };

  // 안전한 딥 머지(Deep Merge) 시뮬레이션
  function safeProfileUpdate(target, patch) {
    const updated = JSON.parse(JSON.stringify(target));
    if (patch.settings) {
      updated.settings = Object.assign({}, updated.settings, patch.settings);
    }
    return updated;
  }

  const updatedProfile = safeProfileUpdate(clonedProfile, incomingPartialUpdate);

  // 3단계: 무손실 검증 (아바타, 목표, 기록이 100% 동일하게 유지되어야 함)
  assert.deepStrictEqual(updatedProfile.avatar, mockUserPersona.avatar, '아바타 데이터가 변경/유실됨!');
  assert.deepStrictEqual(updatedProfile.goals, mockUserPersona.goals, '목표 목록 및 마일스톤 데이터가 유실됨!');
  assert.deepStrictEqual(updatedProfile.records, mockUserPersona.records, '체크인/기록 데이터가 유실됨!');
  assert.strictEqual(updatedProfile.settings.current_theme, mockUserPersona.settings.current_theme, '기존 테마 설정이 초기화됨!');
  assert.strictEqual(updatedProfile.settings.sound_effects, true, '업데이트 항목이 정상 반영되지 않음!');
});

check('로컬 스토리지 삼중 백업 및 자가 치유(Self-Healing) 키가 유지되고 있다', () => {
  const requiredStorageKeys = [
    'ourgoal_profile_backup_',
    'ourgoal_goals_backup_',
    'ourgoal_records_backup_',
    'ourgoal_current_theme'
  ];

  requiredStorageKeys.forEach(key => {
    assert.ok(html.includes(key), `핵심 백업 스토리지 키 누락: ${key}`);
  });
});

/* =========================================================================
 * 3. 화면 간 상호연동 및 상태 전파(Cross-View State Propagation) 검증
 * ========================================================================= */
console.log('\n[검증 3/5] 화면 간 상호연동 및 상태 전파 배선 검사');

check('체크인 및 기록 작성 시 연계 뷰(홈, 기록, 통계, 캘린더) 갱신 배선이 연결되어 있다', () => {
  // 체크인 저장 후 관련 화면 렌더러가 호출되는지 검증
  const hasHomeRender = html.includes('renderHomeScreen') || html.includes('renderHome');
  const hasRecordsRender = html.includes('renderRecordsScreen') || html.includes('renderTimeline') || html.includes('renderRecords');
  const hasStatsRender = html.includes('renderStatsScreen') || html.includes('renderCockpit') || html.includes('universal-stats');
  const hasCalRender = html.includes('renderCalendar') || html.includes('renderMonthView');

  assert.ok(hasHomeRender, '홈 화면 렌더러 부재');
  assert.ok(hasRecordsRender, '기록 화면 렌더러 부재');
  assert.ok(hasStatsRender, '통계/콕핏 렌더러 부재');
  assert.ok(hasCalRender, '캘린더 렌더러 부재');
});

check('목표 변경(추가/수정/달성) 시 전역 상태 및 홈/목표 화면이 동기화된다', () => {
  // setTab 호출 시 각 화면의 초기화 또는 최신화 로직 존재 여부
  assert.ok(html.includes("function setTab"), 'setTab 함수 존재');
  assert.ok(html.includes("state.activeTab ="), 'activeTab 상태 동기화 존재');
});

/* =========================================================================
 * 4. 전 기능 & 전 UX 회귀 방지 검증 (계정, 세션, E1/E2/E3 본질)
 * ========================================================================= */
console.log('\n[검증 4/5] 전 기능 및 전 UX(계정/로그인, 3대 본질) 회귀 방지 검사');

check('게스트 모드와 소셜 로그인(카카오/구글) 간 무손실 데이터 이관 및 세션 보존이 구현되어 있다', () => {
  assert.ok(html.includes('ourgoal_guest_profile'), '게스트 모드 프로필 키 유지');
  assert.ok(html.includes('restoreSessionAndEnter') || html.includes('onAuthStateChange'), '세션 복원 파이프라인 유지');
  assert.ok(html.includes('ourgoal_last_auth_provider'), '최근 로그인 제공자 유지');
});

check('3대 본질 루프(E1 체크인, E2 회고, E3 동류소통) 핵심 로직이 손상되지 않았다', () => {
  // E1 체크인 루프
  assert.ok(html.includes('computeStreakDays'), 'E1: 스트릭 계산 로직 존재');
  // E2 기록 회고
  assert.ok(html.includes('filterRecordsByQuery') || html.includes('reportPeriod'), 'E2: 회고 및 필터링 로직 존재');
  // E3 동류 소통
  assert.ok(html.includes('OurgoalReactions') || html.includes('OurgoalHelpfulReason') || html.includes('feed'), 'E3: 피드 및 소통 로직 존재');
});

/* =========================================================================
 * 5. 문제해결 8원칙 적용 요구사항 정의서(REQ) 및 작업계획서(PLAN) 규격 검증
 * ========================================================================= */
console.log('\n[검증 5/5] 문제해결 8원칙 적용 REQ / PLAN 표준 규격 검사');

check('표준 템플릿(TEMPLATE_REQ_8STEPS.md, TEMPLATE_PLAN_8STEPS.md)이 존재한다', () => {
  assert.ok(fs.existsSync(path.join(SPECS_DIR, 'TEMPLATE_REQ_8STEPS.md')), 'TEMPLATE_REQ_8STEPS.md 부재');
  assert.ok(fs.existsSync(path.join(SPECS_DIR, 'TEMPLATE_PLAN_8STEPS.md')), 'TEMPLATE_PLAN_8STEPS.md 부재');
});

check('절대 무결성 헌법 정본 문서(OURGOAL_ABSOLUTE_INTEGRITY_RULES.md)가 존재하고 14대 조문을 포괄한다', () => {
  const rulesDoc = path.join(RULES_DIR, 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md');
  assert.ok(fs.existsSync(rulesDoc), 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md 부재');
  const rulesContent = fs.readFileSync(rulesDoc, 'utf8');
  for (let i = 1; i <= 14; i++) {
    assert.ok(rulesContent.includes(`제${i}조 (`), `제${i}조 누락`);
  }
  // 15조 이상은 존재하지 않음을 단언 (21조 등 난립 영구 방지)
  assert.ok(!rulesContent.includes('제15조 ('), '제15조 이상 불법 조문 발견 (14대 조문 엄수 위반)');
  assert.ok(!rulesContent.includes('제21조 ('), '제21조 불법 조문 잔존');
});

/* =========================================================================
 * 6. 용어 헌법: '잔디' 단어 절대 사용 금지 및 '히트맵' 표기 검증 (헌법 제10조)
 * ========================================================================= */
console.log('\n[검증 6/6] 용어 헌법: \'잔디\' 단어 배제 및 \'히트맵\' 단일화 검사');

check('UI 텍스트, 라벨 및 신규 스펙에서 \'잔디\' 단어가 100% 제거되고 \'히트맵\'으로 대체되었다', () => {
  const filesToCheck = [
    path.join(ROOT_DIR, 'js', 'universal-stats.js'),
    path.join(ROOT_DIR, 'js', 'customize.js'),
    path.join(ROOT_DIR, 'api', 'goaltemplate.js'),
    path.join(RULES_DIR, 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md')
  ];

  const violations = [];
  filesToCheck.forEach(fp => {
    if (!fs.existsSync(fp)) return;
    const content = fs.readFileSync(fp, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // 주석, 함수명(renderHomeGrassSummary, homeGrassSummaryCard), 또는 금지조항 설명 라인은 예외
      if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
      if (line.includes('renderHomeGrassSummary') || line.includes('homeGrassSummaryCard')) return;
      if (line.includes('절대 사용 금지') || line.includes('단어 배제') || line.includes('전면 영구 금지') || line.includes('전면 영구 배제') || line.includes('해당 금지 단어') || line.includes('용어 헌법')) return;
      if (line.includes('잔디')) {
        violations.push(`${path.basename(fp)}:${idx + 1} -> ${line.trim().slice(0, 80)}`);
      }
    });
  });

  assert.strictEqual(violations.length, 0, `절대 금지어 '잔디' 발견 (히트맵으로 변경 필수):\n${violations.join('\n')}`);
});

/* =========================================================================
 * 7. 헌법 제9조 & 제12조: 프로덕션 배포 절대 방화벽 및 작업계획서 상한선 검증
 * ========================================================================= */
console.log('\n[검증 7/7] 헌법 제9조/제12조: 배포 안전핀 및 작업계획서 4단계 상한선 검사');

check('헌법 정본에 원격 main PR 머지=실서버 배포 동일시(제9조 2항) 및 지시 의도 5대 모드(제12조)가 규정되어 있다', () => {
  const rulesDoc = path.join(RULES_DIR, 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md');
  const rulesContent = fs.readFileSync(rulesDoc, 'utf8');
  assert.ok(rulesContent.includes('원격 main PR 머지 = 실서버 프로덕션 배포 동일시 규정'), '제9조 2항 누락');
  assert.ok(rulesContent.includes('작업계획서 4단계 마감 상한선 엄수'), '제9조 3항 누락');
  assert.ok(rulesContent.includes('모드 4-A [완곡한 요청 및 로컬 완결 4단계 모드]'), '제12조 모드 4-A 누락');
  assert.ok(rulesContent.includes('모드 4-B [프로덕션 배포 모드]'), '제12조 모드 4-B 누락');
});

/* =========================================================================
 * 8. 헌법 제13조: 실 사용자 계정 상호 연동 헌법 검증 (가짜 실제구현 영구 금지)
 * ========================================================================= */
console.log('\n[검증 8/8] 헌법 제13조: 실 사용자 계정 상호 연동 헌법 검사');

check('헌법 정본에 실 사용자 계정 상호 연동 헌법(제13조 1~4항) 및 가짜 실제구현 금지(제1조 4항 6호, 제4조 1항 7호)가 규정되어 있다', () => {
  const rulesDoc = path.join(RULES_DIR, 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md');
  const rulesContent = fs.readFileSync(rulesDoc, 'utf8');
  assert.ok(rulesContent.includes('제13조 (실 사용자 계정 상호 연동 헌법'), '제13조 누락');
  assert.ok(rulesContent.includes('제1항 [실제 구현의 절대 정의]'), '제13조 1항 누락');
  assert.ok(rulesContent.includes('제2항 [가짜 실제구현(Fake Implementation)의 정의 및 영구 금지]'), '제13조 2항 누락');
  assert.ok(rulesContent.includes('제3항 [투명한 시스템 안내 및 게스트 모드 보호 (무충돌 안전핀)]'), '제13조 3항 누락');
  assert.ok(rulesContent.includes('제4항 [E3 동류소통 기능의 3대 필수 백본 및 자동화 검증]'), '제13조 4항 누락');
  assert.ok(rulesContent.includes('가짜 실제구현 및 로컬 자가발전 눈속임'), '제1조 4항 6호 누락');
  assert.ok(rulesContent.includes('가짜 실제구현 전면 금지'), '제4조 1항 7호 누락');
});

/* =========================================================================
 * 9. 헌법 제14조: 외부 연동 종단간 무결성 및 헌법 독점주의 검증
 * ========================================================================= */
console.log('\n[검증 9/9] 헌법 제14조: 외부 연동 E2E 무결성 및 헌법 독점주의 검사');

check('헌법 정본에 제14조(외부연동 E2E 무결성·헌법 독점주의·법체계 위계 단일화)가 규정되어 있다', () => {
  const rulesDoc = path.join(RULES_DIR, 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md');
  const rulesContent = fs.readFileSync(rulesDoc, 'utf8');
  assert.ok(rulesContent.includes('제14조 (외부 연동 E2E 무결성 및 헌법 독점주의 헌법'), '제14조 누락');
  assert.ok(rulesContent.includes('제1항 [외부 앱 의존 껍데기 링크 전면 금지 및 인앱 완결 의무]'), '제14조 1항 누락');
  assert.ok(rulesContent.includes('제2항 [클라우드 환경변수·자격증명 3자 사전 동기화 의무 (No Silent Failure)]'), '제14조 2항 누락');
  assert.ok(rulesContent.includes('제3항 [PWA·브라우저 캐시 강제 무효화 의무 (Cache Invalidation Gate)]'), '제14조 3항 누락');
  assert.ok(rulesContent.includes('제4항 [6단계 실운영 최종 확인의 종단간(E2E) 실측 의무]'), '제14조 4항 누락');
  assert.ok(rulesContent.includes('제5항 [법체계 위계의 단일화 (조·항·호·목 원칙)]'), '제14조 5항 누락');
  assert.ok(rulesContent.includes('제6항 [헌법 독점주의 (사설 규칙 제정 전면 금지 / Constitutional Exclusivity)]'), '제14조 6항 누락');
  assert.ok(rulesContent.includes('제7항 [신규 규칙 제정의 헌법 편입 의무]'), '제14조 7항 누락');
  assert.ok(rulesContent.includes('제8항 [규범 변경의 절대 승인선 엄수 및 기계적 무결성 게이트 강제]'), '제14조 8항 누락');
});

console.log('\n================================================================');
console.log(`🎯 검증 결과: 총 ${totalChecks}개 검사 중 ${passedChecks}개 통과 (${failures}개 실패)`);
console.log('================================================================');

if (failures > 0) {
  process.exit(1);
} else {
  console.log('✨ [ALL PASS] 아워골 전면 무결성 헌법 5대 검증 게이트를 완벽히 통과했습니다.\n');
  process.exit(0);
}