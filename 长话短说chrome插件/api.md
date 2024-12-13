# 长话短说 API 文档

## 目录

- [基础信息](#基础信息)
- [认证流程](#认证流程)
- [API 接口详情](#api-接口详情)
  - [发送验证码](#发送验证码)
  - [用户登录](#用户登录)
  - [验证 Token](#验证-token)
  - [更新付费状态](#更新付费状态)
- [错误处理](#错误处理)
- [使用示例](#使用示例)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 基础信息

### 服务器信息
- **基础URL**: `http://localhost:3000`
- **协议**: HTTP/HTTPS
- **API版本**: v1
- **编码格式**: UTF-8

### 请求格式
- 请求体格式: JSON
- Content-Type: application/json
- 字符编码: UTF-8

### 认证方式
所有需要认证的接口都需要在请求头中携带 JWT token：
```http
Authorization: Bearer <your_token>
```

### 通用响应格式
所有 API 响应都遵循以下格式：
```json
{
  "success": true|false,        // 请求是否成功
  "message": "响应信息",        // 人类可读的响应消息
  "data": {},                   // 具体的响应数据（可选）
  "debugInfo": {}              // 调试信息（仅在开发环境）
}
```

## 认证流程

完整的用户认证流程如下：

1. 前端调用 `/auth/send-code` 发送验证码到用户手机
2. 用户收到验证码后，前端调用 `/auth/login` 进行登录
3. 登录成功后获取 JWT token
4. 后续请求在 Header 中携带 token
5. 可以随时调用 `/auth/verify-token` 验证 token 有效性

## API 接口详情

### 发送验证码

发送手机验证码用于登录验证。系统会生成一个 6 位数的验证码发送到指定手机号。

- **接口**: `/auth/send-code`
- **方法**: `POST`
- **认证**: 不需要

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|-------|------|-----|------|------|
| phone | string | 是 | 中国大陆手机号 | "13800138000" |

#### 请求示例
```http
POST /auth/send-code HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "phone": "13800138000"
}
```

#### 成功响应 (200)
```json
{
  "success": true,
  "message": "验证码发送成功",
  "data": {
    "phone": "13800138000",
    "expireTime": "300"  // 验证码有效期（秒）
  },
  "debugInfo": {
    "timestamp": "2024-12-12T05:48:02+08:00",
    "phoneNumber": "13800138000",
    "provider": "阿里云",
    "templateId": "SMS_123456789"
  }
}
```

#### 错误响应

##### 参数错误 (400)
```json
{
  "success": false,
  "message": "手机号格式不正确",
  "debugInfo": {
    "timestamp": "2024-12-12T05:48:02+08:00",
    "phoneNumber": "1380013800",
    "error": "手机号必须是11位数字",
    "errorName": "ValidationError"
  }
}
```

##### 服务器错误 (500)
```json
{
  "success": false,
  "message": "验证码发送失败",
  "debugInfo": {
    "timestamp": "2024-12-12T05:48:02+08:00",
    "phoneNumber": "13800138000",
    "error": "SMS service unavailable",
    "errorName": "ServiceError"
  }
}
```

#### 限制说明
- 同一手机号 60 秒内只能发送一次验证码
- 同一手机号每天最多发送 10 次验证码
- 验证码有效期为 5 分钟
- IP 限制：同一 IP 每小时最多发送 20 次验证码

### 用户登录

使用手机号和验证码进行登录，成功后返回 JWT token。

- **接口**: `/auth/login`
- **方法**: `POST`
- **认证**: 不需要

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|-------|------|-----|------|------|
| phone_num | string | 是 | 手机号 | "13800138000" |
| code | string | 是 | 验证码 | "123456" |

#### 请求示例
```http
POST /auth/login HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "phone_num": "13800138000",
  "code": "123456"
}
```

#### 成功响应 (200)
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "userid": 1,
      "phone_num": "13800138000",
      "is_paid": false,
      "valid_date": null,
      "created_at": "2024-12-12T05:48:02+08:00",
      "last_login": "2024-12-12T05:48:02+08:00"
    }
  }
}
```

#### 错误响应

##### 验证码错误 (400)
```json
{
  "success": false,
  "message": "验证码错误或已过期",
  "debugInfo": {
    "timestamp": "2024-12-12T05:48:02+08:00",
    "phoneNumber": "13800138000",
    "error": "Invalid verification code",
    "errorName": "ValidationError"
  }
}
```

##### 服务器错误 (500)
```json
{
  "success": false,
  "message": "登录失败",
  "debugInfo": {
    "timestamp": "2024-12-12T05:48:02+08:00",
    "error": "Database connection error",
    "errorName": "DatabaseError"
  }
}
```

#### Token 说明
- Token 采用 JWT 格式
- 有效期为 7 天
- Token 包含以下信息：
  - userid: 用户ID
  - iat: 签发时间
  - exp: 过期时间

### 验证 Token

验证用户 token 的有效性，同时返回最新的用户信息。

- **接口**: `/auth/verify-token`
- **方法**: `POST`
- **认证**: 需要

#### 请求头
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### 成功响应 (200)
```json
{
  "success": true,
  "message": "token有效",
  "data": {
    "user": {
      "userid": 1,
      "phone_num": "13800138000",
      "is_paid": false,
      "valid_date": null,
      "created_at": "2024-12-12T05:48:02+08:00",
      "last_login": "2024-12-12T05:48:02+08:00"
    },
    "token_info": {
      "issued_at": "2024-12-12T05:48:02+08:00",
      "expires_at": "2024-12-19T05:48:02+08:00"
    }
  }
}
```

#### 错误响应

##### Token 无效 (401)
```json
{
  "success": false,
  "message": "token无效",
  "error": "Invalid token format"
}
```

##### Token 过期 (401)
```json
{
  "success": false,
  "message": "token已过期",
  "error": "Token expired"
}
```

### 更新付费状态

更新用户的付费状态和会员有效期。

- **接口**: `/auth/update-paid-status`
- **方法**: `POST`
- **认证**: 需要

#### 请求参数
| 参数名 | 类型 | 必填 | 说明 | 示例 |
|-------|------|-----|------|------|
| is_paid | boolean | 是 | 付费状态 | true |
| valid_date | string | 是 | 有效期 | "2024-12-31T23:59:59Z" |

#### 请求示例
```http
POST /auth/update-paid-status HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "is_paid": true,
  "valid_date": "2024-12-31T23:59:59Z"
}
```

#### 成功响应 (200)
```json
{
  "success": true,
  "message": "付费状态更新成功",
  "data": {
    "user": {
      "userid": 1,
      "phone_num": "13800138000",
      "is_paid": true,
      "valid_date": "2024-12-31T23:59:59Z",
      "updated_at": "2024-12-12T05:48:02+08:00"
    }
  }
}
```

#### 错误响应

##### 认证失败 (401)
```json
{
  "success": false,
  "message": "未授权访问",
  "error": "Unauthorized"
}
```

##### 参数错误 (400)
```json
{
  "success": false,
  "message": "参数错误",
  "debugInfo": {
    "timestamp": "2024-12-12T05:48:02+08:00",
    "error": "Invalid date format",
    "errorName": "ValidationError"
  }
}
```

## 错误处理

### HTTP 状态码
| 状态码 | 说明 |
|-------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 错误响应格式
```json
{
  "success": false,
  "message": "错误描述",
  "error": "错误类型",
  "debugInfo": {
    "timestamp": "错误发生时间",
    "errorName": "错误名称",
    "errorStack": "错误堆栈（仅开发环境）"
  }
}
```

## 使用示例

### 完整的登录流程

```javascript
// 1. 发送验证码
async function sendVerificationCode(phone) {
  const response = await fetch('http://localhost:3000/auth/send-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone })
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message);
  }
  return result;
}

// 2. 登录
async function login(phone_num, code) {
  const response = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone_num, code })
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message);
  }
  
  // 保存 token
  localStorage.setItem('token', result.data.token);
  return result;
}

