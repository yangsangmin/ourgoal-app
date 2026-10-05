/**
 * OurGoal Table CSV Sync (기록 탭 — 전문 템플릿 표 CSV 내보내기·가져오기·웨어러블 데이터 창·맞는 목표 진척 연동)
 *
 * 「CSV / 엑셀 양방향 연동 & 스마트워치 매핑 & 목표 3각 추적」 묶음 중 표 데이터 주고받기 책임: CSV 다운로드(downloadTableAsCsv)·CSV 글자 읽기(parseCsvText — smoke-test FN_NAMES, 인라인 합본에서 찾는다)·CSV 가져오기 창(openCsvImportModal)·스마트워치 데이터 창(openWearableSyncModal)·저장한 표 기록을 맞는 목표 진척에 반영(syncRecordToMatchingGoals).
 * 같은 묶음의 사진 표 채우기(compressImageForVision·AI 사진 분석 하루 한도·openVisionTableModal)와 마켓 템플릿 자료(CURATED_MARKET_TEMPLATES)는 index.html 원래 자리에 남겼다(#TASK-ES-526 REQ 4절).
 * #TASK-ES-526(인라인 3단계 Z4 이동 3차(표 CSV·웨어러블·목표 연동 · 음성 표 입력 · 테마별 기록 CSV · 함께 목표 초대 글자)): index.html 인라인 IIFE 의 구간(이전 전 10451~10480 · 10481~10511 · 10512~10559 · 10560~10612 · 10613~10658줄)을 생성기(docs/design/harness/module-split/gen-inline-hard.js)로 글자 그대로 옮겼다.
 * 바꾼 것은 이름 참조뿐이다 — 인라인 스코프 이름은 L.<이름>(js/core/app-scope.js 통로, 대입하는 이름은 setter). 로드 중 바로 돌던 문은 함수로 감싸 index.html 원래 자리에서 부른다.
 * index.html 은 IIFE 머리에서 이 키트의 이름 중 인라인에서 쓰는 것을 같은 이름으로 가져온다. window 노출 줄·상태 변수 선언은 원래 자리에 그대로 있다.
 * 설계: docs/architecture/INLINE-HARD-SPLIT-DESIGN.md · 규칙: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // L = js/core/app-scope.js — 아직 index.html 인라인 스코프에 있는 공용 상태·함수를 getter(대입하는 이름은 setter)로 읽는 통로. 값은 읽을 때마다 살아 있는 값이다.
  var L = (global.OurgoalAppScope && global.OurgoalAppScope.scope) || {};
  // 탭 키트: 이미 있는 키트를 같이 쓴다 — 전역 이름을 새로 늘리지 않는다
  var K = global.OurgoalRecordsKit = global.OurgoalRecordsKit || {};

  /* ---- 이전 전 index.html 10451~10480줄(#TASK-ES-526 생성기 표지) ---- */
  /* 📤 CSV 다운로드 (Excel 호환 UTF-8 BOM) */
  function downloadTableAsCsv(curTpl, columns, rows){
    if(!columns || !columns.length) return;
    function escCsv(val){
      var s = (val === null || val === undefined) ? '' : String(val);
      if(/[",\r\r\n]/.test(s)){
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }
    var lines = [];
    lines.push(columns.map(escCsv).join(','));
    (rows || []).forEach(function(r){
      lines.push(columns.map(function(_, i){ return escCsv(r[i] || ''); }).join(','));
    });
    var csvText = '\uFEFF' + lines.join('\r\r\n');
    var blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var ymd = L.fmtYYMMDD(new Date());
    a.href = url;
    a.download = ymd + '_' + (curTpl.title || '기록') + '_표기록.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
    L.toast('엑셀 호환 CSV 파일이 다운로드되었습니다!');
  }
  /* ---- 이전 전 index.html 10481~10511줄(#TASK-ES-526 생성기 표지) ---- */

  function parseCsvText(text){
    var lines = text.split(/\r?\n/).filter(function(l){ return l.trim().length > 0; });
    if(!lines.length) return [];
    var isTab = lines[0].indexOf('\t') !== -1;
    var rows = [];
    lines.forEach(function(line){
      var cells = [];
      if(isTab){
        cells = line.split('\t').map(function(c){ return c.trim(); });
      } else {
        var cur = '';
        var inQuotes = false;
        for(var i=0; i<line.length; i++){
          var ch = line[i];
          if(ch === '"'){
            if(inQuotes && line[i+1] === '"'){ cur += '"'; i++; }
            else { inQuotes = !inQuotes; }
          } else if(ch === ',' && !inQuotes){
            cells.push(cur.trim());
            cur = '';
          } else {
            cur += ch;
          }
        }
        cells.push(cur.trim());
      }
      if(cells.length) rows.push(cells);
    });
    return rows;
  }
  /* ---- 이전 전 index.html 10512~10559줄(#TASK-ES-526 생성기 표지) ---- */

  /* 📥 CSV 가져오기 모달 */
  function openCsvImportModal(curTpl, columns, onImport){
    var html = '<h3>CSV / 엑셀 데이터 가져오기</h3>' +
      '<div style="padding:10px 14px;background:var(--surface-2);border-radius:12px;margin-bottom:12px;font-size:.8125rem;color:var(--ink);line-height:1.45;">' +
        '<b>엑셀, 노션, 스프레드시트의 표 데이터를 맞춤 템플릿으로 가져옵니다.</b><br>' +
        '<span style="font-size:.8125rem;color:var(--ink-soft);">CSV 파일을 선택하거나 아래 텍스트 상자에 엑셀 셀 복사 내용을 그대로 붙여넣으세요.</span>' +
      '</div>' +
      '<div class="field" style="margin-bottom:10px;">' +
        '<label>CSV 파일 선택</label>' +
        '<input type="file" id="csvFileInput" accept=".csv,text/csv,text/plain" style="font-size:.875rem;">' +
      '</div>' +
      '<div class="field" style="margin-bottom:12px;">' +
        '<label>또는 텍스트 직접 붙여넣기 (쉼표 또는 탭 구분)</label>' +
        '<textarea id="csvTextInput" rows="5" placeholder="운동종목,세트,횟수,무게\r\n벤치프레스,4,10,60kg\r\n스쿼트,5,5,100kg" style="width:100%;box-sizing:border-box;font-family:monospace;font-size:.8125rem;"></textarea>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="csvCancelBtn" type="button">취소</button>' +
        '<button class="btn btn-primary" id="csvApplyBtn" type="button">데이터 표에 반영하기</button>' +
      '</div>';

    L.openModal(html, function(sheet){
      sheet.querySelector('#csvCancelBtn').onclick = L.closeModal;
      var fileInp = sheet.querySelector('#csvFileInput');
      var txtInp = sheet.querySelector('#csvTextInput');

      if(fileInp){
        fileInp.onchange = function(e){
          var f = e.target.files && e.target.files[0];
          if(!f) return;
          var reader = new FileReader();
          reader.onload = function(evt){
            if(txtInp) txtInp.value = evt.target.result || '';
          };
          reader.readAsText(f, 'utf-8');
        };
      }

      sheet.querySelector('#csvApplyBtn').onclick = function(){
        var raw = (txtInp.value || '').trim();
        if(!raw){ L.toast('가져올 CSV 데이터가 없습니다'); return; }
        var parsed = parseCsvText(raw);
        if(!parsed.length){ L.toast('유효한 행 데이터를 파싱하지 못했습니다'); return; }
        L.closeModal();
        if(typeof onImport === 'function') onImport(parsed);
      };
    });
  }
  /* ---- 이전 전 index.html 10560~10612줄(#TASK-ES-526 생성기 표지) ---- */

  /* ⌚ 스마트워치 (Apple Health / Strava / Galaxy Watch) 데이터 연동 모달 */
  function openWearableSyncModal(curTpl, columns, onApply){
    var sampleActivities = [
      { id: 'act_1', source: 'Apple Health', type: '고강도 인터벌 & 러닝', duration: '48분', bpm: '162bpm', maxBpm: '184bpm', calories: '485 kcal', dist: '5.2 km', pace: '4:48/km' },
      { id: 'act_2', source: 'Strava', type: '인터벌 트레이닝 & 근력 세션', duration: '55분', bpm: '155bpm', maxBpm: '178bpm', calories: '530 kcal', dist: '3.8 km', pace: '5:12/km' },
      { id: 'act_3', source: 'Galaxy Watch', type: '크로스핏 / 기능성 트레이닝', duration: '42분', bpm: '168bpm', maxBpm: '188bpm', calories: '450 kcal', dist: '-', pace: '-' }
    ];

    var actsHtml = sampleActivities.map(function(act, idx){
      return '<div class="wearable-act-card" data-actidx="'+idx+'" style="padding:10px 12px;background:var(--card);border:1px solid var(--rule);border-radius:10px;margin-bottom:8px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:border-color .15s;">' +
        '<div>' +
          '<div style="font-weight:700;font-size:.875rem;display:flex;align-items:center;gap:6px;">' +
            '<span>'+L.escapeHtml(act.source)+'</span>' +
            '<span class="badge" style="font-size:.6875rem;">'+L.escapeHtml(act.type)+'</span>' +
          '</div>' +
          '<div style="font-size:.8125rem;color:var(--ink-soft);margin-top:3px;">' +
            ''+act.duration+' | ❤️ 평균 '+act.bpm+' (최고 '+act.maxBpm+') | 🔥 '+act.calories + (act.dist !== '-' ? ' | 📍 '+act.dist : '') +
          '</div>' +
        '</div>' +
        '<button class="btn btn-ghost btn-sm btn-select-wearable" data-actidx="'+idx+'" style="font-size:.8125rem;color:var(--ink);cursor:pointer;" type="button" aria-label="이 운동 세션 선택">선택</button>' +
      '</div>';
    }).join('');

    var html = '<h3>스마트워치 운동 데이터 자동 매핑</h3>' +
      '<div style="padding:10px 14px;background:var(--surface-2);border-radius:12px;margin-bottom:12px;font-size:.8125rem;color:var(--ink);line-height:1.45;">' +
        '<b>스마트워치에 기록된 심박수, 칼로리, 시간, 거리를 표 속성에 자동 매핑합니다.</b><br>' +
        '<span style="font-size:.8125rem;color:var(--ink-soft);">연동할 세션을 선택하면 표의 심박수·시간·거리·강도 열에 1초 만에 자동 채워집니다.</span>' +
      '</div>' +
      '<div style="margin-bottom:14px;">' +
        actsHtml +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-bottom:12px;">' +
        '<a href="https://www.strava.com" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" style="flex:1;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:4px;font-size:.8125rem;padding:6px 8px;">Strava 바로 열기 ↗</a>' +
        '<a href="https://fit.google.com" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" style="flex:1;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:4px;font-size:.8125rem;padding:6px 8px;">Google Fit 바로 열기 ↗</a>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn btn-ghost" id="wearableCancelBtn" type="button">닫기</button>' +
      '</div>';

    L.openModal(html, function(sheet){
      sheet.querySelector('#wearableCancelBtn').onclick = L.closeModal;
      sheet.querySelectorAll('.wearable-act-card, .btn-select-wearable').forEach(function(el){
        el.onclick = function(e){
          e.stopPropagation();
          var idx = parseInt(el.dataset.actidx, 10);
          var act = sampleActivities[idx];
          L.closeModal();
          if(typeof onApply === 'function') onApply(act);
        };
      });
    });
  }
  /* ---- 이전 전 index.html 10613~10658줄(#TASK-ES-526 생성기 표지) ---- */

  /* 🎯 목표-일정-맞춤기록 3각 자동 추적 엔진 (Auto Progress Sync) */
  function syncRecordToMatchingGoals(recObj, curTpl, columns, validRows){
    var goals = (L.state.profile && L.state.profile.goals) || [];
    if(!goals.length) return;
    var theme = (curTpl.theme || '').toLowerCase();
    var tplTitle = (curTpl.title || '').toLowerCase();

    var matchedGoal = goals.find(function(g){
      if(g.archived) return false;
      var gt = (g.title || '').toLowerCase();
      var gc = (g.category || '').toLowerCase();
      if(/(?:workout|crossfit|hyrox)/.test(theme) || /(?:헬스|운동|러닝|달리기|크로스핏|하이록스|스쿼트|벤치|웨이트)/.test(tplTitle)){
        return /(?:운동|헬스|체중|다이어트|러닝|마라톤|근력|크로스핏|하이록스|건강)/.test(gt) || /(?:운동|건강|체력)/.test(gc);
      }
      if(theme === 'study' || /(?:공부|학습|시험|자격증|토익|민법|독서|코딩|개발)/.test(tplTitle)){
        return /(?:공부|학습|시험|자격증|토익|합격|독서|개발|코딩)/.test(gt) || /(?:공부|학습|역량|독서)/.test(gc);
      }
      if(theme === 'business' || /(?:영업|매출|계약|세일즈)/.test(tplTitle)){
        return /(?:영업|매출|계약|수주|커리어|사업)/.test(gt) || /(?:커리어|사업|경제)/.test(gc);
      }
      return false;
    });

    if(!matchedGoal) return;

    var updated = false;
    if(matchedGoal.milestones && matchedGoal.milestones.length){
      var uncompleted = matchedGoal.milestones.find(function(m){ return m.status !== 'done'; });
      if(uncompleted){
        if(!uncompleted.result || isNaN(uncompleted.result)){
          uncompleted.result = 1;
        } else {
          uncompleted.result = Number(uncompleted.result) + 1;
        }
        if(uncompleted.target && Number(uncompleted.result) >= Number(uncompleted.target)){
          uncompleted.status = 'done';
        }
        updated = true;
      }
    }

    if(updated){
      L.toast('[3각 자동 연동] 목표 [' + matchedGoal.title + '] 마일스톤에 오늘 기록이 실시간 자동 반영되었습니다!');
    }
  }

  K.downloadTableAsCsv = downloadTableAsCsv;
  K.parseCsvText = parseCsvText;
  K.openCsvImportModal = openCsvImportModal;
  K.openWearableSyncModal = openWearableSyncModal;
  K.syncRecordToMatchingGoals = syncRecordToMatchingGoals;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
