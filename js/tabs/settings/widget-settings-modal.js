/**
 * OurGoal Widget Settings Modal (설정 탭 — 바탕화면 위젯 설정 창)
 *
 * #TASK-ES-448 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G168.
 *   옮긴 선언(이전 전 줄): openWidgetSettingsModal(33479~33585)
 * openWidgetSettingsModal = 기기 바탕화면 위젯 종류·크기를 고르고 실시간 미리보기를 보여 주는 창(#TASK-ES-180). 위젯 단추 전역 클릭 위임 문은 index.html 제자리에 남았다(시험지 desktop-widget-suite 는 #TASK-ES-447 로 인라인 합본을 읽는다).
 * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.
 * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalSettingsKit = global.OurgoalSettingsKit || {};

  // 📱 [#TASK-ES-180], [62] 기기 바탕화면 위젯 설정 & 미리보기 모달 함수
  function openWidgetSettingsModal(){
    var currentType = 'calendar';
    var currentSize = 'standard';

    function getWidgetUrl(type, size){
      return 'widget.html?type=' + type + '&size=' + size;
    }

    L.openModal(
      '<h3>📱 기기 바탕화면 위젯 설정 & 미리보기</h3>' +
      '<p class="muted" style="margin:-8px 0 14px;">앱을 켜지 않고도 기기 바탕화면에서 오늘 할 일과 목표를 확인하세요.</p>' +
      '<div style="margin-bottom:12px;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">1. 위젯 종류 선택 (3종)</div>' +
        '<div style="display:flex;gap:6px;" id="widgetTypeTabs">' +
          '<button type="button" class="btn btn-sm btn-primary" data-wtype="calendar" style="flex:1;">📅 일정</button>' +
          '<button type="button" class="btn btn-sm btn-ghost" data-wtype="goals" style="flex:1;">🎯 목표</button>' +
          '<button type="button" class="btn btn-sm btn-ghost" data-wtype="records" style="flex:1;">⏱️ 기록</button>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:14px;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">2. 위젯 크기 선택 (3구성)</div>' +
        '<div style="display:flex;gap:6px;" id="widgetSizeTabs">' +
          '<button type="button" class="btn btn-sm btn-ghost" data-wsize="compact" style="flex:1;">▫️ 컴팩트</button>' +
          '<button type="button" class="btn btn-sm btn-primary" data-wsize="standard" style="flex:1;">◽ 기본형</button>' +
          '<button type="button" class="btn btn-sm btn-ghost" data-wsize="detail" style="flex:1;">◻️ 상세형</button>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:14px;border:1px solid var(--rule);border-radius:14px;overflow:hidden;background:var(--card2);">' +
        '<div style="padding:8px 12px;background:var(--surface-2);border-bottom:1px solid var(--rule);display:flex;align-items:center;justify-content:space-between;">' +
          '<span style="font-size:.75rem;font-weight:700;color:var(--ink);">실시간 위젯 미리보기</span>' +
          '<span id="widgetPreviewUrlText" style="font-size:.6875rem;color:var(--ink-faint);">widget.html?type=calendar&size=standard</span>' +
        '</div>' +
        '<div style="display:flex;justify-content:center;padding:16px;background:rgba(0,0,0,0.02);">' +
          '<iframe id="widgetPreviewIframe" src="widget.html?type=calendar&size=standard" style="width:340px;height:240px;border:none;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.08);background:#fff;"></iframe>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btnOpenWidgetPopup" style="flex:1;font-weight:700;">↗️ 독립 위젯 창 띄우기</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btnCopyWidgetUrl" style="flex:1;font-weight:700;">📋 위젯 URL 복사</button>' +
      '</div>' +
      '<div style="padding:10px 12px;background:var(--surface-2);border-radius:12px;font-size:.75rem;color:var(--ink-soft);line-height:1.5;">' +
        '💡 <b>스마트폰/PC 바탕화면 등록법:</b><br>' +
        '1. [독립 위젯 창 띄우기] 클릭 후 브라우저 메뉴(⋮ 또는 공유)에서 <b>[홈 화면에 추가]</b>를 누르면 바탕화면 독립 위젯으로 동작합니다.<br>' +
        '2. PWA 앱 설치 시 앱 아이콘을 길게 누르면 <b>일정/목표/기록 3종 원터치 숏컷</b>을 즉시 쓸 수 있습니다.' +
      '</div>' +
      '<div class="modal-actions" style="margin-top:14px;"><button class="btn btn-primary" id="widgetModalClose" type="button" style="width:100%;">확인 완료</button></div>',
      function(sheet){
        var iframe = sheet.querySelector('#widgetPreviewIframe');
        var urlText = sheet.querySelector('#widgetPreviewUrlText');

        function updatePreview(){
          var url = getWidgetUrl(currentType, currentSize);
          if(iframe) iframe.src = url;
          if(urlText) urlText.textContent = url;
        }

        sheet.querySelectorAll('#widgetTypeTabs button').forEach(function(btn){
          btn.addEventListener('click', function(){
            sheet.querySelectorAll('#widgetTypeTabs button').forEach(function(b){
              b.className = 'btn btn-sm btn-ghost';
            });
            btn.className = 'btn btn-sm btn-primary';
            currentType = btn.getAttribute('data-wtype');
            updatePreview();
          });
        });

        sheet.querySelectorAll('#widgetSizeTabs button').forEach(function(btn){
          btn.addEventListener('click', function(){
            sheet.querySelectorAll('#widgetSizeTabs button').forEach(function(b){
              b.className = 'btn btn-sm btn-ghost';
            });
            btn.className = 'btn btn-sm btn-primary';
            currentSize = btn.getAttribute('data-wsize');
            updatePreview();
          });
        });

        var btnPopup = sheet.querySelector('#btnOpenWidgetPopup');
        if(btnPopup){
          btnPopup.addEventListener('click', function(){
            var url = getWidgetUrl(currentType, currentSize);
            window.open(url, 'OurgoalWidget', 'width=380,height=480,menubar=no,toolbar=no,location=no,status=no');
          });
        }

        var btnCopy = sheet.querySelector('#btnCopyWidgetUrl');
        if(btnCopy){
          btnCopy.addEventListener('click', function(){
            var url = window.location.origin + '/' + getWidgetUrl(currentType, currentSize);
            if(navigator.clipboard && navigator.clipboard.writeText){
              navigator.clipboard.writeText(url).then(function(){
                L.toast('위젯 URL이 클립보드에 복사되었습니다! 📋');
              });
            } else {
              L.toast('위젯 URL: ' + url);
            }
          });
        }

        var btnClose = sheet.querySelector('#widgetModalClose');
        if(btnClose) btnClose.addEventListener('click', L.closeModal);
      }
    );
  }

  K.openWidgetSettingsModal = openWidgetSettingsModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
