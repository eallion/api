// Main function to handle requests and proxy to e5n.cc
export async function onRequest(context) {
  // Get the request object
  const { request } = context;
  
  try {
    // Parse the URL and query parameters
    const url = new URL(request.url);
    const params = url.searchParams;
    
    // Build the target URL with the query parameters
    const targetUrl = new URL('https://e5n.cc/api/v1/accounts/111136231674527355/statuses');
    
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