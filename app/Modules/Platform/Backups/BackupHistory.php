<?php

declare(strict_types=1);

namespace App\Modules\Platform\Backups;

use Illuminate\Support\Facades\Storage;

class BackupHistory
{
    private const PATH = 'operations/backup-history.json';

    /** @return list<array<string, mixed>> */
    public function all(): array
    {
        if (! Storage::disk('local')->exists(self::PATH)) {
            return [];
        }

        $decoded = json_decode((string) Storage::disk('local')->get(self::PATH), true);

        return is_array($decoded) ? array_values(array_filter($decoded, 'is_array')) : [];
    }

    /** @param array<string, mixed> $entry */
    public function record(array $entry): void
    {
        $history = $this->all();
        array_unshift($history, $entry);
        Storage::disk('local')->put(self::PATH, (string) json_encode(array_slice($history, 0, 50), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }
}
