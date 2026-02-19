# Auth

基于 Laravel 12 和 React 19 的认证应用程序，使用 Inertia.js 构建全栈单页应用。

## 技术栈

### 后端
- **Laravel 12** - PHP Web 应用框架
- **Laravel Fortify** - 无头后端认证实现
- **Inertia.js** - 在不构建 SPA 的情况下创建现代单页应用
- **Laravel Wayfinder** - 路由和操作的类型安全
- **SQLite** - 默认数据库（可配置 MySQL/PostgreSQL）
- **Pest PHP** - 优雅的 PHP 测试框架

### 前端
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS 4** - 原子化 CSS 框架
- **Vite** - 前端构建工具
- **Radix UI** - 无障碍 UI 组件库
- **Headless UI** - 无样式 React 组件
- **Lucide React** - 图标库

## 系统要求

- PHP >= 8.2
- Composer 2
- Node.js >= 18
- npm 或 yarn

## 安装

### 1. 克隆项目
```bash
git clone <repository-url> auth
cd auth
```

### 2. 安装依赖
```bash
composer install
npm install
```

### 3. 环境配置
```bash
cp .env.example .env
php artisan key:generate
```

### 4. 数据库设置
```bash
# 创建 SQLite 数据库文件（如果使用 SQLite）
touch database/database.sqlite

# 运行数据库迁移
php artisan migrate
```

如需使用其他数据库，请编辑 `.env` 文件中的数据库配置：
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### 5. 构建前端资源
```bash
npm run build
```

## 开发

### 启动开发服务器

使用 Composer 脚本启动所有开发服务：
```bash
composer run dev
```

