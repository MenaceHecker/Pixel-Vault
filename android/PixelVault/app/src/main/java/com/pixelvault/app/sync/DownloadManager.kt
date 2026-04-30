package com.pixelvault.app.sync

import android.util.Log
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File

object DownloadManager {

    private const val TAG = "DownloadManager"
    private const val DOWNLOAD_DIR = "/sdcard/PixelVault"

    private val client = OkHttpClient()

    fun ensureDownloadDir(): File {
        val dir = File(DOWNLOAD_DIR)
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    fun download(url: String, filename: String): File? {
        return try {
            val dir = ensureDownloadDir()
            val destFile = File(dir, filename)

            // Skip if already downloaded
            if (destFile.exists()) {
                Log.d(TAG, "File already exists, skipping: $filename")
                return destFile
            }

            val request = Request.Builder().url(url).build()
            val response = client.newCall(request).execute()

            if (!response.isSuccessful) {
                Log.e(TAG, "Download failed for $filename: ${response.code}")
                return null
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
            null
        }
    }
}