# 📱 아워골 Google Play 14일 20명 비공개 테스트 및 스토어 출시 가이드

**작성일: 2026-09-11 (양비스 자동 생성)**

Google Play의 신규 개인 개발자 계정은 프로덕션 출시 전 **최소 20명의 테스터가 14일 이상 비공개 테스트에 참여**해야 합니다.

---

## 1. 앱 기본 정보 요약
- **앱 이름**: 아워골 (Ourgoal)
- **패키지명 (Package Name)**: `com.yangbis.ourgoal`
- **타깃 URL**: `https://ourgoal-app.vercel.app`
- **기본 언어**: 한국어 (ko-KR)
- **카테고리**: 생산성 (Productivity) / 건강 및 피트니스
- **개인정보처리방침 URL**: `https://ourgoal-app.vercel.app/docs/legal/privacy.md`

---

## 2. 14일 20인 비공개 테스트 실행 단계

### Step 1: Google Play Console 앱 생성
1. [Google Play Console](https://play.google.com/console) 접속 -> **앱 만들기**
2. 기본 세부정보 입력:
   - 앱 이름: **아워골**
   - 기본 언어: **한국어**
   - 앱 또는 게임: **앱**
   - 무료/유료: **무료**
3. 선언사항(개인정보처리방침 등) 체크 후 저장

### Step 2: Android App Bundle (AAB) 빌드
- PWA Builder 또는 Bubblewrap CLI를 사용하여 `manifest.json` 기반 AAB 빌드:
  ```bash
  npx @bubblewrap/cli init --manifest=https://ourgoal-app.vercel.app/manifest.json
  npx @bubblewrap/cli build
  ```
- 빌드된 `app-release-bundle.aab`를 Play Console 비공개 테스트 트랙에 업로드.

### Step 3: 20인 테스터 모집 및 링크 배포
1. **테스트 트랙 설정**: Google Play Console -> **테스트** -> **비공개 테스트** -> 트랙 관리
2. **테스터 목록 등록**: Google 그룹스(권장) 또는 이메일 목록(최소 20명 이상) 추가
3. **참여 링크 공유**: 테스터 등록 후 발급된 웹 참여 링크 또는 Android 참여 링크 전달
4. **14일 유지 요건**:
   - 20명 이상의 테스터가 앱을 다운로드 및 설치하고 14일간 연속 참여 상태를 유지해야 함.
   - 테스터 이탈 방지를 위해 양비스가 일일 체크인 및 리마인더 푸시를 전송.

### Step 4: 프로덕션 신청 (14일 경과 후)
- 14일 요건 충족 시 Google Play Console 대시보드에 **'프로덕션 액세스 신청'** 버튼 활성화.
- 테스트 진행 설문(피드백 반영 내용 요약) 작성 후 최종 검토 제출.

---

## 3. 기계 검증 상태
- `manifest.json`: PWA Standalone 규격 통과
- `icons`: 192x192, 512x512 고해상도 규격 구비 완료
- `Digital Asset Links`: `.well-known/assetlinks.json` 세팅 완료
- `개인정보처리방침 및 약관`: 완비
- `회원탈퇴 및 데이터 파기`: `api/withdraw.js` 완비
