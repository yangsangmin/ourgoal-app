/**
 * OurGoal Attachments (목표 — 참고자료 첨부: 유튜브/영상·이미지·텍스트 메모·웹링크)
 *
 * 목표·일정의 참고자료 첨부 창(openAddAttachmentModal)·보기 창(openAttachmentViewer)·칩 그리기·칩 누르기 연결, 목표 도우미 결과 반영(applyGoalAgentOp·buildGoalFromAgentData·normalizeSequentialMilestoneDates).
 * window 노출 묶음(if 안 window.X = …)은 index.html 원래 자리에 그대로 있다(js/calendar-attachment.js 등이 그 이름을 찾는다).
 * #TASK-ES-483(인라인 어려움 구역 H1 3차): index.html 인라인 IIFE 의 구간(이전 전 8647~8659 · 8660~8675 · 8676~8729 · 8730~9009 · 9016~9062 · 9063~9100 · 9101~9132 · 9133~9206줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ---- 이전 전 index.html 8647~8659줄(#TASK-ES-483 생성기 표지) ---- */
  function renderAttachmentChipsHtml(attachments, targetKind, targetId, parentId){
    if(!attachments || !attachments.length) return '';
    return '<div class="att-chips-wrap" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">' +
      attachments.map(function(att, idx){
        var icon = att.type === 'video' ? '🎥' : (att.type === 'image' ? '🖼️' : (att.type === 'text' ? '📝' : '🔗'));
        var typeClass = 'type-' + (att.type || 'link');
        return '<span class="att-chip att-chip-rich ' + typeClass + '" data-openatt="'+idx+'" data-attkind="'+targetKind+'" data-attid="'+targetId+'" data-attpid="'+(parentId||'')+'" title="'+L.escapeHtml(att.title||'')+'">' +
          '<span style="font-size:.875rem;">' + icon + '</span> ' +
          '<span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + L.escapeHtml(att.title || '참고자료') + '</span>' +
        '</span>';
      }).join('') +
    '</div>';
  }
  /* ---- 이전 전 index.html 8660~8675줄(#TASK-ES-483 생성기 표지) ---- */

  /* [#TASK-ES-274] 인라인 목표/마일스톤/할일용 시각적 미니 칩 렌더러 */
  function renderInlineAttachmentChips(attachments, targetKind, targetId, parentId){
    if(!attachments || !attachments.length) return '';
    return '<span class="att-chips-inline" style="display:inline-flex;flex-wrap:wrap;gap:4px;vertical-align:middle;">' +
      attachments.map(function(att, idx){
        var icon = att.type === 'video' ? '🎥' : (att.type === 'image' ? '🖼️' : (att.type === 'text' ? '📝' : '🔗'));
        var typeClass = 'type-' + (att.type || 'link');
        var safeTitle = L.escapeHtml(att.title || '참고자료');
        return '<span class="att-chip att-chip-mini ' + typeClass + '" data-openatt="'+idx+'" data-attkind="'+targetKind+'" data-attid="'+targetId+'" data-attpid="'+(parentId||'')+'" title="'+safeTitle+' (클릭하여 열기)" role="button" tabindex="0">' +
          '<span class="att-chip-mini-icon">' + icon + '</span>' +
          '<span class="att-chip-mini-text">' + safeTitle + '</span>' +
        '</span>';
      }).join('') +
    '</span>';
  }
  /* ---- 이전 전 index.html 8676~8729줄(#TASK-ES-483 생성기 표지) ---- */

  function openAttachmentViewer(att, onEdit, onDelete){
    var contentHtml = '';
    if(att.type === 'video'){
      var ytMatch = (att.url||'').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
      if(ytMatch){
        contentHtml = '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:12px 0;">' +
          '<iframe src="https://www.youtube.com/embed/'+ytMatch[1]+'" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:12px;" allowfullscreen></iframe>' +
        '</div>';
      } else {
        var hasYtUrl = att.url && att.url.trim() && /^https?:\/\//i.test(att.url.trim());
        contentHtml = '<div style="margin:12px 0;padding:16px;background:var(--card2);border-radius:12px;text-align:center;">' +
          '<div style="font-size:2.5rem;margin-bottom:8px;">🎥</div>' +
          '<p class="faint" style="margin:0 0 12px;font-size:.875rem;">유튜브에서 관련 영상 자료를 확인해보세요</p>' +
          (hasYtUrl ? '<a href="'+L.escapeHtml(att.url)+'" target="_blank" rel="noopener" class="btn btn-primary btn-sm">유튜브에서 보기</a>' : '<button type="button" class="btn btn-ghost btn-sm" onclick="toast(\'등록된 영상 주소가 없습니다.\')" style="cursor:pointer;">영상 주소 없음</button>') +
        '</div>';
      }
    } else if(att.type === 'image'){
      contentHtml = '<div style="margin:12px 0;text-align:center;">' +
        '<img src="'+L.escapeHtml(att.url)+'" style="max-width:100%;max-height:360px;border-radius:12px;object-fit:contain;border:1px solid var(--rule);" onerror="this.alt=\'이미지를 불러올 수 없어요\';">' +
      '</div>';
    } else if(att.type === 'text'){
      contentHtml = '<div style="margin:12px 0;padding:14px;background:var(--card2);border-radius:12px;white-space:pre-wrap;line-height:1.6;font-size:.875rem;border:1px solid var(--rule);">' +
        L.escapeHtml(att.note || att.url || '') +
      '</div>';
    } else {
      var hasLinkUrl = att.url && att.url.trim() && /^https?:\/\//i.test(att.url.trim());
      contentHtml = '<div style="margin:12px 0;padding:14px;background:var(--card2);border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--rule);">' +
        '<span style="font-size:.875rem;word-break:break-all;color:var(--ink-soft);">'+L.escapeHtml(att.url || '링크 주소 없음')+'</span>' +
        (hasLinkUrl ? '<a href="'+L.escapeHtml(att.url)+'" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="flex:0 0 auto;">열기</a>' : '<button type="button" class="btn btn-ghost btn-sm" onclick="toast(\'등록된 링크 주소가 없습니다.\')" style="flex:0 0 auto;cursor:pointer;">열기 불가</button>') +
      '</div>';
    }

    L.openModal(
      '<h3>'+(att.type==='video'?'🎥 ':(att.type==='image'?'🖼️ ':(att.type==='text'?'📝 ':'🔗 ')))+L.escapeHtml(att.title || '참고자료')+'</h3>' +
      contentHtml +
      (att.note && att.type !== 'text' ? '<p class="faint" style="font-size:.8125rem;margin:8px 0 14px;line-height:1.5;">'+L.escapeHtml(att.note)+'</p>' : '') +
      '<div class="modal-actions">' +
        (onDelete ? '<button class="btn btn-danger btn-sm" id="attDelConfirmBtn" type="button">삭제</button>' : '') +
        '<button class="btn btn-primary btn-sm" id="attCloseBtn" type="button">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#attCloseBtn').addEventListener('click', L.closeModal);
        var delBtn = sheet.querySelector('#attDelConfirmBtn');
        if(delBtn){
          delBtn.addEventListener('click', async function(){
            if(!(await OurgoalCapabilities.call('ui.confirm', '이 참고자료를 삭제할까요?'))) return;
            L.closeModal();
            if(onDelete) await onDelete();
          });
        }
      }
    );
  }
  /* ---- 이전 전 index.html 8730~9009줄(#TASK-ES-483 생성기 표지) ---- */

  function openAddAttachmentModal(targetItem, onSaved, onCancel){
    var draftAtt = { type: 'video', title: '', url: '', note: '' };
    L.openModal(
      '<h3>참고자료 첨부</h3>' +
      '<p class="faint" style="margin:-8px 0 12px;">유튜브 영상, 이미지 파일, 텍스트 메모, 웹 링크를 등록하세요.</p>' +
      '<!-- 스마트 툴바: 원클릭 클립보드 붙여넣기 및 4대 실천 퀵 프리셋 -->' +
      '<div class="att-smart-toolbar">' +
        '<button type="button" class="att-clipboard-btn" id="attClipboardBtn">' +
          '<span>⚡</span> 클립보드에서 링크 바로 가져오기' +
        '</button>' +
        '<div style="font-size:.72rem;font-weight:700;color:var(--ink-soft);margin-top:2px;">실천 퀵 프리셋:</div>' +
        '<div class="att-preset-group">' +
          '<button type="button" class="att-preset-chip" data-attpreset="workout">🏋️ 운동 자세 영상</button>' +
          '<button type="button" class="att-preset-chip" data-attpreset="study">📚 공식 문서·자료</button>' +
          '<button type="button" class="att-preset-chip" data-attpreset="note">💡 핵심 요약 메모</button>' +
          '<button type="button" class="att-preset-chip" data-attpreset="photo">📸 오답·결과 사진</button>' +
        '</div>' +
      '</div>' +
      '<div class="format-toggle" id="attTypeToggle" style="margin-bottom:12px;">' +
        '<div class="format-opt active" data-atttype="video">영상/유튜브</div>' +
        '<div class="format-opt" data-atttype="image">이미지</div>' +
        '<div class="format-opt" data-atttype="text">메모</div>' +
        '<div class="format-opt" data-atttype="link">링크</div>' +
      '</div>' +
      '<div class="field"><label>제목 (필수)</label><input id="attTitleInput" type="text" placeholder="예: 미역국 끓이는 법 영상, 운동 폼 가이드"></div>' +
      '<div id="attUrlField" class="field">' +
        '<label>웹 주소 / 유튜브 링크</label>' +
        '<input id="attUrlInput" type="url" placeholder="https://www.youtube.com/watch?v=...">' +
      '</div>' +
      '<!-- 실시간 스마트 비주얼 프리뷰 카드 -->' +
      '<div id="attLivePreviewWrap" style="display:none;margin-bottom:12px;"></div>' +
      '<div id="attImageField" style="display:none;margin-bottom:12px;">' +
        '<label style="display:block;font-size:.8125rem;font-weight:700;margin-bottom:4px;">이미지 파일 선택</label>' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
          '<div id="attImgPreview" style="width:60px;height:60px;border-radius:10px;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:1.5rem;overflow:hidden;border:1px solid var(--rule);"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m21 16-5-5-8 8"/></svg></div>' +
          '<div>' +
            '<button class="btn btn-ghost btn-sm" id="attPickFileBtn" type="button">사진 선택하기</button>' +
            '<input type="file" id="attFileInput" accept="image/*" style="display:none;">' +
            '<div class="faint" style="font-size:.7rem;margin-top:3px;">또는 아래에 이미지 웹 주소를 입력하세요</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="field"><label>메모 / 설명 (선택)</label><textarea id="attNoteInput" rows="2" placeholder="기억해둘 핵심 내용이나 팁을 적어주세요" style="width:100%;box-sizing:border-box;border-radius:8px;padding:8px;border:1px solid var(--rule);background:var(--surface-2);color:var(--ink);"></textarea></div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="attCancelBtn" type="button">취소</button>' +
        '<button class="btn btn-primary" id="attSaveBtn" type="button">첨부 추가</button>' +
      '</div>',
      function(sheet){
        var urlField = sheet.querySelector('#attUrlField');
        var imgField = sheet.querySelector('#attImageField');
        var fileInput = sheet.querySelector('#attFileInput');
        var preview = sheet.querySelector('#attImgPreview');
        var urlInput = sheet.querySelector('#attUrlInput');
        var titleInput = sheet.querySelector('#attTitleInput');
        var noteInput = sheet.querySelector('#attNoteInput');
        var previewWrap = sheet.querySelector('#attLivePreviewWrap');

        function setType(typeKey){
          draftAtt.type = typeKey;
          sheet.querySelectorAll('#attTypeToggle .format-opt').forEach(function(o){
            o.classList.toggle('active', o.dataset.atttype === typeKey);
          });
          if(typeKey === 'image'){
            imgField.style.display = 'block';
            urlField.style.display = 'block';
            urlInput.placeholder = '또는 이미지 웹 주소 (https://...)';
          } else if(typeKey === 'text'){
            imgField.style.display = 'none';
            urlField.style.display = 'none';
            previewWrap.style.display = 'none';
          } else if(typeKey === 'video'){
            imgField.style.display = 'none';
            urlField.style.display = 'block';
            urlInput.placeholder = 'https://www.youtube.com/watch?v=...';
          } else {
            imgField.style.display = 'none';
            urlField.style.display = 'block';
            urlInput.placeholder = 'https://...';
          }
        }

        function updateSmartPreview(rawUrl){
          var url = (rawUrl || '').trim();
          if(!url){
            previewWrap.style.display = 'none';
            return;
          }
          // 1. 유튜브 감지
          var ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
          if(ytMatch){
            setType('video');
            var vid = ytMatch[1];
            var thumbUrl = 'https://img.youtube.com/vi/' + vid + '/hqdefault.jpg';
            previewWrap.innerHTML = '' +
              '<div class="att-live-preview-box">' +
                '<div class="att-preview-thumb-wrap">' +
                  '<img src="' + thumbUrl + '" class="att-preview-thumb-img" onerror="this.src=\'\'">' +
                  '<div class="att-yt-play-icon">▶</div>' +
                '</div>' +
                '<div class="att-preview-meta">' +
                  '<span class="att-preview-badge att-badge-youtube">YouTube 영상</span>' +
                  '<div class="att-preview-title">' + (titleInput.value.trim() || '유튜브 영상 자료') + '</div>' +
                  '<div class="att-preview-sub">ID: ' + vid + ' · 재생 준비 완료</div>' +
                '</div>' +
              '</div>';
            previewWrap.style.display = 'block';
            if(!titleInput.value.trim()){
              titleInput.placeholder = '유튜브 영상 제목을 입력해주세요';
            }
            return;
          }
          // 2. 이미지 URL 감지
          if(url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)){
            setType('image');
            previewWrap.innerHTML = '' +
              '<div class="att-live-preview-box">' +
                '<div class="att-preview-thumb-wrap">' +
                  '<img src="' + L.escapeHtml(url) + '" class="att-preview-thumb-img">' +
                '</div>' +
                '<div class="att-preview-meta">' +
                  '<span class="att-preview-badge att-badge-image">이미지 파일</span>' +
                  '<div class="att-preview-title">' + (titleInput.value.trim() || '웹 이미지') + '</div>' +
                  '<div class="att-preview-sub">온라인 이미지 링크 감지됨</div>' +
                '</div>' +
              '</div>';
            previewWrap.style.display = 'block';
            return;
          }
          // 3. 일반 웹 URL 감지
          if(url.match(/^https?:\/\//i)){
            if(draftAtt.type !== 'image' && draftAtt.type !== 'video'){
              setType('link');
            }
            var domain = '';
            try { domain = (new URL(url)).hostname; } catch(e){}
            previewWrap.innerHTML = '' +
              '<div class="att-live-preview-box">' +
                '<div class="att-preview-thumb-wrap" style="background:var(--brand-soft);color:var(--brand);font-size:1.5rem;">' +
                  '🔗' +
                '</div>' +
                '<div class="att-preview-meta">' +
                  '<span class="att-preview-badge att-badge-web">' + (domain || '웹 레퍼런스') + '</span>' +
                  '<div class="att-preview-title">' + (titleInput.value.trim() || domain || '참고 링크') + '</div>' +
                  '<div class="att-preview-sub">' + L.escapeHtml(url) + '</div>' +
                '</div>' +
              '</div>';
            previewWrap.style.display = 'block';
            return;
          }
          previewWrap.style.display = 'none';
        }

        sheet.querySelectorAll('#attTypeToggle .format-opt').forEach(function(opt){
          opt.addEventListener('click', function(){
            setType(opt.dataset.atttype);
            updateSmartPreview(urlInput.value);
          });
        });

        // 실시간 URL 입력 리스너
        urlInput.addEventListener('input', function(){
          updateSmartPreview(urlInput.value);
        });
        urlInput.addEventListener('paste', function(){
          setTimeout(function(){ updateSmartPreview(urlInput.value); }, 50);
        });

        // 클립보드 붙여넣기 퀵 액션
        var clipBtn = sheet.querySelector('#attClipboardBtn');
        if(clipBtn){
          clipBtn.addEventListener('click', async function(){
            try {
              if(!navigator.clipboard || !navigator.clipboard.readText){
                L.toast('브라우저 클립보드 권한을 확인해주세요. 주소를 직접 붙여넣어주세요.');
                urlInput.focus();
                return;
              }
              var text = await navigator.clipboard.readText();
              text = (text || '').trim();
              if(!text){
                L.toast('클립보드가 비어있어요. 복사한 링크를 직접 입력해주세요.');
                urlInput.focus();
                return;
              }
              urlInput.value = text;
              updateSmartPreview(text);
              L.toast('클립보드 링크를 불러왔어요! ✨');
            } catch(e){
              L.toast('클립보드 링크를 직접 입력창에 붙여넣어주세요.');
              urlInput.focus();
            }
          });
        }

        // 4대 실천 퀵 프리셋 ([#TASK-ES-191] 입력창 지움 피로도 근절: value 강제 주입 제거 및 placeholder 힌트화)
        sheet.querySelectorAll('[data-attpreset]').forEach(function(btn){
          btn.addEventListener('click', function(){
            var p = btn.dataset.attpreset;
            if(p === 'workout'){
              setType('video');
              titleInput.value = '';
              titleInput.placeholder = '예: 운동 자세 & 폼 가이드 영상';
              titleInput.dataset.presetTitle = '운동 자세 & 폼 가이드 영상';
              noteInput.value = '';
              noteInput.placeholder = '예: 호흡 타이밍과 세트별 자세 주의사항 체크하기';
              noteInput.dataset.presetNote = '호흡 타이밍과 세트별 자세 주의사항 체크하기';
              urlInput.placeholder = '유튜브 영상 링크를 붙여넣으세요';
              L.toast('운동 자세 영상 프리셋을 적용했어요');
            } else if(p === 'study'){
              setType('link');
              titleInput.value = '';
              titleInput.placeholder = '예: 공식 문서 & 학습 레퍼런스';
              titleInput.dataset.presetTitle = '공식 문서 & 학습 레퍼런스';
              noteInput.value = '';
              noteInput.placeholder = '예: 시험 및 프로젝트에 꼭 필요한 핵심 공식 문서';
              noteInput.dataset.presetNote = '시험 및 프로젝트에 꼭 필요한 핵심 공식 문서';
              urlInput.placeholder = '공식 가이드나 기술 블로그 링크 입력';
              L.toast('공식 문서 프리셋을 적용했어요');
            } else if(p === 'note'){
              setType('text');
              titleInput.value = '';
              titleInput.placeholder = '예: 실천 핵심 요약 메모';
              titleInput.dataset.presetTitle = '실천 핵심 요약 메모';
              noteInput.value = '';
              noteInput.placeholder = '예: 1. 시작 전 필수 준비사항\n2. 오늘의 핵심 실천 포인트';
              noteInput.dataset.presetNote = '1. 시작 전 필수 준비사항\n2. 오늘의 핵심 실천 포인트';
              L.toast('핵심 요약 메모 프리셋을 적용했어요');
            } else if(p === 'photo'){
              setType('image');
              titleInput.value = '';
              titleInput.placeholder = '예: 오답노트 & 결과 인증 사진';
              titleInput.dataset.presetTitle = '오답노트 & 결과 인증 사진';
              noteInput.value = '';
              noteInput.placeholder = '예: 기억해둘 핵심 오답 분석 및 증빙';
              noteInput.dataset.presetNote = '기억해둘 핵심 오답 분석 및 증빙';
              L.toast('사진 인증 프리셋을 적용했어요');
            }
            urlInput.focus();
          });
        });

        sheet.querySelector('#attPickFileBtn').addEventListener('click', function(){ fileInput.click(); });
        fileInput.onchange = function(e){
          var f = e.target.files[0];
          if(!f) return;
          L.resizeImageToDataUrl(f, 600, function(dataUrl){
            if(!dataUrl){ L.toast('사진을 불러오지 못했어요'); return; }
            draftAtt.url = dataUrl;
            preview.innerHTML = '<img src="'+dataUrl+'" style="width:100%;height:100%;object-fit:cover;">';
          });
        };

        sheet.querySelector('#attCancelBtn').addEventListener('click', function(){ L.closeModal(true); if(typeof onCancel === 'function') onCancel(); });
        sheet.querySelector('#attSaveBtn').addEventListener('click', async function(){
          var titleInp = sheet.querySelector('#attTitleInput');
          var noteInp = sheet.querySelector('#attNoteInput');
          var title = (titleInp ? titleInp.value.trim() : '') || (titleInp && titleInp.dataset.presetTitle) || (titleInp && titleInp.placeholder ? titleInp.placeholder.replace(/^예:\s*/, '') : '');
          var url = (sheet.querySelector('#attUrlInput').value || '').trim();
          var note = (noteInp ? noteInp.value.trim() : '') || (noteInp && noteInp.dataset.presetNote) || (noteInp && noteInp.placeholder ? noteInp.placeholder.replace(/^예:\s*/, '') : '');
          if(!title){ L.toast('제목을 입력해주세요'); return; }
          if(draftAtt.type !== 'text' && !url && !draftAtt.url){
            L.toast('웹 주소나 사진 파일을 등록해주세요');
            return;
          }
          if(url && !draftAtt.url) draftAtt.url = url;
          draftAtt.title = title;
          draftAtt.note = note;
          draftAtt.id = L.uid('att');

          targetItem.attachments = targetItem.attachments || [];
          targetItem.attachments.push(draftAtt);
          await L.saveProfile();
          L.closeModal(true);
          if(onSaved) onSaved();
          L.toast('"'+title+'" 참고자료를 첨부했어요');
        });
      }
    );
  }

  /* ---- 이전 전 index.html 9016~9062줄(#TASK-ES-483 생성기 표지) ---- */

  function wireAttachmentChipClicks(container){
    if(!container) return;
    container.querySelectorAll('.att-chip[data-openatt]').forEach(function(chip){
      chip.addEventListener('click', function(e){
        e.stopPropagation();
        if(typeof L.triggerHapticFeedback === 'function') L.triggerHapticFeedback(12);
        var idx = parseInt(chip.dataset.openatt, 10);
        var kind = chip.dataset.attkind;
        var id = chip.dataset.attid;
        var pid = chip.dataset.attpid;

        var target = null;
        var parentGoal = null;
        if(kind === 'goal'){
          target = L.state.profile.goals.find(function(g){ return g.id === id; });
        } else if(kind === 'ms'){
          L.state.profile.goals.forEach(function(g){
            var found = (g.milestones||[]).find(function(m){ return m.id === id; });
            if(found){ target = found; parentGoal = g; }
          });
        } else if(kind === 'task'){
          L.state.profile.goals.forEach(function(g){
            (g.milestones||[]).forEach(function(m){
              var tf = (m.tasks||[]).find(function(t){ return t.id === id; });
              if(tf){ target = tf; parentGoal = g; }
            });
          });
        } else if(kind === 'custom'){
          target = (L.state.profile.settings.customSchedules || []).find(function(c){ return c.id === id; });
        }
        if(!target || !target.attachments || !target.attachments[idx]) return;
        var att = target.attachments[idx];
        openAttachmentViewer(att, null, async function(){
          target.attachments.splice(idx, 1);
          await L.saveProfile();
          L.renderAll();
          if(L.state.activeTab === 'calendar' && typeof L.renderCalendarScreen === 'function') L.renderCalendarScreen();
          var hubSheet = document.getElementById('modalSheet');
          if(hubSheet && hubSheet.querySelector('#hubAddNewBtn') && L.state.calSelectedDate){
            L.openCalendarDayEditHubModal(L.state.calSelectedDate);
          }
          L.toast('참고자료를 삭제했어요');
        });
      });
    });
  }
  /* ---- 이전 전 index.html 9063~9100줄(#TASK-ES-483 생성기 표지) ---- */

  function normalizeSequentialMilestoneDates(milestones, goalDueDate){
    if(!Array.isArray(milestones) || milestones.length <= 1) return milestones;
    var today = L.dateKey(new Date());
    var dues = milestones.map(function(m){ return m && m.dueDate; }).filter(Boolean);
    var allSame = dues.length > 0 && dues.every(function(d){ return d === dues[0]; });
    var mostlyMissing = dues.length <= Math.ceil(milestones.length * 0.3);
    var hasSeq = milestones.some(function(m){ return m && m.title && /(?:day\s*\d+|\d+일차|\d+주차)/i.test(m.title); });
    var hasValidDistinctDates = dues.length === milestones.length && !allSame;

    if(!hasValidDistinctDates && (allSame || mostlyMissing || hasSeq)){
      var totalSpan = goalDueDate ? Math.max(1, Math.round((new Date(goalDueDate+'T12:00:00') - new Date(today+'T12:00:00')) / 86400000)) : 30;
      var isDaily = milestones.length >= 14 || milestones.some(function(m){ return m && m.title && /(?:day\s*\d+|\d+일차)/i.test(m.title); });
      var isWeekly = !isDaily && milestones.some(function(m){ return m && m.title && /(?:\d+주차|주간)/i.test(m.title); });

      milestones.forEach(function(m, idx){
        if(!m) return;
        var numMatch = (m.title||'').match(/(?:day\s*(\d+)|\b(\d+)일차)/i);
        var itemIdx = numMatch ? (parseInt(numMatch[1]||numMatch[2], 10) - 1) : idx;
        if(itemIdx < 0) itemIdx = idx;

        var d = new Date(today + 'T12:00:00');
        if(isDaily){
          var offset = itemIdx + 1;
          if(offset > totalSpan && goalDueDate) offset = totalSpan;
          d.setDate(d.getDate() + offset);
        } else if(isWeekly){
          var wOffset = Math.min((itemIdx + 1) * 7, totalSpan);
          d.setDate(d.getDate() + wOffset);
        } else {
          var step = Math.max(1, Math.round(((itemIdx + 1) / milestones.length) * totalSpan));
          d.setDate(d.getDate() + step);
        }
        m.dueDate = d.getFullYear() + '-' + L.pad(d.getMonth() + 1) + '-' + L.pad(d.getDate());
      });
    }
    return milestones;
  }
  /* ---- 이전 전 index.html 9101~9132줄(#TASK-ES-483 생성기 표지) ---- */

  function buildGoalFromAgentData(data){
    var rawMilestones = (data.milestones||[]).map(function(m){
      return {
        id: L.uid('ms'),
        title: m.title,
        status: 'todo',
        dueDate: m.dueDate || null,
        attachments: L.sanitizeAttachments(m.attachments || []),
        tasks: (m.tasks||[]).map(function(tk){
          var tkTitle = typeof tk === 'string' ? tk : (tk && tk.title) || '';
          var tkAtts = (tk && tk.attachments) || [];
          var tkDue = (tk && tk.dueDate) || null;
          return { id: L.uid('task'), title: tkTitle, done: false, dueDate: tkDue, attachments: L.sanitizeAttachments(tkAtts) };
        })
      };
    });
    var milestones = normalizeSequentialMilestoneDates(rawMilestones, data.dueDate);
    return {
      id: L.newId(),
      title: data.title,
      dueDate: data.dueDate || null,
      category: 'etc',
      topic: data.topicMajor ? (data.topicMajor+'/'+(data.topicMinor||'')) : '',
      createdAt: L.nowISO(),
      visibility: 'private',
      archivedAt: null,
      result: null,
      attachments: L.sanitizeAttachments(data.attachments || []),
      milestones: milestones
    };
  }
  /* ---- 이전 전 index.html 9133~9206줄(#TASK-ES-483 생성기 표지) ---- */
  function applyGoalAgentOp(op){
    var goals = L.state.profile.goals;
    if(op.level==='goal'){
      if(op.type==='CREATE'){
        var newGoal = buildGoalFromAgentData(op.data);
        goals.push(newGoal);
        L.state.activeGoalId = newGoal.id;
        L.trackGoalCreated(newGoal, 'goal_agent');
        return true;
      }
      var goal = goals.find(function(g){ return g.id===op.goalId; });
      if(!goal) return false;
      if(op.type==='DELETE'){
        L.state.profile.goals = goals.filter(function(g){ return g.id!==op.goalId; });
        if(L.state.activeGoalId===op.goalId) L.state.activeGoalId = null;
        return true;
      }
      if('title' in op.data) goal.title = op.data.title;
      if('dueDate' in op.data) goal.dueDate = op.data.dueDate;
      if('attachments' in op.data) goal.attachments = L.sanitizeAttachments(op.data.attachments);
      return true;
    }
    var goal2 = goals.find(function(g){ return g.id===op.goalId; });
    if(!goal2) return false;
    if(op.level==='milestone'){
      if(op.type==='CREATE'){
        goal2.milestones.push({
          id: L.uid('ms'),
          title: op.data.title,
          status: 'todo',
          dueDate: op.data.dueDate || null,
          attachments: L.sanitizeAttachments(op.data.attachments || []),
          tasks: (op.data.tasks||[]).map(function(tk){
            var tkTitle = typeof tk === 'string' ? tk : (tk && tk.title) || '';
            var tkAtts = (tk && tk.attachments) || [];
            var tkDue = (tk && tk.dueDate) || null;
            return { id: L.uid('task'), title: tkTitle, done: false, dueDate: tkDue, attachments: L.sanitizeAttachments(tkAtts) };
          })
        });
        return true;
      }
      var ms = goal2.milestones.find(function(m){ return m.id===op.milestoneId; });
      if(!ms) return false;
      if(op.type==='DELETE'){
        goal2.milestones = goal2.milestones.filter(function(m){ return m.id!==op.milestoneId; });
        return true;
      }
      if('title' in op.data) ms.title = op.data.title;
      if('dueDate' in op.data) ms.dueDate = op.data.dueDate;
      if('status' in op.data) ms.status = op.data.status;
      if('attachments' in op.data) ms.attachments = L.sanitizeAttachments(op.data.attachments);
      return true;
    }
    var ms2 = goal2.milestones.find(function(m){ return m.id===op.milestoneId; });
    if(!ms2) return false;
    if(op.type==='CREATE'){
      var taskTitle = typeof op.data === 'string' ? op.data : (op.data && op.data.title) || '새 할 일';
      var taskAtts = (op.data && op.data.attachments) || [];
      var taskDue = (op.data && op.data.dueDate) || null;
      ms2.tasks.push({ id: L.uid('task'), title: taskTitle, done: false, dueDate: taskDue, attachments: L.sanitizeAttachments(taskAtts) });
      return true;
    }
    var task = ms2.tasks.find(function(t){ return t.id===op.taskId; });
    if(!task) return false;
    if(op.type==='DELETE'){
      ms2.tasks = ms2.tasks.filter(function(t){ return t.id!==op.taskId; });
      return true;
    }
    if('title' in op.data) task.title = op.data.title;
    if('done' in op.data) task.done = op.data.done;
    if('dueDate' in op.data) task.dueDate = op.data.dueDate;
    if('attachments' in op.data) task.attachments = L.sanitizeAttachments(op.data.attachments);
    return true;
  }

  K.renderAttachmentChipsHtml = renderAttachmentChipsHtml;
  K.renderInlineAttachmentChips = renderInlineAttachmentChips;
  K.openAttachmentViewer = openAttachmentViewer;
  K.openAddAttachmentModal = openAddAttachmentModal;
  K.wireAttachmentChipClicks = wireAttachmentChipClicks;
  K.normalizeSequentialMilestoneDates = normalizeSequentialMilestoneDates;
  K.buildGoalFromAgentData = buildGoalFromAgentData;
  K.applyGoalAgentOp = applyGoalAgentOp;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
