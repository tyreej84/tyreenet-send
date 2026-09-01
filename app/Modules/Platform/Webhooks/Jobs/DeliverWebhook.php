<?php

declare(strict_types=1);

namespace App\Modules\Platform\Webhooks\Jobs;

use App\Modules\Audit\ActivityLog;
use App\Modules\Platform\Webhooks\WebhookDelivery;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class DeliverWebhook implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    /** @var list<int> */
    public array $backoff = [30, 120, 600, 1800];

    public function __construct(public readonly int $activityId) {}

    public function handle(): void
    {
        $url = config('webhooks.url');
        $secret = config('webhooks.secret');
        if (! is_string($url) || $url === '' || ! is_string($secret) || $secret === '') {
            return;
        }

        $activity = ActivityLog::query()->findOrFail($this->activityId);
        $payload = (string) json_encode([
            'id' => $activity->id,
            'event' => $activity->action->value,
            'occurred_at' => $activity->created_at->toIso8601String(),
            'actor' => ['id' => $activity->actor_id, 'name' => $activity->actor_name, 'type' => $activity->actor_type],
            'subject' => ['type' => $activity->subject_type, 'id' => $activity->subject_id, 'name' => $activity->subject_name],
            'context' => $activity->context,
        ], JSON_UNESCAPED_SLASHES);

        $delivery = WebhookDelivery::query()->firstOrCreate([
            'activity_log_id' => $activity->id,
            'endpoint_hash' => hash('sha256', $url),
        ], ['event' => $activity->action->value]);
        $delivery->increment('attempts');
        $timestamp = (string) now()->timestamp;

        try {
            $response = Http::timeout((int) config('webhooks.timeout', 10))
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-TyreeNet-Event' => $activity->action->value,
                    'X-TyreeNet-Timestamp' => $timestamp,
                    'X-TyreeNet-Signature' => 'sha256='.hash_hmac('sha256', $timestamp.'.'.$payload, $secret),
                ])->withBody($payload, 'application/json')->post($url);

            $delivery->forceFill([
                'response_status' => $response->status(),
                'response_excerpt' => mb_substr($response->body(), 0, 1000),
                'delivered_at' => $response->successful() ? now() : null,
                'failed_at' => $response->successful() ? null : now(),
            ])->save();

            if (! $response->successful()) {
                throw new RuntimeException('Webhook endpoint returned HTTP '.$response->status());
            }
        } catch (Throwable $exception) {
            $delivery->forceFill(['failed_at' => now(), 'response_excerpt' => mb_substr($exception->getMessage(), 0, 1000)])->save();
            throw $exception;
        }
    }
}
