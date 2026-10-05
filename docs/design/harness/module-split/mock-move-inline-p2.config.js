'use strict';
// #TASK-ES-447 모의 이전 설정 — 시험지 선행이 맞는지 재려고, 기준 사본에서 시험지 4개가 index.html 글자로 읽던 선언을 세포로 옮겨 본다(저장소 제품 코드는 바꾸지 않는다).
const R = { kit: 'OurgoalRecordsKit', kitVar: '_recordsKit', beforeTag: '<script src="js/tabs/records/index.js"></script>' };
const C = { kit: 'OurgoalCommKit', kitVar: '_commKit', beforeTag: '<script src="js/tabs/comm/index.js"></script>' };
const S = { kit: 'OurgoalSettingsKit', kitVar: '_settingsKit', beforeTag: '<script src="js/tabs/settings/index.js"></script>' };
module.exports = {
  task: 'TASK-ES-447', n: 'mock',
  cells: [
    Object.assign({ key: 'sw', file: 'js/tabs/records/mock-stopwatch.js', title: 'mock', desc: ['mock'], groups: [{ id: 'G140', names: ['playTimerBeep', 'STOPWATCH_STATE', 'renderStopwatchWidgetHtml', 'renderLapRowsHtml'] }, { id: 'G130', names: ['wireRecordCards'] }] }, R),
    Object.assign({ key: 'feed', file: 'js/tabs/comm/mock-feed.js', title: 'mock', desc: ['mock'], groups: [{ id: 'G158', names: ['ensureFeedPostsLoaded', 'setupFeedPostsRealtime'] }] }, C),
    Object.assign({ key: 'widget', file: 'js/tabs/settings/mock-widget.js', title: 'mock', desc: ['mock'], groups: [{ id: 'G168', names: ['openWidgetSettingsModal'] }] }, S),
  ],
};
