<?php

declare(strict_types=1);

namespace App\Modules\Platform\Webhooks;

use Illuminate\Database\Eloquent\Model;

class WebhookDelivery extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['delivered_at' => 'datetime', 'failed_at' => 'datetime'];
    }
}
