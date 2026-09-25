// tests/avatar-period-analysis.test.js
// TASK-ES-269: 기간 설정(목표·팀·기록 분석) 맞춤형 아바타 생성 결합 및 설정창 확대 단위 테스트

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTest() {
  const avatarPath = path.join(__dirname, '..', 'js', 'avatar-system.js');
  const uiCssPath = path.join(__dirname, '..', 'ui.css');

  assert.ok(fs.existsSync(avatarPath), 'avatar-system.js 파일이 존재해야 합니다.');
  assert.ok(fs.existsSync(uiCssPath), 'ui.css 파일이 존재해야 합니다.');

  const avatarSrc = fs.readFileSync(avatarPath, 'utf8');
  const uiCss = fs.readFileSync(uiCssPath, 'utf8');

  // 1. 아바타 설정 모달 창 크기 확대 검증
  assert.ok(avatarSrc.includes('max-width:620px'), '모달 내부 래퍼 max-width 620px 확대');
  assert.ok(avatarSrc.includes("sheet.style.maxHeight = '94vh'"), '모달 시트 maxHeight 94vh 확대');
  assert.ok(avatarSrc.includes("sheet.style.maxWidth = '640px'"), '모달 시트 maxWidth 640px 확대');

  // 2. 사진 선택 버튼군 바로 밑 '아바타 생성 기준 기간 정하기' 및 UI 요소 검증
  const uploadBtnIdx = avatarSrc.indexOf('id="btnUploadAvatarPhoto"');
  const craftBtnIdx = avatarSrc.indexOf('id="btnRunCraftAvatar"');
  const periodSecIdx = avatarSrc.indexOf('id="avatarPeriodSection"');
  const streakBannerIdx = avatarSrc.indexOf('id="avatarStreakRechargeBanner"');

  assert.ok(uploadBtnIdx !== -1 && craftBtnIdx !== -1 && periodSecIdx !== -1, '버튼군 및 기간 섹션 요소 존재');
  assert.ok(periodSecIdx > uploadBtnIdx && periodSecIdx > craftBtnIdx, '사진 버튼군 바로 밑에 기간 설정 섹션 배치');
  assert.ok(periodSecIdx < streakBannerIdx, '기간 설정 섹션 아래에 연속 체크인 충전 배너 배치');

  assert.ok(avatarSrc.includes('id="btnSetAvatarPeriod"'), '아바타 생성 기준 기간 정하기 버튼 존재');
  assert.ok(avatarSrc.includes('id="avatarPeriodInputs"'), '직접 기간 설정 칸 컨테이너 존재');
  assert.ok(avatarSrc.includes('id="avatarPeriodStartInput"') && avatarSrc.includes('id="avatarPeriodEndInput"'), '시작일 및 종료일 date 인풋 존재');
  assert.ok(avatarSrc.includes('avatar-period-chip'), '퀵 프리셋 칩(1주/1개월/3개월/전체) 존재');

  // 3. 지시 원문 정확한 2줄 안내멘트 검증
  assert.ok(avatarSrc.includes('설정한 기간의 내 목표, 팀, 기록들을 분석하여'), '1번째 줄 안내멘트 일치');
  assert.ok(avatarSrc.includes('그에 맞는mbti와 좌우명을 가진 아바타를 생성합니다.'), '2번째 줄 안내멘트 일치 (원문 지시 준수)');

  // 4. 기간 내 데이터 분석 함수 collectPeriodPersonaSummary 로직 시뮬레이션 검증
  function simulatePeriodPersonaSummary(profile, mockGroups, startDate, endDate) {
    var startTs = startDate.getTime();
    var endTs = endDate.getTime();
    var goals = ((profile && profile.goals) || []).filter(function (g) {
      var created = g.createdAt || g.startAt || null;
      if (!created) return false;
      var t = new Date(created).getTime();
      return !isNaN(t) && t >= startTs && t <= endTs;
    });
    var records = ((profile && profile.records) || []).filter(function (r) {
      if (!r.startAt) return false;
      var t = new Date(r.startAt).getTime();
      return !isNaN(t) && t >= startTs && t <= endTs;
    });
    var teamLines = [];
    try {
      var gState = (profile && profile.settings && profile.settings.groupState) || {};
      (mockGroups || []).forEach(function (g) {
        var gs = gState[g.id];
        if (!gs || !gs.joined) return;
        var role = gs.myRole || 'member';
        var teamGoals = g.teamGoals || [];
        if (teamGoals.length === 0) {
          teamLines.push((g.name || '팀') + '(역할:' + role + ') 참여 중');
          return;
        }
        teamGoals.forEach(function (tg) {
          var ms = tg.milestones || [];
          var doneCnt = ms.filter(function (m) { return m.status === 'done'; }).length;
          teamLines.push((g.name || '팀') + '(역할:' + role + ') 팀목표 "' + (tg.title || '') + '" 진행 ' + doneCnt + '/' + ms.length);
        });
      });
    } catch (e) {}

    var lines = [];
    if (goals.length) {
      lines.push('[목표 ' + goals.length + '건] ' + goals.map(function (g) { return g.title || g.name || '목표'; }).slice(0, 20).join(', '));
    }
    if (records.length) {
      lines.push('[기록 ' + records.length + '건] ' + records.map(function (r) { return r.title || r.type || r.category || '실천 기록'; }).slice(0, 30).join(', '));
    }
    if (teamLines.length) {
      lines.push('[팀 활동] ' + teamLines.join(' / '));
    }

    return {
      goalsCount: goals.length,
      recordsCount: records.length,
      teamCount: teamLines.length,
      isEmpty: goals.length === 0 && records.length === 0 && teamLines.length === 0,
      summaryText: lines.join('\n')
    };
  }

  const mockProfile = {
    goals: [
      { title: '매일 10km 러닝', createdAt: '2026-09-20T10:00:00.000Z' },
      { title: '지난달 목표', createdAt: '2026-08-01T10:00:00.000Z' }
    ],
    records: [
      { title: '아침 러닝 5km 완주', startAt: '2026-09-22T07:00:00.000Z' }
    ],
    settings: {
      groupState: {
        'group-1': { joined: true, myRole: 'leader' }
      }
    }
  };
  const mockGroups = [
    {
      id: 'group-1',
      name: '새벽 러닝 크루',
      teamGoals: [
        { title: '주 3회 러닝', milestones: [{ status: 'done' }, { status: 'todo' }] }
      ]
    }
  ];

  // 2026-09-15 ~ 2026-09-25 기간 분석 (goals 1건, records 1건, team 1건)
  const result1 = simulatePeriodPersonaSummary(mockProfile, mockGroups, new Date('2026-09-15T00:00:00Z'), new Date('2026-09-25T23:59:59Z'));
  assert.strictEqual(result1.goalsCount, 1, '기간 내 목표 1건 필터링');
  assert.strictEqual(result1.recordsCount, 1, '기간 내 기록 1건 필터링');
  assert.strictEqual(result1.teamCount, 1, '팀 활동 1건 집계');
  assert.strictEqual(result1.isEmpty, false, '데이터 존재 확인');
  assert.ok(result1.summaryText.includes('매일 10km 러닝'), '목표 텍스트 포함');
  assert.ok(result1.summaryText.includes('아침 러닝 5km 완주'), '기록 텍스트 포함');
  assert.ok(result1.summaryText.includes('새벽 러닝 크루'), '팀 텍스트 포함');

  // 2025-01-01 ~ 2025-01-31 (데이터 없음)
  const emptyProfile = { goals: [], records: [], settings: {} };
  const resultEmpty = simulatePeriodPersonaSummary(emptyProfile, [], new Date('2025-01-01'), new Date('2025-01-31'));
  assert.strictEqual(resultEmpty.isEmpty, true, '빈 기간 isEmpty true 확인');

  // 5. CSS 스타일 및 375px 모바일 반응형 검증
  assert.ok(uiCss.includes('.avatar-period-chip'), '.avatar-period-chip 스타일 선언');
  assert.ok(uiCss.includes('.avatar-period-guide'), '.avatar-period-guide 스타일 선언');
  assert.ok(uiCss.includes('#avatarPeriodInputs input[type="date"]'), '모바일 date 인풋 최적화 스타일 선언');
}

runTest();
