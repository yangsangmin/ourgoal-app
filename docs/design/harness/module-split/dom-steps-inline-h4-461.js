'use strict';
// #TASK-ES-461 (인라인 어려움 구역 H4 1차) 게스트 조작 단계 — dom-compare-inline-h4.js 의 넷째 인자.
// 옮긴 함수가 불리는 곳을 차례로 누른다:
//   소통 탭 「공유」(renderCommShare) → 「목표 & 달성률」 끄기·켜기 → 첫 마일스톤 줄 → 두 번째 목표 칩 → 카드 만들기(캔버스)
//   소통 탭 「팀」 → 첫 팀 카드 → 「초대 링크 복사」(copyGroupInviteLink·copyTextToClipboard·trackPeerInvite) → 「카카오톡 초대」(shareGroupToKakao)
//   소통 탭 「마니또」(renderCommManito·manitoPartners·manitoInbox …) → 「다시 뽑기」 → 「마니또 시작하기」(게스트 AI 마니또 배정, isValidRealUser)
//   첫 화면 「로그인이 잘 안 되시나요?」(bindLoginRescueButtons → openLoginRescueModal) → 빈 칸으로 「바로 입장」(토스트) → 닫기
//   (복구 창은 로그인 세션·게스트 프로필 저장값을 지우므로 맨 끝에 둔다 — 기준·후 같은 순서)
module.exports = {
  globals: ['renderCommShare', 'generateGoalCertificateImage', 'restoreSessionAndEnter', 'loginWithDirectIdentifier', 'openLoginRescueModal', 'rescueLoginSession', 'bindLoginRescueButtons',
    'isValidRealUser', 'loadServerManitoData', 'manitoPartners', 'manitoInbox', 'renderCommManito', 'renderManitoDm',
    'copyTextToClipboard', 'copyGroupInviteLink', 'shareGroupToKakao', 'acceptPeerInvite', 'showPeerInviteLandingModal', 'openPeerInviteSuccessModal'],
  kits: ['OurgoalCommKit', 'OurgoalSettingsKit'],
  steps: ({ click }) => [
    ['comm-enter', { goTab: 'comm' }],
    ['share-sub', click('#commBody [data-sub="share"]'), 800],
    ['share-goal-off', click('#commSubBody [data-scpick="goal"]'), 400],
    ['share-goal-on', click('#commSubBody [data-scpick="goal"]'), 400],
    ['share-ms', click('#commSubBody [data-scms]'), 400],
    ['share-goal-2', click('#commSubBody [data-sharegoal]:nth-child(2)'), 400],
    ['share-card', click('#sharePreviewBtn'), 3000],
    ['group-sub', click('#commBody [data-sub="group"]'), 800],
    ['group-open', click('#commSubBody [data-open-group]'), 800],
    ['group-copy', click('#grpCopyLinkBtn'), 600],
    ['group-kakao', click('#grpKakaoInviteBtn'), 800],
    ['manito-sub', click('#commBody [data-sub="manito"]'), 800],
    ['manito-regen', click('#mnRegen'), 400],
    ['manito-join', click('#mnJoin'), 1500],
    ['rescue-open', click('#landRescueBtn'), 600],
    ['rescue-empty', click('#rescueDirectEnterBtn'), 600],
    ['rescue-close', { closeModal: true }],
  ],
};
