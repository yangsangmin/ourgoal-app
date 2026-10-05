// 60대 전문가 인기 목표 템플릿 레지스트리 (api/goaltemplate.js 스마트 폴백 연동용)
// #TASK-ES-425 세포 분열: 분야별 자료는 js/data/expert-templates/<분야>.js 로 글자 그대로 옮겼다. 여기서는 같은 순서로 같은 이름에 다시 모은다.
// (부품은 require 로만 읽힌다 — 이 파일은 원래부터 서버 전용 CommonJS 다)
var MATCH_RULES = [];
var TEMPLATE_MAP = {};
(function() {
  var parts = typeof require === 'function' ? [
    require('./data/expert-templates/health.js'),
    require('./data/expert-templates/study.js'),
    require('./data/expert-templates/career.js'),
    require('./data/expert-templates/hobby.js'),
    require('./data/expert-templates/mind.js'),
    require('./data/expert-templates/relation.js')
  ] : [];
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    for (var j = 0; j < part.MATCH_RULES.length; j++) MATCH_RULES.push(part.MATCH_RULES[j]);
    for (var k in part.TEMPLATE_MAP) {
      if (Object.prototype.hasOwnProperty.call(part.TEMPLATE_MAP, k)) TEMPLATE_MAP[k] = part.TEMPLATE_MAP[k];
    }
  }
})();

// 런타임 RegExp 객체 캐시
var COMPILED_RULES = MATCH_RULES.map(function(r) {
  return {
    reg: new RegExp(r.pattern, r.flags),
    id: r.id
  };
});

function findExpertTemplate(text) {
  if (!text) return null;
  var s = String(text).trim();
  for (var i = 0; i < COMPILED_RULES.length; i++) {
    var rule = COMPILED_RULES[i];
    if (rule.reg.test(s)) {
      var tmpl = TEMPLATE_MAP[rule.id];
      if (tmpl) {
        return {
          title: tmpl.title,
          topicMajor: tmpl.topicMajor,
          topicMinor: tmpl.topicMinor,
          milestones: tmpl.milestones,
          kpi: tmpl.kpi,
          expertPoint: tmpl.expertPoint,
          source: 'expert_template_60',
          matchedRuleId: rule.id
        };
      }
    }
  }
  return null;
}

function formatScheduleBackgroundLayout(images) {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return { count: 0, layout: 'none', images: [] };
  }
  var validImages = images.slice(0, 2);
  if (validImages.length === 1) {
    return { count: 1, layout: 'single_full', images: validImages };
  }
  return { count: 2, layout: 'split_50_50', images: validImages };
}

module.exports = {
  findExpertTemplate: findExpertTemplate,
  TEMPLATE_MAP: TEMPLATE_MAP,
  MATCH_RULES: MATCH_RULES,
  formatScheduleBackgroundLayout: formatScheduleBackgroundLayout
};
