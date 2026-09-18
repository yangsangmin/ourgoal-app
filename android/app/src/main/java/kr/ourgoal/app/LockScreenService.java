package kr.ourgoal.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.IBinder;

/**
 * [#TASK-ES-183] 스마트폰 잠금화면 전체 장악(Screen-On Full-Screen Takeover) 상주 서비스
 * 캐시워크/캐시슬라이드와 동일하게 스마트폰 화면 켜짐(ACTION_SCREEN_ON)을 0.01초 만에 감지하여
 * 폰 기본 잠금화면 위로 아워골 풀스크린 락스크린(LockScreenActivity)을 100% 띄웁니다.
 */
public class LockScreenService extends Service {

    private static final String CHANNEL_ID = "ourgoal_lockscreen_service";
    private static final int NOTIFICATION_ID = 9001;
    public static final String PREFS_NAME = "ourgoal_lockscreen_prefs";
    public static final String KEY_ENABLED = "lockscreen_takeover_enabled";

    private BroadcastReceiver screenReceiver;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, buildForegroundNotification());
        registerScreenReceiver();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "아워골 잠금화면 실시간 서비스",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("스마트폰을 켤 때마다 실시간 목표와 일정을 잠금화면에 띄웁니다.");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildForegroundNotification() {
        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }
        return builder
            .setContentTitle("OURGOAL 잠금화면 서비스 실행 중")
            .setContentText("스마트폰을 켜면 실시간 목표와 일정이 잠금화면에 나타납니다.")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setOngoing(true)
            .build();
    }

    private void registerScreenReceiver() {
        screenReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (Intent.ACTION_SCREEN_ON.equals(intent.getAction())) {
                    SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
                    boolean isEnabled = prefs.getBoolean(KEY_ENABLED, true);
                    if (isEnabled) {
                        Intent lockIntent = new Intent(context, LockScreenActivity.class);
                        lockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        lockIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                        lockIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
                        context.startActivity(lockIntent);
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        registerReceiver(screenReceiver, filter);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (screenReceiver != null) {
            try {
                unregisterReceiver(screenReceiver);
            } catch (Exception ignored) {}
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
