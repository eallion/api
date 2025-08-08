// Main function to handle requests and proxy to t3.gstatic.cn/faviconV2
export async function onRequest(context) {
  // Get the request object
  const { request } = context;
  
  try {
    // Parse the URL and path
    const url = new URL(request.url);
    const path = url.pathname;
    const params = url.searchParams;
    
    // Build the target URL with the base domain
    const targetUrl = new URL('https://t3.gstatic.cn/faviconV2');
    
    // Copy all query parameters to the target URL
    params.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });
    
    try {
      // Fetch data from the target API
      const response = await fetch(targetUrl.toString());
      
      // Clone the response
      const originalResponseClone = response.clone();
      
      // Get response headers and create new headers
      const responseHeaders = response.headers;
      const newResponseHeaders = new Headers(responseHeaders);
      
      // Set CORS headers
      newResponseHeaders.set('Access-Control-Allow-Origin', '*');
      newResponseHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
      newResponseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      newResponseHeaders.set('Access-Control-Max-Age', '604800');

      // Disable caching for real-time requests
      newResponseHeaders.set('Cache-Control', 'max-age=604800, s-maxage=604800, stale-while-revalidate');

      // Remove cookie headers for security
      newResponseHeaders.delete('Set-Cookie');
      newResponseHeaders.delete('Cookie');
      
      // Ensure the response is treated as an image
      newResponseHeaders.set('Content-Type', 'image/png');
      
      // Create a new response with the same body and headers
      const newResponse = new Response(originalResponseClone.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newResponseHeaders,
      });
      
      return newResponse;
    } catch (error) {
      // Handle fetch errors
      return new Response(`Error fetching favicon: ${error.message}`, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
          'Access-Control-Max-Age': '0'
        },
      });
    }
  } catch (error) {
    // Handle URL parsing errors
    return new Response(`Invalid request: ${error.message}`, {
      status: 400,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
        'Access-Control-Max-Age': '0'
      },
    });
  }
}