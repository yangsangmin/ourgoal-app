/* 원본 고정본(#TASK-ES-595 보정) — #859(#TASK-ES-591 G054) 병합 직전 커밋 0ff85932 의 index.html 3805~3856줄 openModal 을 글자 그대로 옮겼다. 제품 코드가 아니며 smoke-test 의 동치 대조에만 쓴다. */
  function openModal(html, onMount){
    window._modalOpenAt = Date.now();
    var overlay = document.getElementById('modalOverlay');
    var sheet = document.getElementById('modalSheet');
    if(!overlay || !sheet) return;

    var finalHtml = '';
    var finalOnMount = null;

    if(html && typeof html === 'object'){
      var title = html.title || '';
      var body = html.body || html.content || html.html || '';
      finalOnMount = html.onOpen || html.onMount || onMount;
      finalHtml = (title ? '<div class="modal-head" style="margin-bottom:12px;padding-right:44px;"><h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">' + title + '</h3></div>' : '') + body;
    } else if(typeof html === 'string' && typeof onMount === 'string'){
      finalHtml = '<div class="modal-head" style="margin-bottom:12px;padding-right:44px;"><h3 style="margin:0;font-size:1.125rem;font-weight:800;color:var(--ink);">' + html + '</h3></div>' + onMount;
      if(arguments[2] && typeof arguments[2] === 'function') finalOnMount = arguments[2];
    } else {
      finalHtml = html || '';
      finalOnMount = (typeof onMount === 'function') ? onMount : null;
    }

    // [#UIUX-19] 70세 어르신 인지 배려 우측 상단 44px 큼직한 ✕ 닫기 버튼 자동 주입
    if(finalHtml.indexOf('modal-sheet-close') === -1){
      finalHtml = '<button type="button" class="modal-sheet-close touch-target-44" aria-label="닫기" title="닫기" onclick="if(typeof window.triggerHaptic===\'function\') window.triggerHaptic(12); closeModal();">✕</button>' + finalHtml;
    }

    // [#UIUX-23] 2중 바텀시트 적재(Stacking) 방지: 이미 열려있을 경우 단일 포커스 전환
    sheet.style.transform = '';
    sheet.innerHTML = finalHtml;
    overlay.classList.add('active');
    if(finalOnMount){
      try { finalOnMount(sheet); } catch(mErr){ console.error('[openModal] mount error:', mErr); }
    }

    var dismissHandler = function(e){
      if(e.target === overlay){
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      }
    };
    overlay.onclick = dismissHandler;
    overlay.ontouchend = dismissHandler;

    try {
      if(!_modalHistoryPushed && typeof window!=='undefined' && window.history && history.pushState){
        history.pushState({ ourgoal_modal: true }, '');
        _modalHistoryPushed = true;
      }
    } catch(e){}
  }
