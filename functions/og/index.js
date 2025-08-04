// Main function to handle requests and proxy to og.eallion.com
export async function onRequest(context) {
  // Get the request object
  const { request } = context;
  
  try {
    // Parse the URL and query parameters
    const url = new URL(request.url);
    const params = url.searchParams;
    
    // Get the title parameter
    const title = params.get('title');
    
    // If title is not provided, return a 400 error
    if (!title) {
      return new Response('Missing title parameter', { status: 400 });
    }
    
    // Build the target URL with the title parameter
    const targetUrl = new URL('https://og.eallion.com/api/og');
    targetUrl.searchParams.set('title', title);
    
    try {
      // Fetch data from the target API
      const response = await fetch(targetUrl.toString());
      
      // Clone the response
      const originalResponseClone = response.clone();
      
      // Get response headers and create new headers
      const responseHeaders = response.headers;
      const newResponseHeaders = new Headers(responseHeaders);
      
      // Set CORS headers
      newResponseHeaders.set('access-control-allow-origin', '*');
      newResponseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      newResponseHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
      
      // Set cache control headers
      newResponseHeaders.set('Cache-Control', 'max-age=600, s-maxage=2592000, stale-while-revalidate');
      
      // Create a new response with the same body and headers
      const newResponse = new Response(originalResponseClone.body, {
        status: response.status,
        headers: newResponseHeaders
      });
      
      return newResponse;
    } catch (fetchError) {
      console.error('Error fetching from target URL:', fetchError);
      return new Response('Error fetching from target URL', { status: 502 });
    }
  } catch (error) {
    // Handle any errors
    console.error('Error in og function:', error);
    return new Response(`Error fetching data: ${error.message}`, { status: 500 });
  }
}

export const config = {
  runtime: "experimental-edge",
};