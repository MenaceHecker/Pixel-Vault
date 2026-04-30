package com.pixelvault.app

import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.pixelvault.app.databinding.ActivityMainBinding
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val viewModel: SyncViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnSync.setOnClickListener {
            viewModel.startSync()
        }

        lifecycleScope.launch {
            viewModel.syncState.collect { state ->
                updateUi(state)
            }
        }

        lifecycleScope.launch {
            viewModel.lastSync.collect { lastSync ->
                binding.tvLastSync.text = "Last sync: $lastSync"
            }
        }

        lifecycleScope.launch {
            viewModel.totalSynced.collect { total ->
                binding.tvTotalSynced.text = "Total archived: $total"
            }
        }
    }

    private fun updateUi(state: SyncState) {
        when (state) {
            is SyncState.Idle -> {
                binding.tvStatus.text = "Ready to sync"
                binding.tvStatus.setTextColor(getColor(R.color.text_primary))
                binding.progressBar.visibility = android.view.View.GONE
                binding.btnSync.isEnabled = true
            }
            is SyncState.CheckingWifi -> {
                binding.tvStatus.text = "Checking Wi-Fi…"
                binding.tvStatus.setTextColor(getColor(R.color.text_primary))
                binding.progressBar.visibility = android.view.View.VISIBLE
                binding.btnSync.isEnabled = false
            }
            is SyncState.Checking -> {
                binding.tvStatus.text = "Checking for pending files…"
                binding.tvStatus.setTextColor(getColor(R.color.text_primary))
                binding.progressBar.visibility = android.view.View.VISIBLE
                binding.btnSync.isEnabled = false
            }
            is SyncState.UpToDate -> {
                binding.tvStatus.text = "Already up to date"
                binding.tvStatus.setTextColor(getColor(R.color.accent_ok))
                binding.progressBar.visibility = android.view.View.GONE
                binding.btnSync.isEnabled = true
            }
            is SyncState.Syncing -> {
                binding.tvStatus.text = "Syncing file ${state.current} of ${state.total}…"
                binding.tvStatus.setTextColor(getColor(R.color.accent_cyan))
                binding.progressBar.visibility = android.view.View.VISIBLE
                binding.btnSync.isEnabled = false
            }
            is SyncState.Done -> {
                binding.tvStatus.text = "${state.count} file(s) synced"
                binding.tvStatus.setTextColor(getColor(R.color.accent_ok))
                binding.progressBar.visibility = android.view.View.GONE
                binding.btnSync.isEnabled = true
            }
            is SyncState.Error -> {
                binding.tvStatus.text = state.message
                binding.tvStatus.setTextColor(getColor(R.color.accent_warn))
                binding.progressBar.visibility = android.view.View.GONE
                binding.btnSync.isEnabled = true
            }
        }
    }
}