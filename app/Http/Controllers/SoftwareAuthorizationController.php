<?php

namespace App\Http\Controllers;

use App\Models\SoftwareAuthorization;
use App\Models\AuthorizationCode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SoftwareAuthorizationController extends Controller
{
    /**
     * 获取授权审批列表
     */
    public function index()
    {
        $authorizations = SoftwareAuthorization::with('authorizationCode')->latest()->get();
        $authorizationCodes = AuthorizationCode::where('is_active', true)->get();

        return inertia('software-authorization/index', [
            'authorizations' => $authorizations,
            'authorization_codes' => $authorizationCodes,
        ]);
    }

    /**
     * 软件授权接口
     */
    public function authorize(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'software_name' => 'required|string|max:255',
            'software_version' => 'required|string|max:50',
            'os_version' => 'required|string|max:100',
            'bios_uuid' => 'required|string|max:255',
            'motherboard_serial' => 'required|string|max:255',
            'cpu_id' => 'required|string|max:255',
        ]);

        $ip = $request->ip();

        // 检查是否已有授权记录（完全匹配）
        $existingAuth = SoftwareAuthorization::where('bios_uuid', $validated['bios_uuid'])
            ->where('motherboard_serial', $validated['motherboard_serial'])
            ->where('cpu_id', $validated['cpu_id'])
            ->first();

        if ($existingAuth && $existingAuth->isApproved()) {
            // 更新最后访问IP
            $existingAuth->update(['last_access_ip' => $ip]);

            // 检查是否在授权时间范围内
            if (!$existingAuth->isWithinAuthorizationPeriod()) {
                // 记录访问日志（超出授权时间范围，永久标识）
                $existingAuth->accessLogs()->create([
                    'access_type' => 'check',
                    'ip_address' => $ip,
                    'is_expired' => true,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => '不在授权时间范围内',
                    'status' => 'expired',
                ]);
            }

            // 记录正常访问日志
            $existingAuth->accessLogs()->create([
                'access_type' => 'check',
                'ip_address' => $ip,
                'is_expired' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => '授权成功',
                'status' => 'approved',
            ]);
        }

        if ($existingAuth && $existingAuth->isRejected()) {
            return response()->json([
                'success' => false,
                'message' => '授权已被拒绝',
                'status' => 'rejected',
            ]);
        }

        if ($existingAuth && $existingAuth->isPending()) {
            return response()->json([
                'success' => false,
                'message' => '授权申请正在审核中',
                'status' => 'pending',
            ]);
        }

        // 检查是否有已授权设备的部分匹配
        $partialMatchAuth = SoftwareAuthorization::approved()
            ->where(function ($query) use ($validated) {
                $query->where('bios_uuid', $validated['bios_uuid'])
                    ->orWhere('motherboard_serial', $validated['motherboard_serial'])
                    ->orWhere('cpu_id', $validated['cpu_id']);
            })
            ->first();

        if ($partialMatchAuth) {
            // 检查是否在授权时间范围内
            if (!$partialMatchAuth->isWithinAuthorizationPeriod()) {
                // 更新最后访问IP
                $partialMatchAuth->update(['last_access_ip' => $ip]);

                // 记录访问日志（超出授权时间范围，永久标识）
                $partialMatchAuth->accessLogs()->create([
                    'access_type' => 'check',
                    'ip_address' => $ip,
                    'is_expired' => true,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => '不在授权时间范围内',
                    'status' => 'expired',
                ]);
            }

            // 记录变更前的数据
            $changes = [
                'before' => [
                    'bios_uuid' => $partialMatchAuth->bios_uuid,
                    'motherboard_serial' => $partialMatchAuth->motherboard_serial,
                    'cpu_id' => $partialMatchAuth->cpu_id,
                ],
                'after' => [
                    'bios_uuid' => $validated['bios_uuid'],
                    'motherboard_serial' => $validated['motherboard_serial'],
                    'cpu_id' => $validated['cpu_id'],
                ],
            ];

            // 更新授权记录
            $partialMatchAuth->update([
                'bios_uuid' => $validated['bios_uuid'],
                'motherboard_serial' => $validated['motherboard_serial'],
                'cpu_id' => $validated['cpu_id'],
                'software_name' => $validated['software_name'],
                'software_version' => $validated['software_version'],
                'os_version' => $validated['os_version'],
                'last_access_ip' => $ip,
            ]);

            // 记录设备信息更新日志
            $partialMatchAuth->accessLogs()->create([
                'access_type' => 'update',
                'changes' => $changes,
                'ip_address' => $ip,
                'is_expired' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => '授权成功（设备信息已更新）',
                'status' => 'approved',
            ]);
        }

        // 创建新的授权请求
        $authorization = SoftwareAuthorization::create([
            'software_name' => $validated['software_name'],
            'software_version' => $validated['software_version'],
            'os_version' => $validated['os_version'],
            'bios_uuid' => $validated['bios_uuid'],
            'motherboard_serial' => $validated['motherboard_serial'],
            'cpu_id' => $validated['cpu_id'],
            'request_ip' => $ip,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => false,
            'message' => '授权申请已提交，请等待审核',
            'status' => 'pending',
        ], 202);
    }

    /**
     * 批准授权
     */
    public function approve(Request $request, SoftwareAuthorization $authorization)
    {
        $request->validate([
            'authorization_code_id' => 'required|exists:authorization_codes,id',
            'notes' => 'nullable|string',
        ]);

        $authCode = AuthorizationCode::findOrFail($request->input('authorization_code_id'));

        // 记录授权码变更
        $codeChanges = null;
        if ($authorization->authorization_code_id != $authCode->id) {
            $codeChanges = [
                'before' => [
                    'code' => $authorization->authorizationCode?->code,
                    'notes' => $authorization->authorizationCode?->notes,
                    'start_time' => $authorization->authorizationCode?->start_time ? $authorization->authorizationCode->start_time->format('Y-m-d H:i:s') : null,
                    'end_time' => $authorization->authorizationCode?->end_time ? $authorization->authorizationCode->end_time->format('Y-m-d H:i:s') : null,
                ],
                'after' => [
                    'code' => $authCode->code,
                    'notes' => $authCode->notes,
                    'start_time' => $authCode->start_time ? $authCode->start_time->format('Y-m-d H:i:s') : null,
                    'end_time' => $authCode->end_time ? $authCode->end_time->format('Y-m-d H:i:s') : null,
                ],
            ];
        }

        $authorization->update([
            'status' => 'approved',
            'authorized_at' => now(),
            'authorization_code_id' => $authCode->id,
            'notes' => $request->input('notes'),
        ]);

        // 如果授权码有变更，记录日志
        if ($codeChanges) {
            $authorization->accessLogs()->create([
                'access_type' => 'code_change',
                'changes' => $codeChanges,
                'ip_address' => $request->ip(),
                'is_expired' => false,
            ]);
        }

        return back()->with('success', '授权已批准');
    }

    /**
     * 拒绝授权
     */
    public function reject(Request $request, SoftwareAuthorization $authorization)
    {
        $authorization->update([
            'status' => 'rejected',
            'notes' => $request->input('notes'),
        ]);

        return back()->with('success', '授权已拒绝');
    }

    /**
     * 删除授权记录
     */
    public function destroy(SoftwareAuthorization $authorization)
    {
        $authorization->delete();

        return back()->with('success', '授权记录已删除');
    }

    /**
     * 更新授权记录（更换授权码）
     */
    public function update(Request $request, SoftwareAuthorization $authorization)
    {
        $request->validate([
            'authorization_code_id' => 'required|exists:authorization_codes,id',
        ]);

        $authCode = AuthorizationCode::findOrFail($request->input('authorization_code_id'));

        // 记录授权码变更
        $codeChanges = [
            'before' => [
                'code' => $authorization->authorizationCode?->code,
                'notes' => $authorization->authorizationCode?->notes,
                'start_time' => $authorization->authorizationCode?->start_time ? $authorization->authorizationCode->start_time->format('Y-m-d H:i:s') : null,
                'end_time' => $authorization->authorizationCode?->end_time ? $authorization->authorizationCode->end_time->format('Y-m-d H:i:s') : null,
            ],
            'after' => [
                'code' => $authCode->code,
                'notes' => $authCode->notes,
                'start_time' => $authCode->start_time ? $authCode->start_time->format('Y-m-d H:i:s') : null,
                'end_time' => $authCode->end_time ? $authCode->end_time->format('Y-m-d H:i:s') : null,
            ],
        ];

        $authorization->update([
            'authorization_code_id' => $authCode->id,
        ]);

        // 记录授权码变更日志
        $authorization->accessLogs()->create([
            'access_type' => 'code_change',
            'changes' => $codeChanges,
            'ip_address' => $request->ip(),
            'is_expired' => false,
        ]);

        return back()->with('success', '授权记录已更新');
    }

    /**
     * 使用授权码进行授权验证（Bearer Token 方式）
     */
    public function authorizeWithCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'software_name' => 'required|string|max:255',
            'software_version' => 'required|string|max:50',
            'os_version' => 'required|string|max:100',
            'bios_uuid' => 'required|string|max:255',
            'motherboard_serial' => 'required|string|max:255',
            'cpu_id' => 'required|string|max:255',
        ]);

        // 从请求中获取已验证的授权码（由中间件验证）
        $authCode = $request->attributes->get('auth_code');

        if (!$authCode) {
            return response()->json([
                'success' => false,
                'message' => '授权验证失败',
            ], 401);
        }

        $ip = $request->ip();

        // 检查是否已有授权记录（完全匹配）
        $existingAuth = SoftwareAuthorization::where('bios_uuid', $validated['bios_uuid'])
            ->where('motherboard_serial', $validated['motherboard_serial'])
            ->where('cpu_id', $validated['cpu_id'])
            ->first();

        if ($existingAuth && $existingAuth->isApproved()) {
            // 更新最后访问IP
            $existingAuth->update(['last_access_ip' => $ip]);

            // 检查是否在授权时间范围内
            if (!$existingAuth->isWithinAuthorizationPeriod()) {
                // 记录访问日志（超出授权时间范围，永久标识）
                $existingAuth->accessLogs()->create([
                    'access_type' => 'check',
                    'ip_address' => $ip,
                    'is_expired' => true,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => '不在授权时间范围内',
                    'status' => 'expired',
                ]);
            }

            // 记录正常访问日志
            $existingAuth->accessLogs()->create([
                'access_type' => 'check',
                'ip_address' => $ip,
                'is_expired' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => '授权成功',
                'status' => 'approved',
            ]);
        }

        // 检查是否有已授权设备的部分匹配
        $partialMatchAuth = SoftwareAuthorization::approved()
            ->where(function ($query) use ($validated) {
                $query->where('bios_uuid', $validated['bios_uuid'])
                    ->orWhere('motherboard_serial', $validated['motherboard_serial'])
                    ->orWhere('cpu_id', $validated['cpu_id']);
            })
            ->first();

        if ($partialMatchAuth) {
            // 检查是否在授权时间范围内
            if (!$partialMatchAuth->isWithinAuthorizationPeriod()) {
                // 更新最后访问IP
                $partialMatchAuth->update(['last_access_ip' => $ip]);

                // 记录访问日志（超出授权时间范围，永久标识）
                $partialMatchAuth->accessLogs()->create([
                    'access_type' => 'check',
                    'ip_address' => $ip,
                    'is_expired' => true,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => '不在授权时间范围内',
                    'status' => 'expired',
                ]);
            }

            // 记录变更前的数据
            $changes = [
                'before' => [
                    'bios_uuid' => $partialMatchAuth->bios_uuid,
                    'motherboard_serial' => $partialMatchAuth->motherboard_serial,
                    'cpu_id' => $partialMatchAuth->cpu_id,
                ],
                'after' => [
                    'bios_uuid' => $validated['bios_uuid'],
                    'motherboard_serial' => $validated['motherboard_serial'],
                    'cpu_id' => $validated['cpu_id'],
                ],
            ];

            // 更新授权记录
            $partialMatchAuth->update([
                'bios_uuid' => $validated['bios_uuid'],
                'motherboard_serial' => $validated['motherboard_serial'],
                'cpu_id' => $validated['cpu_id'],
                'software_name' => $validated['software_name'],
                'software_version' => $validated['software_version'],
                'os_version' => $validated['os_version'],
                'last_access_ip' => $ip,
            ]);

            // 记录设备信息更新日志
            $partialMatchAuth->accessLogs()->create([
                'access_type' => 'update',
                'changes' => $changes,
                'ip_address' => $ip,
                'is_expired' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => '授权成功（设备信息已更新）',
                'status' => 'approved',
            ]);
        }

        // 创建新的授权记录
        $authorization = SoftwareAuthorization::create([
            'software_name' => $validated['software_name'],
            'software_version' => $validated['software_version'],
            'os_version' => $validated['os_version'],
            'bios_uuid' => $validated['bios_uuid'],
            'motherboard_serial' => $validated['motherboard_serial'],
            'cpu_id' => $validated['cpu_id'],
            'request_ip' => $ip,
            'status' => 'approved',
            'authorized_at' => now(),
            'authorization_code_id' => $authCode->id,
            'notes' => $authCode->notes,
        ]);

        // 记录授权码使用
        $authCode->recordUsage();

        return response()->json([
            'success' => true,
            'message' => '授权成功',
            'status' => 'approved',
        ]);
    }

    /**
     * 获取授权访问记录
     */
    public function accessLogs(Request $request, SoftwareAuthorization $authorization)
    {
        $perPage = $request->input('per_page', 10);
        $page = $request->input('page', 1);
        $accessType = $request->input('access_type');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = $authorization->accessLogs()->latest();

        // 按类型筛选
        if ($accessType) {
            if ($accessType === 'expired') {
                // 筛选超出授权时间范围
                $query->where('is_expired', true);
            } elseif ($accessType === 'normal') {
                // 筛选正常访问
                $query->where('access_type', 'check')->where('is_expired', false);
            } elseif ($accessType === 'update') {
                // 筛选设备信息更新
                $query->where('access_type', 'update');
            } elseif ($accessType === 'code_change') {
                // 筛选授权码变更
                $query->where('access_type', 'code_change');
            }
        }

        // 按时间范围筛选
        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        $logs = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'logs' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
            'authorization' => [
                'notes' => $authorization->notes,
            ],
        ]);
    }
}
