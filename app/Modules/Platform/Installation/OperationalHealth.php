<?php

declare(strict_types=1);

namespace App\Modules\Platform\Installation;

use App\Modules\Files\Uploads\ClamAvHealth;
use App\Modules\Platform\Scheduling\ScheduledTaskRun;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Throwable;

class OperationalHealth
{
    public function __construct(private readonly ClamAvHealth $clamAv) {}

    /** @return array<string, mixed> */
    public function report(): array
    {
        $database = $this->probe(fn () => DB::select('select 1'));
        $redis = $this->probe(fn () => Redis::connection()->command('ping'));
        $storagePath = storage_path('app');
        $free = @disk_free_space($storagePath);
        $scheduler = ScheduledTaskRun::query()->orderByDesc('ran_at')->first();
        $clamAv = $this->clamAv->report();

        return [
            'ready' => $database && $redis && is_writable($storagePath) && ($clamAv['reachable'] !== false),
            'database' => $database,
            'redis' => $redis,
            'storage' => ['writable' => is_writable($storagePath), 'free_bytes' => is_float($free) ? (int) $free : null],
            'malware_scanner' => $clamAv,
            'scheduler' => [
                'last_task' => $scheduler?->command,
                'status' => $scheduler?->status->value,
                'last_ran_at' => $scheduler?->ran_at->toIso8601String(),
            ],
            'checked_at' => now()->toIso8601String(),
        ];
    }

    private function probe(callable $probe): bool
    {
        try {
            $probe();
            return true;
        } catch (Throwable) {
            return false;
        }
    }
}
