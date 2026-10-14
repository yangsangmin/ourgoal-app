# K18 B 최초 독립 의견

계획의 source 인수·선택 독립검토를 완료했다. 실계정 사용 가능·효과·운영·원격 CAS·XP 권위·두 탭/두 기기·공식 Court는 미확인이다. exact frozen0e785의 두 선택 L1 반례에서 저장 안전 경계를 확인했으므로 아래 두 결함의 좁은 교정 전에는 이 독립검토로 제품 사용 완료를 선언할 수 없다. 이것은 독립 의견이며 법정 판정이 아니다.

K18-B-PENDING-ATTEMPTS-01: js/core/device-save.js::read는 typed entries의 owner/kind/target/changeId/generation/body/version을 확인하지만 attempts의 정수·범위 및 lastFailure/operation의 의미를 검증하지 않는다. 새 L1 조건은 valid own goals pending에 attempts='invalid'만 손상시켰다. storage.device.pending은 이를 읽기 허용했고, 자동 정책(manualRetry=false) retry 세 번이 설정 maxAttempts 두 번을 넘겨 mock send 세 번을 호출했다. attempts는 +=1 문자열 결합 때문에 string으로 남아 상한 비교가 성립하지 않는다. 실제 heartbeat/API/계정 반복 실행 결과가 아닌 exact 제품 VM의 부품 반례다. strict reader가 손상된 counter를 typed integrity hold로 돌리고 raw/backup/body·원 metadata를 유지해야 한다. 원 A/records schema1 호환에 필요한 optional/legacy metadata는 명시 계약으로 한정하며 임의 정상값·권위를 만들면 안 된다.

K18-B-PENDING-USER-BOOTSTRAP-02: js/core/profile-load.js::loadProfile은 valid users pending을 먼저 읽지만 ensureUserRow에서 pending 유무를 사용하지 않는다. 별도 profile backup이 없고 own users GET가 비어 있으면 기본 users row를 upsert한 다음 pending payload를 표시 데이터에 덧씌운다. 새 L1 조건에서 read-induced users upsert 한 번, 표시 pending 유지·원 q bytes 불변·users readState unconfirmed·newSignup true를 함께 관측했다. 로컬 pending 존재는 보관 변경의 증거인데 empty read가 default write로 먼저 이어지는 경로다. 실제 DB를 덮었다고 주장하지 않는다. 교정은 이미 pending인 users에 한해 default bootstrap을 막고 존재미확정으로 유지하는 좁은 지점이다. pending이 없는 원 실제 신규 가입 생성 기능을 임의 삭제하거나 schema/API/승인 범위를 바꾸면 안 된다.

서로 다른 종류의 같은 ID 분리는 stateKey와 q.kindData bucket으로 구현됐고 source packet의 여섯 파일과 현재 working bytes가 동일하다. 새 storage.device.pending provider/consumer/owner와 index script pointer, 원 P0 local-keep 함수별 bodies·원 A/P0 claims·baseline·무인자 legacy save tail은 독립 source 비교로 불변을 확인했다. 새 sameid/generation/손상 범위 중 attempts 손상은 기존 전체 검사와 다른 선택 경계다. existing source reader의 raw exact lease·pending 존재 시 kind별 local 보존과 manual resync의 whole render/legacy send 우회는 source 인수이며 정상 실제 계정·두 탭 상호운용의 측정은 아니다.

원 첫 component/load·guest 조작 실패, 후속 actual guest 관측, 원 raw privacy qualification을 그대로 인수했다. 기존 10+8+8+6/guest11macro·Chrome을 반복하지 않았다. guest 화면은 작가의 기존 frozen source 관측으로만 인수했고 이번 product review에서 actual browser·genuine auth·HTTP·DB는0이다. source-packet/원 raw hash와 private gitignore 및 공개 scenario-safe-metadata의 키 문자열 비복제를 확인했다. private 원 raw 본문이나 JWT를 새 artifact/중앙에 복제하지 않았다.

자기 최초 하네스의 query object 닫는 괄호 SyntaxError는 제품에 도달하기 전이며 FIRST-HARNESS snapshot/FAILURE로 보존했다. 그 문법만 교정한 새 하네스에서 두 조건을 측정했다. L1의 mocked SDK/계정 label·in-memory data는 real fixture/E2E/UI hydration이 아니다. 원 SQL3·첫지표·소진한 한건 시험·추가 fixture DB/게시/AI/서버 사진/개인정보/Notion/공유원장/원 제품·시험·Court 변경0이다.

root가 배정한 원 A PR980 d326 및 최신06 확인부족을 이 검토의 긍정으로 덮지 않는다. 이번 독립 구현자와 작성자는 분리되어 있고 발견결함의 첫 교정 왕복(round1)만 열렸다. 원 첫의견/raw는 그대로 유지하고 새 exact 수정 HEAD에서 해당 결함만 재확인해야 한다. PIN02의 전체 반려/Court count를 새 이름으로 초기화하지 않는다.
