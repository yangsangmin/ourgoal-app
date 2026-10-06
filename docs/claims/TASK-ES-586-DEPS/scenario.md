# 의존성 추가 검증

## deps-install
1. `npm ci`를 실행하면 추가된 `@babel/parser` 및 `@babel/traverse`가 문제없이 설치된다.
2. Node.js 런타임에서 `require('@babel/parser')` 호출 시 정상 로드된다.
3. 기존 제품 기능에 영향을 주지 않으므로 모든 기존 테스트가 통과한다.
