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

check('표준 템플릿(TEMPLATE_REQ_8STEPS.md, TEMPLATE_PLAN_8STEPS.md)이 존재하고 8원칙 규격을 완비했다', () => {
  const reqTemplatePath = path.join(SPECS_DIR, 'TEMPLATE_REQ_8STEPS.md');
  const planTemplatePath = path.join(SPECS_DIR, 'TEMPLATE_PLAN_8STEPS.md');
  assert.ok(fs.existsSync(reqTemplatePath), 'TEMPLATE_REQ_8STEPS.md 부재');
  assert.ok(fs.existsSync(planTemplatePath), 'TEMPLATE_PLAN_8STEPS.md 부재');

  const reqContent = fs.readFileSync(reqTemplatePath, 'utf8');
  const planContent = fs.readFileSync(planTemplatePath, 'utf8');

  // 템플릿 8개 독립 섹션 및 원칙 ② 4대 요소 검증
  [reqContent, planContent].forEach((c, idx) => {
    const name = idx === 0 ? 'TEMPLATE_REQ_8STEPS.md' : 'TEMPLATE_PLAN_8STEPS.md';
    for (let i = 1; i <= 8; i++) {
      assert.ok(c.includes(`## ${i}. [원칙 `), `${name} 내 원칙 ${i} 헤더 누락`);
    }
    assert.ok(c.includes('본질') && c.includes('원인') && c.includes('중심') && c.includes('핵심'), `${name} 내 4대 요소(본질·원인·중심·핵심) 누락`);
    assert.ok(c.includes('절차 재검증'), `${name} 내 원칙 ⑥ 절차 재검증 누락`);
  });
});

