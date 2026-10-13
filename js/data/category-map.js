/* ============================================================
 * 아워골 — 목표 주제 ↔ 피드 카테고리 매핑표 (소통-피드 알고리즘 0단계, #TASK-ES-696, 본질 ③)
 *
 * 왜 필요한가: 목표의 category 값은 깨끗한 키가 아니다(템플릿 키 health·study… 외에 '운동/건강'·'학습/성장'·'일반'
 * 같은 한글 라벨도 들어온다). 피드 카테고리 칩은 18키라 둘이 거의 겹치지 않아, 글을 올릴 때 기본값이
 * 'study'(공부·수험)로 떨어졌다(share-to-feed.js 103~106행). 믿을 수 있는 입력은 goal.topic('대범위/중범위')이다.
 *
 * 규칙:
 *  - 입력 우선순위: topic(대범위/중범위) → category 가 이미 피드 키면 그대로 → category 라벨을 대범위로 정규화 → 제목·본문 정규식 → null (life 로 메우지 않는다).
 *  - 글을 새로 올릴 때만 호출 쪽이 null 을 'life' 로 바꾼다(사용자가 칩으로 고칠 수 있다). 과거 글 채우기는 null 그대로.
 *  - 이 표는 docs/sql/2026-10-13-feed-posts-category-columns.sql 의 feed_category_of() 와 내용이 같아야 한다.
 *    tests/feed-category-map.test.js 가 두 사본의 일치를 검사한다.
 *  - '넓히기' 인접 카테고리는 같은 대범위 안으로만(대범위를 넘는 인접 금지 — 독립 검토 2026-10-13).
 *
 * 정본 설계: 「아워골 소통-피드 알고리즘 정립 보고서」 3-4·3-5절 (Claude Docs, 2026-10-13).
 * 브라우저에서는 window.OurgoalCategoryMap, node 테스트에서는 module.exports.
 * ============================================================ */
