/**
 * OurGoal Cell Skeleton - Slots (꽂는 자리)
 *
 * #TASK-ES-356 (노션 CORE-08 · [청사진] 아워골 세포 골격 v0.1 3절): 앱의 주요 자리에 이름을 붙이고,
 * 세포는 그 자리에 "기여"한다. 자리의 주인(큰 세포)은 기여 목록을 받아 그릴 뿐 기여한 세포를 모른다.
 * 하이브리드 세포는 여러 자리에 동시에 꽂힌다(예: 아바타 → home.card + settings.section + profile.badge).
 * 자리 이름은 정식 목록 15곳(상민님 확정 2026-10-04)만 쓴다 — 목록 밖 이름은 만들 수도 기여할 수도 없고, 신고서 가드도 실패시킨다.
 * 규칙: docs/architecture/MODULE-BLUEPRINT.md 「연결망 — 꽂는 자리」.
 *
 *   define(slot, meta)                       정식 목록 안의 자리 meta 보태기. 목록 밖 이름은 SLOT_NOT_ALLOWED(정식 15곳은 미리 있다).
 *   contribute(slot, cellId, render, meta)   자리에 기여. 같은 (자리, 세포)는 바꿔 끼운다(재마운트에도 1개).
 *                                            정식 목록 밖 자리면 SLOT_NOT_ALLOWED 오류. meta.order(숫자, 작을수록 앞).
 *   list(slot)                               기여 목록 [{ cellId, render, order, meta }] — order, cellId 순
 *   collect(slot, ctx)                       (미래 자리는 빈 목록) 기여마다 render(ctx) 를 수밀 격벽(try/catch) 안에서 불러 [{ cellId, ok, value|error }]
 *   withdraw(slot, cellId) / withdrawCell(cellId)   떼어내기(dispose·소멸 때 흔적 0)
 *   slots()                                  자리 목록과 기여 수(상태창·AI 비서가 읽는다)
 *
 * 지금(2026-10-04)은 index.html 에 붙지 않은 골격이다. 첫 사용처는 설정 탭 시범 이전(TASK-ES-354)의 settings.section.
 */
