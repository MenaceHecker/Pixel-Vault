package com.pixelvault.app.util

import android.content.Context
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object PrefsManager {

    private const val PREFS_NAME = "pixel_vault_prefs"
    private const val KEY_LAST_SYNC = "last_sync"
    private const val KEY_TOTAL_SYNCED = "total_synced"
    private const val KEY_WIFI_ONLY = "wifi_only"

    fun saveLastSync(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putLong(KEY_LAST_SYNC, System.currentTimeMillis()).apply()
    }

    fun getLastSync(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val timestamp = prefs.getLong(KEY_LAST_SYNC, 0L)
        if (timestamp == 0L) return "Never"
        val sdf = SimpleDateFormat("MMM d, yyyy  h:mm a", Locale.getDefault())
        return sdf.format(Date(timestamp))
    }

    fun incrementTotalSynced(context: Context, count: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val current = prefs.getInt(KEY_TOTAL_SYNCED, 0)
        prefs.edit().putInt(KEY_TOTAL_SYNCED, current + count).apply()
    }

    fun getTotalSynced(context: Context): Int {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getInt(KEY_TOTAL_SYNCED, 0)
    }

    fun setWifiOnly(context: Context, wifiOnly: Boolean) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putBoolean(KEY_WIFI_ONLY, wifiOnly).apply()
    }

    fun isWifiOnly(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(KEY_WIFI_ONLY, true)
    }
}