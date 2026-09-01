<?php

declare(strict_types=1);

namespace App\Modules\Files\Uploads;

use Illuminate\Validation\ValidationException;

class UploadContentPolicy
{
    /** @param resource $stream */
    public function inspect($stream, string $filename): void
    {
        $header = fread($stream, 8192);
        rewind($stream);
        if (! is_string($header)) {
            throw ValidationException::withMessages(['file' => __('The uploaded file could not be inspected.')]);
        }

        $trimmed = ltrim($header);
        $dangerous = str_starts_with($header, 'MZ')
            || str_starts_with($header, "\x7fELF")
            || preg_match('/^#!\s*\/(?:usr\/bin\/env\s+)?(?:ba|z|k)?sh\b/i', $trimmed) === 1
            || preg_match('/<\?(?:php|=)/i', $header) === 1
            || preg_match('/<(?:script|html|svg)\b/i', $trimmed) === 1;

        if ($dangerous) {
            throw ValidationException::withMessages([
                'file' => __('The upload was rejected because its contents do not match an allowed document type.'),
            ]);
        }

        // General-purpose bit 0 in a ZIP local-file header means encrypted.
        // ClamAV cannot inspect what it cannot decrypt, so production's
        // fail-closed promise includes refusing it before metadata exists.
        if ((bool) config('malware.reject_encrypted_archives', true)
            && str_starts_with($header, "PK\x03\x04")
            && isset($header[7])
            && ((ord($header[6]) | (ord($header[7]) << 8)) & 0x0001) !== 0) {
            throw ValidationException::withMessages([
                'file' => __('Encrypted archives cannot be accepted because their contents cannot be scanned.'),
            ]);
        }
    }
}
