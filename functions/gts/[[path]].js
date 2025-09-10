export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const key = path.replace(/^\/gts\//, '').replace(/-/g, '_');

    // 处理 admin 路径的请求
    if (path === '/gts/admin' || path.startsWith('/gts/admin/')) {
        // API Token 认证
        const API_TOKEN = env.API_TOKEN || "your_default_token_here";
        
        // 支持从 header 或查询参数获取 token
        const token = request.headers.get('Authorization')?.replace('Bearer ', '') || 
                      url.searchParams.get('token');

        if (!token || token !== API_TOKEN) {
            return new Response('认证失败：无效的 API Token', {
                status: 401,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }

        try {
            if (request.method === 'DELETE') {
                // DELETE 方法只能从 URL 参数获取 key
                const key = url.searchParams.get('key');
                
                if (!key) {
                    return new Response('缺少必要参数：key', {
                        status: 400,
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    });
                }
                
                // 删除键值对
                await API_KV.delete(key);
                return new Response(`成功删除键：${key}`, {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            } else if (request.method === 'POST') {
                let key, value;
                
                // 检查是否通过 URL 参数传递
                const urlKey = url.searchParams.get('key');
                const urlValue = url.searchParams.get('value');
                
                if (urlKey && urlValue) {
                    // 使用 URL 参数
                    key = urlKey;
                    value = urlValue;
                } else {
                    // 从 body 获取参数
                    const bodyData = await request.json();
                    key = bodyData.key;
                    value = bodyData.value;
                }
                
                if (!key) {
                    return new Response('缺少必要参数：key', {
                        status: 400,
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    });
                }
                
                if (!value) {
                    return new Response('缺少必要参数：value', {
                        status: 400,
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                    });
                }
                
                // 将键值对写入 KV 存储
                await API_KV.put(key, value);
                
                // 返回成功响应
                return new Response(`成功设置键值对：${key} = ${value}`, {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            } else {
                return new Response('不支持的请求方法', {
                    status: 405,
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            }
        } catch (error) {
            // 返回错误响应
            return new Response(`操作失败：${error.message}`, {
                status: 500,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }
    }

    // 处理普通路径的请求
    const value = await API_KV.get(key);
    
    if (value) {
        // 默认重定向网址
        const newUrl = `https://m.eallion.com/@eallion/statuses/${value}`;

        return new Response(null, {
            headers: {
                location: newUrl
            },
            status: 302
        });
    } else {
        // 如果没有找到对应的值，3 秒后跳转到指定 URL
        const redirectUrl = 'https://www.eallion.com';
        return new Response(
            `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Redirecting...</title>
                <meta http-equiv="refresh" content="3;url=${redirectUrl}?ref=api/gts/error">
            </head>
            <body>
                <p>Mastodon ID or Blog Slug not found. Redirecting to <a href="${redirectUrl}?ref=api/gts/error">${redirectUrl}</a> in 3 seconds...</p>
            </body>
            </html>`,
            {
                headers: {
                    'Content-Type': 'text/html',
                    'Refresh': '3;url=' + redirectUrl
                },
                status: 404
            }
        );
    }
}