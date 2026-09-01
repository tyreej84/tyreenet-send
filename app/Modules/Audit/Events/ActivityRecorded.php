<?php

declare(strict_types=1);

namespace App\Modules\Audit\Events;

use App\Modules\Audit\ActivityLog;

class ActivityRecorded
{
    public function __construct(public readonly ActivityLog $activity) {}
}
