/**
 * OurGoal Team Goal Prompt (목표 탭 — 새 팀 목표 만들기 창)
 *
 * #TASK-ES-448 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G129.
 *   옮긴 선언(이전 전 줄): promptNewTeamGoal(24106~24194)
 * promptNewTeamGoal = 팀 목표를 새로 만드는 창. 같은 묶음의 팀 목표 댓글 전송(window.sendTeamGoalComment)·전역 클릭/엔터 위임은 로드 중 문이라 index.html 에 남았다.
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
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  function promptNewTeamGoal(gid){
    var g = L.MOCK_GROUPS.find(function(x){ return x.id===gid; });
    L.openModal(
      '<h3>팀 목표 추가</h3>' +
      '<div style="margin-bottom:12px;">' +
        '<div style="font-size:.8125rem;font-weight:700;color:var(--ink);margin-bottom:6px;">⚡ 추천 팀 목표 템플릿</div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="tplGoalWorkshop" style="font-size:.8125rem;padding:4px 8px;border-color:var(--red-line);color:var(--brand-strong);">🏢 회사 워크숍 준비</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="tplGoalTravel" style="font-size:.8125rem;padding:4px 8px;border-color:var(--teal);color:var(--teal);">✈️ 단체여행 올패스</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="btnOpenEncyclopediaFromTeam" style="font-size:.8125rem;padding:4px 9px;border:1px solid var(--brand);color:var(--brand-strong);font-weight:700;">📖 템플릿백과사전</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="tplGoalMarathon" style="font-size:.8125rem;padding:4px 8px;">🏃 마라톤 완주</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="tplGoalFitness" style="font-size:.8125rem;padding:4px 8px;">💪 누적 300회 운동</button>' +
        '</div>' +
      '</div>' +
      '<div class="field"><label>목표 이름</label><input id="tgTitleInput" type="text" placeholder="예: 2026 전사 전략 워크숍 준비 및 실행"></div>' +
      '<div class="field"><label>마감일 (선택)</label><input id="tgDueInput" type="date"></div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" id="tgCancel" type="button">취소</button><button class="btn btn-primary" id="tgSave" type="button">추가</button></div>',
      function(sheet){
        var defaultMilestones = [];
        var applyGoalTpl = function(title, days, msList){
          var inp = sheet.querySelector('#tgTitleInput');
          // [#TASK-ES-191] 입력창 지움 피로도 근절: value 강제 주입 제거 및 placeholder 힌트화
          inp.value = '';
          inp.placeholder = '예: ' + title;
          inp.dataset.tplTitle = title;
          sheet.querySelector('#tgDueInput').value = L.daysFromNow(days);
          defaultMilestones = msList || [];
          inp.focus();
        };
                var btnEnc = sheet.querySelector('#btnOpenEncyclopediaFromTeam');
        if(btnEnc) btnEnc.onclick = function(){
          L.closeModal();
          if(typeof L.openTemplateEncyclopediaModal === 'function'){
            L.openTemplateEncyclopediaModal();
          }
        };
        var btnWS = sheet.querySelector('#tplGoalWorkshop');
        if(btnWS) btnWS.onclick = function(){
          applyGoalTpl('2026 하반기 전사 전략 워크숍 준비 및 실행', 21, [
            { id: L.uid('tgm'), title: '1단계: 장소/숙소 대관 및 워크숍 예산안 최종 승인', status: 'done' },
            { id: L.uid('tgm'), title: '2단계: 부서별 세션 아젠다 및 팀빌딩 프로그램 확정', status: 'doing' },
            { id: L.uid('tgm'), title: '3단계: 워크숍 본행사 진행 및 팀별 액션플랜 도출·회고', status: 'todo' }
          ]);
        };
        var btnTR = sheet.querySelector('#tplGoalTravel');
        if(btnTR) btnTR.onclick = function(){
          applyGoalTpl('낙오자 없는 제주 3박 4일 단체 여행 완성', 14, [
            { id: L.uid('tgm'), title: '1단계: 항공권 발권 및 독채 숙소 예약 확정', status: 'done' },
            { id: L.uid('tgm'), title: '2단계: 렌터카 배차, 일자별 드라이브 코스 및 맛집 리스트업', status: 'doing' },
            { id: L.uid('tgm'), title: '3단계: 안전 여행 완주, 공용 경비 정산 및 베스트 샷 앨범 공유', status: 'todo' }
          ]);
        };
        var btnMR = sheet.querySelector('#tplGoalMarathon');
        if(btnMR) btnMR.onclick = function(){
          applyGoalTpl('크루 전원 하프 마라톤 완주 챌린지', 30, [
            { id: L.uid('tgm'), title: '1단계: 10km 완주 테스트 통과', status: 'done' },
            { id: L.uid('tgm'), title: '2단계: 주간 20km 마일리지 및 페이스 훈련', status: 'doing' },
            { id: L.uid('tgm'), title: '3단계: 하프 마라톤 대회 전원 완주', status: 'todo' }
          ]);
        };
        var btnFT = sheet.querySelector('#tplGoalFitness');
        if(btnFT) btnFT.onclick = function(){
          applyGoalTpl('이번 달 팀 누적 300회 운동 인증 달성', 30, [
            { id: L.uid('tgm'), title: '1단계: 상반월 150회 돌파', status: 'doing' },
            { id: L.uid('tgm'), title: '2단계: 하반월 300회 완수 및 팀 정모', status: 'todo' }
          ]);
        };

        sheet.querySelector('#tgCancel').addEventListener('click', L.closeModal);
        sheet.querySelector('#tgSave').addEventListener('click', async function(){
          var inp = sheet.querySelector('#tgTitleInput');
          var title = (inp ? inp.value.trim() : '') || (inp && inp.dataset.tplTitle) || (inp && inp.placeholder ? inp.placeholder.replace(/^예:\s*/, '') : '');
          if(!title) return;
          if(!g.teamGoals) g.teamGoals = [];
          g.teamGoals.push({
            id: L.uid('tg'),
            title: title,
            dueDate: sheet.querySelector('#tgDueInput').value || null,
            milestones: defaultMilestones.length ? defaultMilestones : []
          });
          await L.saveProfile();
          L.closeModal();
          L.renderTeamGoalsScreen();
          L.toast('팀 목표를 추가했어요');
        });
      }
    );
  }

  K.promptNewTeamGoal = promptNewTeamGoal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
