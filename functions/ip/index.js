/**
 * 解析客户端 IP 地址与协议版本 (IPv4 / IPv6)
 */
function parseIp(ip) {
  if (!ip || typeof ip !== 'string') {
    return {
      ip: 'Unknown',
      version: null,
      type: 'Unknown',
      isIPv4: false,
      isIPv6: false,
      isValid: false
    };
  }

  const cleanIp = ip.trim().replace(/^\[|\]$/g, '');
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  if (ipv4Regex.test(cleanIp)) {
    return {
      ip: cleanIp,
      version: 4,
      type: 'IPv4',
      isIPv4: true,
      isIPv6: false,
      isValid: true
    };
  }

  if (cleanIp.includes(':')) {
    return {
      ip: cleanIp,
      version: 6,
      type: 'IPv6',
      isIPv4: false,
      isIPv6: true,
      isValid: true
    };
  }

  return {
    ip: cleanIp,
    version: null,
    type: 'Unknown',
    isIPv4: false,
    isIPv6: false,
    isValid: false
  };
}

/**
 * 提取客户端真实 IP 地址
 * 优先使用 EdgeOne Makers 原生能力 request.eo.clientIp
 * 回退检查 EdgeOne 注入的请求头及通用反向代理头
 */
function getClientIp(request) {
  if (request.eo && typeof request.eo.clientIp === 'string' && request.eo.clientIp) {
    return request.eo.clientIp.trim();
  }
  const headers = request.headers;
  const eoConnectingIp = headers.get('eo-connecting-ip');
  if (eoConnectingIp) return eoConnectingIp.trim();
  const eoClientIp = headers.get('eo-client-ip');
  if (eoClientIp) return eoClientIp.trim();
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();
  return 'Unknown';
}

/**
 * 生成双栈 IP 分流查询 Web UI 页面 HTML
 */
function getIpPageHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>双栈 IP 分流查询 - api.eallion.com/ip</title>
  <meta name="description" content="查询您的 IP 地址、地理位置和分流信息">
  <link rel="dns-prefetch" href="//v4.yinghualuo.cn">
  <link rel="dns-prefetch" href="//v6.yinghualuo.cn">
  <link rel="dns-prefetch" href="//1.1.1.1">
  <link rel="dns-prefetch" href="//api-ipv4.ip.sb">
  <link rel="dns-prefetch" href="//api-ipv6.ip.sb">
  <link rel="dns-prefetch" href="//ipinfo.io">
  <link rel="dns-prefetch" href="//api.ipify.org">
  <link rel="preconnect" href="https://api.eallion.com" crossorigin>
  <link rel="stylesheet" href="/ip/style.css">
  <link rel="icon" href="/favicon.ico">
</head>
<body>
  <div class="container">
    <header>
      <h1>双栈 IP 分流查询</h1>
      <div class="theme-switcher">
        <button type="button" class="theme-btn active" data-theme="system" title="跟随系统">系统</button>
        <button type="button" class="theme-btn" data-theme="light" title="浅色模式">浅色</button>
        <button type="button" class="theme-btn" data-theme="dark" title="深色模式">深色</button>
      </div>
    </header>

    <main id="content">
      <div class="loading">
        <div class="spinner"></div>
        <p>正在获取 IP 信息...</p>
      </div>
    </main>

    <footer>
      <p>&copy; <span id="year"></span>
        <a href="https://www.eallion.com" target="_blank" rel="noopener noreferrer">eallion.com</a> · 
        <a href="https://e5n.cc/@eallion" target="_blank" rel="noopener noreferrer">Mastodon</a> · 
        <a href="https://github.com/eallion" target="_blank" rel="noopener noreferrer">GitHub</a>
      </p>
    </footer>
  </div>

  <script src="/ip/script.js"></script>
