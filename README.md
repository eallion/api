# API Tencent EdgeOne Pages

- `api.eallion.com`

## 功能说明

本项目基于 Tencent EdgeOne Pages Functions 实现，提供了一系列 API 接口，用于代理访问第三方服务。
每个功能都按照 [EdgeOne 官方文档](https://edgeone.cloud.tencent.com/pages/document/162936866445025280) 的要求实现，
采用单独的函数文件结构，所有代码均为 JavaScript。

## API 接口列表

### /bing

代理访问必应每日壁纸数据。

### /favicon

代理访问 `https://t3.gstatic.cn/faviconV2` 获取网站图标。

### /geo

返回客户端的地理位置。

### /gravatar

代理访问 `https://www.libravatar.org/avatar` 获取 Gravatar 头像。

### /gts

短链接服务，支持以下功能：

1. **基本功能**：
   - 通过 `/gts/{key}` 访问短链接，自动重定向到目标 URL
   - 示例: `GET /gts/123` → 重定向到预设的 URL

2. **管理接口**：
   - 设置键值对（通过 URL 参数）：
     ```
     POST /gts/admin?key=test&value=valuetest&token=your_api_token
     ```
   - 设置键值对（通过请求体，推荐）：
     ```
     curl -X POST \
       https://your-domain.com/gts/admin \
       -H "Authorization: Bearer your_api_token" \
       -H "Content-Type: application/json" \
       -d '{"key": "test-key", "value": "test-value"}'
     ```
   - 删除键值对：
     ```
     curl -X DELETE \
       "https://your-domain.com/gts/admin?key=test-key" \
       -H "Authorization: Bearer your_api_token"
     ```

3. **环境变量配置**：
   - `API_TOKEN`: 用于认证的管理员令牌
   - `API_KV`: KV 存储绑定名称 (默认为 goto_gts)

### /ip

返回客户端的公网 IP 地址。

### /mastodon

代理访问 `https://e5n.cc/api/v1/accounts/111136231674527355/statuses` 获取 Mastodon 状态。

### /memos

代理访问 `https://memos.eallion.com/api/v1/memos` 获取 Memos 数据。

### /og

代理访问 `https://og.eallion.com/api/og` 获取 OG 图片。

## 部署要求

1. 在腾讯云 EdgeOne Pages 中配置以下环境变量：
   - `API_TOKEN`: 设置您的管理令牌
   - 绑定 KV 存储并命名为 `goto_gts` (或修改代码使用其他名称)

2. 确保 edgeone.json 配置正确，包含以下路由：
   ```json
   "routes": [
     {
       "pattern": "/gts/*",
       "script": "functions/gts/[[path]].js",
       "methods": ["GET", "POST", "PUT", "DELETE", "HEAD"]
     }
   ]
   ```

3. 部署后测试：
   - 测试短链接功能: `GET /gts/test`
   - 测试管理接口: 
     ```bash
     curl -X POST "http://your-domain/gts/admin?key=test&value=example&token=your_token"
     curl -X DELETE "http://your-domain/gts/admin?key=test&token=your_token"
     ```
