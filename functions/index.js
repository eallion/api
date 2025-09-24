// d:\github.com\apis\functions\index.js
export async function onRequest() {
  try {
    // 获取当前时间
    const now = new Date();
    
    // 格式化日期为 "Aug 6, 2025, 17:38:18 +0800" 格式
    const month = now.toLocaleString('en-US', { month: 'short' });
    const day = now.getDate();
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    // 构建最终的日期字符串
    const formattedDate = `${month} ${day}, ${year}, ${hours}:${minutes}:${seconds} +0800`;
    
    // 时间戳（带毫秒）
    const timestamp = now.getTime();
    
    // 定义端点信息（参数和文档链接）
    const endpointsInfo = {
      "/bing": {
        endpoint: "https://api.eallion.com/bing",
        sample: "https://api.eallion.com/bing?type=image",
        docs: "https://github.com/eallion/bing-php-api",
        parameters: {
          "type": "image",
          "region": [
            "zh-CN", "en-US", "ja-JP", "en-AU", "en-UK", "de-DE", "en-NZ", "en-CA"
          ],
          "date": "2006-01-02",
          "dpi": [
            "720", "1080", "720p", "1080p", "1080i", "hd", "uhd", "2k", "2.5k", "2.8k", 
            "4k", "m", "small", "thumbnail", "mobile", "original", "1920x1200", 
            "1920x1080", "1366x768", "1280x768", "1280x720", "1024x768", "800x600", 
            "800x480", "768x1280", "720x1280", "640x480", "480x800", "400x240", "320x240", "240x320"
          ]
        }
      },
      "/favicon": {
        endpoint: "https://api.eallion.com/favicon",
        sample: "https://api.eallion.com/favicon?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=https://www.eallion.com",
        docs: "Redirect to t3.gstatic.cn",
        parameters: {
          "size": ["128", "64", "32", "16"],
          "url": "https://www.eallion.com"
        }
      },
      "/geo": {
        endpoint: "https://api.eallion.com/geo",
        sample: "https://api.eallion.com/geo?key=countryName&type=json",
        docs: "https://cloud.tencent.com/document/product/1552/107291",
        parameters: {
          "key": [
            "ip", "asn", "countryName", "countryCodeAlpha2", "countryCodeAlpha3", 
            "countryCodeNumeric", "regionName", "regionCode", "cityName", 
            "latitude", "longitude"
          ],
          "type": "json"
        }
      },
      "/gravatar": {
        endpoint: "https://api.eallion.com/gravatar",
        sample: "https://api.eallion.com/gravatar/171e4c30959e8c077a6c58b958624b31",
        docs: "https://wiki.libravatar.org/description/",
        parameters: {
          "md5": "171e4c30959e8c077a6c58b958624b31"
        }
      },
      "/gts": {
        endpoint: "https://api.eallion.com/gts",
        sample: "https://api.eallion.com/gts/eallion",
        docs: "https://edgeone.cloud.tencent.com/pages/document/185234005644472320",
        parameters: {
          "admin": {
            "key": "String (required)",
            "value": "String (optional for DELETE)",
            "token": "String (required)"
          },
          "methods": ["GET", "POST", "DELETE"]
        }
      },
      "/ip": {
        endpoint: "https://api.eallion.com/ip",
        sample: "https://api.eallion.com/ip",
        docs: "https://cloud.tencent.com/document/product/1552/101774",
        parameters: {
          "type": ["json", "all"]
        }
      },
      "/lol": {
        endpoint: "https://api.eallion.com/lol/{id}.js",
        sample: "https://api.eallion.com/lol/11.js",
        docs: "https://lol.qq.com/cguide/Guide/PublicResources/APIs.html",
        parameters: {
          "id": "英雄 ID (例如 11)"
        }
      },
      "/mastodon": {
        endpoint: "https://api.eallion.com/mastodon",
        sample: "https://api.eallion.com/mastodon?limit=20&exclude_replies=true&exclude_reblogs=true",
        docs: "https://docs.joinmastodon.org/methods/statuses/",
        parameters: {
          "limit": 40,
          "exclude_replies": true,
          "exclude_reblogs": true,
          "only_media": false,
          "max_id": "String",
          "min_id": "String",
          "since_id": "String",
          "pinned": false,
          "tagged": "String"
        }
      },
      "/memos": {
        endpoint: "https://api.eallion.com/memos",
        sample: "https://api.eallion.com/memos?parent=users/101&pageSize=10",
        docs: "https://memos.apidocumentation.com/reference",
        parameters: {
          "pageSize": 10,
          "pageToken": "Optional",
          "state": "Optional [NORMAL STATE_UNSPECIFIED ARCHIVED]",
          "orderBy": "Optional",
          "showDeleted": "Optional",
          "filter": "Optional"
        }
      },
      "/og": {
        endpoint: "https://api.eallion.com/og",
        sample: "https://api.eallion.com/og?title=大大的小蜗牛",
        docs: "https://www.eallion.com/og-image-api/",
        parameters: {
          "title": "String"
        }
      },
      "/translate": {
        endpoint: "https://api.eallion.com/translate",
        sample: "https://api.eallion.com/translate?slug=标题示例",
        docs: "https://docs.caiyunapp.com/lingocloud-api/index.html",
        parameters: {
          "slug": "String (required)"
        }
      }
    };
    
    // 按键名升序排列 endpoints
    const sortedEndpoints = {};
    Object.keys(endpointsInfo)
      .sort()
      .forEach(key => {
        sortedEndpoints[key] = endpointsInfo[key];
      });
    
    // 计算端点总数
    const totalEndpoints = Object.keys(endpointsInfo).length;
    
    // 构造响应数据
    const responseData = {
      status: "success",
      code: 200,
      message: "API is operational",
      version: "2.0.0",
      allowed_methods: ["GET"],
      timestamp: timestamp,
      date: formattedDate,
      docs: "https://api.eallion.com/docs",
      source: "https://github.com/eallion/api",
      count: totalEndpoints,
      endpoints: sortedEndpoints
    };
    
    // 返回 JSON 响应
    return new Response(JSON.stringify(responseData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': '86400'
      }
    });
  } catch (error) {
    console.error('Error generating home page:', error);
    
    // 错误情况下也提供时间戳和日期
    const now = new Date();
    
    // 格式化日期为 "Aug 6, 2025, 17:38:18 +0800" 格式
    const month = now.toLocaleString('en-US', { month: 'short' });
    const day = now.getDate();
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    // 构建最终的日期字符串
    const formattedDate = `${month} ${day}, ${year}, ${hours}:${minutes}:${seconds} +0800`;
    
    const timestamp = now.getTime();
    
    // 定义端点信息（参数和文档链接）
    const endpointsInfo = {
      "/bing": {
        endpoint: "https://api.eallion.com/bing",
        sample: "https://api.eallion.com/bing?type=image",
        docs: "https://github.com/eallion/bing-php-api",
        parameters: {
          "type": "image",
          "region": [
            "zh-CN", "en-US", "ja-JP", "en-AU", "en-UK", "de-DE", "en-NZ", "en-CA"
          ],
          "date": "2006-01-02",
          "dpi": [
            "720", "1080", "720p", "1080p", "1080i", "hd", "uhd", "2k", "2.5k", "2.8k", 
            "4k", "m", "small", "thumbnail", "mobile", "original", "1920x1200", 
            "1920x1080", "1366x768", "1280x768", "1280x720", "1024x768", "800x600", 
            "800x480", "768x1280", "720x1280", "640x480", "480x800", "400x240", "320x240", "240x320"
          ]
        }
      },
      "/favicon": {
        endpoint: "https://api.eallion.com/favicon",
        sample: "https://api.eallion.com/favicon?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=64&url=https://www.eallion.com",
        docs: "Redirect to t3.gstatic.cn",
        parameters: {
          "size": ["128", "64", "32", "16"],
          "url": "https://www.eallion.com"
        }
      },
      "/geo": {
        endpoint: "https://api.eallion.com/geo",
        sample: "https://api.eallion.com/geo?key=countryName&type=json",
        docs: "https://cloud.tencent.com/document/product/1552/107291",
        parameters: {
          "key": [
            "ip", "asn", "countryName", "countryCodeAlpha2", "countryCodeAlpha3", 
            "countryCodeNumeric", "regionName", "regionCode", "cityName", 
            "latitude", "longitude"
          ],
          "type": "json"
        }
      },
      "/gravatar": {
        endpoint: "https://api.eallion.com/gravatar",
        sample: "https://api.eallion.com/gravatar/171e4c30959e8c077a6c58b958624b31",
        docs: "https://wiki.libravatar.org/description/",
        parameters: {
          "md5": "171e4c30959e8c077a6c58b958624b31"
        }
      },
      "/ip": {
        endpoint: "https://api.eallion.com/ip",
        sample: "https://api.eallion.com/ip",
        docs: "https://cloud.tencent.com/document/product/1552/101774",
        parameters: {
          "type": ["json", "all"]
        }
      },
      "/mastodon": {
        endpoint: "https://api.eallion.com/mastodon",
        sample: "https://api.eallion.com/mastodon?limit=20&exclude_replies=true&exclude_reblogs=true",
        docs: "https://docs.joinmastodon.org/methods/statuses/",
        parameters: {
          "limit": 40,
          "exclude_replies": true,
          "exclude_reblogs": true,
          "only_media": false,
          "max_id": "String",
          "min_id": "String",
          "since_id": "String",
          "pinned": false,
          "tagged": "String"
        }
      },
      "/memos": {
        endpoint: "https://api.eallion.com/memos",
        sample: "https://api.eallion.com/memos?parent=users/101&pageSize=10",
        docs: "https://memos.apidocumentation.com/reference",
        parameters: {
          "pageSize": 10,
          "pageToken": "Optional",
          "state": "Optional [NORMAL STATE_UNSPECIFIED ARCHIVED]",
          "orderBy": "Optional",
          "showDeleted": "Optional",
          "filter": "Optional"
        }
      },
      "/og": {
        endpoint: "https://api.eallion.com/og",
        sample: "https://api.eallion.com/og?title=大大的小蜗牛",
        docs: "https://www.eallion.com/og-image-api/",
        parameters: {
          "title": "String"
        }
      },
      "/translate": {
        endpoint: "https://api.eallion.com/translate",
        sample: "https://api.eallion.com/translate?slug=标题示例",
        docs: "https://docs.caiyunapp.com/lingocloud-api/index.html",
        parameters: {
          "slug": "String (required)"
        }
      }
    };
    
    const totalEndpoints = Object.keys(endpointsInfo).length;
    
    return new Response(JSON.stringify({
      status: "error",
      code: 500,
      message: "Internal Server Error",
      version: "2.0.0",
      allowed_methods: ["GET"],
      timestamp: timestamp,
      date: formattedDate,
      docs: "https://api.eallion.com/docs",
      source: "https://github.com/eallion/api",
      count: totalEndpoints,
      endpoints: {}
    }), {
      status: 500,
      headers: {
        'Cache-Control': '86400',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}