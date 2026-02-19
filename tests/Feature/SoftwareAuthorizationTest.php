<?php

use App\Models\SoftwareAuthorization;
use App\Models\User;
use Illuminate\Support\Facades\Route;

test('授权接口可以正常接收请求', function () {
    $response = $this->postJson('/api/software/authorize', [
        'software_name' => '测试软件',
        'software_version' => '1.0.0',
        'os_version' => 'Windows 11',
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response->assertStatus(202);
    $response->assertJson([
        'success' => false,
        'message' => '授权申请已提交，请等待审核',
        'status' => 'pending',
    ]);

    $this->assertDatabaseHas('software_authorizations', [
        'software_name' => '测试软件',
        'bios_uuid' => 'test-uuid-12345',
    ]);
});

test('已批准的授权可以直接通过验证', function () {
    $authorization = SoftwareAuthorization::factory()->create([
        'status' => 'approved',
        'software_name' => '测试软件',
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response = $this->postJson('/api/software/authorize', [
        'software_name' => '测试软件',
        'software_version' => '1.0.0',
        'os_version' => 'Windows 11',
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => true,
        'message' => '授权成功',
        'status' => 'approved',
    ]);
});

test('已拒绝的授权不能通过验证', function () {
    $authorization = SoftwareAuthorization::factory()->create([
        'status' => 'rejected',
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response = $this->postJson('/api/software/authorize', [
        'software_name' => '测试软件',
        'software_version' => '1.0.0',
        'os_version' => 'Windows 11',
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => false,
        'message' => '授权已被拒绝',
        'status' => 'rejected',
    ]);
});

test('待审核的授权返回待审核状态', function () {
    $authorization = SoftwareAuthorization::factory()->create([
        'status' => 'pending',
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response = $this->postJson('/api/software/authorize', [
        'software_name' => '测试软件',
        'software_version' => '1.0.0',
        'os_version' => 'Windows 11',
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => false,
        'message' => '授权申请正在审核中',
        'status' => 'pending',
    ]);
});

test('未认证用户无法访问授权管理页面', function () {
    $response = $this->get('/software-authorization');

    $response->assertRedirect('/login');
});

test('认证用户可以访问授权管理页面', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/software-authorization');

    $response->assertStatus(200);
});

test('认证用户可以批准授权', function () {
    $user = User::factory()->create();
    $authorization = SoftwareAuthorization::factory()->create(['status' => 'pending']);

    $response = $this->actingAs($user)->post("/software-authorization/{$authorization->id}/approve", [
        'notes' => '授权批准',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('software_authorizations', [
        'id' => $authorization->id,
        'status' => 'approved',
        'notes' => '授权批准',
    ]);
});

test('认证用户可以拒绝授权', function () {
    $user = User::factory()->create();
    $authorization = SoftwareAuthorization::factory()->create(['status' => 'pending']);

    $response = $this->actingAs($user)->post("/software-authorization/{$authorization->id}/reject", [
        'notes' => '授权拒绝',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('software_authorizations', [
        'id' => $authorization->id,
        'status' => 'rejected',
        'notes' => '授权拒绝',
    ]);
});

test('认证用户可以删除授权记录', function () {
    $user = User::factory()->create();
    $authorization = SoftwareAuthorization::factory()->create();

    $response = $this->actingAs($user)->delete("/software-authorization/{$authorization->id}");

    $response->assertRedirect();
    $this->assertDatabaseMissing('software_authorizations', [
        'id' => $authorization->id,
    ]);
});

test('授权时间范围内可以正常访问', function () {
    $authorization = SoftwareAuthorization::factory()->create([
        'status' => 'approved',
        'start_time' => now()->subDay(),
        'end_time' => now()->addDay(),
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response = $this->postJson('/api/software/authorize', [
        'software_name' => '测试软件',
        'software_version' => '1.0.0',
        'os_version' => 'Windows 11',
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => true,
        'message' => '授权成功',
        'status' => 'approved',
    ]);
});

test('授权时间之前访问会失败', function () {
    $authorization = SoftwareAuthorization::factory()->create([
        'status' => 'approved',
        'start_time' => now()->addDay(),
        'end_time' => now()->addDays(2),
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response = $this->postJson('/api/software/authorize', [
        'software_name' => '测试软件',
        'software_version' => '1.0.0',
        'os_version' => 'Windows 11',
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => false,
        'message' => '不在授权时间范围内',
        'status' => 'expired',
    ]);

    // 验证访问日志被记录
    $this->assertDatabaseHas('software_authorization_access_logs', [
        'software_authorization_id' => $authorization->id,
        'access_type' => 'check',
    ]);
});

test('授权时间之后访问会失败', function () {
    $authorization = SoftwareAuthorization::factory()->create([
        'status' => 'approved',
        'start_time' => now()->subDays(2),
        'end_time' => now()->subDay(),
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response = $this->postJson('/api/software/authorize', [
        'software_name' => '测试软件',
        'software_version' => '1.0.0',
        'os_version' => 'Windows 11',
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => false,
        'message' => '不在授权时间范围内',
        'status' => 'expired',
    ]);

    // 验证访问日志被记录
    $this->assertDatabaseHas('software_authorization_access_logs', [
        'software_authorization_id' => $authorization->id,
        'access_type' => 'check',
    ]);
});

test('没有时间限制的授权永久有效', function () {
    $authorization = SoftwareAuthorization::factory()->create([
        'status' => 'approved',
        'start_time' => null,
        'end_time' => null,
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response = $this->postJson('/api/software/authorize', [
        'software_name' => '测试软件',
        'software_version' => '1.0.0',
        'os_version' => 'Windows 11',
        'bios_uuid' => 'test-uuid-12345',
        'motherboard_serial' => 'MB-123456',
        'cpu_id' => 'CPU-789012',
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => true,
        'message' => '授权成功',
        'status' => 'approved',
    ]);
});

