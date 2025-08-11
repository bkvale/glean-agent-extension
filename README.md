# Glean Agent HubSpot CRM Extension

A HubSpot UI Extension that embeds Glean AI agents directly into company records, enabling strategic account planning and analysis within the CRM.

## 🎯 Current Status: **Production Ready with Timeout Handling**

### ✅ What's Working
- **UI Extension**: Successfully deployed and rendering in HubSpot CRM
- **Serverless Function**: Robust proxy with comprehensive error handling
- **Glean Integration**: Direct API calls with timeout and retry logic
- **Error Handling**: Categorized errors with user-friendly messages
- **Logging**: High-signal diagnostics for debugging

### ⚠️ Known Limitations
- **Timeout Constraint**: Glean agents that take >8 seconds will timeout (HubSpot serverless limit)
- **Synchronous Only**: Currently uses blocking `/wait` endpoint
- **No Persistence**: Results not stored between sessions

## 🏗️ Architecture

### Current Implementation
```
HubSpot CRM Card → Serverless Function → Glean API (/wait)
```

### Future Architecture Options
- **Branch A**: Async flow with polling (`USE_ASYNC_FLOW=true`)
- **Branch B**: External worker service (`USE_EXTERNAL_WORKER=true`)

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Required environment variables
export GLEAN_BASE_URL="trace3-be.glean.com"
export GLEAN_AGENT_ID="5057a8a588c649d6b1231d648a9167c8"
export GLEAN_API_TOKEN="your_token_here"
export GLEAN_TIMEOUT_MS="8000"  # 8 seconds (HubSpot limit)
export GLEAN_MAX_RETRIES="1"
```

### 2. Local Testing
```bash
# Test Glean API directly
node test-glean-api.js "Company Name"

# Test with custom timeout
node test-glean-api.js "Company Name" --timeoutMs=12000
```

### 3. Deploy to HubSpot
```bash
# Deploy via GitHub integration (recommended)
git add . && git commit -m "Update" && git push

# Or deploy via CLI (if configured)
npx hs project deploy
```

## 📁 Project Structure

```
glean-agent-extension/
├── src/app/
│   ├── app.json                 # HubSpot app manifest
│   ├── extensions/
│   │   ├── GleanCard.jsx        # Main UI component
│   │   └── strategic-card.json  # CRM card configuration
│   └── glean.functions/
│       └── glean-proxy.js       # Serverless function
├── test-glean-api.js           # Local smoke test
├── hsproject.json              # HubSpot project config
└── README.md                   # This file
```

## 🔧 Configuration

### Serverless Function Settings
- **Timeout**: 8 seconds (configurable via `GLEAN_TIMEOUT_MS`)
- **Retries**: 1 attempt with exponential backoff
- **Error Categories**: timeout, upstream_4xx, upstream_5xx, unknown

### UI States
- **idle**: Ready to generate plan
- **in_progress**: Loading with spinner
- **success**: Plan generated successfully
- **error**: Error with retry option

## 🐛 Debugging

### High-Signal Logs
The serverless function provides structured logging:
```
[GLEAN_PROXY] START: start_glean_call
[GLEAN_PROXY] HTTP: http_request_outbound
[GLEAN_PROXY] HTTP: http_response_status
[GLEAN_PROXY] SUCCESS: parse_success
[GLEAN_PROXY] RETURN: return_to_ui
```

### Viewing Logs
1. **HubSpot**: Settings → Integrations → Private Apps → [Your App] → Logs
2. **Browser**: Developer Console for UI errors
3. **Local**: `node test-glean-api.js` for direct API testing

### Common Issues

#### Timeout Errors
```
Error: Request timeout after 8000ms - Glean API took too long to respond
```
**Solution**: Increase `GLEAN_TIMEOUT_MS` (up to HubSpot's limit) or implement async flow

#### Authentication Errors
```
Error: HTTP 401: Unauthorized
```
**Solution**: Check `GLEAN_API_TOKEN` has `AGENTS` scope

#### Agent Not Found
```
Error: HTTP 404: Not Found
```
**Solution**: Verify `GLEAN_AGENT_ID` is correct

## 🧪 Testing Matrix

| Scenario | Expected Result | Test Command |
|----------|----------------|--------------|
| Valid token + fast agent | Success | `node test-glean-api.js "Test Company"` |
| Invalid token | upstream_4xx | `GLEAN_API_TOKEN=invalid node test-glean-api.js` |
| Bad agent ID | upstream_404 | `GLEAN_AGENT_ID=bad-id node test-glean-api.js` |
| Slow agent (~60s) | timeout | `node test-glean-api.js "Slow Company" --timeoutMs=5000` |

## 🔮 Future Enhancements

### Phase 2: Async Flow
- Implement `/start` + `/status` polling
- Store results in HubSpot custom objects
- Add progress indicators

### Phase 3: External Worker
- Deploy worker service for long-running agents
- Webhook integration for completion notifications
- Result caching and versioning

### Phase 4: Multi-Agent Support
- Dropdown for agent selection
- Agent-specific input forms
- Result comparison tools

## 📊 Performance Metrics

### Current Benchmarks
- **Fast agents**: 2-5 seconds
- **Medium agents**: 5-8 seconds  
- **Slow agents**: 8+ seconds (timeout)

### Optimization Opportunities
- **Caching**: Store results for 24 hours
- **Preloading**: Start analysis on page load
- **Progressive loading**: Show partial results

## 🔒 Security

### Token Management
- **Current**: Hardcoded in serverless function
- **Future**: HubSpot secrets management
- **Best Practice**: Rotate tokens regularly

### Data Handling
- **Input**: Company name only
- **Output**: Strategic account plan
- **Storage**: No sensitive data persisted

## 📞 Support

### Troubleshooting Steps
1. Run local smoke test: `node test-glean-api.js`
2. Check HubSpot serverless logs
3. Verify environment variables
4. Test with different company names

### Known Issues
- **Developer accounts**: Don't support UI Extensions
- **CSP restrictions**: Direct API calls blocked (use serverless)
- **Timeout limits**: HubSpot serverless has 10-15s limit

---

**Last Updated**: August 8, 2024  
**Version**: 2.0.0 (with timeout handling)  
**Status**: Production Ready 