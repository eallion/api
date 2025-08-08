// d:\github.com\apis\functions\ip\index.js
export async function onRequest({ request }) {
  try {
    // 解析 URL 和查询参数
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    
    // 通过 EdgeOne 提供的 API 获取客户端真实 IP
    const clientIP = request.eo?.clientIp || 'Unknown';
    
    // 如果请求 type=json 或 type=all，返回完整的 JSON 信息
    if (type === 'json' || type === 'all') {
      const geoInfo = request.eo?.geo || {};
      
      const responseData = {
        status: "success",
        code: 200,
        data: {
          ip: clientIP,
          geo: {
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
          },
          timestamp: Date.now()
        }
      };
      
      return new Response(JSON.stringify(responseData, null, 2), {
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
          'Access-Control-Max-Age': '0'
        }
      });
    }
    
    // 默认情况或 type=text，只返回纯文本 IP
    return new Response(clientIP, {
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'Access-Control-Max-Age': '0'
      }
    });
  } catch (error) {
    console.error('Error processing IP request:', error);
    
    // 检查是否请求了 JSON 格式
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    
    if (type === 'json' || type === 'all') {
      return new Response(JSON.stringify({
        status: "error",
        code: 500,
        message: "Internal Server Error",
        timestamp: Date.now()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
          'Access-Control-Max-Age': '0'
        }
      });
    }
    
    // 默认返回纯文本错误
    return new Response('Unknown', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'Access-Control-Max-Age': '0'
      }
    });
  }
}