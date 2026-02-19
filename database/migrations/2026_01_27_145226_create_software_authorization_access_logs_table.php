<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('software_authorization_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('software_authorization_id')->constrained()->onDelete('cascade');
            $table->string('access_type')->default('update'); // update: 设备信息更新, check: 正常访问检查
            $table->text('changes')->nullable(); // JSON格式记录变更详情
            $table->ipAddress('ip_address');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('software_authorization_access_logs');
    }
};
