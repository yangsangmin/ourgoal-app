/**
 * OurGoal Sanctuary Cell: 기록 탭 위클리 리캡 — 리캡 카드 그리기(renderSanctuaryRecordsRecap)와 리캡 이미지 저장·리캡 창 열기 (#TASK-ES-429 · 포커스 성소 엔진 세포 쪼개기)
 *
 * js/sanctuary-v3-engine.js(1964줄)에서 동작 그대로 옮겼다(이전 전 줄 번호):
 *   분기 본문 renderSanctuaryRecordsRecap(1109~1133)
 *   메서드 downloadRecapImage·openWeeklyRecapModal(1756~1872)
 * 바꾼 글자는 원본 스코프 이름 앞 T. 접두뿐이다. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalSanctuaryV3 로 부른다(메서드는 원본 객체의 같은 자리에서 펼치고, 함수는 원본이 같은 이름으로 가져온다). 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(window) {
  'use strict';
  // T = js/sanctuary-v3-engine.js 의 스코프 통로 — 원본 IIFE 에 남은 상태(engine)·함수를 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 성소 세포 키트의 weeklyRecap 칸 — 옮긴 함수·메서드 묶음을 담는다(전역 이름은 키트 OurgoalSanctuaryV3Kit 하나만 는다).
  // root = window 인자(키트 등록 전용 별칭 — 컴포넌트·팀·통계 부품의 root·global 과 같은 꼴, 옮긴 코드는 root 를 쓰지 않는다).
  var root = window;
  var KIT = root.OurgoalSanctuaryV3Kit = root.OurgoalSanctuaryV3Kit || {};
  var K = KIT.weeklyRecap = KIT.weeklyRecap || {};
  var T = K.scope = K.scope || {};

  // [#TASK-ES-462] 허상지표 제거 — 스트릭·레벨은 앱이 실제로 쓰는 값에서만 읽는다. 못 읽으면 null(숫자 대신 그 줄을 그리지 않는다).
  //   스트릭: index.html computeStreakDays(기록·스트릭 프리즈 날짜로 역산 — 홈 스트릭 배지와 같은 값, 통로 js/core/app-scope.js)
  //   레벨: levelProgress(settings.xp.total) — 로그인 사용자는 서버 원장(user_ledger_docs 'xp', #TASK-ES-421) 판, 게스트는 기기 판. 홈 아바타 카드와 같은 공식.
  function realStreakDays() {
    try {
      var sc = window.OurgoalAppScope && window.OurgoalAppScope.scope;
      if (sc && typeof sc.computeStreakDays === 'function') {
        var n = Number(sc.computeStreakDays());
        return (isFinite(n) && n > 0) ? n : null;
      }
    } catch (e) {}
    return null;
  }
  function realLevel() {
    try {
      var p = window.state && window.state.profile;
      var xp = p && p.settings && p.settings.xp;
      if (!xp || typeof window.levelProgress !== 'function') return null;
      var lv = Number(window.levelProgress(Number(xp.total) || 0).level);
      return (isFinite(lv) && lv >= 1) ? lv : null;
    } catch (e) {}
    return null;
  }
  K.realStreakDays = realStreakDays;
  K.realLevel = realLevel;

  // [#TASK-ES-429] renderSanctuaryRecords 의 「engine.activeRecMode === 'recap'」 분기 본문 — 이전 전 1109~1133줄 글자 그대로.
  //   렌더 함수 지역 변수(records·contentHtml)는 인자로 받는다, 바뀐 contentHtml 을 돌려준다.
  function renderSanctuaryRecordsRecap(records, contentHtml) {
      var streakVal = realStreakDays(); // [#TASK-ES-462] 없으면 null — 가짜 「3일」 대신 줄을 뺀다
      var levelVal = realLevel();
      var totalMinutes = 0;
      records.forEach(function(r) { totalMinutes += (r.durationMinutes || 25); });
      var totalHours = Math.round(totalMinutes / 60 * 10) / 10;

      contentHtml = '<div class="s-recap-share-card">' +
        '<div class="s-recap-head">' +
          '<span class="s-recap-badge">인스타그램 스토리 9:16 최적화</span>' +
          '<h4>위클리 퍼펙트 리캡</h4>' +
        '</div>' +
        '<div class="s-recap-canvas-mock" id="sRecapCanvasMock">' +
          '<div class="s-rc-top">OURGOAL WEEKLY RECAP</div>' +
          '<div class="s-rc-main">' +
            '<div class="s-rc-avatar">🦉' + (levelVal ? ' Lv.' + levelVal : '') + '</div>' +
            '<div class="s-rc-metric">누적 ' + totalHours + '시간 몰입 완주!</div>' +
            (streakVal ? '<div class="s-rc-streak">' + streakVal + '일 연속 스트릭 달성 🔥</div>' : '') +
          '</div>' +
          '<div class="s-rc-foot">우리들의 목표 성소 · ourgoal.kr</div>' +
        '</div>' +
        '<div class="s-recap-actions" style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button class="btn btn-primary btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.downloadRecapImage();">💾 이미지 다운로드 (PNG)</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" onclick="window.OurgoalSanctuaryV3.openWeeklyRecapModal();">🔍 리캡 커스텀 모달</button>' +
          '<button class="btn btn-ghost btn-sm" type="button" onclick="if(window.OurgoalViralSharing) window.OurgoalViralSharing.shareStreakKakao(); else toast(\'카카오톡 공유 링크를 생성했습니다!\');">💬 카카오톡 공유</button>' +
        '</div>' +
      '</div>';
    return contentHtml;
  }

  // [#TASK-ES-429] window.OurgoalSanctuaryV3 메서드 downloadRecapImage·openWeeklyRecapModal — 이전 전 1756~1872줄 글자 그대로. 원본 객체 리터럴의 같은 자리에서 펼친다(...).
  K.methodsFrom_downloadRecapImage = {
    downloadRecapImage: async function() {
      try {
        var allRecs = (window.state && window.state.profile && window.state.profile.records) || [];
        var streakVal = realStreakDays(); // [#TASK-ES-462] 실제 스트릭(없으면 null)
        var levelVal = realLevel();
        var totalMs = 0;
        allRecs.forEach(function(r) { totalMs += ((r.durationMinutes || 25) * 60000); });

        var canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        var ctx = canvas.getContext('2d');

        // 배경 그라디언트 (포커스 성소 다크 슬레이트 & 에메랄드 네온 아우라)
        var grad = ctx.createLinearGradient(0, 0, 0, 1920);
        grad.addColorStop(0, '#090d16');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);

        // 상단 네온 글로우 원
        var auraGrad = ctx.createRadialGradient(540, 400, 50, 540, 400, 500);
        auraGrad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
        auraGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = auraGrad;
        ctx.fillRect(0, 0, 1080, 1000);

        // 카드 박스
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(80, 160, 920, 1560, 40);
        } else {
          ctx.rect(80, 160, 920, 1560);
        }
        ctx.fill();
        ctx.stroke();

        // 텍스트 렌더링
        ctx.textAlign = 'center';
        ctx.fillStyle = '#10b981';
        ctx.font = '700 36px sans-serif';
        ctx.fillText('OURGOAL WEEKLY RECAP', 540, 280);

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 68px sans-serif';
        ctx.fillText('위클리 퍼펙트 리캡', 540, 380);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '500 32px sans-serif';
        ctx.fillText('나의 몰입과 성장의 성소 궤적', 540, 440);

        // 아바타
        ctx.font = '100px sans-serif';
        ctx.fillText('🦉', 540, 620);
        ctx.fillStyle = '#10b981';
        ctx.font = '700 34px sans-serif';
        var nick = (window.state && window.state.profile && (window.state.profile.nickname || window.state.profile.displayName)) || '목표 달성자';
        ctx.fillText(nick + (levelVal ? ' · Lv.' + levelVal : '') + ' 성소 탐험가', 540, 680);

        // 메트릭 1: 누적 몰입 시간
        var hoursStr = (Math.round(totalMs / 3600000 * 10) / 10) + '시간';
        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 84px sans-serif';
        ctx.fillText(hoursStr, 540, 890);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '600 34px sans-serif';
        ctx.fillText('총 누적 몰입 시간', 540, 950);

        // 메트릭 2: 연속 스트릭
        ctx.fillStyle = '#f59e0b';
        ctx.font = '900 84px sans-serif';
        ctx.fillText(streakVal ? streakVal + '일 연속' : '오늘부터 시작', 540, 1140);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '600 34px sans-serif';
        ctx.fillText('포커스 스트릭 달성 🔥', 540, 1200);

        // 메트릭 3: 누적 실천 횟수
        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 84px sans-serif';
        ctx.fillText(allRecs.length + '회 실천', 540, 1390);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '600 34px sans-serif';
        ctx.fillText('체크인 & 회고 완료', 540, 1450);

        // 하단 워터마크
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '500 28px sans-serif';
        ctx.fillText('우리들의 목표 성소 · ourgoal.kr · ' + T.getTodayStr(), 540, 1640);

        var dataUrl = canvas.toDataURL('image/png');
        var link = document.createElement('a');
        link.download = 'ourgoal-weekly-recap-' + T.getTodayStr() + '.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast('📸 위클리 리캡 카드가 이미지(PNG)로 다운로드되었습니다!');
      } catch (err) {
        console.error('downloadRecapImage error:', err);
        if (typeof window.openWeeklyRecapModal === 'function') {
          window.openWeeklyRecapModal();
        } else {
          toast('위클리 리캡 모달을 엽니다.');
        }
      }
    },
    openWeeklyRecapModal: function() {
      if (typeof window.openWeeklyRecapModal === 'function') {
        window.openWeeklyRecapModal();
      } else {
        toast('위클리 리캡 모달을 로드 중입니다.');
      }
    },
  };

  K.renderSanctuaryRecordsRecap = renderSanctuaryRecordsRecap;
})(window);
