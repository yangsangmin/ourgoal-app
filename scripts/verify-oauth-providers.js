/**
 * verify-oauth-providers.js
 *
 * Supabase Auth의 카카오 및 구글 Provider 활성화 여부 및 authorize 엔드포인트를 실측한다.
 *
 * 실행: node scripts/verify-oauth-providers.js
 */
const SUPABASE_URL = 'https://dvqosviqbciohcywkzbq.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cW9zdmlxYmNpb2hjeXdremJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MTM0NDYsImV4cCI6MjEwMzk4OTQ0Nn0.DCMMxxHB6kzJ0CjgLN0ERaSk7WY6LDN-pDVdeZ0-cWM';

async function check() {
  console.log('=== Supabase Auth Provider 실측 ===');
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: ANON_KEY }
    });
    const settings = await res.json();
    const ext = settings.external || {};
    console.log(`Kakao Provider 활성화 상태: ${ext.kakao ? '✅ 활성화됨' : '❌ 비활성화 (콘솔 설정 필요)'}`);
    console.log(`Google Provider 활성화 상태: ${ext.google ? '✅ 활성화됨' : '❌ 비활성화 (콘솔 설정 필요)'}`);

    for (const p of ['kakao', 'google']) {
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/authorize?provider=${p}`, {
        headers: { apikey: ANON_KEY },
        redirect: 'manual'
      });
      console.log(`\nProvider [${p}] authorize 호출 결과:`);
      console.log(`  - HTTP 상태코드: ${authRes.status}`);
      if (authRes.status === 302 || authRes.status === 303) {
        console.log(`  - 리다이렉트 URL: ${authRes.headers.get('location')}`);
        console.log(`  - 판정: ✅ 성공 (정상 리다이렉트)`);
      } else {
        const body = await authRes.json().catch(() => ({}));
        console.log(`  - 에러 메시지: ${body.msg || body.error_description || JSON.stringify(body)}`);
        console.log(`  - 판정: ❌ 미완료 (Provider 미등록)`);
      }
    }
  } catch (err) {
    console.error('검증 중 예외 발생:', err);
  }
}

check();
