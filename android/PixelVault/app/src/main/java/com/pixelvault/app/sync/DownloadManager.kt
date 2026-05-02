package com.pixelvault.app.sync

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File

object DownloadManager {

    private const val TAG = "DownloadManager"
    private val client = OkHttpClient()

    suspend fun download(context: Context, url: String, filename: String): File? {
        return withContext(Dispatchers.IO) {
            try {
                // Fetch the file bytes from the URL
                val request = Request.Builder().url(url).build()
                val response = client.newCall(request).execute()

                if (!response.isSuccessful) {
                    Log.e(TAG, "Download failed for $filename: ${response.code}")
                    return@withContext null
                }

                val bytes = response.body?.bytes() ?: run {
                    Log.e(TAG, "Empty body for $filename")
                    return@withContext null
                }

                // Insert into MediaStore under Pictures/PixelVault
                val mimeType = when {
                    filename.endsWith(".png", ignoreCase = true) -> "image/png"
                    filename.endsWith(".jpg", ignoreCase = true) || filename.endsWith(".jpeg", ignoreCase = true) -> "image/jpeg"
                    filename.endsWith(".mp4", ignoreCase = true) -> "video/mp4"
                    filename.endsWith(".mov", ignoreCase = true) -> "video/quicktime"
                    else -> "image/jpeg"
                }

                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    put(MediaStore.MediaColumns.RELATIVE_PATH, "Pictures/PixelVault")
                }

                val resolver = context.contentResolver
                val uri: Uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
                    ?: run {
                        Log.e(TAG, "MediaStore insert failed for $filename")
                        return@withContext null
                    }

                resolver.openOutputStream(uri)?.use { output ->
                    output.write(bytes)
                }

                // Return a File reference for MediaStoreHelper
                val path = "${Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)}/PixelVault/$filename"
                val file = File(path)
                Log.d(TAG, "Inserted via MediaStore: $uri")
                file

            } catch (e: Exception) {
                Log.e(TAG, "Exception downloading $filename", e)
                null
            }
        }
    }
}