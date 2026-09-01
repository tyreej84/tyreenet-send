<?php

declare(strict_types=1);

namespace App\Modules\Files\Uploads;

class ClamAvHealth
{
    /** @return array{enabled: bool, reachable: bool|null, version: string|null, signature_date: string|null} */
    public function report(): array
    {
        if (! (bool) config('malware.enabled')) {
            return ['enabled' => false, 'reachable' => null, 'version' => null, 'signature_date' => null];
        }

        $socket = @fsockopen((string) config('malware.host'), (int) config('malware.port'), $code, $message, 2);
        if (! is_resource($socket)) {
            return ['enabled' => true, 'reachable' => false, 'version' => null, 'signature_date' => null];
        }

        fwrite($socket, "zVERSION\0");
        $response = stream_get_line($socket, 1024, "\0");
        fclose($socket);
        if (! is_string($response) || $response === '') {
            return ['enabled' => true, 'reachable' => false, 'version' => null, 'signature_date' => null];
        }

        $parts = explode('/', trim($response), 3);

        return [
            'enabled' => true,
            'reachable' => true,
            'version' => $parts[0],
            'signature_date' => $parts[2] ?? null,
        ];
    }
}
