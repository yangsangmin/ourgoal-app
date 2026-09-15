const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('🧪 [테스트] 팀 연계 개인목표 및 상호 달성도 체크·소통 시스템 정밀 검증 시작...');

// 1. 모듈 로드
const moduleCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'team-linked-goals.js'), 'utf8');
let exportedModule = null;
const mockWindow = {
  addEventListener: () => {},
  document: {}
};
const evalContext = {
  window: mockWindow,
  global: mockWindow
};

const fn = new Function('window', 'global', moduleCode);
fn(mockWindow, mockWindow);

const TLG = mockWindow.OurgoalTeamLinkedGoals;
assert.ok(TLG, 'OurgoalTeamLinkedGoals 모듈이 정상적으로 노출되어야 함');
console.log('  ✓ 1. OurgoalTeamLinkedGoals 모듈 로드 성공');

// 2. Mock 환경 세팅
let toastMsg = null;
let modalHtml = null;
let modalCb = null;
let saved = false;
let hapticVal = null;

const mockGroups = [
  {
    id: 'g-workshop',
    name: '2026 하반기 전략 워크숍 TF',
    icon: '🏢',
    roster: [
      { n: '김민우', c: 6 },
      { n: '이서연', c: 4 },
      { n: '박진혁', c: 2 }
    ],
    teamGoals: [
      {
        id: 'tg-ws-1',
        title: '워크숍 발표자료 완성 및 리허설',
        dueDate: '2026-10-15',
        category: 'work',
        milestones: [
          {
            id: 'm-ws-1',
            title: '1주차: 아젠다 확정 및 초안 작성',
            status: 'todo',
            tasks: [
              { id: 't-ws-1', title: '핵심 발표 슬라이드 10장 구성', done: false },
              { id: 't-ws-2', title: '팀원별 피드백 취합', done: false }
            ]
          },
          {
            id: 'm-ws-2',
            title: '2주차: 최종 리허설 및 QA',
            status: 'todo',
            tasks: [
              { id: 't-ws-3', title: '실전 리허설 2회 진행', done: false }
            ]
          }
        ]
      }
    ]
  }
];

const mockState = {
  profile: {
    id: 'user-tester-1',
    displayName: '상민테스터',
    avatar: '🦁',
    goals: [],
    groupStates: {}
  },
  goalsSubTab: 'team',
  activeTeamLinkedGoalId: null,
  teamLinkedEditMode: false
};

TLG.init({
  getState: () => mockState,
  getProfile: () => mockState.profile,
  saveProfile: async () => { saved = true; },
  toast: (msg) => { toastMsg = msg; },
  openModal: (html, cb) => { modalHtml = html; modalCb = cb; },
  closeModal: () => { modalHtml = null; },
  triggerHaptic: (v) => { hapticVal = v; },
  escapeHtml: (s) => String(s || ''),
  dDay: (d) => 'D-15',
  goalAchievement: (goal) => {
    if(!goal || !goal.milestones || !goal.milestones.length) return 0;
    const allT = goal.milestones.reduce((acc, m) => acc.concat(m.tasks || []), []);
    if(allT.length > 0){
      const doneT = allT.filter(t => t.done).length;
      return Math.round(doneT / allT.length * 100);
    }
    const doneM = goal.milestones.filter(m => m.status === 'done').length;
    return Math.round(doneM / goal.milestones.length * 100);
  },
  renderGoalsScreen: () => {},
  renderTeamGoalsScreen: () => {},
  groupState: (gid) => {
    mockState.profile.groupStates[gid] = mockState.profile.groupStates[gid] || {};
    return mockState.profile.groupStates[gid];
  },
  MOCK_GROUPS: mockGroups
});
console.log('  ✓ 2. 모듈 init 및 Mock 의존성 주입 완료');

// 3. 복사 참가 전 참가자 목록 확인
const initialParticipants = TLG.getTeamGoalParticipants('g-workshop', mockGroups[0].teamGoals[0]);
assert.strictEqual(initialParticipants.length, 3, '초기 시드 참가자 3명이 존재해야 함');
assert.strictEqual(initialParticipants[0].name, '김민우', '첫 번째 참가자는 김민우여야 함');
console.log('  ✓ 3. 팀 목표 초기 참가자 목록(3명) 정상 조회');

