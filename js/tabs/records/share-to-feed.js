/**
 * OurGoal Share To Feed (기록 — 목표 & 기록 선택 피드 공유 모달)
 *
 * 소통 탭 「게시하기」·기록 탭 기간 AI 카드 등에서 여는 피드 게시 창(openShareToFeedModal) — 목표·기록·AI 피드백·사진·카테고리 고르기, 미리보기, 게시.
 * 기록 탭 세포(js/tabs/records/period-ai-card.js)도 이 창을 부르므로 기록 탭 키트에 둔다(탭 간 직접 참조 0). 게시 뒤 가상 응원·답글 연출(addSimulatedCheerAndReplyToPost)도 같은 묶음이다. FEED_POSTS_CACHE 는 index.html 에 그대로 있고 L getter·setter 로 읽고 쓴다.
 * #TASK-ES-466(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 12628~12631 · 12632~13363줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 12628~12631줄(#TASK-ES-466 생성기 표지) ---- */
  function addSimulatedCheerAndReplyToPost(postId, goalTitle, caption){
    // [TASK-ES-332] 헌법 제4조 제1항 1호/7호 및 결심 490108 준수: 가짜 봇 응원/답글 전면 차단
    return;
  }
  /* ---- 이전 전 index.html 12632~13363줄(#TASK-ES-466 생성기 표지) ---- */

  function openShareToFeedModal(){ window.openShareToFeedModal = openShareToFeedModal;
    var cap = L.state.lastCapture;
    var userGoals = (L.state.profile.goals || []).filter(function(g){ return !g.archivedAt; });
    // [#TASK-ES-314], [63] 실천기록 시간순 내림차순(최신순) 엄격 정렬 보장
    var userRecords = (L.state.profile.records || []).slice().sort(function(a, b){
      var tA = new Date(a.date || a.startAt || a.createdAt || 0).getTime() || 0;
      var tB = new Date(b.date || b.startAt || b.createdAt || 0).getTime() || 0;
      return tB - tA;
    }).slice(0, 30);

    var curGoal = (cap && cap.goal) || (userGoals.length ? userGoals[0] : null);
    // [#TASK-ES-180], [63] 실천기록 최신순 자동적용: 최신 기록을 기본값으로 자동 프리셀렉트
    var curRecord = (cap && cap.record) || (userRecords.length ? userRecords[0] : null);
    var curFeedback = (cap && cap.feedback) || (curRecord && curRecord.feedback) || null;
    var curPhoto = (curRecord && curRecord.photo) || null;

    // 가용 AI 코칭 피드백 풀 집계 (실제 기록 및 목표에서 받은 조언 피커 연동)
    var availableFeedbacks = [];
    userRecords.forEach(function(r){
      if(r.feedback && (r.feedback.comment || r.feedback.verdict || typeof r.feedback === 'string')){
        var fText = typeof r.feedback === 'string' ? r.feedback : (r.feedback.comment || r.feedback.verdict || '');
        if(fText){
          availableFeedbacks.push({
            id: r.id || ('fb_' + Math.random().toString(36).slice(2, 6)),
            source: 'record',
            date: r.date || (r.startAt ? L.dateKey(r.startAt) : ''),
            text: fText,
            raw: r.feedback,
            snippet: (r.title || r.text || '').slice(0, 20)
          });
        }
      }
    });
    userGoals.forEach(function(g){
      if(g.aiAnalysis && typeof g.aiAnalysis === 'string'){
        availableFeedbacks.push({
          id: g.id || ('fbg_' + Math.random().toString(36).slice(2, 6)),
          source: 'goal',
          date: '',
          text: g.aiAnalysis,
          raw: { comment: g.aiAnalysis, source: 'ai_coach', verdict: 'INSIGHT' },
          snippet: g.title.slice(0, 20)
        });
      }
    });

    var sel = {
      record: !!curRecord,
      feedback: !!curFeedback,
      photo: !!curPhoto,
      ms: {}
    };
    if(curGoal && curGoal.milestones){
      curGoal.milestones.forEach(function(m){ sel.ms[m.id] = (m.status === 'doing' || m.status === 'done'); });
    }

    var FEED_CATEGORIES_10 = [
      {k:'study', l:'공부·수험', icon:'📚'},
      {k:'dev', l:'개발·기획', icon:'💻'},
      {k:'workout', l:'운동·헬스', icon:'💪'},
      {k:'running', l:'러닝·마라톤', icon:'🏃'},
      {k:'diet', l:'다이어트·식단', icon:'🥗'},
      {k:'career', l:'커리어·취업', icon:'💼'},
      {k:'sideproject', l:'창업·사이드', icon:'🚀'},
      {k:'finance', l:'재테크·투자', icon:'💰'},
      {k:'life', l:'생활·루틴', icon:'☀️'},
      {k:'morning', l:'기상·모닝루틴', icon:'⏰'},
      {k:'parenting', l:'육아·가족', icon:'👶'},
      {k:'pet', l:'반려동물', icon:'🐾'},
      {k:'relation', l:'관계·소통', icon:'🤝'},
      {k:'reading', l:'독서·인문', icon:'📖'},
      {k:'hobby', l:'취미·창작', icon:'🎨'},
      {k:'mental', l:'멘탈·마인드', icon:'🧘'},
      {k:'clean', l:'정리·미니멀', icon:'🧹'},
      {k:'travel', l:'여행·아웃도어', icon:'✈️'}
    ];
    var customUploadedPhoto = null;

    var selectedCat = (curGoal && curGoal.category) || 'study';
    if(FEED_CATEGORIES_10.map(function(c){ return c.k; }).indexOf(selectedCat) === -1){
      selectedCat = 'study';
    }

    function renderModalHtml(){
      var goalOptsHtml = '<option value="__none__"' + (!curGoal ? ' selected' : '') + '>미설정 (목표 공개 안 함)</option>';
      if(userGoals.length > 0){
        goalOptsHtml += userGoals.map(function(g){
          var p = L.goalProgress(g);
          var isSel = (curGoal && curGoal.id === g.id) ? ' selected' : '';
          return '<option value="'+g.id+'"'+isSel+'>'+L.escapeHtml(g.title)+' ('+p+'%)</option>';
        }).join('');
      }

      var recOptsHtml = '<option value="__none__"'+(!curRecord ? ' selected' : '')+'>(기록 첨부 안 함 - 목표/소감만 공유)</option>';
      if(userRecords.length > 0){
        recOptsHtml += userRecords.map(function(r, idx){
          var isSel = (curRecord && (curRecord.id === r.id || curRecord.startAt === r.startAt)) ? ' selected' : '';
          var snippet = (r.title || r.text || '').replace(/\r\n/g, ' ').slice(0, 30);
          if((r.title || r.text || '').length > 30) snippet += '…';
          var dateLabel = r.date || (r.startAt ? L.dateKey(r.startAt) : '기록');
          return '<option value="'+idx+'"'+isSel+'>['+dateLabel+'] '+L.escapeHtml(snippet)+'</option>';
        }).join('');
      }

      var fbOptsHtml = '<option value="__none__"'+(!curFeedback ? ' selected' : '')+'>(AI 피드백 첨부 안 함)</option>';
      availableFeedbacks.forEach(function(fb, idx){
        var isSel = (curFeedback && (curFeedback === fb.raw || (curFeedback.comment && curFeedback.comment === fb.text))) ? ' selected' : '';
        var previewStr = fb.text.replace(/\r\n/g, ' ').slice(0, 32) + (fb.text.length > 32 ? '…' : '');
        var tagLabel = fb.source === 'goal' ? '🎯 목표 조언' : ('📝 ' + (fb.date ? '[' + fb.date + ']' : '실천 조언'));
        fbOptsHtml += '<option value="'+idx+'"'+isSel+'>' + tagLabel + ' ' + L.escapeHtml(previewStr) + '</option>';
      });

      // [TASK-ES-308] 1. 공유할 목표 선택형 칩 바
      var goalChipsHtml = '<div class="feed-target-chips-bar feed-target-goal-chips" id="shareGoalChipsRow" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:6px;-webkit-overflow-scrolling:touch;white-space:nowrap;">' +
        '<button type="button" class="feed-target-chip' + (!curGoal ? ' active' : '') + '" data-targetgoal="__none__" style="flex:0 0 auto;">📌 미설정</button>' +
        userGoals.map(function(g){
          var p = L.goalProgress(g);
          var isSel = (curGoal && curGoal.id === g.id) ? ' active' : '';
          return '<button type="button" class="feed-target-chip' + isSel + '" data-targetgoal="' + g.id + '" style="flex:0 0 auto;">🎯 ' + L.escapeHtml(g.title) + ' (' + p + '%)</button>';
        }).join('') +
      '</div>';

      // [TASK-ES-308] 2. 연동할 실천 기록 선택형 칩 바
      var recChipsHtml = '<div class="feed-target-chips-bar feed-target-record-chips" id="shareRecordChipsRow" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:6px;-webkit-overflow-scrolling:touch;white-space:nowrap;">' +
        '<button type="button" class="feed-target-chip' + (!curRecord ? ' active' : '') + '" data-targetrec="__none__" style="flex:0 0 auto;">⏱️ 기록 미연동</button>' +
        userRecords.map(function(r, idx){
          var isSel = (curRecord && (curRecord.id === r.id || curRecord.startAt === r.startAt)) ? ' active' : '';
          var snippet = (r.title || r.text || '').replace(/\r\n/g, ' ').slice(0, 16);
          if((r.title || r.text || '').length > 16) snippet += '…';
          var hasPhoto = r.photo ? ' 📸' : '';
          var dateLabel = r.date || (r.startAt ? L.dateKey(r.startAt).slice(5) : '기록');
          return '<button type="button" class="feed-target-chip' + isSel + '" data-targetrec="' + idx + '" style="flex:0 0 auto;">⏱️ [' + dateLabel + '] ' + L.escapeHtml(snippet) + hasPhoto + '</button>';
        }).join('') +
      '</div>';

      // [TASK-ES-308] 3. AI 코칭 피드백 선택형 칩 바
      var fbChipsHtml = '<div class="feed-target-chips-bar feed-target-feedback-chips" id="shareFeedbackChipsRow" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:6px;-webkit-overflow-scrolling:touch;white-space:nowrap;">' +
        '<button type="button" class="feed-target-chip' + (!curFeedback ? ' active' : '') + '" data-targetfb="__none__" style="flex:0 0 auto;">✨ 피드백 미포함</button>' +
        availableFeedbacks.map(function(fb, idx){
          var isSel = (curFeedback && (curFeedback === fb.raw || (curFeedback.comment && curFeedback.comment === fb.text))) ? ' active' : '';
          var previewStr = fb.text.replace(/\r\n/g, ' ').slice(0, 14) + (fb.text.length > 14 ? '…' : '');
          var tagIcon = fb.source === 'goal' ? '🎯' : '📝';
          return '<button type="button" class="feed-target-chip' + isSel + '" data-targetfb="' + idx + '" style="flex:0 0 auto;">' + tagIcon + ' ' + L.escapeHtml(previewStr) + '</button>';
        }).join('') +
      '</div>';

      var msRows = '';
      if(curGoal && curGoal.milestones && curGoal.milestones.length){
        msRows = curGoal.milestones.map(function(m){
          var checked = !!sel.ms[m.id];
          return '<div class="ms-row" data-shms="'+m.id+'" style="cursor:pointer;padding:6px 8px;margin-bottom:4px;background:var(--card);border:1px solid var(--rule);border-radius:8px;">' +
            '<div class="ms-main" style="display:flex;align-items:center;gap:8px;">' +
              '<div class="sel-check'+(checked ? ' on' : '')+'" data-shmschk="'+m.id+'" style="width:18px;height:18px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.8125rem;font-weight:700;border:1px solid '+(checked?'var(--chip)':'var(--rule)')+';background:'+(checked?'var(--chip)':'transparent')+';color:#fff;">'+(checked ? '✓' : '')+'</div>' +
              '<div style="flex:1;min-width:0;font-size:.8125rem;font-weight:600;">'+(m.status==='done'?'✅ ':(m.status==='doing'?'🔥 ':'· '))+L.escapeHtml(m.title)+'</div>' +
            '</div>' +
          '</div>';
        }).join('');
      }

      var defaultCaption = '';
      if(typeof generateRecordPledgeMessage === 'function'){
        defaultCaption = generateRecordPledgeMessage(curRecord, curGoal);
      } else if(curRecord && (curRecord.title || curRecord.text)){
        var snippet = (curRecord.title || curRecord.text).replace(/\r\n/g, ' ').slice(0, 45);
        defaultCaption = '오늘 실천 완료! "' + snippet + ((curRecord.title || curRecord.text).length > 45 ? '…' : '') + '" 꾸준히 나아갑니다 🔥';
      } else if(curGoal){
        defaultCaption = '"' + curGoal.title + '" 목표를 향해 집중하고 있습니다. 함께 달려요! 💪';
      } else {
        defaultCaption = '오늘도 목표를 향해 한 걸음 내딛습니다. 모두 파이팅해요! ✨';
      }

      return '<h3>피드에 내 목표 / 기록 게시하기</h3>' +
        '<p class="faint" style="margin:-8px 0 14px;font-size:.8125rem;">내 목표와 실천 기록, AI 코칭 피드백을 선택하여 동료들과 따뜻하게 공유해보세요.</p>' +
        '<div style="margin-bottom:12px;" id="shareGoalPickerWrap">' +
          '<label style="font-size:.8125rem;font-weight:700;display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;color:var(--ink);">' +
            '<span>🎯 공유할 목표 선택 (내 목표 중 선택)</span>' +
            '<span class="faint" style="font-size:.72rem;font-weight:500;">터치하여 즉시 선택</span>' +
          '</label>' +
          goalChipsHtml +
          '<select id="shareGoalSelect" style="width:100%;border:1px solid var(--rule);border-radius:12px;padding:8px 12px;font-size:.84rem;background:var(--card2);color:var(--ink);font-weight:600;">' +
            goalOptsHtml +
          '</select>' +
        '</div>' +
        '<div style="margin-bottom:12px;" id="shareRecordPickerWrap">' +
          '<label style="font-size:.8125rem;font-weight:700;display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;color:var(--ink);">' +
            '<span>⏱️ 연동할 실천 기록 (선택)</span>' +
            '<span class="faint" style="font-size:.72rem;font-weight:500;">터치하여 즉시 선택</span>' +
          '</label>' +
          recChipsHtml +
          '<select id="shareRecordSelect" style="width:100%;border:1px solid var(--rule);border-radius:12px;padding:8px 12px;font-size:.84rem;background:var(--card2);color:var(--ink);">' +
            recOptsHtml +
          '</select>' +
        '</div>' +
        '<div id="shareRecordDetailBox" style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:10px 12px;margin-bottom:12px;display:'+(curRecord ? 'block' : 'none')+';">' +
          '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">실천 기록 포함 설정</div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;">' +
            '<label style="display:flex;align-items:center;gap:8px;font-size:.8125rem;cursor:pointer;">' +
              '<input type="checkbox" id="chkIncRecord" '+(sel.record ? 'checked' : '')+'> <span>기록 본문 내용 포함</span>' +
            '</label>' +
            '<label id="rowIncPhoto" style="display:'+(curPhoto ? 'flex' : 'none')+';align-items:center;gap:8px;font-size:.8125rem;cursor:pointer;">' +
              '<input type="checkbox" id="chkIncPhoto" '+(sel.photo ? 'checked' : '')+'> <span>실천 인증 사진 첨부</span>' +
            '</label>' +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom:12px;" id="shareFeedbackSection">' +
          '<label style="font-size:.8125rem;font-weight:700;display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;color:var(--ink);">' +
            '<span>✨ AI 코칭 피드백 선택 (선택)</span>' +
            '<span class="faint" style="font-size:.72rem;font-weight:500;">터치하여 즉시 선택</span>' +
          '</label>' +
          fbChipsHtml +
          '<select id="shareFeedbackSelect" style="width:100%;border:1px solid var(--rule);border-radius:12px;padding:8px 12px;font-size:.84rem;background:var(--card2);color:var(--ink);">' +
            fbOptsHtml +
          '</select>' +
          '<div id="shareFeedbackPreviewBox" style="margin-top:8px;background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08));border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:10px 12px;display:'+(curFeedback ? 'block' : 'none')+';">' +
            '<div style="display:flex;align-items:center;gap:6px;font-size:.75rem;font-weight:800;color:var(--brand);margin-bottom:4px;">' +
              '<span>✨ 선택된 AI 코칭 조언</span>' +
            '</div>' +
            '<div id="shareFeedbackPreviewText" style="font-size:.8125rem;color:var(--ink);line-height:1.4;white-space:pre-wrap;">' +
              L.escapeHtml(curFeedback ? (typeof curFeedback === 'string' ? curFeedback : (curFeedback.comment || curFeedback.verdict || '')) : '') +
            '</div>' +
            '<label style="display:none;"><input type="checkbox" id="chkIncFeedback" '+(curFeedback ? 'checked' : '')+'></label>' +
          '</div>' +
        '</div>' +
        (msRows ? '<div style="margin-bottom:12px;" id="shareMsSection"><label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;color:var(--ink);">함께 보여줄 마일스톤 (선택)</label><div class="ms-list" id="shareMsListSlot">'+msRows+'</div></div>' : '<div id="shareMsSection" style="display:none;"><div class="ms-list" id="shareMsListSlot"></div></div>') +
        // 직접 실천 사진 첨부 섹션 ([#TASK-ES-309], [58])
        '<div style="margin-bottom:14px;" class="share-photo-uploader-box">' +
          '<label style="font-size:.8125rem;font-weight:700;display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;color:var(--ink);">' +
            '<span>📸 실천 사진 첨부 (선택)</span>' +
            '<span class="faint" style="font-size:.72rem;font-weight:500;">카메라 촬영 / 앨범 / 드래그</span>' +
          '</label>' +
          '<input type="file" id="shareDirectPhotoInput" accept="image/*" style="display:none;" />' +
          '<!-- 사진 미첨부 시 드롭존 -->' +
          '<div id="sharePhotoDropzone" class="share-photo-dropzone" style="display:'+(customUploadedPhoto ? 'none' : 'flex')+';">' +
            '<div style="font-size:1.6rem;margin-bottom:4px;">📷</div>' +
            '<div style="font-size:.84rem;font-weight:700;color:var(--ink);margin-bottom:2px;">실천 인증 사진을 등록해보세요</div>' +
            '<div class="faint" style="font-size:.72rem;">터치하여 사진 선택 또는 여기에 드래그</div>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="btnSharePickPhoto" style="margin-top:8px;border:1px solid var(--rule);padding:5px 12px;font-size:.78rem;font-weight:700;border-radius:8px;">' +
              '사진 선택 / 촬영' +
            '</button>' +
          '</div>' +
          '<!-- 사진 첨부 완료 시 프리뷰 카드 -->' +
          '<div id="shareDirectPhotoPreviewWrap" class="share-photo-preview-card" style="display:'+(customUploadedPhoto ? 'flex' : 'none')+';">' +
            '<div style="position:relative;width:100%;max-width:280px;margin:0 auto;text-align:center;">' +
              '<img id="shareDirectPhotoPreviewImg" src="'+(customUploadedPhoto || '')+'" style="width:100%;max-height:180px;object-fit:cover;border-radius:12px;border:1px solid var(--rule);box-shadow:var(--shadow-sm);" />' +
              '<button type="button" id="btnShareRemovePhoto" class="share-photo-remove-btn" title="사진 삭제">✕</button>' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;padding:0 4px;">' +
                '<span class="tag on" style="font-size:.72rem;padding:2px 8px;">📸 실천 인증 사진 첨부됨</span>' +
                '<button type="button" id="btnShareChangePhoto" class="btn btn-ghost btn-sm" style="font-size:.72rem;padding:2px 8px;border:1px solid var(--rule);">사진 변경</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // 카테고리 10종 가로 스크롤 섹션 ([#TASK-ES-177], [59])
        '<div style="margin-bottom:12px;">' +
          '<label style="font-size:.8125rem;font-weight:700;display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;color:var(--ink);">' +
            '<span>카테고리 분류</span>' +
            '<span class="faint" style="font-size:.72rem;font-weight:500;">좌우로 스크롤하여 선택</span>' +
          '</label>' +
          '<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;white-space:nowrap;" id="shareCatPicker">' +
            FEED_CATEGORIES_10.map(function(c){
              var chipLabel = (c.icon ? c.icon + ' ' : '') + c.l;
              return '<button type="button" class="feed-filter-chip'+(selectedCat===c.k?' active':'')+'" data-shcat="'+c.k+'" style="font-size:.8125rem;padding:6px 11px;flex:0 0 auto;">'+chipLabel+'</button>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div style="margin-bottom:14px;">' +
          '<label style="font-size:.8125rem;font-weight:700;display:block;margin-bottom:4px;color:var(--ink);">나누고 싶은 한마디 / 다짐</label>' +
          '<textarea id="shareCaptionInput" style="width:100%;min-height:76px;border:1px solid var(--rule);border-radius:12px;padding:10px 12px;font-size:.875rem;background:var(--surface-2);color:var(--ink);resize:vertical;" placeholder="예: '+L.escapeHtml(defaultCaption)+'"></textarea>' +
        '</div>' +
        '<div class="modal-actions" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
          '<button class="btn btn-ghost" id="shareCancelBtn" type="button">취소</button>' +
          '<div style="display:flex;gap:8px;align-items:center;">' +
            '<button class="btn btn-ghost" id="sharePreviewBtn" type="button" style="border:1px solid var(--rule);font-weight:700;color:var(--brand-strong);">👁️ 미리보기</button>' +
            '<button class="btn btn-primary" id="shareConfirmBtn" type="button" style="font-weight:700;padding:8px 18px;">피드에 게시하기</button>' +
          '</div>' +
        '</div>' +
        '<!-- 실시간 피드 렌더링 사전 확인 슬롯 (#TASK-ES-174) -->' +
        '<div id="sharePreviewSlot" style="display:none;margin-top:14px;padding:12px;background:var(--surface-2);border:1.5px dashed var(--brand);border-radius:14px;">' +
          '<div style="font-size:.78125rem;font-weight:800;color:var(--brand);margin-bottom:8px;display:flex;align-items:center;gap:4px;">' +
            '<span>📱 피드 게시 미리보기 (실제 피드 노출 모습)</span>' +
          '</div>' +
          '<div id="sharePreviewCardBody"></div>' +
        '</div>';
    }

    L.openModal(renderModalHtml(), function(sheet){
      sheet.querySelector('#shareCancelBtn').addEventListener('click', L.closeModal);

      // 직접 사진 첨부 및 드롭존 핸들러 ([#TASK-ES-309], [58])
      var btnPickPhoto = sheet.querySelector('#btnSharePickPhoto');
      var photoDropzone = sheet.querySelector('#sharePhotoDropzone');
      var photoInput = sheet.querySelector('#shareDirectPhotoInput');
      var photoPreviewWrap = sheet.querySelector('#shareDirectPhotoPreviewWrap');
      var photoPreviewImg = sheet.querySelector('#shareDirectPhotoPreviewImg');
      var btnRemovePhoto = sheet.querySelector('#btnShareRemovePhoto');
      var btnChangePhoto = sheet.querySelector('#btnShareChangePhoto');

      function handlePhotoFile(file){
        if(!file) return;
        if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
        else if(navigator && typeof navigator.vibrate === 'function') try { navigator.vibrate(12); } catch(e){}
        L.compressImage(file, 800, 0.82, function(dataUrl){
          customUploadedPhoto = dataUrl;
          if(photoPreviewImg) photoPreviewImg.src = dataUrl;
          if(photoDropzone) photoDropzone.style.display = 'none';
          if(photoPreviewWrap) photoPreviewWrap.style.display = 'flex';
          L.toast('실천 인증 사진이 첨부되었어요! 📸');
        });
      }

      if(photoDropzone && photoInput){
        photoDropzone.onclick = function(e){
          if(e.target === btnPickPhoto || photoDropzone.contains(e.target)){
            photoInput.click();
          }
        };
        photoDropzone.ondragover = function(e){
          e.preventDefault();
          photoDropzone.classList.add('drag-over');
        };
        photoDropzone.ondragleave = function(e){
          e.preventDefault();
          photoDropzone.classList.remove('drag-over');
        };
        photoDropzone.ondrop = function(e){
          e.preventDefault();
          photoDropzone.classList.remove('drag-over');
          if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]){
            handlePhotoFile(e.dataTransfer.files[0]);
          }
        };
      }

      if(photoInput){
        photoInput.onchange = function(e){
          var file = e.target.files && e.target.files[0];
          handlePhotoFile(file);
        };
      }

      if(btnChangePhoto && photoInput){
        btnChangePhoto.onclick = function(e){
          e.stopPropagation();
          photoInput.click();
        };
      }

      if(btnRemovePhoto){
        btnRemovePhoto.onclick = function(e){
          e.stopPropagation();
          if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
          else if(navigator && typeof navigator.vibrate === 'function') try { navigator.vibrate(12); } catch(err){}
          customUploadedPhoto = null;
          if(photoInput) photoInput.value = '';
          if(photoPreviewWrap) photoPreviewWrap.style.display = 'none';
          if(photoDropzone) photoDropzone.style.display = 'flex';
          L.toast('첨부된 사진을 삭제했어요');
        };
      }

      // 미리보기 버튼 핸들러 (#TASK-ES-174, #TASK-ES-301)
      var prevBtn = sheet.querySelector('#sharePreviewBtn');
      var prevSlot = sheet.querySelector('#sharePreviewSlot');
      var prevBody = sheet.querySelector('#sharePreviewCardBody');
      if(prevBtn && prevSlot && prevBody){
        prevBtn.onclick = function(){
          if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
          else if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
          var isShown = prevSlot.style.display !== 'none';
          if(isShown){
            prevSlot.style.display = 'none';
            prevBtn.textContent = '👁️ 미리보기';
            return;
          }
          var caption = (sheet.querySelector('#shareCaptionInput') ? sheet.querySelector('#shareCaptionInput').value.trim() : '') || '갓생 목표를 향해 한 걸음 더 나아가는 중!';
          var goalTitle = curGoal ? curGoal.title : '';
          var p = L.state.profile;
          var catMap = {
            study:'공부·수험', dev:'개발·기획', workout:'운동·헬스', running:'러닝·마라톤', diet:'다이어트·식단',
            career:'커리어·취업', sideproject:'창업·사이드', finance:'재테크·투자', life:'생활·루틴', morning:'기상·모닝루틴',
            parenting:'육아·가족', pet:'반려동물', relation:'관계·소통', reading:'독서·인문', hobby:'취미·창작',
            mental:'멘탈·마인드', clean:'정리·미니멀', travel:'여행·아웃도어'
          };
          var catLabel = catMap[selectedCat] || '공부·수험';
          var previewPhoto = customUploadedPhoto || (curRecord && curPhoto ? curPhoto : null);
          var photoSnippet = previewPhoto ? 
            '<div style="margin:8px 0;"><img src="'+previewPhoto+'" style="max-height:140px;max-width:200px;border-radius:10px;border:1px solid var(--rule);object-fit:cover;" /></div>' : '';

          var msChips = '';
          if(curGoal && curGoal.milestones){
            var activeMs = curGoal.milestones.filter(function(m){ return sel.ms[m.id]; });
            if(activeMs.length){
              msChips = '<div style="display:flex;gap:4px;flex-wrap:wrap;margin:6px 0;">' +
                activeMs.map(function(m){
                  return '<span class="tag on" style="font-size:.72rem;padding:2px 7px;">✓ ' + L.escapeHtml(m.title) + '</span>';
                }).join('') +
              '</div>';
            }
          }

          var recordSnippet = '';
          if(curRecord && curRecord.text){
            recordSnippet = '<div style="background:var(--card);border-radius:8px;padding:8px 10px;font-size:.78125rem;color:var(--ink);margin:6px 0;border-left:3px solid var(--primary);">' +
              '📝 <b>오늘의 실천 기록:</b> ' + L.escapeHtml(curRecord.text) +
            '</div>';
          }

          prevBody.innerHTML = 
            '<div class="feed-card" style="box-shadow:none;border:1px solid var(--rule);padding:12px;border-radius:12px;background:var(--card);">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                  L.avatarHtml(36) +
                  '<div>' +
                    '<div style="font-weight:800;font-size:.875rem;color:var(--ink);">' + L.escapeHtml(p.displayName) + '</div>' +
                    '<div class="faint" style="font-size:.72rem;">방금 전 · <span class="tag" style="font-size:.65rem;padding:1px 5px;">' + catLabel + '</span></div>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              (goalTitle ? '<div style="font-weight:800;font-size:.9rem;color:var(--primary);margin-bottom:4px;">🎯 ' + L.escapeHtml(goalTitle) + '</div>' : '') +
              msChips +
              recordSnippet +
              photoSnippet +
              '<p style="font-size:.84rem;color:var(--ink);margin:6px 0;line-height:1.45;white-space:pre-wrap;">' + L.escapeHtml(caption) + '</p>' +
              '<div style="display:flex;gap:12px;margin-top:8px;padding-top:6px;border-top:1px solid var(--rule);font-size:.75rem;color:var(--ink-soft);">' +
                '<span>❤️ 응원 0</span><span>💬 댓글 0</span>' +
              '</div>' +
            '</div>';

          prevSlot.style.display = 'block';
          prevBtn.textContent = '✕ 미리보기 닫기';
          prevSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };
      }

      // [TASK-ES-308] 🎯 공유 대상 칩 클릭 핸들러 (목표·기록·AI피드백)
      sheet.querySelectorAll('[data-targetgoal]').forEach(function(btn){
        btn.onclick = function(e){
          e.stopPropagation();
          if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
          else if(navigator && typeof navigator.vibrate === 'function') try { navigator.vibrate(12); } catch(err){}
          var gId = btn.dataset.targetgoal;
          sheet.querySelectorAll('[data-targetgoal]').forEach(function(b){ b.classList.toggle('active', b === btn); });
          var gSel = sheet.querySelector('#shareGoalSelect');
          if(gSel && gSel.value !== gId){
            gSel.value = gId;
            gSel.dispatchEvent(new Event('change'));
          }
        };
      });

      sheet.querySelectorAll('[data-targetrec]').forEach(function(btn){
        btn.onclick = function(e){
          e.stopPropagation();
          if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
          else if(navigator && typeof navigator.vibrate === 'function') try { navigator.vibrate(12); } catch(err){}
          var rIdx = btn.dataset.targetrec;
          sheet.querySelectorAll('[data-targetrec]').forEach(function(b){ b.classList.toggle('active', b === btn); });
          var rSel = sheet.querySelector('#shareRecordSelect');
          if(rSel && rSel.value !== rIdx){
            rSel.value = rIdx;
            rSel.dispatchEvent(new Event('change'));
          }
        };
      });

      sheet.querySelectorAll('[data-targetfb]').forEach(function(btn){
        btn.onclick = function(e){
          e.stopPropagation();
          if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
          else if(navigator && typeof navigator.vibrate === 'function') try { navigator.vibrate(12); } catch(err){}
          var fbIdx = btn.dataset.targetfb;
          sheet.querySelectorAll('[data-targetfb]').forEach(function(b){ b.classList.toggle('active', b === btn); });
          var fSel = sheet.querySelector('#shareFeedbackSelect');
          if(fSel && fSel.value !== fbIdx){
            fSel.value = fbIdx;
            fSel.dispatchEvent(new Event('change'));
          }
        };
      });

      // Goal selection change
      var goalSelect = sheet.querySelector('#shareGoalSelect');
      var msSection = sheet.querySelector('#shareMsSection');
      var msSlot = sheet.querySelector('#shareMsListSlot');

      function bindMsClicks(){
        sheet.querySelectorAll('[data-shms]').forEach(function(row){
          row.onclick = function(){
            var id = row.dataset.shms;
            sel.ms[id] = !sel.ms[id];
            var chk = row.querySelector('[data-shmschk]');
            if(chk){
              chk.classList.toggle('on', sel.ms[id]);
              chk.textContent = sel.ms[id] ? '✓' : '';
              chk.style.borderColor = sel.ms[id] ? 'var(--chip)' : 'var(--rule)';
              chk.style.background = sel.ms[id] ? 'var(--chip)' : 'transparent';
            }
          };
        });
      }
      bindMsClicks();

      if(goalSelect){
        goalSelect.addEventListener('change', function(){
          var val = goalSelect.value;
          // [TASK-ES-308] 칩 동기화
          sheet.querySelectorAll('[data-targetgoal]').forEach(function(b){ b.classList.toggle('active', b.dataset.targetgoal === val); });
          curGoal = userGoals.find(function(g){ return g.id === val; }) || null;
          if(curGoal && curGoal.milestones && curGoal.milestones.length){
            msSection.style.display = 'block';
            sel.ms = {};
            curGoal.milestones.forEach(function(m){ sel.ms[m.id] = (m.status === 'doing' || m.status === 'done'); });
            msSlot.innerHTML = curGoal.milestones.map(function(m){
              var checked = !!sel.ms[m.id];
              return '<div class="ms-row" data-shms="'+m.id+'" style="cursor:pointer;padding:6px 8px;margin-bottom:4px;background:var(--card);border:1px solid var(--rule);border-radius:8px;">' +
                '<div class="ms-main" style="display:flex;align-items:center;gap:8px;">' +
                  '<div class="sel-check'+(checked ? ' on' : '')+'" data-shmschk="'+m.id+'" style="width:18px;height:18px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.8125rem;font-weight:700;border:1px solid '+(checked?'var(--chip)':'var(--rule)')+';background:'+(checked?'var(--chip)':'transparent')+';color:#fff;">'+(checked ? '✓' : '')+'</div>' +
                  '<div style="flex:1;min-width:0;font-size:.8125rem;font-weight:600;">'+(m.status==='done'?'✅ ':(m.status==='doing'?'🔥 ':'· '))+L.escapeHtml(m.title)+'</div>' +
                '</div>' +
              '</div>';
            }).join('');
            bindMsClicks();
          } else {
            msSection.style.display = 'none';
          }
        });
      }

      // Record selection change
      var recSelect = sheet.querySelector('#shareRecordSelect');
      var recDetailBox = sheet.querySelector('#shareRecordDetailBox');
      var rowIncPhoto = sheet.querySelector('#rowIncPhoto');
      var fbSelect = sheet.querySelector('#shareFeedbackSelect');
      var fbBox = sheet.querySelector('#shareFeedbackPreviewBox');
      var fbTxt = sheet.querySelector('#shareFeedbackPreviewText');
      var chkFeedback = sheet.querySelector('#chkIncFeedback');

      if(recSelect){
        recSelect.addEventListener('change', function(){
          var val = recSelect.value;
          // [TASK-ES-308] 칩 동기화
          sheet.querySelectorAll('[data-targetrec]').forEach(function(b){ b.classList.toggle('active', b.dataset.targetrec === val); });
          var captionInput = sheet.querySelector('#shareCaptionInput');
          if(val === '__none__'){
            curRecord = null;
            curPhoto = null;
            recDetailBox.style.display = 'none';
            // 기록 미선택 시 기본 목표 다짐으로 복귀
            if(captionInput){
              captionInput.value = curGoal ? ('"' + curGoal.title + '" 목표를 향해 집중하고 있습니다. 함께 달려요! 💪') : '오늘도 목표를 향해 한 걸음 내딛습니다. 모두 파이팅해요! ✨';
            }
          } else {
            var idx = parseInt(val, 10);
            curRecord = userRecords[idx] || null;
            if(curRecord){
              recDetailBox.style.display = 'block';
              curPhoto = curRecord.photo || null;
              rowIncPhoto.style.display = curPhoto ? 'flex' : 'none';

              // [#TASK-ES-314], [63] 1) 기록 맞춤형 나누고싶은 한마디/다짐 플레이스홀더 및 힌트 실시간 생성
              if(captionInput){
                var pledgeMsg = (typeof generateRecordPledgeMessage === 'function')
                  ? generateRecordPledgeMessage(curRecord, curGoal)
                  : ('오늘 실천 완료! "' + ((curRecord.title || curRecord.text || '').slice(0, 40)) + '" 꾸준히 나아갑니다 🔥');
                captionInput.value = '';
                captionInput.placeholder = '예: ' + pledgeMsg;
              }

              // [#TASK-ES-314], [63] 2) 기록 맞춤형 AI 피드백 실시간 자동 연동
              if(curRecord.feedback){
                curFeedback = curRecord.feedback;
                var fbIndex = availableFeedbacks.findIndex(function(f){ return f.raw === curRecord.feedback; });
                if(fbIndex !== -1 && fbSelect){
                  fbSelect.value = fbIndex;
                  sheet.querySelectorAll('[data-targetfb]').forEach(function(b){ b.classList.toggle('active', b.dataset.targetfb === String(fbIndex)); });
                }
                if(fbBox && fbTxt){
                  fbBox.style.display = 'block';
                  fbTxt.textContent = typeof curFeedback === 'string' ? curFeedback : (curFeedback.comment || curFeedback.verdict || '');
                }
                if(chkFeedback) chkFeedback.checked = true;
              } else if(fbSelect && availableFeedbacks.length > 0){
                // 기록 직접 피드백 부재 시 키워드 연관 조언 또는 최신 조언 자동 매칭
                var matchedFbIdx = availableFeedbacks.findIndex(function(f){
                  var rTitle = (curRecord.title || curRecord.text || '').slice(0, 8);
                  return rTitle && f.text && f.text.includes(rTitle);
                });
                if(matchedFbIdx === -1) matchedFbIdx = 0;
                fbSelect.value = String(matchedFbIdx);
                sheet.querySelectorAll('[data-targetfb]').forEach(function(b){ b.classList.toggle('active', b.dataset.targetfb === String(matchedFbIdx)); });
                curFeedback = availableFeedbacks[matchedFbIdx].raw;
                if(fbBox && fbTxt){
                  fbBox.style.display = 'block';
                  fbTxt.textContent = availableFeedbacks[matchedFbIdx].text;
                }
                if(chkFeedback) chkFeedback.checked = true;
              }
            }
          }
        });
      }

      // Feedback selection change
      if(fbSelect){
        fbSelect.addEventListener('change', function(){
          var val = fbSelect.value;
          // [TASK-ES-308] 칩 동기화
          sheet.querySelectorAll('[data-targetfb]').forEach(function(b){ b.classList.toggle('active', b.dataset.targetfb === val); });
          if(val === '__none__'){
            curFeedback = null;
            if(fbBox) fbBox.style.display = 'none';
            if(chkFeedback) chkFeedback.checked = false;
          } else {
            var idx = parseInt(val, 10);
            var picked = availableFeedbacks[idx];
            if(picked){
              curFeedback = picked.raw;
              if(fbBox && fbTxt){
                fbBox.style.display = 'block';
                fbTxt.textContent = picked.text;
              }
              if(chkFeedback) chkFeedback.checked = true;
            }
          }
        });
      }

      // Category chip change ([#TASK-ES-310], [59])
      sheet.querySelectorAll('[data-shcat]').forEach(function(btn){
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          if(typeof L.triggerHaptic === 'function') L.triggerHaptic(12);
          else if(navigator && typeof navigator.vibrate === 'function') try { navigator.vibrate(12); } catch(err){}
          selectedCat = btn.dataset.shcat;
          sheet.querySelectorAll('[data-shcat]').forEach(function(b){ b.classList.toggle('active', b === btn); });
          try {
            btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          } catch(se){}
        });
      });

      // Submit
      sheet.querySelector('#shareConfirmBtn').addEventListener('click', async function(){
        var capInp = sheet.querySelector('#shareCaptionInput');
        var caption = (capInp ? capInp.value.trim() : '') || (capInp && capInp.placeholder ? capInp.placeholder.replace(/^예:\s*/, '') : '갓생 목표를 향해 한 걸음 더 나아가는 중!');
        if(!caption){ L.toast('한마디 소감을 입력해주세요'); return; }

        var finalGoalTitle = null;
        var finalGoalPct = null;
        var pickedMilestones = [];

        if(curGoal){
          finalGoalTitle = curGoal.title;
          finalGoalPct = L.goalProgress(curGoal);
          if(curGoal.milestones){
            pickedMilestones = curGoal.milestones.filter(function(m){ return sel.ms[m.id]; }).map(function(m){
              return { title: m.title, status: m.status };
            });
          }
        } else if(userGoals.length > 0){
          var gSelVal = sheet.querySelector('#shareGoalSelect').value;
          var foundG = userGoals.find(function(g){ return g.id === gSelVal; });
          if(foundG){
            finalGoalTitle = foundG.title;
            finalGoalPct = L.goalProgress(foundG);
          }
        }

        var incRecord = sheet.querySelector('#chkIncRecord') ? sheet.querySelector('#chkIncRecord').checked : false;
        var incFeedback = curFeedback ? true : (sheet.querySelector('#chkIncFeedback') ? sheet.querySelector('#chkIncFeedback').checked : false);
        var incPhoto = sheet.querySelector('#chkIncPhoto') ? sheet.querySelector('#chkIncPhoto').checked : false;
        var finalPhoto = customUploadedPhoto || ((incPhoto && curPhoto) ? curPhoto : null);

        var postId = 'post_' + L.newId();
        var post = {
          id: postId,
          user_id: L.state.profile.id,
          display_name: L.state.profile.displayName,
          avatar_url: L.state.profile.avatarUrl || null,
          goal_title: finalGoalTitle,
          caption: caption,
          cheers_count: 0,
          created_at: L.nowISO(),
          photo: finalPhoto,
          extra: {
            category: selectedCat,
            includeRecord: (incRecord && curRecord) ? true : false,
            recordText: (incRecord && curRecord) ? curRecord.text : null,
            photo: finalPhoto,
            includeFeedback: (incFeedback && curFeedback) ? true : false,
            feedback: (incFeedback && curFeedback) ? (typeof curFeedback === 'string' ? { comment: curFeedback, verdict: 'PASS', source: 'ai_coach' } : { verdict: curFeedback.verdict, comment: curFeedback.comment || curFeedback.text, source: curFeedback.source || 'ai_coach' }) : null,
            includeGoal: !!finalGoalTitle,
            goalPct: finalGoalPct,
            milestones: pickedMilestones,
            comments: []
          }
        };

        // Try supabase insert (with offline fallback)
        try {
          await L.sb.from('feed_posts').insert(post);
        } catch(e){
          console.warn('Supabase post insert failed, saving locally:', e);
        }

        // Local cache & profile persistence
        if(!L.state.profile.settings.myFeedPosts) L.state.profile.settings.myFeedPosts = [];
        L.state.profile.settings.myFeedPosts.unshift(post);
        await L.saveProfile();

        if(!L.FEED_POSTS_CACHE) L.FEED_POSTS_CACHE = [];
        L.FEED_POSTS_CACHE.unshift(post);

        L.closeModal();
        L.triggerHaptic(15);
        L.burstConfetti(window.innerWidth / 2, window.innerHeight / 3, 16);
        L.toast('피드에 내 목표/기록이 성공적으로 게시되었어요!');

        L.state.commSubTab = 'feed';
        L.setTab('comm');
        L.renderCommScreen();

        // 2.5초 후 가상 페르소나의 자율 축하 및 상호소통 응원 댓글 트리거
        if(L.state.profile.settings.virtualCheerEnabled !== false){
          setTimeout(function(){
            addSimulatedCheerAndReplyToPost(postId, finalGoalTitle, caption);
          }, 2400);
        }
      });
    });
  }

  K.addSimulatedCheerAndReplyToPost = addSimulatedCheerAndReplyToPost;
  K.openShareToFeedModal = openShareToFeedModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
