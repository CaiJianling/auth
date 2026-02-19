# 软件授权 API 文档

## 概述

本 API 用于软件授权验证。客户端软件发送授权请求后，服务器会根据授权记录返回相应的授权状态。

## API 接口

### 1. 请求授权

**接口地址：** `POST /api/software/authorize`

**请求头：**
```
Content-Type: application/json
```

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| software_name | string | 是 | 软件名称 |
| software_version | string | 是 | 软件版本号 |
| os_version | string | 是 | 操作系统版本 |
| bios_uuid | string | 是 | 主板 BIOS UUID |
| motherboard_serial | string | 是 | 主板序列号 |
| cpu_id | string | 是 | CPU 处理器 ID |

**请求示例：**
```json
{
  "software_name": "我的软件",
  "software_version": "1.0.0",
  "os_version": "Windows 11",
  "bios_uuid": "550E8400-E29B-41D4-A716-446655440000",
  "motherboard_serial": "MB123456789",
  "cpu_id": "CPU987654321"
}
```

**响应状态码：**
- `200 OK`: 授权成功或已存在授权记录
- `202 Accepted`: 新授权申请已创建，等待审核

**响应示例（授权成功）：**
```json
{
  "success": true,
  "message": "授权成功",
  "status": "approved"
}
```

**响应示例（授权申请已提交）：**
```json
{
  "success": false,
  "message": "授权申请已提交，请等待审核",
  "status": "pending"
}
```

**响应示例（授权已被拒绝）：**
```json
{
  "success": false,
  "message": "授权已被拒绝",
  "status": "rejected"
}
```

**响应示例（授权申请正在审核中）：**
```json
{
  "success": false,
  "message": "授权申请正在审核中",
  "status": "pending"
}
```

## 授权逻辑说明

### 授权验证规则

系统会根据以下三个唯一标识来验证授权：
1. **BIOS UUID** - 主板 BIOS 的唯一标识
2. **主板序列号** - 主板的序列号
3. **CPU ID** - CPU 处理器的唯一标识

**验证流程：**

1. **首次授权申请**
   - 客户端发送授权请求
   - 系统创建一条状态为 `pending` 的授权记录
   - 返回 `202 Accepted` 状态码，提示用户等待审核

2. **授权已批准**
   - 如果找到已批准的授权记录（三个标识完全匹配）
   - 返回 `200 OK`，授权成功

3. **授权已拒绝**
   - 如果找到已拒绝的授权记录
   - 返回 `200 OK`，但 `success` 为 `false`

4. **授权审核中**
   - 如果找到待审核的授权记录
   - 返回 `200 OK`，提示等待审核

### 状态说明

| 状态 | 说明 |
|------|------|
| `pending` | 待审核 - 授权申请已提交，等待管理员审核 |
| `approved` | 已批准 - 授权已通过，可以正常使用软件 |
| `rejected` | 已拒绝 - 授权被拒绝，无法使用软件 |

## 获取硬件信息

### Windows 系统

**获取 BIOS UUID：**
```cmd
wmic csproduct get UUID
```

**获取主板序列号：**
```cmd
wmic baseboard get SerialNumber
```

**获取 CPU ID：**
```cmd
wmic cpu get ProcessorId
```

### Linux 系统

**获取 BIOS UUID：**
```bash
sudo dmidecode -s system-uuid
```

**获取主板序列号：**
```bash
sudo dmidecode -s baseboard-serial-number
```

**获取 CPU ID：**
```bash
sudo dmidecode -t processor | grep "ID:"
```

### macOS 系统

**获取硬件信息：**
```bash
system_profiler SPHardwareDataType
```

## 客户端集成示例

### Python 示例

```python
import requests
import subprocess

def get_bios_uuid():
    try:
        result = subprocess.run(['wmic', 'csproduct', 'get', 'UUID'],
                              capture_output=True, text=True)
        uuid = result.stdout.split('\n')[1].strip()
        return uuid
    except:
        return "unknown"

def get_motherboard_serial():
    try:
        result = subprocess.run(['wmic', 'baseboard', 'get', 'SerialNumber'],
                              capture_output=True, text=True)
        serial = result.stdout.split('\n')[1].strip()
        return serial
    except:
        return "unknown"

def get_cpu_id():
    try:
        result = subprocess.run(['wmic', 'cpu', 'get', 'ProcessorId'],
                              capture_output=True, text=True)
        cpu_id = result.stdout.split('\n')[1].strip()
        return cpu_id
    except:
        return "unknown"

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
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        data = response.json()
        
        if data['status'] == 'approved':
            print("授权成功！")
            return True
        elif data['status'] == 'pending':
            print("授权申请正在审核中，请稍后再试。")
            return False
        else:
            print("授权失败：", data['message'])
            return False
    except requests.exceptions.RequestException as e:
        print("网络错误：", str(e))
        return False

# 使用示例
if __name__ == "__main__":
    authorized = check_authorization(
        software_name="我的软件",
        software_version="1.0.0",
        os_version="Windows 11"
    )
    
    if not authorized:
        print("程序退出")
        exit(1)
    
    print("程序继续运行...")
```

