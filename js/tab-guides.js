/**
 * OurGoal All Tabs Usage Guide System
 * 5대 핵심 탭(홈, 목표, 일정, 소통, 설정) 특화 가이드 모달 엔진
 * 티켓: #TASK-ES-102
 */
(function(){
  var TAB_GUIDES = {
    home: {
      icon: '🏠',
      badge: 'Home Cockpit',
      title: '아워골 홈 화면 100% 활용법',
      subtitle: '매일의 작은 실천이 모여 확실한 변화를 만드는 루틴 콕핏',
      sections: [
        {
          color: '#3b82f6',
          title: '1. 오늘 한 줄 체크인 & 스트릭',
          desc: '거창한 일기가 아닌 "지금 막 한 작은 실천"을 편하게 적으세요. 기록하는 순간 스트릭(연속 달성일)이 쌓이고 성취 그래프에 즉각 반영됩니다.'
        },
        {
          color: '#10b981',
          title: '2. 오늘의 3대 데일리 퀘스트 (+120 EXP)',
          desc: '① 한 줄 체크인 남기기(+30) ② 마일스톤 1개 실행(+40) ③ 25분 집중 시간기록(+50)을 완료하여 매일 100% 보너스 달성감을 얻고 레벨을 올리세요.'
        },
        {
          color: '#8b5cf6',
          title: '3. 3대 맞춤 AI 피드백 모드',
          desc: '기본(3문장 요약/행동 권고), 중간(페이스 조율/루틴 마찰점 진단), 정밀(가상 레일/캘린더 연계) 중 내 컨디션에 알맞은 피드백을 저장 즉시 받아보세요.'
        },
        {
          color: '#f59e0b',
          title: '4. 오늘의 미션 (할 일이 안 떠오를 때)',
          desc: '오늘 당장 무엇을 해야 할지 막막할 때, AI가 내 목표에 맞춰 추천하는 맞춤형 미션을 확인하고 망설임 없이 행동을 개시하세요.'
        }
      ]
    },
    goals: {
      icon: '🎯',
      badge: 'Goal Hierarchy',
      title: '아워골 목표 관리 100% 활용법',
      subtitle: '거대한 꿈을 매일의 만만한 행동으로 쪼개는 3계층 로드맵',
      sections: [
        {
          color: '#3b82f6',
          title: '1. 3계층 목표 분할 시스템',
          desc: '최종 비전(목표)을 3~5개의 디딤돌(마일스톤)과 오늘 할 수 있는 구체적 행동(할 일)으로 세분화하여 실행의 압도감을 원천 제거합니다.'
        },
        {
          color: '#10b981',
          title: '2. 실시간 진행률 & D-day 동적 추적',
          desc: '마일스톤을 체크할 때마다 진행률 게이지가 실시간 상승하며 목표 도달 예정일을 동적으로 재계산하여 페이스를 조절해줍니다.'
        },
        {
          color: '#8b5cf6',
          title: '3. 팀 목표 (크루 & 함께 목표방)',
          desc: '스터디, 운동, 프로젝트 등 같은 지향점을 가진 동료들과 함께 목표방을 만들고 서로의 진척도를 투명하게 나누며 시너지를 냅니다.'
        },
        {
          color: '#f59e0b',
          title: '4. AI 목표 생성 도우미',
          desc: '하고 싶은 일을 줄글로 적으면 AI가 최적의 마일스톤과 주차별 실행 계획을 자동으로 수립해 드립니다.'
        }
      ]
    },
    calendar: {
      icon: '📅',
      badge: 'Time & Schedule',
      title: '아워골 일정 및 캘린더 100% 활용법',
      subtitle: '목표와 마감, 시간표가 유기적으로 맞물리는 4차원 실행 일정표',
      sections: [
        {
          color: '#3b82f6',
          title: '1. 캘린더 & 시간표 듀얼 뷰',
          desc: '월간 캘린더 뷰로 장기적인 마일스톤 마감을 조망하고, 일간 시간표 뷰로 오늘 하루의 24시간 블록을 밀도 있게 계획합니다.'
        },
        {
          color: '#10b981',
          title: '2. 목표 마일스톤 자동 동기화',
          desc: '목표 탭에서 설정한 핵심 마감일이 캘린더에 자동으로 배선되어 별도의 중복 입력 없이 마감 시한을 빈틈없이 관리합니다.'
        },
        {
          color: '#8b5cf6',
          title: '3. 일정별 참고자료 (유튜브/링크/메모) 첨부',
          desc: '일정 카드마다 운동 루틴 영상, 공부 자료 링크, 준비물 메모를 첨부하여 당일 실행 시 1초 만에 확인하고 집중할 수 있습니다.'
        },
        {
          color: '#f59e0b',
          title: '4. 외부 캘린더 (WebCal / 구글) 구독 연동',
          desc: '아워골의 일정을 애플 캘린더, 구글 캘린더 등 자주 쓰는 캘린더 앱에 실시간 WebCal 구독 링크로 동기화할 수 있습니다.'
        }
      ]
    },
    comm: {
      icon: '💬',
      badge: 'Social & Feed',
      title: '아워골 소통 탭 100% 활용법',
      subtitle: '고독한 싸움이 아닌, 동류와 함께 응원하고 나누는 건강한 성장 광장',
      sections: [
        {
          color: '#3b82f6',
          title: '1. 같은 목표를 달리는 동류 러너 매칭',
          desc: '나와 비슷한 카테고리(운동, 개발, 어학, 자격증 등)의 목표를 가진 사람들의 실천 기록을 탐색하고 자극을 얻습니다.'
        },
        {
          color: '#10b981',
          title: '2. 진정성 있는 4대 피드 리액션',
          desc: '‘응원해요’, ‘도움돼요’, ‘조언해요’ 등 영양가 있는 피드백을 주고받으며 혼자 할 때보다 3배 오래 지속하는 추진력을 얻습니다.'
        },
        {
          color: '#8b5cf6',
          title: '3. 매일의 마니또 익명 응원 릴레이',
          desc: '오늘 하루 나에게 매칭된 마니또에게 따뜻한 응원 스탬프를 전하며 커뮤니티의 끈끈한 유대감을 경험합니다.'
        },
        {
          color: '#ef4444',
          title: '4. 청정 자정 시스템 (신고 & 사용자 차단)',
          desc: '불쾌한 글은 [신고](누적 시 자동 블라인드)하고 악성 유저는 [차단]하여 내 피드에서 즉시 숨길 수 있는 철저한 UGC 보호망이 가동됩니다.'
        }
      ]
    },
    settings: {
      icon: '⚙️',
      badge: 'System & Sovereignty',
      title: '아워골 설정 100% 활용법',
      subtitle: '100% 데이터 주권과 나만의 AI 페르소나를 관리하는 컨트롤 센터',
      sections: [
        {
          color: '#3b82f6',
          title: '1. 100% 데이터 주권 & 3중 백업',
          desc: '유저의 모든 기록과 목표는 기기와 클라우드에 안전하게 보존되며, [내 데이터 전체 복원 및 동기화]를 통해 언제든 무손실 복구됩니다.'
        },
        {
          color: '#10b981',
          title: '2. Gemini 멀티모달 AI 아바타 커스텀',
          desc: '구글 Gemini 비전 AI가 내 특징을 분석해 제작하는 고유한 캐릭터 아바타와 다크/라이트 프로 콕핏 테마를 취향대로 설정하세요.'
        },
        {
          color: '#8b5cf6',
          title: '3. 집중 방해 없는 스마트 체크인 푸시',
          desc: '내가 정한 저녁 체크인 알림 시각에만 절제된 알림을 수신하여 하루의 성취를 빼놓지 않고 온전히 매듭짓습니다.'
        },
        {
          color: '#10b981',
          title: '4. P0 보안 & 공식 전담 지원',
          desc: '30일 탈퇴 유예 안전망, 비밀번호 암호화, 공식 업무용 고객지원 채널(support@ourgoal.kr)로 유저의 권익을 완벽하게 보호합니다.'
        }
      ]
    }
  };

  function showTabUsageGuide(tabKey){
    var g = TAB_GUIDES[tabKey];
    if(!g) return;

    var sectionsHtml = g.sections.map(function(s){
      return '<div class="card" style="padding:12px 14px;border-radius:12px;background:var(--card);border-left:4px solid ' + s.color + ';margin:0 0 10px 0;box-shadow:0 1px 4px rgba(0,0,0,0.06);">' +
        '<div style="font-weight:800;font-size:.875rem;color:' + s.color + ';margin-bottom:4px;">' + s.title + '</div>' +
        '<div style="font-size:.8125rem;color:var(--ink);line-height:1.5;">' + s.desc + '</div>' +
      '</div>';
    }).join('');

    var modalHtml = 
      '<div style="max-height:75vh;overflow-y:auto;padding:6px 2px;">' +
        '<div style="text-align:center;margin-bottom:16px;">' +
          '<div style="font-size:2.2rem;margin-bottom:6px;">' + g.icon + '</div>' +
          '<span style="display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;background:rgba(99,102,241,0.12);color:var(--primary);margin-bottom:6px;">' + g.badge + '</span>' +
          '<h3 style="font-size:1.125rem;font-weight:800;color:var(--ink);margin:0;">' + g.title + '</h3>' +
          '<p style="font-size:.8125rem;color:var(--ink-soft);margin-top:4px;">' + g.subtitle + '</p>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;">' +
          sectionsHtml +
        '</div>' +
      '</div>';

    if(typeof window.openModal === 'function'){
      window.openModal({
        title: g.title,
        body: modalHtml,
        okText: '확인 및 닫기'
      });
    } else {
      alert(g.title + '\n\n' + g.subtitle);
    }
  }

  window.showTabUsageGuide = showTabUsageGuide;
})();
