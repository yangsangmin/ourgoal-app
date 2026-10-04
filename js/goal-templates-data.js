/* ============ 아워골 6대 카테고리 60대 전문가 목표 템플릿 모듈 ============ */
(function(root, factory) {
  var exp = factory();
  if (typeof module === 'object' && module && module.exports) {
    module.exports = exp;
  }
  if (typeof root !== 'undefined' && root) {
    root.OURGOAL_60_TEMPLATES = exp;
  }
  if (typeof window !== 'undefined' && window) {
    window.OURGOAL_60_TEMPLATES = exp;
  }
  if (typeof global !== 'undefined' && global) {
    global.OURGOAL_60_TEMPLATES = exp;
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  // #TASK-ES-364: 템플릿 60종 데이터는 카테고리 6개 파일(js/data/goal-templates/<category>.js)에 있다.
  // 브라우저: index.html 이 이 파일보다 먼저 6개를 읽어 OurgoalGoalTemplateParts 에 둔다. Node: require 로 읽는다.
  // 원래 배열과 같은 순서로 잇는다 — 동일성 시험 tests/goal-templates-data-split.test.js
  var PART_ORDER = ['health', 'study', 'career', 'hobby', 'mind', 'relation'];
  function loadParts() {
    if (typeof module === 'object' && module && module.exports && typeof require === 'function') {
      return {
        health: require('./data/goal-templates/health.js'),
        study: require('./data/goal-templates/study.js'),
        career: require('./data/goal-templates/career.js'),
        hobby: require('./data/goal-templates/hobby.js'),
        mind: require('./data/goal-templates/mind.js'),
        relation: require('./data/goal-templates/relation.js')
      };
    }
    var host = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : null);
    return (host && host.OurgoalGoalTemplateParts) || {};
  }
  var PARTS = loadParts();
  var TEMPLATES = [];
  PART_ORDER.forEach(function(cat) {
    var part = PARTS[cat];
    if (part && part.length) TEMPLATES.push.apply(TEMPLATES, part);
  });
  TEMPLATES.forEach(function(t){ t.isAi = true; });

  return {
    list: TEMPLATES,
    getByCategory: function(cat) {
      if (!cat || cat === 'all') return TEMPLATES;
      return TEMPLATES.filter(function(t) { return t.category === cat; });
    },
    getById: function(id) {
      if (!id) return null;
      var clean = String(id).toLowerCase().replace(/-/g, '_');
      return TEMPLATES.find(function(t) {
        return t.id === clean || t.tplId.toLowerCase() === clean;
      }) || null;
    },
    search: function(keyword) {
      if (!keyword) return TEMPLATES;
      var q = String(keyword).toLowerCase().trim();
      return TEMPLATES.filter(function(t) {
        return t.title.toLowerCase().indexOf(q) !== -1 ||
               t.categoryMinor.toLowerCase().indexOf(q) !== -1 ||
               t.desc.toLowerCase().indexOf(q) !== -1 ||
               t.expertPoint.toLowerCase().indexOf(q) !== -1;
      });
    }
  };
});
