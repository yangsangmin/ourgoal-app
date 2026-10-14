# 첫 마감 명령 오류 보존

첫 PowerShell 마감 명령의 publicSafe=true는 달러 기호가 빠진 구문이어서 true 명령을 찾을 수 없다는 오류가 났다. 전체 명령은 계속되어 null closure와 일부 null metadata를 가진 seal을 썼다. FIRST-CLOSURE-FAILED.json/FIRST-CLOSURE-SOURCE-SEAL.json으로 원바이트 보존한다. 제품·시험·공식판정 실패가 아니며 그 마감을 완료 근거로 사용하지 않는다. 올바른 불리언으로 별도 CLOSURE와 최종 SOURCE-SEAL을 만들고 다시 대조한다.
