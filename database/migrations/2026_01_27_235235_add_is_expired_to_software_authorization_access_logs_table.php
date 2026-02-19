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
        Schema::table('software_authorization_access_logs', function (Blueprint $table) {
            $table->boolean('is_expired')->default(false)->after('access_type')->comment('是否超出授权时间范围');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('software_authorization_access_logs', function (Blueprint $table) {
            $table->dropColumn('is_expired');
        });
    }
};
