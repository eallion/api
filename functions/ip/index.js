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
    // 仅当显式指定 type=html，或者在无任何功能性查询参数且 Accept 包含 text/html（浏览器默认访问）时返回 Web UI
    const hasApiParams = url.searchParams.has('v') || 
                         url.searchParams.has('version') || 
                         url.searchParams.has('key') || 
                         url.searchParams.has('cn') || 
                         url.searchParams.has('oversea') || 
                         url.searchParams.has('source') || 
                         url.searchParams.has('region') ||
                         url.searchParams.has('type') ||
                         url.searchParams.has('format');

    const isHtmlRequest = type === 'html' || (!hasApiParams && acceptHeader.includes('text/html'));

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

    // 解析分流参数（cn / oversea）
    const wantsOversea = url.searchParams.has('oversea') || 
                         url.searchParams.get('source') === 'oversea' || 
                         url.searchParams.get('region') === 'oversea';
    const wantsCn = url.searchParams.has('cn') || 
                    url.searchParams.get('source') === 'cn' || 
                    url.searchParams.get('region') === 'cn';
    const requestedRegion = wantsOversea ? 'oversea' : (wantsCn ? 'cn' : null);

    const clientCountry = geoInfo.countryCodeAlpha2 || request.headers.get('eo-client-ipcountry') || 'Unknown';
    const isDomestic = clientCountry === 'CN';
    const clientRegion = isDomestic ? 'cn' : 'oversea';

    // 检查指定的 IP 版本校验（如 ?v=4 或 ?v=6）
    if (versionParam) {
      const expectedVersion = parseInt(versionParam, 10);
      if (expectedVersion === 4 || expectedVersion === 6) {
        // 当前连接协议与请求的版本不匹配时，返回 400 协议不匹配错误，绝不重定向，绝不伪造机房出口 IP
        if (ipInfo.version !== expectedVersion) {
          const isRedirectMode = url.searchParams.get('mode') === 'redirect';
          if (isRedirectMode) {
            const fallbackUrl = expectedVersion === 4
              ? (requestedRegion === 'oversea' ? 'https://api-ipv4.ip.sb/ip' : 'https://v4.yinghualuo.cn/bejson')
              : (requestedRegion === 'oversea' ? 'https://api-ipv6.ip.sb/ip' : 'https://v6.yinghualuo.cn/bejson');
            return new Response(`Redirecting to IPv${expectedVersion} endpoint: ${fallbackUrl}\n`, {
              status: 302,
              headers: {
                ...commonHeaders,
                'Location': fallbackUrl,
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
              }
            });
          }

          const mismatchMessage = `Protocol mismatch: connected via ${ipInfo.type}, but requested IPv${expectedVersion}.`;
          const guideMessage = `Over an ${ipInfo.type} connection, EdgeOne cannot detect your local machine's IPv${expectedVersion} without redirection.\n` +
            `To query your local IPv${expectedVersion} directly without redirection:\n` +
            `  curl -${expectedVersion} https://api.eallion.com/ip`;

          if (wantsJson) {
            return new Response(JSON.stringify({
              status: 'error',
              code: 400,
              message: mismatchMessage,
              hint: `Run 'curl -${expectedVersion} https://api.eallion.com/ip' to query local IPv${expectedVersion} directly.`,
              client: {
                ip: ipInfo.ip,
                protocol: ipProtocol,
                version: ipInfo.version,
                type: ipInfo.type,
                region: clientRegion
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
      else if (key === 'source' || key === 'region') keyValue = clientRegion;
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
          source: clientRegion,
          region: clientRegion,
          ...(requestedRegion ? { requestedRegion } : {}),
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