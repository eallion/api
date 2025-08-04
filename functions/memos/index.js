export async function onRequest(context) {
  const { request } = context;
  
  try {
    // Parse the URL and query parameters
    const url = new URL(request.url);
    const path = url.pathname;
    const params = url.searchParams;
    
    // Build the target URL
    const targetUrl = new URL('https://memos.eallion.com');
    
    // Set the correct path for the API endpoint
    targetUrl.pathname = path.startsWith('/memos') 
      ? path.replace(/^\/memos/, '/api/v1/memos')
      : path;
    
    // Add user-provided query parameters to the target URL
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
      newResponseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      newResponseHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
      
      // Disable caching for real-time requests
      newResponseHeaders.set('Cache-Control', 'no-store');
      
      // Remove cookie headers for security
      newResponseHeaders.delete('Set-Cookie');
      newResponseHeaders.delete('Cookie');
      
      // Create a new response with the same body and headers
      const newResponse = new Response(originalResponseClone.body, {
        status: response.status,
        headers: newResponseHeaders
      });
      
      return newResponse;
    } catch (fetchError) {
      console.error('Error fetching from target URL:', fetchError);
      return new Response('Failed to fetch data from target API', { status: 500 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}