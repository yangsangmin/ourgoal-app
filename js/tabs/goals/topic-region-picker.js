/**
 * OurGoal Topic & Region Picker (목표 탭 — 카테고리·지역 고르기)
 *
 * #TASK-ES-448 (인라인 스크립트 세포화 구역 P2): index.html 인라인 IIFE 에서 동작 그대로 옮겼다. 지도 묶음 G153·G154.
 *   옮긴 선언(이전 전 줄): TOPICS(30381~30390) · topicLabel(30391~30397) · topicPill(30398~30401) · REGIONS(30402~30421) · regionPickerHtml(30422~30431) · wireRegionPicker(30432~30456) · normalizeSubName(30457~30465) · customSubsFor(30466~30479) · categoryPickerHtml(30480~30496) · wireCategoryPicker(30497~30544)
 * TOPICS·topicLabel·topicPill = 카테고리(대범위·중범위) 이름표, REGIONS·regionPickerHtml·wireRegionPicker = 시/도·시군구 고르기,
 * normalizeSubName·customSubsFor·categoryPickerHtml·wireCategoryPicker = 카테고리 고르기(직접 만든 중범위 포함).
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
  var K = global.OurgoalGoalsKit = global.OurgoalGoalsKit || {};

  /* ============ 카테고리 (대범위 · 중범위) ============ */
  var TOPICS = {
    health:   { icon:'💪', label:'운동·건강', subs:['헬스·근력','러닝·마라톤','다이어트','요가·필라테스','등산·아웃도어','식단·영양','구기·라켓'] },
    study:    { icon:'📚', label:'학습·자격', subs:['어학','자격증·시험','대학·입시','코딩·개발','독서','대학원·연구'] },
    career:   { icon:'💼', label:'커리어·머니', subs:['이직·취업','창업·사업','사이드 프로젝트','재테크·투자','절약·가계부'] },
    hobby:    { icon:'🎨', label:'취미·창작', subs:['글쓰기','음악·악기','그림·디자인','사진·영상','요리·베이킹','공예·DIY'] },
    mind:     { icon:'🧘', label:'마음·습관', subs:['명상·멘탈케어','기상·수면','금연·금주','미니멀·정리','일기·회고'] },
    relation: { icon:'🏘️', label:'관계·생활', subs:['육아','반려동물','연애·결혼','가족','봉사·커뮤니티','여행'] }
  };

  function topicLabel(topic){
    if(!topic) return '';
    var parts = String(topic).split('/');
    var t = TOPICS[parts[0]];
    if(!t) return '';
    return t.icon+' '+t.label + (parts[1] ? ' · '+parts[1] : '');
  }

  function topicPill(topic){
    var l = topicLabel(topic);
    return l ? '<span class="topic-pill">'+L.escapeHtml(l)+'</span>' : '';
  }

  /* ============ 지역 (시/도 · 시군구) ============ */
  var REGIONS = {
    '서울': ['강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구'],
    '경기': ['수원시','성남시','고양시','용인시','부천시','안산시','안양시','남양주시','화성시','평택시','의정부시','시흥시','파주시','김포시','광명시','광주시','군포시','하남시','오산시','이천시','안성시','의왕시','양평군','여주시','과천시','구리시','포천시','양주시','동두천시','가평군','연천군'],
    '인천': ['중구','동구','미추홀구','연수구','남동구','부평구','계양구','서구','강화군','옹진군'],
    '부산': ['중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군'],
    '대구': ['중구','동구','서구','남구','북구','수성구','달서구','달성군','군위군'],
    '광주': ['동구','서구','남구','북구','광산구'],
    '대전': ['동구','중구','서구','유성구','대덕구'],
    '울산': ['중구','남구','동구','북구','울주군'],
    '세종': ['세종시'],
    '강원': ['춘천시','원주시','강릉시','동해시','태백시','속초시','삼척시','홍천군','횡성군','영월군','평창군','정선군','철원군','화천군','양구군','인제군','고성군','양양군'],
    '충북': ['청주시','충주시','제천시','보은군','옥천군','영동군','증평군','진천군','괴산군','음성군','단양군'],
    '충남': ['천안시','공주시','보령시','아산시','서산시','논산시','계룡시','당진시','금산군','부여군','서천군','청양군','홍성군','예산군','태안군'],
    '전북': ['전주시','군산시','익산시','정읍시','남원시','김제시','완주군','진안군','무주군','장수군','임실군','순창군','고창군','부안군'],
    '전남': ['목포시','여수시','순천시','나주시','광양시','담양군','곡성군','구례군','고흥군','보성군','화순군','장흥군','강진군','해남군','영암군','무안군','함평군','영광군','장성군','완도군','진도군','신안군'],
    '경북': ['포항시','경주시','김천시','안동시','구미시','영주시','영천시','상주시','문경시','경산시','의성군','청송군','영양군','영덕군','청도군','고령군','성주군','칠곡군','예천군','봉화군','울진군','울릉군'],
    '경남': ['창원시','진주시','통영시','사천시','김해시','밀양시','거제시','양산시','의령군','함안군','창녕군','고성군','남해군','하동군','산청군','함양군','거창군','합천군'],
    '제주': ['제주시','서귀포시']
  };

  function regionPickerHtml(idPrefix, selected){
    var parts = (selected||'').split(' ');
    var curSido = REGIONS[parts[0]] ? parts[0] : '서울';
    return '<div class="cat-major-row" id="'+idPrefix+'Sido">' +
        Object.keys(REGIONS).map(function(k){
          return '<button class="cat-major'+(k===curSido?' active':'')+'" data-sido="'+k+'" type="button">'+k+'</button>';
        }).join('') +
      '</div>' +
      '<div class="cat-sub-grid" id="'+idPrefix+'Gu"></div>';
  }

  function wireRegionPicker(root, idPrefix, ref){
    var sidoRow = root.querySelector('#'+idPrefix+'Sido');
    var guGrid = root.querySelector('#'+idPrefix+'Gu');
    function paintGu(sido){
      guGrid.innerHTML = REGIONS[sido].map(function(g){
        var on = ref.value === (sido+' '+g);
        return '<button class="cat-sub'+(on?' active':'')+'" data-gu="'+L.escapeHtml(g)+'" type="button">'+L.escapeHtml(g)+'</button>';
      }).join('');
      guGrid.querySelectorAll('[data-gu]').forEach(function(b){
        b.addEventListener('click', function(){
          ref.value = sido+' '+b.dataset.gu;
          paintGu(sido);
        });
      });
    }
    sidoRow.querySelectorAll('[data-sido]').forEach(function(b){
      b.addEventListener('click', function(){
        sidoRow.querySelectorAll('[data-sido]').forEach(function(x){ x.classList.remove('active'); });
        b.classList.add('active');
        paintGu(b.dataset.sido);
      });
    });
    var init = (ref.value||'').split(' ')[0];
    paintGu(REGIONS[init] ? init : '서울');
  }

  /* 사용자 추가 중범위 카테고리
     설계 메모: 대범위(6개)는 고정이라 상위 분류는 절대 늘어나지 않고,
     사용자 정의는 항상 '대범위/중범위' 한 컬럼(text)에만 저장된다.
     별도 테이블·조인 없이 topic 인덱스만으로 조회되며,
     선택지는 기존 데이터에서 distinct로 유도하므로 아무리 많이 추가돼도 스키마는 그대로다. */
  function normalizeSubName(s){
    return String(s||'').replace(/[\/\\|]/g,' ').replace(/\s+/g,' ').trim().slice(0,20);
  }

  function customSubsFor(major){
    var found = {};
    function add(topic){
      if(!topic) return;
      var parts = String(topic).split('/');
      if(parts[0]!==major || !parts[1]) return;
      if(TOPICS[major].subs.indexOf(parts[1])!==-1) return;
      found[parts[1]] = true;
    }
    (L.state.profile ? L.state.profile.goals : []).forEach(function(g){ add(g.topic); });
    (L.state.profile && L.state.profile.interests ? L.state.profile.interests : []).forEach(add);
    L.MOCK_GROUPS.forEach(function(g){ add(g.topic); });
    return Object.keys(found);
  }

  /* 대/중 카테고리 선택 UI (모달·폼 공용) */
  function categoryPickerHtml(idPrefix, selected){
    var parts = (selected||'').split('/');
    var curMajor = TOPICS[parts[0]] ? parts[0] : Object.keys(TOPICS)[0];
    var curSub = parts[1] || '';
    return '<div class="cat-major-row" id="'+idPrefix+'Major">' +
        Object.keys(TOPICS).map(function(k){
          return '<button class="cat-major'+(k===curMajor?' active':'')+'" data-major="'+k+'" type="button">'+TOPICS[k].icon+' '+TOPICS[k].label+'</button>';
        }).join('') +
      '</div>' +
      '<div class="cat-sub-grid" id="'+idPrefix+'Sub">' +
        TOPICS[curMajor].subs.map(function(s){
          return '<button class="cat-sub'+(s===curSub?' active':'')+'" data-sub="'+L.escapeHtml(s)+'" type="button">'+L.escapeHtml(s)+'</button>';
        }).join('') +
      '</div>';
  }

  /* 선택 상태를 ref 객체(.value)에 반영 */
  function wireCategoryPicker(root, idPrefix, ref, opts){
    opts = opts || {};
    var majorRow = root.querySelector('#'+idPrefix+'Major');
    var subGrid = root.querySelector('#'+idPrefix+'Sub');
    var extraSubs = {};
    function paintSubs(major){
      var subs = TOPICS[major].subs
        .concat(customSubsFor(major))
        .concat(extraSubs[major] || []);
      var seen = {};
      subs = subs.filter(function(s){ if(seen[s]) return false; seen[s]=true; return true; });
      subGrid.innerHTML = subs.map(function(s){
        var on = ref.value === (major+'/'+s);
        var custom = TOPICS[major].subs.indexOf(s)===-1;
        return '<button class="cat-sub'+(on?' active':'')+'" data-sub="'+L.escapeHtml(s)+'" type="button">'+(custom?'+ ':'')+L.escapeHtml(s)+'</button>';
      }).join('') +
      (opts.allowCustom===false ? '' :
        '<button class="cat-sub" data-addsub="1" type="button" style="border-style:dashed;color:var(--brand-strong);border-color:var(--red-line);">＋ 직접 추가</button>');
      subGrid.querySelectorAll('[data-sub]').forEach(function(b){
        b.addEventListener('click', function(){
          ref.value = major+'/'+b.dataset.sub;
          paintSubs(major);
        });
      });
      var addBtn = subGrid.querySelector('[data-addsub]');
      if(addBtn) addBtn.addEventListener('click', function(){
        var input = window.prompt('추가할 세부 카테고리 이름을 적어주세요 (최대 20자)\r\n대분류: '+TOPICS[major].label);
        if(input===null) return;
        var name = normalizeSubName(input);
        if(!name){ L.toast('이름을 확인해주세요'); return; }
        if(subs.indexOf(name)!==-1){ ref.value = major+'/'+name; paintSubs(major); return; }
        extraSubs[major] = (extraSubs[major]||[]).concat([name]);
        ref.value = major+'/'+name;
        paintSubs(major);
        L.toast('"'+name+'" 카테고리를 추가했어요');
      });
    }
    majorRow.querySelectorAll('[data-major]').forEach(function(b){
      b.addEventListener('click', function(){
        majorRow.querySelectorAll('[data-major]').forEach(function(x){ x.classList.remove('active'); });
        b.classList.add('active');
        paintSubs(b.dataset.major);
      });
    });
    var initMajor = (ref.value||'').split('/')[0];
    paintSubs(TOPICS[initMajor] ? initMajor : Object.keys(TOPICS)[0]);
  }

  K.TOPICS = TOPICS;
  K.topicLabel = topicLabel;
  K.topicPill = topicPill;
  K.REGIONS = REGIONS;
  K.regionPickerHtml = regionPickerHtml;
  K.wireRegionPicker = wireRegionPicker;
  K.normalizeSubName = normalizeSubName;
  K.customSubsFor = customSubsFor;
  K.categoryPickerHtml = categoryPickerHtml;
  K.wireCategoryPicker = wireCategoryPicker;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = K;
  }
})(typeof window !== 'undefined' ? window : globalThis);
