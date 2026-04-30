package com.pixelvault.app.data

import com.pixelvault.app.data.model.ConfirmRequest
import com.pixelvault.app.data.model.ConfirmResponse
import com.pixelvault.app.data.model.PendingResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface VaultApi {

    @GET("api/pending")
    suspend fun getPending(): PendingResponse

    @POST("api/confirm")
    suspend fun confirm(@Body request: ConfirmRequest): ConfirmResponse
}