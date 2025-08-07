# Glean-HubSpot UI Extension

**Embed Glean AI Agent insights directly into HubSpot Company records**

## ✅ Current Status: WORKING

**Status**: UI Extension successfully deployed and functional  
**Platform**: HubSpot 2023.2  
**Account**: Standard Sandbox (ID: 47610017)  
**Build**: #20+ - All builds successful  

## 📋 Project Overview

This project creates a custom HubSpot UI Extension (CRM card) that displays Glean AI Agent insights directly within HubSpot Company records, eliminating the need for sales reps to leave the CRM.

### Goals
- ✅ **No context switching**: Access account intelligence without leaving HubSpot
- ✅ **Seamless integration**: Native UI extension in Company record sidebar  
- ✅ **Dynamic data**: Pull real-time insights from Glean Agent
- ✅ **Working MVP**: Extension successfully deployed and functional

## 🛠 Technical Stack

- **Platform**: HubSpot UI Extensions (2023.2)
- **Frontend**: React 18 + @hubspot/ui-extensions
- **Build System**: HubSpot Projects with GitHub integration
- **Deployment**: Auto-deploy on push to main branch
- **API Integration**: Glean Agents API for dynamic insights

## 📁 Project Structure

```
glean-agent-extension/
├── README.md                    # This file
├── hsproject.json              # HubSpot project configuration
├── package.json                # Node.js dependencies and scripts
├── .gitignore                  # Git ignore patterns
├── docs/                       
│   ├── mock-glean-data.json    # Sample data for development
│   ├── glean-prompt-examples.md # Glean Agent prompt examples
│   └── deployment-guide.md     # Deployment options and instructions
└── src/app/
    ├── app.json                # UI Extension configuration
    └── extensions/
        ├── package.json        # Extension-specific dependencies
        ├── strategic-card.json # CRM card definition
        └── GleanCard.jsx       # React component with Glean integration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- HubSpot Standard Sandbox account
- Glean Bearer token (for API integration)

### Setup
```bash
# Clone repository
git clone https://github.com/bkvale/glean-agent-extension.git
cd glean-agent-extension

# Install dependencies
npm install
cd src/app/extensions && npm install

# Configure Glean token (see Configuration section)
```

### Development
```bash
# Deploy via GitHub integration (recommended)
git push origin main  # Triggers auto-build and deployment
```

## ⚙️ Configuration

### Glean API Integration

To enable the Glean API integration, you need to:

1. **Get your Glean Bearer token** from your Glean admin panel
2. **Replace the placeholder** in `src/app/extensions/GleanCard.jsx`:
   ```javascript
   const token = 'YOUR_GLEAN_TOKEN_HERE'; // Replace with actual token
   ```

### HubSpot Configuration

The project is configured for:
- **Account**: Standard Sandbox (ID: 47610017)
- **Platform Version**: 2023.2
- **Extension Type**: Private app (CRM card)

## 🔧 Build Status

| Build | Status | Notes |
|-------|--------|-------|
| #20+ | ✅ Deployed | Working extension with Glean integration |
| #19 | ✅ Deployed | Fixed company name fetching |
| #18 | ✅ Deployed | Improved error handling |

**All recent builds**: Successful validation and deployment  
**Extension**: Successfully registered and functional

## 📊 Configuration Files

### hsproject.json
```json
{
  "name": "glean-agent-extension",
  "srcDir": "src", 
  "platformVersion": "2023.2"
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
    "crm": {
      "cards": [
        {
          "file": "extensions/strategic-card.json"
        }
      ]
    }
  }
}
```

## 🎯 Success Criteria

- ✅ **Extension Registration**: UI Extension appears in HubSpot Extensions section
- ✅ **CRM Integration**: Extension configurable in Company record sidebar
- ✅ **Data Display**: Shows Glean API results
- ✅ **Dynamic Integration**: Supports real-time Glean API calls
- ✅ **Company Data**: Automatically fetches company name from HubSpot

## 🔍 Features

### Current Functionality
- **Strategic Account Plan Agent**: Integrated with Glean API
- **Company Name Detection**: Automatically pulls from HubSpot record
- **Error Handling**: Clear messages for token issues and network errors
- **Loading States**: Visual feedback during API calls
- **Results Display**: Shows Glean agent output in readable format

### Future Enhancements
- **Multiple Agents**: Support for different Glean agents
- **Agent Selection**: Dropdown or tabs for agent selection
- **Enhanced UI**: Better formatting of Glean results
- **Caching**: Store results to reduce API calls

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run upload   # Upload to HubSpot (if CLI working)  
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

## 🤝 Contributing

1. **Changes**: Create feature branches and pull requests
2. **Testing**: Verify builds succeed before merging
3. **Documentation**: Update relevant docs with any findings

## 📞 Support

- **Technical Issues**: Create GitHub Issues
- **HubSpot Platform**: Contact HubSpot Support
- **Project Questions**: Contact repository owner

---

**Last Updated**: Build #20+ - Extension working successfully with Glean integration  
**Next Steps**: Add Glean Bearer token for full API functionality 