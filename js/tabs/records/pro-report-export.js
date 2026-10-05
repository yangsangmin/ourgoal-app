/**
 * OurGoal Pro Report & Export (기록 탭 — 노션 푸시·AI 코칭 리포트·노션 표 내보내기)
 *
 * #TASK-ES-438 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G141·G142·G143.
 *   옮긴 선언(이전 전 줄): pushRecordToNotion(27858~27931) · openProCoachReportModal(27932~28093) · openProNotionExportModal(28094~28215)
 * pushRecordToNotion = 기록을 노션 데이터베이스로 바로 보내기, openProCoachReportModal = AI 프로 코칭 리포트·처방 창, openProNotionExportModal = 노션 표 내보내기·클립보드 복사 창.
 * 최상위 선언을 앞 주석·구획 주석과 함께 글자 그대로 옮겼다. 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>, 같은 키트의 다른 세포 이름은 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 로드 중 바로 도는 문(window.X 노출·전역 이벤트 위임)과 시험지가 index.html 에서 글자로 읽는 함수는 index.html 제자리에 남겼다.
 * index.html 은 IIFE 맨 위에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져와 쓴다 — 부르는 쪽은 그대로다.
 * 지도: docs/architecture/INLINE-SCRIPT-MAP.md(scripts/inline-script-map.js). 선례: 인라인 세포화 1차 #TASK-ES-423 · 소통 탭 #TASK-ES-379. 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수(state·toast·openModal …)를 getter 로 읽는 통로(모든 탭 공용). 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 같은 탭 파일끼리 서로 부르는 함수 묶음(이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다)
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ============ 🔄 Notion 데이터베이스 실시간 자동 푸시 (Notion Direct Push) ============ */
  async function pushRecordToNotion(record, curTpl, columns, rows){
    var s = L.state.profile && L.state.profile.settings;
    var apiKey = (s && s.notionApiKey) || '';
    var dbId = (s && s.notionDatabaseId) || '';
    var webhookUrl = (s && s.notionWebhookUrl) || '';

    if(!apiKey && !webhookUrl){
      return { ok: false, error: 'Notion API 토큰 또는 Webhook URL을 설정에서 먼저 등록해주세요.' };
    }

    var validRows = (rows || []).filter(function(r){
      return r && r.some(function(c, idx){ return idx > 0 && c && String(c).trim().length > 0; });
    });
    if(!validRows.length) validRows = (rows || []).slice(0, 1);

    var title = (curTpl && curTpl.title ? curTpl.title : '기록') + ' - ' + (record.startAt ? record.startAt.slice(0,10) : L.nowISO().slice(0,10));
    var results = [];

    // 1. Direct Notion Database API Push
    if(apiKey && dbId){
      try {
        var res = await fetch('/api/notion-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'notion_push',
            apiKey: apiKey,
            databaseId: dbId,
            title: title,
            date: record.startAt || L.nowISO(),
            columns: columns || [],
            rows: validRows,
            memo: record.memo || ''
          })
        });
        var data = await res.json();
        if(res.ok && data.ok){
          results.push('Notion DB 페이지 생성 완료');
        } else {
          results.push('Notion DB 실패: ' + (data.error || res.statusText));
        }
      } catch(e){
        results.push('Notion DB 오류: ' + e.message);
      }
    }

    // 2. Notion Webhook automation
    if(webhookUrl && s && s.notionSync){
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          mode: 'no-cors',
          body: JSON.stringify({
            source: '아워골',
            title: title,
            date: record.startAt || L.nowISO(),
            columns: columns,
            rows: validRows,
            memo: record.memo || ''
          })
        });
        results.push('웹훅 전송 완료');
      } catch(e){}
    }

    var isOk = results.some(function(r){ return r.indexOf('완료') !== -1; });
    return {
      ok: isOk,
      summary: results.join(' · ')
    };
  }

  /* ============ AI 프로 코칭 리포트 & 처방 모달 (혁신 3) ============ */
  function openProCoachReportModal(curTpl, columns, rows, memoVal){
    var a = L.computeTableAnalytics(curTpl, columns, rows);
    var tplTitle = curTpl.title || '맞춤 기록';
    var theme = curTpl.theme || 'daily';

    var coachingHtml = '';
    var followUpDays = 1;
    var followUpTitle = '';

    if(theme === 'workout' || tplTitle.indexOf('헬스') !== -1 || curTpl.key === 'hyrox_workout'){
      var volStat = a.stats.find(function(s){ return s.label === '총 볼륨'; });
      var setsStat = a.stats.find(function(s){ return s.label === '총 세트'; });
      var volText = volStat ? volStat.value : '기록 완료';
      var setsText = setsStat ? setsStat.value : '';

      followUpDays = 2;
      followUpTitle = tplTitle + ' 다음 세션 (점진적 과부하 도전)';
      coachingHtml =
        '<div style="background:var(--card2);padding:12px;border-radius:12px;border:1px solid var(--rule);margin-bottom:12px;">' +
          '<div style="font-weight:700;color:var(--ink);font-size:.875rem;margin-bottom:4px;">점진적 과부하(Progressive Overload) 분석</div>' +
          '<p style="font-size:.8125rem;line-height:1.5;margin:0;color:var(--ink-soft);">' +
            '오늘 기록된 볼륨은 <b>' + volText + '</b> (' + setsText + ') 입니다. ' +
            '근비대 및 근력 향상을 위해서는 동일 부위 운동에 대해 48시간의 충분한 초과회복(Supercompensation) 주기를 두는 것이 이상적입니다.' +
          '</p>' +
        '</div>' +
        '<div style="background:var(--card2);padding:12px;border-radius:12px;border:1px solid var(--rule);margin-bottom:12px;">' +
          '<div style="font-weight:700;color:var(--sage);font-size:.875rem;margin-bottom:4px;">다음 세션 추천 처방</div>' +
          '<ul style="margin:0;padding-left:18px;font-size:.8125rem;color:var(--ink-soft);line-height:1.55;">' +
            '<li>첫 번째 메인 종목의 첫 세트 중량을 <b>+2.5kg</b> 증량 시도하거나 마지막 세트에서 <b>+1~2회</b> 반복을 더 수행하세요.</li>' +
            '<li>운동 직후 45분 이내 단백질 25~30g 및 탄수화물 보충으로 글리코겐 회복을 권장합니다.</li>' +
            '<li>충분한 수면(7~8시간)으로 근신경계 피로를 완전 회복하세요.</li>' +
          '</ul>' +
        '</div>';
    } else if(theme === 'study' || tplTitle.indexOf('공부') !== -1){
      var timeStat = a.stats.find(function(s){ return s.label === '총 학습시간'; });
      var timeText = timeStat ? timeStat.value : '기록 완료';

      followUpDays = 1;
      followUpTitle = tplTitle + ' 1차 에빙하우스 망각곡선 복습';
      coachingHtml =
        '<div style="background:var(--card2);padding:12px;border-radius:12px;border:1px solid var(--rule);margin-bottom:12px;">' +
          '<div style="font-weight:700;color:var(--ink);font-size:.875rem;margin-bottom:4px;">에빙하우스 망각곡선 최적 복습 타이밍</div>' +
          '<p style="font-size:.8125rem;line-height:1.5;margin:0;color:var(--ink-soft);">' +
            '오늘 <b>' + timeText + '</b> 동안 학습한 내용은 24시간 이내에 70%가 망각됩니다. ' +
            '가장 효과적인 장기 기억(LTM) 전환을 위해 <b>1일 후, 3일 후, 7일 후</b> 3단계 분산 복습을 강력 권장합니다.' +
          '</p>' +
        '</div>' +
        '<div style="background:var(--card2);padding:12px;border-radius:12px;border:1px solid var(--rule);margin-bottom:12px;">' +
          '<div style="font-weight:700;color:var(--chip);font-size:.875rem;margin-bottom:4px;">3단계 스마트 복습 플랜</div>' +
          '<ul style="margin:0;padding-left:18px;font-size:.8125rem;color:var(--ink-soft);line-height:1.55;">' +
            '<li><b>1차 복습 (내일, 10분)</b>: 핵심 키워드 및 목차 위주로 회상 테스트</li>' +
            '<li><b>2차 복습 (3일 후, 15분)</b>: 틀렸던 문제 및 오답 노트 재풀이</li>' +
            '<li><b>3차 복습 (7일 후, 20분)</b>: 전체 요약본 셀프 강의 형식으로 인출</li>' +
          '</ul>' +
        '</div>';
    } else if(theme === 'business' || tplTitle.indexOf('영업') !== -1){
      var pipeStat = a.stats.find(function(s){ return s.label === '총 파이프라인'; });
      var expStat = a.stats.find(function(s){ return s.label === '가중 예상매출'; });
      var pipeText = pipeStat ? pipeStat.value : '';
      var expText = expStat ? expStat.value : '';

      followUpDays = 3;
      followUpTitle = tplTitle + ' 다음 고객 액션 및 팔로업';
      coachingHtml =
        '<div style="background:var(--card2);padding:12px;border-radius:12px;border:1px solid var(--rule);margin-bottom:12px;">' +
          '<div style="font-weight:700;color:var(--ink);font-size:.875rem;margin-bottom:4px;">B2B 세일즈 파이프라인 분석</div>' +
          '<p style="font-size:.8125rem;line-height:1.5;margin:0;color:var(--ink-soft);">' +
            '현재 파이프라인 규모 <b>' + (pipeText||'협의 중') + '</b> (가중 예상: ' + (expText||'산출 중') + ') 입니다. ' +
            '미팅 후 48시간 이내 미팅 요약록(MOM)과 맞춤 제안서를 발송할 때 계약 성사율이 35% 이상 상승합니다.' +
          '</p>' +
        '</div>' +
        '<div style="background:var(--card2);padding:12px;border-radius:12px;border:1px solid var(--rule);margin-bottom:12px;">' +
          '<div style="font-weight:700;color:var(--brand-strong);font-size:.875rem;margin-bottom:4px;">클로징 확률 극대화 처방</div>' +
          '<ul style="margin:0;padding-left:18px;font-size:.8125rem;color:var(--ink-soft);line-height:1.55;">' +
            '<li>의사결정권자(C-level/팀장)의 실질적인 Pain Point를 해결하는 ROI 지표를 제안서 1페이지에 배치하세요.</li>' +
            '<li>다음 주 미팅 일정을 캘린더에 사전 픽스하여 딜 속도(Deal Velocity)를 유지하세요.</li>' +
          '</ul>' +
        '</div>';
    } else {
      followUpDays = 1;
      followUpTitle = tplTitle + ' 후속 실천';
      coachingHtml =
        '<div style="background:var(--card2);padding:12px;border-radius:12px;border:1px solid var(--rule);margin-bottom:12px;">' +
          '<div style="font-weight:700;color:var(--ink);font-size:.875rem;margin-bottom:4px;">꾸준함(Streak) 코칭 리포트</div>' +
          '<p style="font-size:.8125rem;line-height:1.5;margin:0;color:var(--ink-soft);">' +
            '작은 기록의 누적이 위대한 결과를 만듭니다. 매일 동일한 시간대에 규칙적으로 기록하면 습관 형성 확률이 3배 이상 높아집니다.' +
          '</p>' +
        '</div>';
    }

    var targetDateObj = new Date();
    targetDateObj.setDate(targetDateObj.getDate() + followUpDays);
    var targetDateISO = L.isoDate(targetDateObj);

    L.openModal(
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">' +
        '<h3 style="margin:0;">AI 프로 코칭 리포트</h3>' +
        '<span class="pro-tpl-badge">' + curTpl.icon + ' ' + L.escapeHtml(tplTitle) + '</span>' +
      '</div>' +
      coachingHtml +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">' +
        '<button class="btn btn-primary btn-sm" id="coachApplySchedBtn" type="button" style="width:100%;padding:9px 0;font-size:.875rem;">' +
          '' + targetDateISO + ' (' + followUpDays + '일 후) 추천 일정 등록하기' +
        '</button>' +
        '<button class="btn btn-ghost btn-sm" id="coachApplyMemoBtn" type="button" style="width:100%;font-size:.8125rem;">' +
          '오늘 메모에 AI 조언 덧붙이기' +
        '</button>' +
        '<button class="btn btn-ghost btn-sm" id="coachCloseBtn" type="button" style="width:100%;">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#coachCloseBtn').onclick = L.closeModal;
        sheet.querySelector('#coachApplyMemoBtn').onclick = function(){
          var memoInp = document.getElementById('proRecMemo');
          if(memoInp){
            var advice = '[' + tplTitle + ' AI 코칭 피드백] ' + (theme==='workout' ? '점진적 과부하 +2.5kg 도전 / 48시간 휴식' : (theme==='study' ? '망각곡선 분산 복습(1·3·7일) 실천' : '고객 팔로업 및 클로징 추진'));
            memoInp.value = (memoInp.value ? memoInp.value + ' | ' : '') + advice;
            L.toast('오늘 메모에 AI 코칭 처방을 추가했어요');
          }
          L.closeModal();
        };
        sheet.querySelector('#coachApplySchedBtn').onclick = async function(){
          L.state.profile.settings = L.state.profile.settings || {};
          L.state.profile.settings.customSchedules = L.state.profile.settings.customSchedules || [];

          if(theme === 'study'){
            var offsets = [1, 3, 7];
            offsets.forEach(function(off, i){
              var d = new Date();
              d.setDate(d.getDate() + off);
              var dStr = L.isoDate(d) + 'T19:00';
              L.state.profile.settings.customSchedules.push({
                id: L.uid('sched'),
                title: '[' + (i+1) + '차 복습] ' + tplTitle,
                date: dStr,
                note: '에빙하우스 망각곡선 분산 복습 (' + off + '일차)',
                done: false,
                createdAt: L.nowISO()
              });
            });
            L.toast('망각곡선 복습 일정(1·3·7일) 3건을 캘린더에 일괄 등록했어요!');
          } else {
            L.state.profile.settings.customSchedules.push({
              id: L.uid('sched'),
              title: followUpTitle,
              date: targetDateISO + 'T09:00',
              note: 'AI 프로 코칭 추천 후속 세션',
              done: false,
              createdAt: L.nowISO()
            });
            L.toast('' + targetDateISO + ' 일정을 캘린더에 등록했어요!');
          }

          L.saveLocalSettings(L.state.profile.id, L.state.profile.settings);
          await L.saveProfile();
          L.renderCalendarScreen();
          L.closeModal();
        };
      }
    );
  }

  /* ============ Notion 실제 표 내보내기 & 클립보드 복사 모달 (혁신 4) ============ */
  function openProNotionExportModal(curTpl, columns, rows){
    var validRows = rows.filter(function(r){
      return r && r.some(function(cell, idx){ return idx > 0 && cell && String(cell).trim().length > 0; });
    });
    if(!validRows.length) validRows = rows.slice(0, 1);

    var mdHeader = '| ' + columns.join(' | ') + ' |';
    var mdDivider = '| ' + columns.map(function(){ return '---'; }).join(' | ') + ' |';
    var mdRows = validRows.map(function(r){
      return '| ' + columns.map(function(c, i){ return (r[i] !== undefined ? String(r[i]).trim() : ''); }).join(' | ') + ' |';
    }).join('\r\n');
    var mdTable = mdHeader + '\r\n' + mdDivider + '\r\n' + mdRows;

    var tsvHeader = columns.join('\t');
    var tsvRows = validRows.map(function(r){
      return columns.map(function(c, i){ return (r[i] !== undefined ? String(r[i]).trim() : ''); }).join('\t');
    }).join('\r\n');
    var tsvTable = tsvHeader + '\r\n' + tsvRows;

    L.openModal(
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">' +
        '<h3 style="margin:0;">Notion 표 내보내기 & 연동</h3>' +
        '<span class="pro-tpl-badge">' + curTpl.icon + ' ' + L.escapeHtml(curTpl.title) + '</span>' +
      '</div>' +
      '<p class="faint" style="font-size:.8125rem;margin:0 0 10px;line-height:1.45;">' +
        '클립보드에 복사 후 노션(Notion) 빈 페이지에서 <b>Ctrl+V</b>로 붙여넣으면 노션 데이터베이스/표로 자동 변환됩니다.' +
      '</p>' +
      '<div style="background:var(--card2);padding:10px;border-radius:10px;border:1px solid var(--rule);margin-bottom:12px;max-height:160px;overflow:auto;font-family:monospace;font-size:.8125rem;white-space:pre-wrap;">' +
        L.escapeHtml(mdTable) +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
        '<button class="btn btn-primary btn-sm" id="notionDirectPushBtn" type="button" style="width:100%;padding:9px 0;font-size:.875rem;background:var(--violet);border-color:var(--ink);">' +
          'Notion DB로 즉시 전송' +
        '</button>' +
        '<div id="notionPushStatusWrap" style="display:none;font-size:.8125rem;text-align:center;padding:4px 8px;border-radius:6px;"></div>' +
        '<button class="btn btn-ghost btn-sm" id="notionCopyTsvBtn" type="button" style="width:100%;padding:9px 0;font-size:.875rem;">' +
          '노션 표 형식 클립보드 복사 (Ctrl+V용)' +
        '</button>' +
        '<button class="btn btn-ghost btn-sm" id="notionCopyMdBtn" type="button" style="width:100%;font-size:.8125rem;">' +
          '마크다운 표(Markdown Table) 복사' +
        '</button>' +
        '<a href="https://www.notion.so" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" style="width:100%;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:4px;font-size:.8125rem;padding:7px 0;box-sizing:border-box;">' +
          'Notion 바로 열기 ↗' +
        '</a>' +
        '<button class="btn btn-ghost btn-sm" id="notionCloseBtn" type="button" style="width:100%;">닫기</button>' +
      '</div>',
      function(sheet){
        sheet.querySelector('#notionCloseBtn').onclick = L.closeModal;
        var pushBtn = sheet.querySelector('#notionDirectPushBtn');
        var statusWrap = sheet.querySelector('#notionPushStatusWrap');
        if(pushBtn){
          pushBtn.onclick = async function(){
            var s = L.state.profile && L.state.profile.settings;
            if((!s || !s.notionApiKey) && (!s || !s.notionWebhookUrl)){
              L.toast('설정(⚙️) 탭에서 Notion API Key 또는 Webhook URL을 먼저 등록해주세요.');
              return;
            }
            pushBtn.disabled = true;
            pushBtn.textContent = 'Notion으로 전송 중...';
            if(statusWrap){
              statusWrap.style.display = 'block';
              statusWrap.className = 'notion-push-status-pill pending';
              statusWrap.textContent = 'Notion API와 통신 중입니다...';
            }
            try {
              var rec = {
                startAt: L.nowISO(),
                memo: ''
              };
              var result = await pushRecordToNotion(rec, curTpl, columns, validRows);
              if(result.ok){
                L.toast('Notion에 성공적으로 전송되었습니다!');
                if(statusWrap){
                  statusWrap.className = 'notion-push-status-pill success';
                  statusWrap.textContent = '' + (result.summary || '전송 완료');
                }
              } else {
                L.toast('Notion 전송 실패: ' + (result.error || result.summary || '설정을 확인하세요'));
                if(statusWrap){
                  statusWrap.className = 'notion-push-status-pill error';
                  statusWrap.textContent = '' + (result.error || result.summary || '전송 실패');
                }
              }
            } catch(err){
              L.toast('Notion 전송 오류: ' + err.message);
              if(statusWrap){
                statusWrap.className = 'notion-push-status-pill error';
                statusWrap.textContent = '' + err.message;
              }
            } finally {
              pushBtn.disabled = false;
              pushBtn.textContent = 'Notion DB로 즉시 전송';
            }
          };
        }
        sheet.querySelector('#notionCopyTsvBtn').onclick = function(){
          if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(tsvTable).then(function(){
              L.toast('노션 표 데이터가 복사되었습니다! 노션에서 Ctrl+V 하세요');
            }).catch(function(){
              L.toast('클립보드 복사에 실패했습니다');
            });
          } else {
            L.toast('클립보드 API가 지원되지 않습니다');
          }
        };
        sheet.querySelector('#notionCopyMdBtn').onclick = function(){
          if(navigator.clipboard && navigator.clipboard.writeText){
            navigator.clipboard.writeText(mdTable).then(function(){
              L.toast('마크다운 표가 복사되었습니다!');
            }).catch(function(){
              L.toast('클립보드 복사에 실패했습니다');
            });
          } else {
            L.toast('클립보드 API가 지원되지 않습니다');
          }
        };
      }
    );
  }

  K.pushRecordToNotion = pushRecordToNotion;
  K.openProCoachReportModal = openProCoachReportModal;
  K.openProNotionExportModal = openProNotionExportModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
