/**
 * OurGoal Team Goal Modals (목표 탭 — 팀 연계 개인목표 만들기·팀원 초대 창)
 *
 * #TASK-ES-437 (인라인 스크립트 세포화 P0 구역): index.html 인라인 IIFE 에서 아래 묶음의 선언을 동작 그대로 옮겼다.
 *   openTeamLinkedPersonalGoalModal — 「[82] 팀 목표 내 '팀 연계 개인목표' 생성 모달」(이전 전 4851~4910줄)
 *   openTeamInviteModal — 「[83] 팀원 초대 시 '아워골 동반자 초대하기'」(이전 전 4914~5025줄)
 * 팀 목표 안에서 팀 연계 개인목표를 만드는 창, 팀원(동반자) 인앱 초대·참가 창.
 * 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * window 노출 줄·로드 중 바로 도는 문은 index.html 원래 자리에 그대로 있다. index.html 은 IIFE 머리에서 이 키트의 함수를 같은 이름으로 가져와 부른다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 생성기: docs/design/harness/module-split/gen-inline-p0.js. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  function openTeamLinkedPersonalGoalModal(teamId, teamName){
    L.openModal(
      '<h3>🎯 팀 연계 개인목표 만들기</h3>' +
      '<p class="faint" style="margin:-8px 0 14px;font-size:.8125rem;">[' + L.escapeHtml(teamName) + '] 팀 활동과 연계된 나만의 개인 실천 목표를 생성합니다.</p>' +
      '<div class="field"><label>개인 목표 제목 (필수)</label><input id="tlpTitleInput" type="text" placeholder="예: [' + L.escapeHtml(teamName) + '] 나의 실천 미션"></div>' +
      '<div class="field"><label>마감 D-day (선택)</label><input id="tlpDueInput" type="date"></div>' +
      '<div class="field"><label>목표 카테고리</label>' +
        '<select id="tlpCatSelect" style="width:100%;padding:8px 12px;border-radius:10px;border:1px solid var(--rule);background:var(--card2);color:var(--ink);">' +
          '<option value="health">🏃 건강·운동</option>' +
          '<option value="study">📚 공부·자격증</option>' +
          '<option value="career">💼 커리어·업무</option>' +
          '<option value="mind">🧘 멘탈·마인드</option>' +
          '<option value="hobby">🎨 취미·일상</option>' +
        '</select>' +
      '</div>' +
      '<div style="margin:10px 0;padding:10px 12px;background:rgba(217,119,6,0.08);border:1px solid rgba(217,119,6,0.25);border-radius:10px;font-size:.78125rem;color:var(--ink-soft);">' +
        '💡 <b>연계 혜택:</b> 생성된 목표는 내 목표 탭에 등록됨과 동시에, 팀 대시보드에서 나의 팀 기여 실천 카드로 함께 연동됩니다.' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="tlpCancel" type="button">취소</button>' +
        '<button class="btn btn-primary" id="tlpConfirm" type="button">팀 연계 목표 생성</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#tlpCancel').addEventListener('click', L.closeModal);
        sheet.querySelector('#tlpConfirm').addEventListener('click', async function(){
          var tlpInp = sheet.querySelector('#tlpTitleInput');
          var title = (tlpInp ? tlpInp.value.trim() : '') || (tlpInp && tlpInp.placeholder ? tlpInp.placeholder.replace(/^예:\s*/, '') : ('[' + teamName + '] 나의 실천 미션'));
          if(!title){ L.toast('목표 제목을 입력해주세요.'); return; }
          var due = sheet.querySelector('#tlpDueInput').value;
          var cat = sheet.querySelector('#tlpCatSelect').value;

          var newGoal = {
            id: L.uid('goal'),
            title: title,
            dueDate: due || null,
            category: cat,
            visibility: 'group',
            topic: cat,
            teamLinkId: teamId,
            teamLinkName: teamName,
            milestones: [
              { id: L.uid('ms'), title: '1단계: 팀 활동 준비 및 루틴 세팅', status: 'doing', tasks: [] },
              { id: L.uid('ms'), title: '2단계: 팀원들과 함께 매일 인증 실천', status: 'todo', tasks: [] }
            ],
            result: null,
            createdAt: L.nowISO()
          };

          if(!L.state.profile.goals) L.state.profile.goals = [];
          L.state.profile.goals.unshift(newGoal);
          L.awardXP(15, '팀 연계 개인목표 생성 (+15 EXP)');
          await L.saveProfile();
          L.closeModal();
          L.renderAll();
          L.burstConfetti(window.innerWidth / 2, window.innerHeight / 3);
          L.toast('🎯 [' + teamName + '] 연계 개인목표가 생성되었습니다! ✨ (+15 EXP)');
        });
      }
    );
  }

  function openTeamInviteModal(teamId, teamName){
    if(window.OurgoalTeamInviteComm && window.OurgoalTeamInviteComm.openTeamInviteModal){
      return window.OurgoalTeamInviteComm.openTeamInviteModal(teamId, (typeof L.MOCK_GROUPS !== 'undefined' ? L.MOCK_GROUPS : []));
    }
    var companions = [];
    try {
      var mates = (window.OurgoalCompanion && window.OurgoalCompanion.getRunningMates) ? window.OurgoalCompanion.getRunningMates() : [];
      companions = Array.isArray(mates) ? mates : [];
    } catch(e){}

    if(!companions.length){
      companions = [
        { id: 'mate_runner_1', nickname: '러너상민', avatar: '🏃', bio: '풀코스 마라톤 도전 중' },
        { id: 'mate_study_2', nickname: '새벽독서가', avatar: '📚', bio: '미라클 모닝 100일차' },
        { id: 'mate_dev_3', nickname: '클린코더', avatar: '💻', bio: '매일 1커밋 실천' }
      ];
    }

    L.openModal(
      '<h3>👥 팀원 초대하기</h3>' +
      '<p class="faint" style="margin:-8px 0 14px;font-size:.8125rem;">[' + L.escapeHtml(teamName || '팀') + ']에 함께할 팀원을 초대합니다.</p>' +
      '<div style="display:flex;gap:4px;border-bottom:1px solid var(--rule);margin-bottom:12px;">' +
        '<button type="button" class="tab-chip active" id="btnSwitchCompanionInvite" style="padding:6px 12px;font-size:.8125rem;border-bottom:2px solid var(--brand);font-weight:700;color:var(--brand);">아워골 동반자 초대</button>' +
        '<button type="button" class="tab-chip" id="btnSwitchShareLink" style="padding:6px 12px;font-size:.8125rem;color:var(--ink-soft);border-bottom:2px solid transparent;">공유 링크 복사</button>' +
      '</div>' +
      '<div id="tabBodyCompanionInvite">' +
        '<div style="font-size:.8125rem;font-weight:700;margin-bottom:6px;color:var(--ink);">맺어진 아워골 동반자 목록</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;margin-bottom:12px;">' +
          companions.map(function(m){
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--card2);border:1px solid var(--rule);border-radius:10px;">' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                '<span style="font-size:1.3rem;">' + (m.avatar || '👤') + '</span>' +
                '<div>' +
                  '<div style="font-weight:700;font-size:.875rem;color:var(--ink);">' + L.escapeHtml(m.nickname || m.name || '동반자') + '</div>' +
                  '<div class="faint" style="font-size:.72rem;">' + L.escapeHtml(m.bio || '함께 달리는 러닝메이트') + '</div>' +
                '</div>' +
              '</div>' +
              '<button type="button" class="btn btn-primary btn-xs btn-send-companion-invite" data-mid="'+m.id+'" data-mname="'+L.escapeHtml(m.nickname || m.name || '동반자')+'" style="font-size:.75rem;padding:3px 9px;">인앱 초대장 발송</button>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div id="tabBodyShareLink" style="display:none;margin-bottom:12px;">' +
        '<div style="padding:12px;background:var(--card2);border:1px solid var(--rule);border-radius:12px;text-align:center;">' +
          '<div style="font-size:.875rem;font-weight:700;color:var(--ink);margin-bottom:6px;">웹 초대 링크로 바로 참여</div>' +
          '<p class="faint" style="font-size:.78rem;margin-bottom:12px;">카카오톡이나 SNS에 공유하여 누구나 팀에 합류할 수 있습니다.</p>' +
          '<button type="button" class="btn btn-primary btn-sm" id="btnCopyTeamInviteLink" style="width:100%;">📋 팀 초대 링크 복사하기</button>' +
        '</div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost btn-block" id="closeInviteModal" type="button">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#closeInviteModal').addEventListener('click', L.closeModal);
        var btnCompanionTab = sheet.querySelector('#btnSwitchCompanionInvite');
        var btnShareTab = sheet.querySelector('#btnSwitchShareLink');
        var bodyCompanion = sheet.querySelector('#tabBodyCompanionInvite');
        var bodyShare = sheet.querySelector('#tabBodyShareLink');

        function switchInviteTab(mode){
          if(mode === 'companion'){
            btnCompanionTab.classList.add('active');
            btnCompanionTab.style.borderBottom = '2px solid var(--brand)';
            btnCompanionTab.style.fontWeight = '700';
            btnCompanionTab.style.color = 'var(--brand)';
            btnShareTab.classList.remove('active');
            btnShareTab.style.borderBottom = '2px solid transparent';
            btnShareTab.style.fontWeight = '400';
            btnShareTab.style.color = 'var(--ink-soft)';
            if(bodyCompanion) bodyCompanion.style.display = 'block';
            if(bodyShare) bodyShare.style.display = 'none';
          } else {
            btnShareTab.classList.add('active');
            btnShareTab.style.borderBottom = '2px solid var(--brand)';
            btnShareTab.style.fontWeight = '700';
            btnShareTab.style.color = 'var(--brand)';
            btnCompanionTab.classList.remove('active');
            btnCompanionTab.style.borderBottom = '2px solid transparent';
            btnCompanionTab.style.fontWeight = '400';
            btnCompanionTab.style.color = 'var(--ink-soft)';
            if(bodyCompanion) bodyCompanion.style.display = 'none';
            if(bodyShare) bodyShare.style.display = 'block';
          }
        }

        if(btnCompanionTab) btnCompanionTab.addEventListener('click', function(){ switchInviteTab('companion'); });
        if(btnShareTab) btnShareTab.addEventListener('click', function(){ switchInviteTab('share'); });

        function copyLink(){
          var url = window.location.origin + '?invite_group=' + teamId;
          navigator.clipboard.writeText(url).then(function(){
            L.toast('초대 링크가 복사되었습니다: ' + url);
          }).catch(function(){
            L.toast('초대 링크: ' + url);
          });
        }

        var copyBtn = sheet.querySelector('#btnCopyTeamInviteLink');
        if(copyBtn) copyBtn.addEventListener('click', copyLink);

        sheet.querySelectorAll('.btn-send-companion-invite').forEach(function(btn){
          btn.addEventListener('click', function(){
            var mname = btn.dataset.mname;
            btn.disabled = true;
            btn.textContent = '초대 완료 ✓';
            btn.style.opacity = '0.6';
            L.toast(mname + '님께 인앱 초대장을 성공적으로 전송했습니다! 📨');
          });
        });
      }
    );
  }

  K.openTeamLinkedPersonalGoalModal = openTeamLinkedPersonalGoalModal;
  K.openTeamInviteModal = openTeamInviteModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
