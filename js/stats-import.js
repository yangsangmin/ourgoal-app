/**
 * OurGoal Stats Cell: 데이터 가져오기 — 과거 일자 정규화·CSV 인제스터·가져오기 모달(normalizeHistoricalDate · parseCsvToUniversalRecords · openUniversalImportModal) (#TASK-ES-401 · 통계 세포 쪼개기 2차)
 *
 * js/universal-stats.js(이전 전 5,171줄)에서 동작 그대로 옮겼다(이전 전 2148~2183, 2323~2452, 4454~4785줄).
 *   normalizeHistoricalDate · parseCsvToUniversalRecords · openUniversalImportModal
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 S.<이름>, 다른 통계 세포 파일의 함수는 K.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalUniversalStats.<함수> 로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(root) {
  'use strict';
  // S = js/universal-stats.js 의 스코프 통로 — 원본 IIFE 에 남은 공용 함수·값(pad·METRIC_CONFIGS·askConfirm …)을 getter 로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 통계 세포 키트 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var K = root.OurgoalUniversalStatsKit = root.OurgoalUniversalStatsKit || {};
  var S = K.scope = K.scope || {};

  /* ================= 5-0. 1900년대 및 역대 과거 임의 일자 무손실 정규화 엔진 ================= */
  function normalizeHistoricalDate(str, offsetMin){
    if(!str) return null;
    str = String(str).trim().replace(/^[\"']|[\"']$/g, '');
    offsetMin = offsetMin || 0;
    if(str.indexOf('T') !== -1 || (str.indexOf(':') !== -1 && /\d{4}/.test(str))){
      var testD = new Date(str);
      if(!isNaN(testD.getTime())) return testD.toISOString();
    }
    var m1 = str.match(/^(\d{4})[-./\s년\s]+(\d{1,2})[-./\s월\s]+(\d{1,2})(?:일)?(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if(m1){
      var y = m1[1];
      var m = S.pad(parseInt(m1[2], 10));
      var d = S.pad(parseInt(m1[3], 10));
      var hr = m1[4] !== undefined ? S.pad(parseInt(m1[4], 10)) : S.pad(19);
      var min = m1[5] !== undefined ? S.pad(parseInt(m1[5], 10)) : S.pad(offsetMin % 60);
      var sec = m1[6] !== undefined ? S.pad(parseInt(m1[6], 10)) : '00';
      return y + '-' + m + '-' + d + 'T' + hr + ':' + min + ':' + sec + '.000Z';
    }
    var m2 = str.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})/);
    if(m2){
      var y2 = m2[3];
      var m2Part = parseInt(m2[1], 10);
      var d2Part = parseInt(m2[2], 10);
      var mVal = (m2Part > 12) ? d2Part : m2Part;
      var dVal = (m2Part > 12) ? m2Part : d2Part;
      return y2 + '-' + S.pad(mVal) + '-' + S.pad(dVal) + 'T19:' + S.pad(offsetMin % 60) + ':00.000Z';
    }
    var m3 = str.match(/^(\d{4})(\d{2})(\d{2})$/);
    if(m3){
      return m3[1] + '-' + m3[2] + '-' + m3[3] + 'T19:' + S.pad(offsetMin % 60) + ':00.000Z';
    }
    var fallback = new Date(str);
    if(!isNaN(fallback.getTime())) return fallback.toISOString();
    return null;
  }

  /* ================= 5-2. 임의 CSV / 텍스트 자율 인제스터 & 타임라인 융합 ================= */
    function parseCsvToUniversalRecords(csvStr, defaultTheme){
    defaultTheme = defaultTheme || 'general';
    if(!csvStr || typeof csvStr !== 'string') return [];

    var lines = csvStr.trim().split(/\r?\n/).filter(function(l){ return l.trim().length > 0; });
    if(lines.length === 0) return [];

    var headerLine = lines[0];
    // 탭(\t) 구분자 vs 쉼표(,) 구분자 자동 판별
    var tabCount = (headerLine.match(/\t/g) || []).length;
    var commaCount = (headerLine.match(/,/g) || []).length;
    var delim = (tabCount > commaCount || (tabCount > 0 && commaCount === 0)) ? '\t' : ',';

    var headers = headerLine.split(delim).map(function(h){ return h.trim().replace(/^[\"\']|[\"\']$/g, ''); });

    var colMap = { date: -1, exercise: -1, notes: -1 };

    headers.forEach(function(h, idx){
      var lh = h.toLowerCase();
      if(colMap.date === -1 && /date|날짜|일자|일시|time|timestamp/.test(lh)) colMap.date = idx;
      else if(colMap.exercise === -1 && /exercise|운동|종목|title|제목|item|항목|과목|subject|task|업무|프로젝트|category|카테고리|name|client|고객|고객사|target|company|org/.test(lh)) colMap.exercise = idx;
      else if(colMap.notes === -1 && /notes|메모|내용|비고|memo|desc|description/.test(lh)) colMap.notes = idx;
    });

    var records = [];
    var sessionOffsets = {};

    var startIdx = 1;
    // 만약 헤더에 날짜나 메트릭 키워드가 없고 바로 데이터인 경우(헤더 없는 데이터) 방어
    if(colMap.date === -1 && lines.length === 1){
      startIdx = 0;
      headers = ['date', 'content'];
      colMap.date = 0;
      colMap.notes = 1;
    }

    for(var i = startIdx; i < lines.length; i++){
      var cols = lines[i].split(delim).map(function(c){ return c.trim().replace(/^[\"\']|[\"\']$/g, ''); });
      if(cols.length < headers.length - 2) continue;

      var rawDate = colMap.date !== -1 ? (cols[colMap.date] || '1924-01-01') : '1924-01-01';
      var exerciseRaw = colMap.exercise !== -1 ? (cols[colMap.exercise] || '기록 항목') : '기록 항목';

      // 한글 깨짐 복구 (EUC-KR 디코딩 오류 대응)
      var exercise = exerciseRaw;
      if(/Ʈ|스쿼|squat/i.test(exerciseRaw)) exercise = '스쿼트';
      else if(/ġ|벤치|bench/i.test(exerciseRaw)) exercise = '벤치프레스';
      else if(/帮|데드|dead/i.test(exerciseRaw)) exercise = '데드리프트';

      var notes = colMap.notes !== -1 ? (cols[colMap.notes] || '') : '';

      sessionOffsets[rawDate] = (sessionOffsets[rawDate] || 0) + 1;
      var offsetMin = (sessionOffsets[rawDate] - 1) * 20;

      var startIso = normalizeHistoricalDate(rawDate, offsetMin) || new Date().toISOString();
      var endIso = new Date(new Date(startIso).getTime() + 60 * 60000).toISOString();
      var dateStr = (startIso || '').slice(0, 10);

      var metrics = {};
      var metricUnits = {};
      var rawRow = {};

      headers.forEach(function(h, idx){
        rawRow[h] = cols[idx];
        if(idx === colMap.date || idx === colMap.exercise || idx === colMap.notes) return;
        var val = parseFloat(cols[idx]);
        if(!isNaN(val)){
          var lh = h.toLowerCase().replace(/\s+/g, '_');
          var uMatch = h.match(/\(([^)]+)\)/) || h.match(/_([a-zA-Z가-힣%]+)$/);
          var unit = uMatch ? uMatch[1] : '';
          
          metrics[lh] = val;
          metricUnits[lh] = unit;

          // 호환성 별칭 매핑 (기존 테스트 통과 보장)
          if(/1rm|estimated_1rm|원알엠/.test(lh)){ metrics['1rm'] = val; metricUnits['1rm'] = 'kg'; }
          if(/volume|daily_volume|볼륨/.test(lh)){ metrics['volume'] = val; metricUnits['volume'] = 'kg'; }
          if(/bodyweight|체중/.test(lh)){ metrics['bodyweight'] = val; metricUnits['bodyweight'] = 'kg'; }
          if(/sets|세트/.test(lh)){ metrics['sets'] = val; metricUnits['sets'] = 'set'; }
          if(/pages|쪽/.test(lh)){ metrics['pages'] = val; metricUnits['pages'] = '쪽'; }
          if(/distance|거리/.test(lh)){ metrics['distance'] = val; metricUnits['distance'] = 'km'; }
          if(/duration|시간/.test(lh)){ metrics['duration'] = val; metricUnits['duration'] = '분'; }
        }
      });

      // 1차/2차 수치 자동 할당
      var numKeys = Object.keys(metrics).filter(function(k){ return !['sets'].includes(k); });
      if(numKeys.length > 0){
        metrics.primary = metrics[numKeys[0]];
        metrics.primaryUnit = metricUnits[numKeys[0]] || '';
      }
      if(numKeys.length > 1){
        metrics.secondary = metrics[numKeys[1]];
        metrics.secondaryUnit = metricUnits[numKeys[1]] || '';
      }

      // 요약 텍스트
      var summaryParts = [];
      if(metrics['1rm'] !== undefined && metrics['volume'] !== undefined){
        summaryParts.push('1RM: ' + metrics['1rm'] + 'kg');
        summaryParts.push('볼륨: ' + metrics['volume'].toLocaleString() + 'kg');
      } else {
        numKeys.slice(0, 3).forEach(function(nk){
          var u = metricUnits[nk] ? (' ' + metricUnits[nk]) : '';
          summaryParts.push(nk + ': ' + metrics[nk].toLocaleString() + u);
        });
      }
      var summaryText = '[' + exercise + '] ' + summaryParts.join(' | ') + (notes ? (' - ' + notes) : '');

      records.push({
        id: 'rec_imp_' + dateStr.replace(/[^0-9]/g, '') + '_' + i + '_' + Math.floor(Math.random()*1000),
        theme: defaultTheme,
        subTheme: exercise,
        item: exercise,
        exercise: exercise,
        text: summaryText,
        startAt: startIso,
        endAt: endIso,
        createdAt: startIso,
        metrics: metrics,
        metricUnits: metricUnits,
        rawRow: rawRow,
        visibility: 'private',
        source: 'csv_import'
      });
    }

    return records;
  }

  function openUniversalImportModal(opts){
    opts = opts || {};
    var openModalFn = opts.openModal;
    var closeModalFn = opts.closeModal;
    var toastFn = opts.toast;
    var state = opts.state;
    var saveProfileFn = opts.saveProfile;
    var onDoneFn = opts.onDone;

    if(!openModalFn) return;

    var stagedRecs = [];
    var curRecs = (state && state.profile && state.profile.records) || [];
    var sampleCount = curRecs.filter(function(r){ return r.isSample; }).length;

    var purgeBannerHtml = '';
    if(sampleCount > 0){
      purgeBannerHtml = 
        '<div class="u-sample-purge-row" id="uSamplePurgeRow" style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:8px 12px;margin-bottom:12px;">' +
          '<div style="font-size:.8125rem;color:var(--ink);display:flex;align-items:center;gap:6px;">' +
            '<span>🧪 현재 체험 샘플 <b>' + sampleCount + '건</b> 로드됨</span>' +
          '</div>' +
          '<button type="button" class="btn btn-xs btn-danger" id="uPurgeSampleBtn" style="font-size:.75rem;padding:4px 10px;font-weight:700;border-radius:6px;cursor:pointer;">' +
            '🧹 샘플만 삭제' +
          '</button>' +
        '</div>';
    }

    function renderSampleCardsHtml(themeId){
      var th = S.SAMPLE_THEMES.find(function(t){ return t.id === themeId; }) || S.SAMPLE_THEMES[0];
      return th.items.map(function(item){
        return '<div class="btn btn-ghost u-sample-card" data-sample="' + item.key + '" style="height:auto;padding:10px 12px;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:8px;border:1.5px solid var(--border);border-radius:10px;cursor:pointer;transition:all .15s;background:var(--card);">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
              '<span style="font-weight:700;font-size:.84rem;color:var(--ink);">' + item.icon + ' ' + item.title + '</span>' +
              '<span class="badge" style="font-size:.65rem;background:var(--card2);color:var(--brand);padding:1px 5px;border-radius:4px;font-weight:700;">' + item.tag + '</span>' +
            '</div>' +
            '<div style="font-size:.72rem;color:var(--ink-soft);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + item.desc + '</div>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-xs u-sample-quick-btn" data-quick-sample="' + item.key + '" style="font-weight:700;padding:5px 9px;font-size:.72rem;white-space:nowrap;box-shadow:0 1px 3px rgba(37,99,235,0.25);flex-shrink:0;">⚡ 1초 로드</button>' +
        '</div>';
      }).join('');
    }

    var modalHtml = 
      '<div class="modal-head">' +
        '<h3>📥 데이터 가져오기 & 1초 샘플 로드</h3>' +
      '</div>' +
      purgeBannerHtml +
      '<div style="margin-bottom:12px;font-size:.8125rem;color:var(--ink-soft);line-height:1.4;">' +
        '운동·업무·학습·재테크·웰니스 5대 테마 중 원하는 분야를 골라 1초 만에 실제 52주 데이터를 융합해보세요.' +
      '</div>' +

      '<!-- 3개 탭 바 -->' +
      '<div class="tab-bar" style="margin-bottom:14px;display:flex;gap:4px;border-bottom:1px solid var(--border);padding-bottom:6px;">' +
        '<button class="tab-btn active" id="uImpTabSamples" type="button" style="flex:1;padding:8px 4px;font-size:.8125rem;font-weight:700;border:none;background:transparent;color:var(--brand);border-bottom:2px solid var(--brand);cursor:pointer;">⚡ 52주 추천 샘플</button>' +
        '<button class="tab-btn" id="uImpTabCsv" type="button" style="flex:1;padding:8px 4px;font-size:.8125rem;font-weight:600;border:none;background:transparent;color:var(--ink-soft);cursor:pointer;">📁 CSV 파일</button>' +
        '<button class="tab-btn" id="uImpTabText" type="button" style="flex:1;padding:8px 4px;font-size:.8125rem;font-weight:600;border:none;background:transparent;color:var(--ink-soft);cursor:pointer;">✍️ 엑셀/텍스트 붙여넣기</button>' +
      '</div>' +

      '<!-- Tab 1: 추천 샘플 1초 로드 -->' +
      '<div id="uImpPanelSamples" class="u-imp-panel">' +
        '<!-- 5대 테마 탭 칩 바 (가로 스크롤 가능) -->' +
        '<div class="u-theme-tab-row" id="uSampleThemeTabRow" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:10px;-webkit-overflow-scrolling:touch;scrollbar-width:none;">' +
          S.SAMPLE_THEMES.map(function(th, idx){
            var isActive = idx === 0;
            return '<button type="button" class="btn btn-xs u-theme-tab-btn' + (isActive ? ' active' : '') + '" data-theme="' + th.id + '" style="flex-shrink:0;padding:6px 11px;border-radius:20px;font-size:.75rem;font-weight:700;border:1px solid ' + (isActive ? 'var(--brand)' : 'var(--border)') + ';background:' + (isActive ? 'var(--brand)' : 'var(--card)') + ';color:' + (isActive ? '#fff' : 'var(--ink)') + ';cursor:pointer;transition:all .15s;">' +
              th.label + ' (7)' +
            '</button>';
          }).join('') +
        '</div>' +
        '<!-- 테마별 7개 카드 컨테이너들 (활성 테마만 표출) -->' +
        '<div id="uSampleCardContainer" class="u-sample-cards-wrapper">' +
          S.SAMPLE_THEMES.map(function(th, idx){
            var isActive = idx === 0;
            return '<div class="u-sample-card-grid" data-theme-panel="' + th.id + '" style="display:' + (isActive ? 'grid' : 'none') + ';grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:8px;">' +
              renderSampleCardsHtml(th.id) +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<!-- Tab 2: CSV 파일 -->' +
      '<div id="uImpPanelCsv" class="u-imp-panel" style="display:none;">' +
        '<div class="field" style="margin-bottom:8px;">' +
          '<label style="font-size:.8125rem;font-weight:600;">CSV 파일 선택</label>' +
          '<input type="file" id="uImpCsvFileInput" accept=".csv,text/csv,text/plain" style="width:100%;box-sizing:border-box;margin-top:4px;">' +
        '</div>' +
        '<div class="faint" style="font-size:.75rem;line-height:1.4;">' +
          '💡 영업 실적, GitHub 커밋 로그, 수험 타이머 기록, 체중 등 모든 CSV 파일을 지원합니다. 첫 번째 행(헤더)의 컬럼명을 AI가 스스로 감지합니다.' +
        '</div>' +
      '</div>' +

      '<!-- Tab 3: 엑셀/텍스트 붙여넣기 -->' +
      '<div id="uImpPanelText" class="u-imp-panel" style="display:none;">' +
        '<div class="field" style="margin-bottom:8px;">' +
          '<label style="font-size:.8125rem;font-weight:600;">엑셀 복사(탭 구분) 또는 일기/메모 줄글</label>' +
          '<textarea id="uImpTextInput" rows="5" placeholder="예 1 (B2B 영업 실적):&#10;2025-05-10\t콜 25건\t미팅 4건\t수주 1200만원&#10;2025-05-11\t콜 30건\t미팅 5건\t수주 2500만원&#10;&#10;예 2 (개발 활동):&#10;2025-06-15, 커밋 12회, PR 3개, 리뷰 5회&#10;2025-06-16, 커밋 8회, PR 1개, 리뷰 2회" style="width:100%;box-sizing:border-box;font-family:monospace;font-size:.8125rem;line-height:1.4;margin-top:4px;"></textarea>' +
        '</div>' +
      '</div>' +

      '<!-- 실시간 분석 결과 & 데이터 테이블 미리보기 영역 -->' +
      '<div id="uImpPreviewBox" style="display:none;margin-top:12px;padding:10px;background:var(--card2);border-radius:10px;font-size:.8125rem;">' +
        '<div id="uImpPreviewTitle" style="font-weight:700;color:var(--brand);margin-bottom:4px;"></div>' +
        '<div id="uImpPreviewTableArea"></div>' +
      '</div>' +

      '<div class="modal-actions" style="margin-top:14px;display:flex;justify-content:flex-end;gap:8px;">' +
        '<button class="btn btn-ghost" id="uImpCancelBtn" type="button">닫기</button>' +
        '<button class="btn btn-primary" id="uImpApplyBtn" type="button" style="display:none;">기록에 융합하기</button>' +
      '</div>';

    openModalFn(modalHtml, function(modalEl){
      var tabSamples = modalEl.querySelector('#uImpTabSamples');
      var tabCsv = modalEl.querySelector('#uImpTabCsv');
      var tabText = modalEl.querySelector('#uImpTabText');
      var panelSamples = modalEl.querySelector('#uImpPanelSamples');
      var panelCsv = modalEl.querySelector('#uImpPanelCsv');
      var panelText = modalEl.querySelector('#uImpPanelText');
      var previewBox = modalEl.querySelector('#uImpPreviewBox');
      var previewTitle = modalEl.querySelector('#uImpPreviewTitle');
      var previewTableArea = modalEl.querySelector('#uImpPreviewTableArea');
      var applyBtn = modalEl.querySelector('#uImpApplyBtn');
      var cancelBtn = modalEl.querySelector('#uImpCancelBtn');
      var purgeBtn = modalEl.querySelector('#uPurgeSampleBtn');

      function switchTab(t){
        [tabSamples, tabCsv, tabText].forEach(function(b){
          if(!b) return;
          b.classList.toggle('active', b === t);
          b.style.color = (b === t) ? 'var(--brand)' : 'var(--ink-soft)';
          b.style.borderBottom = (b === t) ? '2px solid var(--brand)' : 'none';
        });
        if(panelSamples) panelSamples.style.display = (t === tabSamples) ? 'block' : 'none';
        if(panelCsv) panelCsv.style.display = (t === tabCsv) ? 'block' : 'none';
        if(panelText) panelText.style.display = (t === tabText) ? 'block' : 'none';
      }

      if(tabSamples) tabSamples.onclick = function(){ switchTab(tabSamples); };
      if(tabCsv) tabCsv.onclick = function(){ switchTab(tabCsv); };
      if(tabText) tabText.onclick = function(){ switchTab(tabText); };
      if(cancelBtn) cancelBtn.onclick = closeModalFn;

      // 0. 샘플 데이터 일괄 삭제/정화 안전망
      if(purgeBtn){
        purgeBtn.onclick = async function(){
          if(!(await S.askConfirm('체험용으로 로드된 샘플 데이터 ' + sampleCount + '건만 삭제하시겠습니까?\n(회원님의 실제 기록은 100% 안전하게 보존됩니다)'))) return;
          var kept = curRecs.filter(function(r){ return !r.isSample; });
          if(state && state.profile) state.profile.records = kept;
          if(saveProfileFn) await saveProfileFn();
          closeModalFn();
          if(toastFn) toastFn('샘플 데이터 ' + sampleCount + '건이 모두 정리되었습니다! ✨');
          if(onDoneFn) onDoneFn('purge', sampleCount);
        };
      }

      // 공통 융합 실행 함수 (원터치 1초 로더)
      async function executeImport(recsToImport, domainLabel){
        if(!recsToImport || !recsToImport.length) return;
        var cur = (state && state.profile && state.profile.records) || [];
        var merged = cur.slice();
        var added = 0;
        recsToImport.forEach(function(sr){
          merged.push(sr);
          added++;
        });
        merged.sort(function(a,b){ return new Date(b.startAt) - new Date(a.startAt); });
        if(state && state.profile) state.profile.records = merged;

        if(state){
          state.recordsSegment = 'stats';
          state.univPeriod = 'all';
        }
        if(saveProfileFn) await saveProfileFn();
        closeModalFn();

        if(onDoneFn) onDoneFn(domainLabel || 'general', added);
        if(toastFn) toastFn('총 ' + added + '건의 [' + (domainLabel || '데이터') + '] 기록을 1초 만에 융합했습니다! 콕핏 차트를 확인해보세요 🔥');
      }

      // 샘플 레코드 생성 헬퍼
      function getSampleRecs(sKey){
        if(sKey === 'big3_52w') return S.generate52WeekPowerliftingSample();
        if(sKey === 'olympic_1924') return S.generate1920sOlympicStrengthSample();
        return S.generateDomainSample(sKey);
      }

      var sampleCardContainer = modalEl.querySelector('#uSampleCardContainer');
      var themeTabBtns = modalEl.querySelectorAll('.u-theme-tab-btn');

      function bindSampleInteractions(){
        // 1-A. 샘플 카드 내 [⚡ 1초 로드] 원터치 직행 버튼
        modalEl.querySelectorAll('.u-sample-quick-btn').forEach(function(qBtn){
          qBtn.onclick = function(e){
            e.stopPropagation();
            var sKey = qBtn.dataset.quickSample;
            var recs = getSampleRecs(sKey);
            var titleStr = qBtn.closest('.u-sample-card') ? qBtn.closest('.u-sample-card').textContent.trim().split('\n')[0] : sKey;
            executeImport(recs, titleStr);
          };
        });

        // 1-B. 샘플 카드 본체 클릭 시 선택 활성화 & 하단 프리뷰
        modalEl.querySelectorAll('.u-sample-card').forEach(function(card){
          card.onclick = function(){
            modalEl.querySelectorAll('.u-sample-card').forEach(function(c){
              c.style.border = '1.5px solid var(--border)';
              c.style.background = 'var(--card)';
            });
            card.style.border = '2px solid var(--brand)';
            card.style.background = 'var(--brand-faint, rgba(37,99,235,0.06))';

            var sKey = card.dataset.sample;
            stagedRecs = getSampleRecs(sKey);

            previewBox.style.display = 'block';
            var titleStr = sKey === 'big3_52w' ? '52주 3대운동 156세션' : card.textContent.trim().split('\n')[0];
            previewTitle.textContent = '선택됨: ' + titleStr + ' (' + stagedRecs.length + '개 세션 준비 완료)';
            previewTableArea.innerHTML = renderTablePreview(stagedRecs);

            applyBtn.style.display = 'inline-block';
            applyBtn.textContent = stagedRecs.length + '개 데이터 1초 만에 융합하기';
          };
        });
      }

      // 테마 탭 전환 이벤트 바인딩
      themeTabBtns.forEach(function(thBtn){
        thBtn.onclick = function(){
          var themeId = thBtn.dataset.theme;
          themeTabBtns.forEach(function(b){
            var isCur = b === thBtn;
            b.classList.toggle('active', isCur);
            b.style.border = isCur ? '1px solid var(--brand)' : '1px solid var(--border)';
            b.style.background = isCur ? 'var(--brand)' : 'var(--card)';
            b.style.color = isCur ? '#fff' : 'var(--ink)';
          });
          modalEl.querySelectorAll('.u-sample-card-grid[data-theme-panel]').forEach(function(grid){
            grid.style.display = (grid.dataset.themePanel === themeId) ? 'grid' : 'none';
          });
        };
      });

      // 마운트 시 전체 35종 카드에 상호작용 바인딩 1회 수행 (Zero Dead Click 보장)
      bindSampleInteractions();

      // 테이블 프리뷰 렌더러
      function renderTablePreview(recs){
        if(!recs || !recs.length) return '';
        var rows = recs.slice(0, 4);
        var trs = rows.map(function(r){
          var d = (r.startAt || '').slice(0, 10);
          var ent = r.subTheme || r.exercise || r.item || '일반';
          var pVal = (r.metrics && (r.metrics.primary !== undefined ? r.metrics.primary : (r.metrics['1rm'] || r.metrics.revenue || r.metrics.commits || '-'))) + (r.metrics && r.metrics.primaryUnit ? (' ' + r.metrics.primaryUnit) : '');
          var sVal = (r.metrics && (r.metrics.secondary !== undefined ? r.metrics.secondary : (r.metrics.volume || r.metrics.deals || r.metrics.prs || '-'))) + (r.metrics && r.metrics.secondaryUnit ? (' ' + r.metrics.secondaryUnit) : '');
          var txt = r.text || '';
          if(txt.length > 28) txt = txt.slice(0, 28) + '…';
          return '<tr style="border-bottom:1px solid var(--border);">' +
            '<td style="padding:4px 6px;white-space:nowrap;color:var(--ink);">' + d + '</td>' +
            '<td style="padding:4px 6px;font-weight:700;color:var(--brand);white-space:nowrap;">' + ent + '</td>' +
            '<td style="padding:4px 6px;white-space:nowrap;color:#10b981;font-weight:700;">' + pVal + '</td>' +
            '<td style="padding:4px 6px;white-space:nowrap;color:#6366f1;">' + sVal + '</td>' +
            '<td style="padding:4px 6px;color:var(--ink-soft);">' + txt + '</td>' +
          '</tr>';
        }).join('');

        return '<div style="margin-top:6px;max-height:150px;overflow-x:auto;border:1px solid var(--border);border-radius:8px;background:var(--card);">' +
          '<table style="width:100%;border-collapse:collapse;text-align:left;font-size:11px;font-family:monospace;">' +
            '<thead style="background:var(--card2);border-bottom:1px solid var(--border);color:var(--ink-soft);">' +
              '<tr>' +
                '<th style="padding:4px 6px;">일자</th><th style="padding:4px 6px;">항목</th><th style="padding:4px 6px;">주요수치</th><th style="padding:4px 6px;">보조수치</th><th style="padding:4px 6px;">내용 요약</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' + trs + '</tbody>' +
          '</table>' +
        '</div>';
      }

      // 2. CSV 파일 파싱
      var fileInp = modalEl.querySelector('#uImpCsvFileInput');
      if(fileInp){
        fileInp.onchange = function(e){
          var file = e.target.files && e.target.files[0];
          if(!file) return;
          var reader = new FileReader();
          reader.onload = function(evt){
            var csvStr = evt.target.result || '';
            stagedRecs = parseCsvToUniversalRecords(csvStr, 'general');
            if(stagedRecs.length === 0){
              if(toastFn) toastFn('CSV 파일에 유효한 데이터 행이 부족합니다.');
              return;
            }
            previewBox.style.display = 'block';
            previewTitle.textContent = 'CSV 분석 완료: ' + stagedRecs.length + '건의 데이터 감지됨 (상위 미리보기)';
            previewTableArea.innerHTML = renderTablePreview(stagedRecs);
            applyBtn.style.display = 'inline-block';
            applyBtn.textContent = stagedRecs.length + '건의 기록 융합하기';
          };
          reader.readAsText(file);
        };
      }

      // 3. 텍스트 파싱
      var textInp = modalEl.querySelector('#uImpTextInput');
      if(textInp){
        textInp.oninput = function(){
          var raw = textInp.value.trim();
          if(!raw){
            applyBtn.style.display = 'none';
            previewBox.style.display = 'none';
            stagedRecs = [];
            return;
          }
          stagedRecs = parseCsvToUniversalRecords(raw, 'general');
          if(stagedRecs.length > 0){
            previewBox.style.display = 'block';
            previewTitle.textContent = '텍스트 분석 완료: ' + stagedRecs.length + '건 감지됨 (상위 미리보기)';
            previewTableArea.innerHTML = renderTablePreview(stagedRecs);
            applyBtn.style.display = 'inline-block';
            applyBtn.textContent = stagedRecs.length + '건의 기록 융합하기';
          }
        };
      }

      // 4. 하단 적용 버튼 클릭
      if(applyBtn){
        applyBtn.onclick = function(){
          executeImport(stagedRecs, '가져온 데이터');
        };
      }
    });
  }

  K.normalizeHistoricalDate = normalizeHistoricalDate;
  K.parseCsvToUniversalRecords = parseCsvToUniversalRecords;
  K.openUniversalImportModal = openUniversalImportModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : global);
