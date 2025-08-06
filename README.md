# Glean-HubSpot UI Extension

This project integrates Glean AI Agent insights directly into HubSpot Company records, allowing sales teams to access strategic account planning information without leaving their CRM.

## 🎯 Goal

Embed a "Strategic Account Plan" (Glean AI Agent) prompt inside HubSpot so users can generate and view insights directly within HubSpot Company records, ideally on the sidebar, without leaving the CRM.

## 🏗️ Project Structure

```
glean-agent-extension/
├── README.md                           # This file
├── hsproject.json                      # HubSpot project configuration
├── hubspot.config.yml                  # HubSpot CLI authentication
├── package.json                        # Node.js dependencies
├── src/
│   └── app/
│       ├── app.json                    # Extension configuration
│       └── extensions/
│           └── cards/
│               └── GleanCard.jsx       # Main UI Extension component
└── docs/
    ├── mock-glean-data.json            # Sample Glean Agent output
    └── glean-prompt-examples.md        # Prompt examples for Glean Agent
```

## 🚀 Features

- **Strategic Score Display**: Shows AI-calculated strategic value of accounts
- **Key Opportunities**: Lists expansion and partnership opportunities
- **Risk Assessment**: Highlights potential challenges and risks
- **Action Items**: Provides specific next steps for account engagement
- **Company Context**: Automatically pulls company data from HubSpot
- **Direct Glean Integration**: Opens full Glean Agent with company context

## 🛠️ Setup Instructions

### Prerequisites

- HubSpot account with Sales or Service Hub Enterprise access
- Enrolled in HubSpot CRM Development Tools public beta
- HubSpot CLI installed and authenticated (`@hubspot/cli@latest`)
- Node.js and npm installed

### Method 1: HubSpot CLI (Preferred - when working)

1. **Clone and setup**:
   ```bash
   git clone <this-repo>
   cd glean-agent-extension
   npm install
   ```

2. **Upload to HubSpot**:
   ```bash
   hs project upload
   ```

3. **Start development server** (optional):
   ```bash
   hs project dev
   ```

### Method 2: Manual Configuration (Fallback)

If the CLI upload fails with 405 errors (known issue), use HubSpot's Projects Builder:

1. **Access Projects Builder**:
   - Go to HubSpot Developer Portal
   - Navigate to Projects (UI Extensions) Builder
   - Create new project

2. **Create Custom Card**:
   - Add "Custom Card" asset
   - Set placement: Company record sidebar
   - Copy contents of `src/app/extensions/cards/GleanCard.jsx`

3. **Configure iframe option** (simpler alternative):
   - Set card type to "iframe"
   - URL: `https://app.glean.com/chat/agents/5057a8a588c649d6b1231d648a9167c8?`
   - For dynamic company data (if supported):
     ```
     https://app.glean.com/chat/agents/5057a8a588c649d6b1231d648a9167c8?company={{company.name}}&domain={{company.domain}}
     ```

## 🔧 Configuration

### Environment Setup

1. **Authentication**:
   ```bash
   hs accounts use  # Select your authenticated account
   ```

2. **Verify configuration**:
   ```bash
   hs accounts list
   ```

### Glean Agent Configuration

The extension is pre-configured to use the Glean Strategic Account Plan agent:
- **Agent URL**: `https://app.glean.com/chat/agents/5057a8a588c649d6b1231d648a9167c8?`
- **Context**: Automatically passes company name, domain, and industry when available

## 💻 Development

### Local Development

```bash
# Start development server
npm run dev

# Format code
npm run format

# Lint code
npm run lint
```

### Testing

The extension includes mock data for development and testing:
- Mock strategic insights in `GleanCard.jsx`
- Sample data structure in `docs/mock-glean-data.json`
- Example prompts in `docs/glean-prompt-examples.md`

## 🐛 Troubleshooting

### Common Issues

#### 1. 405 Method Not Allowed Error
**Symptoms**: `hs project create` or `hs project upload` fails with "The post in account XXXXX failed"

