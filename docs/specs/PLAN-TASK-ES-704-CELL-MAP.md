목표: PR974 병합 source의 실제 세포 구조와 기능 설명을 지도 정본·게시 재료에 반영한다.

G0: 본질축 E3 · 체감 가치 = 새 공유 입력·저장 상태 세포를 지도에서 바로 찾는다 · 렌더 근거 = 생성 cell-map.json 및 web db/노션 본문. 기준 PR #968. 실행 담당은 본 세션 하나이며 Notion/웹 갱신은 pending이다.

- [x] 1단계 번호·source 확인과 REQ/PLAN · 예상 3분 · TASK704 Git/티켓/PR 미사용 및 기준 b1c89 측정
- [x] 2단계 설명·생성 지도 갱신 · 예상 5분 · share-feed-save 설명 추가 및 helpful-reason 실제 기능 설명
- [x] 3단계 결정성·내용·게시 재료 검증 · 예상 5분 · 기존 cell-map 시험·check 및 source 결박 산출
- [x] 4단계 심사 청구 준비 · 예상 3분 · claims 하나·로컬 커밋만, push/PR/merge 0

## 1. 원칙 ① 파악
PR974에서 records/share-feed-save가 추가됐으나 지도와 손 설명은 이전이다. helpful-reason 설명은 실제 지급 코드가 없는 크레딧을 준다고 표시한다.
## 2. 원칙 ② 본질·원인·중심·핵심
본질은 사용자가 보는 구조의 정확성, 원인은 생성 지도 지연과 손 설명 누락, 중심은 cell-descriptions.json, 핵심은 현재 main source에서 생성하는 cell-map-export.build다.
## 3. 원칙 ③ 해결 방식
설명만 현재 코드에 맞추고 기존 생성기로 지도 정본과 게시 재료를 만든다. 제품 코드와 규칙은 변경하지 않는다.
## 4. 원칙 ④ 재검토
SDK accepted를 실제 행 되읽기·새로고침 복구라고 설명하지 않는다. helpful-reason은 현재 이유 입력/조회 기능만 설명한다.
## 5. 원칙 ⑤ 절차
번호 확인 → 설명 수정 → export → 기존 시험/check → publisher --root → claims/로컬 커밋 → 부모 인계.
## 6. 원칙 ⑥ 절차 재검증
새 지도 source는 origin/main 제품 기준 b1c89이고 손 수치를 쓰지 않는다. 미게시 재료를 동기화 완료라 할 수 없으므로 pending으로 남긴다.
## 7. 원칙 ⑦ 단계별 실행
담당 워크트리의 설명·지도·REQ/PLAN·티켓·보고만 수정한다. Notion 호출·SQL·지표·제품 수정·push 없음.
## 8. 원칙 ⑧ 막히는 지점 예상
번호 선점 충돌, 추적 파일에 포함되지 않은 REQ, main 이동, 생성 재료 불일치가 위험이다. exact source와 실행 로그를 보존한다.

작업자 측정: 기존 부품 시험과 생성 지도 check·publisher exit0. 상세 수치는 reports/TASK-ES-704/measurement.json에 있다. 심사 청구 준비만 완료, 실제 법정 심사·웹/노션/허브 동기화·효과 미확인.
