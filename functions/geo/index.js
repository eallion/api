export async function onRequest({ request }) {
  try {
    // 解析 URL 和查询参数
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const type = url.searchParams.get('type');
    
    // 通过 EdgeOne 提供的 API 获取客户端真实 IP
    const clientIP = request.eo?.clientIp || 'Unknown';
    
    // 通过 EdgeOne 提供的 API 获取地理位置信息
    const geoInfo = request.eo?.geo || {};
    
    // 可用的地理信息字段
    const geoData = {
      asn: geoInfo.asn || 'Unknown',
      countryName: geoInfo.countryName || 'Unknown',
      countryCodeAlpha2: geoInfo.countryCodeAlpha2 || 'Unknown',
      countryCodeAlpha3: geoInfo.countryCodeAlpha3 || 'Unknown',
      countryCodeNumeric: geoInfo.countryCodeNumeric || 'Unknown',
      regionName: geoInfo.regionName || 'Unknown',
      regionCode: geoInfo.regionCode || 'Unknown',
      cityName: geoInfo.cityName || 'Unknown',
      latitude: geoInfo.latitude || 'Unknown',
      longitude: geoInfo.longitude || 'Unknown'
    };
    
    // 情况 1: 请求 IP 地址 (?key=ip)
    if (key === 'ip') {
      // 如果同时指定了 type=json，则返回 JSON 格式
      if (type === 'json') {
        return new Response(JSON.stringify({
          status: "success",
          code: 200,
          data: {
            ip: clientIP,
            timestamp: Date.now()
          }
        }, null, 2), {
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
          }
        });
      }
      
      // 默认返回纯文本 IP
      return new Response(clientIP, {
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 情况 2: 请求特定地理字段 (?key=fieldName)
    if (key && geoData.hasOwnProperty(key)) {
      const value = geoData[key];
      
      // 如果同时指定了 type=json，则返回 JSON 格式
      if (type === 'json') {
        return new Response(JSON.stringify({
          status: "success",
          code: 200,
          data: {
            [key]: value,
            timestamp: Date.now()
          }
        }, null, 2), {
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
          }
        });
      }
      
      // 默认返回纯文本
      return new Response(value.toString(), {
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 情况 3: 请求所有数据 (?type=all 或 默认情况)
    if (!key || type === 'all' || !type) {
      return new Response(JSON.stringify({
        status: "success",
        code: 200,
        data: {
          ip: clientIP,
          ...geoData,
          timestamp: Date.now()
        }
      }, null, 2), {
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    }
    
    // 情况 4: 请求特定字段但字段不存在
    if (key && key !== 'ip' && !geoData.hasOwnProperty(key)) {
      if (type === 'json') {
        return new Response(JSON.stringify({
          status: "error",
          code: 400,
          message: `Invalid key: ${key}. Available keys: ip, ${Object.keys(geoData).join(', ')}`,
          timestamp: Date.now()
        }, null, 2), {
          status: 400,
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store'
          }
        });
      }
      
      return new Response('Invalid key', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 默认情况：返回所有数据的 JSON
    return new Response(JSON.stringify({
      status: "success",
      code: 200,
      data: {
        ip: clientIP,
        ...geoData,
        timestamp: Date.now()
      }
    }, null, 2), {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error processing GEO request:', error);
    
    // 解析 URL 和查询参数（错误处理中再次解析）
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    
    if (type === 'json' || !type || type === 'all') {
      return new Response(JSON.stringify({
        status: "error",
        code: 500,
        message: "Internal Server Error",
        timestamp: Date.now()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 默认返回纯文本错误
    return new Response('Error retrieving geo information', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}