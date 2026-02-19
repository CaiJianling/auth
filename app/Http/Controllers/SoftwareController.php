<?php

namespace App\Http\Controllers;

use App\Models\Software;
use Illuminate\Http\Request;

class SoftwareController extends Controller
{
    /**
     * 软件管理页面
     */
    public function index()
    {
        $softwares = Software::latest()->get();
        return inertia('software/index', [
            'softwares' => $softwares,
        ]);
    }

    /**
     * 创建软件
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'latest_version' => 'required|string|max:50',
            'download_url' => 'nullable|url|max:2048',
            'notes' => 'nullable|string',
        ]);

        Software::create($validated);

        return back()->with('success', '软件已添加');
    }

    /**
     * 更新软件
     */
    public function update(Request $request, Software $software)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'latest_version' => 'required|string|max:50',
            'download_url' => 'nullable|url|max:2048',
            'is_active' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $software->update($validated);

        return back()->with('success', '软件已更新');
    }

    /**
     * 删除软件
     */
    public function destroy(Software $software)
    {
        $software->delete();
        return back()->with('success', '软件已删除');
    }

    /**
     * 切换软件状态
     */
    public function toggleStatus(Software $software)
    {
        $software->update(['is_active' => !$software->is_active]);
        $status = $software->is_active ? '已启用' : '已停用';
        return back()->with('success', "软件{$status}");
    }

    /**
     * 获取软件信息 API
     */
    public function show(Software $software)
    {
        if (!$software->is_active) {
            return response()->json([
                'success' => false,
                'message' => '软件已停用',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'name' => $software->name,
                'latest_version' => $software->latest_version,
                'download_url' => $software->download_url,
            ],
        ]);
    }
}
