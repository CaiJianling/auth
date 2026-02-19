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
        Schema::create('softwares', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('软件名称');
            $table->string('latest_version')->comment('最新版本号');
            $table->string('download_url')->nullable()->comment('最新版本下载链接');
            $table->boolean('is_active')->default(true)->comment('是否启用');
            $table->text('notes')->nullable()->comment('备注');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('softwares');
    }
};
