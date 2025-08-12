// HubSpot Serverless Function to proxy Glean API requests
const https = require('https');

// Configuration with environment variable fallbacks
const CONFIG = {
  GLEAN_INSTANCE: process.env.GLEAN_INSTANCE || 'trace3',
  GLEAN_BASE_URL: process.env.GLEAN_BASE_URL || `${process.env.GLEAN_INSTANCE || 'trace3'}-be.glean.com`,
  GLEAN_API_TOKEN: process.env.GLEAN_API_TOKEN || 'lGOIFZqCsxd6fEfW8Px+zQfcw08irSV8XDL1tIJLj/0=',
  TIMEOUT_MS: parseInt(process.env.GLEAN_TIMEOUT_MS) || 8000, // 8s for HubSpot limits
  MAX_RETRIES: parseInt(process.env.GLEAN_MAX_RETRIES) || 1,
  TEST_MODE: process.env.TEST_MODE === 'true' || false
};

// High-signal diagnostic logging
const log = {
  start: (message, data = {}) => {
    console.log(`[GLEAN_PROXY] START: ${message}`, JSON.stringify(data, null, 2));
  },
  http: (message, data = {}) => {
    console.log(`[GLEAN_PROXY] HTTP: ${message}`, JSON.stringify(data, null, 2));
  },
  success: (message, data = {}) => {
    console.log(`[GLEAN_PROXY] SUCCESS: ${message}`, JSON.stringify(data, null, 2));
  },
  error: (message, error = null) => {
    console.error(`[GLEAN_PROXY] ERROR: ${message}`, error ? error.stack || error.message : '');
  },
  return: (message, data = {}) => {
    console.log(`[GLEAN_PROXY] RETURN: ${message}`, JSON.stringify(data, null, 2));
  }
};

