# Glean Agent Extension for HubSpot

This repository contains two different approaches for integrating Glean AI agents with HubSpot CRM, implemented as separate feature branches for review and analysis.

## 🏗️ Architecture Overview

### Iframe Approach (`feature/iframe-embed-prototype`)
- Attempts to embed Glean agent directly in HubSpot iframe modal
- **Status**: Blocked by security policies (X-Frame-Options: DENY, CORS)
- **Purpose**: Demonstrates why iframe embedding isn't viable for complex web apps

### Serverless Approach (`feature/crm-card-agent-run`)
- Uses HubSpot serverless functions to call Glean API
- **Status**: Works up to HubSpot's ~10-15 second timeout limit
- **Purpose**: Shows viable path for programmatic agent execution

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- HubSpot Developer Account
- Glean API access with agent permissions

### Environment Setup
1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Fill in your credentials:
   ```env
   GLEAN_API_TOKEN=your_actual_token
   GLEAN_INSTANCE=your_instance_name
   GLEAN_AGENT_ID=your_agent_id
   HUBSPOT_PRIVATE_APP_TOKEN=your_hubspot_token
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

## 📁 Project Structure

```
src/
├── app/
│   ├── extensions/
│   │   ├── GleanCard.jsx          # Main CRM card component
│   │   └── strategic-card.json    # Card configuration
│   ├── glean.functions/
│   │   ├── glean-proxy.js         # Serverless function
│   │   └── package.json
│   └── app.json                   # HubSpot app configuration
├── docs/
│   └── architecture.md            # Technical documentation
└── package.json
```

## 🔧 Development Scripts

```bash
# Development
npm run dev:card          # Run CRM card locally
npm run dev:iframe        # Run iframe prototype locally
npm run build            # Build for production
npm run deploy           # Deploy to HubSpot

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript checks
npm run test             # Run tests (if available)

# Utilities
npm run clean            # Clean build artifacts
npm run smoke-test       # Run minimal smoke test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `npm run lint && npm run typecheck`
5. Commit: `git commit -m 'feat: your feature description'`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues related to:
- **Glean API**: Contact your Glean administrator
- **HubSpot Platform**: Check [HubSpot Developer Documentation](https://developers.hubspot.com/)
- **This Extension**: Open an issue in this repository 