/**
 * OurGoal Record Assistant (기록 탭 — 대화형 기록 비서)
 *
 * #TASK-ES-438 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G136.
 *   옮긴 선언(이전 전 줄): parseConversationalRecord(26386~26443) · handleConversationalRecord(26444~26448) · openConversationalRecordConfirmModal(26449~26531)
 * parseConversationalRecord = 한 줄 말을 기록 값으로 풀기, handleConversationalRecord·openConversationalRecordConfirmModal = 확인 창을 띄우고 저장.
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
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ============ 대화형 기록 비서 (Req 1) ============ */
  function parseConversationalRecord(rawText){
    var text = rawText.trim();
    var durationMinutes = 0;
    var durationLabel = '';

    // Duration extraction
    var hourMatch = text.match(/(\d+)\s*(?:시간|h)/i);
    var minMatch = text.match(/(\d+)\s*(?:분|min)/i);
    if(hourMatch) durationMinutes += parseInt(hourMatch[1], 10) * 60;
    if(minMatch) durationMinutes += parseInt(minMatch[1], 10);

    if(durationMinutes > 0){
      durationLabel = (Math.floor(durationMinutes/60) ? Math.floor(durationMinutes/60)+'시간 ' : '') + ((durationMinutes%60) ? (durationMinutes%60)+'분' : '');
    }

    // Theme extraction
    var theme = 'daily';
    var cat = null;
    if(/(?:헬스|운동|러닝|달리기|스쿼트|벤치|크로스핏|수영|자전거|홈트|pt|가슴|등|하체|스트레칭)/i.test(text)){
      theme = 'workout'; cat = 'exercise';
    } else if(/(?:공부|독서|책|강의|수업|영어|단어|코딩|개발|시험|자격증|학습)/i.test(text)){
      theme = 'study'; cat = 'reading';
    } else if(/(?:업무|회의|미팅|프로젝트|작업|기획|보고서|클라이언트|출근|퇴근|사업|매출)/i.test(text)){
      theme = 'business'; cat = 'career';
    } else if(/(?:약속|만남|데이트|식사|친구|모임|가족|외출|여행)/i.test(text)){
      theme = 'schedule'; cat = 'hobby';
    } else if(/(?:명상|힐링|산책|휴식|기분|일기|생각|마음|감정)/i.test(text)){
      theme = 'mind'; cat = 'mind';
    }

    var now = new Date();
    var startAt, endAt, type;
    if(durationMinutes > 0){
      type = 'timed';
      endAt = now.toISOString();
      startAt = new Date(now.getTime() - durationMinutes * 60000).toISOString();
    } else {
      type = 'note';
      startAt = now.toISOString();
      endAt = null;
    }

    return {
      id: L.newId(),
      text: text,
      theme: theme,
      category: cat,
      type: type,
      durationMinutes: durationMinutes,
      durationLabel: durationLabel,
      startAt: startAt,
      endAt: endAt,
      createdAt: now.toISOString(),
      photo: null
    };
  }

  function handleConversationalRecord(text){
    var parsed = parseConversationalRecord(text);
    openConversationalRecordConfirmModal(parsed);
  }

  function openConversationalRecordConfirmModal(candidate){
    var th = (typeof L.RECORD_THEMES !== 'undefined' && L.RECORD_THEMES[candidate.theme]) ? L.RECORD_THEMES[candidate.theme] : { label:'일상', icon:'' };
    var durText = candidate.durationMinutes > 0 ? (candidate.durationLabel + ' 진행') : '단순 메모/체크인';

    L.openModal(
      '<h3>AI 대화형 기록 확인</h3>' +
      '<div style="padding:14px;background:var(--card2);border-radius:12px;border:1px solid var(--rule);margin-bottom:14px;">' +
        '<div style="font-size:.8125rem;color:var(--ink);font-weight:700;margin-bottom:6px;">AI가 분석한 기록 내용</div>' +
        '<div style="font-weight:700;font-size:.9375rem;color:var(--ink);margin-bottom:8px;line-height:1.5;">'+L.escapeHtml(candidate.text)+'</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;font-size:.8125rem;">' +
          '<span class="dday-pill" style="background:var(--card);border:1px solid var(--rule);">'+th.icon+' '+th.label+'</span>' +
          '<span class="dday-pill" style="background:var(--card);border:1px solid var(--rule);">'+durText+'</span>' +
        '</div>' +
      '</div>' +
      '<div class="field">' +
        '<label>사진 첨부 (선택)</label>' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
          '<button class="btn btn-ghost btn-sm" id="recAiPhotoPickBtn" type="button">사진 첨부</button>' +
          '<input type="file" id="recAiFileInput" accept="image/*" style="display:none;">' +
          '<div id="recAiPhotoPreview" style="width:44px;height:44px;border-radius:10px;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:1.2rem;overflow:hidden;border:1px solid var(--rule);"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-8 8"/></svg></div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-actions" style="gap:8px;">' +
        '<button class="btn btn-ghost btn-sm" id="recAiManualEditBtn" type="button" style="flex:0 0 auto;">수동 상세 편집</button>' +
        '<button class="btn btn-ghost btn-sm" id="recAiCancelBtn" type="button">취소</button>' +
        '<button class="btn btn-primary btn-sm" id="recAiSaveBtn" type="button" style="flex:1;">기록 저장</button>' +
      '</div>',
      function(sheet){
        var fileInp = sheet.querySelector('#recAiFileInput');
        var photoBtn = sheet.querySelector('#recAiPhotoPickBtn');
        var preview = sheet.querySelector('#recAiPhotoPreview');
        if(photoBtn && fileInp){
          photoBtn.onclick = function(){ fileInp.click(); };
          fileInp.onchange = function(e){
            var f = e.target.files[0];
            if(!f) return;
            L.resizeImageToDataUrl(f, 600, function(dUrl){
              if(dUrl){
                candidate.photo = dUrl;
                preview.innerHTML = '<img src="'+dUrl+'" style="width:100%;height:100%;object-fit:cover;">';
              }
            });
          };
        }
        sheet.querySelector('#recAiCancelBtn').onclick = L.closeModal;
        sheet.querySelector('#recAiManualEditBtn').onclick = function(){
          L.closeModal();
          L.openRecordModal(candidate);
        };
        sheet.querySelector('#recAiSaveBtn').onclick = async function(){
          L.state.profile.records = L.state.profile.records || [];
          L.state.profile.records.unshift(candidate);
          L.awardXP(L.XP_RULES.checkin, '기록 추가');
          await L.saveProfile();
          L.closeModal();
          try{ if(typeof L.dispatchFullViewPropagation === 'function') L.dispatchFullViewPropagation(); else L.renderRecordsScreen(); }catch(e){ L.renderRecordsScreen(); }
          L.renderLevelBadge();
          L.toast('기록을 저장했어요!');
          L.burstConfetti(window.innerWidth/2, window.innerHeight/2);

          L.renderRecordFeedbackSlot('loading');
          var recGoal = (L.state.profile.goals || []).find(function(g){ return g.category === candidate.category; }) || (L.state.profile.goals && L.state.profile.goals[0]) || { title: '나의 일상 성장', milestones: [] };
          L.requestAIFeedback(recGoal, candidate.text, candidate.theme).then(async function(fb){
            if(fb){
              candidate.feedback = fb;
              await L.saveProfile();
              L.state.lastCapture = { record: candidate, goal: recGoal, feedback: fb };
              L.renderRecordFeedbackSlot(fb);
              L.renderFeedbackSlot(fb);
              if(L.state.activeTab === 'records') L.renderRecordsScreen();
              if(recGoal && recGoal.milestones && recGoal.milestones.length > 0){
                L.maybeShowGoalUpdateModal(recGoal, fb);
              }
              L.sendToNotion(candidate, fb);
            }
          }).catch(function(err){
            console.warn('[ConversationalRecord AI feedback error]', err);
          });
        };
      }
    );
  }

  K.parseConversationalRecord = parseConversationalRecord;
  K.handleConversationalRecord = handleConversationalRecord;
  K.openConversationalRecordConfirmModal = openConversationalRecordConfirmModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
