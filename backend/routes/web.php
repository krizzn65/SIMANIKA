<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Auth\EmailVerificationController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['name' => 'SIMANIKA API']));

Route::prefix('api/auth')->group(function () {
    Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])->name('verification.verify');
    Route::get('/google/redirect', [GoogleAuthController::class, 'redirect'])->middleware('throttle:oauth')->name('auth.google.redirect');
    Route::get('/google/callback', [GoogleAuthController::class, 'callback'])->middleware('throttle:oauth')->name('auth.google.callback');
});
