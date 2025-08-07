# Glean-HubSpot UI Extension

**Embed Glean AI Agent insights directly into HubSpot Company records**

## 🚨 Current Status: BLOCKED

**Issue**: UI Extensions not registering despite successful builds and deployment.  
**Platform**: HubSpot 2025.1  
**Account**: Standard Sandbox (ID: 47610017)  

See `DEVELOPER_HANDOFF.md` for complete technical details and developer onboarding.

## 📋 Project Overview

This project creates a custom HubSpot UI Extension (CRM card) that displays Glean AI Agent insights directly within HubSpot Company records, eliminating the need for sales reps to leave the CRM.

### Goals
- ✅ **No context switching**: Access account intelligence without leaving HubSpot
- ✅ **Seamless integration**: Native UI extension in Company record sidebar  
- ✅ **Dynamic data**: Pull real-time insights from Glean Agent
- ❌ **Current blocker**: Extensions not registering in HubSpot platform

## 🛠 Technical Stack

- **Platform**: HubSpot UI Extensions (2025.1)
- **Frontend**: React 18 + @hubspot/ui-extensions
- **Build System**: HubSpot Projects with GitHub integration
- **Deployment**: Auto-deploy on push to main branch

## 📁 Project Structure

```
glean-agent-extension/
├── README.md                    # This file
├── DEVELOPER_HANDOFF.md         # Complete developer onboarding guide
├── hubspot-support-message.md   # Ready-to-send support ticket
├── hsproject.json              # HubSpot project configuration
├── package.json                # Node.js dependencies and scripts
├── .gitignore                  # Git ignore patterns
├── docs/                       
│   ├── mock-glean-data.json    # Sample data for development
│   └── glean-prompt-examples.md # Glean Agent prompt examples
└── src/app/
    ├── app.json                # UI Extension configuration
    └── extensions/
        ├── package.json        # Extension-specific dependencies
        └── cards/
            └── GleanCard.jsx   # React component (minimal test version)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- HubSpot CLI: `npm install -g @hubspot/cli`
- Access to HubSpot Standard Sandbox account

### Setup
```bash
# Clone repository
git clone https://github.com/bkvale/glean-agent-extension.git
cd glean-agent-extension

# Install dependencies
npm install
cd src/app/extensions && npm install

# Configure HubSpot CLI (requires Personal Access Key)
hs auth
hs accounts use ProductionSandbox
```

### Development
```bash
# Start development server (if CLI working)
npm run dev

# Or use GitHub integration (recommended)
git push origin main  # Triggers auto-build and deployment
```

## ⚠️ Known Issues

### 1. Extension Registration Failure
**Problem**: Extensions don't appear in HubSpot despite successful builds  
**Evidence**: Private app created, but Extensions section shows "empty"  
**Status**: Under investigation - likely platform issue

### 2. CLI Command Failures  
**Problem**: `hs project create`, `hs project upload` fail with generic errors  
**Workaround**: Using GitHub integration for deployment

### 3. Account Requirements
- ❌ Developer accounts: Not supported (expected)
- ❌ Development test accounts: Deployment failures  
- ✅ Standard sandbox: Builds succeed, but extensions don't register

## 🔧 Build Status

| Build | Status | Notes |
|-------|--------|-------|
| #1 | ✅ Deployed | Auto-deployed, private app created |
| #2 | ✅ Deployed | Minimal component test, still no extension registration |

**All builds**: Successful validation and deployment  
**Issue**: Extensions section remains empty in HubSpot

## 📊 Configuration Files

### hsproject.json
```json
{
  "name": "glean-agent-extension",
  "srcDir": "src", 
  "platformVersion": "2025.1"
}
```

### src/app/app.json
```json
{
  "name": "Glean Test Card",
  "description": "Simple test for UI Extensions",
  "version": "1.0.0",
  "public": false,
  "scopes": ["crm.objects.companies.read"],
  "extensions": {
    "test-card": {
      "type": "crm-card",
      "file": "./extensions/cards/GleanCard.jsx", 
      "context": ["crm.record.company.view"],
      "title": "Test Card"
    }
  }
}
```

## 🎯 Success Criteria

- [ ] **Extension Registration**: UI Extension appears in HubSpot Extensions section
- [ ] **CRM Integration**: Extension configurable in Company record sidebar
- [ ] **Data Display**: Shows static Glean data from mock file
- [ ] **Dynamic Integration**: Supports real-time Glean API calls

## 🔍 Troubleshooting

### For Developers
1. **Review**: `DEVELOPER_HANDOFF.md` for complete technical context
2. **Test**: Try with different HubSpot account types 
3. **Compare**: Against official HubSpot ui-extensions-examples
4. **Debug**: Platform version compatibility (2025.1 vs 2023.2)

### For Support
1. **HubSpot Support**: Use `hubspot-support-message.md` 
2. **Community**: HubSpot Developer Community forums
3. **GitHub**: Create issues for code-related problems

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run upload   # Upload to HubSpot (if CLI working)  
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

## 🤝 Contributing

1. **External Developers**: See `DEVELOPER_HANDOFF.md` for onboarding
2. **Changes**: Create feature branches and pull requests
3. **Testing**: Verify builds succeed before merging
4. **Documentation**: Update relevant docs with any findings

## 📞 Support

- **Technical Issues**: Create GitHub Issues
- **HubSpot Platform**: Use prepared support message
- **Project Questions**: Contact repository owner

---

**Last Updated**: Build #7 deployed successfully, testing on parent dev account (242835255) with public app beta access.  
**Next Steps**: Verify if account provisioning resolves extension registration issue. 