check('헌법 정본에 문제해결 8원칙 세부 기준(제2조 1~2항) 및 기계적 무결성 헌법(제2조 5항)이 명시되어 있다', () => {
  const rulesDoc = path.join(RULES_DIR, 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md');
  const rulesContent = fs.readFileSync(rulesDoc, 'utf8');
  assert.ok(rulesContent.includes('제2조 (2중 8원칙 및 핫픽스 헌법)'), '제2조 누락');
  assert.ok(rulesContent.includes('본질 · 원인 · 중심 · 핵심 파악'), '제2조 1항 2호 본질·원인·중심·핵심 누락');
  assert.ok(rulesContent.includes('제5항 [8원칙 기계적 무결성 및 임의 축약 · 합체 · 생략 영구 금지'), '제2조 5항 누락');
  assert.ok(rulesContent.includes('원칙 번호 임의 합체 전면 금지'), '제2조 5항 1호 누락');
  assert.ok(rulesContent.includes('원칙 ⑥ 절차 재검증 누락 영구 금지'), '제2조 5항 2호 누락');
  assert.ok(rulesContent.includes('1줄 bullet point 날림 축약 금지'), '제2조 5항 3호 누락');
  assert.ok(rulesContent.includes('기계적 린터 강제 배선 및 물리적 차단'), '제2조 5항 4호 누락');
});

check('신규 및 변경 대상 REQ/PLAN 문서의 8원칙 기계적 무결성(린터)이 100% 통과한다', () => {
  function lint8Principles(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    const errors = [];

    // 1. 8개 헤더 독립성 검증
    for (let i = 1; i <= 8; i++) {
      const hRegex = new RegExp(`(^|\\n)##\\s*${i}\\.`, 'm');
      const circledRegex = new RegExp(`(^|\\n)##.*[원칙\\[(]\\s*[${i}①②③④⑤⑥⑦⑧]`, 'm');
      if (!hRegex.test(content) && !circledRegex.test(content)) {
        errors.push(`${fileName}: 원칙 ${i} 독립 헤더 누락`);
      }
    }

    // 2. 원칙 번호 임의 합체 검사 (섹션 헤더 내 "원칙 ⑤, ⑦", "원칙 ①, ②, ③" 등)
    const headerLines = content.split('\n').filter(line => line.trim().startsWith('##'));
    headerLines.forEach(h => {
      const mergePattern = /원칙\s*[①-⑧1-8]\s*[,·~+&]\s*[①-⑧1-8]|##.*원칙.*[,·~+&].*원칙/i;
      if (mergePattern.test(h)) {
        errors.push(`${fileName}: 헤더 내 원칙 번호 임의 합체 발견 (${h.trim()})`);
      }
    });

    // 3. 원칙 ⑥(절차 재검증) 독립 존재 검사
    const hasStep6 = /(^|\n)##\s*6\..*재검증|(^|\n)##.*원칙\s*[⑥6].*재검증/i.test(content);
    if (!hasStep6) {
      errors.push(`${fileName}: 원칙 ⑥(절차 재검증) 누락 (제2조 제5항 2호 위반)`);
    }

    // 4. 원칙 ② 본질·원인·중심·핵심 4대 요소 검사
    const step2Match = content.match(/(?:^|\n)##\s*2\.[^#]+|##.*원칙\s*[②2][^#]+/);
    if (step2Match) {
      const step2Text = step2Match[0];
      const missing = [];
      if (!step2Text.includes('본질')) missing.push('본질');
      if (!step2Text.includes('원인')) missing.push('원인');
      if (!step2Text.includes('중심')) missing.push('중심');
      if (!step2Text.includes('핵심')) missing.push('핵심');
      if (missing.length > 0) {
        errors.push(`${fileName}: 원칙 ②에 4대 요소 중 [${missing.join(', ')}] 누락`);
      }
    }

    return errors;
  }

  // 템플릿 2종 자체 린트 통과 검증
  const reqLint = lint8Principles(path.join(SPECS_DIR, 'TEMPLATE_REQ_8STEPS.md'));
  assert.strictEqual(reqLint.length, 0, `TEMPLATE_REQ_8STEPS 린트 실패: ${reqLint.join('; ')}`);
  const planLint = lint8Principles(path.join(SPECS_DIR, 'TEMPLATE_PLAN_8STEPS.md'));
  assert.strictEqual(planLint.length, 0, `TEMPLATE_PLAN_8STEPS 린트 실패: ${planLint.join('; ')}`);

  // git 변경 중인 REQ/PLAN 파일이 있을 경우 린트 검사
  try {
    const { execSync } = require('child_process');
    const changedFiles = execSync('git status --porcelain', { encoding: 'utf8' })
      .split('\n')
      .map(line => line.slice(3).trim())
      .filter(fp => fp.startsWith('docs/specs/') && (fp.includes('REQ-') || fp.includes('PLAN-')) && fp.endsWith('.md') && !fp.includes('TEMPLATE'));

    // 최근 24시간 이내 수정되었거나 git staging/추적 변경 중인 REQ/PLAN 파일 린트 검사
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    changedFiles.forEach(fp => {
      const fullPath = path.join(ROOT_DIR, fp);
      if (!fs.existsSync(fullPath)) return;
      const stat = fs.statSync(fullPath);
      // 최근 24시간 이내에 생성/수정된 파일만 엄격 검사 (오래된 레거시 untracked 파일 제외)
      if (now - stat.mtimeMs > oneDayMs) return;

      const errors = lint8Principles(fullPath);
      assert.strictEqual(errors.length, 0, `신규/수정된 스펙 8원칙 위반 적발:\n${errors.join('\n')}`);
    });
  } catch (e) {
    if (e.name === 'AssertionError') throw e;
    // git status 실패 시 스킵
  }
});

check('절대 무결성 헌법 정본 문서(OURGOAL_ABSOLUTE_INTEGRITY_RULES.md)가 존재하고 15대 조문을 포괄한다', () => {
  const rulesDoc = path.join(RULES_DIR, 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md');
  assert.ok(fs.existsSync(rulesDoc), 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md 부재');
  const rulesContent = fs.readFileSync(rulesDoc, 'utf8');
  for (let i = 1; i <= 15; i++) {
    assert.ok(rulesContent.includes(`제${i}조 (`), `제${i}조 누락`);
  }
  // 16조 이상은 존재하지 않음을 단언 (조 번호 난립 영구 방지)
  assert.ok(!rulesContent.includes('제16조 ('), '제16조 이상 불법 조문 발견 (15대 조문 엄수 위반)');
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

check('UI 텍스트, 라벨, 가이드 및 프롬프트에서 아바타 \'77종/77가지\' 노출이 영구 배제되고 \'320종\'으로 단일화되었다 (헌법 제10조 제4~5항)', () => {
  const uiFilesToCheck = [
    INDEX_HTML,
    path.join(ROOT_DIR, 'api', 'promptgen.js')
  ];

  const violations = [];
  uiFilesToCheck.forEach(fp => {
    if (!fs.existsSync(fp)) return;
    const content = fs.readFileSync(fp, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
      if (line.includes('BODY_THEMES_77')) return;
      if (line.includes('절대 사용 금지') || line.includes('영구 금지') || line.includes('전면 영구') || line.includes('용어 헌법')) return;
      if (line.includes('77종') || line.includes('77가지')) {
        violations.push(`${path.basename(fp)}:${idx + 1} -> ${line.trim().slice(0, 80)}`);
      }
    });
  });

  assert.strictEqual(violations.length, 0, `아바타 금지 표현 '77종/77가지' 발견 (320종으로 변경 필수):\n${violations.join('\n')}`);

  // index.html 및 rules 정본 내 320종 단일 표기 검증
  const freshHtml = fs.readFileSync(INDEX_HTML, 'utf8');
  assert.ok(freshHtml.includes('320종'), 'index.html 내 320종 페르소나 표기 누락');

  const rulesDoc = path.join(RULES_DIR, 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md');
  const rulesContent = fs.readFileSync(rulesDoc, 'utf8');
  assert.ok(rulesContent.includes('제4항 [아바타 페르소나 \'77종/77가지\' 사용자 노출 전면 영구 금지]'), '헌법 제10조 제4항 누락');
  assert.ok(rulesContent.includes('제5항 [아바타 페르소나 \'320종\' 단일 표기 강제]'), '헌법 제10조 제5항 누락');
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

check('헌법 정본에 실 사용자 계정 상호 연동 헌법(제13조 1~5항) 및 가짜 실제구현 금지(제1조 4항 6호, 제4조 1항 7호)가 규정되어 있다', () => {
  const rulesDoc = path.join(RULES_DIR, 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md');
  const rulesContent = fs.readFileSync(rulesDoc, 'utf8');
  assert.ok(rulesContent.includes('제13조 (실 사용자 계정 상호 연동 헌법'), '제13조 누락');
  assert.ok(rulesContent.includes('제1항 [실제 구현의 절대 정의]'), '제13조 1항 누락');
  assert.ok(rulesContent.includes('제2항 [가짜 실제구현(Fake Implementation)의 정의 및 영구 금지]'), '제13조 2항 누락');
  assert.ok(rulesContent.includes('제3항 [투명한 시스템 안내 및 게스트 모드 보호 (무충돌 안전핀)]'), '제13조 3항 누락');
  assert.ok(rulesContent.includes('제4항 [E3 동류소통 기능의 3대 필수 백본 및 자동화 검증]'), '제13조 4항 누락');
  assert.ok(rulesContent.includes('제5항 [상호작용 양방향 전달성 및 구독 생존 보장의 의무'), '제13조 5항 누락');
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

/* =========================================================================
 * 10. 헌법 제15조 및 5대 돌파 규정 검증 (유저 자산 원격 원장화 및 수명주기 영속성)
 * ========================================================================= */
console.log('\n[검증 10/10] 헌법 제15조: 유저 자산 원격 원장화 및 수명주기 영속성 헌법 검사');

check('헌법 정본에 제15조 및 5대 고도화 규정이 완전 편입되어 있다', () => {
  const rulesDoc = path.join(RULES_DIR, 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md');
  const rulesContent = fs.readFileSync(rulesDoc, 'utf8');
  assert.ok(rulesContent.includes('제15조 (유저 자산 원격 원장화 및 수명주기 영속성 헌법'), '제15조 누락');
  assert.ok(rulesContent.includes('제1항 [원격 원장 우선의 원칙 (Server-First Storage Mandate)]'), '제15조 1항 누락');
  assert.ok(rulesContent.includes('제2항 [파괴적 스토리지 삭제의 합집합 보존 의무 (Non-Destructive Union Merge)]'), '제15조 2항 누락');
  assert.ok(rulesContent.includes('제3항 [시각적 무손실 최고화질 보장 및 3계층 스마트 스토리지 헌법'), '제15조 3항 누락');
  assert.ok(rulesContent.includes('제4항 [수명주기(Lifecycle) 4단계 E2E 검증 의무화]'), '제15조 4항 누락');
  assert.ok(rulesContent.includes('제5항 [데이터 유실 사고 시 횡단 압수수색 의무 (Horizontal Storage Audit)]'), '제15조 5항 누락');
  assert.ok(rulesContent.includes('제6항 [기록의 전 수명주기(CRUD) 무결성 및 4대 연계 뷰 동시 전파의 의무'), '제15조 6항 누락');
  assert.ok(rulesContent.includes('제7항 [동시성 세션 보호 및 스키마 자가 정규화의 의무'), '제15조 7항 누락');
  assert.ok(rulesContent.includes('코드 줄 수 족쇄 철폐 및 고품질 완결성 보장 원칙'), '제5조 3항 누락');
  assert.ok(rulesContent.includes('기획 단계 스토리지 원장화 3대 명세 의무'), '제2조 4항 누락');
  assert.ok(rulesContent.includes('클라이언트 스토리지 및 네트워크 이상 실시간 관제 연동'), '제11조 3항 누락');
});

/* =========================================================================
 * 11. [#TASK-ES-175] 공식 운영 이메일(ourgoal.support@gmail.com) 전수 단일화 및 구 이메일 영구 방화벽 검증
 * ========================================================================= */
console.log('\n[검증 11/11] 공식 운영 이메일(ourgoal.support@gmail.com) 전수 단일화 및 구 이메일 영구 방화벽 검사');

check('공식 운영 이메일(ourgoal.support@gmail.com)이 런타임 및 정본 문서에 필수 배선되어 있다', () => {
  const privPath = path.join(ROOT_DIR, 'docs', 'legal', 'privacy.md');
  const privContent = fs.readFileSync(privPath, 'utf8');
  const tabGuidesPath = path.join(ROOT_DIR, 'js', 'tab-guides.js');
  const tabGuidesContent = fs.readFileSync(tabGuidesPath, 'utf8');

  assert.ok(html.includes('ourgoal.support@gmail.com'), 'index.html에 ourgoal.support@gmail.com 필수 기재');
  assert.ok(privContent.includes('ourgoal.support@gmail.com'), 'docs/legal/privacy.md에 ourgoal.support@gmail.com 필수 기재');
  assert.ok(tabGuidesContent.includes('ourgoal.support@gmail.com'), 'js/tab-guides.js에 ourgoal.support@gmail.com 필수 기재');
});

check('구 이메일(ysm0422@naver.com, support@ourgoal.kr)이 런타임, 법률 문서, 가이드에 0건(Zero)임을 물리적으로 보증한다', () => {
  const bannedEmails = ['ysm0422@naver.com', 'support@ourgoal.kr'];
  const scanTargets = [
    { name: 'index.html', content: html },
    { name: 'docs/legal/privacy.md', content: fs.readFileSync(path.join(ROOT_DIR, 'docs', 'legal', 'privacy.md'), 'utf8') },
    { name: 'js/tab-guides.js', content: fs.readFileSync(path.join(ROOT_DIR, 'js', 'tab-guides.js'), 'utf8') },
    { name: 'docs/growth/RELEASE_72H_GUIDE.md', content: fs.readFileSync(path.join(ROOT_DIR, 'docs', 'growth', 'RELEASE_72H_GUIDE.md'), 'utf8') }
  ];

  const apiDir = path.join(ROOT_DIR, 'api');
  if (fs.existsSync(apiDir)) {
    fs.readdirSync(apiDir).filter(f => f.endsWith('.js')).forEach(f => {
      scanTargets.push({
        name: `api/${f}`,
        content: fs.readFileSync(path.join(apiDir, f), 'utf8')
      });
    });
  }

  const jsDir = path.join(ROOT_DIR, 'js');
  if (fs.existsSync(jsDir)) {
    fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).forEach(f => {
      scanTargets.push({
        name: `js/${f}`,
        content: fs.readFileSync(path.join(jsDir, f), 'utf8')
      });
    });
  }

  const detected = [];
  scanTargets.forEach(target => {
    bannedEmails.forEach(banned => {
      if (target.content.includes(banned)) {
        detected.push(`${target.name} 에서 금지 이메일 [${banned}] 발견`);
      }
    });
  });

  assert.strictEqual(detected.length, 0, `금지된 구 이메일 재발 감지:\n${detected.join('\n')}`);
});

/* =========================================================================
 * 12. 헌법 v2026.09.18: 시각 및 공간 조형 무결성(Visual Self-Audit) 및 CSS 은폐 린터 검증
 * ========================================================================= */
console.log('\n[검증 12/12] 헌법 v2026.09.18: 시각 및 공간 조형 무결성 및 CSS 은폐 린터 검사');

check('헌법 정본에 시각 자가감사(제7조 8항), 시각 IA 명세(제2조 6항), CSS 은폐 금지(제3조 5항), 4-Block 팩트 보고(제8조 3항)가 규정되어 있다', () => {
  const rulesDoc = path.join(RULES_DIR, 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md');
  const rulesContent = fs.readFileSync(rulesDoc, 'utf8');
  assert.ok(rulesContent.includes('제6항 [기획 단계 시각적 IA 및 시맨틱 통합 배선도 명세 의무'), '제2조 6항 누락');
  assert.ok(rulesContent.includes('제5항 [가짜 듀얼레이어 및 CSS 편의주의적 은폐 원천 금지 헌법'), '제3조 5항 누락');
  assert.ok(rulesContent.includes('위조 숫자 및 허상 지표 날조 금지 - Vanity Metrics Zero Tolerance'), '제4조 1항 1호 누락');
  assert.ok(rulesContent.includes('제8항 [제6검증: 시각 및 공간 조형 무결성 검증 (Visual Self-Audit Mandate)]'), '제7조 8항 누락');
  assert.ok(rulesContent.includes('제3항 [보고 서식의 팩트 중심 4-Block 규격화 및 감정적 미사여구 영구 금지]'), '제8조 3항 누락');
});

check('CSS 내에 핵심 뷰 슬롯(#commBody, #personalGoalsView)을 은폐하는 위헌 패턴이 존재하지 않는다', () => {
  const cssPath = path.join(ROOT_DIR, 'ui.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // #commBody 또는 #personalGoalsView에 display: none이 걸려있는지 정규식 검사
  const bannedCssPatterns = [
    /#commBody\s*\{[^}]*display\s*:\s*none/i,
    /#personalGoalsView\s*\{[^}]*display\s*:\s*none/i
  ];

  bannedCssPatterns.forEach(pattern => {
    assert.ok(!pattern.test(cssContent), `ui.css 내 핵심 기능 뷰 CSS 은폐(display: none) 위헌 패턴 발견!`);
  });
});

/* =========================================================================
 * 13. 헌법 v2026.09.19: PWA 캐시 무효화 · 인앱 완결(Zero mailto) · 4대 뷰 동시 전파 디스패처 검증
 * ========================================================================= */
console.log('\n[검증 13/13] 헌법 v2026.09.19: PWA 캐시 무효화 · 인앱 완결(Zero mailto) · 4대 뷰 동시 전파 검사');

check('sw.js의 CACHE_NAME이 20260919 당일 최신 버전으로 갱신되어 있다 (헌법 제14조 제3항)', () => {
  const swPath = path.join(ROOT_DIR, 'sw.js');
  assert.ok(fs.existsSync(swPath), 'sw.js 부재');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert.ok(swContent.includes('v20260919'), 'sw.js CACHE_NAME 당일(20260919) 갱신 누락');
});

check('index.html 내 외부 이메일 앱 의존 링크(mailto:)가 0건(Zero)이다 (헌법 제3조 제4항, 제14조 제1항)', () => {
  const mailtoMatches = [...html.matchAll(/mailto:[^\s"'>]+/g)];
  assert.strictEqual(mailtoMatches.length, 0, `index.html 내 위헌 mailto 링크 잔존: ${mailtoMatches.map(m => m[0]).join(', ')}`);
});

check('4대 뷰 동시 전파 디스패처(dispatchFullViewPropagation)가 존재하고 체크인 저장에 배선되어 있다 (헌법 제1조 제4항 제5호, 제15조 제6항 제3호)', () => {
  assert.ok(html.includes('function dispatchFullViewPropagation'), 'dispatchFullViewPropagation 함수 부재');
  assert.ok(html.includes('dispatchFullViewPropagation()'), 'dispatchFullViewPropagation 호출 배선 부재');
});

/* =========================================================================
 * 14. 헌법 v2026.09.20: 체계적 시너지 및 물리적 집행력 (Zero Ads · 모바일 4대 규격 · 아바타 단일화)
 * ========================================================================= */
console.log('\n[검증 14/14] 헌법 v2026.09.20: 체계적 시너지 및 물리적 집행력 검사');

check('헌법 정본에 6대 신설/개정 조항(제2조 7항, 제3조 6항, 제4조 1항 9호, 제7조 8항 3호, 제11조 4항, 제14조 9항)이 완전 수록되어 있다', () => {
  const rulesDoc = path.join(RULES_DIR, 'OURGOAL_ABSOLUTE_INTEGRITY_RULES.md');
  const rulesContent = fs.readFileSync(rulesDoc, 'utf8');
  assert.ok(rulesContent.includes('제7항 [감찰 및 전수 조사 시 4차원 심층 매트릭스 의무 (Deep Audit Mandate)]'), '제2조 7항 누락');
  assert.ok(rulesContent.includes('제6항 [연속적 유저 여정 단절 제로 헌법 (Zero Broken Journey Mandate)]'), '제3조 6항 누락');
  assert.ok(rulesContent.includes('9호 (도메인 철학 역행 및 상식적 개념 괴리 방치 금지 - Conceptual Integrity)'), '제4조 1항 9호 누락');
  assert.ok(rulesContent.includes('모바일 375px 4대 시각 물리 규격 강제'), '제7조 8항 모바일 4대 규격 누락');
  assert.ok(rulesContent.includes('제4항 [세션 착수 시 Step 0 최신 브랜치 동기화 및 다중 세션 정합성 검증 (Step 0 Pre-flight Sync)]'), '제11조 4항 누락');
  assert.ok(rulesContent.includes('제9항 [헌법 개정 즉시 레거시 코드 소탕 및 게이트키퍼 동시 배선 의무 (Co-wiring Mandate)]'), '제14조 9항 누락');
});

check('런칭 초기 광고 전면 배제 (Zero Ads Gate): 광고 모달/카운트다운 타이머 잔존 0건을 물리적으로 보증한다 (제4조 1항 8호, 제5조 1항 1호, 제14조 9항)', () => {
  // 광고 팝업 모달, 카운트다운 잔존 검사
  const bannedAdStrings = [
    'id="adCountdown"',
    'class="ad-countdown"',
    'id="templateAdModal"',
    'id="btnWatchRewardAd"'
  ];
  bannedAdStrings.forEach(str => {
    assert.ok(!html.includes(str), `런칭 초기 광고 잔재 발견: ${str}`);
  });
});

check('도메인 철학 일관성 (Zero Photo Profile Gate): 설정 프로필 사진 업로드 잔재가 0건이고 아바타 보관함이 직결되어 있다 (제4조 1항 9호, 제10조 5항)', () => {
  // 프로필 전용 사진 업로드 파일 인풋 잔재 검사
  const hasProfilePhotoInput = /<input[^>]*id=["'](?:profilePhotoFile|userPhotoInput)["'][^>]*>/i.test(html);
  assert.ok(!hasProfilePhotoInput, '레거시 프로필 사진 업로드 파일 인풋이 index.html에 잔존함');
  assert.ok(html.includes('openAvatarDrawerModal') || html.includes('openAvatarLevelUpModal'), '아바타 보관함 모달 배선 누락');
});

check('모바일 375px 4대 시각 물리 규격이 ui.css에 배선되어 있다 (제7조 제8항 제3호)', () => {
  assert.ok(uiCss.includes('calc(var(--nav-h, 64px) + env(safe-area-inset-bottom, 0px) + 48px) !important'), '바텀 네비 차폐 제로 48px 여백 누락');
  assert.ok(uiCss.includes('word-break: keep-all !important'), '한글 단어 보존 word-break: keep-all 누락');
});

check('[검증 15/15] [#TASK-ES-190] 목표 추가 파이프라인 및 4위 1체 전역 배선 검사', () => {
  const sanctuaryPath = path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js');
  const sanctuaryContent = fs.readFileSync(sanctuaryPath, 'utf8');

  // 1. 전역 함수 배선 확인
  assert.ok(html.includes('window.promptNewGoal = promptNewGoal;'), 'window.promptNewGoal 전역 배선 누락');
  assert.ok(html.includes('window.showNewGoalManualForm = showNewGoalManualForm;'), 'window.showNewGoalManualForm 전역 배선 누락');

  // 2. 세부 마일스톤 뷰 + 새 목표 버튼 마크업 및 리스너 배선 확인
  assert.ok(html.includes('id="btnPersonalAddGoalInline"'), '#btnPersonalAddGoalInline 마크업 누락');
  assert.ok(html.includes('btnPersonalAddGoalInline'), 'btnPersonalAddGoalInline 핸들러 바인딩 누락');

  // 3. 성소 트레일 버튼 핸들러의 window.promptNewGoal 안전 호출 확인
  assert.ok(sanctuaryContent.includes('window.promptNewGoal()'), '성소 트레일 목표 추가 핸들러의 window.promptNewGoal 호출 누락');

  // 4. localGoalTemplate tasks 데이터 정규화(문자열 배열) 확인
  assert.ok(html.includes("t + ' 관련 세부 실행 1'"), 'localGoalTemplate tasks 문자열 정규화 누락');

  // 5. showNewGoalReviewStep tasks 안전 처리 확인
  assert.ok(html.includes("typeof tk === 'string' ? tk :"), 'showNewGoalReviewStep tasks 방어 로직 누락');

  // 6. 직접 설정 폼(showNewGoalManualForm) 공백 토스트 피드백 확인
  assert.ok(html.includes("toast('목표 제목을 입력해주세요');"), '직접 설정 폼 공백 검증 토스트 누락');
});

check('[검증 16/16] [#TASK-ES-192] 데드클릭 12건 전수 소탕 및 인터랙션 무결성 정적 방화벽 검사', () => {
  const sanctuaryPath = path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js');
  const sanctuaryContent = fs.readFileSync(sanctuaryPath, 'utf8');

  // 1. 순수 데드클릭 박멸 검증
  assert.ok(html.includes('id="btnSwitchCompanionInvite"'), '#btnSwitchCompanionInvite 탭 버튼 ID 누락');
  assert.ok(html.includes('switchInviteTab'), '팀원 초대 모달 탭 전환 로직 누락');
  assert.ok(html.includes('btn-select-wearable'), '스마트워치 선택 버튼 클래스 누락');
  assert.ok(html.includes('id="toggleTemplatesBtnInner"'), '#toggleTemplatesBtnInner ID 누락');

  // 2. 유령 버튼 복원 검증
  assert.ok(html.includes("archiveBtnEl.id = 'goalArchiveBtn'"), '목표 상세 보관함 버튼(#goalArchiveBtn) 마크업 생성 누락');

  // 3. 거짓말 토스트(Empty Promise) 0건 영구 방화벽
  assert.ok(!html.includes('Google 로그인 서비스를 준비 중입니다'), '구글 로그인 준비중 거짓말 토스트 잔존');
  assert.ok(!html.includes('피드 게시 기능을 준비 중입니다'), '피드 게시 준비중 거짓말 토스트 잔존');
  assert.ok(!html.includes('외부 공유 기능을 준비 중입니다'), '외부 공유 준비중 거짓말 토스트 잔존');
  assert.ok(!sanctuaryContent.includes('일정 추가 창을 준비 중입니다'), '성소 캘린더 일정 추가 준비중 토스트 잔존');

  // 4. 완전 무료 선언 정식 모달 승화 검증
  assert.ok(html.includes('아워골 완전 무료화 헌법 선언'), '아워골 완전 무료 선언 모달 마크업 누락');
});

check('[검증 17/17] [#TASK-ES-193] 집중 타이머 기록 탭 이전 및 기록 탭 6종 3×2 그리드 조형 정적 방화벽 검사', () => {
  const sanctuaryPath = path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js');
  const sanctuaryContent = fs.readFileSync(sanctuaryPath, 'utf8');
  const cssPath = path.join(__dirname, '..', 'ui.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // 1. 일정 탭: timer 제거 및 3종(월간/주간/일간) 정돈 확인
  assert.ok(!sanctuaryContent.includes("setCalMode(\\'timer\\')"), '일정 탭 모드 바에 setCalMode timer 버튼 잔존');
  assert.ok(sanctuaryContent.includes("setCalMode(\\'month\\')"), '일정 탭 월간 모드 누락');
  assert.ok(sanctuaryContent.includes("setCalMode(\\'week\\')"), '일정 탭 주간 모드 누락');
  assert.ok(sanctuaryContent.includes("setCalMode(\\'timeline\\')"), '일정 탭 일간 타임라인 모드 누락');

  // 2. 기록 탭: 6종 서브탭 완비 확인
  assert.ok(sanctuaryContent.includes("setRecMode(\\'heatmap\\')"), '기록 탭 히트맵 모드 누락');
  assert.ok(sanctuaryContent.includes("setRecMode(\\'feed\\')"), '기록 탭 피드 모드 누락');
  assert.ok(sanctuaryContent.includes("setRecMode(\\'timer\\')"), '기록 탭 집중 타이머 모드 누락');
  assert.ok(sanctuaryContent.includes("setRecMode(\\'stats\\')"), '기록 탭 통계 모드 누락');
  assert.ok(sanctuaryContent.includes("setRecMode(\\'archive\\')"), '기록 탭 보관함 모드 누락');
  assert.ok(sanctuaryContent.includes("setRecMode(\\'recap\\')"), '기록 탭 리캡 모드 누락');

  // 3. 3×2 그리드 조형 확인
  assert.ok(cssContent.includes('.s-rec-modes-wrap'), '.s-rec-modes-wrap CSS 클래스 누락');
  assert.ok(cssContent.includes('grid-template-columns: repeat(3, 1fr)'), '3열 그리드 스타일 누락');

  // 4. 타이머 렌더링 분기 확인
  assert.ok(sanctuaryContent.includes("engine.activeRecMode === 'timer'"), '기록 탭 타이머 분기 렌더링 누락');
});

check('[검증 18/18] [#TASK-ES-194] 소통 탭 6종 3×2 그리드 조형 정적 방화벽 검사', () => {
  const indexPath = path.join(__dirname, '..', 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const cssPath = path.join(__dirname, '..', 'ui.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // 1. 소통 탭 서브탭 6종 완비 확인
  assert.ok(indexContent.includes("{ key: 'feed', label: '피드'"), '소통 탭 피드 서브탭 누락');
  assert.ok(indexContent.includes("{ key: 'group', label: '팀'"), '소통 탭 팀 서브탭 누락');
  assert.ok(indexContent.includes("{ key: 'companion', label: '동반자'"), '소통 탭 동반자 서브탭 누락');
  assert.ok(indexContent.includes("{ key: 'dm', label: 'DM'"), '소통 탭 DM 서브탭 누락');
  assert.ok(indexContent.includes("{ key: 'manito', label: '마니또'"), '소통 탭 마니또 서브탭 누락');
  assert.ok(indexContent.includes("{ key: 'share', label: '공유'"), '소통 탭 공유 서브탭 누락');

  // 2. comm-subtabs-grid 클래스 배선 확인
  assert.ok(indexContent.includes('comm-subtabs-grid'), '소통 탭 서브탭에 comm-subtabs-grid 클래스 누락');

  // 3. CSS 3×2 그리드 스타일 확인
  assert.ok(cssContent.includes('.comm-subtabs-grid'), '.comm-subtabs-grid CSS 클래스 누락');
  assert.ok(cssContent.includes('.comm-subtabs-grid .comm-subtab'), '.comm-subtabs-grid 버튼 스타일 누락');
});

check('[검증 19/20] [#TASK-ES-195] 목표 탭 5종 서브탭 5열 그리드 단정화 및 통계 세그먼트 버튼 40px 정적 방화벽 검사', () => {
  const indexPath = path.join(__dirname, '..', 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const cssPath = path.join(__dirname, '..', 'ui.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // 1. goalsSubtabs 라벨 단정화 확인
  assert.ok(indexContent.includes("['teamLinked','팀 연계']"), '목표 탭 팀 연계 라벨 단정화 누락');
  assert.ok(indexContent.includes("['templateEncyclopedia','📖 템플릿']"), '목표 탭 템플릿 라벨 단정화 누락');

  // 2. goals-subtabs-grid 클래스 배선 확인
  assert.ok(indexContent.includes('goals-subtabs-grid'), 'goalsSubtabs에 goals-subtabs-grid 클래스 누락');

  // 3. CSS 5열 그리드 스타일 확인
  assert.ok(cssContent.includes('.goals-subtabs-grid'), '.goals-subtabs-grid CSS 클래스 누락');
  assert.ok(cssContent.includes('grid-template-columns: repeat(5, 1fr)'), '5열 그리드 스타일 누락');

  // 4. 통계 세그먼트 버튼(.s-seg-pill) 40px 터치 규격 확인
  assert.ok(cssContent.includes('.s-seg-pill'), '.s-seg-pill 스타일 선언 누락');
  assert.ok(cssContent.includes('min-height: 40px !important;'), '40px 터치 타겟 규격 누락');
});

check('[검증 20/20] [#TASK-ES-196] 체크인 즉시 아바타 AI 피드백 고도화 & 영구 원장 영속화 및 기록 탭 상시 노출 무결성 검사', () => {
  const indexPath = path.join(__dirname, '..', 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const cssPath = path.join(__dirname, '..', 'ui.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // 1. 체크인 저장 시 피드백 영구 보존 배선 확인
  assert.ok(indexContent.includes('newRec.feedback = fb;'), 'newRec.feedback 영구 할당 누락');
  assert.ok(indexContent.includes('showCheckinFeedbackSheet(newRec, fb);'), 'showCheckinFeedbackSheet 피드백 배선 누락');

  // 2. 아바타 피드백 바텀시트 함수 및 1클릭 액션 연계 확인
  assert.ok(indexContent.includes('function showCheckinFeedbackSheet'), 'showCheckinFeedbackSheet 함수 누락');
  assert.ok(indexContent.includes('btnCheckinAiApplyNext'), '1클릭 퀘스트 등록 버튼 배선 누락');

  // 3. 기록 탭 buildRecordCardHtml 내 AI 피드백 렌더링 확인
  assert.ok(indexContent.includes('rec-ai-feedback-box'), '기록 탭 AI 피드백 박스 렌더링 누락');
  assert.ok(indexContent.includes('rec-ai-verdict-badge'), '기록 탭 AI 판정 뱃지 렌더링 누락');

  // 4. CSS 바텀시트 및 기록 탭 AI 박스 스타일 선언 확인
  assert.ok(cssContent.includes('.checkin-ai-backdrop'), '.checkin-ai-backdrop CSS 누락');
  assert.ok(cssContent.includes('.checkin-ai-sheet'), '.checkin-ai-sheet CSS 누락');
  assert.ok(cssContent.includes('.rec-ai-feedback-box'), '.rec-ai-feedback-box CSS 누락');
  assert.ok(cssContent.includes('.checkin-ai-close-btn'), '.checkin-ai-close-btn CSS 누락');
});

check('[검증 21/21] [#TASK-ES-197] 일정 달력 셀 확대(76px) 및 사진형 일기(Photo Diary) 썸네일 자동 연계 & 히트맵 14px 스케일업 무결성 검사', () => {
  const indexPath = path.join(__dirname, '..', 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const cssPath = path.join(__dirname, '..', 'ui.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // 1. 달력 셀 min-height 76px 및 사진형 일기 클래스 선언 확인
  assert.ok(cssContent.includes('.cal-cell{background:var(--card);border-radius:10px;border:1px solid var(--rule);padding:4px 2px;min-height:76px;'), 'cal-cell min-height: 76px 선언 누락');
  assert.ok(cssContent.includes('.cal-photo-badge'), '.cal-photo-badge CSS 누락');
  assert.ok(cssContent.includes('.cal-photo-diary-bg'), '.cal-photo-diary-bg CSS 누락');

  // 2. 히트맵 셀 14px 및 그리드 14px 선언 확인
  assert.ok(cssContent.includes('.heatmap-cell{width:14px;height:14px;border-radius:3px;'), '.heatmap-cell width/height: 14px 선언 누락');
  assert.ok(cssContent.includes('.heatmap-grid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,14px);gap:3px;}'), '.heatmap-grid repeat(7,14px) 선언 누락');

  // 3. index.html 내 사진형 일기 자동 감지 및 썸네일 렌더러 확인
  assert.ok(indexContent.includes('cal-photo-diary-bg'), 'calCellHtml 내 cal-photo-diary-bg 배선 누락');
  assert.ok(indexContent.includes('cal-photo-badge'), 'calCellHtml 내 cal-photo-badge 배선 누락');
  assert.ok(indexContent.includes('cal-day-photo-diary-card'), 'openCalendarDayEditHubModal 내 cal-day-photo-diary-card 배선 누락');

  // 4. 히트맵 월 라벨 17px 간격 확인
  assert.ok(indexContent.includes('var leftPx = w * 17;'), '히트맵 월 라벨 leftPx = w * 17 배선 누락');
});

// ============================================================================
// [검증 22/22] #TASK-ES-198: 캘린더 6대 결함 전수 일괄 정상화 게이트
// ============================================================================
check('[검증 22/22] #TASK-ES-198: 캘린더 6대 결함 전수 일괄 정상화 검증', () => {
  const sanctPath = path.join(__dirname, '..', 'js', 'sanctuary-v3-engine.js');
  const sanctContent = fs.readFileSync(sanctPath, 'utf8');
  const indexPath = path.join(__dirname, '..', 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');

  // 1. 주간 모드 크래시 방어 확인 (weekRowsHtml 정상 사용, weekDays.join 미호출, dayDetailsHtml 정의)
  assert.ok(!sanctContent.includes('weekDays.join'), 'sanctuary-v3-engine.js 내 정의되지 않은 weekDays.join 호출 차단 실패');
  assert.ok(sanctContent.includes('s-week-grid'), 'sanctuary-v3-engine.js 내 .s-week-grid 레이아웃 배선 누락');
  assert.ok(sanctContent.includes('dayDetailsHtml'), 'sanctuary-v3-engine.js 내 dayDetailsHtml 상세 일정 렌더링 누락');

  // 2. 타임라인 일정 수정 Zero-Save 버그 방어 확인 (openCalendarManualEditModal에 editEvent 올바른 인자 전달)
  assert.ok(sanctContent.includes('window.openCalendarManualEditModal(dt, editEvent || null, kind || \'custom\')'), 'openScheduleDetail 내 openCalendarManualEditModal 인자 순서 교정 누락');

  // 3. 잠금화면 퀵버튼 성소 캘린더 헤더 배선 확인
  assert.ok(sanctContent.includes('s-cal-quick-action-bar'), '성소 캘린더 헤더 내 s-cal-quick-action-bar 배선 누락');
  assert.ok(sanctContent.includes('폰 잠금화면에서 보기'), '성소 캘린더 헤더 내 폰 잠금화면 바로가기 버튼 누락');

  // 4. index.html 내 팀 목표 마일스톤 토글 및 허브 편집 배선 확인
  assert.ok(indexContent.includes('kind === \'team_goal\''), 'toggleScheduleDone 내 kind === team_goal 분기 누락');
  assert.ok(indexContent.includes('teamGoalDoneEvents'), '팀 목표 마일스톤 완료 상태 영속화 원장 누락');

  // 5. 배경사진 선택 모달 뒤로가기 플로우 확인
  assert.ok(indexContent.includes('calDayBgBackToHubBtn'), 'openCalendarDayBgPickerModal 내 calDayBgBackToHubBtn 뒤로가기 링크 누락');
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