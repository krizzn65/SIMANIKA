<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['name' => 'SIMANIKA API']));

Route::prefix('api/auth')->group(function () {
    Route::get('/google/redirect', [GoogleAuthController::class, 'redirect'])->middleware('throttle:oauth')->name('auth.google.redirect');
    Route::get('/google/callback', [GoogleAuthController::class, 'callback'])->middleware('throttle:oauth')->name('auth.google.callback');
});
