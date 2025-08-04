// 文件路径：/functions/gravatar/[[path]].js
// 匹配路由：/gravatar/*

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // 只允许 GET 请求
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { 'Allow': 'GET' }
    });
  }

  // 提取 Gravatar 路径（移除 /gravatar/ 前缀）
  const gravatarPath = url.pathname.replace(/^\/gravatar\//, '');
  
  // 验证路径是否有效
  if (!gravatarPath) {
    return new Response('Missing Gravatar hash', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // 构建目标 URL
  const targetUrl = new URL(`https://cn.cravatar.com/avatar/${gravatarPath}`);
  
  // 保留原始查询参数
  url.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  try {
    // 配置代理请求
    const proxyRequest = new Request(targetUrl, {
      method: 'GET',
      headers: new Headers({
        'Accept': 'image/webp,*/*',
        'User-Agent': 'EdgeOne-Gravatar-Proxy/1.0'
      }),
      redirect: 'follow'
    });

    // 发起代理请求
    const response = await fetch(proxyRequest);
    
    // 处理重定向响应
    if (response.status >= 300 && response.status < 400) {
      return Response.redirect(response.headers.get('Location'), 302);
    }
    
    // 复制响应头
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.delete('Set-Cookie'); // 移除敏感头
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
    
  } catch (err) {
    return new Response('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}