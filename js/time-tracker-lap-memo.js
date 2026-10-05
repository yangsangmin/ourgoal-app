/**
 * OurGoal Time Tracker Cell: 구간 메모 패널 — 측정 중 구간을 누르면 시간창 아래에 여는 인라인 메모(퀵 태그·취소·저장) openLapMemoModal (#TASK-ES-407 · 시간기록 세포 쪼개기)
 *
 * js/time-tracker.js(1220줄)에서 동작 그대로 옮겼다(이전 전 769~857줄).
 *   openLapMemoModal
 * 바꾼 것은 이름 참조뿐이다 — 원본 스코프 이름은 T.<이름>. 버그도 그대로 옮겼다(고치는 것은 별도 티켓).
 * 바깥에서는 이전과 같이 window.OurgoalTimeTracker(open·close·switchMode·getState)로 부른다. 틀: docs/specs/MODULE-SPLIT-PROTOCOL.md
 */
(function(global) {
  'use strict';
  // T = js/time-tracker.js 의 스코프 통로 — 원본 IIFE 에 남은 함수·상태(tracker)를 getter(대입하는 이름은 setter 도)로 읽는다(원본이 로드될 때 채운다). 값은 읽을 때마다 살아 있는 값이다.
  // K = 시간기록 세포 키트의 lapMemo 칸 — 옮긴 함수를 담는다. 원본은 IIFE 맨 위에서 K 의 함수를 같은 이름으로 가져온다(전역 이름을 함수마다 늘리지 않는다).
  var KIT = global.OurgoalTimeTrackerKit = global.OurgoalTimeTrackerKit || {};
  var K = KIT.lapMemo = KIT.lapMemo || {};
  var T = K.scope = K.scope || {};

  /**
   * 실시간 구간별 활동기록 작성 인라인 패널 (시간 정지 없음, 시간창 자연스럽게 상단 이동, #TASK-ES-172, [44], [55])
   */
  function openLapMemoModal(lap) {
    if (!lap) return;

    // 이전 구형 모달 잔재가 있으면 제거
    var oldModal = document.getElementById('ttLapMemoModal');
    if (oldModal && oldModal.parentNode) {
      oldModal.parentNode.removeChild(oldModal);
    }

    var container = T.tracker.dom.lapMemoContainer || document.getElementById('ttLapMemoContainer');
    if (!container) return;

    // 1. 상민님 의도: 구간 누르면 자연스럽게 시간창을 위로 올림 (초시계 가림 0%)
    if (T.tracker.dom.measureView) {
      T.tracker.dom.measureView.classList.add('tt-memo-active');
    }

    // 2. 모던 퀵 태그 목록
    var quickTags = ['🏃 러닝', '📚 공부', '💻 코딩', '📖 독서', '☕ 휴식', '🎯 몰입', '💪 운동'];

    container.innerHTML = 
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<span class="tt-lap-num">구간 ' + lap.lapNum + '</span>' +
          '<h4 style="margin:0;font-size:.95rem;color:#fff;font-weight:800;">+' + lap.formattedDuration + ' <span style="font-size:.75rem;color:#94a3b8;font-weight:500;">(누적 ' + lap.formattedSplit + ')</span></h4>' +
        '</div>' +
        '<span style="display:inline-flex;align-items:center;gap:4px;font-size:.68rem;background:rgba(34,197,94,0.15);color:#4ade80;font-weight:700;padding:2px 8px;border-radius:999px;border:1px solid rgba(34,197,94,0.3);">' +
          '<span style="width:5px;height:5px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 5px #22c55e;"></span>측정 중' +
        '</span>' +
      '</div>' +
      '<p style="font-size:.75rem;color:#94a3b8;margin:0 0 8px;line-height:1.3;">시간별로 세부 내용을 작성할 수 있어요 (시간은 멈추지 않습니다)</p>' +
      '<div style="display:flex;gap:5px;overflow-x:auto;padding-bottom:5px;margin-bottom:8px;" class="no-scrollbar">' +
        quickTags.map(function(tag){
          return '<button type="button" class="btn-quick-lap-tag">' + tag + '</button>';
        }).join('') +
      '</div>' +
      '<textarea id="ttLapMemoInput" style="width:100%;box-sizing:border-box;height:54px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.18);border-radius:10px;padding:8px 10px;color:#fff;font-size:.8125rem;resize:none;margin-bottom:10px;outline:none;line-height:1.35;" placeholder="예: 3km 러닝, 핵심 비즈니스 로직 작성 등">' + (lap.text || '') + '</textarea>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;align-items:center;">' +
        '<button type="button" class="btn btn-ghost btn-xs" id="btnTtLapMemoCancel" style="padding:6px 12px;border-radius:8px;color:#94a3b8;font-weight:600;font-size:.75rem;">취소</button>' +
        '<button type="button" class="btn btn-primary btn-xs" id="btnTtLapMemoSave" style="padding:6px 16px;border-radius:8px;background:linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);color:#fff;border:none;font-weight:700;font-size:.75rem;box-shadow:0 2px 8px rgba(99,102,241,0.4);">저장</button>' +
      '</div>';

    container.style.maxWidth = '340px';
    container.style.display = 'block';

    var txt = container.querySelector('#ttLapMemoInput');
    if (txt) {
      txt.focus();
      txt.onfocus = function(){ txt.style.borderColor = '#6366f1'; txt.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)'; };
      txt.onblur = function(){ txt.style.borderColor = 'rgba(255,255,255,0.18)'; txt.style.boxShadow = 'none'; };
    }

    container.querySelectorAll('.btn-quick-lap-tag').forEach(function(btn){
      btn.onclick = function(){
        if (!txt) return;
        var tag = btn.textContent;
        if (txt.value.trim()) {
          txt.value = txt.value.trim() + ' ' + tag;
        } else {
          txt.value = tag;
        }
        btn.style.background = 'rgba(99,102,241,0.3)';
        btn.style.borderColor = '#6366f1';
        btn.style.color = '#fff';
      };
    });

    container.querySelector('#btnTtLapMemoCancel').onclick = function() {
      container.style.display = 'none';
      container.innerHTML = '';
      if (T.tracker.dom.measureView) {
        T.tracker.dom.measureView.classList.remove('tt-memo-active');
      }
    };

    container.querySelector('#btnTtLapMemoSave').onclick = function() {
      lap.text = (txt ? txt.value.trim() : '');
      container.style.display = 'none';
      container.innerHTML = '';
      if (T.tracker.dom.measureView) {
        T.tracker.dom.measureView.classList.remove('tt-memo-active');
      }
      T.renderLapsList();
      if (typeof toast === 'function') toast('구간 ' + lap.lapNum + ' 활동 내용이 저장되었습니다.');
    };
  }

  K.openLapMemoModal = openLapMemoModal;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
