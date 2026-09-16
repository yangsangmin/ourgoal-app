const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== [#TASK-ES-124] 동반자 검색 2중 파이프라인 및 가상유저 3인 AI 뱃지 실측 시뮬레이션 시작 ===\n');

// 1. 모의 브라우저 환경 구성
const globalWindow = {
  state: {
    profile: {
      id: 'usr_real_tester_123',
      displayName: '상민테스터',
      companions: [
        { id: 'comp_runner_1', nickname: '새벽러너_민지', name: '김민지', avatar: '🏃‍♀️', level: 7, streak: 15, theme: '러닝·마라톤', intro: '매일 아침 6시 5km 달리기 인증합니다!', goals: ['10km 마라톤 완주'] },
        { id: 'comp_coder_2', nickname: '코드장인_도현', name: '박도현', avatar: '💻', level: 9, streak: 28, theme: '코딩·개발', intro: '풀스택 개발자 지망생', goals: ['React 풀스택 앱'] },
        { id: 'comp_study_3', nickname: '갓생사는_수아', name: '이수아', avatar: '📚', level: 5, streak: 8, theme: '학습·자격', intro: '공인중개사 동차합격 목표', goals: ['기출문제 3회독'] },
        { id: 'usr_real_peer_999', nickname: '진짜회원철수', name: '김철수', avatar: '😎', level: 3, streak: 5, theme: '운동·헬스', intro: '실제 사용자입니다' }
      ]
    },
    commSubTab: 'companion'
  },
  sb: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
      update: () => ({ eq: async () => ({ error: null }) })
    }),
    rpc: async (name, params) => {
      if(name === 'search_users_by_nickname') {
        return {
          data: [
            { id: 'usr_searched_1', nickname: '검색된회원', avatar_url: '🎯', bio: '실제 가입 회원입니다', interests: ['러닝'] }
          ]
        };
      }
      return { data: [] };
    }
  },
  toast: msg => console.log('  [Toast]:', msg),
  openModal: (html, cb) => {
    const mockSheet = { querySelector: () => null };
    if(cb) cb(mockSheet);
  }
};

// 2. team-invite-comm.js 로드
const commPath = path.join(__dirname, '..', 'js', 'team-invite-comm.js');
const commCode = fs.readFileSync(commPath, 'utf8');

const fn = new Function('window', 'global', commCode);
fn(globalWindow, globalWindow);

console.log('1. [가상 유저 3인 AI 판별 테스트]');
const comps = globalWindow.state.profile.companions;
assert.strictEqual(comps.length, 4, '초기 동반자 4명 (가상 3명 + 실 유저 1명)');

// DOM 모의 엘리먼트
const mockBody = {
  innerHTML: '',
  querySelector: sel => {
    return {
      value: '검색된회원',
      addEventListener: () => {}
    };
  },
  querySelectorAll: () => []
};

// 3. renderCommCompanions 실행
globalWindow.OurgoalTeamInviteComm.renderCommCompanions(mockBody);

// 4. 자가 치유(Self-Healing) 결과 검증
console.log('2. [자가 치유 검증]');
const minji = comps.find(c => c.id === 'comp_runner_1');
const dohyun = comps.find(c => c.id === 'comp_coder_2');
const sua = comps.find(c => c.id === 'comp_study_3');
const chulsoo = comps.find(c => c.id === 'usr_real_peer_999');

assert.strictEqual(minji.isAiBot, true, '새벽러너_민지 isAiBot: true 자가치유 완료');
assert.strictEqual(dohyun.isAiBot, true, '코드장인_도현 isAiBot: true 자가치유 완료');
assert.strictEqual(sua.isAiBot, true, '갓생사는_수아 isAiBot: true 자가치유 완료');
assert.strictEqual(chulsoo.isAiBot, false, '진짜회원철수 isAiBot: false 유지');
console.log('  ✓ 가상 유저 3인 isAiBot: true 자가치유 100% 성공!');

// 5. 렌더링된 HTML 뱃지 검증
console.log('3. [HTML 뱃지 표기 검증]');
assert.ok(mockBody.innerHTML.includes('🤖 AI 동반자'), 'HTML 내 🤖 AI 동반자 뱃지 렌더링 확인');
assert.ok(mockBody.innerHTML.includes('실 사용자'), 'HTML 내 실 사용자 뱃지 렌더링 확인');

// 가상 유저 3명에게 '실 사용자' 뱃지가 붙지 않고 AI 동반자 뱃지가 붙었는지 카운팅
const aiBadgeCount = (mockBody.innerHTML.match(/🤖 AI 동반자/g) || []).length;
const realBadgeCount = (mockBody.innerHTML.match(/실 사용자/g) || []).length;
console.log(`  ✓ 🤖 AI 동반자 뱃지: ${aiBadgeCount}개, 실 사용자 뱃지: ${realBadgeCount}개`);
assert.strictEqual(aiBadgeCount, 3, '가상 유저 3명 전원 🤖 AI 동반자 뱃지 부착');
assert.strictEqual(realBadgeCount, 1, '실 유저 1명만 실 사용자 뱃지 부착');

// 6. 프로필 모달 오픈 검증
console.log('4. [프로필 모달 AI 투명성 검증]');
let capturedModalHtml = '';
globalWindow.openModal = html => { capturedModalHtml = html; };

globalWindow.OurgoalTeamInviteComm.openUserProfileModal(minji);
assert.ok(capturedModalHtml.includes('🤖 AI 동반자'), '프로필 모달에 🤖 AI 동반자 뱃지 탑재 확인');
assert.ok(capturedModalHtml.includes('목표 도전을 함께 응원하는 AI 동반자입니다'), '프로필 모달에 투명 안내 문구 탑재 확인');
console.log('  ✓ AI 동반자 프로필 모달 투명 안내 문구 검증 완료!');

globalWindow.OurgoalTeamInviteComm.openUserProfileModal(chulsoo);
assert.ok(capturedModalHtml.includes('실 사용자'), '실 사용자 프로필 모달에 실 사용자 뱃지 탑재 확인');
assert.ok(!capturedModalHtml.includes('목표 도전을 함께 응원하는 AI 동반자입니다'), '실 사용자에게는 AI 안내 문구 미노출 확인');
console.log('  ✓ 실 사용자 프로필 모달 정상 분기 검증 완료!');

console.log('\n🎉 [최종 검증 완료] 모든 테스트가 100% 성공했습니다!');
