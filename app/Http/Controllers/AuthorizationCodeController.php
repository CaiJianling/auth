<?php

namespace App\Http\Controllers;

use App\Models\AuthorizationCode;
use App\Models\SoftwareAuthorization;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuthorizationCodeController extends Controller
{
    /**
     * 授权码管理页面
     */
    public function index()
    {
        $codes = AuthorizationCode::latest()->get();

        // 获取所有唯一的授权码值
        $codeValues = AuthorizationCode::distinct()
            ->whereNotNull('code')
            ->pluck('code')
            ->unique()
            ->sort()
            ->values();

        return inertia('authorization-code/index', [
            'codes' => $codes,
            'code_values' => $codeValues,
        ]);
    }

    /**
     * 创建授权码
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|unique:authorization_codes,code',
            'notes' => 'nullable|string',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
        ]);

        // 如果没有提供授权码，则自动生成
        $code = $validated['code'] ?? AuthorizationCode::generateCode();

        AuthorizationCode::create([
            'name' => $validated['name'],
            'code' => $code,
            'notes' => $validated['notes'] ?? null,
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
        ]);

        return back()->with('success', '授权码已创建');
    }

    /**
     * 更新授权码
     */
    public function update(Request $request, AuthorizationCode $authorizationCode)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|unique:authorization_codes,code,' . $authorizationCode->id,
            'notes' => 'nullable|string',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
            'is_active' => 'boolean',
        ]);

        $authorizationCode->update([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? $authorizationCode->code,
            'notes' => $validated['notes'] ?? null,
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'is_active' => $validated['is_active'] ?? $authorizationCode->is_active,
        ]);

        return back()->with('success', '授权码已更新');
    }

    /**
     * 删除授权码
     */
    public function destroy(AuthorizationCode $authorizationCode)
    {
        $authorizationCode->delete();
        return back()->with('success', '授权码已删除');
    }

    /**
     * 验证授权码并创建授权
     */
    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'software_name' => 'required|string|max:255',
            'software_version' => 'required|string|max:50',
            'os_version' => 'required|string|max:100',
            'bios_uuid' => 'required|string|max:255',
            'motherboard_serial' => 'required|string|max:255',
            'cpu_id' => 'required|string|max:255',
        ]);

        $authCode = AuthorizationCode::where('code', $validated['code'])->first();

        if (!$authCode) {
            return response()->json([
                'success' => false,
                'message' => '授权码不存在',
            ], 404);
        }

        if (!$authCode->isValid()) {
            return response()->json([
                'success' => false,
                'message' => '授权码已过期或已禁用',
            ], 403);
        }

        // 检查是否已有授权记录
        $existingAuth = SoftwareAuthorization::where('bios_uuid', $validated['bios_uuid'])
            ->where('motherboard_serial', $validated['motherboard_serial'])
            ->where('cpu_id', $validated['cpu_id'])
            ->first();

        $ip = $request->ip();

        if ($existingAuth && $existingAuth->isApproved()) {
            // 记录授权码使用
            $authCode->recordUsage();

            return response()->json([
                'success' => true,
                'message' => '授权成功',
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
            'notes' => $authCode->notes,
            'start_time' => $authCode->start_time,
            'end_time' => $authCode->end_time,
        ]);

        // 记录授权码使用
        $authCode->recordUsage();

        return response()->json([
            'success' => true,
            'message' => '授权成功',
            'status' => 'approved',
        ]);
    }
}
