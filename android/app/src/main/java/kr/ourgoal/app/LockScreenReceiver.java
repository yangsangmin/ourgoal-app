package kr.ourgoal.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

/**
 * [#TASK-ES-183] 기기 부팅 완료(BOOT_COMPLETED) 시 잠금화면 서비스 자동 시작 리시버
 */
public class LockScreenReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            SharedPreferences prefs = context.getSharedPreferences(LockScreenService.PREFS_NAME, Context.MODE_PRIVATE);
            boolean isEnabled = prefs.getBoolean(LockScreenService.KEY_ENABLED, true);
            if (isEnabled) {
                Intent serviceIntent = new Intent(context, LockScreenService.class);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            }
        }
    }
}
