// Translate function using Caiyun API
export async function onRequest(context) {
  const { request, env } = context;
  
  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { 'Allow': 'GET' }
    });
  }

  try {
    // Parse the URL and query parameters
    const url = new URL(request.url);
    let slug = url.searchParams.get('slug');
    
    // Check if slug parameter is provided
    if (!slug) {
      return new Response(JSON.stringify({
        error: 'Missing required parameter: slug',
        message: 'Please provide a slug parameter to translate'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    }
    
    // Pre-process the slug: remove Chinese and English symbols before translation
    slug = slug
      .replace(/[\u3000-\u303F]+/g, ' ')             // Replace Chinese symbols with space
      .replace(/[\uFF00-\uFFEF]+/g, ' ')             // Replace Fullwidth ASCII variants with space
      .replace(/[^a-zA-Z0-9\u4e00-\u9fff\s]+/g, ' ') // Replace English symbols with space
      .replace(/\s+/g, ' ')                            // Replace multiple spaces with single space
      .trim();                                          // Remove leading/trailing whitespace

    // Get Caiyun API token from environment variables
    const CAIYUN_TOKEN = env.CAIYUN_TOKEN;
    
    if (!CAIYUN_TOKEN) {
      return new Response(JSON.stringify({
        error: 'Missing CAIYUN_TOKEN',
        message: 'CAIYUN_TOKEN is not configured in environment variables'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    }

    // Prepare the request to Caiyun API
    const caiyunApiUrl = 'http://api.interpreter.caiyunai.com/v1/translator';
    
    const requestBody = {
      source: [slug],
      trans_type: 'auto2en',
      request_id: 'api_eallion_com_translate',
      detect: true,
    };

    // Make request to Caiyun API
    const caiyunResponse = await fetch(caiyunApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `token ${CAIYUN_TOKEN}`,
      },
      body: JSON.stringify(requestBody),
    });

    // Check if Caiyun API request was successful
    if (!caiyunResponse.ok) {
      const errorText = await caiyunResponse.text();
      return new Response(JSON.stringify({
        error: 'Caiyun API Error',
        message: `Failed to translate: ${caiyunResponse.status} ${caiyunResponse.statusText}`,
        details: errorText
      }), {
        status: caiyunResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    }

    // Parse the response from Caiyun API
    const caiyunData = await caiyunResponse.json();
    
    // Extract the translation result
    const translatedText = caiyunData.target && caiyunData.target[0] ? caiyunData.target[0] : '';
    
    // Process the translated text: convert to lowercase and replace spaces/symbols with hyphens
    const processedText = translatedText
      .toLowerCase()                           // Convert to lowercase
      .replace(/[^a-z0-9]+/g, '-')             // Replace non-alphanumeric characters with hyphens
      .replace(/^-+|-+$/g, '');                // Remove leading and trailing hyphens
    
    // Return the translation result
    return new Response(JSON.stringify({
      status: 'success',
      results: [
        {
          slug: slug,
          translated: processedText
        }
      ],
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
    
  } catch (error) {
    console.error('Translation error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  }
}