这将同时启动：
- Laravel 开发服务器 (http://localhost:8000)
- 队列监听器
- 日志监听器
- Vite 开发服务器

### 单独启动服务

仅启动 Laravel 服务器：
```bash
php artisan serve
```

仅启动 Vite 开发服务器：
```bash
npm run dev
```

### 代码格式化

PHP 代码格式化：
```bash
composer run lint
```

检查 PHP 代码格式：
```bash
composer run test:lint
```

前端代码格式化：
```bash
npm run format
```

检查前端代码格式：
```bash
npm run format:check
```

### 类型检查

检查 TypeScript 类型：
```bash
npm run types
```

### 代码检查

运行 ESLint：
```bash
npm run lint
```

## 测试

运行所有测试：
```bash
composer test
```

单独运行测试：
```bash
php artisan test
```

使用 Pest 运行测试：
```bash
./vendor/bin/pest
```

## 生产部署

### 1. 环境配置
设置 `APP_ENV=production` 并在 `.env` 中配置生产环境变量。

### 2. 优化应用
```bash
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 3. 构建前端资源
```bash
npm run build
```

### 4. 设置权限
确保以下目录可写：
- `storage/`
- `bootstrap/cache/`
- `public/build/`

### 5. 队列处理
```bash
php artisan queue:work
```

## 项目结构

```
auth/
├── app/                 # 应用核心代码
│   ├── Actions/         # 业务逻辑
│   ├── Http/           # 控制器、中间件、请求
│   ├── Models/         # Eloquent 模型
│   └── Providers/      # 服务提供者
├── bootstrap/          # 应用引导文件
├── config/             # 配置文件
├── database/           # 数据库迁移和种子
├── public/             # 公开访问目录
├── resources/          # 前端资源
│   ├── css/           # 样式文件
│   └── js/            # React 组件
├── routes/             # 路由定义
├── storage/            # 应用生成的文件
└── tests/              # 测试文件
```

## 认证功能

项目内置了完整的认证功能：

- 用户注册
- 用户登录
- 邮箱验证
- 密码重置
- 双因素认证（2FA）
- 个人资料管理

## 软件授权功能

### 功能概述

软件授权系统允许管理员审批和管理软件使用授权。客户端软件通过硬件标识（BIOS UUID、主板序列号、CPU ID）进行授权验证。

### 核心特性

- **硬件标识验证**：基于 BIOS UUID、主板序列号、CPU ID 三重验证
- **智能设备匹配**：已授权设备更换硬件时，任意一个标识匹配即自动更新设备信息
- **授权时间管理**：支持设置授权的开始和结束时间
- **访问日志追踪**：
  - 记录所有授权访问，所有类型日志永久保存
  - 设备信息更新记录永久保存
  - 授权时间范围变更记录永久保存
  - 超出授权时间范围的访问记录永久标识
  - 支持访问日志分页和筛选
- **多标签页管理**：待审核和已批准分离，支持数量提示和标签记忆
- **审批流程**：支持批准、拒绝、编辑授权范围、查看历史记录

### 数据库设计

**软件授权表** (`software_authorizations`)
- `id` - 主键
- `software_name` - 软件名称
- `software_version` - 软件版本号
- `os_version` - 操作系统版本
- `bios_uuid` - 主板 BIOS UUID
- `motherboard_serial` - 主板序列号
- `cpu_id` - CPU 处理器 ID
- `request_ip` - 请求发起的 IP 地址
- `last_access_ip` - 最后一次访问 IP 地址
- `status` - 授权状态（pending/approved/rejected）
- `authorized_at` - 授权时间
- `notes` - 备注信息
- `start_time` - 授权开始时间
- `end_time` - 授权结束时间
- `created_at` - 创建时间
- `updated_at` - 更新时间

**访问日志表** (`software_authorization_access_logs`)
- `id` - 主键
- `software_authorization_id` - 关联授权记录
- `access_type` - 访问类型（check: 访问检查, update: 设备更新, time_change: 时间范围变更）
- `changes` - 变更详情（JSON格式，update类型记录设备变更，time_change类型记录时间变更）
- `ip_address` - 访问 IP 地址
- `is_expired` - 是否超出授权时间范围（布尔值，永久标识）
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 授权逻辑

#### 验证规则

系统根据以下三个唯一标识验证授权：
1. **BIOS UUID** - 主板 BIOS 的唯一标识
2. **主板序列号** - 主板的序列号
3. **CPU ID** - CPU 处理器的唯一标识

#### 验证流程

1. **首次申请**
   - 客户端发送授权请求
   - 创建 `pending` 状态的记录
   - 返回 202 Accepted，等待审核

2. **完全匹配授权**
   - 找到三个标识完全匹配的已批准记录
   - 更新最后访问 IP
   - 记录访问日志
   - 返回 200 OK，授权成功

3. **部分匹配更新**
   - 找到已批准记录，任意一个标识匹配
   - 更新设备信息和最后访问 IP
   - 记录变更前后的设备信息
   - 返回 200 OK，授权成功（设备信息已更新）

4. **授权已拒绝**
   - 找到已拒绝的记录
   - 返回 200 OK，授权失败

5. **审核中**
   - 找到待审核的记录
   - 返回 200 OK，提示等待

6. **授权时间范围验证**
   - 如果不在授权时间范围内，返回"不在授权时间范围"
   - 超出授权时间范围的访问记录会被永久标识
   - 即使后来更改了授权范围，超时记录仍保留原标识

7. **授权时间变更记录**
   - 批准或编辑授权时，如果时间范围发生变化，会记录变更日志
   - 时间变更记录永久保存

8. **访问日志管理**
   - 所有类型的访问日志永久保存，不限制数量
   - 支持按访问类型筛选（全部、正常访问、超出授权时间范围、设备信息更新、时间范围变更）
   - 支持按时间范围筛选（开始日期、结束日期）
   - 支持分页查看

### API 接口

#### 1. 请求授权

**接口地址**：`POST /api/software/authorize`

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| software_name | string | 是 | 软件名称 |
| software_version | string | 是 | 软件版本号 |
| os_version | string | 是 | 操作系统版本 |
| bios_uuid | string | 是 | 主板 BIOS UUID |
| motherboard_serial | string | 是 | 主板序列号 |
| cpu_id | string | 是 | CPU 处理器 ID |

**响应示例**：

```json
{
  "success": true,
  "message": "授权成功",
  "status": "approved"
}
```

#### 2. 管理接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /software-authorization | GET | 授权管理页面（需要认证） |
| /software-authorization/{id}/approve | POST | 批准授权 |
| /software-authorization/{id}/reject | POST | 拒绝授权 |
| /software-authorization/{id}/update | PUT | 更新授权时间范围 |
| /software-authorization/{id}/access-logs | GET | 获取访问记录（支持分页和筛选） |
| /software-authorization/{id} | DELETE | 删除授权 |

**获取访问记录接口参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码（默认1） |
| per_page | integer | 否 | 每页数量（默认10） |
| access_type | string | 否 | 访问类型（all/normal/expired/update/time_change） |
| start_date | string | 否 | 开始日期（Y-m-d格式） |
| end_date | string | 否 | 结束日期（Y-m-d格式） |

**访问记录响应示例**：

```json
{
  "logs": [
    {
      "id": 1,
      "access_type": "check",
      "changes": null,
      "ip_address": "192.168.1.100",
      "is_expired": false,
      "created_at": "2026-01-27 12:00:00"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 10,
    "total": 45
  },
  "authorization": {
    "notes": "备注信息",
    "start_time": "2026-01-01 00:00:00",
    "end_time": "2026-12-31 23:59:59"
  }
}
```

### 获取硬件信息

#### Windows 系统

```cmd
wmic csproduct get UUID
wmic baseboard get SerialNumber
wmic cpu get ProcessorId
```

#### Linux 系统

```bash
sudo dmidecode -s system-uuid
sudo dmidecode -s baseboard-serial-number
sudo dmidecode -t processor | grep "ID:"
```

#### macOS 系统

```bash
system_profiler SPHardwareDataType
```

### 客户端集成示例

#### Python 示例

```python
import requests

def check_authorization(software_name, software_version, os_version):
    url = "http://your-domain.com/api/software/authorize"
    
    payload = {
        "software_name": software_name,
        "software_version": software_version,
        "os_version": os_version,
        "bios_uuid": get_bios_uuid(),
        "motherboard_serial": get_motherboard_serial(),
        "cpu_id": get_cpu_id()
    }
    
    response = requests.post(url, json=payload, timeout=10)
    data = response.json()
    
    if data['status'] == 'approved':
        return True
    return False
```

#### C# 示例

```csharp
public static async Task<bool> CheckAuthorization(
    string softwareName, string softwareVersion, string osVersion)
{
    var payload = new
    {
        software_name = softwareName,
        software_version = softwareVersion,
        os_version = osVersion,
        bios_uuid = GetBiosUuid(),
        motherboard_serial = GetMotherboardSerial(),
        cpu_id = GetCpuId()
    };

    var response = await client.PostAsync(url, content);
    return result.Status == "approved";
}
```

#### Node.js 示例

```javascript
async function checkAuthorization(softwareName, softwareVersion, osVersion) {
    const payload = {
        software_name: softwareName,
        software_version: softwareVersion,
        os_version: osVersion,
        bios_uuid: await getBiosUuid(),
        motherboard_serial: await getMotherboardSerial(),
        cpu_id: await getCpuId()
    };

    const response = await axios.post(url, payload);
    return response.data.status === 'approved';
}
```

### 使用方法

#### 1. 访问授权管理页面

登录系统后，点击侧边栏的"软件授权"菜单或直接访问：`http://localhost:8000/software-authorization`

#### 2. 测试授权接口

使用测试工具：`http://localhost:8000/test-auth-api.html`

#### 3. 管理授权

在授权管理页面可以：
- 查看所有授权申请（分待审核和已批准两个标签页）
- 批准待审核的申请（可设置授权时间范围）
- 拒绝授权申请（可添加备注）
- 编辑已批准授权的时间范围
- 查看授权访问及变更记录
- 删除授权记录
- 待审核数量实时显示在标签上

### 常见问题

**Q: 为什么授权总是显示"待审核"？**
A: 首次申请授权需要管理员在后台进行审批，请等待管理员处理。

**Q: 更换了硬件后还能使用授权吗？**
A: 如果更换的硬件（BIOS UUID、主板序列号、CPU ID）中任意一个与已授权记录匹配，系统会自动更新设备信息并继续授权。

**Q: 如何查看授权申请状态？**
A: 可以在授权管理后台查看所有授权申请及其状态。

**Q: 访问记录保存多长时间？**
A: 所有类型的访问日志永久保存，包括正常访问、设备信息更新、时间范围变更等记录。

**Q: 授权时间范围有什么用？**
A: 可以设置授权的有效期，开始时间和结束时间都为空表示永久授权。

**Q: 超出授权时间范围的记录会改变吗？**
A: 不会。超出授权时间范围的访问记录会被永久标识，即使后来更改了授权范围，该记录仍显示"超出授权时间范围"。

**Q: 如何筛选访问记录？**
A: 可以在访问记录对话框中使用筛选功能，支持按访问类型（全部、正常访问、超出授权时间范围、设备信息更新、时间范围变更）和日期范围进行筛选。

**Q: 访问记录支持分页吗？**
A: 支持，访问记录默认每页显示10条，支持翻页查看所有记录。

### 测试验证

所有测试均已通过：
```
Tests: 9 passed (18 assertions)
Duration: 0.49s
```

### 后续优化建议

1. **API 认证**：添加 API Key 或 Token 认证
2. **邮件通知**：授权状态变更时发送邮件通知
3. **批量操作**：支持批量批准/拒绝授权
4. **数据导出**：导出授权记录为 CSV/Excel
5. **统计报表**：授权申请统计、成功率等
6. **黑名单**：添加黑名单功能
7. **权限细化**：不同管理员角色有不同权限
8. **离线授权**：支持离线授权码

### 文件清单

#### 后端文件
- `app/Models/SoftwareAuthorization.php` - 授权模型
- `app/Models/SoftwareAuthorizationAccessLog.php` - 访问日志模型
- `app/Http/Controllers/SoftwareAuthorizationController.php` - 授权控制器
- `database/migrations/2026_01_27_105513_create_software_authorizations_table.php` - 数据库迁移
- `database/migrations/2026_01_27_145224_add_last_access_ip_to_software_authorizations_table.php` - 添加最后访问IP字段
- `database/migrations/2026_01_27_145226_create_software_authorization_access_logs_table.php` - 创建访问日志表
- `database/migrations/2026_01_27_235235_add_is_expired_to_software_authorization_access_logs_table.php` - 添加是否过期字段
- `database/factories/SoftwareAuthorizationFactory.php` - 数据工厂
- `tests/Feature/SoftwareAuthorizationTest.php` - 功能测试
- `routes/web.php` - 路由定义

#### 前端文件
- `resources/js/pages/software-authorization/index.tsx` - 授权管理页面
- `resources/js/components/software-authorization.tsx` - 授权列表和管理组件
- `resources/js/components/ui/table.tsx` - 表格组件
- `resources/js/components/ui/tabs.tsx` - 标签页组件
- `resources/js/components/ui/dialog.tsx` - 对话框组件
- `resources/js/components/ui/badge.tsx` - 徽章组件
- `resources/js/hooks/use-flash.ts` - Flash 消息钩子
- `resources/js/types/software-authorization.ts` - 类型定义

#### 文档和工具
- `SOFTWARE_AUTHORIZATION_API.md` - 详细 API 文档和客户端集成示例
- `SOFTWARE_AUTHORIZATION_SUMMARY.md` - 功能实现总结
- `public/test-auth-api.html` - API 测试工具



## 可用的 Composer 脚本

| 命令 | 描述 |
|------|------|
| `composer run setup` | 完整的项目初始化 |
| `composer run dev` | 启动所有开发服务 |
| `composer run dev:ssr` | 启动开发服务（包含 SSR） |
| `composer run lint` | 格式化 PHP 代码 |
| `composer run test:lint` | 检查 PHP 代码格式 |
| `composer run test` | 运行测试并检查代码 |

## 可用的 npm 脚本

| 命令 | 描述 |
|------|------|
| `npm run build` | 构建生产资源 |
| `npm run build:ssr` | 构建生产资源（包含 SSR） |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run format` | 格式化前端代码 |
| `npm run format:check` | 检查前端代码格式 |
| `npm run lint` | 运行 ESLint 并修复 |
| `npm run types` | TypeScript 类型检查 |

## 故障排除

### Composer 超时错误
如果遇到网络超时，可以配置 Composer 使用国内镜像：
```bash
composer config -g repo.packagist composer https://mirrors.aliyun.com/composer/
```

### npm 安装失败
使用国内镜像：
```bash
npm config set registry https://registry.npmmirror.com
```

### 权限问题
确保 storage 目录可写：
```bash
chmod -R 775 storage bootstrap/cache
```

## 安全建议

- 生产环境中设置 `APP_DEBUG=false`
- 定期更新依赖包：`composer update` 和 `npm update`
- 使用 HTTPS
- 配置防火墙和 CORS
- 定期备份数据库

## 相关资源

- [Laravel 文档](https://laravel.com/docs)
- [Inertia.js 文档](https://inertiajs.com)
- [React 文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com)
- [Pest PHP 文档](https://pestphp.com)

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
