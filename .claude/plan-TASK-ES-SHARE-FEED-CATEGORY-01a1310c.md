목표: 피드 공유 창에서 목표 주제에 맞는 기본 카테고리와 사용자가 고른 카테고리가 기존 메타 삽입 경로로 일관되게 보존되도록 고친다.

작업참고 기준 PR #968. 현재 fresh origin/main db8b7ebb(PR972). 라우팅 alias TASK-ES-SHARE-FEED-CATEGORY-01a1310c, 실제 G0 공통번호는 기존 L012 선점 계약으로 확인 후 기록한다.

- [ ] 1단계 REQ·PLAN 원명세 고정 · 예상 10분 · 현재 category-map/helper/DOM·G0 ID와 각8원칙을 고정, root의 최초 독립 검토 인계.
- [ ] 2단계 구현 · 예상 15분 · 원의견 교정 뒤 owned share-to-feed.js만 default/수동선택/metadata insert 연결, 타담당·원 게시물/DB 변경0.
- [ ] 3단계 원시 검증·Claims · 예상 15분 · 원 부정→교정 및 영향시험/공식guard, 실제 serverwrite0·한계·보호파일SHA 보존.
- [ ] 4단계 심사 청구 · 예상 10분 · 고정 source/PR/Court 원판정과 부족을 source별로 인계, rootreview 전 병합0.

① 파악: 현재 공유 창은 목표 category를 그대로 써서 topic과 한글 라벨을 모르면 study가 되고, extra만 저장하며 공통 메타 7칸 삽입 경로에 연결되지 않는다.

② 본질·원인·중심·핵심: 문제는 매핑표·서버 helper는 이미 있는데 해당 producer가 소비하지 않는 배선이다. 카테고리 결정의 주인은 이미 OurgoalCategoryMap이고 이 작업은 창의 caller 하나만 연결한다.

③ 해결방식: fromGoal(curGoal)||life와 기존 withMeta/feedPostMeta(categoryOverride:selectedCat,contentType:record,pct,caption), insertFeedPost helper를 사용한다. 수동 칩은 이후 목표 선택에도 유지한다.

④ 재검토: topic으로 매번 덮으면 사용자가 고른 칩을 잃는다. 수동 선택 여부를 분리한다. helper의 메타 칸 fallback은 기존 계약이므로 새 schema/SQL을 넣지 않는다.

⑤ 절차: fresh preflight→공통ID 선점·명세원검토→부정fixture 측정→최소 caller교정→영향회귀→Claims/PR/Court.

⑥ 절차 재검증: 실제 호출에 들어간 post와 로컬 cache에 남은 post의 metadata를 되읽어 비교한다. local/fixture 시험은 실계정 E2E로 표시하지 않는다. 기존 오류/중복/권한 helper 조건을 약화하지 않는다.

⑦ 단계별 실행: private browser 또는 source-bound local fixture의 script/input/PID/exit/stdout/stderr를 보존한다. 제품은 share-to-feed.js만, generated metadata는 공식 도구만 허용한다. 중앙 연계는 root 담당이다.

⑧ 막히는 지점 예상: 로그인 뒤 진짜 insert/RLS·schema readback은 writebudget0로 못 잰다. 실제 source는 그대로 null/미확인으로 청구하고 성공 토스트를 server evidence로 삼지 않는다. 800줄/신고서/기존 검사 문제가 있으면 원시를 남기고 범위를 root와 연결한다.
