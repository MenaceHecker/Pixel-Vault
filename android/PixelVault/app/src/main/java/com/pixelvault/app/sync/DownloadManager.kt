package com.pixelvault.app.sync

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File

object DownloadManager {

    private const val TAG = "DownloadManager"

    private val client = OkHttpClient()

    fun getDownloadDir(context: Context): File {
        val dir = File(context.getExternalFilesDir(null), "PixelVault")
        if (!dir.exists()) dir.mkdirs()
        return dir
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
                null
            }
        }
    }
}