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
        Schema::create('software_authorizations', function (Blueprint $table) {
            $table->id();
            $table->string('software_name');
            $table->string('software_version');
            $table->string('os_version');
            $table->string('bios_uuid');
            $table->string('motherboard_serial');
            $table->string('cpu_id');
            $table->string('request_ip');
            $table->string('last_access_ip')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('authorized_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('software_authorizations');
    }
};
