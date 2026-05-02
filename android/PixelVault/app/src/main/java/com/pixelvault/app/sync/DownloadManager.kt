package com.pixelvault.app.sync

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import android.os.Environment

object DownloadManager {

    private const val TAG = "DownloadManager"

    private val client = OkHttpClient()

    fun debugStorage(context: Context): String {
        val dir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "PixelVault")
        val sb = StringBuilder()
        sb.appendLine("Target: ${dir.absolutePath}")
        sb.appendLine("Parent exists: ${dir.parentFile?.exists()}")
        sb.appendLine("Parent writable: ${dir.parentFile?.canWrite()}")
        sb.appendLine("mkdirs result: ${dir.mkdirs()}")
        sb.appendLine("Dir exists after: ${dir.exists()}")
        sb.appendLine("Dir writable after: ${dir.canWrite()}")
        return sb.toString()
    }

    fun getDownloadDir(context: Context): File {
        // Try multiple locations in order of preference
        val candidates = listOf(
            File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "PixelVault"),
            File(Environment.getExternalStorageDirectory(), "Pictures/PixelVault"),
            File(Environment.getExternalStorageDirectory(), "PixelVault"),
            context.getExternalFilesDir("PixelVault")!!
        )

        for (dir in candidates) {
            try {
                if (dir.exists() || dir.mkdirs()) {
                    if (dir.canWrite()) {
                        Log.d(TAG, "Using download dir: ${dir.absolutePath}")
                        return dir
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to use dir: ${dir.absolutePath}", e)
            }
        }

        // Last resort — internal files dir, always writable
        val fallback = File(context.filesDir, "PixelVault")
        fallback.mkdirs()
        Log.w(TAG, "Falling back to internal dir: ${fallback.absolutePath}")
        return fallback
    }

    suspend fun download(context: Context, url: String, filename: String): File? {
        return withContext(Dispatchers.IO) {
            try {
                val dir = getDownloadDir(context)
                val destFile = File(dir, filename)

                if (destFile.exists()) {
                    Log.d(TAG, "File already exists, skipping: $filename")
                    return@withContext destFile
                }

                val request = Request.Builder().url(url).build()
                val response = client.newCall(request).execute()

                if (!response.isSuccessful) {
                    Log.e(TAG, "Download failed for $filename: ${response.code}")
                    return@withContext null
                }

                response.body?.byteStream()?.use { input ->
                    destFile.outputStream().use { output ->
                        input.copyTo(output)
                    }
                }

                Log.d(TAG, "Downloaded: $filename (${destFile.length()} bytes)")
                destFile

            } catch (e: Exception) {
                Log.e(TAG, "Exception downloading $filename", e)
                android.util.Log.e(TAG, "Download dir: ${getDownloadDir(context).absolutePath}")
                android.util.Log.e(TAG, "Dir exists: ${getDownloadDir(context).exists()}")
                android.util.Log.e(TAG, "Dir writable: ${getDownloadDir(context).canWrite()}")
                null
            }
        }
    }
}