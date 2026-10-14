# API Tencent EdgeOne Pages

- `api.eallion.com`

## 功能说明

本项目基于 Tencent EdgeOne Pages Functions 实现，提供了一系列 API 接口，用于代理访问第三方服务。
每个功能都按照 [EdgeOne 官方文档](https://edgeone.cloud.tencent.com/pages/document/162936866445025280) 的要求实现，
采用单独的函数文件结构，所有代码均为 JavaScript。

## API 接口列表

### /bing

代理访问必应每日壁纸数据。

- **返回完整壁纸元数据（JSON）**：`GET /bing` 或 `GET /bing?type=json`（包含 `title`、`copyright`、`copyrightlink`、`quiz`、`startdate`、`enddate`、`url`、`redirect`、`cover` 等完整字段）
- **直接返回壁纸图片**：`GET /bing?type=image`
- **支持参数**：
  - `type`: `json`（默认）或 `image`
  - `region`: 区域代码，如 `zh-CN`, `en-US`, `ja-JP` 等，默认为 `en-US`
  - `date`: 指定历史日期，格式 `YYYY-MM-DD`（支持最近约 8 天壁纸）
  - `dpi`: 指定分辨率或直链规格，支持 `uhd`, `1080p`, `720p`, `mobile` 等，默认为 `1920x1080`

### /favicon

代理访问 `https://t3.gstatic.cn/faviconV2` 获取网站图标。

### /geo

基于 EdgeOne Makers 原生能力（`request.eo.geo` 与 `request.eo.clientIp`）返回客户端地理位置及网络信息，支持 IPv4 与 IPv6。支持 `/geo` 与 `/api/geo`。

- **默认返回完整数据（JSON）**：`GET /geo`
- **获取单个字段**：`GET /geo?key={fieldName}`（如 `key=ip`, `key=version`, `key=countryName`, `key=cityName`, `key=asn` 等，默认返回纯文本；添加 `&type=json` 返回 JSON）
- **纯文本输出全部**：`GET /geo?type=text`
- **协议版本校验**：`GET /geo?v=4` 或 `GET /geo?v=6`（若当前连接协议与指定版本不一致，返回 400 错误）
- **支持参数**：
  - `key`: 指定返回字段（`ip`, `version`, `type`, `asn`, `countryName`, `countryCodeAlpha2`, `cityName`, `latitude`, `longitude` 等）
  - `type` / `format`: `json`（默认）或 `text`
  - `v` / `version`: `4` 或 `6`（协议版本匹配校验）

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

基于 EdgeOne Makers 原生能力（`request.eo.clientIp`）返回客户端默认公网 IP 及双栈分流信息，支持 IPv4 与 IPv6。已合并原 `ip.eallion.com` 项目，同时支持 `/ip` 与 `/api/ip`。

内置双栈检测探针架构：
- **国内双栈检测**：通过国内专用 IPv4 与 IPv6 单栈端点独立探测真实公网 IP
- **国际双栈检测**：通过国际专用 IPv4 与 IPv6 单栈端点独立探测真实公网 IP

- **浏览器无参数访问**：直接展示**双栈 IP 分流查询 Web UI 页面**（顶部卡片展示默认访问 IP，并列展示国内/国外双栈检测卡片、EdgeOne GEO Info 与多服务商对比）。
- **命令行工具访问（纯文本）**：`curl https://api.eallion.com/ip` 直接返回纯文本默认访问 IP（如 `1.2.3.4` 或 `240e:...`）。
- **返回合并结构化元数据（JSON）**：`GET /ip?type=json` 或带请求头 `Accept: application/json`，合并返回包含 `ip`, `protocol`, `version`, `type`, `isIPv4`, `isIPv6`, `geo`, `timestamp` 的完整数据。
- **强制返回 Web UI 页面**：`GET /ip?type=html`
- **协议版本校验与回落机制**：`GET /ip?v=4` 或 `GET /ip?v=6`。**浏览器访问完全不跳转**，保持在当前页面并由本地网卡发起异步探针展示真实 IP。终端命令行访问时，若当前连接协议不匹配默认不跳转（返回明确的 `curl -4` 指引）；如需由客户端跟随跳转至单栈端点，可显式指定 `mode=redirect`（配合 `curl -L`）。
- **获取单个字段**：`GET /ip?key={name}`（支持 `ip`, `protocol`, `version`, `type`, `isIPv4`, `isIPv6` 以及地理位置 `countryName`, `cityName`, `asn` 等任意字段）
- **支持参数**：
  - `type` / `format`: `html`, `text`, `json`, `all`
  - `v` / `version`: `4` 或 `6`（协议版本匹配校验）
  - `source` / `region`: `cn`（默认）或 `oversea`（配合 `v` 参数指定单栈数据源）
  - 标记参数: `cn`, `oversea`（支持直接作为查询标记传参，如 `?v=4&oversea`）
  - `mode`: `redirect`（显式启用客户端 302 重定向）或 `fetch`（由边缘节点代为请求节点出口 IP）
  - `key`: 指定返回单个字段（`ip`, `protocol`, `version`, `type`, `isIPv4`, `isIPv6`, `asn`, `countryName`, `cityName` 等）

### /lol

代理访问英雄数据并将 `hero` 字段转换为 Directus 自动完成可用的数组格式。

示例：`GET /lol/163.js` → 代理到 `https://game.gtimg.cn/images/lol/act/img/js/hero/163.js`，返回 JSON，`hero` 为数组，示例：

```json
{
  "file": "https://game.gtimg.cn/images/lol/act/img/js/hero/163.js",
  "hero": [
    {
      "id": "163",
      "title": "岩雀",
      "heroId": "163",
      "name": "岩雀",
      "alias": "Taliyah",
      ...
    }
  ]
}
```

### /mastodon

代理访问 `https://e5n.cc/api/v1/accounts/111136231674527355/statuses` 获取 Mastodon 状态。

### /memos

代理访问 `https://memos.eallion.com/api/v1/memos` 获取 Memos 数据。

### /og

代理访问 `https://og.eallion.com/api/og` 获取 OG 图片。

### /translate

使用彩云翻译 API 实现中文到英文的实时翻译。

请求示例：

```
GET /translate?slug=标题示例
```

响应示例：

```json
{
  "status": "success",
  "slug": "标题示例",
  "translated": "title-example",
  "timestamp": "2023-04-01T12:00:00.000Z"
}
```

环境变量配置：

- `CAIYUN_TOKEN`: 彩云翻译 API Token

## 部署要求

1. 在腾讯云 EdgeOne Pages 中配置以下环境变量：
   - `API_TOKEN`: 设置您的管理令牌
   - `CAIYUN_TOKEN`: 彩云翻译 API Token
   - 绑定 KV 存储并命名为 `goto_gts` (或修改代码使用其他名称)

2. 确保 edgeone.json 配置正确，包含以下路由：

   ```json
   "routes": [
     {
       "pattern": "/gts/*",
       "script": "functions/gts/[[path]].js",
       "methods": ["GET", "POST", "PUT", "DELETE", "HEAD"]
     },
     {
       "pattern": "/translate",
       "script": "functions/translate/index.js",
       "methods": ["GET"]
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
