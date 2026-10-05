/**
 * OurGoal Calendar Day Background Picker (일정 탭 — 일자별 배경 사진 지정 창)
 *
 * #TASK-ES-444 (인라인 스크립트 세포화 P1): index.html 인라인 IIFE 에서 옮긴 묶음 —
 *   compressCalendarBgImage · openCalendarDayBgPickerModal(이전 전 10524~10748줄 · 구획 「[#TASK-ES-153 & #TASK-ES-155] 캘린더 일자별 배경 사진 지정 모달」)
 * 묶음의 함수 선언을 글자 그대로 옮겼다(묶음 전체가 함수뿐이면 구획 주석까지 통째로). 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>,
 * 같은 키트의 다른 세포 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓). 로드 중 바로 도는 문·최상위 변수는 index.html 원래 자리에 남았다.
 * index.html 은 IIFE 머리에서 이 키트의 함수 중 인라인에서 부르는 것을 같은 이름으로 가져와 부른다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: #TASK-ES-423. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalCalendarKit = global.OurgoalCalendarKit || {};

  function compressCalendarBgImage(file, callback){
    if(!file) return callback(new Error('파일이 없습니다.'));
    var reader = new FileReader();
    reader.onload = function(e){
      var rawResult = e.target.result;
      var img = new Image();
      img.onload = function(){
        try {
          var canvas = document.createElement('canvas');
          var maxDim = 800;
          var w = img.width || 800;
          var h = img.height || 600;
          if(w > maxDim || h > maxDim){
            if(w > h){
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          var compressed = canvas.toDataURL('image/jpeg', 0.82);
          callback(null, compressed || rawResult);
        } catch(err) {
          callback(null, rawResult);
        }
      };
      img.onerror = function(){
        callback(null, rawResult);
      };
      img.src = rawResult;
    };
    reader.onerror = function(err){ callback(err); };
    reader.readAsDataURL(file);
  }

  function openCalendarDayBgPickerModal(selectedDate, fromHub){
    var sel = selectedDate || L.state.calSelectedDate || L.isoDate(new Date());
    var isFromHub = (fromHub !== false && fromHub !== undefined) ? !!fromHub : false;
    L.state.profile = L.state.profile || {};
    L.state.profile.calendarDayBackgrounds = L.state.profile.calendarDayBackgrounds || {};
    var rawBg = L.state.profile.calendarDayBackgrounds[sel] || '';
    var currentBgList = Array.isArray(rawBg) ? rawBg.slice() : (rawBg ? [rawBg] : []);
    var tempBgList = currentBgList.slice();
    var currentBg = currentBgList.length > 0 ? (currentBgList.length === 1 ? currentBgList[0] : currentBgList) : '';
    var tempBg = currentBgList.length === 1 ? currentBgList[0] : (currentBgList[0] || '');

    var previewLayerHtml = '';
    if(tempBgList.length >= 2){
      previewLayerHtml = '<div class="cal-bg-preview-layer" id="calDayBgPreviewLayer" style="display:flex;flex-direction:column;pointer-events:none;"><div style="flex:1;background-image:url(\'' + L.escapeHtml(tempBgList[0]) + '\');background-size:cover;background-position:center;opacity:0.5;"></div><div style="flex:1;background-image:url(\'' + L.escapeHtml(tempBgList[1]) + '\');background-size:cover;background-position:center;opacity:0.5;border-top:1px solid rgba(255,255,255,0.4);"></div></div>';
    } else if(tempBgList.length === 1){
      previewLayerHtml = '<div class="cal-bg-preview-layer" id="calDayBgPreviewLayer" style="background-image:url(\'' + L.escapeHtml(tempBgList[0]) + '\');"></div>';
    } else {
      previewLayerHtml = '<div class="cal-bg-preview-layer" id="calDayBgPreviewLayer" style="display:none;"></div>';
    }

    var modalHtml =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        (isFromHub ? '<span class="dm-back" id="calDayBgBackToHubBtn" style="cursor:pointer;margin:0;font-size:.875rem;color:var(--ink);font-weight:700;">‹ ' + sel + ' 일정 목록으로</span>' : '<h3 style="margin:0;font-size:1.1rem;color:var(--ink);">🖼️ 이날의 배경사진 고르기</h3>') +
        '<span class="faint" style="font-weight:600;font-size:.8125rem;">' + L.escapeHtml(sel) + '</span>' +
      '</div>' +
      (isFromHub ? '<h3 style="margin:0 0 8px;font-size:1.1rem;color:var(--ink);">🖼️ 이날의 배경사진 고르기</h3>' : '') +
      '<p class="faint" style="font-size:.8125rem;margin:0 0 12px;line-height:1.4;">' +
        '최대 2장까지 등록 가능하며, 2장 등록 시 <b>상하 50% 분할</b>로 채워집니다.<br>' +
        '<b>50% 투명도</b>가 적용되어 기존에 적은 일정들이 선명하게 보입니다.' +
      '</p>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
        '<span id="calDayBgCountBadge" style="font-size:.75rem;font-weight:700;color:var(--brand);">' + (tempBgList.length > 0 ? (tempBgList.length + ' / 2장 등록됨' + (tempBgList.length === 2 ? ' (상하 50% 분할)' : ' (전체 채움)')) : '사진 미등록') + '</span>' +
      '</div>' +
      '<div class="cal-bg-preview-wrap" id="calDayBgPreviewWrap">' +
        previewLayerHtml +
        '<div class="cal-bg-preview-content" id="calDayBgPreviewContent">' +
          '<div style="font-size:1.1rem;font-weight:700;color:var(--ink);margin-bottom:4px;">' + (sel.split('-')[2] || '17') + '</div>' +
          '<div style="display:inline-block;background:var(--surface-2);color:var(--ink);padding:2px 8px;border-radius:6px;font-size:.75rem;font-weight:600;margin-bottom:4px;border:1px solid var(--rule);">' +
            '🎯 오늘의 핵심 일정' +
          '</div>' +
          '<div style="font-size:.75rem;color:var(--ink-soft);">' +
            (tempBgList.length > 0 ? '미리보기 적용 중 (투명도 50%)' : '사진을 선택하면 미리보기가 나타납니다.') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<input type="file" id="calDayBgFileInput" accept="image/*" style="display:none;">' +
      '<div style="display:flex;gap:8px;margin-bottom:14px;">' +
        '<button class="btn btn-secondary btn-sm cal-day-bg-btn" id="btnTriggerDayBgFile" type="button" style="flex:1;padding:8px 0;display:flex;align-items:center;justify-content:center;gap:6px;font-size:.875rem;">' +
          '<span>📷 사진 추가 (최대 2장)</span>' +
        '</button>' +
        (currentBg ? '<button class="btn btn-ghost btn-sm" id="btnDeleteDayBg" type="button" style="padding:8px 12px;color:var(--brand-strong);border-color:var(--rule);font-size:.8125rem;">초기화</button>' : '') +
      '</div>' +
      '<div class="modal-actions" style="display:flex;gap:8px;">' +
        '<button class="btn btn-ghost btn-sm" id="calDayBgCancelBtn" type="button" style="flex:1;">취소</button>' +
        '<button class="btn btn-primary btn-sm" id="calDayBgSaveBtn" type="button" style="flex:1;">저장</button>' +
      '</div>';

    L.openModal(modalHtml, function(sheet){
      var backToHubBtn = sheet.querySelector('#calDayBgBackToHubBtn');
      if(backToHubBtn){
        backToHubBtn.onclick = function(){
          L.openCalendarDayEditHubModal(sel);
        };
      }
      var fileInput = sheet.querySelector('#calDayBgFileInput');
      var triggerBtn = sheet.querySelector('#btnTriggerDayBgFile');
      var deleteBtn = sheet.querySelector('#btnDeleteDayBg');
      var cancelBtn = sheet.querySelector('#calDayBgCancelBtn');
      var saveBtn = sheet.querySelector('#calDayBgSaveBtn');
      var previewLayer = sheet.querySelector('#calDayBgPreviewLayer');
      var previewContent = sheet.querySelector('#calDayBgPreviewContent');

      function updatePreview(){
        if(!previewLayer) return;
        if(tempBgList.length >= 2){
          previewLayer.style.display = 'flex';
          previewLayer.style.flexDirection = 'column';
          previewLayer.style.backgroundImage = 'none';
          previewLayer.innerHTML = '<div style="flex:1;background-image:url(\'' + L.escapeHtml(tempBgList[0]) + '\');background-size:cover;background-position:center;opacity:0.5;"></div><div style="flex:1;background-image:url(\'' + L.escapeHtml(tempBgList[1]) + '\');background-size:cover;background-position:center;opacity:0.5;border-top:1px solid rgba(255,255,255,0.4);"></div>';
        } else if(tempBgList.length === 1){
          previewLayer.style.display = 'block';
          previewLayer.innerHTML = '';
          previewLayer.style.backgroundImage = 'url("' + tempBgList[0] + '")';
        } else {
          previewLayer.style.display = 'none';
          previewLayer.innerHTML = '';
          previewLayer.style.backgroundImage = 'none';
        }
        var countBadge = sheet.querySelector('#calDayBgCountBadge');
        if(countBadge){
          countBadge.textContent = tempBgList.length + ' / 2장 등록됨' + (tempBgList.length === 2 ? ' (상하 50% 분할)' : (tempBgList.length === 1 ? ' (전체 채움)' : ''));
        }
        if(previewContent){
          previewContent.innerHTML =
            '<div style="font-size:1.1rem;font-weight:700;color:var(--ink);margin-bottom:4px;">' + (sel.split('-')[2] || '17') + '</div>' +
            '<div style="display:inline-block;background:var(--surface-2);color:var(--ink);padding:2px 8px;border-radius:6px;font-size:.75rem;font-weight:600;margin-bottom:4px;border:1px solid var(--rule);">' +
              '🎯 오늘의 핵심 일정' +
            '</div>' +
            '<div style="font-size:.75rem;color:var(--ink-soft);">' +
              (tempBgList.length > 0 ? '미리보기 적용 중 (투명도 50%)' : '사진을 선택하면 미리보기가 나타납니다.') +
            '</div>';
        }
      }

      if(triggerBtn && fileInput){
        triggerBtn.addEventListener('click', function(){
          fileInput.click();
        });
      }

      if(fileInput){
        fileInput.addEventListener('change', function(evt){
          var file = evt.target.files && evt.target.files[0];
          if(!file) return;
          L.toast('사진 압축 및 변환 중...');
          compressCalendarBgImage(file, function(err, compressedDataUrl){
            if(err || !compressedDataUrl){
              L.toast('사진 처리 중 오류가 발생했습니다.');
              return;
            }
            if(tempBgList.length < 2){
              tempBgList.push(compressedDataUrl);
            } else {
              tempBgList[1] = compressedDataUrl;
            }
            tempBg = tempBgList[0];
            updatePreview();
            L.toast('사진이 추가되었습니다 (' + tempBgList.length + '/2장). [저장]을 눌러 완료하세요.');
          });
        });
      }

      if(deleteBtn){
        deleteBtn.addEventListener('click', async function(){
          if(await OurgoalCapabilities.call('ui.confirm', '이날의 배경사진을 초기화하고 기본 배경으로 되돌릴까요?')){
            delete L.state.profile.calendarDayBackgrounds[sel];
            try {
              var uidVal = (L.state.profile && L.state.profile.id) || 'guest';
              localStorage.setItem('ourgoal_cal_day_bg_' + uidVal, JSON.stringify(L.state.profile.calendarDayBackgrounds));
            } catch(e){}
            await L.saveProfile();
            L.toast('배경사진이 초기화되었습니다.');
            L.renderCalendarScreen();
            if(isFromHub){
              L.openCalendarDayEditHubModal(sel);
            } else {
              L.closeModal();
            }
          }
        });
      }

      if(cancelBtn){
        cancelBtn.addEventListener('click', function(){
          if(isFromHub){
            L.openCalendarDayEditHubModal(sel);
          } else {
            L.closeModal();
          }
        });
      }

      if(saveBtn){
        saveBtn.addEventListener('click', async function(){
          if(!tempBgList || tempBgList.length === 0){
            L.toast('먼저 사진을 선택해주세요.');
            return;
          }
          L.state.profile.calendarDayBackgrounds[sel] = tempBgList.length === 1 ? tempBgList[0] : tempBgList;
          try {
            var uidVal = (L.state.profile && L.state.profile.id) || 'guest';
            localStorage.setItem('ourgoal_cal_day_bg_' + uidVal, JSON.stringify(L.state.profile.calendarDayBackgrounds));
          } catch(e){}
          await L.saveProfile();
          L.toast('이날의 배경사진이 저장되었습니다!');
          L.renderCalendarScreen();
          if(isFromHub){
            L.openCalendarDayEditHubModal(sel);
          } else {
            L.closeModal();
          }
        });
      }
    });
  }

  K.compressCalendarBgImage = compressCalendarBgImage;
  K.openCalendarDayBgPickerModal = openCalendarDayBgPickerModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