// Generic HTTP request function
async function makeGleanRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      log.http('http_response_status', { 
        statusCode: res.statusCode, 
        headers: res.headers,
        path: options.path
      });
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        log.http('http_response_complete', { 
          statusCode: res.statusCode,
          responseSize: responseData.length,
          path: options.path
        });
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (error) {
            log.error('parse_error', error);
            reject(new Error(`Invalid JSON response: ${error.message}`));
          }
        } else {
          log.error('upstream_error', {
            statusCode: res.statusCode,
            responseData: responseData.substring(0, 200),
            path: options.path
          });
          reject(new Error(`HTTP ${res.statusCode}: ${responseData.substring(0, 200)}`));
        }
      });
    });
    
    req.on('error', (error) => {
      log.error('http_request_error', error);
      reject(error);
    });
    
    req.on('timeout', () => {
      log.error('http_request_timeout', { timeout: options.timeout });
      req.destroy();
      reject(new Error(`Request timeout after ${options.timeout}ms`));
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Search Glean knowledge base for company information
async function searchGleanKnowledge(companyName) {
  log.start('search_glean_knowledge', { companyName });
  
  const postData = JSON.stringify({
    query: `strategic account plan ${companyName} company information business analysis`,
    pageSize: 10,
    requestOptions: {
      timeoutMillis: CONFIG.TIMEOUT_MS
    }
  });

  const options = {
    hostname: CONFIG.GLEAN_BASE_URL,
    port: 443,
    path: '/rest/api/v1/search', // Use the correct search endpoint
    method: 'POST',
    timeout: CONFIG.TIMEOUT_MS,
    headers: {
      'Authorization': `Bearer ${CONFIG.GLEAN_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  log.http('http_request_outbound', { 
    url: `https://${CONFIG.GLEAN_BASE_URL}/rest/api/v1/search`,
    method: 'POST',
    timeoutMs: CONFIG.TIMEOUT_MS
  });

  return makeGleanRequest(options, postData);
}

// Generate strategic account plan from search results
function generateStrategicPlan(companyName, searchResults) {
  log.start('generate_strategic_plan', { companyName, resultCount: searchResults?.results?.length || 0 });
  
  if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
    return {
      messages: [{
        role: 'GLEAN_AI',
        content: [{
          text: `No specific information found for ${companyName} in our knowledge base. This could mean:\n\n1. The company may not be in our current knowledge base\n2. We may need to gather more information about this company\n3. The company might be using a different name or spelling\n\nTo generate a strategic account plan, we would typically need:\n- Company overview and industry\n- Current relationship status\n- Key stakeholders and decision makers\n- Business challenges and opportunities\n- Competitive landscape\n- Revenue potential and growth opportunities`
        }]
      }],
      metadata: {
        companyName,
        timestamp: new Date().toISOString(),
        searchResults: 0,
        generated: true
      }
    };
  }

  // Extract relevant information from search results
  const relevantDocs = searchResults.results.slice(0, 5); // Top 5 results
  const docSummaries = relevantDocs.map((doc, index) => {
    return `${index + 1}. ${doc.title || 'Untitled Document'}\n   ${doc.snippet || 'No snippet available'}`;
  }).join('\n\n');

  const strategicPlan = `Based on our knowledge base search for ${companyName}, here's a strategic account plan:

## Company Overview
${relevantDocs.length > 0 ? 'Information found in our knowledge base suggests this company is active in our ecosystem.' : 'Limited information available in our knowledge base.'}

## Key Insights from Knowledge Base
${docSummaries}

## Strategic Recommendations
1. **Engagement Strategy**: ${relevantDocs.length > 0 ? 'Leverage existing relationships and knowledge' : 'Establish initial contact and gather more information'}
2. **Opportunity Areas**: ${relevantDocs.length > 0 ? 'Build on existing interactions' : 'Identify potential partnership opportunities'}
3. **Risk Assessment**: ${relevantDocs.length > 0 ? 'Monitor existing relationship health' : 'Conduct thorough due diligence'}

## Next Steps
- Schedule discovery call to understand current needs
- Review any existing contracts or agreements
- Identify key stakeholders and decision makers
- Develop tailored value proposition

## Knowledge Base Coverage
Found ${relevantDocs.length} relevant documents in our knowledge base. ${relevantDocs.length > 0 ? 'This indicates some existing relationship or interaction history.' : 'This suggests we may need to gather more information about this company.'}`;

  return {
    messages: [{
      role: 'GLEAN_AI',
      content: [{
        text: strategicPlan
      }]
    }],
    metadata: {
      companyName,
      timestamp: new Date().toISOString(),
      searchResults: relevantDocs.length,
      generated: true,
      requestId: searchResults.requestID
    }
  };
}

// Main exports.main function
exports.main = async (context = {}) => {
  const functionStartTime = Date.now();

  log.start('function_entry', {
    contextKeys: Object.keys(context),
    hasParameters: !!context.parameters,
    config: {
      instance: CONFIG.GLEAN_INSTANCE,
      baseUrl: CONFIG.GLEAN_BASE_URL,
      timeoutMs: CONFIG.TIMEOUT_MS,
      maxRetries: CONFIG.MAX_RETRIES,
      testMode: CONFIG.TEST_MODE
    }
  });

  try {
    const { companyName } = context.parameters || {};

    if (!CONFIG.GLEAN_API_TOKEN) {
      log.error('missing_api_token');
      return {
        statusCode: 500,
        body: {
          error: 'Glean API token not configured',
          timestamp: new Date().toISOString()
        }
      };
    }

    if (!companyName) {
      log.error('missing_company_name', { context });
      return {
        statusCode: 400,
        body: {
          error: 'Missing required parameter: companyName',
          received: context,
          timestamp: new Date().toISOString()
        }
      };
    }

    // Search Glean knowledge base
    log.start('search_knowledge_base', { companyName });
    
    try {
      const searchResults = await searchGleanKnowledge(companyName);
      
      // Generate strategic plan from search results
      const strategicPlan = generateStrategicPlan(companyName, searchResults);
      
      log.success('plan_generated', { 
        companyName, 
        searchResults: searchResults?.results?.length || 0,
        planLength: strategicPlan.messages[0].content[0].text.length
      });
      
      return {
        statusCode: 200,
        body: strategicPlan
      };
      
    } catch (error) {
      log.error('search_error', { companyName, error: error.message });
      
      // If search fails, return a basic plan
      const fallbackPlan = generateStrategicPlan(companyName, null);
      
      return {
        statusCode: 200,
        body: {
          ...fallbackPlan,
          metadata: {
            ...fallbackPlan.metadata,
            error: `Search failed: ${error.message}`,
            fallback: true
          }
        }
      };
    }

  } catch (error) {
    log.error('function_error', {
      error: error.message,
      stack: error.stack,
      errorType: error.constructor.name,
      context: context
    });

    return {
      statusCode: 500,
      body: {
        error: `Function error: ${error.message}`,
        timestamp: new Date().toISOString(),
        errorType: error.constructor.name
      }
    };
  }
}; 