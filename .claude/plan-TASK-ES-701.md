목표: 실제 목표/수동 카테고리가 공유 post 메타와 기존 insert 경로에 같은 입력으로 남도록 owned caller를 고친다.

Canonical TASK-ES-701, 라우팅 alias TASK-ES-SHARE-FEED-CATEGORY-01a1310c. 기존 alias preread 계획은 역사 자료이며 새 ID를 소급 적용하지 않는다. root가 기존 L012 선점 결과를 인수했다. 정본 REQ/PLAN은 docs/specs/REQ-/PLAN-TASK-ES-701-SHARE-FEED-CATEGORY.md다.

- [ ] 1단계 REQ/PLAN 최초 원검토 · 예상10분 · 제품0 commit/SHA와 두 원의견 인수.
- [ ] 2단계 caller 구현 · 예상15분 · owned source default/manual/captured frame/meta/helper 연결.
- [ ] 3단계 원시 검증/Claims · 예상15분 · 원 부정/기대 보존, local 단위·browser/원 영향검사·guard·writebudget0 보고.
- [ ] 4단계 심사 청구 · 예상10분 · draft PR/external Court 정확source 결과/root 인계, merge0.

①파악: 원 source는 topic 매핑과 공통 insert를 소비하지 않는다.

②본질·원인·중심·핵심: 선택한 입력의 정합이 본질, 연결 누락이 원인, 기존 records caller가 중심, 수동 선택·capture frame이 핵심이다.

③해결방식: map/helper 재사용과 수동 flag, 첫 await 전 scalar frame.

④재검토: 목표 변경이 수동 선택을 덮지 않아야 하고 async hold가 준비한 post 메타를 바꾸지 않아야 한다.

⑤절차: 원명세→각1회원검토→부정→교정→회귀→Claims/PR/Court.

⑥재검증: local/fixture/server·SDK error/throw·retry scope를 나누고 원 기대/기준선/의견을 변경하지 않는다.

⑦실행: own source/doc/report만, 원격/계정/schema/author overlap0.

⑧막힘:800줄/helper absence/async/login readback 한계, source pin/null 유지.
