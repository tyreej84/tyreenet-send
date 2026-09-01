<?php

declare(strict_types=1);

namespace App\Modules\Platform\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Platform\Installation\OperationalHealth;
use Illuminate\Http\JsonResponse;

class OperationalHealthController extends Controller
{
    public function __invoke(OperationalHealth $health): JsonResponse
    {
        $report = $health->report();
        return response()->json($report, $report['ready'] ? 200 : 503);
    }
}
