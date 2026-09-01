<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Audit\Action;
use App\Modules\Audit\ActivityLog;
use App\Modules\Platform\Backups\BackupHistory;
use App\Modules\Platform\Webhooks\Jobs\DeliverWebhook;
use App\Modules\Platform\Webhooks\WebhookDelivery;
use App\Modules\Files\Uploads\UploadContentPolicy;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

test('backup results are retained and shown to administrators', function () {
    Storage::fake('local');

    Artisan::call('projectsend:record-backup', [
        '--status' => 'completed',
        '--name' => 'projectsend-20260901T120000Z',
        '--bytes' => 1234,
    ]);

    expect(app(BackupHistory::class)->all())->toHaveCount(1);

    $this->actingAs(User::factory()->create())
        ->get('/system/settings/security')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('backup_history.0.status', 'completed')
            ->where('backup_history.0.bytes', 1234));
});

test('webhooks are signed, recorded, and contain the audit event', function () {
    config(['webhooks.url' => 'https://hooks.example.test/tyreenet', 'webhooks.secret' => 'test-secret']);
    Http::fake(['hooks.example.test/*' => Http::response(null, 204)]);

    $activity = ActivityLog::query()->create([
        'action' => Action::FileUploaded,
        'origin' => 'system',
        'created_at' => now(),
    ]);

    (new DeliverWebhook($activity->id))->handle();

    Http::assertSent(function ($request): bool {
        $timestamp = $request->header('X-TyreeNet-Timestamp')[0] ?? '';
        $signature = $request->header('X-TyreeNet-Signature')[0] ?? '';

        return $request->url() === 'https://hooks.example.test/tyreenet'
            && $signature === 'sha256='.hash_hmac('sha256', $timestamp.'.'.$request->body(), 'test-secret');
    });

    expect(WebhookDelivery::query()->firstOrFail()->delivered_at)->not->toBeNull();
});

test('protected operational health is available to administrators', function () {
    config(['malware.enabled' => false]);

    $response = $this->actingAs(User::factory()->create())
        ->getJson('/system/health');

    $response->assertStatus($response->json('ready') ? 200 : 503)
        ->assertJsonStructure(['ready', 'database', 'redis', 'storage', 'malware_scanner', 'scheduler', 'checked_at']);
});

test('disguised scripts and encrypted archives are rejected before scanning', function (string $bytes) {
    $stream = fopen('php://temp', 'w+b');
    fwrite($stream, $bytes);
    rewind($stream);

    expect(fn () => app(UploadContentPolicy::class)->inspect($stream, 'document.pdf'))
        ->toThrow(ValidationException::class);

    fclose($stream);
})->with([
    'php disguised as a pdf' => "<?php echo 'owned';",
    'windows executable disguised as a pdf' => "MZ\x90\x00",
    'encrypted zip' => "PK\x03\x04\x14\x00\x01\x00",
]);
