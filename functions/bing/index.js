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
  'uhd': 'UHD',
  '2k': '1920x1080',
  '2.5k': '1920x1200',
  '2.8k': '1920x1200',
  '4k': 'UHD',
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
  if (!date || date.length < 8) return date || '';
  let formattedDate = date.substring(0, 4) + '-' + date.substring(4);
  formattedDate = formattedDate.substring(0, 7) + '-' + formattedDate.substring(7);
  return formattedDate;
}

// 获取 Bing 壁纸数据
async function getBingWallpaper(params) {
  const region = params.region || 'en-US';
  const date = params.date || null;
  const dpi = params.dpi || null;
  
  // 计算天数差
  let day = 0;
  if (date) {
    const currentDate = new Date();
    const targetDate = new Date(date);
    const timeDiff = Math.abs(currentDate.getTime() - targetDate.getTime());
    day = Math.floor(timeDiff / (1000 * 3600 * 24));
  }
  
  // 验证区域参数
  const mkt = regions.includes(region) ? region : 'en-US';
  
  // 构建请求 URL
  const url = `${BING}/HPImageArchive.aspx?idx=${day}&n=1&mkt=${mkt}&format=js`;
  
  try {
    // 发起请求
    const response = await fetch(url);
    const data = await response.json();
    const image = data.images && data.images[0];
    
    if (!image) {
      return { error: 'No image found from upstream API' };
    }

    // 格式化相关链接（若为相对路径则补全必应主域名）
    let copyrightlink = image.copyrightlink || '';
    if (copyrightlink && copyrightlink.startsWith('/')) {
      copyrightlink = `${BING}${copyrightlink}`;
    }

    let quiz = image.quiz || '';
    if (quiz && quiz.startsWith('/')) {
      quiz = `${BING}${quiz}`;
    }

    // 处理指定分辨率 direct 图片链接
    let redirect = `${BING}${image.urlbase}_1920x1080.jpg`;
    if (dpi && dpis[dpi]) {
      redirect = `${BING}${image.urlbase}_${dpis[dpi]}.jpg`;
    }

    // 生成所有可用分辨率的封面数组（去重）
    const coverSet = new Set();
    for (const value of Object.values(dpis)) {
      coverSet.add(`${BING}${image.urlbase}_${value}.jpg`);
    }

    // 组装完整的必应壁纸数据
    const info = {
      title: image.title || '',
      headline: image.headline || '',
      copyright: image.copyright || '',
      copyrightlink: copyrightlink,
      startdate: dateFormat(image.startdate),
      fullstartdate: image.fullstartdate || '',
      enddate: dateFormat(image.enddate),
      url: `${BING}${image.url}`,
      urlbase: `${BING}${image.urlbase}`,
      redirect: redirect,
      quiz: quiz,
      wp: typeof image.wp === 'boolean' ? image.wp : true,
      hsh: image.hsh || '',
      cover: Array.from(coverSet)
    };

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

    if (result.error && !result.redirect) {
      return new Response(JSON.stringify({ error: result.error }, null, 2), {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, max-age=0',
          'Access-Control-Max-Age': '0'
        }
      });
    }
    
    // 判断是否为历史图片（根据是否传入 date 参数）
    const isHistorical = !!params.date;
    
    // 设置动态缓存策略
    // 今日图片：缓存 1 小时（3600 秒），历史图片：缓存 30 天（2592000 秒）
    const cacheAge = isHistorical ? 2592000 : 3600;
    const cacheControl = `public, max-age=3600, s-maxage=${cacheAge}, stale-while-revalidate`;
    
    // 如果 type=image，直接返回图片
    if (params.type === 'image') {
      if (result.redirect) {
        const imageResponse = await fetch(result.redirect);
        const headers = new Headers(imageResponse.headers);
        
        // 设置缓存和 CORS 头部
        headers.set('Cache-Control', cacheControl);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type');
        headers.set('Content-Type', 'image/jpeg');
        headers.set('Access-Control-Max-Age', '3600');
        headers.delete('Set-Cookie');
        headers.delete('Cookie');
        
        return new Response(imageResponse.body, {
          status: imageResponse.status,
          headers: headers
        });
      } else {
        return new Response(JSON.stringify({ error: 'Image URL not found' }, null, 2), {
          status: 404,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, max-age=0',
            'Access-Control-Max-Age': '0'
          }
        });
      }
    } else {
      // 返回完整 JSON 格式结果（美化输出）
      return new Response(JSON.stringify(result, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Cache-Control': cacheControl,
          'Access-Control-Max-Age': '3600'
        }
      });
    }
  } catch (error) {
    // 错误响应不缓存
    return new Response(JSON.stringify({ error: error.message }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Max-Age': '0'
      }
    });
  }
}

export const config = {
  runtime: "experimental-edge",
};