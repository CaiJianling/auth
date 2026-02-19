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
        Schema::table('software_authorizations', function (Blueprint $table) {
            $table->foreignId('authorization_code_id')->nullable()->after('notes')->comment('关联授权码ID');
            $table->foreign('authorization_code_id')->references('id')->on('authorization_codes')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('software_authorizations', function (Blueprint $table) {
            $table->dropForeign(['authorization_code_id']);
            $table->dropColumn('authorization_code_id');
        });
    }
};
