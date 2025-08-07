# Deployment Guide: Glean-HubSpot UI Extension

This guide covers the deployment process for the Glean-HubSpot UI Extension using the current working approach.

## ✅ Current Working Deployment Method

**GitHub Integration** - Auto-deploy on push to main branch

### Prerequisites
- GitHub repository connected to HubSpot
- HubSpot Standard Sandbox account (ID: 47610017)
- Glean Bearer token (for API integration)

### Deployment Process

1. **Automatic Deployment**
   ```bash
   git push origin main  # Triggers auto-build and deployment
   ```

2. **Monitor Build Status**
   - Check HubSpot Developer Portal → Projects
   - Verify build succeeds (usually takes 1-3 minutes)
   - Extension automatically appears in Extensions section

3. **Configure Extension**
   - Go to HubSpot CRM → Company records
   - Click "Customize" in sidebar
   - Add "Strategic Account Plan" card
   - Save configuration

### Build Status
- **Recent builds**: All successful (#20+)
- **Extension**: Successfully registered and functional
- **Platform**: HubSpot 2023.2

## 🔧 Configuration

### Glean API Integration

To enable full functionality:

1. **Get Glean Bearer Token**
   - Contact your Glean admin
   - Request API access token

2. **Update Code**
   - Edit `src/app/extensions/GleanCard.jsx`
   - Replace `'YOUR_GLEAN_TOKEN_HERE'` with actual token

3. **Deploy Changes**
   ```bash
   git add .
   git commit -m "Add Glean API token"
   git push origin main
   ```

### HubSpot Configuration

The project is pre-configured for:
- **Account**: Standard Sandbox (47610017)
- **Platform Version**: 2023.2
- **Extension Type**: Private app (CRM card)

## 📊 Project Structure

```
src/app/
├── app.json                    # Extension configuration
└── extensions/
    ├── package.json           # Dependencies
    ├── strategic-card.json    # Card definition
    └── GleanCard.jsx         # React component
```

## 🚀 Quick Deployment

### For New Users

1. **Clone Repository**
   ```bash
   git clone https://github.com/bkvale/glean-agent-extension.git
   cd glean-agent-extension
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd src/app/extensions && npm install
   ```

3. **Connect to HubSpot**
   - Fork repository to your GitHub account
   - Connect GitHub to HubSpot Developer Portal
   - Set up Personal Access Key

4. **Deploy**
   ```bash
   git push origin main
   ```

### For Updates

1. **Make Changes**
   - Edit files as needed
   - Test locally if desired

2. **Deploy**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

## 🔍 Troubleshooting

### Common Issues

1. **Build Fails**
   - Check GitHub repository connection
   - Verify Personal Access Key is valid
   - Review build logs in HubSpot Developer Portal

2. **Extension Not Appearing**
   - Ensure using Standard Sandbox account
   - Check Extensions section in HubSpot
   - Verify card is added to Company record sidebar

3. **Glean API Errors**
   - Verify Bearer token is correct
   - Check network connectivity
   - Review error messages in browser console

### Support Resources

- **HubSpot Documentation**: [UI Extensions Guide](https://developers.hubspot.com/docs/platform/ui-extensions)
- **GitHub Issues**: Create issues for code problems
- **HubSpot Support**: Contact for platform issues

## 📈 Future Enhancements

### Planned Features
- **Multiple Agents**: Support for different Glean agents
- **Agent Selection**: Dropdown for agent selection
- **Enhanced UI**: Better result formatting
- **Caching**: Store results to reduce API calls

### Deployment Improvements
- **CI/CD Pipeline**: Automated testing
- **Environment Management**: Dev/staging/production
- **Monitoring**: Build and deployment alerts

---

**Last Updated**: Build #20+ - Working deployment via GitHub integration 