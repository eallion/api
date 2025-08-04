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

### /ip

返回客户端的公网 IP 地址。

### /mastodon

代理访问 `https://e5n.cc/api/v1/accounts/111136231674527355/statuses` 获取 Mastodon 状态。

### /memos

代理访问 `https://memos.eallion.com/api/v1/memos` 获取 Memos 数据。

### /og

代理访问 `https://og.eallion.com/api/og` 获取 OG 图片。
