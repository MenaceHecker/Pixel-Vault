package com.pixelvault.app

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.pixelvault.app.data.ApiClient
import com.pixelvault.app.data.model.ConfirmRequest
import com.pixelvault.app.databinding.ActivityMainBinding
import com.pixelvault.app.sync.DownloadManager
import com.pixelvault.app.sync.MediaStoreHelper
import com.pixelvault.app.util.PrefsManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        updateStats()

        binding.btnSync.setOnClickListener {
            startSync()
        }
    }

    private fun updateStats() {
        binding.tvLastSync.text = "Last sync: ${PrefsManager.getLastSync(this)}"
        binding.tvTotalSynced.text = "Total archived: ${PrefsManager.getTotalSynced(this)}"
    }

    private fun startSync() {
        lifecycleScope.launch {
            try {
                setLoading(true)
                binding.tvStatus.text = "Fetching pending files..."

                val response = withContext(Dispatchers.IO) {
                    ApiClient.api.getPending()
                }

                if (response.files.isEmpty()) {
                    binding.tvStatus.text = "No new files to sync"
                    setLoading(false)
                    return@launch
                }

                var count = 0
                response.files.forEachIndexed { index, file ->
                    binding.tvStatus.text = "Syncing ${index + 1}/${response.files.size}: ${file.filename}"
                    
                    val downloadedFile = withContext(Dispatchers.IO) {
                        DownloadManager.download(file.url, file.filename)
                    }

                    if (downloadedFile != null) {
                        MediaStoreHelper.scanFile(this@MainActivity, downloadedFile)
                        
                        withContext(Dispatchers.IO) {
                            ApiClient.api.confirm(ConfirmRequest(file.id))
                        }
                        
                        count++
                        PrefsManager.incrementTotalSynced(this@MainActivity, 1)
                        updateStats()
                    }
                }

                PrefsManager.saveLastSync(this@MainActivity)
                updateStats()
                binding.tvStatus.text = "Sync complete: $count files added"

            } catch (e: Exception) {
                binding.tvStatus.text = "Error: ${e.message}"
                e.printStackTrace()
            } finally {
                setLoading(false)
            }
        }
    }

    private fun setLoading(loading: Boolean) {
        binding.btnSync.isEnabled = !loading
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
    }
}