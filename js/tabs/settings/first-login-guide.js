/**
 * OurGoal First Login Guide (설정 — 앱 활용 가이드 6쪽 안내 창)
 *
 * 「최초 로그인 활용가이드 — 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 융합」 묶음 중 활용 가이드 책임: 첫 로그인 가이드 띄우기(maybeShowFirstLoginGuide)·6쪽 안내 창(startFirstLoginGuide — 설정 「앱 활용 가이드 다시보기」 #btnRestartGuide 가 부른다).
 * window.startFirstLoginGuide 노출 줄과 탭 단추·화면 목록(navButtons·screens — 로드 중 DOM 을 읽는 상태)은 index.html 원래 자리에 그대로 있다.
 * #TASK-ES-523(인라인 3단계 Z4 이동 2차(활용가이드·공개 범위 배지·스톱워치 시간 글자)): index.html 인라인 IIFE 의 구간(이전 전 4908~4915 · 4916~5116줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  /* ---- 이전 전 index.html 4908~4915줄(#TASK-ES-523 생성기 표지) ---- */
  async function maybeShowFirstLoginGuide(){
    if(L.state.profile && L.state.profile.settings && L.state.profile.settings.hasSeenGuide) return;
    if(L.state.profile && L.state.profile.settings) {
      L.state.profile.settings.hasSeenGuide = true;
      await L.saveProfile();
    }
    startFirstLoginGuide();
  }
  /* ---- 이전 전 index.html 4916~5116줄(#TASK-ES-523 생성기 표지) ---- */

  function startFirstLoginGuide(forceDetailed){
    // [옵션 1] 6페이지 상세 기능 안내 모달 (기존 아워골 핵심 기능 설명 자산 보존)
    function showDetailedFeatureGuide(){
      showGuideStep1();

      function showGuideStep1(){
        L.openModal(
          '<p class="ob-step-label">1 / 6 · 환영 & 완전 무료</p>' +
          '<h3 style="font-size:1.125rem;margin-bottom:6px;">안녕하세요 '+L.escapeHtml((L.state.profile && L.state.profile.displayName)||'러너')+'님, 아워골에 오신 것을 환영합니다!</h3>' +
          '<p class="muted" style="margin:0 0 14px;font-size:.875rem;line-height:1.5;">모든 목표와 성장의 가능성을 비용 부담 없이 100% 자유롭게 누려보세요.</p>' +
          '<div class="mission-card" style="border-left-color:var(--sage);"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/></svg></div><div><b>100% 완전 무료화 & 페이월 제거</b><span>유료 결제나 제한 없이 무제한 목표 등록, AI 코칭, 30일 심층 분석 리포트까지 모든 기능을 완전 무료로 이용할 수 있어요</span></div></div>' +
          '<div class="mission-card" style="border-left-color:var(--ink);"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg></div><div><b>오직 목표 달성에만 집중하는 앱</b><span>과도한 유료 결제 팝업이나 강제 광고가 없어 내 루틴과 성장에 온전히 몰입할 수 있어요</span></div></div>' +
          '<div class="modal-actions"><button class="btn btn-primary btn-block" id="guideNext1" type="button">다음</button></div>' +
          '<button class="land-login-link" id="guideSkip1" type="button" style="width:100%;background:none;margin-top:12px;">나중에 볼게요 (건너뛰기)</button>',
          function(sheet){
            sheet.querySelector('#guideNext1').addEventListener('click', showGuideStep2);
            sheet.querySelector('#guideSkip1').addEventListener('click', function(){ L.closeModal(); L.showCommTourModal(); });
          }
        );
      }

      function showGuideStep2(){
        L.openModal(
          '<p class="ob-step-label">2 / 6 · 지능형 AI 코칭</p>' +
          '<h3 style="font-size:1.125rem;margin-bottom:6px;">목표와 향후 30일 일정을 읽는 AI 코치</h3>' +
          '<p class="muted" style="margin:0 0 14px;font-size:.875rem;line-height:1.5;">단순한 응원을 넘어, 내 일정과 마감일까지 똑똑하게 챙겨드려요.</p>' +
          '<div class="mission-card"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.7h17"/><path d="M8 3.2v3.6M16 3.2v3.6"/></svg></div><div><b>다가오는 30일 일정 지능형 연계</b><span>체크인을 남기면 기록에 대한 피드백뿐만 아니라 향후 1달간의 일정을 종합 검토하여, 놓치기 쉬운 마감일이나 계획을 똑똑하게 조언해줘요 (불필요한 참견은 배제)</span></div></div>' +
          '<div class="mission-card"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></svg></div><div><b>나만의 피드백 페르소나</b><span>따뜻한 칭찬봇부터 팩트 폭격 코치까지 원하는 성격과 말투로 자유롭게 피드백을 맞춤 설정할 수 있어요</span></div></div>' +
          '<div class="modal-actions"><button class="btn btn-ghost" id="guideBack2" type="button">이전</button><button class="btn btn-primary" id="guideNext2" type="button">다음</button></div>',
          function(sheet){
            sheet.querySelector('#guideBack2').addEventListener('click', showGuideStep1);
            sheet.querySelector('#guideNext2').addEventListener('click', showGuideStep3);
          }
        );
      }

      function showGuideStep3(){
        L.openModal(
          '<p class="ob-step-label">3 / 6 · 구글 캘린더 상호 연동</p>' +
          '<h3 style="font-size:1.125rem;margin-bottom:6px;">아워골과 구글 캘린더의 완벽한 하나됨</h3>' +
          '<p class="muted" style="margin:0 0 14px;font-size:.875rem;line-height:1.5;">우리 앱과 구글 캘린더가 서로의 일정을 실시간으로 공유해요.</p>' +
          '<div class="mission-card" style="border-left-color:var(--ink);"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.7h17"/><path d="M8 3.2v3.6M16 3.2v3.6"/></svg></div><div><b>양방향 상호 동기화 (단일 캘린더)</b><span>아워골 마일스톤이 구글 캘린더로 가고, 구글 캘린더의 모든 일정도 아워골 일정 탭에서 배지 구분 없이 깔끔하게 함께 확인할 수 있어요</span></div></div>' +
          '<div class="mission-card" style="border-left-color:var(--sage);"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg></div><div><b>원클릭 빠른 연결</b><span>설정에서 구글 계정을 한 번만 연결하면 모든 마일스톤과 약속 일정이 자동으로 안전하게 동기화돼요</span></div></div>' +
          '<div class="modal-actions"><button class="btn btn-ghost" id="guideBack3" type="button">이전</button><button class="btn btn-primary" id="guideNext3" type="button">다음</button></div>',
          function(sheet){
            sheet.querySelector('#guideBack3').addEventListener('click', showGuideStep2);
            sheet.querySelector('#guideNext3').addEventListener('click', showGuideStep4);
          }
        );
      }

      function showGuideStep4(){
        L.openModal(
          '<p class="ob-step-label">4 / 6 · 전문 템플릿 3대 혁신</p>' +
          '<h3 style="font-size:1.125rem;margin-bottom:6px;">차트 · 인앱 스톱워치 · 노션 연동</h3>' +
          '<p class="muted" style="margin:0 0 14px;font-size:.875rem;line-height:1.5;">생산성과 성장을 극대화하는 3가지 전문 도구를 제공해요.</p>' +
          '<div class="mission-card"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg></div><div><b>비주얼 성장 차트</b><span>운동 총 볼륨(kg), 공부 시간, 비즈니스 성과 지표를 멋진 그래프로 한눈에 시각화해줘요</span></div></div>' +
          '<div class="mission-card"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9 2h6"/></svg></div><div><b>인앱 스톱워치 & 1초 루틴</b><span>기록 작성 중 타이머로 실시간 몰입 시간을 측정하고 표에 즉시 반영할 수 있어요</span></div></div>' +
          '<div class="mission-card"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div><div><b>노션(Notion) 다이렉트 전송</b><span>기록된 전문 표 데이터를 원클릭으로 내 노션 페이지에 구조화된 표로 자동 전송해요</span></div></div>' +
          '<div class="modal-actions"><button class="btn btn-ghost" id="guideBack4" type="button">이전</button><button class="btn btn-primary" id="guideNext4" type="button">다음</button></div>',
          function(sheet){
            sheet.querySelector('#guideBack4').addEventListener('click', showGuideStep3);
            sheet.querySelector('#guideNext4').addEventListener('click', showGuideStep5);
          }
        );
      }

      function showGuideStep5(){
        L.openModal(
          '<p class="ob-step-label">5 / 6 · 팀 수준별 목표 & 모임장</p>' +
          '<h3 style="font-size:1.125rem;margin-bottom:6px;">팀 수준별 목표 & 모임장 왕관 시스템</h3>' +
          '<p class="muted" style="margin:0 0 14px;font-size:.875rem;line-height:1.5;">팀원들의 실력에 맞춘 조별 목표와 쾌적한 필터링을 지원해요.</p>' +
          '<div class="mission-card" style="border-left-color:var(--gold);"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg></div><div><b>수준별 맞춤 조/그룹 목표 관리</b><span>배드민턴 A·B·C·D·E조, 스터디 초·중·고급 등 팀원 수준에 맞춰 조별 목표·마일스톤·세부 할일을 체계적으로 관리해요</span></div></div>' +
          '<div class="mission-card" style="border-left-color:var(--sage);"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18"/><path d="m4 8 4 5 4-7 4 7 4-5-1 10H5z"/></svg></div><div><b>모임장 왕관 배지 & 상단 팀 필터</b><span>모임장에게는 👑 왕관과 초록색 모임장 배지가 부여되며, 가입 팀이 많아도 상단 필터 칩으로 스크롤 압박 없이 편하게 탐색해요</span></div></div>' +
          '<div class="mission-card" style="border-left-color:var(--ink);"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2"/><path d="M9 11h6M9 15h6"/></svg></div><div><b>컴팩트 요약 & 자세히보기</b><span>카드에서는 목표(N)·마일스톤(N)·할일(N) 개수와 진행률로 깔끔하게 보고, 자세히보기로 세부 할 일을 손쉽게 체크해요</span></div></div>' +
          '<div class="modal-actions"><button class="btn btn-ghost" id="guideBack5" type="button">이전</button><button class="btn btn-primary" id="guideNext5" type="button">다음</button></div>',
          function(sheet){
            sheet.querySelector('#guideBack5').addEventListener('click', showGuideStep4);
            sheet.querySelector('#guideNext5').addEventListener('click', showGuideStep6);
          }
        );
      }

      function showGuideStep6(){
        L.openModal(
          '<p class="ob-step-label">6 / 6 · 음성 기록 & 안심 보안</p>' +
          '<h3 style="font-size:1.125rem;margin-bottom:6px;">말 한마디로 기록 & 안심 보안</h3>' +
          '<p class="muted" style="margin:0 0 14px;font-size:.875rem;line-height:1.5;">언제 어디서나 편리하게, 데이터는 안전하게 보관하세요.</p>' +
          '<div class="mission-card"><div class="mi"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/></svg></div><div><b>10초 AI 음성 체크인</b><span>마이크 버튼을 누르고 말하면 운동 종목, 세트, 공부 시간 등을 AI가 표 속성에 맞춤으로 쏙쏙 자동 입력해줘요</span></div></div>' +
          '<div class="mission-card"><div class="mi">🕶️</div><div><b>동류 발견 안심 보안</b><span>기본은 같은 목표를 가진 사람에게만 제목·진행률·한 줄 요약이 보이고, 언제든 나만 보기로 바꿀 수 있어요</span></div></div>' +
          '<div class="modal-actions"><button class="btn btn-ghost" id="guideBack6" type="button">이전</button><button class="btn btn-primary" id="guideFinish6" type="button">아워골 시작하기</button></div>',
          function(sheet){
            sheet.querySelector('#guideBack6').addEventListener('click', showGuideStep5);
            sheet.querySelector('#guideFinish6').addEventListener('click', function(){ L.closeModal(); L.showCommTourModal(); });
          }
        );
      }
    }

    if(forceDetailed){
      showDetailedFeatureGuide();
      return;
    }

    // [옵션 2] 기본: 4대 탭 무블러(Zero Blur) 투명 라이브 프리뷰 가이드 (상민님 검증 UX 융합)
    var guideSteps = [
      {
        tab: 'home',
        badge: '1 / 4 · 🏠 홈 화면',
        title: '오늘의 실천과 3초 체크인',
        desc: '오늘의 일정, 목표, 실천 히트맵을 한눈에 조망하고 3초 만에 오늘의 발자국을 기록하는 메인 화면입니다.'
      },
      {
        tab: 'goals',
        badge: '2 / 4 · 🎯 목표 탭',
        title: '마일스톤과 루틴 설계',
        desc: '목표-마일스톤-할 일 3단 분해, 교대근무 맞춤 가변 루틴, 템플릿 백과사전으로 나만의 로드맵을 만듭니다.'
      },
      {
        tab: 'records',
        badge: '3 / 4 · 📝 기록 탭',
        title: '팩트 기반 성장과 사진형 일기',
        desc: '내가 쌓아온 시간과 실천 팩트, 위클리 리캡과 달력 사진형 일기로 나의 꾸준함을 회고하고 증명합니다.'
      },
      {
        tab: 'comm',
        badge: '4 / 4 · 💬 소통 탭',
        title: '무공해 4종 반응과 동류 연대',
        desc: '자랑과 비교 대신, 응원해요·도움돼요·별로에요·조언해요 4종 반응으로 비슷한 목표의 동류 러너들과 함께 달립니다.'
      }
    ];

    var curStepIdx = 0;
    var overlay = document.getElementById('miniGuideOverlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'miniGuideOverlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:auto;background:transparent;display:flex;flex-direction:column;justify-content:flex-end;padding:16px 16px max(74px, env(safe-area-inset-bottom, 24px) + 50px);';
      document.body.appendChild(overlay);
    }

    function renderGuideStep(){
      var step = guideSteps[curStepIdx];
      // 1. 뒤 화면 실제 전환 (배경 라이브 프리뷰)
      if(typeof L.setTab === 'function'){
        try { L.setTab(step.tab); } catch(e){}
      }

      var isLast = (curStepIdx === guideSteps.length - 1);
      overlay.innerHTML = 
        '<div style="background:rgba(15,23,42,0.96);border:1.5px solid var(--brand);border-radius:18px;padding:16px 18px;box-shadow:0 12px 36px rgba(0,0,0,0.85);pointer-events:auto;max-width:420px;margin:0 auto;width:100%;animation:fadein .2s ease;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
            '<span style="font-size:11px;font-weight:800;background:var(--brand);color:#fff;padding:2px 8px;border-radius:6px;">' + step.badge + '</span>' +
            '<button type="button" id="btnMiniGuideClose" style="background:none;border:none;color:var(--ink-faint);font-size:16px;cursor:pointer;padding:4px;">✕</button>' +
          '</div>' +
          '<h4 style="margin:0 0 6px;font-size:15px;font-weight:800;color:var(--ink);">' + step.title + '</h4>' +
          '<p style="margin:0 0 14px;font-size:12.5px;color:var(--ink-soft);line-height:1.45;">' + step.desc + '</p>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<button type="button" id="btnMiniGuideDetail" style="background:none;border:none;color:var(--brand-faint);font-size:12px;text-decoration:underline;cursor:pointer;">상세 혜택 안내</button>' +
            '<div style="display:flex;gap:8px;align-items:center;">' +
              '<button type="button" id="btnMiniGuideSkip" style="background:none;border:none;color:var(--ink-faint);font-size:12px;cursor:pointer;">건너뛰기</button>' +
              '<button type="button" id="btnMiniGuideNext" class="btn btn-primary" style="padding:6px 16px;font-size:12px;border-radius:8px;">' + (isLast ? '시작하기 🚀' : '다음 ➔') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';

      overlay.querySelector('#btnMiniGuideClose').onclick = finishGuide;
      overlay.querySelector('#btnMiniGuideSkip').onclick = finishGuide;
      var detailBtn = overlay.querySelector('#btnMiniGuideDetail');
      if(detailBtn){
        detailBtn.onclick = function(){
          finishGuide();
          showDetailedFeatureGuide();
        };
      }
      overlay.querySelector('#btnMiniGuideNext').onclick = function(){
        if(isLast){
          finishGuide();
        } else {
          curStepIdx++;
          renderGuideStep();
        }
      };
    }

    function finishGuide(){
      if(overlay && overlay.parentNode){
        overlay.parentNode.removeChild(overlay);
      }
      if(typeof L.setTab === 'function'){
        try { L.setTab('home'); } catch(e){}
      }
      L.toast('🧭 기본 가이드 완료! 이제 첫 목표를 시작해보세요');
      if(typeof L.showCommTourModal === 'function'){
        setTimeout(L.showCommTourModal, 400);
      }
    }

    renderGuideStep();
  }

  K.maybeShowFirstLoginGuide = maybeShowFirstLoginGuide;
  K.startFirstLoginGuide = startFirstLoginGuide;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
