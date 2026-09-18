package kr.ourgoal.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/**
 * [#TASK-ES-183] 스마트폰 잠금화면 전체 장악(Full-Screen LockScreen Activity)
 * 안드로이드 시스템 잠금화면 위로 100% 덮어씌워지는 최상위 풀스크린 액티비티입니다.
 * Android 8.0+ setShowWhenLocked(true) 및 Keyguard Dismiss 플래그를 적용합니다.
 */
public class LockScreenActivity extends Activity {

    private WebView lockScreenWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. 잠금화면 위로 띄우기 설정 (안드로이드 버전 호환)
        configureLockScreenFlags();

        // 2. 전체화면 (상태바/내비게이션바 몰입 모드)
        hideSystemUI();

        // 3. 아워골 실시간 락스크린 렌더링
        initWebView();
    }

    private void configureLockScreenFlags() {
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
    }

    private void initWebView() {
        lockScreenWebView = new WebView(this);
        WebSettings settings = lockScreenWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // JS 브릿지: 웹에서 '밀어서 잠금해제' 완료 시 네이티브 액티비티 종료
        lockScreenWebView.addJavascriptInterface(new Object() {
            @android.webkit.JavascriptInterface
            public void unlockPhone() {
                runOnUiThread(() -> {
                    finish();
                    overridePendingTransition(0, android.R.anim.fade_out);
                });
            }

            @android.webkit.JavascriptInterface
            public void openCheckin() {
                runOnUiThread(() -> {
                    finish();
                    // 아워골 메인 앱 실행
                    Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
                    if (launch != null) {
                        launch.putExtra("action", "checkin");
                        startActivity(launch);
                    }
                });
            }
        }, "OurgoalNativeLockScreen");

        lockScreenWebView.setWebViewClient(new WebViewClient());
        // 아워골 실시간 잠금화면 뷰 로드
        lockScreenWebView.loadUrl("https://ourgoal-app.vercel.app/?view=lockscreen");
        setContentView(lockScreenWebView);
    }

    @Override
    public void onBackPressed() {
        // 잠금화면 상태에서 백버튼으로 임의 탈출 방지 (밀어서 잠금해제 제스처 사용)
        Toast.makeText(this, "화면 하단을 밀어서 잠금해제하세요.", Toast.LENGTH_SHORT).show();
    }
}
