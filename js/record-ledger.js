/* [#TASK-ES-344] REC-01 기록 원장 — checkins 행 변환·meta 보존·서버/로컬 id 병합
 * 브라우저(window.OurgoalRecordLedger)와 서버(api/track.js require) 가 같은 규칙을 쓴다.
 * - meta(jsonb): 전용 칸이 없는 기록 필드(goalId·laps·durationMs·durationMinutes·visibility·isSample·title)를 묶어 둔다.
 * - upsertCheckinRows: 컬럼이 아직 없는 DB 에서도 저장이 끊기지 않게 meta → theme/category 순으로 빼고 재시도한다.
 * - mergeServerRecords: 전체 교체 대신 id 기준 병합. 로컬 미동기화 기록은 보존, 휴지통으로 지운 기록은 되살리지 않는다. */
(function (root) {
  'use strict';

  var META_FIELDS = ['goalId', 'laps', 'durationMs', 'durationMinutes', 'visibility', 'isSample', 'title'];

  function buildRecordMeta(r) {
    if (!r || typeof r !== 'object') return null;
    var meta = {};
    var n = 0;
    META_FIELDS.forEach(function (k) {
      if (r[k] !== undefined && r[k] !== null) { meta[k] = r[k]; n++; }
    });
    return n ? meta : null;
  }

  /* meta 를 기록 객체로 풀어 넣는다. 이미 값이 있는 칸은 덮지 않는다. */
  function applyRecordMeta(rec, meta) {
    if (!rec || !meta || typeof meta !== 'object') return rec;
    META_FIELDS.forEach(function (k) {
      if (meta[k] !== undefined && meta[k] !== null && (rec[k] === undefined || rec[k] === null)) rec[k] = meta[k];
    });
    return rec;
  }

  function toCheckinRow(r, userId) {
    return {
      id: r.id,
      user_id: userId,
      type: r.type || 'note',
      text: r.text || '',
      start_at: r.startAt || r.start_at || undefined,
      end_at: r.endAt || r.end_at || null,
      category: r.category || null,
      theme: r.theme || null,
      sub_theme: r.subTheme || r.sub_theme || null,
      theme_confidence: r.themeConfidence || r.theme_confidence || null,
      meta: buildRecordMeta(r)
    };
  }

  function fromCheckinRow(row) {
    var rec = {
      id: row.id,
      type: row.type,
      text: row.text,
      startAt: row.start_at,
      endAt: row.end_at,
      createdAt: row.created_at,
      category: row.category || null,
      theme: row.theme || null,
      subTheme: row.sub_theme || null,
      themeConfidence: row.theme_confidence || null
    };
    return applyRecordMeta(rec, row.meta);
  }

  function isLiveRow(row) { return !!row && !row.deleted_at; }

  /* 저장 오류 메시지를 보고 없는 컬럼을 빼며 최대 3번 재시도한다(기존 theme/category 재시도 패턴 확장). */
  async function upsertCheckinRows(sb, rows) {
    var cur = rows;
    var res = await sb.from('checkins').upsert(cur);
    for (var attempt = 0; attempt < 3 && res && res.error; attempt++) {
      var msg = String(res.error.message || '');
      var dropMeta = /meta/i.test(msg);
      var dropTheme = /theme/i.test(msg);
      var dropCat = /category/i.test(msg);
      if (!dropMeta && !dropTheme && !dropCat) break;
      cur = cur.map(function (x) {
        var y = Object.assign({}, x);
        if (dropMeta) delete y.meta;
        if (dropTheme) { delete y.theme; delete y.sub_theme; delete y.theme_confidence; }
        if (dropCat) delete y.category;
        return y;
      });
      res = await sb.from('checkins').upsert(cur);
    }
    return res;
  }

  /* 서버 기록을 로컬 기록에 id 기준으로 합친다.
   * opts.deletedIds: 로컬에서 지운 기록 id(휴지통) — 서버에 살아 있어도 되살리지 않는다.
   * opts.preferServer: true 면 둘 다 있는 기록은 서버 값이 우선(로컬에만 있는 칸은 유지). false 면 로컬 우선, 빈 칸만 서버로 채운다. */
  function mergeServerRecords(localRecords, serverRecords, opts) {
    opts = opts || {};
    var local = Array.isArray(localRecords) ? localRecords : [];
    var server = Array.isArray(serverRecords) ? serverRecords : [];
    var deleted = {};
    (opts.deletedIds || []).forEach(function (id) { if (id) deleted[String(id)] = true; });

    var byId = {};
    var out = [];
    local.forEach(function (r) {
      if (!r) return;
      var copy = Object.assign({}, r);
      out.push(copy);
      if (r.id !== undefined && r.id !== null) byId[String(r.id)] = copy;
    });

    var added = 0, filled = 0, skippedDeleted = 0;
    server.forEach(function (s) {
      if (!s || s.id === undefined || s.id === null) return;
      if (s.deleted_at || s.deletedAt) { skippedDeleted++; return; }
      var key = String(s.id);
      if (deleted[key]) { skippedDeleted++; return; }
      var have = byId[key];
      if (!have) {
        var nr = Object.assign({}, s);
        out.push(nr);
        byId[key] = nr;
        added++;
        return;
      }
      Object.keys(s).forEach(function (k) {
        var sv = s[k];
        if (sv === undefined || sv === null) return;
        var lv = have[k];
        if (lv === undefined || lv === null || lv === '') { have[k] = sv; filled++; }
        else if (opts.preferServer && JSON.stringify(lv) !== JSON.stringify(sv)) { have[k] = sv; filled++; }
      });
    });

    if (added) {
      out.sort(function (a, b) {
        var ta = Date.parse(a.startAt || a.createdAt || '') || 0;
        var tb = Date.parse(b.startAt || b.createdAt || '') || 0;
        return tb - ta;
      });
    }
    return { records: out, added: added, filled: filled, skippedDeleted: skippedDeleted, changed: (added + filled) > 0 };
  }

  /* 휴지통에 있는 기록 id 목록 */
  function trashRecordIds(trash) {
    return (Array.isArray(trash) ? trash : [])
      .filter(function (t) { return t && t.entityType === 'record' && t.originalId; })
      .map(function (t) { return String(t.originalId); });
  }

  var api = {
    META_FIELDS: META_FIELDS,
    buildRecordMeta: buildRecordMeta,
    applyRecordMeta: applyRecordMeta,
    toCheckinRow: toCheckinRow,
    fromCheckinRow: fromCheckinRow,
    isLiveRow: isLiveRow,
    upsertCheckinRows: upsertCheckinRows,
    mergeServerRecords: mergeServerRecords,
    trashRecordIds: trashRecordIds
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.OurgoalRecordLedger = api;
})(typeof window !== 'undefined' ? window : null);
