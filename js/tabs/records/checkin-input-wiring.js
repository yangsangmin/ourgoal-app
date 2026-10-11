/**
 * OurGoal Checkin Input Wiring (기록 — 체크인 입력칸 둘레의 시동 연결)
 *
 * 앱이 뜰 때 한 번 도는 체크인 입력칸 둘레의 연결 줄 세 개를 함수로 감쌌다.
 * bindQuickRoutineChips — 퀵 루틴 칩 줄(#quickRoutineRow 의 [data-quickroutine])을 누르면 그 글을 체크인 입력칸(#captureInput)에 넣고 기록 단추(#captureSave)를 누른다.
 * startVoiceCheckin — 마이크 단추(#micBtn)로 음성 인식(Web Speech API)을 켜고 끄며 받아 적은 글을 입력칸에 넣는다. 지원하지 않는 브라우저·권한 거부 때는 안내 창(openMicPermissionGuideModal)을 연다.
 * bindCapturePhoto — 사진 첨부 단추(#capturePhotoBtn)로 파일 고르기(#capturePhotoInput)를 열고, 고른 사진을 줄여(compressImage) 미리보기(#capturePhotoPreview)에 보이며 첨부 대기 사진(pendingCapturePhoto)에 담는다.
 * #TASK-ES-640(시동 배선 감싸기 2차 — 체크인 입력 연결 · 팀 목표 댓글 보내기 · 샘플 기록 정리 · 빠른 목표 추가): index.html 인라인 IIFE 의 구간(이전 전 3065~3072 · 3077~3146 · 3156~3184줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 3065~3072줄(#TASK-ES-640 생성기 표지) ---- */
  function bindQuickRoutineChips() { /* [#TASK-ES-640] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.qRoutineRow){
    L.qRoutineRow.querySelectorAll('[data-quickroutine]').forEach(function(chip){
      chip.addEventListener('click', function(){
        document.getElementById('captureInput').value = chip.dataset.quickroutine;
        document.getElementById('captureSave').click();
      });
    });
  }
  } /* bindQuickRoutineChips */

  /* ---- 이전 전 index.html 3077~3146줄(#TASK-ES-640 생성기 표지) ---- */
  function startVoiceCheckin() { /* [#TASK-ES-640] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  /* ============ 음성 체크인 (Web Speech API) ============ */
  (function setupVoiceCheckin(){
    var micBtn = document.getElementById('micBtn');
    if(!micBtn) return;
    var micStatus = document.getElementById('micStatus');
    var SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRecognitionCtor){
      // [#TASK-ES-227] STT 미지원 브라우저/인앱 웹뷰 스마트 폴백
      micBtn.addEventListener('click', function(){
        L.toast('이 브라우저는 음성 인식을 지원하지 않습니다. 텍스트로 바로 입력해보세요.');
        var ta = document.getElementById('captureInput');
        if(ta) ta.focus();
        if(typeof L.openMicPermissionGuideModal === 'function') L.openMicPermissionGuideModal('unsupported');
      });
      return;
    }
    var recognition = new SpeechRecognitionCtor();
    recognition.lang = 'ko-KR';
    recognition.interimResults = true;
    recognition.continuous = false;
    var listening = false;
    var baseText = '';
    micBtn.addEventListener('click', async function(){
      if(listening){ recognition.stop(); return; }
      var ta = document.getElementById('captureInput');
      baseText = ta ? ta.value : '';
      if(baseText && !/\s$/.test(baseText)) baseText += ' ';

      // 권한 자가진단
      try {
        if(navigator.permissions && navigator.permissions.query){
          var pStatus = await navigator.permissions.query({ name: 'microphone' });
          if(pStatus && pStatus.state === 'denied'){
            if(typeof L.openMicPermissionGuideModal === 'function') L.openMicPermissionGuideModal('checkin');
            return;
          }
        }
      } catch(permErr){}

      try{ recognition.start(); } catch(e){
        console.warn('SpeechRecognition start failed:', e);
        if(typeof L.openMicPermissionGuideModal === 'function') L.openMicPermissionGuideModal('checkin');
      }
    });
    recognition.addEventListener('start', function(){
      listening = true;
      micBtn.classList.add('listening');
      if(micStatus) micStatus.hidden = false;
    });
    recognition.addEventListener('end', function(){
      listening = false;
      micBtn.classList.remove('listening');
      if(micStatus) micStatus.hidden = true;
    });
    recognition.addEventListener('error', function(e){
      listening = false;
      micBtn.classList.remove('listening');
      if(micStatus) micStatus.hidden = true;
      if(e.error==='not-allowed' || e.error==='service-not-allowed'){
        L.toast('마이크 사용 권한이 필요해요');
        if(typeof L.openMicPermissionGuideModal === 'function') L.openMicPermissionGuideModal('checkin');
      }
    });
    recognition.addEventListener('result', function(e){
      var transcript = '';
      for(var i=0;i<e.results.length;i++) transcript += e.results[i][0].transcript;
      var ta = document.getElementById('captureInput');
      if(ta) ta.value = baseText + transcript;
    });
  })();
  } /* startVoiceCheckin */

  /* ---- 이전 전 index.html 3156~3184줄(#TASK-ES-640 생성기 표지) ---- */
  function bindCapturePhoto() { /* [#TASK-ES-640] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(L.capturePhotoBtn && L.capturePhotoInput){
    L.capturePhotoBtn.addEventListener('click', function(){
      L.capturePhotoInput.click();
    });
    L.capturePhotoInput.addEventListener('change', function(e){
      var file = e.target.files && e.target.files[0];
      if(!file) return;
      L.compressImage(file, 1080, 0.82, function(compressedDataUrl){
        L.pendingCapturePhoto = compressedDataUrl;
        if(L.capturePhotoPreview){
          L.capturePhotoPreview.style.display = 'block';
          L.capturePhotoPreview.innerHTML = '<div class="photo-preview-wrap" style="position:relative;display:inline-block;margin:6px 0;">'
            + '<img src="' + compressedDataUrl + '" class="photo-preview-img" style="max-height:120px;border-radius:10px;border:1px solid var(--rule);cursor:pointer;" />'
            + '<button type="button" class="photo-preview-del" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:.6875rem;line-height:22px;text-align:center;padding:0;">✕</button>'
            + '</div>';
          L.capturePhotoPreview.querySelector('.photo-preview-img').onclick = function(){
            L.openPhotoViewerModal(L.pendingCapturePhoto);
          };
          L.capturePhotoPreview.querySelector('.photo-preview-del').onclick = function(ev){
            ev.stopPropagation();
            L.pendingCapturePhoto = null;
            L.capturePhotoPreview.innerHTML = '';
            L.capturePhotoPreview.style.display = 'none';
            L.capturePhotoInput.value = '';
          };
        }
      });
    });
  }
  } /* bindCapturePhoto */

  K.bindQuickRoutineChips = bindQuickRoutineChips;
  K.startVoiceCheckin = startVoiceCheckin;
  K.bindCapturePhoto = bindCapturePhoto;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
