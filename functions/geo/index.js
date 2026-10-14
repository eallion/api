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
    const key = url.searchParams.get('key');
    const type = url.searchParams.get('type') || url.searchParams.get('format');
    const versionParam = url.searchParams.get('v') || url.searchParams.get('version');

    const rawIp = getClientIp(request);
    const ipInfo = parseIp(rawIp);
    const geoInfo = request.eo?.geo || {};
    const uuid = request.eo?.uuid || request.headers.get('eo-log-uuid') || '';

    // 组织地理位置与网络数据
    const geoData = {
      ip: ipInfo.ip,
      version: ipInfo.version,
      type: ipInfo.type,
      isIPv4: ipInfo.isIPv4,
      isIPv6: ipInfo.isIPv6,
      asn: geoInfo.asn ?? 'Unknown',
      countryName: geoInfo.countryName || 'Unknown',
      countryCodeAlpha2: geoInfo.countryCodeAlpha2 || request.headers.get('eo-client-ipcountry') || 'Unknown',
      countryCodeAlpha3: geoInfo.countryCodeAlpha3 || 'Unknown',
      countryCodeNumeric: geoInfo.countryCodeNumeric || 'Unknown',
      regionName: geoInfo.regionName || 'Unknown',
      regionCode: geoInfo.regionCode || 'Unknown',
      cityName: geoInfo.cityName || 'Unknown',
      latitude: geoInfo.latitude ?? 'Unknown',
      longitude: geoInfo.longitude ?? 'Unknown',
      ...(uuid ? { uuid } : {})
    };

    // 检查指定的 IP 版本校验参数（如 ?v=4 或 ?v=6）
    if (versionParam) {
      const expectedVersion = parseInt(versionParam, 10);
      if (expectedVersion === 4 || expectedVersion === 6) {
        if (ipInfo.version !== expectedVersion) {
          const mismatchMessage = `Protocol mismatch: requested IPv${expectedVersion}, but connected via ${ipInfo.type}`;
          if (type === 'text') {
            return new Response(`Error: ${mismatchMessage}\n`, {
              status: 400,
              headers: {
                ...commonHeaders,
                'Content-Type': 'text/plain;charset=UTF-8'
              }
            });
          }
          return new Response(JSON.stringify({
            status: 'error',
            code: 400,
            message: mismatchMessage,
            client: {
              ip: ipInfo.ip,
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
      }
    }

    // 情况 1: 请求特定字段 (?key=fieldName)
    if (key) {
      if (Object.prototype.hasOwnProperty.call(geoData, key)) {
        const value = geoData[key];

        if (type === 'json') {
          return new Response(JSON.stringify({
            status: 'success',
            code: 200,
            data: {
              [key]: value,
              timestamp: Date.now()
            }
          }, null, 2), {
            headers: {
              ...commonHeaders,
              'Content-Type': 'application/json;charset=UTF-8'
            }
          });
        }

        // 默认返回纯文本
        return new Response(String(value), {
          headers: {
            ...commonHeaders,
            'Content-Type': 'text/plain;charset=UTF-8'
          }
        });
      }

      // 请求的 key 不存在
      const availableKeys = Object.keys(geoData).join(', ');
      if (type === 'text') {
        return new Response(`Invalid key: ${key}. Available keys: ${availableKeys}\n`, {
          status: 400,
          headers: {
            ...commonHeaders,
            'Content-Type': 'text/plain;charset=UTF-8'
          }
        });
      }

      return new Response(JSON.stringify({
        status: 'error',
        code: 400,
        message: `Invalid key: ${key}. Available keys: ${availableKeys}`,
        timestamp: Date.now()
      }, null, 2), {
        status: 400,
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/json;charset=UTF-8'
        }
      });
    }

    // 情况 2: 请求纯文本格式 (?type=text 或 ?format=text)
    if (type === 'text') {
      const textOutput = [
        `ip: ${geoData.ip}`,
        `version: ${geoData.version}`,
        `type: ${geoData.type}`,
        `country: ${geoData.countryName} (${geoData.countryCodeAlpha2})`,
        `region: ${geoData.regionName}`,
        `city: ${geoData.cityName}`,
        `asn: ${geoData.asn}`,
        `latitude: ${geoData.latitude}`,
        `longitude: ${geoData.longitude}`
      ].join('\n');

      return new Response(textOutput, {
        headers: {
          ...commonHeaders,
          'Content-Type': 'text/plain;charset=UTF-8'
        }
      });
    }

    // 默认情况：返回完整 JSON
    return new Response(JSON.stringify({
      status: 'success',
      code: 200,
      data: {
        ...geoData,
        timestamp: Date.now()
      }
    }, null, 2), {
      headers: {
        ...commonHeaders,
        'Content-Type': 'application/json;charset=UTF-8'
      }
    });

  } catch (error) {
    console.error('Error processing GEO request:', error);
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || url.searchParams.get('format');

    if (type === 'text') {
      return new Response('Error retrieving geo information', {
        status: 500,
        headers: {
          ...commonHeaders,
          'Content-Type': 'text/plain;charset=UTF-8'
        }
      });
    }

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
}