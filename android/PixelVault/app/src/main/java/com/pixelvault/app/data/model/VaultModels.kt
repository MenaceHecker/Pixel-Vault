package com.pixelvault.app.data.model

data class PendingFile(
    val id: String,
    val url: String,
    val filename: String,
    val takenAt: String,
    val size: Long
)

data class PendingResponse(
    val files: List<PendingFile>
)

data class UploadResponse(
    val id: String,
    val status: String
)

data class ConfirmRequest(
    val id: String
)

data class ConfirmResponse(
    val id: String,
    val status: String
)