<?php

return [
    'url' => env('WEBHOOK_URL'),
    'secret' => env('WEBHOOK_SECRET'),
    'timeout' => (int) env('WEBHOOK_TIMEOUT', 10),
];
