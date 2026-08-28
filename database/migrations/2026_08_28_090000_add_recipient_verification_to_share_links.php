<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('share_links', function (Blueprint $table): void {
            $table->string('recipient_email')->nullable()->after('password_hash');
            $table->string('verification_code_hash')->nullable()->after('recipient_email');
            $table->timestamp('verification_expires_at')->nullable()->after('verification_code_hash');
        });
    }

    public function down(): void
    {
        Schema::table('share_links', fn (Blueprint $table) => $table->dropColumn([
            'recipient_email', 'verification_code_hash', 'verification_expires_at',
        ]));
    }
};
