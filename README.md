# Glean Agent Extension for HubSpot

A HubSpot UI Extension that integrates Glean AI agents directly into company records, providing strategic account planning capabilities.

## 🎯 Overview

This repository contains two working prototypes demonstrating different approaches to integrating Glean AI agents with HubSpot CRM:

1. **Iframe Prototype** (`feature/iframe-embed-prototype`) - Shows security limitations of iframe embedding
2. **CRM Card Agent Runner** (`feature/crm-card-agent-run`) - Working serverless function integration

## ⚠️ SECURITY NOTE

**This repository currently contains hardcoded authentication credentials for testing purposes only.**
- **Glean API Token**: Hardcoded in `src/app/glean.functions/glean-proxy.js`
- **Agent ID**: Hardcoded in both components
- **Instance Name**: Hardcoded as 'trace3'

**TODO: Replace all hardcoded credentials with environment variables before production deployment.**

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- HubSpot Developer Account
- Glean API access with agent permissions

### Environment Setup (Optional for Testing)
For testing with your own credentials, you can optionally set environment variables:

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Fill in your credentials (will override hardcoded values):
   ```env
   GLEAN_API_TOKEN=your_actual_token
   GLEAN_INSTANCE=your_instance_name
   GLEAN_AGENT_ID=your_agent_id
   HUBSPOT_PRIVATE_APP_TOKEN=your_hubspot_token
   HUBSPOT_PORTAL_ID=your_portal_id
   ```

### Running Each Approach

#### Iframe Prototype
```bash
git checkout feature/iframe-embed-prototype
npm install
npm run dev:iframe
```

#### CRM Card Agent Runner
```bash
git checkout feature/crm-card-agent-run
npm install
npm run dev:card
```

## 📋 Test Steps

### Iframe Prototype Testing
1. Navigate to a company record in HubSpot
2. Look for "Strategic Account Plan - Iframe Prototype" card
3. Click "Try Iframe Embed"
4. **Expected**: Modal opens but Glean agent is blocked by security policies
5. Check browser console for CORS/X-Frame-Options errors

### CRM Card Testing
1. Navigate to a company record in HubSpot
2. Look for "Strategic Account Plan - CRM Card" card
3. Click "Test Glean API Connection" first
4. **Expected**: Connection test succeeds
5. Click "Run Strategic Account Plan"
6. **Expected**: Agent starts but may timeout after 10-15 seconds

## 🚨 Known Limitations

### Iframe Approach
- **X-Frame-Options: DENY** - Glean blocks iframe embedding
- **CORS Policy** - Internal API calls to `apps-be.glean.com` are blocked
- **Content Security Policy** - Additional browser security restrictions
- **Production Impact**: Cannot be used in production without vendor changes

### Serverless Approach
- **Timeout Limit** - HubSpot serverless functions timeout at ~10-15 seconds
- **Agent Duration** - Glean agents typically take 60-90 seconds to complete
- **Workaround**: Use for quick tests or implement async job pattern

## 🏛️ Architecture Documentation

See [docs/architecture.md](./docs/architecture.md) for detailed sequence diagrams and technical architecture.

## 🔍 Debugging

### Enable Debug Logs
Set `DEBUG=true` in your `.env` file to enable verbose logging.

### Common Issues

#### Iframe Errors
```
Refused to display 'https://app.glean.com/' in a frame because it set 'X-Frame-Options' to 'deny'.
```
**Solution**: This is expected - demonstrates security limitation.

#### Serverless Timeouts
```
AGENT_TIMEOUT: Agent execution exceeded HubSpot timeout limits
```
**Solution**: This is expected - demonstrates timeout limitation.

#### API Authentication
```
AUTH_ERROR: API token may not have agents scope permissions
```
**Solution**: Ensure your Glean API token has the `AGENTS` scope.

#### Missing Environment Variables
```
Missing required environment variables: GLEAN_INSTANCE, GLEAN_AGENT_ID, GLEAN_API_TOKEN
```
**Solution**: The app will use hardcoded values for testing. Set environment variables to override.

## 📁 Project Structure

```
src/
├── app/
│   ├── extensions/
│   │   ├── GleanCard.jsx          # Main CRM card component
│   │   └── strategic-card.json    # CRM card configuration
│   └── glean.functions/
│       └── glean-proxy.js         # Serverless function with Glean SDK
├── docs/
│   ├── architecture.md            # Technical architecture
│   └── token-setup-guide.md       # Token configuration guide
├── env.example                    # Environment variables template
├── .eslintrc.js                   # Linting configuration
└── package.json                   # Dependencies and scripts
```

## 🛠️ Development Scripts

- `npm run dev` - Start development server
- `npm run dev:card` - Test CRM card approach
- `npm run dev:iframe` - Test iframe approach
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🔐 Security Notes

- **Hardcoded credentials present** - For testing purposes only
- **Environment variables supported** - Can override hardcoded values
- **Production deployment requires cleanup** - Remove all hardcoded values
- **Token validation** - Tokens validated before use

## 📞 Support

For issues with:
- **Glean API**: Check token permissions and agent accessibility
- **HubSpot Integration**: Verify portal ID and private app token
- **Environment Setup**: Optional - app works with hardcoded values
- **Timeout Issues**: This is expected behavior - see architecture docs

## 🎯 Next Steps

1. **Choose your approach** - Iframe (demonstration) vs Serverless (functional)
2. **Test functionality** - Both prototypes work with current hardcoded values
3. **Review architecture** - Understand the technical trade-offs
4. **Plan production** - Replace hardcoded values with environment variables
5. **Consider async patterns** - For handling long-running agents 