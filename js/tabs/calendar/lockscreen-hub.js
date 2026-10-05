/**
 * OurGoal Lock Screen Hub (일정 탭 — 폰 잠금화면에서 바로 보기 통합 허브 창)
 *
 * 일정 탭 「잠금화면」 단추가 여는 통합 허브 창(openLockScreenHubModal). 노출 묶음(window.openLockScreenHubModal 등)은 index.html 원래 자리.
 * #TASK-ES-486(인라인 어려움 기관 묶음 이전 2차): index.html 인라인 IIFE 의 구간(이전 전 7268~7999줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalCalendarKit = global.OurgoalCalendarKit || {};

  /* ---- 이전 전 index.html 7268~7999줄(#TASK-ES-486 생성기 표지) ---- */
  function openLockScreenHubModal(){
    var curYear = L.state.calDate ? parseInt(L.state.calDate.slice(0, 4), 10) : new Date().getFullYear();
    var curMonth = L.state.calDate ? (parseInt(L.state.calDate.slice(5, 7), 10) - 1) : new Date().getMonth();

    // 1. 실시간 잠금화면 설정 로드
    var liveSetting = { enabled: false, showMonthGrid: true, showGoalRate: true, showGoals: true, showSchedules: true, showDday: true, showStreak: true };
    try {
      if(L.state.profile && L.state.profile.settings && L.state.profile.settings.lockScreenLive){
        liveSetting = Object.assign(liveSetting, L.state.profile.settings.lockScreenLive);
      } else {
        var savedLive = localStorage.getItem('ourgoal_lockscreen_live_v1');
        if(savedLive) liveSetting = Object.assign(liveSetting, JSON.parse(savedLive));
      }
    } catch(e){}

    var digestSetting = { enabled: false, time: '07:30' };
    try {
      var saved = localStorage.getItem('ourgoal_lockscreen_digest');
      if(saved) digestSetting = JSON.parse(saved);
    } catch(e){}

    var webCalUrl = '';
    try {
      if(typeof L.buildWebCalUrl === 'function'){
        webCalUrl = L.buildWebCalUrl(L.state.profile.id, window.location.origin);
      } else {
        var base = window.location.origin.replace(/^https?:\/\//, '');
        webCalUrl = 'webcal://' + base + '/api/calendar?token=' + encodeURIComponent(L.state.profile.id || 'demo');
      }
    } catch(err){
      webCalUrl = 'webcal://ourgoal-app.vercel.app/api/calendar?token=' + encodeURIComponent(L.state.profile.id || 'demo');
    }

    var html = '' +
      '<div class="lockscreen-hub-container" style="max-height:85vh;overflow-y:auto;padding-bottom:16px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
          '<h3 style="margin:0;font-size:1.15rem;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>📱</span> 잠금화면용 일정 카드 저장' +
          '</h3>' +
          '<button type="button" class="btn-ghost" onclick="closeModal()" style="border:none;background:transparent;font-size:1.25rem;cursor:pointer;color:var(--ink-soft);padding:4px 8px;" aria-label="닫기">✕</button>' +
        '</div>' +
        '<p style="margin:0 0 14px;font-size:.84rem;color:var(--ink-soft);line-height:1.45;">' +
          '오늘의 핵심 일정과 목표를 휴대폰 배경화면 비율(9:16) 이미지로 갤러리에 저장해요.' +
        '</p>' +
        '<div style="background:var(--surface-2);border-radius:14px;padding:14px;border:1px solid var(--border-color);margin-bottom:14px;">' +
          '<div style="font-size:.875rem;font-weight:800;color:var(--ink);margin-bottom:4px;display:flex;align-items:center;gap:6px;">' +
            '<span>🖼️</span> 9:16 고해상도 잠금화면 카드 (1080×1920)' +
          '</div>' +
          '<div style="font-size:.78rem;color:var(--ink-soft);line-height:1.45;margin-bottom:10px;">' +
            '오늘 하루 일정과 핵심 목표 TOP 3가 담긴 휴대폰 맞춤 배경화면 카드를 갤러리에 즉시 저장합니다.' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-block" id="btnDownloadLockscreenCard" style="font-size:.9rem;font-weight:700;padding:12px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;">' +
            '<span>📱 잠금화면용 일정 카드 갤러리에 저장</span>' +
          '</button>' +
        '</div>' +

        '<div class="ls-seg-bar" style="display:flex;background:var(--surface-2);padding:4px;border-radius:12px;gap:4px;margin-bottom:16px;">' +
          '<button type="button" class="ls-tab-btn active" data-tab="live" style="flex:1;border:none;background:var(--bg-card);color:var(--ink);padding:8px 4px;font-size:.78rem;font-weight:700;border-radius:8px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.08);transition:all .15s ease;">⚡ 실시간 라이브</button>' +
          '<button type="button" class="ls-tab-btn" data-tab="widget" style="flex:1;border:none;background:transparent;color:var(--ink-soft);padding:8px 4px;font-size:.78rem;font-weight:600;border-radius:8px;cursor:pointer;transition:all .15s ease;">📅 위젯 연동</button>' +
          '<button type="button" class="ls-tab-btn" data-tab="digest" style="flex:1;border:none;background:transparent;color:var(--ink-soft);padding:8px 4px;font-size:.78rem;font-weight:600;border-radius:8px;cursor:pointer;transition:all .15s ease;">🔔 모닝 알림</button>' +
        '</div>' +

        // 패널 1: 폰 켤 때마다 잠금화면 전체 장악
        '<div class="ls-content-pane" id="lsPaneLive" style="display:block;">' +
          '<div style="background:var(--surface-2);border-radius:14px;padding:14px;border:1px solid var(--border-color);margin-bottom:14px;">' +
            '<div style="font-size:.84rem;font-weight:800;color:var(--ink);margin-bottom:4px;display:flex;align-items:center;gap:6px;">' +
              '<span>⚡</span> 폰 켤 때마다 잠금화면 전체 장악 (LockScreen Takeover)' +
            '</div>' +
            '<div style="font-size:.78rem;color:var(--ink-soft);line-height:1.45;">' +
              '작은 알림 상자가 아닌, 폰 전원을 켤 때마다 9:19.5 월간 달력, 목표 달성률, 다음 일정이 <strong>스마트폰 화면 100% 전체를 완벽히 장악</strong>합니다.' +
            '</div>' +
          '</div>' +

          // 실물 스마트폰 시뮬레이터 목업 (폰 화면비 최적화)
          '<div style="background:linear-gradient(180deg, #090d16 0%, #172033 100%);border-radius:28px;padding:16px 12px 14px;border:3px solid #334155;margin:0 auto 16px;box-shadow:0 12px 30px rgba(0,0,0,0.3);position:relative;max-width:280px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">' +
            '<div style="width:68px;height:12px;background:#000000;border-radius:999px;margin:0 auto 10px;box-shadow:inset 0 1px 2px rgba(255,255,255,0.1);"></div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;padding:0 6px;margin-bottom:10px;font-size:.7rem;color:#94a3b8;font-weight:600;">' +
              '<span id="lsSimStatusTime">12:30</span>' +
              '<div style="display:flex;align-items:center;gap:4px;"><span>5G</span><span>98% 🔋</span></div>' +
            '</div>' +
            '<div style="text-align:center;margin-bottom:12px;">' +
              '<div id="lsSimClockTime" style="font-size:2rem;font-weight:800;color:#f8fafc;letter-spacing:-1px;line-height:1;">12:30</div>' +
              '<div id="lsSimClockDate" style="font-size:.72rem;font-weight:600;color:#cbd5e1;margin-top:4px;">9월 18일 금요일</div>' +
            '</div>' +

            // 스마트폰 잠금화면 카드 목업
            '<div id="lsLiveCardMockup" style="background:rgba(30, 41, 59, 0.9);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.14);border-radius:18px;padding:12px 10px;color:#f8fafc;box-shadow:0 8px 24px rgba(0,0,0,0.35);">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-size:.68rem;color:#94a3b8;">' +
                '<div style="display:flex;align-items:center;gap:4px;font-weight:700;color:#f8fafc;">' +
                  '<span style="font-size:.8rem;">🎯</span>' +
                  '<span>OURGOAL · 실시간 라이브</span>' +
                '</div>' +
                '<span style="font-size:.65rem;color:#38bdf8;font-weight:700;">LIVE</span>' +
              '</div>' +

              // 1. 진짜 월 달력 폰 화면비 그리드 컨테이너
              '<div id="lsSimMonthGridWrap" style="margin-bottom:8px;"></div>' +

              // 2. 목표 달성률 게이지 바 컨테이너
              '<div id="lsSimGoalRateWrap" style="margin-bottom:8px;"></div>' +

              // 3. 오늘의 다음 일정 최대 3개 (길면 줄바꿈 금지, ... 말줄임표) 컨테이너
              '<div id="lsSimSchedulesWrap" style="margin-bottom:8px;"></div>' +

              // 4. 스트릭 & D-Day 칩 컨테이너
              '<div id="lsSimMetaWrap" style="display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap;"></div>' +

              '<div id="lsSimCardTitle" style="display:none;"></div>' +
              '<div id="lsSimCardBody" style="display:none;"></div>' +

              '<div style="display:flex;gap:6px;">' +
                '<div style="flex:1;text-align:center;background:rgba(255,255,255,0.12);border-radius:8px;padding:5px;font-size:.68rem;font-weight:700;color:#ffffff;">' +
                  '⚡ 빠른 체크인' +
                '</div>' +
                '<div style="flex:1;text-align:center;background:rgba(255,255,255,0.12);border-radius:8px;padding:5px;font-size:.68rem;font-weight:700;color:#ffffff;">' +
                  '📅 일정 확인' +
                '</div>' +
              '</div>' +

              // 5. 슬라이드 잠금해제 시뮬레이터 인터랙션 (#TASK-ES-183)
              '<div id="lsSimUnlockSlider" title="클릭하여 잠금해제 테스트" style="margin-top:8px;background:rgba(255,255,255,0.09);border:1px solid rgba(255,255,255,0.18);border-radius:999px;padding:3px 6px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;transition:all .2s ease;">' +
                '<div id="lsSimSliderKnob" style="width:24px;height:24px;border-radius:50%;background:#38bdf8;display:flex;align-items:center;justify-content:center;color:#0f172a;font-weight:900;font-size:.7rem;box-shadow:0 2px 6px rgba(0,0,0,0.3);transition:transform .3s ease;">〉</div>' +
                '<span id="lsSimSliderText" style="font-size:.62rem;color:#cbd5e1;font-weight:700;letter-spacing:0.5px;padding-right:6px;">밀어서 잠금해제 ➔</span>' +
              '</div>' +
            '</div>' +
            '<div style="width:90px;height:4px;background:rgba(255,255,255,0.35);border-radius:2px;margin:18px auto 0;"></div>' +
          '</div>' +

          // 상태 배지
          '<div id="lsLiveStatusBadge" style="text-align:center;margin-bottom:12px;font-size:.78rem;font-weight:700;padding:6px 12px;border-radius:999px;width:100%;box-sizing:border-box;"></div>' +

          // 메인 토글 버튼 (#TASK-ES-183)
          '<button type="button" class="btn ' + (liveSetting.enabled ? 'btn-ghost' : 'btn-primary') + ' btn-block" id="btnToggleLockScreenTakeover" style="font-size:.9rem;font-weight:700;padding:12px;border-radius:12px;margin-bottom:8px;cursor:pointer;">' +
            (liveSetting.enabled ? '✅ 폰 켤 때마다 잠금화면 전체 장악 중 (클릭하여 끄기)' : '⚡ 폰 켤 때마다 잠금화면 전체 장악 (연동 켜기)') +
          '</button>' +
          '<button type="button" id="btnToggleLiveLockScreen" style="display:none;" aria-hidden="true"></button>' +

          // 즉시 갱신 버튼
          '<button type="button" class="btn btn-ghost btn-sm btn-block" id="btnRefreshLiveLockScreen" style="font-size:.8125rem;font-weight:600;padding:9px;border-radius:10px;border:1px solid var(--border-color);margin-bottom:16px;cursor:pointer;">' +
            '🔄 잠금화면 화면 최신 데이터로 동기화하기' +
          '</button>' +

          // 개별 선택 체크박스 (5종)
          '<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:14px;padding:14px;margin-bottom:14px;">' +
            '<div style="font-size:.84rem;font-weight:800;color:var(--ink);margin-bottom:10px;display:flex;align-items:center;gap:6px;">' +
              '<span>⚙️</span> 잠금화면 실시간 표시 항목 개별 선택' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:10px;font-size:.8125rem;color:var(--ink);">' +
              '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">' +
                '<input type="checkbox" id="lsOptMonthGrid" style="accent-color:var(--primary);width:16px;height:16px;"' + (liveSetting.showMonthGrid !== false ? ' checked' : '') + '>' +
                '<span>📅 <strong>이번 달 월 달력 보기</strong> (폰 화면비 맞춤 그리드)</span>' +
              '</label>' +
              '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">' +
                '<input type="checkbox" id="lsOptGoalRate" style="accent-color:var(--primary);width:16px;height:16px;"' + ((liveSetting.showGoalRate !== false && liveSetting.showGoals !== false) ? ' checked' : '') + '>' +
                '<input type="checkbox" id="lsOptGoals" style="display:none;"' + ((liveSetting.showGoalRate !== false && liveSetting.showGoals !== false) ? ' checked' : '') + '>' +
                '<span>🎯 <strong>목표 달성률 게이지 바</strong> 보기</span>' +
              '</label>' +
              '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">' +
                '<input type="checkbox" id="lsOptSchedules" style="accent-color:var(--primary);width:16px;height:16px;"' + (liveSetting.showSchedules !== false ? ' checked' : '') + '>' +
                '<span>🕒 <strong>오늘의 다음 일정 최대 3개</strong> (줄바꿈 없이 한 줄씩 · ...)</span>' +
              '</label>' +
              '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">' +
                '<input type="checkbox" id="lsOptStreak" style="accent-color:var(--primary);width:16px;height:16px;"' + (liveSetting.showStreak !== false ? ' checked' : '') + '>' +
                '<span>🔥 <strong>연속 실천 스트릭</strong> 표시</span>' +
              '</label>' +
              '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;">' +
                '<input type="checkbox" id="lsOptDday" style="accent-color:var(--primary);width:16px;height:16px;"' + (liveSetting.showDday !== false ? ' checked' : '') + '>' +
                '<span>⏳ <strong>핵심 목표 D-Day</strong> 표시</span>' +
              '</label>' +
            '</div>' +
            '<div style="margin-top:10px;font-size:.75rem;color:var(--ink-soft);line-height:1.4;">' +
              '💡 항목을 선택/해제하면 상단 폰 시뮬레이터에서 <strong>실시간으로 즉시 미리보기</strong>할 수 있습니다.' +
            '</div>' +
          '</div>' +

          // 동작 및 기종별 팁 안내
          '<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:14px;padding:14px;font-size:.8125rem;color:var(--ink-soft);line-height:1.55;">' +
            '<div style="font-weight:800;color:var(--ink);margin-bottom:6px;">💡 스마트폰 기종별 전체 장악 동작 안내</div>' +
            '• <strong>갤럭시(Android)</strong>: 폰 전원을 켤 때마다 기본 잠금화면 위로 아워골 풀스크린이 100% 뜹니다. 전용 안드로이드 앱(APK) 설치 후 &quot;다른 앱 위에 표시&quot; 권한을 허용하시면 완벽히 장악합니다.<br>' +
            '<div style="margin:6px 0 8px;">' +
              '<button type="button" class="btn btn-ghost btn-xs" id="btnDownloadLockScreenApk" style="border:1px solid #38bdf8;color:#38bdf8;border-radius:8px;padding:5px 10px;font-size:.75rem;font-weight:700;cursor:pointer;">🤖 안드로이드 잠금화면 패키지(APK) 안내</button>' +
            '</div>' +
            '• <strong>아이폰(iOS)</strong>: 애플의 엄격한 보안 정책상 전 세계 어떤 앱도 전원 화면 가로채기가 금지되어 있습니다. 아이폰 사용자는 <strong>2번째 탭 [📅 위젯 연동]</strong>을 통해 잠금화면 시계 바로 아래에 <strong>정품 잠금화면 위젯</strong>으로 100% 실시간 연동하실 수 있습니다.' +
          '</div>' +
        '</div>' +

        // 패널 2: 캘린더 위젯 연동
        '<div class="ls-content-pane" id="lsPaneWidget" style="display:none;">' +
          '<div style="background:var(--surface-2);border-radius:14px;padding:14px;border:1px solid var(--border-color);margin-bottom:14px;">' +
            '<div style="font-size:.84rem;font-weight:800;color:var(--ink);margin-bottom:4px;">📅 실시간 캘린더 구독 연동</div>' +
            '<div style="font-size:.78rem;color:var(--ink-soft);line-height:1.45;">' +
              '아워골 일정을 스마트폰 기본 캘린더에 구독 등록하면, 폰 기본 <strong>잠금화면 캘린더 위젯</strong>을 통해 일정이 실시간 자동 동기화됩니다.' +
            '</div>' +
          '</div>' +

          '<div style="margin-bottom:14px;">' +
            '<label style="display:block;font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">내 캘린더 구독 URL (WebCal)</label>' +
            '<div style="display:flex;gap:6px;">' +
              '<input type="text" id="lsWebCalInput" readonly value="' + L.escapeHtml(webCalUrl) + '" style="flex:1;padding:8px 10px;font-size:.8125rem;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--ink);">' +
              '<button type="button" class="btn btn-primary btn-sm" id="btnCopyLsWebCal" style="border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;">주소 복사</button>' +
            '</div>' +
          '</div>' +

          '<button type="button" class="btn btn-ghost btn-sm btn-block" id="btnDownloadLsICS" style="font-size:.8125rem;font-weight:600;padding:8px;border-radius:10px;border:1px solid var(--border-color);margin-bottom:14px;cursor:pointer;">' +
            '📥 iCalendar (.ics) 파일 수동 다운로드' +
          '</button>' +

          '<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:14px;padding:14px;">' +
            '<div style="font-size:.84rem;font-weight:800;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
              '<span>⚙️</span> 잠금화면 위젯 등록 1분 가이드' +
            '</div>' +
            '<div style="display:flex;gap:6px;margin-bottom:10px;">' +
              '<button type="button" class="btn-ghost ls-widget-device-btn active" data-wdevice="ios" style="flex:1;padding:6px;font-size:.78rem;font-weight:700;border-radius:8px;border:1px solid var(--border-color);background:var(--surface-2);cursor:pointer;">🍎 아이폰 (iOS)</button>' +
              '<button type="button" class="btn-ghost ls-widget-device-btn" data-wdevice="aos" style="flex:1;padding:6px;font-size:.78rem;font-weight:600;border-radius:8px;border:1px solid var(--border-color);background:transparent;cursor:pointer;">🤖 갤럭시 (구글캘린더)</button>' +
            '</div>' +
            '<div id="lsWGuideIos" style="font-size:.8125rem;color:var(--ink-soft);line-height:1.6;">' +
              '1. 위 <strong>[주소 복사]</strong> 버튼을 누릅니다.<br>' +
              '2. 아이폰 <strong>설정 ➔ 캘린더 ➔ 계정 ➔ 계정 추가 ➔ 기타 ➔ [구독할 캘린더 추가]</strong>에 붙여넣고 저장합니다.<br>' +
              '3. 폰 잠금화면을 길게 눌러 <strong>[사용자화] ➔ [위젯 추가] ➔ 캘린더 위젯</strong>을 배치하면 완료!' +
            '</div>' +
            '<div id="lsWGuideAos" style="display:none;font-size:.8125rem;color:var(--ink-soft);line-height:1.6;">' +
              '1. 위 <strong>[주소 복사]</strong> 버튼을 누릅니다.<br>' +
              '2. PC/모바일 브라우저로 <strong>Google 캘린더 웹</strong>에 접속하여 좌측 [다른 캘린더 +] ➔ <strong>[URL로 추가]</strong>에 주소를 넣습니다.<br>' +
              '3. 갤럭시 <strong>설정 ➔ 잠금화면 ➔ [위젯] ➔ [오늘의 일정]</strong>을 켜면 잠금화면에 실시간으로 뜹니다!' +
            '</div>' +
          '</div>' +
        '</div>' +

        // 패널 3: 모닝 알림
        '<div class="ls-content-pane" id="lsPaneDigest" style="display:none;">' +
          '<div style="background:var(--surface-2);border-radius:14px;padding:14px;border:1px solid var(--border-color);margin-bottom:14px;">' +
            '<div style="font-size:.84rem;font-weight:800;color:var(--ink);margin-bottom:4px;">🔔 아침 잠금화면 모닝 브리핑</div>' +
            '<div style="font-size:.78rem;color:var(--ink-soft);line-height:1.45;">' +
              '매일 아침 눈떠서 폰 화면을 켤 때 오늘 하루 일정과 이달의 핵심 D-Day를 잠금화면 알림 카드로 바로 띄워드립니다.' +
            '</div>' +
          '</div>' +

          '<div style="margin-bottom:16px;">' +
            '<label style="display:block;font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">알림 받을 시간</label>' +
            '<select id="lsDigestTimeSelect" style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--ink);font-size:.875rem;font-weight:600;">' +
              '<option value="07:00"' + (digestSetting.time==='07:00'?' selected':'') + '>오전 07:00 (이른 아침 기상)</option>' +
              '<option value="07:30"' + (digestSetting.time==='07:30'?' selected':'') + '>오전 07:30 (출근·등교 준비 시간)</option>' +
              '<option value="08:00"' + (digestSetting.time==='08:00'?' selected':'') + '>오전 08:00 (기본)</option>' +
              '<option value="08:30"' + (digestSetting.time==='08:30'?' selected':'') + '>오전 08:30</option>' +
              '<option value="09:00"' + (digestSetting.time==='09:00'?' selected':'') + '>오전 09:00 (하루 시작)</option>' +
            '</select>' +
          '</div>' +

          '<button type="button" class="btn ' + (digestSetting.enabled ? 'btn-ghost' : 'btn-primary') + ' btn-block" id="btnToggleDigest" style="font-size:.9rem;font-weight:700;padding:12px;border-radius:12px;margin-bottom:14px;cursor:pointer;">' +
            (digestSetting.enabled ? '✅ 아침 잠금화면 알림 켜짐 (클릭하여 끄기)' : '🔔 아침 잠금화면 알림 켜기') +
          '</button>' +

          '<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:14px;padding:14px;font-size:.8125rem;color:var(--ink-soft);line-height:1.55;">' +
            '💡 <strong>동작 안내</strong><br>' +
            '• 브라우저 푸시 알림 권한을 허용하시면 설정한 시각에 자동으로 잠금화면에 브리핑 카드가 도착합니다.<br>' +
            '• 잠금화면에서 바로 확인하고 스와이프하여 아워골로 즉시 체크인할 수 있습니다.' +
          '</div>' +
        '</div>' +

      '</div>';

    L.openModal(html, function(sheet){
      // 0. [#TASK-ES-232] 잠금화면용 일정 카드 다운로드 배선
      var btnDownloadCard = sheet.querySelector('#btnDownloadLockscreenCard');
      if(btnDownloadCard){
        btnDownloadCard.onclick = async function(){
          if(typeof L.triggerHapticFeedback === 'function'){
            L.triggerHapticFeedback(15);
          }
          btnDownloadCard.disabled = true;
          var origHtml = btnDownloadCard.innerHTML;
          btnDownloadCard.innerHTML = '<span>⏳ 카드 이미지 생성 중...</span>';
          try {
            var cCanvas = await L.generateLockScreenScheduleCardImage(
              L.state.records || [],
              L.state.goals || [],
              { theme: (L.state.theme === 'white' ? 'light' : 'dark') }
            );
            var dlLink = document.createElement('a');
            var dNow = new Date();
            var dStr = dNow.getFullYear() + '-' + String(dNow.getMonth()+1).padStart(2,'0') + '-' + String(dNow.getDate()).padStart(2,'0');
            dlLink.download = 'ourgoal-schedule-card-' + dStr + '.png';
            dlLink.href = cCanvas.toDataURL('image/png');
            document.body.appendChild(dlLink);
            dlLink.click();
            document.body.removeChild(dlLink);
            L.toast('잠금화면용 일정 카드가 갤러리에 저장되었어요! 📱');
          } catch(err){
            console.error('[잠금화면 카드 다운로드 실패]:', err);
            L.toast('카드 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
          } finally {
            btnDownloadCard.disabled = false;
            btnDownloadCard.innerHTML = origHtml;
          }
        };
      }

      // 1. 3단 탭 전환 바인딩
      sheet.querySelectorAll('.ls-tab-btn').forEach(function(btn){
        btn.onclick = function(){
          var targetTab = btn.dataset.tab;
          sheet.querySelectorAll('.ls-tab-btn').forEach(function(b){
            b.classList.toggle('active', b.dataset.tab === targetTab);
            if(b.dataset.tab === targetTab){
              b.style.background = 'var(--bg-card)';
              b.style.color = 'var(--ink)';
              b.style.fontWeight = '700';
              b.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
            } else {
              b.style.background = 'transparent';
              b.style.color = 'var(--ink-soft)';
              b.style.fontWeight = '600';
              b.style.boxShadow = 'none';
            }
          });
          var pLive = sheet.querySelector('#lsPaneLive');
          var pWidget = sheet.querySelector('#lsPaneWidget');
          var pDigest = sheet.querySelector('#lsPaneDigest');
          if(pLive) pLive.style.display = (targetTab === 'live') ? 'block' : 'none';
          if(pWidget) pWidget.style.display = (targetTab === 'widget') ? 'block' : 'none';
          if(pDigest) pDigest.style.display = (targetTab === 'digest') ? 'block' : 'none';
        };
      });

      // 2. 실시간 라이브 시뮬레이터 0ms 즉각 미리보기 & 상태 갱신 로직
      function updateLiveSim(){
        var opts = {
          showMonthGrid: sheet.querySelector('#lsOptMonthGrid') ? sheet.querySelector('#lsOptMonthGrid').checked : true,
          showGoalRate: sheet.querySelector('#lsOptGoalRate') ? sheet.querySelector('#lsOptGoalRate').checked : (sheet.querySelector('#lsOptGoals') ? sheet.querySelector('#lsOptGoals').checked : true),
          showGoals: sheet.querySelector('#lsOptGoalRate') ? sheet.querySelector('#lsOptGoalRate').checked : (sheet.querySelector('#lsOptGoals') ? sheet.querySelector('#lsOptGoals').checked : true),
          showSchedules: sheet.querySelector('#lsOptSchedules') ? sheet.querySelector('#lsOptSchedules').checked : true,
          showStreak: sheet.querySelector('#lsOptStreak') ? sheet.querySelector('#lsOptStreak').checked : true,
          showDday: sheet.querySelector('#lsOptDday') ? sheet.querySelector('#lsOptDday').checked : true
        };
        var payload = L.buildLockScreenCardPayload(opts);

        // 시계 & 상단 바
        var now = new Date();
        var hours = String(now.getHours()).padStart(2, '0');
        var mins = String(now.getMinutes()).padStart(2, '0');
        var timeStr = hours + ':' + mins;
        var clockEl = sheet.querySelector('#lsSimClockTime');
        var statusTimeEl = sheet.querySelector('#lsSimStatusTime');
        if(clockEl) clockEl.textContent = timeStr;
        if(statusTimeEl) statusTimeEl.textContent = timeStr;

        var monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        var dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        var dateStr = monthNames[now.getMonth()] + ' ' + now.getDate() + '일 ' + dayNames[now.getDay()];
        var dateEl = sheet.querySelector('#lsSimClockDate');
        if(dateEl) dateEl.textContent = dateStr;

        // 1) 폰 화면비 월 달력 그리드 렌더링 (#lsSimMonthGridWrap)
        var calWrap = sheet.querySelector('#lsSimMonthGridWrap');
        if(calWrap){
          calWrap.style.display = opts.showMonthGrid ? 'block' : 'none';
          if(opts.showMonthGrid){
            var daysHeader = '<div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:.6rem;font-weight:700;margin-bottom:4px;">' +
              '<span style="color:#f87171;">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span style="color:#60a5fa;">토</span>' +
            '</div>';
            var cellsHtml = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;">';
            payload.monthDates.forEach(function(item, idx){
              var col = idx % 7;
              var textColor = '#94a3b8';
              if(col === 0) textColor = '#f87171';
              if(col === 6) textColor = '#60a5fa';

              if(!item.isCurrent){
                cellsHtml += '<div style="padding:2px 0;font-size:.62rem;opacity:0;">0</div>';
              } else {
                var isToday = item.isToday;
                var cellStyle = 'padding:2px 0;font-size:.62rem;border-radius:6px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;';
                if(isToday){
                  cellStyle += 'background:#0284c7;color:#ffffff;font-weight:800;box-shadow:0 0 8px rgba(56,189,248,0.5);';
                } else {
                  cellStyle += 'color:' + textColor + ';';
                }
                var dotHtml = item.hasSchedule ? '<span style="display:block;width:3px;height:3px;border-radius:50%;background:' + (isToday ? '#ffffff' : '#38bdf8') + ';margin-top:1px;"></span>' : '<span style="display:block;width:3px;height:3px;margin-top:1px;"></span>';
                cellsHtml += '<div style="' + cellStyle + '"><span>' + item.date + '</span>' + dotHtml + '</div>';
              }
            });
            cellsHtml += '</div>';

            calWrap.innerHTML = '' +
              '<div style="background:rgba(15,23,42,0.65);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:8px;margin-bottom:8px;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;padding:0 2px;">' +
                  '<span style="font-size:.68rem;font-weight:700;color:#f8fafc;">📅 ' + payload.curYear + '년 ' + payload.curMonth + '월</span>' +
                  '<span style="font-size:.6rem;color:#38bdf8;font-weight:600;">오늘 ' + payload.todayDate + '일</span>' +
                '</div>' +
                daysHeader +
                cellsHtml +
              '</div>';
          }
        }

        // 2) 목표 달성률 게이지 바 (#lsSimGoalRateWrap)
        var goalWrap = sheet.querySelector('#lsSimGoalRateWrap');
        if(goalWrap){
          goalWrap.style.display = (opts.showGoalRate || opts.showGoals) ? 'block' : 'none';
          if(opts.showGoalRate || opts.showGoals){
            var rateText = '오늘 달성률 ' + payload.ratePct + '%';
            if(payload.totalScheds > 0){
              rateText = '오늘 일정 ' + payload.doneScheds + '/' + payload.totalScheds + ' 완료 (' + payload.ratePct + '%)';
            }
            goalWrap.innerHTML = '' +
              '<div style="margin-bottom:8px;background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:6px 8px;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;font-size:.68rem;font-weight:700;color:#38bdf8;margin-bottom:4px;">' +
                  '<span>🎯 ' + L.escapeHtml(rateText) + '</span>' +
                  '<span>' + payload.ratePct + '%</span>' +
                '</div>' +
                '<div style="height:5px;border-radius:999px;background:rgba(255,255,255,0.12);overflow:hidden;">' +
                  '<div style="height:100%;border-radius:999px;background:linear-gradient(90deg, #38bdf8, #22c55e);width:' + Math.min(100, Math.max(5, payload.ratePct)) + '%;transition:width .3s ease;"></div>' +
                '</div>' +
              '</div>';
          }
        }

        // 3) 오늘의 다음 일정 최대 3개 (#lsSimSchedulesWrap) - 길면 줄바꿈 금지, ... 말줄임표 필수
        var schedWrap = sheet.querySelector('#lsSimSchedulesWrap');
        if(schedWrap){
          schedWrap.style.display = opts.showSchedules ? 'block' : 'none';
          if(opts.showSchedules){
            var listHtml = '';
            if(payload.schedules3 && payload.schedules3.length > 0){
              payload.schedules3.forEach(function(sc){
                listHtml += '<div class="ls-sim-sched-line" style="font-size:.68rem;color:#f1f5f9;line-height:1.45;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;max-width:100%;margin-bottom:2px;" title="' + L.escapeHtml(sc) + '">' + L.escapeHtml(sc) + '</div>';
              });
            } else {
              listHtml = '<div class="ls-sim-sched-line" style="font-size:.66rem;color:#94a3b8;font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;max-width:100%;">🕒 오늘 남은 일정이 없습니다</div>';
            }
            schedWrap.innerHTML = '' +
              '<div style="background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:6px 8px;margin-bottom:8px;">' +
                '<div style="font-size:.65rem;font-weight:700;color:#94a3b8;margin-bottom:3px;display:flex;align-items:center;justify-content:space-between;">' +
                  '<span>🕒 오늘의 다음 일정</span>' +
                  '<span style="font-size:.6rem;color:#38bdf8;">최대 3개</span>' +
                '</div>' +
                listHtml +
              '</div>';
          }
        }

        // 4) 스트릭 & D-Day 칩 (#lsSimMetaWrap)
        var metaWrap = sheet.querySelector('#lsSimMetaWrap');
        if(metaWrap){
          var metaChips = [];
          if(opts.showStreak && payload.streak > 0){
            metaChips.push('<span style="background:rgba(249,115,22,0.2);color:#fdba74;border:1px solid rgba(249,115,22,0.4);border-radius:6px;padding:2px 6px;font-size:.62rem;font-weight:700;">🔥 ' + payload.streak + '일 연속</span>');
          }
          if(opts.showDday && payload.ddayText){
            metaChips.push('<span style="background:rgba(168,85,247,0.2);color:#d8b4fe;border:1px solid rgba(168,85,247,0.4);border-radius:6px;padding:2px 6px;font-size:.62rem;font-weight:700;">⏳ ' + L.escapeHtml(payload.ddayText) + '</span>');
          }
          if(metaChips.length > 0){
            metaWrap.style.display = 'flex';
            metaWrap.innerHTML = metaChips.join(' ');
          } else {
            metaWrap.style.display = 'none';
            metaWrap.innerHTML = '';
          }
        }

        // 알림 카드 보조 텍스트
        var titleEl = sheet.querySelector('#lsSimCardTitle');
        var bodyEl = sheet.querySelector('#lsSimCardBody');
        if(titleEl) titleEl.textContent = payload.title;
        if(bodyEl) bodyEl.textContent = payload.body;
      }

      function updateLiveStatusUI(){
        var badge = sheet.querySelector('#lsLiveStatusBadge');
        var btn = sheet.querySelector('#btnToggleLockScreenTakeover') || sheet.querySelector('#btnToggleLiveLockScreen');
        var isEnabled = !!liveSetting.enabled;

        if(isEnabled){
          if(badge){
            badge.style.background = 'rgba(34, 197, 94, 0.12)';
            badge.style.color = '#16a34a';
            badge.style.border = '1px solid rgba(34, 197, 94, 0.3)';
            badge.textContent = '🟢 폰을 켤 때마다 아워골 전체 화면이 잠금화면을 장악합니다';
          }
          if(btn){
            btn.textContent = '✅ 폰 켤 때마다 잠금화면 전체 장악 중 (클릭하여 끄기)';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-ghost');
          }
        } else {
          if(badge){
            badge.style.background = 'var(--surface-2)';
            badge.style.color = 'var(--ink-soft)';
            badge.style.border = '1px solid var(--border-color)';
            badge.textContent = '⚪ 잠금화면 전체 장악 연동이 꺼져 있습니다';
          }
          if(btn){
            btn.textContent = '⚡ 폰 켤 때마다 잠금화면 전체 장악 (연동 켜기)';
            btn.classList.remove('btn-ghost');
            btn.classList.add('btn-primary');
          }
        }
      }

      // 초기 렌더링
      updateLiveSim();
      updateLiveStatusUI();

      // 라이브 전체 장악 토글 버튼 바인딩 (#TASK-ES-183)
      var handleToggleTakeover = async function(){
        if(!liveSetting.enabled){
          liveSetting.enabled = true;
          if(!L.state.profile.settings) L.state.profile.settings = {};
          L.state.profile.settings.lockScreenLive = liveSetting;
          L.state.profile.settings.lockScreenTakeover = liveSetting;
          L.saveLocalSettings(L.state.profile.id, L.state.profile.settings);
          try { localStorage.setItem('ourgoal_lockscreen_live_v1', JSON.stringify(liveSetting)); } catch(e){}
          try { localStorage.setItem('ourgoal_lockscreen_takeover_v1', JSON.stringify(liveSetting)); } catch(e){}
          await L.saveProfile();
          updateLiveStatusUI();
          try { await L.syncLockScreenLiveCard(true); } catch(e){}
          L.toast('⚡ 폰 켤 때마다 잠금화면 전체 장악 연동이 켜졌습니다!');
        } else {
          liveSetting.enabled = false;
          if(!L.state.profile.settings) L.state.profile.settings = {};
          L.state.profile.settings.lockScreenLive = liveSetting;
          L.state.profile.settings.lockScreenTakeover = liveSetting;
          L.saveLocalSettings(L.state.profile.id, L.state.profile.settings);
          try { localStorage.setItem('ourgoal_lockscreen_live_v1', JSON.stringify(liveSetting)); } catch(e){}
          try { localStorage.setItem('ourgoal_lockscreen_takeover_v1', JSON.stringify(liveSetting)); } catch(e){}
          await L.saveProfile();
          try { await L.closeLockScreenLiveCard(); } catch(e){}
          updateLiveStatusUI();
          L.toast('잠금화면 전체 장악 연동이 해제되었습니다.');
        }
      };

      var btnTakeover = sheet.querySelector('#btnToggleLockScreenTakeover');
      var btnLiveLegacy = sheet.querySelector('#btnToggleLiveLockScreen');
      if(btnTakeover) btnTakeover.onclick = handleToggleTakeover;
      if(btnLiveLegacy && btnLiveLegacy !== btnTakeover) btnLiveLegacy.onclick = handleToggleTakeover;

      // 슬라이더 인터랙션 (#TASK-ES-183)
      var unlockSlider = sheet.querySelector('#lsSimUnlockSlider');
      if(unlockSlider){
        unlockSlider.onclick = function(){
          var knob = sheet.querySelector('#lsSimSliderKnob');
          var text = sheet.querySelector('#lsSimSliderText');
          if(knob) knob.style.transform = 'translateX(180px)';
          if(text) text.textContent = '잠금해제 완료! ✨';
          if(typeof L.triggerHaptic === 'function') L.triggerHaptic('success');
          setTimeout(function(){
            L.toast('🔓 스마트폰 잠금이 해제되었습니다 (홈 화면으로 전환)');
            if(knob) knob.style.transform = 'translateX(0)';
            if(text) text.textContent = '밀어서 잠금해제 ➔';
          }, 350);
        };
      }

      // 안드로이드 APK 패키지 가이드 버튼
      var btnApk = sheet.querySelector('#btnDownloadLockScreenApk');
      if(btnApk){
        btnApk.onclick = function(){
          L.openModal(
            '<div style="padding:16px 8px;text-align:left;">' +
              '<h3 style="margin:0 0 10px;font-size:1.15rem;font-weight:800;color:var(--ink);">🤖 안드로이드 전용 잠금화면 가이드</h3>' +
              '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:14px;font-size:.875rem;line-height:1.6;color:var(--ink);margin-bottom:14px;">' +
                '<p style="margin:0 0 8px;"><strong>1. 백그라운드 서비스 탑재</strong><br>캐시워크와 동일한 안드로이드 네이티브 백그라운드 서비스(LockScreenService) 아키텍처가 android/ 프로젝트에 구축되어 있습니다.</p>' +
                '<p style="margin:0 0 8px;"><strong>2. 다른 앱 위에 표시 권한</strong><br>APK 설치 후 [설정 > 애플리케이션 > 아워골 > 다른 앱 위에 표시: 허용]을 켜시면 화면 켤 때마다 풀스크린이 뜹니다.</p>' +
                '<p style="margin:0;"><strong>3. 웹/PWA 환경</strong><br>웹 브라우저에서는 2번째 탭 [위젯 연동] 및 홈 화면에 바로가기를 추가하여 편리하게 이용하실 수 있습니다.</p>' +
              '</div>' +
              '<button class="btn btn-primary btn-block" id="btnCloseApkGuideModal" style="padding:12px;font-weight:700;border-radius:12px;">확인 완료</button>' +
            '</div>',
            function(guideSheet){
              var closeBtn = guideSheet.querySelector('#btnCloseApkGuideModal');
              if(closeBtn) closeBtn.onclick = L.closeModal;
            }
          );
        };
      }

      // 지금 바로 갱신 버튼
      var btnRefreshLive = sheet.querySelector('#btnRefreshLiveLockScreen');
      if(btnRefreshLive){
        btnRefreshLive.onclick = async function(){
          updateLiveSim();
          if(liveSetting.enabled){
            var ok = await L.syncLockScreenLiveCard(true);
            if(ok){
              L.toast('🔄 잠금화면 실시간 카드가 최신 데이터로 갱신되었습니다!');
            } else {
              L.toast('잠금화면 카드를 갱신했습니다.');
            }
          } else {
            L.toast('잠금화면 시뮬레이터가 최신 상태로 갱신되었습니다. (연동을 켜면 폰에도 반영됩니다)');
          }
        };
      }

      // 체크박스 옵션 변경 바인딩 (클릭 즉시 0ms 실시간 미리보기)
      ['lsOptMonthGrid', 'lsOptGoalRate', 'lsOptGoals', 'lsOptSchedules', 'lsOptStreak', 'lsOptDday'].forEach(function(optId){
        var chk = sheet.querySelector('#' + optId);
        if(chk){
          chk.onchange = async function(){
            if(optId === 'lsOptGoalRate'){
              var mirror = sheet.querySelector('#lsOptGoals');
              if(mirror) mirror.checked = chk.checked;
            } else if(optId === 'lsOptGoals'){
              var mirror2 = sheet.querySelector('#lsOptGoalRate');
              if(mirror2) mirror2.checked = chk.checked;
            }
            liveSetting.showMonthGrid = sheet.querySelector('#lsOptMonthGrid') ? sheet.querySelector('#lsOptMonthGrid').checked : true;
            liveSetting.showGoalRate = sheet.querySelector('#lsOptGoalRate') ? sheet.querySelector('#lsOptGoalRate').checked : true;
            liveSetting.showGoals = liveSetting.showGoalRate;
            liveSetting.showSchedules = sheet.querySelector('#lsOptSchedules') ? sheet.querySelector('#lsOptSchedules').checked : true;
            liveSetting.showStreak = sheet.querySelector('#lsOptStreak') ? sheet.querySelector('#lsOptStreak').checked : true;
            liveSetting.showDday = sheet.querySelector('#lsOptDday') ? sheet.querySelector('#lsOptDday').checked : true;

            if(!L.state.profile.settings) L.state.profile.settings = {};
            L.state.profile.settings.lockScreenLive = liveSetting;
            try { localStorage.setItem('ourgoal_lockscreen_live_v1', JSON.stringify(liveSetting)); } catch(e){}

            // 0ms 즉각 시뮬레이터 갱신 (설정 전 미리보기 보장!)
            updateLiveSim();

            if(liveSetting.enabled){
              await L.syncLockScreenLiveCard(true);
            }
          };
        }
      });

      // 4. 위젯 연동 탭: WebCal 복사 (#TASK-ES-252: HMAC 서명 토큰 자동 주입)
      var btnCopy = sheet.querySelector('#btnCopyLsWebCal');
      var webCalInput = sheet.querySelector('#lsWebCalInput');
      if(webCalInput && typeof L.fetchSignedCalendarToken === 'function'){
        L.fetchSignedCalendarToken().then(function(signedTok){
          if(signedTok && signedTok !== 'demo'){
            webCalInput.value = L.buildWebCalUrl(signedTok, window.location.origin);
          }
        });
      }
      if(btnCopy && webCalInput){
        btnCopy.onclick = function(){
          var val = webCalInput.value;
          if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(val).then(function(){
              L.toast('구독 주소가 클립보드에 복사되었습니다!');
            }).catch(function(){
              webCalInput.select();
              document.execCommand('copy');
              L.toast('구독 주소가 복사되었습니다!');
            });
          } else {
            webCalInput.select();
            document.execCommand('copy');
            L.toast('구독 주소가 복사되었습니다!');
          }
        };
      }

      // .ics 다운로드 버튼
      var btnDlICS = sheet.querySelector('#btnDownloadLsICS');
      if(btnDlICS){
        btnDlICS.onclick = function(){
          var icsData = (typeof L.buildICS === 'function') ? L.buildICS(L.state.profile.records, L.state.profile.goals) : '';
          var blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
          var blobUrl = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = blobUrl;
          a.download = 'ourgoal_calendar.ics';
          a.click();
          setTimeout(function(){ URL.revokeObjectURL(blobUrl); }, 2000);
          L.toast('iCalendar (.ics) 파일이 다운로드되었습니다!');
        };
      }

      // 위젯 기종 가이드 탭 전환
      sheet.querySelectorAll('.ls-widget-device-btn').forEach(function(wBtn){
        wBtn.onclick = function(){
          var dev = wBtn.dataset.wdevice;
          sheet.querySelectorAll('.ls-widget-device-btn').forEach(function(b){
            b.classList.toggle('active', b.dataset.wdevice === dev);
            b.style.background = (b.dataset.wdevice === dev) ? 'var(--surface-2)' : 'transparent';
            b.style.fontWeight = (b.dataset.wdevice === dev) ? '700' : '600';
          });
          sheet.querySelector('#lsWGuideIos').style.display = (dev === 'ios') ? 'block' : 'none';
          sheet.querySelector('#lsWGuideAos').style.display = (dev === 'aos') ? 'block' : 'none';
        };
      });

      // 5. 모닝 알림 탭 토글
      var btnDigest = sheet.querySelector('#btnToggleDigest');
      var selTime = sheet.querySelector('#lsDigestTimeSelect');
      if(btnDigest && selTime){
        btnDigest.onclick = function(){
          if(!digestSetting.enabled){
            if('Notification' in window){
              Notification.requestPermission().then(function(perm){
                if(perm === 'granted'){
                  digestSetting.enabled = true;
                  digestSetting.time = selTime.value;
                  localStorage.setItem('ourgoal_lockscreen_digest', JSON.stringify(digestSetting));
                  btnDigest.textContent = '✅ 아침 잠금화면 알림 켜짐 (클릭하여 끄기)';
                  btnDigest.classList.remove('btn-primary');
                  btnDigest.classList.add('btn-ghost');
                  L.toast('매일 ' + digestSetting.time + '에 잠금화면 모닝 알림이 전송됩니다!');
                  if(typeof L.syncPushSubscription === 'function'){
                    L.syncPushSubscription();
                  }
                } else {
                  L.toast('알림 권한이 허용되지 않았습니다. 브라우저 설정에서 허용해 주세요.');
                }
              });
            } else {
              L.toast('이 브라우저는 웹 푸시 알림을 지원하지 않습니다.');
            }
          } else {
            digestSetting.enabled = false;
            localStorage.setItem('ourgoal_lockscreen_digest', JSON.stringify(digestSetting));
            btnDigest.textContent = '🔔 아침 잠금화면 알림 켜기';
            btnDigest.classList.remove('btn-ghost');
            btnDigest.classList.add('btn-primary');
            L.toast('아침 잠금화면 알림이 해제되었습니다.');
          }
        };

        selTime.onchange = function(){
          if(digestSetting.enabled){
            digestSetting.time = selTime.value;
            localStorage.setItem('ourgoal_lockscreen_digest', JSON.stringify(digestSetting));
            L.toast('알림 시간이 ' + digestSetting.time + '로 변경되었습니다.');
          }
        };
      }
    });
  }

  K.openLockScreenHubModal = openLockScreenHubModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