**Cause**: Known issue with HubSpot's project creation endpoint, possibly due to:
- Beta feature not fully provisioned
- Account permissions
- Backend service issues

**Solutions**:
1. **Try alternative CLI commands**:
   ```bash
   hs project upload --account=YourAccountName
   ```

2. **Use Projects Builder** (see Method 2 above)

3. **Contact HubSpot Support** with:
   - Account ID: `242835255`
   - Error: "405 Method Not Allowed on project creation/upload"
   - Request: Enable UI Extensions project creation

#### 2. CLI Authentication Issues
**Symptoms**: Config not detected, authentication failures

**Solutions**:
```bash
# Re-authenticate
hs auth

# Create new config
hs init

# Verify authentication
hs accounts list
```

#### 3. Missing Dependencies
**Symptoms**: Import errors, build failures

**Solutions**:
```bash
# Install all dependencies
npm install

# Verify HubSpot CLI is latest version
npm install -g @hubspot/cli@latest
```

### Debug Information

- **HubSpot CLI Version**: 7.5.4
- **Account ID**: 242835255
- **Account Type**: STANDARD
- **Auth Type**: Personal Access Key
- **Platform Version**: 4.0

## 📋 Alternative Approaches

### 1. Simple iframe Integration

If full UI Extension development is blocked:

```html
<!-- In HubSpot Projects Builder -->
<iframe 
  src="https://app.glean.com/chat/agents/5057a8a588c649d6b1231d648a9167c8?"
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

### 2. Custom Card with Static Content

Create a basic card that links to Glean:

```jsx
// Minimal card implementation
const SimpleGleanCard = () => (
  <Box padding="medium">
    <Text variant="h3">Strategic Account Plan</Text>
    <Button onClick={() => window.open('https://app.glean.com/chat/agents/5057a8a588c649d6b1231d648a9167c8?', '_blank')}>
      Open Glean Agent
    </Button>
  </Box>
);
```

### 3. Manual Projects Builder Setup

Step-by-step manual configuration:
1. HubSpot Developer Portal → Projects Builder
2. Create new project: "Glean Strategic Insights"
3. Add custom card component
4. Paste GleanCard.jsx code
5. Configure placement: Company records
6. Save and test

## 🤝 Handoff Instructions

For another developer taking over this project:

### Immediate Actions Needed
1. **Resolve CLI Upload Issue**:
   - Contact HubSpot support about 405 errors
   - Try uploading from different network/machine
   - Test with minimal project structure

2. **Test Manual Upload**:
   - Use Projects Builder to manually create extension
   - Verify GleanCard.jsx works in HubSpot environment

3. **Enhance Integration**:
   - Add real Glean API integration (currently uses mock data)
   - Implement proper error handling
   - Add user authentication for Glean

### Technical Debt
- [ ] Replace mock data with real Glean API calls
- [ ] Add proper TypeScript types
- [ ] Implement comprehensive error handling
- [ ] Add unit tests for components
- [ ] Optimize performance for large datasets

### Future Enhancements
- [ ] Multi-language support
- [ ] Customizable insight categories
- [ ] Export functionality for insights
- [ ] Integration with HubSpot workflows
- [ ] Advanced analytics and reporting

## 📚 Resources

- [HubSpot UI Extensions Documentation](https://developers.hubspot.com/docs/platform/ui-extensions)
- [HubSpot Developer Projects Guide](https://developers.hubspot.com/docs/platform/developer-projects)
- [UI Extensions Examples Repository](https://github.com/HubSpot/ui-extensions-examples)
- [Glean API Documentation](https://app.glean.com/chat/agents/5057a8a588c649d6b1231d648a9167c8?)

## 📞 Support

- **HubSpot Developer Support**: [Help Center](https://help.hubspot.com/)
- **Community Forum**: [HubSpot Developer Community](https://community.hubspot.com/t5/HubSpot-Developer-Support/bd-p/developers)
- **Project Issues**: Create issue in this repository

---

**Last Updated**: January 27, 2025  
**Status**: CLI upload blocked by 405 errors, manual Projects Builder setup available as fallback 