// 3. 验证 token
async function verifyToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }
  
  const response = await fetch('http://localhost:3000/auth/verify-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  if (!result.success) {
    localStorage.removeItem('token');
    throw new Error(result.message);
  }
  return result;
}

// 4. 更新付费状态
async function updatePaidStatus(isPaid, validDate) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token found');
  }
  
  const response = await fetch('http://localhost:3000/auth/update-paid-status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      is_paid: isPaid,
      valid_date: validDate
    })
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message);
  }
  return result;
}

// 使用示例
async function example() {
  try {
    // 发送验证码
    await sendVerificationCode('13800138000');
    console.log('验证码已发送');
    
    // 用户输入验证码后登录
    const loginResult = await login('13800138000', '123456');
    console.log('登录成功:', loginResult);
    
    // 验证 token
    const verifyResult = await verifyToken();
    console.log('token 有效:', verifyResult);
    
    // 更新付费状态
    const updateResult = await updatePaidStatus(true, '2024-12-31T23:59:59Z');
    console.log('付费状态更新成功:', updateResult);
  } catch (error) {
    console.error('操作失败:', error.message);
  }
}
```

## 最佳实践

### 安全性建议
1. 始终使用 HTTPS 进行通信
2. 不要在客户端存储敏感信息
3. 定期刷新 token
4. 实现 token 黑名单机制
5. 使用合适的 token 过期时间

### 错误处理建议
1. 实现全局错误处理
2. 合理使用 HTTP 状态码
3. 提供有意义的错误消息
4. 在生产环境中隐藏敏感的错误信息

### 性能优化建议
1. 实现请求缓存
2. 使用合适的请求超时时间
3. 实现请求重试机制
4. 避免频繁的 token 验证

## 常见问题

### Q: token 过期了怎么办？
A: 当收到 401 状态码且错误信息为 "token已过期" 时，需要重新登录获取新的 token。

### Q: 如何处理验证码发送失败？
A: 可以根据返回的错误信息判断具体原因：
- 如果是频率限制，提示用户稍后重试
- 如果是服务器错误，可以实现重试机制

### Q: 如何确保 token 安全？
A: 
1. 使用 HTTPS
2. 设置合理的过期时间
3. 在客户端安全存储
4. 实现 token 撤销机制

### Q: 用户付费状态更新失败怎么办？
A: 
1. 检查 token 是否有效
2. 验证请求参数格式
3. 确保有效期格式正确
4. 实现失败重试机制