</body>
</html>`;
}

/**
 * 回落请求专用单栈端点，获取指定协议版本的 IP 地址
 */
async function fetchFallbackIp(targetUrl) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'curl/8.0'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;

    const text = (await response.text()).trim();

    // 尝试解析 JSON 格式
    try {
      const data = JSON.parse(text);
      if (data && typeof data.ip === 'string') {
        return data.ip.trim();
      }
    } catch {
      // 非 JSON 格式直接提取文本
    }

    // 正则匹配合法 IPv4 地址
    const ipv4Match = text.match(/(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/);
    if (ipv4Match) return ipv4Match[0];

    // 正则匹配合法 IPv6 地址
    const ipv6Match = text.match(/(?:[a-fA-F0-9]{1,4}:){1,7}[a-fA-F0-9]{1,4}|::1|::/);
    if (ipv6Match) return ipv6Match[0];

    return text.split('\n')[0].trim() || null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

export async function onRequest({ request }) {
  const commonHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Access-Control-Max-Age': '0'
  };

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: commonHeaders
    });
  }

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || url.searchParams.get('format');
    const key = url.searchParams.get('key');
    const versionParam = url.searchParams.get('v') || url.searchParams.get('version');
    const acceptHeader = request.headers.get('accept') || '';

    const rawIp = getClientIp(request);
    const ipInfo = parseIp(rawIp);
    const geoInfo = request.eo?.geo || {};

    // 协议类型 (IPv4 / IPv6) - 兼容原 ip 项目中的 protocol 字段
    const ipProtocol = ipInfo.type === 'IPv6' ? 'IPv6' : 'IPv4';

    // 判断是否优先返回 Web UI 页面：
    // 1. 显式指定 type=html 或 format=html
    // 2. 客户端请求头 Accept 包含 text/html 且未显式指定 type=json 或 type=text (浏览器访问)
    const isHtmlRequest = type === 'html' || (type !== 'json' && type !== 'text' && !key && acceptHeader.includes('text/html'));

    if (isHtmlRequest) {
      return new Response(getIpPageHtml(), {
        headers: {
          ...commonHeaders,
          'Content-Type': 'text/html;charset=UTF-8'
        }
      });
    }

    // 判断请求是否期望 JSON 格式
    const wantsJson = type === 'json' || type === 'all' || acceptHeader.includes('application/json');

    // 检查指定的 IP 版本校验与回落处理（如 ?v=4 或 ?v=6）
    if (versionParam) {
      const expectedVersion = parseInt(versionParam, 10);
      if (expectedVersion === 4 || expectedVersion === 6) {
        // 当前连接协议与请求的版本不匹配时，触发回落机制
        if (ipInfo.version !== expectedVersion) {
          // 判断回落数据源（支持 cn 与 oversea）
          let fallbackSource = 'cn';
          if (url.searchParams.has('oversea') || 
              url.searchParams.get('source') === 'oversea' || 
              url.searchParams.get('region') === 'oversea') {
            fallbackSource = 'oversea';
          } else if (url.searchParams.has('cn') || 
                     url.searchParams.get('source') === 'cn' || 
                     url.searchParams.get('region') === 'cn') {
            fallbackSource = 'cn';
          }

          // 匹配目标专用单栈端点
          let fallbackUrl;
          if (expectedVersion === 4) {
            fallbackUrl = fallbackSource === 'oversea'
              ? 'https://api-ipv4.ip.sb/ip'
              : 'https://v4.yinghualuo.cn/bejson';
          } else {
            fallbackUrl = fallbackSource === 'oversea'
              ? 'https://api-ipv6.ip.sb/ip'
              : 'https://v6.yinghualuo.cn/bejson';
          }

          // 检查是否显式要求重定向模式 (?mode=redirect 或 ?redirect)
          const isRedirectMode = url.searchParams.get('mode') === 'redirect' || url.searchParams.has('redirect');
          if (isRedirectMode) {
            return new Response(`Redirecting to IPv${expectedVersion} endpoint: ${fallbackUrl}\n`, {
              status: 302,
              headers: {
                ...commonHeaders,
                'Location': fallbackUrl,
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
              }
            });
          }

          // 显式指定 mode=fetch 或 mode=proxy 时，由边缘节点代为向第三方发起请求（返回边缘节点公网出口 IP）
          const isProxyFetch = url.searchParams.get('mode') === 'fetch' || url.searchParams.get('mode') === 'proxy';
          if (isProxyFetch) {
            const fallbackIp = await fetchFallbackIp(fallbackUrl);
            if (!fallbackIp) {
              const failMessage = `Protocol mismatch: connected via ${ipInfo.type}, fallback to IPv${expectedVersion} (${fallbackSource}) failed`;
              if (wantsJson) {
                return new Response(JSON.stringify({
                  status: 'error',
                  code: 502,
                  message: failMessage,
                  timestamp: Date.now()
                }, null, 2), {
                  status: 502,
                  headers: {
                    ...commonHeaders,
                    'Content-Type': 'application/json;charset=UTF-8'
                  }
                });
              }
              return new Response(`Error: ${failMessage}\n`, {
                status: 502,
                headers: {
                  ...commonHeaders,
                  'Content-Type': 'text/plain;charset=UTF-8'
                }
              });
            }

            if (wantsJson) {
              return new Response(JSON.stringify({
                status: 'success',
                code: 200,
                data: {
                  ip: fallbackIp,
                  protocol: expectedVersion === 6 ? 'IPv6' : 'IPv4',
                  version: expectedVersion,
                  type: expectedVersion === 6 ? 'IPv6' : 'IPv4',
                  isIPv4: expectedVersion === 4,
                  isIPv6: expectedVersion === 6,
                  source: fallbackSource,
                  fallback: true,
                  timestamp: Date.now()
                }
              }, null, 2), {
                headers: {
                  ...commonHeaders,
                  'Content-Type': 'application/json;charset=UTF-8'
                }
              });
            }

            return new Response(fallbackIp, {
              headers: {
                ...commonHeaders,
                'Content-Type': 'text/plain;charset=UTF-8'
              }
            });
          }

          // 默认情况（不跳转）：返回明确的协议不匹配及终端正确获取本机真实 IP 的指引
          const mismatchMessage = `Protocol mismatch: connected via ${ipInfo.type}, but requested IPv${expectedVersion}.`;
          const guideMessage = `Over an ${ipInfo.type} connection, EdgeOne cannot detect your local machine's IPv${expectedVersion} without redirection.\n` +
            `To get your real IPv${expectedVersion} without redirection:\n` +
            `  curl -${expectedVersion} https://api.eallion.com/ip\n` +
            `To allow redirecting to dedicated single-stack endpoint:\n` +
            `  curl -L "https://api.eallion.com/ip?v=${expectedVersion}&mode=redirect"\n` +
            `To view in browser with automatic local probing:\n` +
            `  Open https://api.eallion.com/ip?v=${expectedVersion} in your browser`;

          if (wantsJson) {
            return new Response(JSON.stringify({
              status: 'error',
              code: 400,
              message: mismatchMessage,
              hint: `Run 'curl -${expectedVersion} https://api.eallion.com/ip' to resolve local IPv${expectedVersion} directly without redirecting.`,
              client: {
                ip: ipInfo.ip,
                protocol: ipProtocol,
                version: ipInfo.version,
                type: ipInfo.type
              },
              timestamp: Date.now()
            }, null, 2), {
              status: 400,
              headers: {
                ...commonHeaders,
                'Content-Type': 'application/json;charset=UTF-8'
              }
            });
          }

          return new Response(`Error: ${mismatchMessage}\n\n${guideMessage}\n`, {
            status: 400,
            headers: {
              ...commonHeaders,
              'Content-Type': 'text/plain;charset=UTF-8'
            }
          });
        }
      }
    }

    // 组织合并后的地理位置数据
    const geoData = {
      asn: geoInfo.asn ?? 'Unknown',
      countryName: geoInfo.countryName || 'Unknown',
      countryCodeAlpha2: geoInfo.countryCodeAlpha2 || request.headers.get('eo-client-ipcountry') || 'Unknown',
      countryCodeAlpha3: geoInfo.countryCodeAlpha3 || 'Unknown',
      countryCodeNumeric: geoInfo.countryCodeNumeric || 'Unknown',
      regionName: geoInfo.regionName || 'Unknown',
      regionCode: geoInfo.regionCode || 'Unknown',
      cityName: geoInfo.cityName || 'Unknown',
      latitude: geoInfo.latitude ?? 'Unknown',
      longitude: geoInfo.longitude ?? 'Unknown'
    };

    // 处理指定 key 查询（兼容 api 项目与 ip 项目的所有参数）
    if (key) {
      let keyValue;
      if (key === 'ip') keyValue = ipInfo.ip;
      else if (key === 'protocol') keyValue = ipProtocol;
      else if (key === 'version') keyValue = ipInfo.version !== null ? String(ipInfo.version) : 'Unknown';
      else if (key === 'type') keyValue = ipInfo.type;
      else if (key === 'isIPv4') keyValue = String(ipInfo.isIPv4);
      else if (key === 'isIPv6') keyValue = String(ipInfo.isIPv6);
      else if (Object.prototype.hasOwnProperty.call(geoData, key)) keyValue = String(geoData[key]);

      if (keyValue !== undefined) {
        if (wantsJson) {
          return new Response(JSON.stringify({
            status: 'success',
            code: 200,
            data: {
              [key]: keyValue,
              timestamp: Date.now()
            }
          }, null, 2), {
            headers: {
              ...commonHeaders,
              'Content-Type': 'application/json;charset=UTF-8'
            }
          });
        }
        return new Response(keyValue, {
          headers: {
            ...commonHeaders,
            'Content-Type': 'text/plain;charset=UTF-8'
          }
        });
      }
    }

    // JSON 格式响应（完整合并 api 与 ip 两项目的字段定义）
    if (wantsJson) {
      const responseData = {
        status: 'success',
        code: 200,
        data: {
          ip: ipInfo.ip,
          protocol: ipProtocol,
          version: ipInfo.version,
          type: ipInfo.type,
          isIPv4: ipInfo.isIPv4,
          isIPv6: ipInfo.isIPv6,
          geo: geoData,
          timestamp: Date.now()
        }
      };

      return new Response(JSON.stringify(responseData, null, 2), {
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/json;charset=UTF-8'
        }
      });
    }

    // 默认纯文本返回 IP 地址（适配 curl 等命令行工具无参数调用）
    return new Response(ipInfo.ip, {
      headers: {
        ...commonHeaders,
        'Content-Type': 'text/plain;charset=UTF-8'
      }
    });

  } catch (error) {
    console.error('Error processing IP request:', error);
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || url.searchParams.get('format');
    const acceptHeader = request.headers.get('accept') || '';
    const wantsJson = type === 'json' || type === 'all' || acceptHeader.includes('application/json');

    if (wantsJson) {
      return new Response(JSON.stringify({
        status: 'error',
        code: 500,
        message: 'Internal Server Error',
        timestamp: Date.now()
      }, null, 2), {
        status: 500,
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/json;charset=UTF-8'
        }
      });
    }

    return new Response('Unknown', {
      status: 500,
      headers: {
        ...commonHeaders,
        'Content-Type': 'text/plain;charset=UTF-8'
      }
    });
  }
}