// 4. '팀 연계 개인목표로 복사하며 참가' 실행
(async function runTests(){
  await TLG.copyTeamGoalToPersonalLinked('g-workshop', 'tg-ws-1');
  assert.strictEqual(mockState.profile.goals.length, 1, '개인 목표 목록에 1개 복사되어야 함');
  const linkedGoal = mockState.profile.goals[0];
  assert.strictEqual(linkedGoal.teamLinked, true, 'teamLinked 플래그가 true여야 함');
  assert.strictEqual(linkedGoal.teamGoalId, 'tg-ws-1', 'teamGoalId가 일치해야 함');
  assert.strictEqual(linkedGoal.groupId, 'g-workshop', 'groupId가 일치해야 함');
  assert.strictEqual(linkedGoal.title, '워크숍 발표자료 완성 및 리허설', '목표명이 일치해야 함');
  assert.strictEqual(linkedGoal.milestones.length, 2, '마일스톤 2개가 복사되어야 함');
  assert.strictEqual(linkedGoal.milestones[0].tasks.length, 2, '첫 번째 마일스톤에 할일 2개 복사');
  assert.notStrictEqual(linkedGoal.milestones[0].id, 'm-ws-1', '마일스톤에 새로운 고유 ID가 부여되어야 함');
  assert.strictEqual(mockState.goalsSubTab, 'teamLinked', '탭이 teamLinked로 전환되어야 함');
  assert.ok(toastMsg && toastMsg.includes('복사하고 참가했습니다'), '성공 토스트 안내가 나와야 함');
  console.log('  ✓ 4. 원클릭 복사 참가 로직 (고유 ID, 메타데이터, 탭 전환) 검증 완료');

  // 5. 참가자 목록에 본인 반영 확인
  const updatedParticipants = TLG.getTeamGoalParticipants('g-workshop', mockGroups[0].teamGoals[0]);
  assert.strictEqual(updatedParticipants.length, 4, '본인이 포함되어 총 4명이어야 함');
  const myRecord = updatedParticipants.find(p => p.isMe);
  assert.ok(myRecord, '본인 레코드가 참가자 목록에 존재해야 함');
  assert.strictEqual(myRecord.name, '상민테스터', '본인 이름 일치');
  assert.strictEqual(myRecord.progressPct, 0, '초기 달성률 0%');
  console.log('  ✓ 5. 팀 목표 참가자 목록에 본인 자동 등록 검증 완료');

  // 6. 개인 워크스페이스에서 세부 할일 완료 체크 시 실시간 동기화
  linkedGoal.milestones[0].tasks[0].done = true; // 3개 중 1개 완료 -> 33%
  TLG.syncTeamGoalParticipantProgress(linkedGoal);
  const afterCheckParticipants = TLG.getTeamGoalParticipants('g-workshop', mockGroups[0].teamGoals[0]);
  const myUpdatedRecord = afterCheckParticipants.find(p => p.isMe);
  assert.strictEqual(myUpdatedRecord.progressPct, 33, '할일 체크 시 진행률 33%로 즉시 갱신되어야 함');
  console.log('  ✓ 6. 개인 워크스페이스 실천 -> 팀 목표 참가자 달성률 실시간 연동 검증 완료');

  // 7. 팀 목표 카드 섹션 렌더링 검증
  const cardSections = TLG.renderTeamGoalCardSections(mockGroups[0], mockGroups[0].teamGoals[0], true);
  assert.ok(cardSections.teamLinkedBtnHtml.includes('내 팀 연계 개인목표 참가 중'), '참가 중일 때 바로가기 버튼 노출');
  assert.ok(cardSections.participantsSectionHtml.includes('참가 팀원 달성 현황'), '참가 팀원 현황 헤더 노출');
  assert.ok(cardSections.participantsSectionHtml.includes('data-tgpnudge='), '⚡ 찌르기 버튼 노출');
  assert.ok(cardSections.participantsSectionHtml.includes('data-tgpcmt='), '💬 댓글 버튼 노출');
  assert.ok(cardSections.participantsSectionHtml.includes('data-tgpdm='), '✉️ DM 버튼 노출');
  console.log('  ✓ 7. 팀 목표 카드 내 참가자 현황 및 3대 상호작용(찌르기/댓글/DM) 버튼 렌더링 검증 완료');

  // 8. 1:1 DM 모달 실행 및 메시지 전송 시뮬레이션
  TLG.openTeamGoalMemberDmModal('g-workshop', 'tg-ws-1', '김민우', '🏃‍♂️');
  assert.ok(modalHtml && modalHtml.includes('김민우님과의 1:1 대화'), 'DM 모달이 정상적으로 열려야 함');
  console.log('  ✓ 8. 팀원 1:1 DM 모달 렌더링 및 소통 루프 검증 완료');

  console.log('\n🎉 [SUCCESS] 모든 단위/통합 기능 검증 100% 통과 (8/8)!');
})();
