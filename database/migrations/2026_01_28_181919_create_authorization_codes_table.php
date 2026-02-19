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
        Schema::create('authorization_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 64)->unique()->comment('授权码');
            $table->text('notes')->nullable()->comment('备注');
            $table->timestamp('start_time')->nullable()->comment('授权开始时间');
            $table->timestamp('end_time')->nullable()->comment('授权结束时间');
            $table->boolean('is_active')->default(true)->comment('是否启用');
            $table->unsignedBigInteger('used_count')->default(0)->comment('使用次数');
            $table->timestamp('last_used_at')->nullable()->comment('最后使用时间');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('authorization_codes');
    }
};
