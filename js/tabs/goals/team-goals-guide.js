/**
 * OurGoal Team Goals Guide (목표 탭 — 팀 만들기 안내 카드·팀 목표 활용 가이드·빠른 템플릿)
 *
 * 팀 만들기 안내 카드(renderTeamCreateHeroCardHtml — 목표 탭·소통 탭이 같이 씀) · 팀 목표 빈 안내와 활용 가이드(renderTeamGoalsEmptyGuideHtml) · 그 안의 예시 탭·빠른 템플릿·팀 만들기 단추 배선(wireTeamGoalsGuideEvents) · 빠른 템플릿 프리셋(getTeamGoalTemplatePreset).
 * window 노출 줄은 index.html 원래 자리에 그대로 있다. 팀 목표 화면(renderTeamGoalsScreen)·수준별 목표(getGroupLevelGoals·openLevelGroupDetailModal)·일괄 접기(collapseAllTeamGoalAccordions)·팀 목표 편집 창(openTeamGoalEditModal)·개인 목표 빈 안내(renderPersonalGoalsEmptyGuideHtml)는 이번에 옮기지 않았다.
 * #TASK-ES-493(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 15186~15211 · 15212~15492 · 15496~15590 · 16879~16903줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ---- 이전 전 index.html 15186~15211줄(#TASK-ES-493 생성기 표지) ---- */

  function renderTeamCreateHeroCardHtml(context){
    var isGoals = context === 'goals';
    var heroBtnHtml = isGoals ?
      '<button class="btn btn-primary" id="btnHeroCreateTeamGoals" data-herocreateteam="goals" type="button" style="min-height:44px;padding:0 18px;font-weight:700;font-size:0.9375rem;border-radius:12px;display:inline-flex;align-items:center;gap:6px;"><span>+ 새 팀 개설하기</span></button>' :
      '<button class="btn btn-primary" id="btnHeroCreateTeamComm" data-herocreateteam="comm" type="button" style="min-height:44px;padding:0 18px;font-weight:700;font-size:0.9375rem;border-radius:12px;display:inline-flex;align-items:center;gap:6px;"><span>+ 새 팀 개설하기</span></button>';

    return '<div class="team-hero-card" id="' + (isGoals ? 'teamGoalsHeroCard' : 'commTeamHeroCard') + '" style="margin-bottom:14px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">' +
        '<span class="team-hero-badge">🔥 우리만의 팀 만들기</span>' +
        '<span style="font-size:0.75rem;color:var(--ink-faint);font-weight:600;">3초 만에 빠른 개설</span>' +
      '</div>' +
      '<h3 class="team-hero-title">' +
        '<span>' + (isGoals ? '함께 달릴 새 팀 목표 만들기' : '친구·동료와 함께할 새 팀 만들기') + '</span>' +
      '</h3>' +
      '<p class="team-hero-desc">' +
        '직장 동료, 스터디, 운동 크루들과 함께 실천하고 응원할 팀을 자유롭게 개설해보세요!' +
      '</p>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
        heroBtnHtml +
        '<button class="btn btn-ghost btn-sm" data-tgtplquick="workshop" type="button" style="min-height:44px;padding:0 12px;font-size:0.8125rem;border-radius:12px;">🏢 워크숍 TF</button>' +
        '<button class="btn btn-ghost btn-sm" data-tgtplquick="travel" type="button" style="min-height:44px;padding:0 12px;font-size:0.8125rem;border-radius:12px;">✈️ 단체여행</button>' +
        '<button class="btn btn-ghost btn-sm" data-tgtplquick="fitness" type="button" style="min-height:44px;padding:0 12px;font-size:0.8125rem;border-radius:12px;">🏋️ 운동 크루</button>' +
      '</div>' +
    '</div>';
  }
  /* ---- 이전 전 index.html 15212~15492줄(#TASK-ES-493 생성기 표지) ---- */

  function renderTeamGoalsEmptyGuideHtml(){
    return renderTeamCreateHeroCardHtml('goals') +
      '<div class="team-quick-action-bar" id="teamLinkedGoalQuickBar">' +
        '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
          '<span style="font-size:1.25rem;">💡</span>' +
          '<div style="min-width:0;">' +
            '<div style="font-weight:700;font-size:0.875rem;color:var(--ink);">팀 목표와 나를 잇는 실천</div>' +
            '<div class="faint" style="font-size:0.75rem;">팀 연계 개인목표를 만들고 함께 완주해요 (+15 EXP)</div>' +
          '</div>' +
        '</div>' +
        '<button class="team-personal-goal-quick-btn" id="btnQuickCreateTeamLinkedGoal" type="button">' +
          '+ 개인목표 만들기' +
        '</button>' +
      '</div>' +
      '<div class="card" style="margin-bottom:14px;background:var(--surface-2);border:1px solid var(--rule);">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
        '<span style="font-size:1.6rem;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M6 3h12v6a6 6 0 0 1-12 0z"/><path d="M6 5H3v2a4 4 0 0 0 3 4"/><path d="M18 5h3v2a4 4 0 0 1-3 4"/></svg></span>' +
        '<div>' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
            '<h3 style="margin:0;font-size:1.0625rem;color:var(--ink);">팀 목표 200% 활용 가이드</h3>' +
            '<span class="guide-vanish-hint" id="teamGoalGuideVanishHint" style="font-size:0.8125rem;color:var(--ink-faint);font-weight:400;">* 팀 목표를 생성하면 사라짐</span>' +
          '</div>' +
          '<p class="faint" style="margin:2px 0 0;font-size:.8125rem;">혼자 하면 작심삼일, 팀 크루들과 함께 공동 목표와 수준별 목표를 달성해보세요!</p>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:14px;display:flex;flex-direction:column;gap:10px;">' +
        '<div style="background:var(--card);border-radius:12px;padding:12px;border:1px solid var(--rule);">' +
          '<div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:.875rem;color:var(--brand-strong);margin-bottom:6px;">' +
            '<span><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18"/><path d="m4 8 4 5 4-7 4 7 4-5-1 10H5z"/></svg></span><span>팀장(리더)이라면? (왕관 & 초록색 팀장 배지)</span>' +
          '</div>' +
          '<ul style="margin:0;padding-left:18px;font-size:.8125rem;line-height:1.6;color:var(--ink-soft);">' +
            '<li>내가 만든 팀에는 <b>왕관</b>과 <b>초록색 [팀장]</b> 배지가 부여돼요.</li>' +
            '<li><b>팀 공동 목표 & 단계별 마일스톤</b>을 직접 수립하고 관리해요.</li>' +
            '<li><b>팀 수준별 목표 (A·B·C·D·E조)</b>를 개설해 팀원 실력별 맞춤 마일스톤과 할일을 세팅해요.</li>' +
            '<li>크루원들의 <b>실시간 인증 사진과 달성률</b>을 한눈에 모니터링해요.</li>' +
          '</ul>' +
        '</div>' +
        '<div style="background:var(--card);border-radius:12px;padding:12px;border:1px solid var(--rule);">' +
          '<div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:.875rem;color:var(--ink);margin-bottom:6px;">' +
            '<span><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg></span><span>팀 수준별 목표 관리 (A·B·C조 맞춤 시스템)</span>' +
          '</div>' +
          '<ul style="margin:0;padding-left:18px;font-size:.8125rem;line-height:1.6;color:var(--ink-soft);">' +
            '<li>배드민턴 A~E조, 스터디 초·중·고급 등 <b>실력에 맞춘 조별 목표/마일스톤/할일</b>을 운영해요.</li>' +
            '<li>카드에서는 <b>목표(1) · 마일스톤(3) · 할일(15)</b>로 컴팩트하게 요약되어 스크롤 부담이 없어요.</li>' +
            '<li><b>[자세히보기]</b>를 누르면 목표 탭처럼 상세하게 세부 할일을 추가·체크·편집할 수 있어요.</li>' +
          '</ul>' +
        '</div>' +
        '<div style="background:var(--card);border-radius:12px;padding:12px;border:1px solid var(--rule);">' +
          '<div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:.875rem;color:var(--teal);margin-bottom:6px;">' +
            '<span><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg></span><span>상단 팀 필터 & 스마트 네비게이션</span>' +
          '</div>' +
          '<ul style="margin:0;padding-left:18px;font-size:.8125rem;line-height:1.6;color:var(--ink-soft);">' +
            '<li>가입하거나 생성한 팀이 많아도 <b>상단 필터 칩</b>으로 원하는 팀만 즉시 필터링해요.</li>' +
            '<li>댓글과 응원 이모지(👏, 🔥, ❤️)를 주고받으며 함께 성장해요.</li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div style="margin:14px 0 8px;">' +
      '<div style="font-size:.875rem;font-weight:700;color:var(--ink);margin-bottom:6px;">🎯 목적별 실제 팀 목표 예시 둘러보기</div>' +
      '<div class="goal-chip-row" id="tgGuideTabsRow" style="margin-bottom:10px;">' +
        '<button class="goal-chip active" data-tgexampletab="workshop" type="button">🏢 회사 워크숍</button>' +
        '<button class="goal-chip" data-tgexampletab="travel" type="button">✈️ 단체 여행</button>' +
        '<button class="goal-chip" data-tgexampletab="fitness" type="button">🏋️ 운동 크루</button>' +
      '</div>' +
    '</div>' +

    // 패널 1: 회사 워크숍 예시
    '<div id="tgExampleWorkshop" class="tg-example-panel" style="display:block;">' +
      '<div class="card" style="border:1px dashed var(--brand-strong);margin-bottom:14px;background:var(--card);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<span class="tag" style="background:var(--red-soft);color:var(--brand-strong);font-size:.8125rem;">실제 팀 목표 예시 화면 · 회사 워크숍</span>' +
          '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);">D-21 · 달성률 65%</span>' +
        '</div>' +
        '<div style="font-weight:700;font-size:1rem;margin-bottom:4px;">🏢 2026 하반기 전사 전략 워크숍 TF</div>' +
        '<p class="faint" style="margin:0 0 10px;font-size:.8125rem;">공동 목표: 워크숍 기획부터 현장 실행 및 2027 로드맵 수립 완료</p>' +
        '<div class="group-bar"><span style="width:65%;background:var(--brand);"></span></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0 10px;">' +
          '<span class="faint" style="font-size:.8125rem;">마일스톤 2/3 완료 (부서별 세션 아젠다 준비 중)</span>' +
          '<button class="btn btn-ghost btn-sm tg-fold-btn" data-tgfoldms="ws" type="button" style="font-size:.75rem;padding:2px 8px;border-color:var(--rule);">마일스톤 접기 ▲</button>' +
        '</div>' +
        '<div class="ms-list" id="tgMsList_ws">' +
          '<div class="ms-row" style="padding:8px 10px;">' +
            '<div class="ms-main">' +
              '<div class="ms-status done"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></div>' +
              '<div style="flex:1;min-width:0;">' +
                '<span class="ms-title done-text">1단계: 장소/숙소 대관 및 워크숍 예산안 최종 승인</span>' +
                '<button class="tg-task-toggle-btn" data-tgtoggletasks="ws1" type="button" style="background:transparent;border:none;color:var(--brand-strong);font-size:.75rem;font-weight:700;padding:2px 0;cursor:pointer;display:flex;align-items:center;gap:3px;margin-top:2px;">세부 할 일 2개 <span class="t-arrow">▼</span></button>' +
              '</div>' +
              '<span class="dday-pill" style="font-size:.6875rem;">달성완료</span>' +
            '</div>' +
            '<div id="tgTasks_ws1" style="display:none;margin-top:6px;padding:6px 10px;background:var(--surface-2);border-radius:8px;font-size:.8125rem;">' +
              '<div style="color:var(--ink-soft);padding:2px 0;">✓ 행사장 대관 계약 체결 및 음향·빔프로젝터 점검</div>' +
              '<div style="color:var(--ink-soft);padding:2px 0;">✓ 시간대별 세션 및 휴식 타임테이블 배포</div>' +
            '</div>' +
          '</div>' +
          '<div class="ms-row doing" style="padding:8px 10px;">' +
            '<div class="ms-main">' +
              '<div class="ms-status doing"></div>' +
              '<div style="flex:1;min-width:0;">' +
                '<span class="ms-title">2단계: 부서별 세션 아젠다 및 팀빌딩 프로그램 확정</span>' +
                '<button class="tg-task-toggle-btn" data-tgtoggletasks="ws2" type="button" style="background:transparent;border:none;color:var(--brand-strong);font-size:.75rem;font-weight:700;padding:2px 0;cursor:pointer;display:flex;align-items:center;gap:3px;margin-top:2px;">세부 할 일 2개 <span class="t-arrow">▼</span></button>' +
              '</div>' +
              '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);font-size:.6875rem;">진행 중</span>' +
            '</div>' +
            '<div id="tgTasks_ws2" style="display:none;margin-top:6px;padding:6px 10px;background:var(--surface-2);border-radius:8px;font-size:.8125rem;">' +
              '<div style="color:var(--ink);padding:2px 0;font-weight:600;">⏳ 부서별 세션 발표자료(1page) 취합 및 슬라이드 구성</div>' +
              '<div style="color:var(--ink-soft);padding:2px 0;">○ 팀빌딩 아이스브레이킹 게임 3종 및 상품 준비</div>' +
            '</div>' +
          '</div>' +
          '<div class="ms-row" style="padding:8px 10px;">' +
            '<div class="ms-main">' +
              '<div class="ms-status todo"></div>' +
              '<div style="flex:1;min-width:0;">' +
                '<span class="ms-title">3단계: 워크숍 본행사 진행 및 팀별 액션플랜 도출·회고</span>' +
                '<button class="tg-task-toggle-btn" data-tgtoggletasks="ws3" type="button" style="background:transparent;border:none;color:var(--brand-strong);font-size:.75rem;font-weight:700;padding:2px 0;cursor:pointer;display:flex;align-items:center;gap:3px;margin-top:2px;">세부 할 일 2개 <span class="t-arrow">▼</span></button>' +
              '</div>' +
              '<span class="dday-pill" style="font-size:.6875rem;">대기</span>' +
            '</div>' +
            '<div id="tgTasks_ws3" style="display:none;margin-top:6px;padding:6px 10px;background:var(--surface-2);border-radius:8px;font-size:.8125rem;">' +
              '<div style="color:var(--ink-soft);padding:2px 0;">○ 워크숍 본행사 진행 및 타운홀 비전 공유</div>' +
              '<div style="color:var(--ink-soft);padding:2px 0;">○ 결과 보고서 작성 및 2027 팀별 후속 액션플랜 도출</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:12px;padding:10px;background:var(--surface-2);border-radius:10px;font-size:.8125rem;color:var(--ink-soft);">' +
          '<div style="font-weight:700;color:var(--ink);margin-bottom:4px;">💡 TF 역할 분담 (수준별 조 맞춤 세팅 예시)</div>' +
          '<div style="line-height:1.6;">' +
            '• <b>A조 (기획·운영 TF)</b>: 타임테이블 관리, 대관/예산 총괄<br>' +
            '• <b>B조 (프로그램·레크 TF)</b>: 팀빌딩 3종 액티비티, 비전 세션<br>' +
            '• <b>C조 (물류·지원 TF)</b>: 카풀 배차, 숙소 룸 배정, 다과·비품' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:14px;">' +
          '<button class="btn btn-ghost btn-sm" data-tgquickpreview="g-workshop" data-tgquickjoin="g-workshop" type="button" style="flex:1;">👀 1초 둘러보기 체험</button>' +
          '<button class="btn btn-primary btn-sm" data-tgtplgroup="workshop" type="button" style="flex:1.2;">✨ 이 템플릿으로 팀 개설</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // 패널 2: 단체 여행 예시
    '<div id="tgExampleTravel" class="tg-example-panel" style="display:none;">' +
      '<div class="card" style="border:1px dashed var(--teal);margin-bottom:14px;background:var(--card);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<span class="tag" style="background:rgba(20,184,166,0.12);color:var(--teal);font-size:.8125rem;">실제 팀 목표 예시 화면 · 단체 여행</span>' +
          '<span class="dday-pill" style="background:rgba(20,184,166,0.12);color:var(--teal);">D-14 · 달성률 70%</span>' +
        '</div>' +
        '<div style="font-weight:700;font-size:1rem;margin-bottom:4px;">✈️ 제주 3박4일 단체 힐링여행</div>' +
        '<p class="faint" style="margin:0 0 10px;font-size:.8125rem;">공동 목표: 낙오자 없이 5명이서 준비하는 완벽한 제주 힐링 여행</p>' +
        '<div class="group-bar"><span style="width:70%;background:var(--teal);"></span></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0 10px;">' +
          '<span class="faint" style="font-size:.8125rem;">마일스톤 2/3 완료 (렌터카 및 코스 확정)</span>' +
          '<button class="btn btn-ghost btn-sm tg-fold-btn" data-tgfoldms="tr" type="button" style="font-size:.75rem;padding:2px 8px;border-color:var(--rule);">마일스톤 접기 ▲</button>' +
        '</div>' +
        '<div class="ms-list" id="tgMsList_tr">' +
          '<div class="ms-row" style="padding:8px 10px;">' +
            '<div class="ms-main">' +
              '<div class="ms-status done"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></div>' +
              '<div style="flex:1;min-width:0;">' +
                '<span class="ms-title done-text">1단계: 항공권 발권 및 독채 숙소 예약 확정</span>' +
                '<button class="tg-task-toggle-btn" data-tgtoggletasks="tr1" type="button" style="background:transparent;border:none;color:var(--teal);font-size:.75rem;font-weight:700;padding:2px 0;cursor:pointer;display:flex;align-items:center;gap:3px;margin-top:2px;">세부 할 일 2개 <span class="t-arrow">▼</span></button>' +
              '</div>' +
              '<span class="dday-pill" style="font-size:.6875rem;">달성완료</span>' +
            '</div>' +
            '<div id="tgTasks_tr1" style="display:none;margin-top:6px;padding:6px 10px;background:var(--surface-2);border-radius:8px;font-size:.8125rem;">' +
              '<div style="color:var(--ink-soft);padding:2px 0;">✓ 김포-제주 왕복 항공권 전원 발권 완료</div>' +
              '<div style="color:var(--ink-soft);padding:2px 0;">✓ 애월 오션뷰 독채 펜션 예약 및 바비큐 확정</div>' +
            '</div>' +
          '</div>' +
          '<div class="ms-row doing" style="padding:8px 10px;">' +
            '<div class="ms-main">' +
              '<div class="ms-status doing"></div>' +
              '<div style="flex:1;min-width:0;">' +
                '<span class="ms-title">2단계: 렌터카 배차, 일자별 드라이브 코스 및 맛집 리스트업</span>' +
                '<button class="tg-task-toggle-btn" data-tgtoggletasks="tr2" type="button" style="background:transparent;border:none;color:var(--teal);font-size:.75rem;font-weight:700;padding:2px 0;cursor:pointer;display:flex;align-items:center;gap:3px;margin-top:2px;">세부 할 일 2개 <span class="t-arrow">▼</span></button>' +
              '</div>' +
              '<span class="dday-pill" style="background:rgba(20,184,166,0.12);color:var(--teal);font-size:.6875rem;">진행 중</span>' +
            '</div>' +
            '<div id="tgTasks_tr2" style="display:none;margin-top:6px;padding:6px 10px;background:var(--surface-2);border-radius:8px;font-size:.8125rem;">' +
              '<div style="color:var(--ink);padding:2px 0;font-weight:600;">⏳ 7인승 카니발 렌터카 배차 및 제2운전자 사전 등록</div>' +
              '<div style="color:var(--ink-soft);padding:2px 0;">○ 일자별 드라이브 코스 및 흑돼지 맛집 단체석 예약</div>' +
            '</div>' +
          '</div>' +
          '<div class="ms-row" style="padding:8px 10px;">' +
            '<div class="ms-main">' +
              '<div class="ms-status todo"></div>' +
              '<div style="flex:1;min-width:0;">' +
                '<span class="ms-title">3단계: 안전 여행 완주, 공용 경비 정산 및 베스트 샷 앨범 공유</span>' +
                '<button class="tg-task-toggle-btn" data-tgtoggletasks="tr3" type="button" style="background:transparent;border:none;color:var(--teal);font-size:.75rem;font-weight:700;padding:2px 0;cursor:pointer;display:flex;align-items:center;gap:3px;margin-top:2px;">세부 할 일 2개 <span class="t-arrow">▼</span></button>' +
              '</div>' +
              '<span class="dday-pill" style="font-size:.6875rem;">대기</span>' +
            '</div>' +
            '<div id="tgTasks_tr3" style="display:none;margin-top:6px;padding:6px 10px;background:var(--surface-2);border-radius:8px;font-size:.8125rem;">' +
              '<div style="color:var(--ink-soft);padding:2px 0;">○ 여행 필수품/상비약 체크리스트 점검 완료</div>' +
              '<div style="color:var(--ink-soft);padding:2px 0;">○ 모임통장 공용 경비 1/N 정산 및 단체 앨범 공유</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:12px;padding:10px;background:var(--surface-2);border-radius:10px;font-size:.8125rem;color:var(--ink-soft);">' +
          '<div style="font-weight:700;color:var(--ink);margin-bottom:4px;">💡 단체 여행 역할 분담 (수준별 조 맞춤 세팅 예시)</div>' +
          '<div style="line-height:1.6;">' +
            '• <b>A조 (동선·차량 조)</b>: 렌터카 예약, 1~3일차 드라이브 코스<br>' +
            '• <b>B조 (맛집·카페 조)</b>: 흑돼지/해산물 로컬 맛집, 단체석 예약<br>' +
            '• <b>C조 (총무·촬영 조)</b>: 모임통장 공용 경비 정산, 단체 인생샷' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:14px;">' +
          '<button class="btn btn-ghost btn-sm" data-tgquickpreview="g-travel" data-tgquickjoin="g-travel" type="button" style="flex:1;">👀 1초 둘러보기 체험</button>' +
          '<button class="btn btn-primary btn-sm" data-tgtplgroup="travel" type="button" style="flex:1.2;">✨ 이 템플릿으로 팀 개설</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // 패널 3: 운동 크루 (기존 테스트 호환성 유지)
    '<div id="tgExampleFitness" class="tg-example-panel" style="display:none;">' +
      '<div class="card" style="border:1px dashed var(--gold-line);margin-bottom:14px;background:var(--card);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<span class="tag" style="background:var(--gold-soft);color:var(--gold);font-size:.8125rem;">실제 팀 목표 예시 화면</span>' +
          '<span class="dday-pill" style="background:var(--sage-soft);color:var(--sage);">달성률 74%</span>' +
        '</div>' +
        '<div style="font-weight:700;font-size:1rem;margin-bottom:4px;">크로스핏 와드(WOD) 정복대</div>' +
        '<p class="faint" style="margin:0 0 10px;font-size:.8125rem;">공동 목표: 크루 전체 이번 달 와드 250회 정복</p>' +
        '<div class="group-bar"><span style="width:74%;"></span></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 0 10px;">' +
          '<span class="faint" style="font-size:.8125rem;">마일스톤 2/3 완료 (185/250회)</span>' +
          '<button class="btn btn-ghost btn-sm tg-fold-btn" data-tgfoldms="ft" type="button" style="font-size:.75rem;padding:2px 8px;border-color:var(--rule);">마일스톤 접기 ▲</button>' +
        '</div>' +
        '<div class="ms-list" id="tgMsList_ft">' +
          '<div class="ms-row" style="padding:8px 10px;">' +
            '<div class="ms-main">' +
              '<div class="ms-status done"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></div>' +
              '<div style="flex:1;min-width:0;">' +
                '<span class="ms-title done-text">1단계: 상반월 100회 인증 돌파</span>' +
                '<button class="tg-task-toggle-btn" data-tgtoggletasks="ft1" type="button" style="background:transparent;border:none;color:var(--brand-strong);font-size:.75rem;font-weight:700;padding:2px 0;cursor:pointer;display:flex;align-items:center;gap:3px;margin-top:2px;">세부 할 일 2개 <span class="t-arrow">▼</span></button>' +
              '</div>' +
              '<span class="dday-pill" style="font-size:.6875rem;">달성완료</span>' +
            '</div>' +
            '<div id="tgTasks_ft1" style="display:none;margin-top:6px;padding:6px 10px;background:var(--surface-2);border-radius:8px;font-size:.8125rem;">' +
              '<div style="color:var(--ink-soft);padding:2px 0;">✓ 스트레칭 및 웜업 15분 필수 실시</div>' +
              '<div style="color:var(--ink-soft);padding:2px 0;">✓ 주 3회 WOD 출석 인증샷 업로드</div>' +
            '</div>' +
          '</div>' +
          '<div class="ms-row doing" style="padding:8px 10px;">' +
            '<div class="ms-main">' +
              '<div class="ms-status doing"></div>' +
              '<div style="flex:1;min-width:0;">' +
                '<span class="ms-title">2단계: 하반월 200회 인증 돌파</span>' +
                '<button class="tg-task-toggle-btn" data-tgtoggletasks="ft2" type="button" style="background:transparent;border:none;color:var(--brand-strong);font-size:.75rem;font-weight:700;padding:2px 0;cursor:pointer;display:flex;align-items:center;gap:3px;margin-top:2px;">세부 할 일 2개 <span class="t-arrow">▼</span></button>' +
              '</div>' +
              '<span class="dday-pill" style="background:var(--red-soft);color:var(--brand-strong);font-size:.6875rem;">진행 중</span>' +
            '</div>' +
            '<div id="tgTasks_ft2" style="display:none;margin-top:6px;padding:6px 10px;background:var(--surface-2);border-radius:8px;font-size:.8125rem;">' +
              '<div style="color:var(--ink);padding:2px 0;font-weight:600;">⏳ 크루원 전원 Rx\'d 무게 도전 및 라운드 기록 단축</div>' +
              '<div style="color:var(--ink-soft);padding:2px 0;">○ 무반동 턱걸이(풀업) 5개 연속 성공</div>' +
            '</div>' +
          '</div>' +
          '<div class="ms-row" style="padding:8px 10px;">' +
            '<div class="ms-main">' +
              '<div class="ms-status todo"></div>' +
              '<div style="flex:1;min-width:0;">' +
                '<span class="ms-title">3단계: 250회 완수 및 오프라인 WOD 정모</span>' +
                '<button class="tg-task-toggle-btn" data-tgtoggletasks="ft3" type="button" style="background:transparent;border:none;color:var(--brand-strong);font-size:.75rem;font-weight:700;padding:2px 0;cursor:pointer;display:flex;align-items:center;gap:3px;margin-top:2px;">세부 할 일 2개 <span class="t-arrow">▼</span></button>' +
              '</div>' +
              '<span class="dday-pill" style="font-size:.6875rem;">대기</span>' +
            '</div>' +
            '<div id="tgTasks_ft3" style="display:none;margin-top:6px;padding:6px 10px;background:var(--surface-2);border-radius:8px;font-size:.8125rem;">' +
              '<div style="color:var(--ink-soft);padding:2px 0;">○ 250회 누적 완주 인증 파티</div>' +
              '<div style="color:var(--ink-soft);padding:2px 0;">○ 박스 내부 페어 WOD 친선 대회</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-top:14px;">' +
          '<button class="btn btn-ghost btn-sm" id="tgExploreGroupsBtn" data-tgexplore="1" type="button" style="flex:0.8;">인기 팀</button>' +
          '<button class="btn btn-ghost btn-sm" id="tgQuickJoinSampleBtn" data-tgquickpreview="g0" data-tgquickjoin="g0" type="button" style="flex:1;">👀 1초 체험</button>' +
          '<button class="btn btn-primary btn-sm" data-tgtplgroup="fitness" type="button" style="flex:1.2;">✨ 템플릿 개설</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ---- 이전 전 index.html 15496~15590줄(#TASK-ES-493 생성기 표지) ---- */

  function wireTeamGoalsGuideEvents(container){
    var heroBtn = container.querySelector('#btnHeroCreateTeamGoals');
    if(heroBtn){
      heroBtn.onclick = function(){
        L.triggerHapticFeedback(12);
        L.closeModal();
        L.promptNewGroup(null);
      };
    }
    var emptyQuickBtn = container.querySelector('#btnQuickCreateTeamLinkedGoal') || container.querySelector('#btnQuickCreateTeamLinkedGoalEmpty');
    if(emptyQuickBtn){
      emptyQuickBtn.addEventListener('click', function(){
        L.triggerHapticFeedback(12);
        L.closeModal();
        var sampleTeam = (typeof L.MOCK_GROUPS !== 'undefined' && L.MOCK_GROUPS.length) ? L.MOCK_GROUPS[0] : { id: 'g-workshop', name: '2026 하반기 전략 워크숍 TF' };
        L.openTeamLinkedPersonalGoalModal(sampleTeam.id, sampleTeam.name);
      });
    }
    container.querySelectorAll('[data-tgtplquick]').forEach(function(btn){
      btn.onclick = function(){
        L.triggerHapticFeedback(12);
        var tpl = btn.dataset.tgtplquick;
        L.closeModal();
        var preset = getTeamGoalTemplatePreset(tpl);
        L.promptNewGroup(null, preset);
      };
    });
    var tabs = container.querySelectorAll('[data-tgexampletab]');
    tabs.forEach(function(btn){
      btn.addEventListener('click', function(){
        var target = btn.dataset.tgexampletab;
        tabs.forEach(function(b){ b.classList.toggle('active', b === btn); });
        var pWS = container.querySelector('#tgExampleWorkshop');
        var pTR = container.querySelector('#tgExampleTravel');
        var pFT = container.querySelector('#tgExampleFitness');
        if(pWS) pWS.style.display = target === 'workshop' ? 'block' : 'none';
        if(pTR) pTR.style.display = target === 'travel' ? 'block' : 'none';
        if(pFT) pFT.style.display = target === 'fitness' ? 'block' : 'none';
      });
    });
    container.querySelectorAll('[data-tgtoggletasks]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var tid = btn.dataset.tgtoggletasks;
        var box = container.querySelector('#tgTasks_' + tid);
        if(!box) return;
        var isHidden = box.style.display === 'none' || !box.style.display;
        box.style.display = isHidden ? 'block' : 'none';
        var arr = btn.querySelector('.t-arrow');
        if(arr) arr.textContent = isHidden ? '▲' : '▼';
      });
    });
    container.querySelectorAll('[data-tgfoldms]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var fid = btn.dataset.tgfoldms;
        var list = container.querySelector('#tgMsList_' + fid);
        if(!list) return;
        var isHidden = list.style.display === 'none';
        list.style.display = isHidden ? 'block' : 'none';
        btn.textContent = isHidden ? '마일스톤 접기 ▲' : '마일스톤 펼치기 ▼';
      });
    });
    container.querySelectorAll('[data-tgexplore]').forEach(function(btn){
      btn.addEventListener('click', function(){
        L.closeModal();
        L.setTab('comm');
        L.state.commSubTab = 'groups';
        var subtabs = document.getElementById('commSubtabs');
        if(subtabs) subtabs.querySelectorAll('.comm-subtab').forEach(function(st){ st.classList.toggle('active', st.dataset.sub === 'groups'); });
        var subBody = document.getElementById('commSubBody');
        if(subBody) L.renderCommGroups(subBody);
      });
    });
    container.querySelectorAll('[data-tgquickjoin],[data-tgquickpreview]').forEach(function(btn){
      btn.addEventListener('click', async function(){
        var gid = btn.dataset.tgquickpreview || btn.dataset.tgquickjoin;
        var sampleGroup = L.MOCK_GROUPS.find(function(g){ return g.id === gid; }) || L.MOCK_GROUPS[0];
        var gs = L.groupState(sampleGroup.id);
        gs.joined = true;
        gs.isPreview = true;
        await L.saveProfile();
        L.closeModal();
        L.toast('"' + sampleGroup.name + '" 체험 모드로 시작했어요. [체험 팀 나가기]로 언제든 나갈 수 있어요.');
        L.renderTeamGoalsScreen();
      });
    });
    container.querySelectorAll('[data-tgtplgroup]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var tpl = btn.dataset.tgtplgroup;
        L.closeModal();
        var preset = getTeamGoalTemplatePreset(tpl);
        L.promptNewGroup(null, preset);
      });
    });
  }

  /* ---- 이전 전 index.html 16879~16903줄(#TASK-ES-493 생성기 표지) ---- */

  function getTeamGoalTemplatePreset(tpl){
    var g = null;
    if(typeof tpl === 'object' && tpl !== null){
      g = tpl;
    } else if(typeof tpl === 'string'){
      var gid = (tpl === 'workshop' || tpl === 'g-workshop') ? 'g-workshop'
              : (tpl === 'travel' || tpl === 'g-travel') ? 'g-travel'
              : (tpl === 'fitness' || tpl === 'g0') ? 'g0'
              : tpl;
      g = (typeof L.MOCK_GROUPS !== 'undefined' ? L.MOCK_GROUPS : []).find(function(x){ return x.id === gid; });
    }
    if(!g && typeof L.MOCK_GROUPS !== 'undefined' && L.MOCK_GROUPS.length) g = L.MOCK_GROUPS[0];
    if(!g) return { icon:'🔥', name:'새로운 우리 팀', desc:'', rule:'', max:'5', cadence:'주 3회', topic:'', teamGoals:[] };
    return {
      icon: g.icon,
      name: g.name,
      desc: g.desc,
      rule: g.rule,
      max: String(g.maxMembers || 5),
      cadence: g.cadence || '주 3회',
      topic: g.topic || '',
      teamGoals: g.teamGoals ? JSON.parse(JSON.stringify(g.teamGoals)) : []
    };
  }

  K.renderTeamCreateHeroCardHtml = renderTeamCreateHeroCardHtml;
  K.renderTeamGoalsEmptyGuideHtml = renderTeamGoalsEmptyGuideHtml;
  K.wireTeamGoalsGuideEvents = wireTeamGoalsGuideEvents;
  K.getTeamGoalTemplatePreset = getTeamGoalTemplatePreset;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
