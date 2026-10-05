/**
 * OurGoal Personal Goals Guide (목표 탭 — 개인 목표 200% 활용 가이드·추천 템플릿 카드)
 *
 * 「개인 목표 200% 활용 가이드 & 템플릿 백과사전 (#TASK-ES-135)」 묶음 중 개인 목표 가이드 몫: 추천 목표 템플릿 1초 이식 카드와 「개인 목표 200% 활용 가이드」 3단계 실천법 카드 HTML(renderPersonalGoalsEmptyGuideHtml).
 * 목표 탭 개인 하위 탭(목표 0개일 때 빈 안내 자리)과 「활용가이드」 창(js/tabs/records/external-import.js 의 bindPersonalGuideBtn)이 L 통로로 부른다.
 * #TASK-ES-552(인라인 3단계 Z2 팀·소통 — 개인 목표 가이드·팀 수준별 목표·팀 목표 편집): index.html 인라인 IIFE 의 구간(이전 전 8653~8738줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 8653~8738줄(#TASK-ES-552 생성기 표지) ---- */
  function renderPersonalGoalsEmptyGuideHtml(){
    var templateHeroHtml = '<div class="card goal-template-hero-card" id="goalTemplateHeroCard" style="margin-top:14px;margin-bottom:14px;background:var(--card);border:1.5px solid var(--brand-line, var(--rule));border-radius:16px;padding:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:1.3rem;">📖</span>' +
          '<h3 style="margin:0;font-size:1.05rem;font-weight:800;color:var(--ink);">추천 목표 템플릿 백과사전</h3>' +
        '</div>' +
        '<span class="dday-pill" style="background:var(--brand-soft);color:var(--brand-strong);font-weight:700;font-size:12px;">1초 자동 이식</span>' +
      '</div>' +
      '<p class="faint" style="font-size:13px;line-height:1.4;margin:0 0 12px;color:var(--ink-soft);">' +
        '무엇부터 시작할지 고민되시나요? 검증된 인기 로드맵을 1클릭으로 바로 내 목표에 담아보세요!' +
      '</p>' +
      '<div class="template-quick-adopt-list" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">' +
        '<div class="template-quick-card" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border:1px solid var(--rule);border-radius:12px;">' +
          '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
            '<span style="font-size:1.15rem;">🏃</span>' +
            '<div style="min-width:0;">' +
              '<div style="font-size:13.5px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">10km 마라톤 완주 로드맵</div>' +
              '<div class="faint" style="font-size:12px;color:var(--ink-soft);">운동/건강 · 4단계 마일스톤</div>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm btn-quick-adopt-goal" onclick="adoptTemplateAsMyGoal(\'10km 마라톤 완주 로드맵\', \'운동/건강\')" style="min-height:44px;padding:0 12px;font-size:12.5px;font-weight:700;border-radius:8px;flex-shrink:0;">+ 담기</button>' +
        '</div>' +
        '<div class="template-quick-card" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border:1px solid var(--rule);border-radius:12px;">' +
          '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
            '<span style="font-size:1.15rem;">📚</span>' +
            '<div style="min-width:0;">' +
              '<div style="font-size:13.5px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">정보처리기사 실기 합격</div>' +
              '<div class="faint" style="font-size:12px;color:var(--ink-soft);">학습/성장 · 4단계 마일스톤</div>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm btn-quick-adopt-goal" onclick="adoptTemplateAsMyGoal(\'정보처리기사 실기 합격\', \'학습/성장\')" style="min-height:44px;padding:0 12px;font-size:12.5px;font-weight:700;border-radius:8px;flex-shrink:0;">+ 담기</button>' +
        '</div>' +
        '<div class="template-quick-card" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border:1px solid var(--rule);border-radius:12px;">' +
          '<div style="display:flex;align-items:center;gap:8px;min-width:0;">' +
            '<span style="font-size:1.15rem;">🌱</span>' +
            '<div style="min-width:0;">' +
              '<div style="font-size:13.5px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">미라클 모닝 30일 루틴</div>' +
              '<div class="faint" style="font-size:12px;color:var(--ink-soft);">습관/루틴 · 3단계 마일스톤</div>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-sm btn-quick-adopt-goal" onclick="adoptTemplateAsMyGoal(\'미라클 모닝 30일 루틴\', \'습관/루틴\')" style="min-height:44px;padding:0 12px;font-size:12.5px;font-weight:700;border-radius:8px;flex-shrink:0;">+ 담기</button>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="btn btn-ghost" id="btnOpenFullTemplateEncyclopedia" onclick="switchGoalsSubTab(\'templateEncyclopedia\')" style="width:100%;min-height:44px;font-size:13px;font-weight:700;border:1px solid var(--rule);border-radius:10px;background:var(--card2);">📖 템플릿 백과사전 전체 둘러보기 (60선)</button>' +
    '</div>';

    return templateHeroHtml + '<div class="card" id="personalGoalsEmptyGuideCard" style="margin-top:14px;background:var(--surface-2);border:1px solid var(--rule);">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
        '<span style="font-size:1.6rem;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span>' +
        '<div>' +
          '<h3 style="margin:0;font-size:1.0625rem;color:var(--ink);">개인 목표 200% 활용 가이드</h3>' +
          '<p class="faint" style="margin:2px 0 0;font-size:.8125rem;">작심삼일을 넘어서는 아워골 3단계(목표-마일스톤-할일) 실천법</p>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:14px;display:flex;flex-direction:column;gap:10px;">' +
        '<div style="background:var(--card);border-radius:12px;padding:12px;border:1px solid var(--rule);">' +
          '<div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:.875rem;color:var(--brand-strong);margin-bottom:6px;">' +
            '<span>1. 🎯 목표는 크고 선명하게</span>' +
          '</div>' +
          '<ul style="margin:0;padding-left:18px;font-size:.8125rem;line-height:1.6;color:var(--ink-soft);">' +
            '<li>‘하프마라톤 2시간 내 완주’, ‘정보처리기사 취득’처럼 <b>달성 여부가 뚜렷한 목표</b>를 세워보세요.</li>' +
            '<li>마감일과 내게 중요한 이유를 함께 적으면 실천 의지가 한층 단단해집니다.</li>' +
          '</ul>' +
        '</div>' +
        '<div style="background:var(--card);border-radius:12px;padding:12px;border:1px solid var(--rule);">' +
          '<div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:.875rem;color:var(--ink);margin-bottom:6px;">' +
            '<span>2. ⛳ 마일스톤으로 징검다리 놓기</span>' +
          '</div>' +
          '<ul style="margin:0;padding-left:18px;font-size:.8125rem;line-height:1.6;color:var(--ink-soft);">' +
            '<li>목표가 너무 크면 지치기 쉽습니다. <b>2~4개의 중간 정거장(마일스톤)</b>으로 쪼개세요.</li>' +
            '<li>예: 5km 러닝 성공 ➔ 10km 지속주 ➔ 하프 실전 대회 참가</li>' +
          '</ul>' +
        '</div>' +
        '<div style="background:var(--card);border-radius:12px;padding:12px;border:1px solid var(--rule);">' +
          '<div style="display:flex;align-items:center;gap:6px;font-weight:700;font-size:.875rem;color:var(--teal);margin-bottom:6px;">' +
            '<span>3. 📝 오늘의 할 일과 3초 체크인</span>' +
          '</div>' +
          '<ul style="margin:0;padding-left:18px;font-size:.8125rem;line-height:1.6;color:var(--ink-soft);">' +
            '<li>마일스톤 안에 오늘 바로 실천할 수 있는 <b>작은 할 일(To-Do)</b>을 추가하세요.</li>' +
            '<li>실천 후 홈 화면에서 한 줄만 적으면 AI가 자동으로 기록하고 레벨과 아바타가 성장합니다.</li>' +
          '</ul>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  K.renderPersonalGoalsEmptyGuideHtml = renderPersonalGoalsEmptyGuideHtml;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
