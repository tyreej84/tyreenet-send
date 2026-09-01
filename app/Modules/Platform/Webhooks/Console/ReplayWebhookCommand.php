<?php

declare(strict_types=1);

namespace App\Modules\Platform\Webhooks\Console;

use App\Modules\Platform\Webhooks\Jobs\DeliverWebhook;
use App\Modules\Platform\Webhooks\WebhookDelivery;
use Illuminate\Console\Command;

class ReplayWebhookCommand extends Command
{
    protected $signature = 'projectsend:webhook-replay {delivery : Delivery id}';
    protected $description = 'Replay a recorded webhook delivery';

    public function handle(): int
    {
        $delivery = WebhookDelivery::query()->findOrFail((int) $this->argument('delivery'));
        DeliverWebhook::dispatch($delivery->activity_log_id);
        $this->info('Webhook replay queued.');
        return self::SUCCESS;
    }
}
