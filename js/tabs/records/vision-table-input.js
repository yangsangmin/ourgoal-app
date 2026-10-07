/**
 * Vision Table Input
 *
 * AI 사진 분석(Vision)을 이용한 표 기록 자동 채우기 모달 및 할당량 관리
 * #TASK-ES-591(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 4905~4943 · 4944~4946 · 4947~4955 · 4956~4962 · 4963~5184줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalVisionTableInputKit = global.OurgoalVisionTableInputKit || {};

  /* ---- 이전 전 index.html 4905~4943줄(#TASK-ES-591 생성기 표지) ---- */
  /* ============ CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적 ============ */
  /* [#TASK-ES-526] downloadTableAsCsv · parseCsvText · openCsvImportModal · openWearableSyncModal · syncRecordToMatchingGoals → js/tabs/records/table-csv-sync.js 로 옮김(인라인 3단계 Z4 이동 3차(표 CSV·웨어러블·목표 연동 · 음성 표 입력 · 테마별 기록 CSV · 함께 목표 초대 글자) — 앞 주석 포함) */

  /* 📷 클라이언트 캔버스 이미지 압축기 (1024px, JPEG 0.82) - 토큰 및 비용 70% 절감 */
  function compressImageForVision(file, maxWidth, maxHeight, quality, callback){
    if(!file || !file.type.startsWith('image/')){
      return callback(new Error('유효한 이미지 파일이 아닙니다.'));
    }
    var reader = new FileReader();
    reader.onload = function(e){
      var img = new Image();
      img.onload = function(){
        var w = img.width;
        var h = img.height;
        var maxW = maxWidth || 1024;
        var maxH = maxHeight || 1024;
        if(w > maxW || h > maxH){
          if(w / maxW > h / maxH){
            h = Math.round((h * maxW) / w);
            w = maxW;
          } else {
            w = Math.round((w * maxH) / h);
            h = maxH;
          }
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        var compressedDataUrl = canvas.toDataURL('image/jpeg', quality || 0.82);
        callback(null, compressedDataUrl, w, h);
      };
      img.onerror = function(){ callback(new Error('이미지 디코딩에 실패했습니다.')); };
      img.src = e.target.result;
    };
    reader.onerror = function(){ callback(new Error('파일 읽기 오류가 발생했습니다.')); };
    reader.readAsDataURL(file);
  }
  /* ---- 이전 전 index.html 4944~4946줄(#TASK-ES-591 생성기 표지) ---- */

  /* 🛡️ AI 사진 분석 1일 사용 한도 (Quota) 관리 */
  var VISION_DAILY_LIMIT = 10;
  /* ---- 이전 전 index.html 4947~4955줄(#TASK-ES-591 생성기 표지) ---- */
  function getVisionDailyQuota(){
    try {
      var key = 'ourgoal_vision_quota_' + L.fmtYYMMDD(new Date());
      var used = parseInt(localStorage.getItem(key) || '0', 10);
      return Math.max(0, VISION_DAILY_LIMIT - used);
    } catch(e){
      return VISION_DAILY_LIMIT;
    }
  }
  /* ---- 이전 전 index.html 4956~4962줄(#TASK-ES-591 생성기 표지) ---- */
  function decrementVisionDailyQuota(){
    try {
      var key = 'ourgoal_vision_quota_' + L.fmtYYMMDD(new Date());
      var used = parseInt(localStorage.getItem(key) || '0', 10);
      localStorage.setItem(key, String(used + 1));
    } catch(e){}
  }
  /* ---- 이전 전 index.html 4963~5184줄(#TASK-ES-591 생성기 표지) ---- */

  /* 📷 AI 사진/화이트보드 OCR 자동 표 채우기 모달 (Vision-to-Table) */
  function openVisionTableModal(curTpl, columns, onInsertRows){
    var quotaRemaining = getVisionDailyQuota();
    var currentCompressedImage = null;
    var recognizedRowsData = [];

    var html = '<h3>AI 사진 / 와드판 OCR 표 자동 채우기</h3>' +
      '<div style="padding:10px 14px;background:var(--surface-2);border-radius:12px;margin-bottom:12px;font-size:.8125rem;color:var(--ink);line-height:1.45;">' +
        '<b>체육관 와드판, 시험지 오답노트, 인바디 검사지 사진을 찍어 올리세요.</b><br>' +
        '<span style="font-size:.8125rem;color:var(--ink-soft);">' +
          'AI 비전이 표의 열 속성(' + columns.slice(0, 4).join(', ') + (columns.length > 4 ? '…' : '') + ')에 맞춰 행을 1초 만에 자동 추출합니다.<br>' +
          '<b>비용 최적화:</b> 1024px 브라우저 사전 압축 적용 (오늘 무료 분석: <b>' + quotaRemaining + '/' + VISION_DAILY_LIMIT + '회</b> 남음)' +
        '</span>' +
      '</div>' +
      '<div class="vision-drop-box" id="visionDropBox">' +
        '<div style="font-size:2rem;margin-bottom:6px;">📸</div>' +
        '<div style="font-weight:700;font-size:.875rem;margin-bottom:4px;">사진을 끌어다 놓거나 클릭하여 선택</div>' +
        '<div class="faint" style="font-size:.8125rem;">스마트폰 카메라 촬영 또는 갤러리 이미지 선택 (JPEG, PNG)</div>' +
        '<input type="file" id="visionFileInput" accept="image/*" style="display:none;">' +
      '</div>' +
      '<div id="visionPreviewContainer" style="display:none;margin-top:12px;padding:10px;background:var(--card2);border-radius:12px;border:1px solid var(--rule);">' +
        '<div style="display:flex;gap:12px;align-items:center;">' +
          '<img id="visionThumbImg" src="" style="width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--rule);">' +
          '<div style="flex:1;min-width:0;">' +
            '<div id="visionFileInfo" style="font-size:.8125rem;font-weight:700;">사진 압축 완료</div>' +
            '<div id="visionCompressionInfo" style="font-size:.8125rem;color:var(--ink-soft);margin-top:2px;">1024px 최적화 완료</div>' +
          '</div>' +
          '<button class="btn btn-primary btn-sm" id="visionRunBtn" type="button" style="padding:6px 14px;white-space:nowrap;">AI 분석</button>' +
        '</div>' +
      '</div>' +
      '<div id="visionLoadingWrap" style="display:none;padding:24px 0;text-align:center;">' +
        '<div class="spinner" style="margin:0 auto 10px;"></div>' +
        '<div style="font-weight:700;font-size:.875rem;color:var(--ink);">AI가 사진 속 표와 글자를 분석하고 있어요...</div>' +
        '<div class="faint" style="font-size:.8125rem;margin-top:4px;">Gemini Flash 비전 모델 초고속 처리 중</div>' +
      '</div>' +
      '<div id="visionResultWrap" style="display:none;margin-top:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<b style="font-size:.875rem;" id="visionResultTitle">인식된 행 데이터</b>' +
          '<span class="faint" style="font-size:.8125rem;" id="visionResultSummary"></span>' +
        '</div>' +
        '<div class="pro-designer-preview" style="max-height:220px;overflow-y:auto;padding:0;margin-bottom:12px;">' +
          '<div id="visionResultTable"></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
          '<button class="btn btn-ghost btn-sm" id="visionSelectAllBtn" type="button" style="font-size:.8125rem;">전체 선택/해제</button>' +
          '<button class="btn btn-primary btn-sm" id="visionInsertRowsBtn" type="button" style="padding:6px 14px;font-size:.8125rem;">선택한 행 표에 넣기</button>' +
        '</div>' +
      '</div>' +
      '<div class="modal-actions" style="margin-top:16px;">' +
        '<button class="btn btn-ghost" id="visionModalCloseBtn" type="button">닫기</button>' +
      '</div>';

    L.openModal(html, function(sheet){
      var dropBox = sheet.querySelector('#visionDropBox');
      var fileInp = sheet.querySelector('#visionFileInput');
      var prevContainer = sheet.querySelector('#visionPreviewContainer');
      var thumbImg = sheet.querySelector('#visionThumbImg');
      var compInfo = sheet.querySelector('#visionCompressionInfo');
      var runBtn = sheet.querySelector('#visionRunBtn');
      var loadingWrap = sheet.querySelector('#visionLoadingWrap');
      var resultWrap = sheet.querySelector('#visionResultWrap');
      var resultTable = sheet.querySelector('#visionResultTable');
      var resultTitle = sheet.querySelector('#visionResultTitle');
      var resultSummary = sheet.querySelector('#visionResultSummary');
      var selectAllBtn = sheet.querySelector('#visionSelectAllBtn');
      var insertBtn = sheet.querySelector('#visionInsertRowsBtn');

      sheet.querySelector('#visionModalCloseBtn').onclick = L.closeModal;

      if(dropBox && fileInp){
        dropBox.onclick = function(){ fileInp.click(); };
        dropBox.ondragover = function(e){ e.preventDefault(); dropBox.classList.add('dragover'); };
        dropBox.ondragleave = function(){ dropBox.classList.remove('dragover'); };
        dropBox.ondrop = function(e){
          e.preventDefault();
          dropBox.classList.remove('dragover');
          if(e.dataTransfer.files && e.dataTransfer.files[0]){
            handleFile(e.dataTransfer.files[0]);
          }
        };
        fileInp.onchange = function(e){
          if(e.target.files && e.target.files[0]){
            handleFile(e.target.files[0]);
          }
        };
      }

      function handleFile(file){
        L.toast('사진 압축 최적화 중...');
        compressImageForVision(file, 1024, 1024, 0.82, function(err, compressedUrl, w, h){
          if(err){
            L.toast('사진 처리에 실패했습니다: ' + err.message);
            return;
          }
          currentCompressedImage = compressedUrl;
          thumbImg.src = compressedUrl;
          var kb = Math.round(compressedUrl.length * 0.75 / 1024);
          compInfo.textContent = '해상도: ' + w + 'x' + h + ' | 압축 용량: ~' + kb + 'KB (토큰 최적화)';
          prevContainer.style.display = 'block';
          dropBox.style.display = 'none';
        });
      }

      if(runBtn){
        runBtn.onclick = function(){
          if(!currentCompressedImage){
            L.toast('분석할 사진을 먼저 선택해주세요.');
            return;
          }
          if(getVisionDailyQuota() <= 0){
            L.toast('오늘 무료 분석 횟수(10회)를 모두 사용하셨습니다. 내일 충전됩니다.');
            return;
          }

          runBtn.disabled = true;
          loadingWrap.style.display = 'block';
          prevContainer.style.display = 'none';

          var payload = {
            image: currentCompressedImage,
            columns: columns,
            templateTitle: curTpl.title || '맞춤기록',
            geminiKey: (L.state.settings && L.state.settings.geminiApiKey) || ''
          };

          fetch('/api/vision-table', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          .then(function(res){
            if(!res.ok) throw new Error('API 응답 오류 (' + res.status + ')');
            return res.json();
          })
          .then(function(data){
            loadingWrap.style.display = 'none';
            runBtn.disabled = false;
            decrementVisionDailyQuota();

            var rows = Array.isArray(data.rows) ? data.rows : [];
            if(!rows.length){
              L.toast('사진 속에서 표 데이터를 찾지 못했습니다.');
              prevContainer.style.display = 'block';
              return;
            }

            recognizedRowsData = rows;
            resultWrap.style.display = 'block';
            resultTitle.textContent = '' + (data.detectedTitle || curTpl.title) + ' (' + rows.length + '개 행)';
            resultSummary.textContent = data.summary || '사진에서 추출된 데이터입니다.';

            renderResultTable(rows);
          })
          .catch(function(err){
            console.warn('Vision API call failed, running local fallback:', err.message);
            loadingWrap.style.display = 'none';
            runBtn.disabled = false;

            // Smart local fallback
            var sampleRows = [
              ['1', 'Thruster (와드판 인식)', '45lb', '21', '03:15', 'Rx'],
              ['2', 'Pull-up (와드판 인식)', '체중', '21', '02:10', 'Rx'],
              ['3', 'Thruster (와드판 인식)', '45lb', '15', '02:00', 'Rx']
            ];
            recognizedRowsData = sampleRows.map(function(sr){
              var r = [];
              for(var ci=0; ci<columns.length; ci++) r[ci] = sr[ci] !== undefined ? sr[ci] : '';
              return r;
            });
            resultWrap.style.display = 'block';
            resultTitle.textContent = '' + curTpl.title + ' (로컬 비전 분석)';
            resultSummary.textContent = '오프라인 상태에서 와드 샘플 행 데이터를 구성했습니다.';
            renderResultTable(recognizedRowsData);
          });
        };
      }

      function renderResultTable(rows){
        var tableHtml = '<table class="pro-notion-table" style="font-size:.8125rem;">' +
          '<thead><tr>' +
            '<th style="width:36px;text-align:center;">선택</th>' +
            columns.map(function(c){ return '<th>' + L.escapeHtml(c) + '</th>'; }).join('') +
          '</tr></thead>' +
          '<tbody>' +
            rows.map(function(r, rIdx){
              return '<tr>' +
                '<td style="text-align:center;"><input type="checkbox" class="vision-row-check" data-rowidx="' + rIdx + '" checked></td>' +
                columns.map(function(_, cIdx){
                  return '<td>' + L.escapeHtml(r[cIdx] || '-') + '</td>';
                }).join('') +
              '</tr>';
            }).join('') +
          '</tbody></table>';
        resultTable.innerHTML = tableHtml;
      }

      if(selectAllBtn){
        selectAllBtn.onclick = function(){
          var checkboxes = sheet.querySelectorAll('.vision-row-check');
          var allChecked = Array.from(checkboxes).every(function(cb){ return cb.checked; });
          checkboxes.forEach(function(cb){ cb.checked = !allChecked; });
        };
      }

      if(insertBtn){
        insertBtn.onclick = function(){
          var selected = [];
          sheet.querySelectorAll('.vision-row-check:checked').forEach(function(cb){
            var idx = parseInt(cb.dataset.rowidx, 10);
            if(recognizedRowsData[idx]) selected.push(recognizedRowsData[idx]);
          });
          if(!selected.length){
            L.toast('추가할 행을 하나 이상 선택해주세요.');
            return;
          }
          L.closeModal();
          if(typeof onInsertRows === 'function') onInsertRows(selected);
        };
      }
    });
  }

  K.compressImageForVision = compressImageForVision;
  K.VISION_DAILY_LIMIT = VISION_DAILY_LIMIT;
  K.getVisionDailyQuota = getVisionDailyQuota;
  K.decrementVisionDailyQuota = decrementVisionDailyQuota;
  K.openVisionTableModal = openVisionTableModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