(function (global) {
  'use strict';

  var NAME_RE = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9-]*)+$/;

  // 꽂는 자리 정식 목록 15곳(상민님 확정 2026-10-04). 이 목록에 없는 이름의 자리는 만들 수도, 기여할 수도 없다.
  // 이름은 영문 키, 설명은 한글. host 는 자리의 주인(그 자리를 그리는 세포). future 자리는 등록(기여)만 받고 아직 그리지 않는다.
  var DEFAULT_SLOTS = [
    { name: 'home.card', host: 'home/index', description: '홈 한 화면 카드' },
    { name: 'home.detail', host: 'home/index', description: '홈 자세히 보기' },
    { name: 'checkin.after', host: 'index-html', description: '체크인 직후' },
    { name: 'record.type', host: 'records/index', description: '기록 종류' },
    { name: 'stats.card', host: 'universal-stats', description: '통계 카드' },
    { name: 'goal.template', host: 'goals/index', description: '목표 템플릿' },
    { name: 'goal.detail', host: 'goals/index', description: '목표 상세 칸' },
    { name: 'calendar.source', host: 'calendar/index', description: '캘린더에 올라오는 것' },
    { name: 'feed.card', host: 'comm/index', description: '피드 카드 종류' },
    { name: 'reaction.kind', host: 'reactions', description: '반응 종류' },
    { name: 'notification.kind', host: 'notify-engine', description: '알림 종류' },
    { name: 'settings.section', host: 'settings/index', description: '설정 묶음' },
    { name: 'profile.badge', host: 'settings/sub-profile', description: '프로필 배지' },
    { name: 'share.format', host: 'viral-sharing', description: '공유 형식' },
    { name: 'assistant.skill', host: 'future/ai-assistant', description: 'AI 비서 기술(미래 — 등록만 허용)', future: true }
  ];
  var ALLOWED = DEFAULT_SLOTS.map(function (s) { return s.name; });

  function slotError(code, message) {
    var err = new Error('[OurgoalSlots] ' + message);
    err.code = code;
    return err;
  }

  function SlotBoard() {
    this._slots = new Map();
    var self = this;
    DEFAULT_SLOTS.forEach(function (s) { self.define(s.name, s); });
  }

  SlotBoard.prototype.define = function (slot, meta) {
    if (typeof slot !== 'string' || !NAME_RE.test(slot)) {
      throw slotError('SLOT_BAD_NAME', '자리 이름은 \'영역.종류\' 형식(소문자)이어야 한다: ' + slot);
    }
    if (ALLOWED.indexOf(slot) < 0) {
      throw slotError('SLOT_NOT_ALLOWED', '자리 "' + slot + '" 는 정식 목록 15곳에 없다 — 새 자리는 상민님 확정 후 DEFAULT_SLOTS 에 더한다. 정식 목록: ' + ALLOWED.join(', '));
    }
    var m = meta || {};
    var cur = this._slots.get(slot);
    if (cur) {
      Object.keys(m).forEach(function (k) { if (k !== 'name' && k !== 'future') cur.meta[k] = m[k]; });
      return cur.meta;
    }
    var rec = { meta: { name: slot, host: m.host || null, description: m.description || '', future: m.future === true }, items: new Map() };
    this._slots.set(slot, rec);
    return rec.meta;
  };

  SlotBoard.prototype.has = function (slot) {
    return this._slots.has(slot);
  };

  SlotBoard.prototype.contribute = function (slot, cellId, render, meta) {
    var rec = this._slots.get(slot);
    if (!rec) {
      throw slotError('SLOT_NOT_ALLOWED', '자리 "' + slot + '" 는 정식 목록 15곳에 없다(기여한 세포: ' + cellId + ') — 정식 목록: ' + ALLOWED.join(', '));
    }
    if (typeof cellId !== 'string' || !cellId) throw slotError('SLOT_NO_CELL', '자리 "' + slot + '" 에 기여한 세포 id 가 없다');
    if (typeof render !== 'function') throw slotError('SLOT_BAD_RENDER', '세포 "' + cellId + '" 가 자리 "' + slot + '" 에 준 render 가 함수가 아니다');
    var m = meta || {};
    rec.items.set(cellId, { cellId: cellId, render: render, order: typeof m.order === 'number' ? m.order : 100, meta: m });
    var self = this;
    return function () { self.withdraw(slot, cellId); };
  };

  SlotBoard.prototype.list = function (slot) {
    var rec = this._slots.get(slot);
    if (!rec) return [];
    return Array.from(rec.items.values()).sort(function (a, b) {
      if (a.order !== b.order) return a.order - b.order;
      return a.cellId < b.cellId ? -1 : a.cellId > b.cellId ? 1 : 0;
    });
  };

  SlotBoard.prototype.collect = function (slot, ctx) {
    var rec = this._slots.get(slot);
    if (rec && rec.meta.future) return []; // 미래 자리: 등록만 받고 아직 그리지 않는다
    return this.list(slot).map(function (item) {
      try {
        return { cellId: item.cellId, ok: true, value: item.render(ctx) };
      } catch (err) {
        if (global.OurgoalEvents && typeof global.OurgoalEvents.emit === 'function') {
          global.OurgoalEvents.emit('block:error', { slot: slot, cellId: item.cellId, error: err && err.message ? err.message : String(err) });
        }
        return { cellId: item.cellId, ok: false, error: err && err.message ? err.message : String(err) };
      }
    });
  };

  SlotBoard.prototype.withdraw = function (slot, cellId) {
    var rec = this._slots.get(slot);
    return rec ? rec.items.delete(cellId) : false;
  };

  SlotBoard.prototype.withdrawCell = function (cellId) {
    var removed = 0;
    this._slots.forEach(function (rec) { if (rec.items.delete(cellId)) removed++; });
    return removed;
  };

  SlotBoard.prototype.slots = function () {
    return Array.from(this._slots.values()).map(function (rec) {
      return { name: rec.meta.name, host: rec.meta.host, description: rec.meta.description, future: rec.meta.future, contributions: rec.items.size };
    }).sort(function (a, b) { return a.name < b.name ? -1 : 1; });
  };

  var instance = new SlotBoard();
  instance.SlotBoard = SlotBoard;
  instance.DEFAULT_SLOTS = DEFAULT_SLOTS;
  instance.ALLOWED = ALLOWED;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
  if (typeof global !== 'undefined') {
    global.OurgoalSlots = instance;
  }
})(typeof window !== 'undefined' ? window : globalThis);
