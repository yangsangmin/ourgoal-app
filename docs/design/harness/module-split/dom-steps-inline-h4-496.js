'use strict';
// #TASK-ES-496 (인라인 어려움 구역 H4 3차) 게스트 조작 단계 — dom-compare-inline-h4.js 의 넷째 인자.
// 소통 탭 「피드」(renderCommFeed) → 종류 칸(내 소통·사진인증만·전체) → 분야 칸 두 개 → 첫 글 댓글 펼치기 → 첫 글 「파이팅」 반응 → 첫 글 공유 단추
module.exports = {
  globals: ['feedPostHtml', 'renderCommFeed'],
  kits: ['OurgoalCommKit'],
  steps: ({ click }) => [
    ['comm-enter', { goTab: 'comm' }],
    ['feed-sub', click('#commBody [data-sub="feed"]'), 800],
    ['feed-mine', click('#commSubBody [data-feedtype="mine"]'), 400],
    ['feed-photo', click('#commSubBody [data-feedtype="photo"]'), 400],
    ['feed-all', click('#commSubBody [data-feedtype="all"]'), 400],
    ['feed-cat-1', click('#commSubBody [data-feedcat]:nth-child(2)'), 400],
    ['feed-cat-0', click('#commSubBody [data-feedcat]:nth-child(1)'), 400],
    ['feed-comments', click('#commSubBody [data-togglecomments]'), 400],
    ['feed-react', click('#commSubBody [data-reacttype="fire"]'), 800],
    ['feed-share', click('#commSubBody [data-sharefeed]'), 800],
    ['close', { closeModal: true }],
  ],
};
