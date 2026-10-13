# PR975 주장 범위 보완

최초 공식 검토는 94BED734, source 658743daca3e7f1ebc26e4f49a80cb94bafdd573다. 공식 판정 원문은 상위 담당 정본에 보존하고 이 폴더에 게시하지 않는다. C1~C4의 원 내용·분야·대상·정적 check는 그대로 유지한다. 새 주장은 확인 범위를 추가하며 기존 정적 증거를 실제 사용으로 바꾸지 않는다.

| 요구 | 기존 근거 | 추가한 측정·미확인 범위 |
|---|---|---|
| R1 본인 원문·추천 집계 | C3 source, 원 PostgreSQL 증명 | C7 운영 역할 template 관측은 별도 증거로 확보; 법정 직접 실서버 재실행 불가 |
| R2 설정 값·운영 audit 비공개 | C4 source | C8 운영 audit/설정 역할 template 관측은 별도 증거로 확보; 법정 직접 실서버 재실행 불가 |
| R3 정의·데이터 보존/CAS/rollback·지급/노출 제외 | 원 bundle·로컬 PostgreSQL·private successor rollback | C5 source/CAS와 bundle 참조, C6 실제 적용·fixture rollback 되읽기 증거를 확보했으나 법정 직접 재실행 불가; post-commit 복구 자동 실행은 주장하지 않음 |
| R4 안내와 처리기 | C1/C2 source·기존 VM | C10 실제 게스트 UI의 로컬 목표 조언 시트 안내/공개 radio 없음/취소, C9 인증된 본인 원문/계정 전환·지연 응답 실제 UI 미확인 |

C10은 새 상태를 코드로 주입하지 않는다. 정상 첫 화면에서 게스트로 들어가 새 목표 → 직접 설정 → 실제 제목 입력 → 만들기로 로컬 목표를 생성한 뒤 소통 탭의 본인 `me_` 카드에서 조언 버튼을 누른다. 조언 전송·반응/게시 버튼을 누르지 않는다. 외부 통신은 기존 법정 실행기의 정상 설정으로 차단한다. 공개 범위 필드의 기본값은 실제 UI의 같은 테마 선택이며 운영 게시·기존 사용자 profile 변경이 아니다. 표시 안내가 기준 main에서 거짓인 13단계를 symptom으로 삼는다. 원시 Chrome 결과에는 credential URL이 있을 수 있어 owner private-recovery에만 두고 게시 파생본은 단계별 관찰과 원 SHA만 담는다.

지원 형식: SQL 관련 C6~C8은 적절한 server-api/security-server 분야·L4에 `unverified.reason: needs-live-server`를 쓴다. `cannotBecause: needs-live-server`는 지원 목록에 없어 쓰지 않는다. C9의 인증 UI는 L3에 `reason: tool-cannot-measure`, `cannotBecause: needs-login`이다. 게스트에서 잴 수 있는 조언 안내를 로그인 한계로 덮지 않는다. C5 정적 source 확인은 실제 서버 하한을 충족한다고 주장하지 않는다.

읽기 전용 확인한 집계 한계: court/claims.js rollup은 정적 TEXT_ONLY를 UNVERIFIED보다 우선하며, CONFIRMED+meetsFloor가 있으면 같은 요구의 인증 미확인보다 우선할 수 있다. 따라서 R1/R2/R3의 코드 확인 표시는 새 미확인 이유 추가로 사라지지 않을 수 있고 R4 게스트 확인도 인증 UI 검증을 대신하지 않는다. 요구/주장의 ID 이동·분야 하향·원 check 삭제로 이 표시에 맞추지 않는다. 원 법정·금고·집계 규칙은 변경하지 않는다. 두 번째 실제 법정 결과 뒤 claim별 남은 범위와 MERGE_GATE 적용은 상위 담당이 정본 판정과 함께 판단한다.

SQL/UI canonical SHA와 원 source seal, 최초 독립 검토 및 PostgreSQL 측정은 append manifest가 대조한다. 이 폴더는 주장자 관찰/형식 점검이며 자체 법정 판정서가 아니다.

상위 담당이 제공한 운영 검증 원문은 owner evidence에 그대로 두었다. live-role-reference.sanitized.json은 인증 boolean/HTTP·template 단언·fixture rollback 되읽기·source/review/apply hash만 파생해 담는다. 원문·비밀값·사용자 UUID는 복제하지 않는다. 이 기록은 독립 운영 검증의 결과이고 법정이 그 실제 계정에 로그인해 재검증했다는 뜻이 아니다. 실제 인증 UI와 효과는 여전히 미확인이다. C1~C4의 적용 전 서술은 658743da 당시 정적 관찰이며 현재 상태는 별도 actualSQLAppliedSource/actualRoleVerificationSource로 읽는다.

게스트 pilot의 공개 radio name 단언을 실제 원소스 이름 rxAdvVis로 바로잡고 최종 기준·작업 시나리오를 측정했다. pilot 파생본과 원시는 별도로 보존한다. 초기 localhost 진입과 숨은 빠른 추가 경로의 탐색 실패도 private 원문에 남는다. 최종 시나리오는 정상 임의 Court host 및 실제 홈 새 목표 → 직접 설정 흐름이며 state seed·handler 직접 호출·SDK 응답 주입은 없다.