### C# 示例

```csharp
using System;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

public class AuthorizationResponse
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public string Status { get; set; }
}

public class SoftwareAuthorization
{
    private static readonly HttpClient client = new HttpClient();

    public static string GetBiosUuid()
    {
        try
        {
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "wmic",
                    Arguments = "csproduct get UUID",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                }
            };
            process.Start();
            string output = process.StandardOutput.ReadToEnd();
            process.WaitForExit();
            return output.Split('\n')[1].Trim();
        }
        catch
        {
            return "unknown";
        }
    }

    public static async Task<bool> CheckAuthorization(
        string softwareName,
        string softwareVersion,
        string osVersion)
    {
        string url = "http://your-domain.com/api/software/authorize";

        var payload = new
        {
            software_name = softwareName,
            software_version = softwareVersion,
            os_version = osVersion,
            bios_uuid = GetBiosUuid(),
            motherboard_serial = GetMotherboardSerial(),
            cpu_id = GetCpuId()
        };

        try
        {
            var json = JsonConvert.SerializeObject(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync(url, content);
            var responseString = await response.Content.ReadAsStringAsync();
            var result = JsonConvert.DeserializeObject<AuthorizationResponse>(responseString);

            if (result.Status == "approved")
            {
                Console.WriteLine("授权成功！");
                return true;
            }
            else
            {
                Console.WriteLine($"授权失败：{result.Message}");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"网络错误：{ex.Message}");
            return false;
        }
    }

    // 类似的 GetMotherboardSerial() 和 GetCpuId() 方法...
}

// 使用示例
public static async Task Main()
{
    bool authorized = await SoftwareAuthorization.CheckAuthorization(
        "我的软件", "1.0.0", "Windows 11");

    if (!authorized)
    {
        Console.WriteLine("程序退出");
        Environment.Exit(1);
    }

    Console.WriteLine("程序继续运行...");
}
```

### Node.js 示例

```javascript
const { exec } = require('child_process');
const axios = require('axios');

function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                resolve('unknown');
            } else {
                resolve(stdout.trim().split('\n')[1] || 'unknown');
            }
        });
    });
}

async function getBiosUuid() {
    return await executeCommand('wmic csproduct get UUID');
}

async function getMotherboardSerial() {
    return await executeCommand('wmic baseboard get SerialNumber');
}

async function getCpuId() {
    return await executeCommand('wmic cpu get ProcessorId');
}

async function checkAuthorization(softwareName, softwareVersion, osVersion) {
    const url = 'http://your-domain.com/api/software/authorize';

    const payload = {
        software_name: softwareName,
        software_version: softwareVersion,
        os_version: osVersion,
        bios_uuid: await getBiosUuid(),
        motherboard_serial: await getMotherboardSerial(),
        cpu_id: await getCpuId()
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });

        const { success, message, status } = response.data;

        if (status === 'approved') {
            console.log('授权成功！');
            return true;
        } else {
            console.log(`授权失败：${message}`);
            return false;
        }
    } catch (error) {
        console.log(`网络错误：${error.message}`);
        return false;
    }
}

// 使用示例
(async () => {
    const authorized = await checkAuthorization('我的软件', '1.0.0', 'Windows 11');

    if (!authorized) {
        console.log('程序退出');
        process.exit(1);
    }

    console.log('程序继续运行...');
})();
```

## 注意事项

1. **安全性**
   - 建议在生产环境中使用 HTTPS
   - 可以考虑添加 API Key 或 Token 进行身份验证
   - 敏感信息（如 BIOS UUID、序列号）应该在本地获取，不要硬编码

2. **网络超时**
   - 客户端应设置合理的超时时间（建议 10-30 秒）
   - 网络错误时应提供友好的错误提示
   - 可以考虑离线缓存机制，允许在无法联网时使用已授权的版本

3. **用户体验**
   - 首次授权时，应明确告知用户需要等待审核
   - 授权失败时应提供详细的错误信息
   - 可以提供申请进度查询功能

4. **数据保护**
   - 用户的硬件信息应妥善保管
   - 遵守相关的隐私保护法规
   - 定期清理无用的授权记录

## 常见问题

### Q: 为什么授权总是显示"待审核"？
A: 首次申请授权需要管理员在后台进行审批，请等待管理员处理。

### Q: 更换了硬件后还能使用授权吗？
A: 授权是基于硬件标识的，如果更换了主板、CPU 等关键硬件，需要重新申请授权。

### Q: 如何查看授权申请状态？
A: 可以在授权管理后台查看所有授权申请及其状态。

### Q: 授权失败后如何重新申请？
A: 如果授权被拒绝，需要联系管理员了解原因，管理员可以先删除原记录，然后您可以重新申请。
