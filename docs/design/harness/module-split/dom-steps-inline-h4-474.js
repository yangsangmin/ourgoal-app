'use strict';
// #TASK-ES-474 (인라인 어려움 구역 H4 2차) 게스트 조작 단계 — dom-compare-inline-h4.js 의 넷째 인자.
// 옮긴 함수가 불리는 곳을 차례로 누른다:
//   소통 탭 「팀」(renderCommGroups) → 첫 팀 카드 열기(renderGroupDetail·collectiveGaugeHtml) → 「팀」 다시 → 「+ 새 팀 개설하기」(promptNewGroup)
//   → 추천 「목표 완주 크루」 → 첫 카테고리·첫 중범위 → 「팀 만들기」(새 팀 상세)
//   기록 탭 내보내기 단추(openExportThemeModal) → 「AI 프롬프트 복사」 → 닫기
//   미니 성취 펄스 막대(bindRecPulseBar) → 위클리 리캡 「만들기」(openWeeklyRecapModal) → 「🎨 카드 공유」(openLegacyRecapCanvasModal·generateWeeklyRecapImage) → 닫기
//   캐러셀 알약(bindRecCarouselPills) → 기록 추가 「+」(openRecordModal) → 닫기
module.exports = {
  globals: ['weeklyRecapStats', 'fitBigFont', 'generateWeeklyRecapImage', 'findBestMoment', 'openWeeklyRecapModal', 'openLegacyRecapCanvasModal', 'openRecordModal', 'bindRecTimeTrackerBtn', 'bindRecSegmentBar', 'bindRecPulseBar', 'bindRecCarouselPills', 'bindRecDocumentClick', 'buildWebCalUrl', 'buildICS', 'buildMarkdownExport', 'loadSharedGroups', 'renderCommGroups', 'renderGroupDetail', 'collectiveGaugeHtml', 'promptNewGroup', 'fetchSignedCalendarToken', 'openExportThemeModal', 'exportAllCheckins'],
  kits: ['OurgoalCommKit', 'OurgoalRecordsKit'],
  steps: ({ click, clickIn }) => [
    ['comm-enter', { goTab: 'comm' }],
    ['group-sub', click('#commBody [data-sub="group"]'), 800],
    ['group-open', click('#commSubBody [data-open-group]'), 800],
    ['group-sub-2', click('#commBody [data-sub="group"]'), 800],
    ['group-new', click('#btnHeroCreateTeamComm'), 600],
    ['group-preset', click('#tplMarathonSmall'), 400],
    ['group-major', click('#gTopicMajor [data-major]'), 400],
    ['group-minor', click('#gTopicSub [data-sub]'), 400],
    ['group-save', click('#grpSave'), 1500],
    ['records-enter', { goTab: 'records' }],
    ['export-open', click('#exportRecordsBtn'), 600],
    ['export-copy', clickIn('#mExpCopyPrompt'), 800],
    ['close', { closeModal: true }],
    ['pulse-bar', click('#recMiniPulseBar'), 600],
    ['recap-open', click('#weeklyRecapBtn'), 1200],
    ['recap-canvas', clickIn('#btnRecapOpenCanvas'), 2500],
    ['close-2', { closeModal: true }],
    ['carousel-1', click('#recCarouselPills [data-recslide="1"]'), 600],
    ['carousel-0', click('#recCarouselPills [data-recslide="0"]'), 600],
    ['rec-add', click('#recAddBtn'), 800],
    ['close-3', { closeModal: true }],
  ],
};
