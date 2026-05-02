package com.pixelvault.app

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.pixelvault.app.data.ApiClient
import com.pixelvault.app.data.model.ConfirmRequest
import com.pixelvault.app.sync.DownloadManager
import com.pixelvault.app.util.NetworkUtils
import com.pixelvault.app.util.PrefsManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class SyncState {
    object Idle : SyncState()
    object CheckingWifi : SyncState()
    object Checking : SyncState()
    object UpToDate : SyncState()
    data class Syncing(val current: Int, val total: Int) : SyncState()
    data class Done(val count: Int) : SyncState()
    data class Error(val message: String) : SyncState()
}

class SyncViewModel(application: Application) : AndroidViewModel(application) {

    companion object {
        private const val TAG = "SyncViewModel"
        private const val GOOGLE_PHOTOS_BUFFER_MS = 30_000L //reduced buffer time so it reflects quickly
    }

    private val _syncState = MutableStateFlow<SyncState>(SyncState.Idle)
    val syncState: StateFlow<SyncState> = _syncState

    private val _lastSync = MutableStateFlow("Never")
    val lastSync: StateFlow<String> = _lastSync

    private val _totalSynced = MutableStateFlow(0)
    val totalSynced: StateFlow<Int> = _totalSynced

    init {
        val context = getApplication<Application>()
        _lastSync.value = PrefsManager.getLastSync(context)
        _totalSynced.value = PrefsManager.getTotalSynced(context)
    }

    fun startSync() {
        if (_syncState.value is SyncState.Syncing) return

        viewModelScope.launch @androidx.annotation.RequiresPermission(android.Manifest.permission.ACCESS_NETWORK_STATE) {
            val context = getApplication<Application>()

            // 1. Wi-Fi gate
            _syncState.value = SyncState.CheckingWifi
            if (!NetworkUtils.isWifiConnected(context)) {
                _syncState.value = SyncState.Error("Connect to Wi-Fi before syncing")
                return@launch
            }

            // 2. Fetch pending files
            _syncState.value = SyncState.Checking
            val pending = try {
                ApiClient.api.getPending().files
            } catch (e: Exception) {
                Log.e(TAG, "Failed to fetch pending files", e)
                _syncState.value = SyncState.Error("Could not reach API: ${e.message}")
                return@launch
            }

            if (pending.isEmpty()) {
                _syncState.value = SyncState.UpToDate
                return@launch
            }

            // 3. Sync each file
            var successCount = 0
            pending.forEachIndexed { index, file ->
                _syncState.value = SyncState.Syncing(
                    current = index + 1,
                    total = pending.size
                )

                // Download
                val downloaded = DownloadManager.download(context, file.url, file.filename)
                if (downloaded == null) {
                    Log.e(TAG, "Download failed for ${file.filename}, skipping")
                    return@forEachIndexed
                }

                // Wait for Google Photos to detect and back up the file
                delay(GOOGLE_PHOTOS_BUFFER_MS)

                // Confirm with API — deletes blob
                try {
                    ApiClient.api.confirm(ConfirmRequest(file.id))
                    successCount++
                } catch (e: Exception) {
                    Log.e(TAG, "Confirm failed for ${file.id}", e)
                }
            }

            // 4. Update stats
            PrefsManager.saveLastSync(context)
            PrefsManager.incrementTotalSynced(context, successCount)
            _lastSync.value = PrefsManager.getLastSync(context)
            _totalSynced.value = PrefsManager.getTotalSynced(context)

            _syncState.value = SyncState.Done(successCount)
        }
    }

    fun resetToIdle() {
        _syncState.value = SyncState.Idle
    }

    fun setError(message: String) {
        _syncState.value = SyncState.Error(message)
    }
}