<?php

declare(strict_types=1);

namespace App\Modules\Platform\Backups\Console;

use App\Modules\Platform\Backups\BackupHistory;
use Illuminate\Console\Command;

class RecordBackupCommand extends Command
{
    protected $signature = 'projectsend:record-backup
        {--status=completed : completed, failed, verified, restored, or offsite}
        {--name= : Non-sensitive backup identifier}
        {--bytes=0 : Total backup size}
        {--message= : Optional result detail}';

    protected $description = 'Record a backup, verification, restore drill, or off-site copy result';

    public function handle(BackupHistory $history): int
    {
        $status = (string) $this->option('status');
        if (! in_array($status, ['completed', 'failed', 'verified', 'restored', 'offsite'], true)) {
            $this->error('Unsupported backup status.');
            return self::INVALID;
        }

        $history->record([
            'status' => $status,
            'name' => (string) ($this->option('name') ?: 'backup'),
            'bytes' => max(0, (int) $this->option('bytes')),
            'message' => (string) ($this->option('message') ?: ''),
            'recorded_at' => now()->toIso8601String(),
        ]);

        $this->info('Backup result recorded.');
        return self::SUCCESS;
    }
}
