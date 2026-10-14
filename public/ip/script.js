// IP 查询工具 - EdgeOne Pages
document.addEventListener('DOMContentLoaded', () => {
  // 设置当前年份
  const yearElement = document.getElementById('year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
  
  initTheme();
  loadIPInfo();
});

// 主题管理
function initTheme() {
  const urlParams = new URLSearchParams(window.location.search);
  const themeParam = urlParams.get('theme');
  const savedTheme = themeParam || localStorage.getItem('theme') || 'system';
  setTheme(savedTheme);
  
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      setTheme(theme);
      localStorage.setItem('theme', theme);
    });
  });
}

function setTheme(theme) {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

// 加载 IP 信息
async function loadIPInfo() {
  try {
    const response = await fetch('/geo?type=json');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      renderLayout(data.data);
      await loadExternalIPs();
    } else {
      showError('获取 IP 信息失败');
    }
  } catch (error) {
    console.error('Error:', error);
    showError(`无法连接到服务器：${error.message}`);
  }
}

// 渲染布局
function renderLayout(data) {
  const content = document.getElementById('content');
  
  const protocol = data.protocol || (data.ip && data.ip.includes(':') ? 'IPv6' : 'IPv4');
  const geo = data.geo || data;

  const html = `
    <!-- 第一行：访问者 IP（全宽主卡片）-->
    <div class="full-width-card">
      <div class="card">
        <div class="card-title">您通过 ${protocol} 访问本站</div>
        <div class="visitor-ip">
          <span class="ip-value-large">${data.ip}</span>
          <button class="copy-btn" onclick="copyIP('${data.ip}')">复制</button>
        </div>
        <div id="requested-ip-badge" class="requested-ip-badge" style="display:none; margin-top: 12px; font-size: 0.95rem; color: var(--text-secondary);"></div>
      </div>
    </div>

    <!-- 第二行：左右分栏 -->
    <div class="two-column-layout">
      <!-- 左侧：国内 IP 与 EdgeOne GEO 信息 -->
      <div class="left-panel">
        <div class="card">
          <div class="card-title">国内 IP</div>
          <div class="card-content">
            <div class="ip-row">
              <span class="ip-label">IPv4</span>
              <span class="ip-value" id="domestic-ipv4">
                <span class="ip-loading">查询中...</span>
              </span>
            </div>
            <div class="ip-row">
              <span class="ip-label">IPv6</span>
              <span class="ip-value" id="domestic-ipv6">
                <span class="ip-loading">查询中...</span>
              </span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">EdgeOne GEO Info</div>
          <div class="geo-grid">
            ${renderGeoItem('国家', geo.countryName)}
            ${renderGeoItem('地区', geo.regionName)}
            ${renderGeoItem('城市', geo.cityName)}
            ${renderGeoItem('ASN', geo.asn)}
            ${geo.latitude && geo.latitude !== 'Unknown' ? renderGeoItem('经纬度', `${parseFloat(geo.latitude).toFixed(2)}, ${parseFloat(geo.longitude).toFixed(2)}`) : ''}
          </div>
        </div>
      </div>

      <!-- 右侧：国际 IP 与 IP.SB GEO 信息 -->
      <div class="right-panel">
        <div class="card">
          <div class="card-title">国际 IP</div>
          <div class="card-content">
            <div class="ip-row">
              <span class="ip-label">IPv4</span>
              <span class="ip-value" id="overseas-ipv4">
                <span class="ip-loading">查询中...</span>
              </span>
            </div>
            <div class="ip-row">
              <span class="ip-label">IPv6</span>
              <span class="ip-value" id="overseas-ipv6">
                <span class="ip-loading">查询中...</span>
              </span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">IP.SB GEO Info</div>
          <div class="geo-grid" id="ipsb-geo">
            <div class="ip-loading">查询中...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 第三行：其他服务商 IP 查询（全宽）-->
    <div class="full-width-card">
      <div class="card">
        <div class="card-title">其他服务商 IP 查询</div>
        <div class="services-grid">
          <!-- Cloudflare -->
          <div class="service-item">
            <div class="service-name">Cloudflare</div>
            <div class="service-ips">
              <div class="ip-row-inline">
                <span class="protocol-tag">IPv4</span>
                <span class="ip-address" id="cf-ipv4">
                  <span class="ip-loading">...</span>
                </span>
              </div>
              <div class="ip-row-inline">
                <span class="protocol-tag">IPv6</span>
                <span class="ip-address" id="cf-ipv6">
                  <span class="ip-loading">...</span>
                </span>
              </div>
            </div>
          </div>

          <!-- IPInfo.io -->
          <div class="service-item">
            <div class="service-name">IPInfo.io</div>
            <div class="service-ips">
              <div class="ip-row-inline">
                <span class="protocol-tag">IPv4</span>
                <span class="ip-address" id="ipinfo-ipv4">
                  <span class="ip-loading">...</span>
                </span>
              </div>
              <div class="ip-row-inline">
                <span class="protocol-tag">IPv6</span>
                <span class="ip-address" id="ipinfo-ipv6">
                  <span class="ip-loading">...</span>
                </span>
              </div>
            </div>
          </div>

          <!-- ipify -->
          <div class="service-item">
            <div class="service-name">ipify</div>
            <div class="service-ips">
              <div class="ip-row-inline">
                <span class="protocol-tag">IPv4</span>
                <span class="ip-address" id="ipify-ipv4">
                  <span class="ip-loading">...</span>
                </span>
              </div>
              <div class="ip-row-inline">
                <span class="protocol-tag">IPv6</span>
                <span class="ip-address" id="ipify-ipv6">
                  <span class="ip-loading">...</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  content.innerHTML = html;
}

function renderGeoItem(label, value) {
  if (!value || value === 'Unknown') {
    return '';
  }
  return `
    <div class="geo-item">
      <div class="geo-label">${label}</div>
      <div class="geo-value">${value}</div>
    </div>
  `;
}

// 加载外部服务的 IP
async function loadExternalIPs() {
  const timeout = 5000;
  
  const fetchWithTimeout = async (url, options = {}, isIPv6 = false) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        ...options
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      return text.trim();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`Error fetching ${url}:`, error);
      
      if (error.name === 'AbortError') {
        return 'Timeout';
      }
      
      if (error.message === 'Failed to fetch') {
        if (isIPv6) {
          return 'NoIPv6';
        }
        return 'Blocked';
      }
      
      return 'Error';
    }
  };
  
  // 1. 国内双栈检测
  const fetchDomesticIP = async (version) => {
    try {
      const isIPv6 = version === 'ipv6';
      const url = isIPv6 
        ? 'https://v6.yinghualuo.cn/bejson' 
        : 'https://v4.yinghualuo.cn/bejson';
      
      const result = await fetchWithTimeout(url, {}, isIPv6);
      if (result === 'Error' || result === 'Timeout' || result === 'Blocked' || result === 'NoIPv6') {
        return result;
      }
      
      try {
        const data = JSON.parse(result);
        return data.ip || result || 'Error';
      } catch {
        return result || 'Error';
      }
    } catch {
      return 'Error';
    }
  };
  
  // 2. 国际双栈检测及 IP.SB GEO 信息
  const fetchIPSB = async (version) => {
    try {
      const isIPv6 = version === 'ipv6';
      const url = isIPv6 
        ? 'https://api-ipv6.ip.sb/geoip' 
        : 'https://api-ipv4.ip.sb/geoip';
      
      const result = await fetchWithTimeout(url, {}, isIPv6);
      if (result === 'Error' || result === 'Timeout' || result === 'Blocked' || result === 'NoIPv6') {
        return { ip: result, geo: null };
      }
      
      try {
        const data = JSON.parse(result);
        return {
          ip: data.ip || 'Error',
          geo: data
        };
      } catch {
        return {
          ip: result || 'Error',
          geo: null
        };
      }
    } catch {
      return { ip: 'Error', geo: null };
    }
  };
  
  // 3. Cloudflare - 获取 IP 和 Geo
  const fetchCloudflare = async (version) => {
    try {
      let traceUrl;
      const isIPv6 = version === 'ipv6';
      if (version === 'ipv4') {
        traceUrl = 'https://1.1.1.1/cdn-cgi/trace';
      } else {
        traceUrl = 'https://[2606:4700:4700::1111]/cdn-cgi/trace';
      }
      
      const trace = await fetchWithTimeout(traceUrl, {}, isIPv6);
      if (trace === 'Error' || trace === 'Timeout' || trace === 'Blocked' || trace === 'NoIPv6') {
        return { ip: trace, geo: null };
      }
      
      const lines = trace.split('\n');
      const data = {};
      lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          data[key.trim()] = value.trim();
        }
      });
      
      return {
        ip: data.ip || 'Error',
        geo: data
      };
    } catch {
      return { ip: 'Error', geo: null };
    }
  };
  
  // 4. IPInfo.io
  const fetchIPInfo = async (version) => {
    try {
      const isIPv6 = version === 'ipv6';
      if (version === 'ipv4') {
        return await fetchWithTimeout('https://ipinfo.io/ip');
      } else {
        return await fetchWithTimeout('https://6.ipinfo.io/ip', {}, true);
      }
    } catch {
      return 'Error';
    }
  };
  
  // 5. ipify
  const fetchIpify = async (version) => {
    try {
      let result;
      const isIPv6 = version === 'ipv6';
      if (version === 'ipv4') {
        result = await fetchWithTimeout('https://api.ipify.org/?format=json');
      } else {
        result = await fetchWithTimeout('https://api64.ipify.org/?format=json', {}, true);
      }
      
      if (result === 'Error' || result === 'Timeout' || result === 'Blocked' || result === 'NoIPv6') {
        return result;
      }
      
      const data = JSON.parse(result);
      const ip = data.ip || 'Error';
      
      if (isIPv6 && ip !== 'Error' && !ip.includes(':')) {
        return 'NoIPv6';
      }
      
      return ip;
    } catch {
      return 'Error';
    }
  };
  
  // 并行并发查询所有服务
  const results = await Promise.allSettled([
    fetchDomesticIP('ipv4'),
    fetchDomesticIP('ipv6'),
    fetchIPSB('ipv4'),
    fetchIPSB('ipv6'),
    fetchCloudflare('ipv4'),
    fetchCloudflare('ipv6'),
    fetchIPInfo('ipv4'),
    fetchIPInfo('ipv6'),
    fetchIpify('ipv4'),
    fetchIpify('ipv6')
  ]);
  
  const getValue = (result) => result.status === 'fulfilled' ? result.value : 'Error';
  
  const domesticIPv4 = getValue(results[0]);
  const domesticIPv6 = getValue(results[1]);
  const ipsbIPv4Data = getValue(results[2]);
  const ipsbIPv6Data = getValue(results[3]);
  const cfIPv4Data = getValue(results[4]);
  const cfIPv6Data = getValue(results[5]);
  const ipinfoIPv4 = getValue(results[6]);
  const ipinfoIPv6 = getValue(results[7]);
  const ipifyIPv4 = getValue(results[8]);
  const ipifyIPv6 = getValue(results[9]);
  
  // 更新各卡片显示
  updateIP('domestic-ipv4', domesticIPv4);
  updateIP('domestic-ipv6', domesticIPv6);
  updateIP('overseas-ipv4', ipsbIPv4Data.ip);
  updateIP('overseas-ipv6', ipsbIPv6Data.ip);
  updateIP('cf-ipv4', cfIPv4Data.ip);
  updateIP('cf-ipv6', cfIPv6Data.ip);
  updateIP('ipinfo-ipv4', ipinfoIPv4);
  updateIP('ipinfo-ipv6', ipinfoIPv6);
  updateIP('ipify-ipv4', ipifyIPv4);
  updateIP('ipify-ipv6', ipifyIPv6);

  // 若通过 ?v=4 或 ?v=6 访问且当前连接协议不一致，在主卡片直接展示本机探针解析出的目标 IP
  const urlParams = new URLSearchParams(window.location.search);
  const vParam = urlParams.get('v') || urlParams.get('version');
  const badgeElement = document.getElementById('requested-ip-badge');
  if (badgeElement) {
    if (vParam === '4' && domesticIPv4 && domesticIPv4 !== 'Error' && domesticIPv4 !== 'Blocked') {
      badgeElement.innerHTML = `已通过国内单栈探针解析到本机真实 IPv4：<strong>${domesticIPv4}</strong> <button class="copy-icon-btn" onclick="copyIP('${domesticIPv4}')" title="复制">复制</button>`;
      badgeElement.style.display = 'block';
    } else if (vParam === '6' && domesticIPv6 && domesticIPv6 !== 'Error' && domesticIPv6 !== 'NoIPv6' && domesticIPv6 !== 'Blocked') {
      badgeElement.innerHTML = `已通过国内单栈探针解析到本机真实 IPv6：<strong>${domesticIPv6}</strong> <button class="copy-icon-btn" onclick="copyIP('${domesticIPv6}')" title="复制">复制</button>`;
      badgeElement.style.display = 'block';
    }
  }

  // 更新右侧 IP.SB GEO 信息（优先使用 IPv4，其次使用 IPv6）
  const validIPSBGeo = ipsbIPv4Data.geo || ipsbIPv6Data.geo;
  if (validIPSBGeo) {
    updateIPSBGeo(validIPSBGeo);
  } else {
    const geoElement = document.getElementById('ipsb-geo');
    if (geoElement) {
      geoElement.innerHTML = '<div class="ip-na">查询失败</div>';
    }
  }
  
  // 检测是否有请求被拦截
  const allIPs = [
    domesticIPv4, domesticIPv6,
    ipsbIPv4Data.ip, ipsbIPv6Data.ip,
    cfIPv4Data.ip, cfIPv6Data.ip,
    ipinfoIPv4, ipinfoIPv6,
    ipifyIPv4, ipifyIPv6
  ];
  if (allIPs.includes('Blocked')) {
    showBlockedBanner();
  }
}

// 更新 IP.SB Geo 信息
function updateIPSBGeo(geoData) {
  const geoElement = document.getElementById('ipsb-geo');
  if (!geoElement || !geoData) return;
  
  const html = `
    ${renderGeoItem('国家', geoData.country)}
    ${renderGeoItem('地区', geoData.region)}
    ${renderGeoItem('城市', geoData.city)}
    ${renderGeoItem('ISP', geoData.isp)}
    ${renderGeoItem('ASN', geoData.asn)}
    ${geoData.organization ? renderGeoItem('组织', geoData.organization) : ''}
  `;
  
  geoElement.innerHTML = html || '<div class="ip-na">无数据</div>';
}

// 更新 IP 显示
function updateIP(elementId, ip) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  if (ip === 'Blocked') {
    element.innerHTML = '<span class="ip-blocked">请求被拦截</span>';
  } else if (ip === 'NoIPv6') {
    element.innerHTML = '<span class="ip-na">不支持 IPv6</span>';
  } else if (ip === 'Error' || ip === 'N/A') {
    element.innerHTML = '<span class="ip-na">查询失败</span>';
  } else if (ip === 'Timeout') {
    element.innerHTML = '<span class="ip-error">超时</span>';
  } else {
    element.innerHTML = `
      <span class="ip-text">${ip}</span>
      <button class="copy-icon-btn" onclick="copyIP('${ip}')" title="复制">复制</button>
    `;
  }
}

// 复制 IP
function copyIP(ip) {
  copyToClipboard(ip);
}

// 通用复制到剪贴板函数
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showCopyToast('已复制到剪贴板');
    }).catch(err => {
      console.error('复制失败：', err);
      showCopyToast('复制失败', true);
    });
  } else {
    fallbackCopy(text);
  }
}

// 显示复制提示
function showCopyToast(message, isError = false) {
  const existing = document.querySelector('.copy-toast');
  if (existing) {
    existing.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = 'copy-toast' + (isError ? ' error' : '');
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 降级复制方案
function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    showCopyToast('已复制到剪贴板');
  } catch (err) {
    console.error('复制失败：', err);
    showCopyToast('复制失败', true);
  }
  
  document.body.removeChild(textarea);
}

// 显示被拦截的提示横幅
function showBlockedBanner() {
  if (document.querySelector('.blocked-banner')) return;
  
  const banner = document.createElement('div');
  banner.className = 'blocked-banner';
  banner.innerHTML = `
    <div class="blocked-banner-content">
      <span class="blocked-banner-icon">[!]</span>
      <div class="blocked-banner-text">
        <strong>检测到请求被拦截</strong>
        <p>部分 IP 查询服务被广告拦截器或浏览器扩展阻止，请关闭拦截器或将本站加入白名单。</p>
      </div>
      <button class="blocked-banner-close" onclick="this.parentElement.parentElement.remove()" title="关闭">✕</button>
    </div>
  `;
  document.body.appendChild(banner);
}

// 错误显示
function showError(message) {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="loading">
      <div class="error-icon">[!]</div>
      <p>${message}</p>
      <button class="copy-btn" onclick="location.reload()" style="margin-top: 20px;">重新加载</button>
    </div>
  `;
}
