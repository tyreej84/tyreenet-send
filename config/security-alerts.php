<?php

return [
    'enabled' => env('SECURITY_ALERTS_ENABLED', true),
    'download_threshold' => env('SECURITY_ALERT_DOWNLOAD_THRESHOLD', 25),
    'download_window_minutes' => env('SECURITY_ALERT_DOWNLOAD_WINDOW_MINUTES', 10),
];
