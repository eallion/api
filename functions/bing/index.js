// Bing 壁纸 API 函数
const BING = 'https://www.bing.com';
const regions = ['zh-CN', 'en-US', 'ja-JP', 'en-AU', 'en-UK', 'de-DE', 'en-NZ', 'en-CA'];

const dpis = {
  '720': '1280x720',
  '1080': '1920x1080',
  '720p': '1280x720',
  '1080p': '1920x1080',
  '1080i': '1920x1080',
  'hd': '1920x1080',
  'uhd': '1920x1080',
  '2k': '1920x1080',
  '2.5k': '1920x1200',
  '2.8k': '1920x1200',
  '4k': '1920x1080',
  'm': '720x1280',
  'small': '1280x720',
  'thumbnail': '320x240',
  'mobile': '720x1280',
  'original': '1920x1200',
  '1920x1200': '1920x1200',
  '1920x1080': '1920x1080',
  '1366x768': '1366x768',
  '1280x768': '1280x768',
  '1280x720': '1280x720',
  '1024x768': '1024x768',
  '800x600': '800x600',
  '800x480': '800x480',
  '768x1280': '768x1280',
  '720x1280': '720x1280',
  '640x480': '640x480',
  '480x800': '480x800',
  '400x240': '400x240',
  '320x240': '320x240',
  '240x320': '240x320'
};

// 格式化日期函数
function dateFormat(date) {
  let formattedDate = date.substring(0, 4) + '-' + date.substring(4);
  formattedDate = formattedDate.substring(0, 7) + '-' + formattedDate.substring(7);
  return formattedDate;
}

// 获取 Bing 壁纸数据
async function getBingWallpaper(params) {
  const region = params.region || 'en-US';
  const date = params.date || null;
  const dpi = params.dpi || null;
  const type = params.type || null;
  
  // 计算天数差
  let day = 0;
  if (date) {
    const currentDate = new Date();
    const targetDate = new Date(date);
    const timeDiff = Math.abs(currentDate.getTime() - targetDate.getTime());
    day = Math.floor(timeDiff / (1000 * 3600 * 24));
  }
  
  // 初始化返回信息
  const info = {
    startdate: '',
    enddate: '',
    title: '',
    copyright: '',
    cover: []
  };
  
  // 验证区域参数
  const mkt = regions.includes(region) ? region : 'en-US';
  
  // 构建请求 URL
  const url = `${BING}/HPImageArchive.aspx?idx=${day}&n=1&mkt=${mkt}&format=js`;
  
  try {
    // 发起请求
    const response = await fetch(url);
    const data = await response.json();
    const image = data.images[0];
    
    // 填充信息
    info.startdate = dateFormat(image.startdate);
    info.enddate = dateFormat(image.enddate);
    info.title = image.title;
    info.copyright = image.copyright;
    info.redirect = `${BING}${image.urlbase}_1920x1080.jpg`;
    info.cover = [];
    
    // 处理不同分辨率
    for (const [key, value] of Object.entries(dpis)) {
      const cover = `${BING}${image.urlbase}_${value}.jpg`;
      if (dpi === key) {
        info.redirect = cover;
      }
      info.cover.push(cover);
    }
    
    // 如果没有 type 参数，删除 redirect 字段
    if (!type) {
      delete info.redirect;
    }
    
    return info;
  } catch (error) {
    console.error('Error fetching Bing image:', error);
    return { error: error.message };
  }
}

// 主函数处理请求
export async function onRequest(context) {
  const { request } = context;
  
  // 解析 URL 参数
  const url = new URL(request.url);
  const params = {
    region: url.searchParams.get('region'),
    date: url.searchParams.get('date'),
    dpi: url.searchParams.get('dpi'),
    type: url.searchParams.get('type')
  };
  
  try {
    // 获取 Bing 壁纸数据
    const result = await getBingWallpaper(params);
    
    // 判断是否为历史图片（根据是否传入 date 参数）
    const isHistorical = !!params.date;
    
    // 设置动态缓存策略
    // 今日图片：缓存 1 小时（3600 秒），历史图片：缓存 30 天（2592000 秒）
    const cacheAge = isHistorical ? 2592000 : 3600;
    const cacheControl = `public, max-age=600, s-maxage=${cacheAge}, stale-while-revalidate`;
    
    // 如果 type=image，直接返回图片
    if (params.type === 'image') {
      if (result.redirect) {
        const imageResponse = await fetch(result.redirect);
        const headers = new Headers(imageResponse.headers);
        
        // 设置缓存和 CORS 头部
        headers.set('Cache-Control', cacheControl);
        headers.set('access-control-allow-origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type');
        
        return new Response(imageResponse.body, {
          status: imageResponse.status,
          headers: headers
        });
      } else {
        return new Response(JSON.stringify({ error: 'Image URL not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'access-control-allow-origin': '*',
            'Cache-Control': 'no-store, max-age=0' // 错误响应不缓存
          }
        });
      }
    } else {
      // 返回 JSON 格式结果
      return new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'access-control-allow-origin': '*',
          'Cache-Control': cacheControl
        }
      });
    }
  } catch (error) {
    // 错误响应不缓存
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'access-control-allow-origin': '*',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }
}

export const config = {
  runtime: "experimental-edge",
};