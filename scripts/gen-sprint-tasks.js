#!/usr/bin/env node
/*
 * 노션 CSV(ourgoal_tasks_notion.csv) → docs/sprint/TASK-XX.md 생성기.
 * 실행: node scripts/gen-sprint-tasks.js <csv 경로>
 * 태스크별 의존성·겹침·사용자 필요 작업 메타는 아래 META에 유지한다(노션에는 없는 정보).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const csvPath = process.argv[2];
if (!csvPath) { console.error('사용법: node scripts/gen-sprint-tasks.js <csv 경로>'); process.exit(1); }
const text = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');

function parseCsv(s) {
  const rows = []; let row = []; let field = ''; let q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else { q = false; } }
      else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(field); field = ''; if (row.some(v => v !== '')) rows.push(row); row = []; }
      else field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); if (row.some(v => v !== '')) rows.push(row); }
  return rows;
}

const META = {
  '01': {
    deps: '없음',
    overlap: [
      'index.html 상단에 supabase-js와 Google GSI(`accounts.google.com/gsi/client`) 스크립트가 이미 로드됨. GSI는 구글 캘린더 연동(gcalSync) 용도이므로 로그인 구현과 섞이지 않게 분리한다.',
      'PR #32(일정 탭 + gcalSync 통합)가 열려 있음. 같은 구글 OAuth 영역을 다루므로 병합 여부를 먼저 확인한다.',
      '기존 이메일/비밀번호 인증과 boot() 세션 복원 로직(dev_log 2026-09-03 17:05)은 유지한 채 위에 얹는다.'
    ],
    userTodo: [
      'Supabase 대시보드 > Authentication > Providers에서 Kakao, Google 활성화',
      'Kakao Developers: 앱 생성, REST API 키·Client Secret 발급, Redirect URI에 Supabase 콜백 URL(`https://<project>.supabase.co/auth/v1/callback`) 등록, 동의항목(닉네임·프로필 사진·이메일) 설정',
      'Google Cloud Console: OAuth 클라이언트 ID·Secret 발급, 승인된 리디렉션 URI에 Supabase 콜백 URL 등록',
      'Supabase > Authentication > URL Configuration: Site URL과 Redirect URLs에 `https://ourgoal-app.vercel.app`와 Vercel 프리뷰 도메인 추가',
      '키·시크릿은 Supabase 콘솔에만 입력한다. 코드에는 provider 이름만 들어간다.'
    ]
  },
  '02': {
    deps: 'TASK-01 (Pro 상태를 로그인 유저의 프로필 settings에 저장하므로 소셜 로그인 유입 이후 흐름과 맞물림)',
    overlap: [
      'BACKLOG "다크패턴 금지" 원칙: 페이월 문구는 불안 조장형 FOMO를 쓰지 않는다.',
      '맞춤 피드백 봇 설정 화면, 기간별 리포트(7일/30일 토글), 목표 생성 흐름은 이미 존재한다. 트리거만 끼워 넣고 화면 자체는 바꾸지 않는다.'
    ],
    userTodo: [
      '토스페이먼츠 개발자센터 가맹점(테스트) 등록 후 **테스트 클라이언트 키** 발급. 이번 태스크는 테스트 키 + "가상 성공 처리"까지만 구현한다.',
      '실결제 승인·빌링키 발급은 서버 시크릿 키가 필요하므로 클라이언트에 넣지 않는다. 필요 시 `api/` 서버리스 함수로 후속 태스크 분리.',
      '정기결제(빌링) 상품은 토스 심사·계약이 별도로 필요하다. 심사 진행 여부 결정.'
    ]
  },
  '03': {
    deps: '없음',
    overlap: [
      '#captureCardBox(기록 입력 카드)는 기록 안내 문구·카테고리 선택 필드가 이미 있는 영역이다. 레이아웃 변경 없이 마이크 버튼과 칩 행만 추가한다.',
      '기존 체크인 저장 함수와 축하 애니메이션(1단계 즉각 보상)을 그대로 재사용한다.'
    ],
    userTodo: [
      '없음 (브라우저 내장 API). 단, iOS Safari·Firefox 등 미지원 브라우저 예외 처리를 검증 기준에 포함한다.'
    ]
  },
  '04': {
    deps: '없음 (TASK-01 이후 권장: 실제 유저 식별이 있어야 댓글 작성자 표시가 의미 있음)',
    overlap: [
      'PR #31(팀 목표/마일스톤 댓글 기능 추가)이 열려 있음. 이 PR이 "로컬 mock 댓글"의 최신 구현이므로 병합 후 그 코드를 Supabase로 전환하는 것이 순서다. 착수 전 반드시 확인.',
      'PR #35(피드 게시물의 시간 기반 가짜 응원 수 제거)도 피드 응원 카운트를 건드린다.',
      'BACKLOG 5단계 "원터치 응원 리액션", "반응·응원 알림" 항목과 같은 영역.'
    ],
    userTodo: [
      'Supabase SQL Editor에서 `team_comments`, `feed_posts` 테이블 생성 + RLS 정책 실행 (SQL은 구현 시 PR 본문에 첨부)',
      'Supabase > Database > Replication(Publications)에서 두 테이블의 Realtime 활성화'
    ]
  },
  '05': {
    deps: '없음',
    overlap: [
      'origin/main에 PR #34 "Service Worker 기반 Web Push 알림"이 이미 병합됨. 이 태스크는 그 구현 위에 `generateDynamicNotification`을 얹는 것이다. 착수 전 #34의 setupNotifyTimer·sw.js 핸들러 구조를 먼저 읽는다.',
      'sw.js도 수정 대상이므로 스모크 테스트 외에 `node --check sw.js`와 서비스워커 재등록 확인이 필요하다.',
      '스트릭은 기존 computeStreakDays, D-day는 기존 dDay 함수를 재사용한다(둘 다 스모크 테스트 대상 함수).'
    ],
    userTodo: [
      '없음 (#34에서 푸시 설정이 끝났다면). VAPID 키 등이 미설정이면 #34 PR 본문의 안내를 따른다.'
    ]
  },
  '06': {
    deps: '없음',
    overlap: [
      'PR #20(위클리 리캡 카드)이 열려 있고 BACKLOG 6단계 "트로피/인증서 이미지"도 같은 공유 캔버스 인프라(generateShareImage)를 쓴다. 워터마크 푸터는 모든 카드 종류에 공통 적용되도록 한 곳에서 그린다.',
      '기존 플랫폼 맞춤 카드(인스타/카카오/틱톡 비율)와 실제 이미지 미리보기 기능은 유지한다.'
    ],
    userTodo: [
      '딥링크 도메인 결정: 프롬프트는 `ourgoal.app`을 가정하지만 현재 배포는 `https://ourgoal-app.vercel.app`이다. 도메인 연결 전이면 vercel.app 주소를 쓰도록 지시.',
      '`?ref=`, `/share/{userId}` 수신 처리(랜딩에서 초대 코드 저장·추천인 기록)를 이 태스크에 포함할지 결정. 포함하지 않으면 링크만 생성.'
    ]
  }
};

const rows = parseCsv(text);
const header = rows[0];
const col = name => header.indexOf(name);
const iTitle = col('태스크명'), iPri = col('우선순위'), iCat = col('카테고리'), iState = col('진행상태'),
      iEffect = col('기대효과'), iFiles = col('대상파일'), iPrompt = col('클로드코드_실행프롬프트');
if ([iTitle, iPri, iCat, iState, iEffect, iFiles, iPrompt].some(i => i < 0)) {
  console.error('CSV 헤더가 예상과 다릅니다: ' + header.join(' | ')); process.exit(1);
}
const outDir = path.join(__dirname, '..', 'docs', 'sprint');
fs.mkdirSync(outDir, { recursive: true });
const d = new Date(); const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
let n = 0;
for (const r of rows.slice(1)) {
  const m = /\[TASK-(\d{2})\]\s*(.+)/.exec(r[iTitle]);
  if (!m) { console.error('태스크명 형식 불일치: ' + r[iTitle]); continue; }
  const id = m[1], title = m[2].trim();
  const meta = META[id] || { deps: '(미정)', overlap: [], userTodo: [] };
  const md = [
    `# [TASK-${id}] ${title}`,
    '',
    '| 항목 | 내용 |',
    '|---|---|',
    `| 우선순위 | ${r[iPri]} |`,
    `| 카테고리 | ${r[iCat]} |`,
    `| 기대효과 | ${r[iEffect]} |`,
    `| 대상파일 | ${r[iFiles]} |`,
    `| 의존 태스크 | ${meta.deps} |`,
    `| 노션 진행상태(내보내기 시점) | ${r[iState]} |`,
    '',
    '## 기존 코드/PR과 겹치는 부분 (착수 전 확인)',
    ...(meta.overlap.length ? meta.overlap.map(s => `- ${s}`) : ['- (없음)']),
    '',
    '## 사용자 필요 작업 (외부 콘솔·키, 코드에 넣지 않음)',
    ...(meta.userTodo.length ? meta.userTodo.map(s => `- ${s}`) : ['- 없음']),
    '',
    `## 실행 프롬프트 (노션 원문, ${today} 내보내기)`,
    '',
    '> 프롬프트의 코드 예시는 참고용이다. 기존 코드의 함수명·상태 구조·디자인 토큰이 우선한다.',
    '',
    r[iPrompt].trim(),
    ''
  ].join('\n');
  fs.writeFileSync(path.join(outDir, `TASK-${id}.md`), md, 'utf8');
  n++;
  console.log(`  ✓ docs/sprint/TASK-${id}.md (${title})`);
}
console.log(`${n}개 태스크 파일 생성`);