(function (global) {
  'use strict';

  /* 피드 카테고리 18키 — js/tabs/comm/feed-list.js categories · js/tabs/records/share-to-feed.js FEED_CATEGORIES_10 과 같은 순서·라벨 */
  var FEED_CATEGORIES = [
    { key: 'study',       label: '공부·수험',    major: 'study' },
    { key: 'dev',         label: '개발·기획',    major: 'study' },
    { key: 'workout',     label: '운동·헬스',    major: 'health' },
    { key: 'running',     label: '러닝·마라톤',  major: 'health' },
    { key: 'diet',        label: '다이어트·식단', major: 'health' },
    { key: 'career',      label: '커리어·취업',  major: 'career' },
    { key: 'sideproject', label: '창업·사이드',  major: 'career' },
    { key: 'finance',     label: '재테크·투자',  major: 'career' },
    { key: 'life',        label: '생활·루틴',    major: 'mind' },
    { key: 'morning',     label: '기상·모닝루틴', major: 'mind' },
    { key: 'parenting',   label: '육아·가족',    major: 'relation' },
    { key: 'pet',         label: '반려동물',     major: 'relation' },
    { key: 'relation',    label: '관계·소통',    major: 'relation' },
    { key: 'reading',     label: '독서·인문',    major: 'study' },
    { key: 'hobby',       label: '취미·창작',    major: 'hobby' },
    { key: 'mental',      label: '멘탈·마인드',  major: 'mind' },
    { key: 'clean',       label: '정리·미니멀',  major: 'mind' },
    { key: 'travel',      label: '여행·아웃도어', major: 'relation' }
  ];
  var FEED_KEYS = FEED_CATEGORIES.map(function (c) { return c.key; });
  var FEED_LABEL = {};
  var FEED_MAJOR = {};
  FEED_CATEGORIES.forEach(function (c) { FEED_LABEL[c.key] = c.label; FEED_MAJOR[c.key] = c.major; });

  /* 목표 대범위 6 (js/tabs/goals/topic-region-picker.js TOPICS) → 중범위 → 피드 키. 'default' 는 중범위가 없거나 표 밖일 때 */
  var TOPIC_MAP = {
    health:   { default: 'workout', subs: { '헬스·근력': 'workout', '러닝·마라톤': 'running', '다이어트': 'diet', '요가·필라테스': 'workout', '등산·아웃도어': 'travel', '식단·영양': 'diet', '구기·라켓': 'workout' } },
    study:    { default: 'study',   subs: { '어학': 'study', '자격증·시험': 'study', '대학·입시': 'study', '코딩·개발': 'dev', '독서': 'reading', '대학원·연구': 'study' } },
    career:   { default: 'career',  subs: { '이직·취업': 'career', '창업·사업': 'sideproject', '사이드 프로젝트': 'sideproject', '재테크·투자': 'finance', '절약·가계부': 'finance' } },
    hobby:    { default: 'hobby',   subs: { '글쓰기': 'hobby', '음악·악기': 'hobby', '그림·디자인': 'hobby', '사진·영상': 'hobby', '요리·베이킹': 'hobby', '공예·DIY': 'hobby' } },
    mind:     { default: 'mental',  subs: { '명상·멘탈케어': 'mental', '기상·수면': 'morning', '금연·금주': 'life', '미니멀·정리': 'clean', '일기·회고': 'mental' } },
    relation: { default: 'relation', subs: { '육아': 'parenting', '반려동물': 'pet', '연애·결혼': 'relation', '가족': 'relation', '봉사·커뮤니티': 'relation', '여행': 'travel' } }
  };
  var MAJORS = Object.keys(TOPIC_MAP);

  /* goal.category 에 실제로 들어오는 라벨 → 대범위. 모르는 값은 null (goal-fast-add.js 47행 · goals-ia-actions.js 78행 · new-goal-modal.js 'etc') */
  var LABEL_TO_MAJOR = {
    'health': 'health', 'study': 'study', 'career': 'career', 'hobby': 'hobby', 'mind': 'mind', 'relation': 'relation',
    '운동/건강': 'health', '운동·건강': 'health', '학습/성장': 'study', '학습·자격': 'study', '커리어': 'career', '커리어/머니': 'career', '커리어·머니': 'career',
    '습관/루틴': 'mind', '마음·습관': 'mind', '취미·창작': 'hobby', '관계·생활': 'relation', '관계/생활': 'relation'
  };

  /* 제목·본문 정규식 — js/core/virtual-user-helpers.js filterFeedByCategory 와 같은 단어 목록. 더 좁은 키를 먼저 본다(러닝 → 운동, 독서 → 공부). */
  var TEXT_RULES = [
    ['running',     /러닝|달리기|마라톤|조깅|페이스트레이닝|10k|하프마라톤|풀코스/i],
    ['diet',        /식단|다이어트|칼로리|단백질|클린식단|간헐적단식|체중|샐러드/i],
    ['workout',     /운동|헬스|체력|바디프로필|웨이트|필라테스|테니스|수영|인터벌|근력/i],
    ['dev',         /개발|코딩|깃허브|알고리즘|오픈소스|백준|디자인|ui|ux|saas|프론트|백엔드/i],
    ['reading',     /독서|서평|인문|독서모임|완독|필사|리딩/i],
    ['study',       /토익|공부|시험|자격증|수험|독서실|회독|강의|leet|cpa|노무사|간호|국시|기출/i],
    ['sideproject', /사이드프로젝트|창업|수익화|bm|출시|런칭/i],
    ['finance',     /재테크|투자|주식|저축|가계부|부동산|예금|펀드|자산/i],
    ['career',      /취업|인턴|이직|매출|사업|마케터|세일즈|영업|스타트업|hr|포트폴리오|이력서|면접|직무|승진/i],
    ['morning',     /기상|모닝루틴|미라클모닝|새벽기상|기상인증|아침시간|수면패턴/i],
    ['clean',       /정리|청소|미니멀|비우기|청결|방청소|분리수거/i],
    ['mental',      /멘탈|마인드|명상|일기|감사|회고|스트레스|휴식|힐링|마음/i],
    ['parenting',   /육아|자녀|아이|등하원|이유식|부모|어린이집|유치원/i],
    ['pet',         /반려동물|강아지|고양이|반려견|반려묘|펫/i],
    ['travel',      /여행|아웃도어|등산|캠핑|트레킹|나들이|휴가/i],
    ['relation',    /인간관계|가족|친구|연애|결혼|소통|대화|부부/i],
    ['hobby',       /음악|그림|공연|웹툰|댄스|사진|자작곡|뮤지컬|베이커리|로스팅|공예/i],
    ['life',        /생활|습관|루틴|일상|규칙|절제|라이프|하루/i]
  ];

  function isFeedKey(k) { return !!k && FEED_KEYS.indexOf(String(k)) > -1; }

  /* 'health/러닝·마라톤' → { major:'health', sub:'러닝·마라톤' } */
  function parseTopic(topic) {
    if (!topic) return null;
    var parts = String(topic).split('/');
    var major = String(parts[0] || '').trim();
    var sub = String(parts.slice(1).join('/') || '').trim();
    if (!TOPIC_MAP[major]) {
      var m = LABEL_TO_MAJOR[major] || null;   /* 대범위 자리에 한글 라벨이 온 경우 */
      if (!m) return null;
      major = m;
    }
    return { major: major, sub: sub };
  }

  function fromTopic(topic) {
    var t = parseTopic(topic);
    if (!t) return null;
    var row = TOPIC_MAP[t.major];
    if (t.sub && row.subs[t.sub]) return row.subs[t.sub];
    return row.default;
  }

  function majorOfCategory(category) {
    if (!category) return null;
    var c = String(category).trim();
    if (LABEL_TO_MAJOR[c]) return LABEL_TO_MAJOR[c];
    return null;
  }

  function fromCategoryLabel(category) {
    var major = majorOfCategory(category);
    return major ? TOPIC_MAP[major].default : null;
  }

  function fromText(title, caption) {
    var text = ((title || '') + ' ' + (caption || '')).toLowerCase();
    if (!text.trim()) return null;
    for (var i = 0; i < TEXT_RULES.length; i++) {
      if (TEXT_RULES[i][1].test(text)) return TEXT_RULES[i][0];
    }
    return null;
  }

  /* 한 글(또는 목표)의 피드 카테고리. 못 찾으면 null — 호출 쪽이 새 글일 때만 'life' 로 바꾼다. */
  function resolve(input) {
    input = input || {};
    var k = fromTopic(input.topic);                                      /* 1순위: 목표 topic(대범위/중범위) */
    if (k) return k;
    if (isFeedKey(input.category)) return String(input.category);       /* 2순위: 이미 피드 키(글의 extra.category — 사용자가 고른 칩) */
    k = fromCategoryLabel(input.category);
    if (k) return k;
    return fromText(input.title, input.caption);
  }

  function fromGoal(goal) {
    if (!goal) return null;
    return resolve({ topic: goal.topic, category: goal.category, title: goal.title, caption: '' });
  }

  /* 같은 대범위 안의 인접 카테고리(자기 자신 제외). '넓히기' 묶음은 이 밖으로 나가지 않는다. */
  function adjacent(key) {
    var major = FEED_MAJOR[key];
    if (!major) return [];
    return FEED_KEYS.filter(function (k) { return k !== key && FEED_MAJOR[k] === major; });
  }

  /* ---- 글 메타(0단계에서 feed_posts 에 더한 일곱 칸) ----
   * goal: 글의 바탕 목표(없으면 null) · group: 팀 완주 글의 팀(없으면 null) · opts: { contentType, pct, categoryOverride }
   * 반환 객체는 feed_posts 컬럼 이름 그대로다. 호출 쪽은 Object.assign(post, meta) 하고 extra 에도 같은 값을 복사한다. */
  var CONTENT_TYPES = ['record', 'howto', 'question', 'milestone', 'team_done'];
  var META_COLUMNS = ['category', 'goal_id', 'group_id', 'content_type', 'author_pct', 'topic', 'goal_visibility'];

  function feedPostMeta(goal, group, opts) {
    opts = opts || {};
    var topic = (goal && goal.topic) || (group && group.topic) || null;
    var category = isFeedKey(opts.categoryOverride) ? opts.categoryOverride
      : (resolve({ topic: topic, category: goal && goal.category, title: (goal && goal.title) || (group && group.name), caption: opts.caption }) || 'life');
    var pct = (typeof opts.pct === 'number' && isFinite(opts.pct)) ? Math.max(0, Math.min(100, Math.round(opts.pct))) : null;
    var ct = CONTENT_TYPES.indexOf(opts.contentType) > -1 ? opts.contentType : (group ? 'team_done' : 'record');
    return {
      category: category,
      goal_id: (goal && goal.id) ? String(goal.id) : null,
      group_id: (group && group.id) ? String(group.id) : null,
      content_type: ct,
      author_pct: pct,
      topic: topic ? String(topic) : null,
      goal_visibility: (goal && goal.visibility) ? String(goal.visibility) : null
    };
  }

  /* 서버에 새 칸이 아직 없을 때(SQL 미실행) insert 가 PGRST204/42703 으로 거절되면 메타 칸을 떼고 한 번 더 넣는다.
     extra 안에는 같은 값이 남아 있어 나중에 채우기 RPC 가 복원한다. */
  function isMissingColumn(err) {
    if (!err) return false;
    var code = String(err.code || '');
    var msg = String(err.message || '');
    return code === 'PGRST204' || code === '42703' || /column .* does not exist|Could not find the '.*' column/i.test(msg);
  }

  function stripMeta(post) {
    var out = {};
    Object.keys(post || {}).forEach(function (k) { if (META_COLUMNS.indexOf(k) === -1) out[k] = post[k]; });
    return out;
  }

  function withMeta(post, meta) {
    var p = Object.assign({}, post, meta);
    p.extra = Object.assign({}, post.extra || {}, {
      category: meta.category, goalId: meta.goal_id, groupId: meta.group_id, contentType: meta.content_type,
      topic: meta.topic, goalVisibility: meta.goal_visibility
    });
    if (meta.author_pct !== null && meta.author_pct !== undefined) p.extra.goalPct = meta.author_pct;
    return p;
  }

  /* thenable 이면 then, 아니면 바로 — supabase 는 thenable 을 돌려주고, 시험지의 가짜 클라이언트는 값을 바로 돌려준다 */
  function chain(x, fn) { return (x && typeof x.then === 'function') ? x.then(fn) : fn(x); }

  /* supabase insert 는 에러를 던지지 않고 { error } 로 돌려준다. 그 모양을 그대로 돌려준다(가짜 클라이언트면 동기 값). */
  function insertFeedPost(sb, post) {
    if (!sb || !sb.from) return { error: { message: 'no client' } };
    return chain(sb.from('feed_posts').insert(post), function (res) {
      if (res && res.error && isMissingColumn(res.error)) {
        return chain(sb.from('feed_posts').insert(stripMeta(post)), function (r2) {
          if (r2) r2.metaStripped = true;
          return r2;
        });
      }
      return res;
    });
  }

  /* 팀 완주 글: 메타(team_done, 팀 topic 카테고리) + 팀 배지 + 재시도 insert 를 한 줄로 — team-goals-screen.js 가 800줄 상한을 넘지 않게 */
  function insertTeamDonePost(sb, post, group) {
    var p = withMeta(post, feedPostMeta(null, group, { contentType: 'team_done', pct: 100, caption: post && post.caption }));
    p.extra.badge = '팀 완주 🏆'; p.extra.isTeamCompletion = true;
    return insertFeedPost(sb, p);
  }

  var api = {
    FEED_CATEGORIES: FEED_CATEGORIES, FEED_KEYS: FEED_KEYS, FEED_LABEL: FEED_LABEL, FEED_MAJOR: FEED_MAJOR,
    TOPIC_MAP: TOPIC_MAP, MAJORS: MAJORS, LABEL_TO_MAJOR: LABEL_TO_MAJOR, TEXT_RULES: TEXT_RULES,
    CONTENT_TYPES: CONTENT_TYPES, META_COLUMNS: META_COLUMNS,
    isFeedKey: isFeedKey, parseTopic: parseTopic, fromTopic: fromTopic, majorOfCategory: majorOfCategory,
    fromCategoryLabel: fromCategoryLabel, fromText: fromText, resolve: resolve, fromGoal: fromGoal, adjacent: adjacent,
    feedPostMeta: feedPostMeta, withMeta: withMeta, stripMeta: stripMeta, isMissingColumn: isMissingColumn, insertFeedPost: insertFeedPost, insertTeamDonePost: insertTeamDonePost
  };

  if (global) global.OurgoalCategoryMap = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null));
