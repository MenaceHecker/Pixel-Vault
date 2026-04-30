package com.pixelvault.app.sync

import android.content.Context
import android.media.MediaScannerConnection
import android.util.Log
import kotlinx.coroutines.suspendCancellableCoroutine
import java.io.File
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

object MediaStoreHelper {

    private const val TAG = "MediaStoreHelper"

    suspend fun scanFile(context: Context, file: File): Boolean {
        return suspendCancellableCoroutine { continuation ->
            MediaScannerConnection.scanFile(
                context,
                arrayOf(file.absolutePath),
                null
            ) { path, uri ->
                if (uri != null) {
                    Log.d(TAG, "Scanned successfully: $path → $uri")
                    continuation.resume(true)
                } else {
                    Log.e(TAG, "Scan failed for: $path")
                    continuation.resume(false)
                }
            }
        }
    }
}