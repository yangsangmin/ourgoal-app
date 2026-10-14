목표: 테마 정식 claims가 exact 제품·관측·도구 범위를 넘는지 독립 소스 검토한다.

- [x] 정본 지침·승인·동결 소스·공식 패킷 인수 · 예상 3분 · SOURCE-REVIEW exact99ef/7018 및 입력 SHA 기록
- [x] claims8·scenarios6와 제품5 coverage/증거층 대조 · 예상 5분 · FIRST의 FORMAL-R1 source timing과 runtime null 분리
- [x] 최초 독립 의견·봉인 준비 · 예상 2분 · seal.cjs가 입력 불변/UTF8 되읽기 확인, normal commit/clean은 최종 실측 인계

## ① 파악
기준99ef804ec99bc2119165b6d34f529c6d1e0c3a2e. source-only 독립 검토이며 root가 정확 freeze를 배정해 신규 fetch/외부조회0. common309d 중앙 연결은 root만.
## ② 본질
실제 관측과 formal 실행 예정 claim을 혼동하지 않고 성공 미실행 표기를 찾는다.
## ③ 해결방식
승인 source/REQ/PLAN/ROOT-QUALIFICATIONS/claims/scenarios를 직접 읽어 제품 함수와 대조한다.
## ④ 재검토
원 NOFIX와 already-true 조건을 새 고침 성과로 승격하지 않는다. 부족 사유가 PC에서 잴 수 있는 것을 숨기는지 확인한다.
## ⑤ 절차
정확 원자료 인수→claim별 source map→최초 의견/해시→독립 봉인. UI/browser/test/suite/API0.
## ⑥ 절차 재검증
반론1 제목만 맞으면 coverage 충분: 실제 selector/실행 단계/상태 경계를 대조한다. 반론2 static POST404를 DB0/서버안전으로 오인: 원 정상 저장 contract와 source scope를 분리한다.
## ⑦ 단계별 실행
자기 plan/reports/TASK-ES-K17-THEME-FORMAL-PACKET-REVIEW-01a13674만 쓰며 제품/claims/공식원판정/원raw는 readonly.
## ⑧ 막힘 예상
runtime 관측은 정식 Court가 수행한다. source에서 판별 못 하는 화면시점/실저장/로그인은 null로 남긴다. 모델은 자기 turn_context만 기록한다.
