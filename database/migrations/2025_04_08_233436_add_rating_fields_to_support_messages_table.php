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
        Schema::table('support_messages', function (Blueprint $table) {
            $table->unsignedTinyInteger('rating')->nullable()->after('responded_at')->comment('Оценка ответа от 1 до 5');
            $table->text('feedback_comment')->nullable()->after('rating')->comment('Комментарий к оценке');
            $table->boolean('archived')->default(false)->after('feedback_comment')->comment('Помещено в архив');
            $table->timestamp('rated_at')->nullable()->after('archived')->comment('Когда была оставлена оценка');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_messages', function (Blueprint $table) {
            $table->dropColumn(['rating', 'feedback_comment', 'archived', 'rated_at']);
        });
    }
};
