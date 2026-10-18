<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditEntry;
use App\Support\SearchSql;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'kind' => ['nullable', Rule::in(['activity', 'security', 'error'])],
            'module' => ['nullable', Rule::in(['auth', 'oprec', 'events', 'users', 'merchandise', 'settings', 'public', 'system'])],
            'result' => ['nullable', Rule::in(['success', 'failed'])],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'q' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $query = AuditEntry::query();
        foreach (['kind', 'module', 'result'] as $key) {
            if (isset($filters[$key])) $query->where($key, $filters[$key]);
        }
        if (isset($filters['from'])) $query->where('created_at', '>=', $this->dbInstant(Carbon::parse($filters['from'].' 00:00:00', 'Asia/Jakarta')));
        if (isset($filters['to'])) $query->where('created_at', '<', $this->dbInstant(Carbon::parse($filters['to'].' 00:00:00', 'Asia/Jakarta')->addDay()));
        $search = trim($filters['q'] ?? '');
        if ($search !== '') {
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], mb_strtolower($search));
            $like = "%{$escaped}%";
            $query->where(fn ($match) => $match->whereRaw(SearchSql::lowerLike('summary'), [$like])
                ->orWhereRaw(SearchSql::lowerLike('actor_name'), [$like])
                ->orWhereRaw(SearchSql::lowerLike('action'), [$like])
                ->orWhereRaw(SearchSql::lowerLike('target_id'), [$like])
                ->orWhereRaw(SearchSql::lowerLike('request_id'), [$like]));
        }
        $rows = $query->orderByDesc('created_at')->orderByDesc('id')->paginate(20);
        $statsQuery = AuditEntry::query()->where('created_at', '>=', $this->dbInstant(now()->subDay()));
        $stats = [
            'total' => (clone $statsQuery)->count(),
            'activity' => (clone $statsQuery)->where('kind', 'activity')->count(),
            'security' => (clone $statsQuery)->where('kind', 'security')->count(),
            'errors' => (clone $statsQuery)->where('kind', 'error')->count(),
            'failed' => (clone $statsQuery)->where('result', 'failed')->count(),
        ];
        return response()->json([
            'data' => $rows->getCollection()->map(fn (AuditEntry $entry) => $this->present($entry, false))->all(),
            'meta' => ['page' => $rows->currentPage(), 'lastPage' => $rows->lastPage(), 'perPage' => $rows->perPage(), 'total' => $rows->total()],
            'stats' => $stats,
        ])->header('Cache-Control', 'private, no-store');
    }

    public function show(AuditEntry $entry): JsonResponse
    {
        return response()->json(['data' => $this->present($entry, true)])->header('Cache-Control', 'private, no-store');
    }

    private function present(AuditEntry $entry, bool $detail): array
    {
        $data = [
            'id' => $entry->id,
            'createdAt' => $entry->created_at?->toIso8601String(),
            'kind' => $entry->kind,
            'module' => $entry->module,
            'action' => $entry->action,
            'result' => $entry->result,
            'summary' => $entry->summary,
            'actor' => $entry->actor_id ? ['id' => $entry->actor_id, 'name' => $entry->actor_name, 'role' => $entry->actor_role] : null,
            'target' => $entry->target_id ? ['type' => $entry->target_type, 'id' => $entry->target_id] : null,
            'httpStatus' => $entry->http_status,
            'authMethod' => $entry->context['auth_method'] ?? (str_contains((string) $entry->summary, 'Google') ? 'google' : (str_contains((string) $entry->summary, 'Manual') ? 'manual' : null)),
        ];
        if ($detail) $data += [
            'ipAddress' => $entry->ip_address,
            'requestId' => $entry->request_id,
            'method' => $entry->method,
            'route' => $entry->route,
            'context' => $entry->context ?? [],
        ];
        return $data;
    }

    private function dbInstant(Carbon $time): string
    {
        $utc = $time->copy()->utc();
        return config('database.default') === 'sqlite' ? $utc->format('Y-m-d H:i:s') : $utc->toIso8601String();
    }
}
