/**
 * OurGoal Voice Table Input (기록 탭 — 음성 문장을 표 한 줄로 바꾸는 입력 창)
 *
 * 「CSV / 엑셀 양방향 연동」 묶음 중 음성 입력 책임: 한국어 음성 문장 → 표 행 파서(parseVoiceToTableRow — smoke-test FN_NAMES)·핸즈프리 음성 표 입력 창(openVoiceTableModal, 예시 문장 칩으로도 행을 더한다).
 * #TASK-ES-526(인라인 3단계 Z4 이동 3차(표 CSV·웨어러블·목표 연동 · 음성 표 입력 · 테마별 기록 CSV · 함께 목표 초대 글자)): index.html 인라인 IIFE 의 구간(이전 전 10980~11037 · 11038~11225줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 10980~11037줄(#TASK-ES-526 생성기 표지) ---- */

  /* 🎙️ 한국어 자연어 음성 문장 -> 표 행 데이터 스마트 파서 */
  function parseVoiceToTableRow(transcript, curTpl, columns){
    var text = (transcript || '').trim();
    if(!text) return null;

    var row = new Array(columns.length).fill('');
    var lower = text.toLowerCase();

    // 1. 종목/항목명 추출
    var exerciseMatch = text.match(/(벤치프레스|스쿼트|데드리프트|쓰러스터|풀업|턱걸이|바벨로우|오버헤드프레스|런지|푸시업|플랭크|로잉|스키에르그|버피|월볼|파머스캐리|러닝|달리기|인터벌|수영|사이클|[가-힣a-zA-Z\s]{2,15})(?:\s+(\d+)\s*(?:kg|키로|파운드|lb|회|개|세트))?/i);
    var itemName = exerciseMatch ? exerciseMatch[1].trim() : '';

    // 2. 수치 단위 정규식 추출
    var weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|키로|킬로|파운드|lb)/i);
    var repsMatch = text.match(/(\d+)\s*(?:회|개|번|reps)/i);
    var pageMatch = text.match(/(\d+)\s*(?:페이지|p|쪽)/i);
    var problemMatch = text.match(/(\d+)\s*(?:문제|문항)/i);
    var pointMatch = text.match(/(\d+)\s*(?:점|%|퍼센트)/i);
    var setsMatch = text.match(/(\d+)\s*(?:세트|set|sets|라운드)/i);
    var timeMatch = text.match(/(\d+)\s*(?:분|초|시간|min|sec)/i);
    var distMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:km|킬로미터|킬로|m|미터)/i);
    var amountMatch = text.match(/(\d+(?:,\d+)?)\s*(?:원|만원|억원)/i);
    var intensityMatch = text.match(/(상|중|하|최상|힘듦|가벼움|보통)/);

    columns.forEach(function(col, idx){
      var c = col.toLowerCase();
      if(idx === 0 && (c.includes('번호') || c.includes('no') || c.includes('구간') || c.includes('순서'))){
        row[idx] = '1';
      } else if(c.includes('종목') || c.includes('과목') || c.includes('고객') || c.includes('항목') || c.includes('내용') || c.includes('이름')){
        row[idx] = itemName || text.slice(0, 15);
      } else if(c.includes('세트') || c.includes('차수') || c.includes('단계')){
        row[idx] = setsMatch ? setsMatch[1] : (repsMatch ? '1' : '3');
      } else if(c.includes('무게') || c.includes('중량') || c.includes('단가')){
        row[idx] = weightMatch ? (weightMatch[1] + (text.includes('파운드') || text.includes('lb') ? 'lb' : 'kg')) : '';
      } else if(c.includes('페이지') || c.includes('쪽')){
        row[idx] = pageMatch ? pageMatch[1] : (repsMatch ? repsMatch[1] : '');
      } else if(c.includes('문항') || c.includes('문제')){
        row[idx] = problemMatch ? problemMatch[1] : '';
      } else if(c.includes('횟수') || c.includes('reps')){
        row[idx] = repsMatch ? repsMatch[1] : (problemMatch ? problemMatch[1] : '');
      } else if(c.includes('시간') || c.includes('소요') || c.includes('타임')){
        row[idx] = timeMatch ? (timeMatch[1] + '분') : '';
      } else if(c.includes('거리') || c.includes('dist')){
        row[idx] = distMatch ? (distMatch[1] + 'km') : '';
      } else if(c.includes('강도') || c.includes('점수') || c.includes('집중') || c.includes('확률')){
        row[idx] = pointMatch ? pointMatch[1] : (intensityMatch ? intensityMatch[1] : '85');
      } else if(c.includes('금액') || c.includes('규모')){
        row[idx] = amountMatch ? (amountMatch[1] + '원') : '';
      } else if(c.includes('rx') || c.includes('완료') || c.includes('상태')){
        row[idx] = /rx|알엑스/.test(lower) ? 'Rx' : 'Scaled';
      } else if(!row[idx] && idx === 1){
        row[idx] = text;
      }
    });

    return row;
  }
  /* ---- 이전 전 index.html 11038~11225줄(#TASK-ES-526 생성기 표지) ---- */

  /* 🎙️ 핸즈프리 실시간 음성 표 입력 모달 (Voice-to-Table) */
  function openVoiceTableModal(curTpl, columns, onInsertRow){
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var recognition = SpeechRecognition ? new SpeechRecognition() : null;
    var isListening = false;
    var continuousMode = true;
    var currentParsedRow = null;

    var html = '<h3>핸즈프리 음성 실시간 표 입력</h3>' +
      '<div style="padding:10px 14px;background:var(--card2);border-radius:12px;border:1px solid var(--rule);margin-bottom:12px;font-size:.8125rem;color:var(--ink-soft);line-height:1.45;">' +
        '<b>운동 중이나 공부 중 키보드 입력 없이 말로 행을 추가하세요.</b><br>' +
        '<span style="font-size:.8125rem;">말씀이 끝나면 AI가 종목, 무게, 세트, 횟수, 시간을 분석하여 표 속성에 바로 넣어줍니다.</span>' +
      '</div>' +
      '<div style="text-align:center;margin:16px 0;">' +
        '<div class="voice-wave-ring" id="voiceWaveRing">' +
          '<span style="font-size:1.8rem;" id="voiceMicIcon"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/></svg></span>' +
        '</div>' +
        '<div style="font-weight:700;font-size:.9375rem;margin-bottom:4px;" id="voiceStatusText">마이크 버튼을 눌러 음성 인식을 시작하세요</div>' +
        '<div class="faint" style="font-size:.8125rem;" id="voiceTranscriptBox">"예: 벤치프레스 80키로 10회 3세트 완료"</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:14px;">' +
        '<button class="quick-prose-chip" data-voicesim="벤치프레스 80kg 10회 3세트 45분">벤치 80kg 10회 3세트</button>' +
        '<button class="quick-prose-chip" data-voicesim="쓰러스터 45파운드 21개 5분 Rx">쓰러스터 45lb 21개 Rx</button>' +
        '<button class="quick-prose-chip" data-voicesim="러닝 5km 25분 160bpm">러닝 5km 25분</button>' +
        '<button class="quick-prose-chip" data-voicesim="민법 채권총론 50분 15페이지">민법 50분 15p</button>' +
      '</div>' +
      '<div id="voiceParsedRowWrap" style="display:none;background:var(--card);border:1px solid var(--rule);border-radius:12px;padding:10px 12px;margin-bottom:14px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<b style="font-size:.8125rem;color:var(--ink);">인식된 행 미리보기</b>' +
          '<span class="badge" style="font-size:.6875rem;">자동 파싱 완료</span>' +
        '</div>' +
        '<div class="pro-designer-preview" style="padding:0;margin:0 0 8px;">' +
          '<div id="voiceParsedRowTable"></div>' +
        '</div>' +
        '<button class="btn btn-primary btn-sm" id="voiceConfirmRowBtn" type="button" style="width:100%;padding:6px 0;font-size:.8125rem;">이 행 표에 추가하기</button>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--card2);border-radius:10px;margin-bottom:12px;font-size:.8125rem;">' +
        '<span>🎙️ <b>연속 듣기 모드</b> (세트 끝날 때마다 자동 추가)</span>' +
        '<input type="checkbox" id="voiceContinuousCheck" checked style="width:18px;height:18px;cursor:pointer;">' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-primary" id="voiceToggleBtn" type="button">음성 인식 시작</button>' +
        '<button class="btn btn-ghost" id="voiceCloseBtn" type="button">닫기</button>' +
      '</div>';

    L.openModal(html, function(sheet){
      var waveRing = sheet.querySelector('#voiceWaveRing');
      var micIcon = sheet.querySelector('#voiceMicIcon');
      var statusText = sheet.querySelector('#voiceStatusText');
      var transcriptBox = sheet.querySelector('#voiceTranscriptBox');
      var toggleBtn = sheet.querySelector('#voiceToggleBtn');
      var continuousCheck = sheet.querySelector('#voiceContinuousCheck');
      var parsedWrap = sheet.querySelector('#voiceParsedRowWrap');
      var parsedTable = sheet.querySelector('#voiceParsedRowTable');
      var confirmBtn = sheet.querySelector('#voiceConfirmRowBtn');

      sheet.querySelector('#voiceCloseBtn').onclick = function(){
        stopRecognition();
        L.closeModal();
      };

      if(continuousCheck){
        continuousCheck.onchange = function(){ continuousMode = continuousCheck.checked; };
      }

      function updateParsedRowView(row){
        currentParsedRow = row;
        parsedWrap.style.display = 'block';
        var tableHtml = '<table class="pro-notion-table" style="font-size:.8125rem;">' +
          '<thead><tr>' + columns.map(function(c){ return '<th>' + L.escapeHtml(c) + '</th>'; }).join('') + '</tr></thead>' +
          '<tbody><tr>' + row.map(function(cell){ return '<td>' + L.escapeHtml(cell || '-') + '</td>'; }).join('') + '</tr></tbody>' +
        '</table>';
        parsedTable.innerHTML = tableHtml;
      }

      if(confirmBtn){
        confirmBtn.onclick = function(){
          if(!currentParsedRow){ L.toast('추가할 음성 데이터가 없습니다.'); return; }
          if(typeof onInsertRow === 'function') onInsertRow(currentParsedRow);
          L.toast('표에 새 행이 추가되었습니다!');
          parsedWrap.style.display = 'none';
          currentParsedRow = null;
          transcriptBox.textContent = '다음 내용을 말씀해주세요...';
        };
      }

      // 시뮬레이션 칩 클릭 (음성 미지원 환경 대응)
      sheet.querySelectorAll('.quick-prose-chip[data-voicesim]').forEach(function(chip){
        chip.onclick = function(){
          var simText = chip.dataset.voicesim;
          transcriptBox.textContent = '"' + simText + '"';
          statusText.textContent = '문장 인식 완료';
          var row = parseVoiceToTableRow(simText, curTpl, columns);
          updateParsedRowView(row);
          if(continuousMode){
            if(typeof onInsertRow === 'function') onInsertRow(row);
            L.toast('[연속 추가] "' + simText.split(' ')[0] + '" 행이 표에 추가되었습니다!');
          }
        };
      });

      if(!SpeechRecognition){
        statusText.textContent = '이 브라우저는 실시간 음성 API를 지원하지 않습니다.';
        transcriptBox.textContent = '위의 추천 칩을 클릭하여 음성 파싱을 바로 체험해보세요!';
        toggleBtn.disabled = true;
        toggleBtn.textContent = '음성 인식 미지원';
        return;
      }

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      recognition.onstart = function(){
        isListening = true;
        waveRing.classList.add('listening');
        micIcon.textContent = '🔴';
        statusText.textContent = '듣고 있어요! 편하게 말씀하세요...';
        toggleBtn.textContent = '음성 인식 중지';
        toggleBtn.classList.remove('btn-primary');
        toggleBtn.classList.add('btn-ghost');
      };

      recognition.onresult = function(event){
        var finalTranscript = '';
        var interimTranscript = '';
        for(var i = event.resultIndex; i < event.results.length; ++i){
          if(event.results[i].isFinal){
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        var spoken = finalTranscript || interimTranscript;
        if(spoken){
          transcriptBox.textContent = '"' + spoken + '"';
        }
        if(finalTranscript){
          var row = parseVoiceToTableRow(finalTranscript, curTpl, columns);
          if(row){
            updateParsedRowView(row);
            if(continuousMode){
              if(typeof onInsertRow === 'function') onInsertRow(row);
              L.toast('[연속 추가] 음성 행이 표에 자동 추가되었습니다!');
            }
          }
        }
      };

      recognition.onerror = function(event){
        console.warn('Speech recognition error:', event.error);
        statusText.textContent = '음성 인식 대기 중 (' + event.error + ')';
        stopRecognition();
        if(event.error === 'not-allowed' || event.error === 'service-not-allowed'){
          if(typeof L.openMicPermissionGuideModal === 'function') L.openMicPermissionGuideModal('table');
        }
      };

      recognition.onend = function(){
        isListening = false;
        waveRing.classList.remove('listening');
        micIcon.textContent = '🎙️';
        statusText.textContent = '음성 인식이 일시 정지되었습니다.';
        toggleBtn.textContent = '음성 인식 시작';
        toggleBtn.classList.add('btn-primary');
        toggleBtn.classList.remove('btn-ghost');
      };

      function startRecognition(){
        try { recognition.start(); } catch(e){}
      }
      function stopRecognition(){
        try { recognition.stop(); } catch(e){}
      }

      toggleBtn.onclick = function(){
        if(isListening) stopRecognition();
        else startRecognition();
      };
      waveRing.onclick = function(){
        if(isListening) stopRecognition();
        else startRecognition();
      };

      startRecognition();
    });
  }

  K.parseVoiceToTableRow = parseVoiceToTableRow;
  K.openVoiceTableModal = openVoiceTableModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
