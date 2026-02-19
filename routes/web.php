<?php

use App\Http\Controllers\SoftwareController;
use App\Http\Controllers\SoftwareAuthorizationController;
use App\Http\Controllers\AuthorizationCodeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->prefix('software-authorization')->group(function () {
    Route::get('/', [SoftwareAuthorizationController::class, 'index'])->name('software-authorization.index');
    Route::post('{authorization}/approve', [SoftwareAuthorizationController::class, 'approve'])->name('software-authorization.approve');
    Route::post('{authorization}/reject', [SoftwareAuthorizationController::class, 'reject'])->name('software-authorization.reject');
    Route::put('{authorization}', [SoftwareAuthorizationController::class, 'update'])->name('software-authorization.update');
    Route::get('{authorization}/access-logs', [SoftwareAuthorizationController::class, 'accessLogs'])->name('software-authorization.access-logs');
    Route::delete('{authorization}', [SoftwareAuthorizationController::class, 'destroy'])->name('software-authorization.destroy');
});

Route::middleware(['auth', 'verified'])->prefix('authorization-code')->group(function () {
    Route::get('/', [AuthorizationCodeController::class, 'index'])->name('authorization-code.index');
    Route::post('/', [AuthorizationCodeController::class, 'store'])->name('authorization-code.store');
    Route::put('{authorizationCode}', [AuthorizationCodeController::class, 'update'])->name('authorization-code.update');
    Route::delete('{authorizationCode}', [AuthorizationCodeController::class, 'destroy'])->name('authorization-code.destroy');
});

Route::middleware(['auth', 'verified'])->prefix('software')->group(function () {
    Route::get('/', [SoftwareController::class, 'index'])->name('software.index');
    Route::post('/', [SoftwareController::class, 'store'])->name('software.store');
    Route::put('{software}', [SoftwareController::class, 'update'])->name('software.update');
    Route::delete('{software}', [SoftwareController::class, 'destroy'])->name('software.destroy');
    Route::post('{software}/toggle', [SoftwareController::class, 'toggleStatus'])->name('software.toggle');
});

Route::post('api/software/authorize', [SoftwareAuthorizationController::class, 'authorize'])->name('api.software.authorize');
Route::post('api/software/authorize-with-code', [SoftwareAuthorizationController::class, 'authorizeWithCode'])->middleware('api')->name('api.software.authorize-with-code');
Route::post('api/authorization-code/validate', [AuthorizationCodeController::class, 'validate'])->name('api.authorization-code.validate');
Route::get('api/software/{software}', [SoftwareController::class, 'show'])->name('api.software.show');

require __DIR__.'/settings.php';
