/**
 * OurGoal New Goal Modal (목표 — 새 목표 만들기 창)
 *
 * 「새 목표」 창(promptNewGoal) — 줄글 입력 → 목표설정 도우미 템플릿 만들기, 직접 설정 양식, 검토 단계(showNewGoal*), 로컬 템플릿(localGoalTemplate·generateGoalTemplate).
 * showNewGoal* 를 window 에 다는 로드 중 문은 bindNewGoalStepExports 로 감싸 index.html 원래 자리에서 부른다.
 * #TASK-ES-466(인라인 어려움 묶음 시범): index.html 인라인 IIFE 의 구간(이전 전 14145~14148 · 14152~14194 · 14195~14219 · 14220~14279 · 14280~14282 · 14283~14359 · 14360~14452 · 14453~14456줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 14145~14148줄(#TASK-ES-466 생성기 표지) ---- */
  function promptNewGoal(){
    if(L.isModalDismissCooldown()) return;
    showNewGoalChatStep('');
  }

  /* ---- 이전 전 index.html 14152~14194줄(#TASK-ES-466 생성기 표지) ---- */
  function localGoalTemplate(description){
    var desc = (description || '').trim();
    var title = desc.length > 30 ? desc.slice(0, 30) + '…' : desc;
    if(!title) title = '새로운 목표 달성하기';
    var lower = desc.toLowerCase();
    var topicMajor = 'lifestyle';
    var topicMinor = '습관';
    var msTitles = ['목표 구체화 및 실행 계획 수립', '매일 작은 실천 루틴 지속하기', '중간 점검 및 최종 성과 완성'];

    if(lower.includes('운동') || lower.includes('헬스') || lower.includes('달리기') || lower.includes('러닝') || lower.includes('다이어트') || lower.includes('체중')){
      topicMajor = 'health';
      topicMinor = '운동/체중관리';
      msTitles = ['체형 분석 및 주 3회 운동 루틴 확립', '식단 기록과 점진적 부하 증량', '목표 체중/체력 달성 및 기록 측정'];
    } else if(lower.includes('독서') || lower.includes('책') || lower.includes('글쓰기') || lower.includes('공부') || lower.includes('시험') || lower.includes('자격증') || lower.includes('토익') || lower.includes('영어')){
      topicMajor = 'study';
      topicMinor = '학습/자격증';
      msTitles = ['기본 교재/학습 자료 완독 및 요약', '핵심 기출문제 풀이 및 오답 분석', '실전 모의고사 완주 및 최종 합격'];
    } else if(lower.includes('개발') || lower.includes('코딩') || lower.includes('프로그래밍') || lower.includes('프로젝트') || lower.includes('앱') || lower.includes('웹')){
      topicMajor = 'dev';
      topicMinor = '소프트웨어 개발';
      msTitles = ['프로젝트 기획 및 시스템 아키텍처 설계', '핵심 MVP 기능 구현 및 단위 테스트', '배포 완료 및 사용자 피드백 반영'];
    } else if(lower.includes('돈') || lower.includes('투자') || lower.includes('저축') || lower.includes('재테크') || lower.includes('수익') || lower.includes('월급')){
      topicMajor = 'finance';
      topicMinor = '재테크/자산관리';
      msTitles = ['월별 고정/변동 지출 분석 및 가계부 작성', '종잣돈 저축 및 분산 투자 포트폴리오 구성', '월 목표 저축액 달성 및 자산 결산'];
    }

    return {
      title: title,
      topicMajor: topicMajor,
      topicMinor: topicMinor,
      milestones: msTitles.map(function(t){
        return {
          title: t,
          status: 'todo',
          tasks: [
            t + ' 관련 세부 실행 1',
            t + ' 관련 세부 실행 2'
          ]
        };
      })
    };
  }
  /* ---- 이전 전 index.html 14195~14219줄(#TASK-ES-466 생성기 표지) ---- */
  async function generateGoalTemplate(description){
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 28000);
    var settings = (L.state.profile && L.state.profile.settings) || {};
    try{
      var res = await fetch('/api/goaltemplate', {
        method:'POST', headers:{'Content-Type':'application/json'}, signal: controller.signal,
        body: JSON.stringify({
          description: description,
          geminiKey: settings.geminiKey || ''
        })
      });
      clearTimeout(timer);
      if(!res.ok) {
        var errBody = await res.json().catch(function(){ return {}; });
        if(errBody.error === 'CONTENT_FILTER_REJECTED'){
          return { isBlocked: true, message: errBody.message, detail: errBody.detail, support: errBody.support, notice: errBody.notice };
        }
        return localGoalTemplate(description);
      }
      var data = await res.json();
      if(!data || !data.title || !Array.isArray(data.milestones) || !data.milestones.length) return localGoalTemplate(description);
      return data;
    } catch(e){ clearTimeout(timer); return localGoalTemplate(description); }
  }
  /* ---- 이전 전 index.html 14220~14279줄(#TASK-ES-466 생성기 표지) ---- */
  function showNewGoalChatStep(prevDesc){
    L.openModal(
      '<h3>새 목표</h3>' +
      L.fbBotBubbleHtml(
        '<p style="margin:0;font-size:.9375rem;line-height:1.65;">원하시는 바를 줄글 형태로 작성하시면 목표설정 도우미 봇이 마일스톤과 세부 할 일까지 채운 템플릿을 만들어드려요!</p>' +
        '<p class="faint" style="margin:8px 0 0;font-size:.8125rem;">예: "유튜브 5만 구독자, 인스타 5만 팔로워 달성이 목표예요. 지금은 계정만 만들어 놓은 상태고, 카테고리는 여행이에요."</p>'
      ) +
      '<textarea id="ngDescInput" maxlength="500" placeholder="목표와 지금 상태를 자유롭게 적어주세요" style="width:100%;min-height:110px;margin-top:14px;">'+L.escapeHtml(prevDesc||'')+'</textarea>' +
      '<p class="faint" id="ngDescCounter" style="text-align:right;margin:4px 2px 0;font-size:.6875rem;"></p>' +
      '<div style="display:flex;gap:8px;margin-top:10px;">' +
        '<button class="btn btn-ghost" id="ngManualBtn" type="button" style="flex:1;">직접 설정할게요</button>' +
        '<button class="btn btn-primary" id="ngGenBtn" type="button" style="flex:1;">템플릿 만들기</button>' +
      '</div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="ngCancelBtn" type="button" style="width:100%;">취소</button></div>',
      function(sheet){
        var input = sheet.querySelector('#ngDescInput');
        var counter = sheet.querySelector('#ngDescCounter');
        function upd(){ counter.textContent = input.value.length+'/500자'; }
        upd();
        input.addEventListener('input', upd);
        sheet.querySelector('#ngCancelBtn').addEventListener('click', L.closeModal);
        sheet.querySelector('#ngManualBtn').addEventListener('click', function(){ showNewGoalManualForm(); });
        sheet.querySelector('#ngGenBtn').addEventListener('click', async function(){
          var desc = input.value.trim();
          if(!desc){ L.toast('목표를 먼저 적어주세요'); return; }
          if(window.OurgoalModeration){
            var modCheck = window.OurgoalModeration.check(desc);
            if(modCheck.flagged){
              L.openModal(
                '<div style="text-align:center;padding:12px 4px;">' +
                  '<div style="font-size:2rem;margin-bottom:8px;">⚠️</div>' +
                  '<h3 style="font-size:1.05rem;font-weight:700;margin:0 0 10px;color:var(--brand-strong);">' + L.escapeHtml(modCheck.message) + '</h3>' +
                  '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.55;margin:0 0 14px;word-break:keep-all;">' + L.escapeHtml(modCheck.detail) + '<br><br>' + L.escapeHtml(modCheck.support) + '<br><br><span style="color:var(--ink-muted, #71717a);font-size:.8125rem;display:inline-block;padding:6px 10px;background:rgba(0,0,0,0.03);border-radius:8px;">🌿 ' + L.escapeHtml(modCheck.notice || '무공해 플랫폼을 위한 강한 제어체계를 구축했습니다. 양해 부탁드립니다.') + '</span></p>' +
                  '<button class="btn btn-primary btn-block" type="button" onclick="closeModal()">확인</button>' +
                '</div>',
                function(){}
              );
              return;
            }
          }
          showNewGoalLoadingStep();
          var tmpl = await generateGoalTemplate(desc);
          if(!tmpl){ L.toast('템플릿을 만들지 못했어요 · 다시 시도하거나 직접 설정해주세요'); showNewGoalChatStep(desc); return; }
          if(tmpl.isBlocked){
            L.openModal(
              '<div style="text-align:center;padding:12px 4px;">' +
                '<div style="font-size:2rem;margin-bottom:8px;">⚠️</div>' +
                '<h3 style="font-size:1.05rem;font-weight:700;margin:0 0 10px;color:var(--brand-strong);">' + L.escapeHtml(tmpl.message) + '</h3>' +
                '<p style="font-size:.875rem;color:var(--ink-soft);line-height:1.55;margin:0 0 14px;word-break:keep-all;">' + L.escapeHtml(tmpl.detail) + '<br><br>' + L.escapeHtml(tmpl.support) + '<br><br><span style="color:var(--ink-muted, #71717a);font-size:.8125rem;display:inline-block;padding:6px 10px;background:rgba(0,0,0,0.03);border-radius:8px;">🌿 ' + L.escapeHtml(tmpl.notice || '무공해 플랫폼을 위한 강한 제어체계를 구축했습니다. 양해 부탁드립니다.') + '</span></p>' +
                '<button class="btn btn-primary btn-block" type="button" onclick="closeModal()">확인</button>' +
              '</div>',
              function(){}
            );
            return;
          }
          showNewGoalReviewStep(tmpl);
        });
      }
    );
  }
  /* ---- 이전 전 index.html 14280~14282줄(#TASK-ES-466 생성기 표지) ---- */
  function showNewGoalLoadingStep(){
    L.openModal('<h3>새 목표</h3>' + L.fbBotBubbleHtml('<p class="faint" style="margin:0;">목표 템플릿을 만들고 검증하는 중…</p>'), null);
  }
  /* ---- 이전 전 index.html 14283~14359줄(#TASK-ES-466 생성기 표지) ---- */
  function showNewGoalReviewStep(tmpl){
    var major = L.TOPICS[tmpl.topicMajor] ? tmpl.topicMajor : '';
    var majorInfo = L.TOPICS[major];
    L.openModal(
      '<h3>새 목표</h3>' +
      L.fbBotBubbleHtml('<p style="margin:0;font-size:.9375rem;line-height:1.65;">이렇게 목표를 만들어봤어요. 이대로 적용할까요? 적용한 뒤에도 자유롭게 수정할 수 있어요.</p>') +
      '<div class="field" style="margin-top:14px;"><label>목표 제목</label><input id="ngTitle" type="text" value="'+L.escapeHtml(tmpl.title)+'"></div>' +
      (majorInfo ? '<p class="faint" style="margin:4px 2px 0;">'+majorInfo.icon+' '+majorInfo.label+(tmpl.topicMinor?' · '+L.escapeHtml(tmpl.topicMinor):'')+'</p>' : '') +
      '<p class="faint" style="margin:14px 0 6px;">마일스톤 · 제목을 눌러 고치거나 ×로 지울 수 있어요</p>' +
      '<div class="ms-list" id="ngMsList">' +
        tmpl.milestones.map(function(m, i){
          return '<div class="ms-row" data-ngms="'+i+'">' +
            '<div class="ms-main">' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="display:flex;align-items:center;gap:6px;">' +
                  '<input class="ms-title" data-ngmstitle="'+i+'" value="'+L.escapeHtml(m.title)+'">' +
                  '<button class="icon-btn" data-ngmsdel="'+i+'" type="button" aria-label="마일스톤 삭제">×</button>' +
                '</div>' +
                (m.tasks && m.tasks.length ? '<div style="margin-top:6px;display:flex;flex-direction:column;gap:4px;">' +
                  m.tasks.map(function(tk){
                    var taskText = typeof tk === 'string' ? tk : (tk && tk.title ? tk.title : '');
                    return '<div class="faint" style="font-size:.8125rem;">· '+L.escapeHtml(taskText)+'</div>';
                  }).join('') +
                '</div>' : '') +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="ngBackBtn" type="button">뒤로</button><button class="btn btn-primary" id="ngApplyBtn" type="button">이대로 적용</button></div>',
      function(sheet){
        sheet.querySelector('#ngBackBtn').addEventListener('click', function(){ showNewGoalChatStep(''); });
        sheet.querySelectorAll('[data-ngmsdel]').forEach(function(btn){
          btn.addEventListener('click', function(){
            var i = +btn.dataset.ngmsdel;
            tmpl.milestones.splice(i,1);
            showNewGoalReviewStep(tmpl);
          });
        });
        sheet.querySelector('#ngApplyBtn').addEventListener('click', async function(){
          var title = sheet.querySelector('#ngTitle').value.trim();
          if(!title){ L.toast('목표 제목을 입력해주세요'); return; }
          sheet.querySelectorAll('[data-ngmstitle]').forEach(function(inp){
            var i = +inp.dataset.ngmstitle;
            if(tmpl.milestones[i]) tmpl.milestones[i].title = inp.value.trim() || tmpl.milestones[i].title;
          });
          var milestones = tmpl.milestones.filter(function(m){ return m.title; }).map(function(m){
            return {
              id: L.uid('ms'),
              title: m.title,
              status: 'todo',
              dueDate: null,
              tasks: (m.tasks||[]).map(function(tk){
                var taskText = typeof tk === 'string' ? tk : (tk && tk.title ? tk.title : '');
                return { id: L.uid('task'), title: taskText, done: false };
              })
            };
          });
          var newGoal = { id: L.newId(), title: title, dueDate: null, category: 'etc', topic: major ? (major+'/'+(tmpl.topicMinor||'')) : '', createdAt: L.nowISO(), visibility:'private', archivedAt:null, result:null, milestones: milestones };
          L.state.profile.goals.push(newGoal);
          L.state.activeGoalId = newGoal.id;
          L.trackGoalCreated(newGoal, 'template_bot');
          await L.saveProfile();
          L.closeModal();
          if(typeof L.dispatchFullViewPropagation === 'function'){
            L.dispatchFullViewPropagation('goal_create', { goalId: newGoal.id });
          } else {
            L.renderAll();
          }
          if(window.OurgoalSanctuaryV3 && window.OurgoalSanctuaryV3.render) {
            window.OurgoalSanctuaryV3.render('goals');
          }
          L.toast('목표를 만들었어요 · 목표 화면 편집 모드에서 더 다듬을 수 있어요');
        });
      }
    );
  }
  /* ---- 이전 전 index.html 14360~14452줄(#TASK-ES-466 생성기 표지) ---- */
  function showNewGoalManualForm(){
    var chosenCat = 'etc';
    var customLabel = '';
    L.openModal(
      '<h3>새 목표</h3>' +
      '<p class="comm-hint" id="ngBackToAi" style="cursor:pointer;color:var(--ink);font-weight:700;margin:-8px 0 14px;">AI 도우미로 만들래요 ›</p>' +
      '<div class="field"><label>어떤 종류인가요? (선택하면 마일스톤을 채워드려요)</label></div>' +
      '<div class="cat-grid" id="mCatGrid">' +
        Object.keys(L.GOAL_TEMPLATES).map(function(k){
          var t = L.GOAL_TEMPLATES[k];
          return '<div class="cat-chip'+(k==='etc'?' active':'')+'" data-cat="'+k+'"><span class="ico">'+t.icon+'</span><span class="lbl">'+t.label+'</span></div>';
        }).join('') +
        '<div class="cat-chip" data-cat="custom" id="mCatCustomChip"><span class="ico"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span><span class="lbl">직접 입력</span></div>' +
      '</div>' +
      '<div class="field"><label>최종 목표</label><input id="mGoalTitle" type="text" placeholder="예: 3개월 안에 벤치프레스 100kg"></div>' +
      '<div class="field"><label>카테고리 (대범위 · 중범위)</label></div>' +
      L.categoryPickerHtml('mTopic', '') +
      '<div style="height:14px;"></div>' +
      '<div class="field"><label>목표 마감일 (선택)</label><input id="mGoalDue" type="date"><p class="faint" id="mGoalDday" style="margin:6px 0 0;"></p></div>' +
      '<div class="field"><label>공개 범위</label><select id="mGoalVis">' +
        '<option value="theme" selected>🏷️ 같은 테마 공개 (기본)</option>' +
        '<option value="public">🌐 전체 공개</option>' +
        '<option value="team">👥 팀원 공개</option>' +
        '<option value="private">🔒 나만 보기</option>' +
      '</select><p class="faint" style="margin:4px 0 0;">기본은 같은 목표 테마를 가진 동류 러너에게만 보여요</p></div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="mCancel" type="button">취소</button><button class="btn btn-primary" id="mSave" type="button">만들기</button></div>',
      function(sheet){
        sheet.querySelector('#ngBackToAi').addEventListener('click', function(){ showNewGoalChatStep(''); });
        var topicRef = { value: '' };
        L.wireCategoryPicker(sheet, 'mTopic', topicRef);
        sheet.querySelectorAll('.cat-chip').forEach(function(chip){
          chip.addEventListener('click', function(){
            if(chip.dataset.cat==='custom'){
              var input = window.prompt('원하는 목표 종류를 적어주세요 (예: 자기계발)');
              if(input===null) return;
              var name = input.trim().slice(0,20);
              if(!name){ L.toast('이름을 확인해주세요'); return; }
              customLabel = name;
              chip.querySelector('.lbl').textContent = name;
            }
            sheet.querySelectorAll('.cat-chip').forEach(function(c){ c.classList.remove('active'); });
            chip.classList.add('active');
            chosenCat = chip.dataset.cat;
          });
        });
        var mDue = sheet.querySelector('#mGoalDue');
        var mDdayEl = sheet.querySelector('#mGoalDday');
        mDue.addEventListener('change', function(){
          mDdayEl.innerHTML = mDue.value
            ? '오늘 기준 <b style="color:var(--brand-strong);">'+L.dDay(mDue.value)+'</b> · 목표일과 함께 계속 표시돼요'
            : '';
        });
        var titleInput = sheet.querySelector('#mGoalTitle');
        if(titleInput){
          titleInput.addEventListener('keydown', function(e){
            if(e.key === 'Enter'){
              e.preventDefault();
              sheet.querySelector('#mSave').click();
            }
          });
        }
        sheet.querySelector('#mCancel').addEventListener('click', L.closeModal);
        sheet.querySelector('#mSave').addEventListener('click', async function(){
          var title = sheet.querySelector('#mGoalTitle').value.trim();
          if(!title){
            L.toast('목표 제목을 입력해주세요');
            if(titleInput) titleInput.focus();
            return;
          }
          var due = sheet.querySelector('#mGoalDue').value;
          var newGoal = { id: L.newId(), title: title, dueDate: due||null, category: chosenCat, topic: topicRef.value, createdAt: L.nowISO(), visibility: (sheet.querySelector('#mGoalVis') && sheet.querySelector('#mGoalVis').value) || 'theme', archivedAt: null, result: null, milestones: L.templateMilestones(chosenCat) };
          L.state.profile.goals.push(newGoal);
          L.state.activeGoalId = newGoal.id;
          L.trackGoalCreated(newGoal, 'manual');
          await L.saveProfile();
          L.closeModal();
          if(typeof L.dispatchFullViewPropagation === 'function'){
            L.dispatchFullViewPropagation('goal_create', { goalId: newGoal.id });
          } else {
            L.renderAll();
          }
          if(window.OurgoalSanctuaryV3 && window.OurgoalSanctuaryV3.render) {
            window.OurgoalSanctuaryV3.render('goals');
          }
          if(newGoal.visibility === 'theme'){
            L.showUndoPrivacyToast(newGoal.id);
          } else {
            L.toast('목표를 만들었어요');
          }
        });
      }
    );
  }
  /* ---- 이전 전 index.html 14453~14456줄(#TASK-ES-466 생성기 표지) ---- */
  function bindNewGoalStepExports() { /* [#TASK-ES-466] 로드 중 문 — index.html 원래 자리에서 이 함수를 부른다(호출 순서 보존) */
  if(typeof window !== 'undefined'){
    window.showNewGoalManualForm = showNewGoalManualForm;
    window.showNewGoalChatStep = showNewGoalChatStep;
  }
  } /* bindNewGoalStepExports */

  K.promptNewGoal = promptNewGoal;
  K.localGoalTemplate = localGoalTemplate;
  K.generateGoalTemplate = generateGoalTemplate;
  K.showNewGoalChatStep = showNewGoalChatStep;
  K.showNewGoalLoadingStep = showNewGoalLoadingStep;
  K.showNewGoalReviewStep = showNewGoalReviewStep;
  K.showNewGoalManualForm = showNewGoalManualForm;
  K.bindNewGoalStepExports = bindNewGoalStepExports;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
