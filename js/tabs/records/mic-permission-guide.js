/**
 * OurGoal Mic Permission Guide (기록 — 마이크 권한 자가 진단·허용 안내 창)
 *
 * 「🎙️ 마이크 권한 거부 상태 자가 진단 및 1초 권한 허용 모달 (#TASK-ES-227)」 묶음의 openMicPermissionGuideModal. window 노출 문은 원래 자리.
 * #TASK-ES-556(인라인 3단계 구역 Z6 표준 3): index.html 인라인 IIFE 의 구간(이전 전 4997~5230줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ---- 이전 전 index.html 4997~5230줄(#TASK-ES-556 생성기 표지) ---- */
  function openMicPermissionGuideModal(context){
    var existing = document.getElementById('micPermissionGuideModal');
    if(existing) existing.remove();

    var isIos = /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent) && (navigator.maxTouchPoints > 1 || /iphone|ipad|ipod/i.test(navigator.userAgent));
    var activeTab = isIos ? 'ios' : 'android';

    var modal = document.createElement('div');
    modal.id = 'micPermissionGuideModal';
    modal.className = 'mic-perm-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', '마이크 권한 1초 허용 가이드');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.72);z-index:100010;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(6px);';

    function renderGuideContent(){
      var iosActive = activeTab === 'ios';
      return '<div class="card mic-perm-card" style="width:100%;max-width:420px;max-height:92vh;overflow-y:auto;background:var(--card);border:1px solid var(--rule);border-radius:20px;padding:20px;box-shadow:0 20px 40px rgba(0,0,0,0.35);position:relative;display:flex;flex-direction:column;gap:13px;box-sizing:border-box;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div style="width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#f43f5e,#e11d48);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;box-shadow:0 4px 10px rgba(244,63,94,0.35);">🎙️</div>' +
            '<div>' +
              '<h3 style="margin:0;font-size:1.05rem;font-weight:800;color:var(--ink);">마이크 권한 허용 가이드</h3>' +
              '<p style="margin:2px 0 0;font-size:0.75rem;color:var(--ink-soft);">설정에서 1초 만에 마이크를 켜보세요</p>' +
            '</div>' +
          '</div>' +
          '<button type="button" id="btnCloseMicGuide" class="btn btn-ghost btn-sm" style="min-width:36px;min-height:36px;padding:0;display:flex;align-items:center;justify-content:center;font-size:1.25rem;border-radius:50%;color:var(--ink-soft);" aria-label="닫기">×</button>' +
        '</div>' +

        '<div class="mic-perm-tab-bar" style="display:flex;gap:6px;background:var(--card2);padding:4px;border-radius:12px;border:1px solid var(--rule);">' +
          '<button type="button" id="btnTabIosSafari" class="btn btn-sm ' + (iosActive ? 'btn-primary' : 'btn-ghost') + '" style="flex:1;min-height:38px;font-size:0.8125rem;font-weight:700;border-radius:9px;padding:4px 8px;display:flex;align-items:center;justify-content:center;gap:4px;">' +
            '<span>🍎 iOS Safari</span>' +
          '</button>' +
          '<button type="button" id="btnTabAndroidChrome" class="btn btn-sm ' + (!iosActive ? 'btn-primary' : 'btn-ghost') + '" style="flex:1;min-height:38px;font-size:0.8125rem;font-weight:700;border-radius:9px;padding:4px 8px;display:flex;align-items:center;justify-content:center;gap:4px;">' +
            '<span>🤖 Android Chrome</span>' +
          '</button>' +
        '</div>' +

        '<div id="micGuideStepWrap" style="background:var(--card2);border-radius:14px;padding:12px;border:1px solid var(--rule);display:flex;flex-direction:column;gap:10px;">' +
          (iosActive ? 
            ('<div class="mic-perm-3cut-gallery" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:6px;">' +
              '<div style="background:var(--card);border:1.5px solid var(--rule);border-radius:12px;padding:8px 5px;display:flex;flex-direction:column;align-items:center;text-align:center;box-shadow:0 2px 5px rgba(0,0,0,0.03);">' +
                '<span style="font-size:0.625rem;font-weight:800;color:var(--primary);background:rgba(99,102,241,0.12);padding:1px 6px;border-radius:12px;margin-bottom:5px;">STEP 1</span>' +
                '<div style="width:100%;height:52px;background:var(--card2);border:1px solid var(--rule);border-radius:8px;padding:3px;display:flex;flex-direction:column;justify-content:center;align-items:center;margin-bottom:5px;box-sizing:border-box;">' +
                  '<div style="width:100%;height:26px;background:#fff;border:1.5px solid #2563eb;border-radius:13px;display:flex;align-items:center;justify-content:space-between;padding:0 4px;box-shadow:0 0 0 2px rgba(37,99,235,0.2);box-sizing:border-box;">' +
                    '<span style="background:#2563eb;color:#fff;border-radius:4px;padding:1px 3px;font-weight:900;font-size:0.625rem;">aA 👆</span>' +
                    '<span style="font-size:0.5rem;color:#64748b;font-weight:600;">ourgoal</span>' +
                    '<span style="font-size:0.5625rem;color:#94a3b8;">🔄</span>' +
                  '</div>' +
                '</div>' +
                '<span style="font-size:0.71875rem;font-weight:700;color:var(--ink);line-height:1.25;">주소창 좌측<br><b style="color:#2563eb;">[aA]</b> 터치</span>' +
              '</div>' +
              '<div style="background:var(--card);border:1.5px solid var(--rule);border-radius:12px;padding:8px 5px;display:flex;flex-direction:column;align-items:center;text-align:center;box-shadow:0 2px 5px rgba(0,0,0,0.03);">' +
                '<span style="font-size:0.625rem;font-weight:800;color:var(--primary);background:rgba(99,102,241,0.12);padding:1px 6px;border-radius:12px;margin-bottom:5px;">STEP 2</span>' +
                '<div style="width:100%;height:52px;background:var(--card2);border:1px solid var(--rule);border-radius:8px;padding:3px;display:flex;flex-direction:column;justify-content:center;gap:2px;margin-bottom:5px;box-sizing:border-box;">' +
                  '<div style="font-size:0.45rem;color:#94a3b8;padding-left:2px;white-space:nowrap;overflow:hidden;">텍스트 크기</div>' +
                  '<div style="background:#2563eb;color:#fff;border-radius:4px;padding:2px 3px;font-size:0.5rem;font-weight:800;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(37,99,235,0.25);">' +
                    '<span>⚙️ 웹설정</span>' +
                    '<span>✓</span>' +
                  '</div>' +
                '</div>' +
                '<span style="font-size:0.71875rem;font-weight:700;color:var(--ink);line-height:1.25;">메뉴 목록 중<br><b style="color:#2563eb;">[웹설정]</b></span>' +
              '</div>' +
              '<div style="background:var(--card);border:1.5px solid var(--rule);border-radius:12px;padding:8px 5px;display:flex;flex-direction:column;align-items:center;text-align:center;box-shadow:0 2px 5px rgba(0,0,0,0.03);">' +
                '<span style="font-size:0.625rem;font-weight:800;color:#10b981;background:rgba(16,185,129,0.12);padding:1px 6px;border-radius:12px;margin-bottom:5px;">STEP 3</span>' +
                '<div style="width:100%;height:52px;background:var(--card2);border:1px solid var(--rule);border-radius:8px;padding:3px;display:flex;flex-direction:column;justify-content:center;align-items:center;margin-bottom:5px;box-sizing:border-box;">' +
                  '<div style="width:100%;background:#fff;border:1.5px solid #10b981;border-radius:4px;padding:2px 3px;display:flex;align-items:center;justify-content:space-between;box-sizing:border-box;">' +
                    '<span style="font-size:0.5rem;color:#334155;font-weight:700;">🎙️ 마이크</span>' +
                    '<span style="background:#10b981;color:#fff;font-size:0.5rem;font-weight:800;padding:1px 3px;border-radius:2px;">허용 ✓</span>' +
                  '</div>' +
                  '<span style="font-size:0.45rem;color:#10b981;font-weight:700;margin-top:2px;">우측상단 [완료]</span>' +
                '</div>' +
                '<span style="font-size:0.71875rem;font-weight:700;color:var(--ink);line-height:1.25;">마이크 항목<br><b style="color:#10b981;">[허용]</b> 전환</span>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:6px;padding-top:8px;border-top:1px dashed var(--rule);">' +
              '<div style="display:flex;align-items:flex-start;gap:8px;">' +
                '<div style="width:20px;height:20px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.6875rem;font-weight:800;flex-shrink:0;">1</div>' +
                '<div style="font-size:0.8125rem;color:var(--ink);line-height:1.4;">Safari 주소창 좌측 <b>[가 / aA]</b> 또는 <b>[설정]</b> 아이콘을 터치하세요.</div>' +
              '</div>' +
              '<div style="display:flex;align-items:flex-start;gap:8px;">' +
                '<div style="width:20px;height:20px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.6875rem;font-weight:800;flex-shrink:0;">2</div>' +
                '<div style="font-size:0.8125rem;color:var(--ink);line-height:1.4;">나타난 메뉴에서 <b>[웹사이트 설정]</b>을 선택하세요.</div>' +
              '</div>' +
              '<div style="display:flex;align-items:flex-start;gap:8px;">' +
                '<div style="width:20px;height:20px;border-radius:50%;background:#10b981;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.6875rem;font-weight:800;flex-shrink:0;">3</div>' +
                '<div style="font-size:0.8125rem;color:var(--ink);line-height:1.4;">마이크 항목을 <b>[허용]</b>으로 변경한 뒤 창을 닫아주세요.</div>' +
              '</div>' +
            '</div>') :
            ('<div class="mic-perm-3cut-gallery" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:6px;">' +
              '<div style="background:var(--card);border:1.5px solid var(--rule);border-radius:12px;padding:8px 5px;display:flex;flex-direction:column;align-items:center;text-align:center;box-shadow:0 2px 5px rgba(0,0,0,0.03);">' +
                '<span style="font-size:0.625rem;font-weight:800;color:var(--primary);background:rgba(99,102,241,0.12);padding:1px 6px;border-radius:12px;margin-bottom:5px;">STEP 1</span>' +
                '<div style="width:100%;height:52px;background:var(--card2);border:1px solid var(--rule);border-radius:8px;padding:3px;display:flex;flex-direction:column;justify-content:center;align-items:center;margin-bottom:5px;box-sizing:border-box;">' +
                  '<div style="width:100%;height:26px;background:#fff;border:1.5px solid #0284c7;border-radius:5px;display:flex;align-items:center;justify-content:space-between;padding:0 4px;box-shadow:0 0 0 2px rgba(2,132,199,0.2);box-sizing:border-box;">' +
                    '<span style="background:#0284c7;color:#fff;border-radius:3px;padding:1px 3px;font-weight:900;font-size:0.625rem;">🔒 👆</span>' +
                    '<span style="font-size:0.5rem;color:#475569;font-weight:600;">ourgoal</span>' +
                    '<span style="font-size:0.5625rem;color:#94a3b8;">⋮</span>' +
                  '</div>' +
                '</div>' +
                '<span style="font-size:0.71875rem;font-weight:700;color:var(--ink);line-height:1.25;">주소창 좌측<br><b style="color:#0284c7;">[자물쇠 🔒]</b> 터치</span>' +
              '</div>' +
              '<div style="background:var(--card);border:1.5px solid var(--rule);border-radius:12px;padding:8px 5px;display:flex;flex-direction:column;align-items:center;text-align:center;box-shadow:0 2px 5px rgba(0,0,0,0.03);">' +
                '<span style="font-size:0.625rem;font-weight:800;color:var(--primary);background:rgba(99,102,241,0.12);padding:1px 6px;border-radius:12px;margin-bottom:5px;">STEP 2</span>' +
                '<div style="width:100%;height:52px;background:var(--card2);border:1px solid var(--rule);border-radius:8px;padding:3px;display:flex;flex-direction:column;justify-content:center;gap:2px;margin-bottom:5px;box-sizing:border-box;">' +
                  '<div style="font-size:0.45rem;color:#10b981;font-weight:700;padding-left:2px;white-space:nowrap;overflow:hidden;">🛡️ 안전함</div>' +
                  '<div style="background:#0284c7;color:#fff;border-radius:4px;padding:2px 3px;font-size:0.5rem;font-weight:800;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(2,132,199,0.25);">' +
                    '<span>⚙️ 권한</span>' +
                    '<span>›</span>' +
                  '</div>' +
                '</div>' +
                '<span style="font-size:0.71875rem;font-weight:700;color:var(--ink);line-height:1.25;">사이트 정보 중<br><b style="color:#0284c7;">[권한]</b> 선택</span>' +
              '</div>' +
              '<div style="background:var(--card);border:1.5px solid var(--rule);border-radius:12px;padding:8px 5px;display:flex;flex-direction:column;align-items:center;text-align:center;box-shadow:0 2px 5px rgba(0,0,0,0.03);">' +
                '<span style="font-size:0.625rem;font-weight:800;color:#10b981;background:rgba(16,185,129,0.12);padding:1px 6px;border-radius:12px;margin-bottom:5px;">STEP 3</span>' +
                '<div style="width:100%;height:52px;background:var(--card2);border:1px solid var(--rule);border-radius:8px;padding:3px;display:flex;flex-direction:column;justify-content:center;align-items:center;margin-bottom:5px;box-sizing:border-box;">' +
                  '<div style="width:100%;background:#fff;border:1.5px solid #10b981;border-radius:4px;padding:2px 3px;display:flex;align-items:center;justify-content:space-between;box-sizing:border-box;">' +
                    '<span style="font-size:0.5rem;color:#334155;font-weight:700;">🎙️ 마이크</span>' +
                    '<div style="width:20px;height:10px;background:#10b981;border-radius:5px;position:relative;display:flex;align-items:center;justify-content:flex-end;padding:0 1px;">' +
                      '<div style="width:7px;height:7px;background:#fff;border-radius:50%;box-shadow:0 1px 2px rgba(0,0,0,0.2);"></div>' +
                    '</div>' +
                  '</div>' +
                  '<span style="font-size:0.45rem;color:#10b981;font-weight:700;margin-top:2px;">[켜기 (허용)]</span>' +
                '</div>' +
                '<span style="font-size:0.71875rem;font-weight:700;color:var(--ink);line-height:1.25;">마이크 스위치<br><b style="color:#10b981;">[켜기]</b> 토글</span>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:6px;padding-top:8px;border-top:1px dashed var(--rule);">' +
              '<div style="display:flex;align-items:flex-start;gap:8px;">' +
                '<div style="width:20px;height:20px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.6875rem;font-weight:800;flex-shrink:0;">1</div>' +
                '<div style="font-size:0.8125rem;color:var(--ink);line-height:1.4;">Chrome 주소창 좌측 <b>[자물쇠 🔒 / 튠 아이콘]</b>을 터치하세요.</div>' +
              '</div>' +
              '<div style="display:flex;align-items:flex-start;gap:8px;">' +
                '<div style="width:20px;height:20px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.6875rem;font-weight:800;flex-shrink:0;">2</div>' +
                '<div style="font-size:0.8125rem;color:var(--ink);line-height:1.4;"><b>[권한]</b> 메뉴로 진입하세요.</div>' +
              '</div>' +
              '<div style="display:flex;align-items:flex-start;gap:8px;">' +
                '<div style="width:20px;height:20px;border-radius:50%;background:#10b981;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.6875rem;font-weight:800;flex-shrink:0;">3</div>' +
                '<div style="font-size:0.8125rem;color:var(--ink);line-height:1.4;">마이크 스위치를 <b>[켜기 (허용)]</b>로 변경해주세요.</div>' +
              '</div>' +
            '</div>')
          ) +
          '<div style="margin-top:2px;padding:8px 10px;background:rgba(245,158,11,0.08);border-radius:8px;border:1px solid rgba(245,158,11,0.25);font-size:0.75rem;color:var(--ink-soft);line-height:1.35;">' +
            '💡 <b>인앱 브라우저(카카오톡/인스타 등) 알림:</b><br>음성 기능이 제한될 수 있습니다. 우측 상단 메뉴에서 <b>[다른 브라우저로 열기]</b>를 선택하시면 원활히 작동합니다.' +
          '</div>' +
        '</div>' +

        '<div style="display:flex;flex-direction:column;gap:8px;">' +
          '<button type="button" id="btnRetryMicPermission" class="btn btn-primary" style="width:100%;min-height:44px;font-size:0.875rem;font-weight:700;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:6px;">' +
            '<span>🎙️ 권한 다시 확인 & 음성 시작</span>' +
          '</button>' +
          '<button type="button" id="btnFallbackToText" class="btn btn-ghost" style="width:100%;min-height:44px;font-size:0.84rem;font-weight:600;border-radius:12px;border:1px solid var(--rule);display:flex;align-items:center;justify-content:center;gap:6px;">' +
            '<span>⌨️ 텍스트로 바로 입력하기</span>' +
          '</button>' +
        '</div>' +
      '</div>';
    }

    modal.innerHTML = renderGuideContent();
    document.body.appendChild(modal);
    if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(15);
    else if(typeof L.triggerHaptic === 'function') L.triggerHaptic(15);

    function wireModalEvents(){
      var btnClose = modal.querySelector('#btnCloseMicGuide');
      if(btnClose){
        btnClose.onclick = function(){
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          modal.remove();
        };
      }

      var btnIos = modal.querySelector('#btnTabIosSafari');
      var btnAndroid = modal.querySelector('#btnTabAndroidChrome');
      if(btnIos && btnAndroid){
        btnIos.onclick = function(){
          if(activeTab === 'ios') return;
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          activeTab = 'ios';
          modal.innerHTML = renderGuideContent();
          wireModalEvents();
        };
        btnAndroid.onclick = function(){
          if(activeTab === 'android') return;
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          activeTab = 'android';
          modal.innerHTML = renderGuideContent();
          wireModalEvents();
        };
      }

      var btnRetry = modal.querySelector('#btnRetryMicPermission');
      if(btnRetry){
        btnRetry.onclick = async function(){
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(15);
          btnRetry.disabled = true;
          btnRetry.textContent = '권한 확인 중…';
          try {
            if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
              var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach(function(t){ t.stop(); });
              modal.remove();
              L.toast('마이크 권한이 정상 허용되었습니다! 🎉');
              var micBtn = document.getElementById('micBtn');
              if(micBtn) micBtn.click();
              return;
            }
          } catch(err){
            console.warn('getUserMedia retry failed:', err);
          }
          btnRetry.disabled = false;
          btnRetry.textContent = '🎙️ 권한 다시 확인 & 음성 시작';
          L.toast('아직 권한이 허용되지 않았습니다. 브라우저 설정을 확인해주세요.');
        };
      }

      var btnText = modal.querySelector('#btnFallbackToText');
      if(btnText){
        btnText.onclick = function(){
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          modal.remove();
          var ta = document.getElementById('captureInput');
          if(ta){
            ta.focus();
            ta.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        };
      }
    }

    wireModalEvents();
    modal.addEventListener('click', function(e){
      if(e.target === modal) modal.remove();
    });
  }

  K.openMicPermissionGuideModal = openMicPermissionGuideModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
