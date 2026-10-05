/**
 * OurGoal Team Level Goals (목표 탭 — 예시 팀 판별·팀 수준별 목표·일괄 접기)
 *
 * 같은 묶음의 팀 화면 도우미 몫: 예시(가상) 팀 판별(isMockGroup) · 팀 수준별 목표 읽기·기본값(getGroupLevelGoals) · 수준별 조 상세 창 예비 경로(openLevelGroupDetailModal — OurgoalTeamVisibilityLevels 가 있으면 그쪽이 불린다) · 팀목표 화면 일괄 접기(collapseAllTeamGoalAccordions).
 * window 노출 줄(isMockGroup·collapseAllTeamGoalAccordions)은 index.html 원래 자리에 그대로 있다. collapseAllTeamGoalAccordions 를 잘라 읽는 시험지는 #TASK-ES-519 시험지 선행으로 합본에서 같은 함수를 찾는다.
 * #TASK-ES-552(인라인 3단계 Z2 팀·소통 — 개인 목표 가이드·팀 수준별 목표·팀 목표 편집): index.html 인라인 IIFE 의 구간(이전 전 6939~6947 · 6953~7129 · 7130~7424 · 7425~7465줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
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

  /* ---- 이전 전 index.html 6939~6947줄(#TASK-ES-552 생성기 표지) ---- */

  /* [#TASK-ES-229] 가상 목 그룹(MOCK_GROUPS) 판별 및 팀 생성 대형 히어로 카드 */
  function isMockGroup(g){
    if(!g) return false;
    if(g.isMock !== undefined) return !!g.isMock;
    var customGroups = (L.state && L.state.profile && L.state.profile.settings && L.state.profile.settings.customGroups) || [];
    if(customGroups.some(function(cg){ return cg.id === g.id; })) return false;
    return /^(g-workshop|g-travel|g-marathon-pair|g-marathon-small|g\d+)$/.test(g.id);
  }

  /* ---- 이전 전 index.html 6953~7129줄(#TASK-ES-552 생성기 표지) ---- */
  /* [#TASK-ES-493] wireTeamGoalsGuideEvents → js/tabs/goals/team-goals-guide.js 로 옮김(인라인 어려움 묶음 시범 — 앞 주석 포함) */

  function getGroupLevelGoals(gid){
    if(!L.state.profile.settings) L.state.profile.settings = {};
    if(!L.state.profile.settings.groupLevelGoals) L.state.profile.settings.groupLevelGoals = {};
    if(!L.state.profile.settings.groupLevelGoals[gid] || !L.state.profile.settings.groupLevelGoals[gid].length){
      var g = L.MOCK_GROUPS.find(function(x){ return x.id===gid; });
      var name = g ? g.name : '';
      var topic = g ? (g.topic || '') : '';
      var isWorkshop = topic.includes('기획') || topic.includes('업무') || topic.includes('회사') || name.includes('워크숍') || name.includes('TF');
      var isTravel = topic.includes('여행') || topic.includes('캠핑') || name.includes('여행') || name.includes('투어');
      var isCrossfit = topic.includes('크로스핏') || name.includes('크로스핏');
      var isBadminton = name.includes('배드민턴') || topic.includes('배드민턴');

      if(isWorkshop){
        L.state.profile.settings.groupLevelGoals[gid] = [
          { id: 'lg_a_' + gid, name: 'A조 (기획·운영 TF)', goals: [
            { id: 'lgg_a1_' + gid, title: '타임테이블 관리 및 예산/의전 총괄', dueDate: L.daysFromNow(21), milestones: [
              { id: 'lgm_a1_' + gid, title: '워크숍 장소 대관 및 타임테이블 확정', status: 'done', priority: 'high', tasks: [
                { id: 'lgt_a1a_' + gid, title: '행사장 대관 계약 및 음향/빔 점검', done: true },
                { id: 'lgt_a1b_' + gid, title: '시간대별 세션 및 휴식 타임테이블 배포', done: true }
              ] },
              { id: 'lgm_a2_' + gid, title: '총 예산안 산정 및 지출 결재 승인', status: 'doing', priority: 'high', tasks: [
                { id: 'lgt_a2a_' + gid, title: '항목별(대관/식대/교통/상품) 예산 취합', done: true },
                { id: 'lgt_a2b_' + gid, title: '법인카드 한도 체크 및 사전 정산 처리', done: false }
              ] }
            ] }
          ] },
          { id: 'lg_b_' + gid, name: 'B조 (프로그램·레크 TF)', goals: [
            { id: 'lgg_b1_' + gid, title: '팀빌딩 프로그램 및 아이스브레이킹 진행', dueDate: L.daysFromNow(21), milestones: [
              { id: 'lgm_b1_' + gid, title: '아이스브레이킹 및 팀빌딩 3종 선정', status: 'doing', priority: 'med', tasks: [
                { id: 'lgt_b1a_' + gid, title: '게임 룰 설명 슬라이드 및 진행 대본', done: true },
                { id: 'lgt_b1b_' + gid, title: '팀 대항전 점수판 및 참가 상품 구매', done: false }
              ] },
              { id: 'lgm_b2_' + gid, title: '부서별 회고 & 비전 공유 세션 진행', status: 'todo', priority: 'high', tasks: [
                { id: 'lgt_b2a_' + gid, title: '발표 양식 템플릿(1page) 사전 배포', done: false }
              ] }
            ] }
          ] },
          { id: 'lg_c_' + gid, name: 'C조 (물류·지원 TF)', goals: [
            { id: 'lgg_c1_' + gid, title: '이동 차량, 숙소 배정 및 물품 세팅', dueDate: L.daysFromNow(21), milestones: [
              { id: 'lgm_c1_' + gid, title: '참석자 이동 교통편 및 방 배정표 확정', status: 'done', priority: 'med', tasks: [
                { id: 'lgt_c1a_' + gid, title: '카풀 차량 배차 및 셔틀 공지', done: true },
                { id: 'lgt_c1b_' + gid, title: '숙소 룸메이트 배정 및 키 불출 계획', done: true }
              ] },
              { id: 'lgm_c2_' + gid, title: '현장 다과·음료 및 상비약 구비', status: 'doing', priority: 'low', tasks: [
                { id: 'lgt_c2a_' + gid, title: '에너지바, 커피/음료 간식 구매', done: true },
                { id: 'lgt_c2b_' + gid, title: '응급 상비약 키트 및 명찰 준비', done: false }
              ] }
            ] }
          ] }
        ];
      } else if(isTravel){
        L.state.profile.settings.groupLevelGoals[gid] = [
          { id: 'lg_a_' + gid, name: 'A조 (동선·차량 조)', goals: [
            { id: 'lgg_a1_' + gid, title: '여행 동선 설계 및 렌터카 안전 운행', dueDate: L.daysFromNow(14), milestones: [
              { id: 'lgm_a1_' + gid, title: '일자별 최적 드라이브 코스 확정', status: 'done', priority: 'high', tasks: [
                { id: 'lgt_a1a_' + gid, title: '공항-숙소-관광지 네비 경로 등록', done: true },
                { id: 'lgt_a1b_' + gid, title: '우천/비상 시 대체 실내 코스 마련', done: true }
              ] },
              { id: 'lgm_a2_' + gid, title: '렌터카 인수 및 운전자 보험 등록', status: 'doing', priority: 'high', tasks: [
                { id: 'lgt_a2a_' + gid, title: '승합차/SUV 렌트 및 완전자차 가입', done: true },
                { id: 'lgt_a2b_' + gid, title: '제2운전자 사전 등록 완료', done: false }
              ] }
            ] }
          ] },
          { id: 'lg_b_' + gid, name: 'B조 (맛집·카페 조)', goals: [
            { id: 'lgg_b1_' + gid, title: '로컬 미식 투어 및 단체석 예약', dueDate: L.daysFromNow(14), milestones: [
              { id: 'lgm_b1_' + gid, title: '흑돼지/해산물 대표 맛집 리스트업', status: 'doing', priority: 'med', tasks: [
                { id: 'lgt_b1a_' + gid, title: '알레르기 및 선호도 사전 조사', done: true },
                { id: 'lgt_b1b_' + gid, title: '캐치테이블 원격 줄서기 세팅', done: false }
              ] }
            ] }
          ] },
          { id: 'lg_c_' + gid, name: 'C조 (총무·촬영 조)', goals: [
            { id: 'lgg_c1_' + gid, title: '공용 경비 정산 및 단체 인생샷 촬영', dueDate: L.daysFromNow(14), milestones: [
              { id: 'lgm_c1_' + gid, title: '모임 통장 개설 및 영수증 실시간 기록', status: 'doing', priority: 'med', tasks: [
                { id: 'lgt_c1a_' + gid, title: '모임 통장 링크 공유 및 회비 수납', done: true },
                { id: 'lgt_c1b_' + gid, title: '일차별 지출 영수증 촬영 기록', done: false }
              ] },
              { id: 'lgm_c2_' + gid, title: '포토스팟 선정 및 공유 앨범 생성', status: 'todo', priority: 'low', tasks: [
                { id: 'lgt_c2a_' + gid, title: '클라우드 공유 앨범 생성 및 링크 공유', done: false }
              ] }
            ] }
          ] }
        ];
      } else if(isBadminton){
        L.state.profile.settings.groupLevelGoals[gid] = [
          { id: 'lg_a_' + gid, name: 'A조 (상급/대회반)', goals: [
            { id: 'lgg_a1_' + gid, title: '전국 동호인 대회 입상 및 스매시 성공률 극대화', dueDate: L.daysFromNow(30), milestones: [
              { id: 'lgm_a1_' + gid, title: '점프 스매시 각도 및 스피드 훈련 100회', status: 'doing', priority: 'high', tasks: [
                { id: 'lgt_a1a_' + gid, title: '포핸드 점프 스매시 인터벌 5세트', done: true },
                { id: 'lgt_a1b_' + gid, title: '후위 풋워크 전환 20분', done: false }
              ] },
              { id: 'lgm_a2_' + gid, title: '실전 복식 랠리 50회 연속 성공', status: 'todo', priority: 'med', tasks: [
                { id: 'lgt_a2a_' + gid, title: '드라이브 맞대결 30분 집중 훈련', done: false }
              ] }
            ] }
          ] },
          { id: 'lg_b_' + gid, name: 'B조 (중급/실전반)', goals: [
            { id: 'lgg_b1_' + gid, title: '안정적인 랠리 장악 및 수비 리턴 강화', dueDate: L.daysFromNow(30), milestones: [
              { id: 'lgm_b1_' + gid, title: '하이클리어 엔드라인 안착률 80% 달성', status: 'doing', priority: 'med', tasks: [
                { id: 'lgt_b1a_' + gid, title: '백핸드 클리어 타구점 교정 50회', done: true },
                { id: 'lgt_b1b_' + gid, title: '헤어핀 드롭샷 정밀 연습', done: false }
              ] }
            ] }
          ] },
          { id: 'lg_c_' + gid, name: 'C조 (초급/기초반)', goals: [
            { id: 'lgg_c1_' + gid, title: '기초 스텝 완성 및 부상 없는 게임 적응', dueDate: L.daysFromNow(30), milestones: [
              { id: 'lgm_c1_' + gid, title: '기본 6방향 풋워크 체화 & 주 2회 인증', status: 'todo', priority: 'low', tasks: [
                { id: 'lgt_c1a_' + gid, title: '스트로크 스윙 궤적 매일 100회 빈스윙', done: false },
                { id: 'lgt_c1b_' + gid, title: '팀 정기 운동 출석하기', done: false }
              ] }
            ] }
          ] }
        ];
      } else if(isCrossfit){
        L.state.profile.settings.groupLevelGoals[gid] = [
          { id: 'lg_a_' + gid, name: 'A조 (Rx\'d / 상급)', goals: [
            { id: 'lgg_a1_' + gid, title: '정규 규격 Rx\'d 와드 정복 및 고난도 체조 완성', dueDate: L.daysFromNow(25), milestones: [
              { id: 'lgm_a1_' + gid, title: '머슬업 10회 연속 & 스내치 체중 1.2배 달성', status: 'doing', priority: 'high', tasks: [
                { id: 'lgt_a1a_' + gid, title: '링 딥스 및 키핑 모빌리티 20분', done: true },
                { id: 'lgt_a1b_' + gid, title: '오버헤드 스쿼트 10회 안정화', done: false }
              ] },
              { id: 'lgm_a2_' + gid, title: '와드 제한시간 내 상위 10% 랭크', status: 'todo', priority: 'med', tasks: [
                { id: 'lgt_a2a_' + gid, title: '주 5회 고강도 인터벌 완주', done: false }
              ] }
            ] }
          ] },
          { id: 'lg_b_' + gid, name: 'B조 (Scaled / 중급)', goals: [
            { id: 'lgg_b1_' + gid, title: 'Scaled 와드 완주 시간 단축 및 기초 근력 증진', dueDate: L.daysFromNow(25), milestones: [
              { id: 'lgm_b1_' + gid, title: '풀업 10회 언브로큰 & 와드 주 4회 완주', status: 'doing', priority: 'med', tasks: [
                { id: 'lgt_b1a_' + gid, title: '풀업 밴드 점진적 감량하기', done: true },
                { id: 'lgt_b1b_' + gid, title: '로잉 2000m 8분 초반대 진입', done: false }
              ] }
            ] }
          ] },
          { id: 'lg_c_' + gid, name: 'C조 (기초 / 입문)', goals: [
            { id: 'lgg_c1_' + gid, title: '기본 테크닉 안전 숙지 및 운동 습관화', dueDate: L.daysFromNow(30), milestones: [
              { id: 'lgm_c1_' + gid, title: '버피 30개 논스톱 & 맨몸 스쿼트 자세 교정', status: 'todo', priority: 'low', tasks: [
                { id: 'lgt_c1a_' + gid, title: '코어 플랭크 3분 유지 챌린지', done: false },
                { id: 'lgt_c1b_' + gid, title: '월수금 주 3회 체육관 출석', done: false }
              ] }
            ] }
          ] }
        ];
      } else {
        L.state.profile.settings.groupLevelGoals[gid] = [
          { id: 'lg_a_' + gid, name: 'A조 (상급/심화반)', goals: [
            { id: 'lgg_a1_' + gid, title: '실전 성과 극대화 및 최고 목표 달성', dueDate: L.daysFromNow(30), milestones: [
              { id: 'lgm_a1_' + gid, title: '핵심 실전 마일스톤 돌파', status: 'doing', priority: 'high', tasks: [
                { id: 'lgt_a1a_' + gid, title: '심화 프로젝트/루틴 주 4회 완수', done: true },
                { id: 'lgt_a1b_' + gid, title: '결과물 포트폴리오/기록 정리', done: false }
              ] }
            ] }
          ] },
          { id: 'lg_b_' + gid, name: 'B조 (중급/실전반)', goals: [
            { id: 'lgg_b1_' + gid, title: '지속적인 실행력과 안정적 성장 루틴 확립', dueDate: L.daysFromNow(30), milestones: [
              { id: 'lgm_b1_' + gid, title: '중급 핵심 역량 마스터 & 주간 인증', status: 'doing', priority: 'med', tasks: [
                { id: 'lgt_b1a_' + gid, title: '주 3회 정기 실천 달성하기', done: true },
                { id: 'lgt_b1b_' + gid, title: '동료들과 피드백 공유하기', done: false }
              ] }
            ] }
          ] },
          { id: 'lg_c_' + gid, name: 'C조 (초급/기초반)', goals: [
            { id: 'lgg_c1_' + gid, title: '기초 습관 형성 및 포기 없는 30일 완주', dueDate: L.daysFromNow(30), milestones: [
              { id: 'lgm_c1_' + gid, title: '매일 15분 기초 실천 이어가기', status: 'todo', priority: 'low', tasks: [
                { id: 'lgt_c1a_' + gid, title: '첫 일주일 연속 스트릭 달성', done: false },
                { id: 'lgt_c1b_' + gid, title: '팀에 첫 인증글 남기기', done: false }
              ] }
            ] }
          ] }
        ];
      }
    }
    return L.state.profile.settings.groupLevelGoals[gid];
  }
  /* ---- 이전 전 index.html 7130~7424줄(#TASK-ES-552 생성기 표지) ---- */

  function openLevelGroupDetailModal(gid, lgId){
    var g = L.MOCK_GROUPS.find(function(x){ return x.id===gid; });
    var levelGroups = getGroupLevelGoals(gid);
    var lg = levelGroups.find(function(x){ return x.id===lgId; });
    if(!lg) return;

    var nG = (lg.goals||[]).length;
    var nM = (lg.goals||[]).reduce(function(acc, goal){ return acc + (goal.milestones||[]).length; }, 0);
    var nT = (lg.goals||[]).reduce(function(acc, goal){ return acc + (goal.milestones||[]).reduce(function(mAcc, ms){ return mAcc + (ms.tasks||[]).length; }, 0); }, 0);
    var nDoneT = (lg.goals||[]).reduce(function(acc, goal){ return acc + (goal.milestones||[]).reduce(function(mAcc, ms){ return mAcc + (ms.tasks||[]).filter(function(t){ return t.done; }).length; }, 0); }, 0);
    var nDoneM = (lg.goals||[]).reduce(function(acc, goal){ return acc + (goal.milestones||[]).filter(function(m){ return m.status === 'done'; }).length; }, 0);
    var lgProg = nT > 0 ? Math.round(nDoneT/nT*100) : (nM > 0 ? Math.round(nDoneM/nM*100) : 0);

    var goalsHtml = (lg.goals||[]).map(function(goal){
      var msListHtml = (goal.milestones||[]).map(function(m){
        var curPrio = m.priority || 'med';
        var prioLabel = curPrio === 'high' ? '높음' : (curPrio === 'low' ? '낮음' : '보통');
        var prioTagHtml = '<span class="ms-priority-tag ms-priority-' + curPrio + '" data-lgcyclestatusprio="' + goal.id + ':' + m.id + '" title="우선순위 변경 (클릭)">' + prioLabel + '</span>';
        var tasks = m.tasks || [];
        var taskRows = tasks.map(function(t){
          return '<div class="task-row" style="padding:3px 0;">' +
            '<div class="task-check'+(t.done?' done':'')+'" data-lgtoggletask="'+goal.id+':'+m.id+':'+t.id+'" style="cursor:pointer;">'+(t.done?'✓':'')+'</div>' +
            '<input class="task-title'+(t.done?' done-text':'')+'" data-lgtasktitle="'+goal.id+':'+m.id+':'+t.id+'" value="'+L.escapeHtml(t.title)+'" style="font-size:.875rem;">' +
            '<button class="icon-btn" data-lgdeltask="'+goal.id+':'+m.id+':'+t.id+'" type="button" title="삭제">×</button>' +
          '</div>';
        }).join('');

        return '<div class="ms-row" style="margin-top:6px;padding:8px 10px;background:var(--card);border-radius:12px;border:1px solid var(--rule);">' +
          '<div class="ms-main" style="align-items:flex-start;">' +
            '<div class="ms-status '+m.status+'" data-lgcyclestatus="'+goal.id+':'+m.id+'" style="margin-top:2px;cursor:pointer;" title="상태 변경 (클릭)">'+(m.status==='done'?'✓':'')+'</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;line-height:1;min-height:16px;">' +
                prioTagHtml +
                (tasks.length > 0 ? '<span class="faint" style="font-size:.6875rem;background:var(--card2);padding:1px 6px;border-radius:6px;">'+tasks.filter(function(t){return t.done;}).length+'/'+tasks.length+' 완료</span>' : '') +
              '</div>' +
              '<div style="display:flex;align-items:center;width:100%;">' +
                '<input class="ms-title'+(m.status==='done'?' done-text':'')+'" data-lgmtitle="'+goal.id+':'+m.id+'" value="'+L.escapeHtml(m.title)+'" style="width:100%;font-size:.9375rem;">' +
              '</div>' +
            '</div>' +
            '<div class="ms-actions">' +
              '<button class="icon-btn" data-lgdelms="'+goal.id+':'+m.id+'" type="button" title="마일스톤 삭제">×</button>' +
            '</div>' +
          '</div>' +
          (taskRows ? '<div class="task-list" style="margin-top:4px;">'+taskRows+'</div>' : '') +
          '<div class="task-add" data-lgaddtask="'+goal.id+':'+m.id+'" style="cursor:pointer;margin-top:4px;font-size:.8125rem;padding:4px 8px;">+ 세부 할 일 추가</div>' +
        '</div>';
      }).join('');

      return '<div style="background:var(--card2);border:1px solid var(--rule);border-radius:12px;padding:12px;margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">' +
          '<input data-lggoaltitle="'+goal.id+'" value="'+L.escapeHtml(goal.title)+'" style="font-weight:700;font-size:1rem;background:transparent;border:none;border-bottom:1px solid var(--rule);padding:2px 4px;flex:1;" placeholder="목표명을 입력하세요">' +
          '<button class="icon-btn" data-lgdelgoal="'+goal.id+'" type="button" title="목표 삭제" style="color:var(--ink-faint);">×</button>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' +
          '<span class="faint" style="font-size:.8125rem;">마감일</span>' +
          '<input type="date" data-lggoaldue="'+goal.id+'" value="'+(goal.dueDate||'')+'" style="font-size:.8125rem;padding:2px 6px;border-radius:6px;border:1px solid var(--rule);background:var(--card);">' +
        '</div>' +
        '<div style="margin-top:6px;">' +
          msListHtml +
          '<div class="add-ms-btn" data-lgaddms="'+goal.id+'" style="cursor:pointer;margin-top:8px;padding:8px;font-size:.8125rem;">+ 마일스톤 추가</div>' +
        '</div>' +
      '</div>';
    }).join('');

    var modalHtml = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
      '<div style="display:flex;align-items:center;gap:6px;">' +
        '<span style="font-size:1.5rem;"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg></span>' +
        '<div>' +
          '<h3 style="margin:0;font-size:1.1rem;">수준별 목표 상세 관리</h3>' +
          '<div class="faint" style="font-size:.8125rem;">' + (g ? g.icon + ' ' + L.escapeHtml(g.name) : '') + '</div>' +
        '</div>' +
      '</div>' +
      '<span class="dday-pill" style="background:var(--sage-soft);color:var(--sage);font-weight:700;">달성률 ' + lgProg + '%</span>' +
    '</div>' +

    '<div class="field" style="margin:12px 0 10px;">' +
      '<label style="font-weight:700;font-size:.8125rem;">조/그룹 이름 (수정 가능)</label>' +
      '<div style="display:flex;gap:6px;">' +
        '<input id="modalLgNameInput" type="text" value="' + L.escapeHtml(lg.name) + '" placeholder="예: A조 (상급/대회반)" style="font-weight:700;">' +
        '<button class="btn btn-ghost btn-sm" id="modalSaveLgNameBtn" type="button" style="flex:0 0 auto;">이름 저장</button>' +
      '</div>' +
    '</div>' +

    '<div style="background:var(--card2);border-radius:10px;padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">' +
      '<span class="faint" style="font-size:.8125rem;">요약: 목표 ' + nG + '개 · 마일스톤 ' + nM + '개 · 할일 ' + nT + '개</span>' +
      '<span class="faint" style="font-size:.8125rem;font-weight:700;">완료 할일 ' + nDoneT + '개</span>' +
    '</div>' +
    '<div class="group-bar" style="height:6px;margin-bottom:14px;"><span style="width:' + lgProg + '%;"></span></div>' +

    '<div style="max-height:55vh;overflow-y:auto;padding-right:2px;margin-bottom:12px;">' +
      (goalsHtml || '<p class="faint" style="text-align:center;padding:20px 0;">아직 등록된 조별 목표가 없어요. 아래 버튼으로 추가해보세요.</p>') +
    '</div>' +

    '<button class="btn btn-primary btn-sm btn-block" id="modalAddLgGoalBtn" type="button" style="margin-bottom:10px;">+ 이 조에 새 목표 추가</button>' +

    '<div class="modal-actions" style="margin-top:6px;">' +
      '<button class="btn btn-ghost btn-sm" id="modalDelLgBtn" type="button" style="color:var(--brand-strong);flex:0 0 auto;">조 삭제</button>' +
      '<button class="btn btn-ghost btn-sm" id="modalCloseLgBtn" type="button" style="flex:1;">닫기</button>' +
    '</div>';

    L.openModal(modalHtml, function(sheet){
      sheet.querySelector('#modalSaveLgNameBtn').addEventListener('click', async function(){
        var newN = sheet.querySelector('#modalLgNameInput').value.trim();
        if(newN){
          lg.name = newN;
          await L.saveProfile();
          L.toast('조 이름을 수정했어요');
          L.renderTeamGoalsScreen();
        }
      });

      sheet.querySelector('#modalAddLgGoalBtn').addEventListener('click', async function(){
        if(!lg.goals) lg.goals = [];
        lg.goals.push({
          id: L.uid('lgg'),
          title: '새 수준별 목표',
          dueDate: L.daysFromNow(30),
          milestones: [
            { id: L.uid('lgm'), title: '1단계 실천 과제', status: 'todo', priority: 'med', tasks: [] }
          ]
        });
        await L.saveProfile();
        L.toast('목표를 추가했어요');
        L.closeModal();
        openLevelGroupDetailModal(gid, lgId);
        L.renderTeamGoalsScreen();
      });

      sheet.querySelector('#modalDelLgBtn').addEventListener('click', async function(){
        if(!(await OurgoalCapabilities.call('ui.confirm', '정말 "' + lg.name + '" 조와 속한 모든 목표/할일을 삭제할까요?'))) return;
        L.state.profile.settings.groupLevelGoals[gid] = levelGroups.filter(function(x){ return x.id !== lgId; });
        await L.saveProfile();
        L.toast('조를 삭제했어요');
        L.closeModal();
        L.renderTeamGoalsScreen();
      });

      sheet.querySelector('#modalCloseLgBtn').addEventListener('click', function(){
        L.closeModal();
      });

      // Goal title & due edits
      sheet.querySelectorAll('[data-lggoaltitle]').forEach(function(inp){
        inp.addEventListener('change', async function(){
          var goalId = inp.dataset.lggoaltitle;
          var goal = (lg.goals||[]).find(function(x){ return x.id===goalId; });
          if(goal){ goal.title = inp.value.trim() || goal.title; await L.saveProfile(); L.renderTeamGoalsScreen(); }
        });
      });
      sheet.querySelectorAll('[data-lggoaldue]').forEach(function(inp){
        inp.addEventListener('change', async function(){
          var goalId = inp.dataset.lggoaldue;
          var goal = (lg.goals||[]).find(function(x){ return x.id===goalId; });
          if(goal){ goal.dueDate = inp.value || null; await L.saveProfile(); L.renderTeamGoalsScreen(); }
        });
      });
      sheet.querySelectorAll('[data-lgdelgoal]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var goalId = btn.dataset.lgdelgoal;
          lg.goals = (lg.goals||[]).filter(function(x){ return x.id!==goalId; });
          await L.saveProfile();
          L.toast('목표를 삭제했어요');
          L.closeModal();
          openLevelGroupDetailModal(gid, lgId);
          L.renderTeamGoalsScreen();
        });
      });

      // Milestones
      sheet.querySelectorAll('[data-lgaddms]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var goalId = btn.dataset.lgaddms;
          var goal = (lg.goals||[]).find(function(x){ return x.id===goalId; });
          if(goal){
            if(!goal.milestones) goal.milestones = [];
            goal.milestones.push({ id: L.uid('lgm'), title: '새 마일스톤', status: 'todo', priority: 'med', tasks: [] });
            await L.saveProfile();
            L.closeModal();
            openLevelGroupDetailModal(gid, lgId);
            L.renderTeamGoalsScreen();
          }
        });
      });
      sheet.querySelectorAll('[data-lgcyclestatus]').forEach(function(el){
        el.addEventListener('click', async function(){
          var parts = el.dataset.lgcyclestatus.split(':');
          var goal = (lg.goals||[]).find(function(x){ return x.id===parts[0]; });
          var m = goal && (goal.milestones||[]).find(function(x){ return x.id===parts[1]; });
          if(m){
            var order = ['todo','doing','done'];
            m.status = order[(order.indexOf(m.status)+1)%3];
            L.triggerHaptic(10);
            await L.saveProfile();
            L.closeModal();
            openLevelGroupDetailModal(gid, lgId);
            L.renderTeamGoalsScreen();
          }
        });
      });
      sheet.querySelectorAll('[data-lgcyclestatusprio]').forEach(function(el){
        el.addEventListener('click', async function(){
          var parts = el.dataset.lgcyclestatusprio.split(':');
          var goal = (lg.goals||[]).find(function(x){ return x.id===parts[0]; });
          var m = goal && (goal.milestones||[]).find(function(x){ return x.id===parts[1]; });
          if(m){
            var pOrder = ['med','high','low'];
            m.priority = pOrder[(pOrder.indexOf(m.priority||'med')+1)%3];
            L.triggerHaptic(10);
            await L.saveProfile();
            L.closeModal();
            openLevelGroupDetailModal(gid, lgId);
            L.renderTeamGoalsScreen();
          }
        });
      });
      sheet.querySelectorAll('[data-lgmtitle]').forEach(function(inp){
        inp.addEventListener('change', async function(){
          var parts = inp.dataset.lgmtitle.split(':');
          var goal = (lg.goals||[]).find(function(x){ return x.id===parts[0]; });
          var m = goal && (goal.milestones||[]).find(function(x){ return x.id===parts[1]; });
          if(m){ m.title = inp.value.trim() || m.title; await L.saveProfile(); L.renderTeamGoalsScreen(); }
        });
      });
      sheet.querySelectorAll('[data-lgdelms]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var parts = btn.dataset.lgdelms.split(':');
          var goal = (lg.goals||[]).find(function(x){ return x.id===parts[0]; });
          if(goal){
            goal.milestones = (goal.milestones||[]).filter(function(x){ return x.id!==parts[1]; });
            await L.saveProfile();
            L.closeModal();
            openLevelGroupDetailModal(gid, lgId);
            L.renderTeamGoalsScreen();
          }
        });
      });

      // Tasks
      sheet.querySelectorAll('[data-lgaddtask]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var parts = btn.dataset.lgaddtask.split(':');
          var goal = (lg.goals||[]).find(function(x){ return x.id===parts[0]; });
          var m = goal && (goal.milestones||[]).find(function(x){ return x.id===parts[1]; });
          if(m){
            if(!m.tasks) m.tasks = [];
            m.tasks.push({ id: L.uid('lgt'), title: '새 세부 할 일', done: false });
            await L.saveProfile();
            L.closeModal();
            openLevelGroupDetailModal(gid, lgId);
            L.renderTeamGoalsScreen();
          }
        });
      });
      sheet.querySelectorAll('[data-lgtoggletask]').forEach(function(el){
        el.addEventListener('click', async function(){
          var parts = el.dataset.lgtoggletask.split(':');
          var goal = (lg.goals||[]).find(function(x){ return x.id===parts[0]; });
          var m = goal && (goal.milestones||[]).find(function(x){ return x.id===parts[1]; });
          var t = m && (m.tasks||[]).find(function(x){ return x.id===parts[2]; });
          if(t){
            t.done = !t.done;
            L.triggerHaptic(10);
            await L.saveProfile();
            L.closeModal();
            openLevelGroupDetailModal(gid, lgId);
            L.renderTeamGoalsScreen();
          }
        });
      });
      sheet.querySelectorAll('[data-lgtasktitle]').forEach(function(inp){
        inp.addEventListener('change', async function(){
          var parts = inp.dataset.lgtasktitle.split(':');
          var goal = (lg.goals||[]).find(function(x){ return x.id===parts[0]; });
          var m = goal && (goal.milestones||[]).find(function(x){ return x.id===parts[1]; });
          var t = m && (m.tasks||[]).find(function(x){ return x.id===parts[2]; });
          if(t){ t.title = inp.value.trim() || t.title; await L.saveProfile(); L.renderTeamGoalsScreen(); }
        });
      });
      sheet.querySelectorAll('[data-lgdeltask]').forEach(function(btn){
        btn.addEventListener('click', async function(){
          var parts = btn.dataset.lgdeltask.split(':');
          var goal = (lg.goals||[]).find(function(x){ return x.id===parts[0]; });
          var m = goal && (goal.milestones||[]).find(function(x){ return x.id===parts[1]; });
          if(m){
            m.tasks = (m.tasks||[]).filter(function(x){ return x.id!==parts[2]; });
            await L.saveProfile();
            L.closeModal();
            openLevelGroupDetailModal(gid, lgId);
            L.renderTeamGoalsScreen();
          }
        });
      });
    });
  }
  /* ---- 이전 전 index.html 7425~7465줄(#TASK-ES-552 생성기 표지) ---- */

  function collapseAllTeamGoalAccordions() {
    if (typeof document === 'undefined') return; var isTeamLevelSectionOpen = function(gid){ return !!(gid && window.OurgoalTeamVisibilityLevels && typeof OurgoalTeamVisibilityLevels.isLevelSectionOpen === 'function' && OurgoalTeamVisibilityLevels.isLevelSectionOpen(gid)); }; var isTeamMsListOpen = function(tgid){ return !!(tgid && window.OurgoalTeamVisibilityLevels && typeof window.OurgoalTeamVisibilityLevels.isMsListOpen === 'function' && window.OurgoalTeamVisibilityLevels.isMsListOpen(tgid)); }; var isTeamParticipantsOpen = function(tgid){ return !!(tgid && window.OurgoalTeamLinkedGoals && typeof window.OurgoalTeamLinkedGoals.isParticipantsOpen === 'function' && window.OurgoalTeamLinkedGoals.isParticipantsOpen(tgid)); };
    try {
      // 1. 마일스톤 목록 및 버튼 상태 접힘 정돈
      document.querySelectorAll('.ms-list, [data-tgmslist]').forEach(function(el){
        if (!L.state.teamGoalEditMode && !isTeamMsListOpen(el.getAttribute('data-tgmslist'))) el.style.display = 'none';
      });
      document.querySelectorAll('.tg-fold-btn, [data-tgfoldlist]').forEach(function(btn){
        btn.textContent = isTeamMsListOpen(btn.getAttribute('data-tgfoldlist')) ? '마일스톤 접기 ▲' : '마일스톤 펼치기 ▼';
      });

      // 2. 세부 할 일 박스 접힘 정돈
      document.querySelectorAll('.tg-subtask-box, [data-tgtaskbox]').forEach(function(el){
        if (!L.state.teamGoalEditMode) el.style.display = 'none';
      });

      // 3. 댓글 / 대화 박스 접힘 정돈
      document.querySelectorAll('.tg-ms-comments-content, .tg-goal-comments-content, [data-tgmscommentsbox], [data-tggoalcommentsbox]').forEach(function(el){
        el.style.display = 'none';
      });

      // 4. 수준별 목표 관리 아코디언 및 조별 아코디언 접힘 정돈
      document.querySelectorAll('.tg-accordion-body, [data-tglevelbody]').forEach(function(el){
        if (!isTeamLevelSectionOpen(el.getAttribute('data-tglevelbody'))) el.style.display = 'none';
      });
      document.querySelectorAll('.tg-lg-row-body, [data-tglgbody]').forEach(function(el){
        el.style.display = 'none';
      });
      document.querySelectorAll('.tg-accordion-arrow').forEach(function(arrow){
        var partHead = arrow.closest('[data-tgparttoggle]'); if (partHead) return arrow.classList.toggle('rotated', isTeamParticipantsOpen(String(partHead.getAttribute('data-tgparttoggle')).split(':')[1])); var levelHead = arrow.closest('[data-tglevelaccordion]'); if (!levelHead || !isTeamLevelSectionOpen(levelHead.getAttribute('data-tglevelaccordion'))) arrow.classList.remove('rotated');
      });

      // 5. HTML5 details 태그 접힘 정돈
      document.querySelectorAll('#teamGoalsView details').forEach(function(dt){
        dt.open = false;
      });
    } catch (e) {
      console.warn('[TASK-ES-302] collapseAllTeamGoalAccordions error:', e);
    }
  }

  K.isMockGroup = isMockGroup;
  K.getGroupLevelGoals = getGroupLevelGoals;
  K.openLevelGroupDetailModal = openLevelGroupDetailModal;
  K.collapseAllTeamGoalAccordions = collapseAllTeamGoalAccordions;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
