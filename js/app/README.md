# js/app — 부팅 기관 자리

앱이 뜰 때 **한 번** 도는 시동 순서를 담는 폴더다.

## 여기에 두는 것

- `boot.js` — 시동 함수(구역 함수 `boot…`)를 예전 index.html 에 있던 차례 그대로 부르는 파일.
  이름과 자리(`js/app/boot.js`)는 생성기 사양과 모듈 지표가 고정해 둔 값이다. 손으로 쓰지 않고 생성기가 만든다.

## 여기에 두지 않는 것

- 화면·탭 코드 → `js/tabs/`, 공용 기관 → `js/core/`
- 시동 함수의 몸통 → `js/core/boot-*.js`(여기서는 부르기만 한다)
- 비밀값·키 글자(커밋 훅이 막는다)

## 관련 문서

- `docs/architecture/CELL-REGISTRY-DESIGN.md` 5.8절(마지막 정리) · 5.9절(인라인에 남기는 문) · 9절
- `docs/specs/REQ-TASK-ES-686-APP-FOLDER.md`(이 폴더를 먼저 만든 까닭)
