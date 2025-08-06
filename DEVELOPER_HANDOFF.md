# Developer Handoff: Glean-HubSpot UI Extension

## **Project Overview**

**Goal**: Embed Glean AI Agent insights directly into HubSpot Company records via a custom UI Extension (CRM card), eliminating the need for sales reps to leave HubSpot.

**Current Status**: ⚠️ **BLOCKED** - Technical issue with HubSpot 2025.1 platform preventing UI Extension registration

## **Repository Information**

- **GitHub Repository**: https://github.com/bkvale/glean-agent-extension.git
- **Current Branch**: main
- **Last Working Build**: #2 (deployed successfully, but extensions not registering)

## **Technical Stack**

- **Platform**: HubSpot UI Extensions (2025.1)
- **Frontend**: React 18 + @hubspot/ui-extensions
- **Build System**: HubSpot Projects (GitHub integration)
- **Account Type**: Standard Sandbox (ID: 47610017)

## **Current Problem**

### **Issue Summary**
✅ Project builds and deploys successfully  
✅ Private app gets created in HubSpot  
❌ UI Extensions don't register (Extensions section shows "empty")

### **Evidence**
- Multiple successful builds (Build #1, #2)
- Private app "Glean Test Card" visible in HubSpot
- Extensions section consistently shows "This private app doesn't have any extensions"
- All configuration validated against HubSpot 2025.1 documentation

## **Project Structure**

```
glean-agent-extension/
├── README.md                           # Project documentation
├── DEVELOPER_HANDOFF.md               # This file
├── hubspot-support-message.md         # Support ticket ready to send
├── hsproject.json                     # HubSpot project config
├── package.json                       # Node.js dependencies
├── .gitignore                         # Git ignore rules
├── hubspot.config.yml                 # CLI config (gitignored, needs setup)
├── docs/
│   ├── mock-glean-data.json          # Sample Glean data for development
│   └── glean-prompt-examples.md       # Example prompts
└── src/
    └── app/
        ├── app.json                   # UI Extension configuration
        └── extensions/
            ├── package.json           # Extensions dependencies
            ├── node_modules/          # Installed dependencies
            └── cards/
                └── GleanCard.jsx      # React component (currently minimal)
```

## **Key Files & Configuration**

### **hsproject.json**
```json
{
  "name": "glean-agent-extension",
  "srcDir": "src",
  "platformVersion": "2025.1"
}
```

### **src/app/app.json**
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

## **Access & Credentials**

### **HubSpot Account Details**
- **Account ID**: 47610017 (Standard Sandbox)
- **Account Type**: Standard Sandbox (supports UI Extensions)
- **Access**: Ben can provide Personal Access Key for CLI setup

### **GitHub Access**
- **Repository**: Public (accessible for cloning)
- **Collaborator Access**: Ben can add you as collaborator if needed

## **Known Issues & Troubleshooting**

### **1. CLI Issues**
- `hs project create`, `hs project upload` consistently fail with generic errors
- **Workaround**: Use GitHub integration (working reliably)

### **2. Extension Registration Issue**
- **Problem**: Extensions don't appear despite successful deployment
- **Potential Causes**:
  - Platform bug with 2025.1
  - Account provisioning issue
  - Undocumented configuration requirement

### **3. Account Requirements**
- ❌ Developer accounts: "Not supported" error (expected)
- ❌ Development test accounts: Deployment failures
- ✅ Standard sandbox: Builds succeed, extensions don't register

## **Developer Action Items**

### **Priority 1: Immediate Investigation**
1. **Clone the repository** and review current configuration
2. **Test with a working HubSpot account** (if you have access to Enterprise/Sandbox)
3. **Compare against known working examples** from HubSpot's ui-extensions-examples repo
4. **Identify if this is a platform bug or configuration issue**

### **Priority 2: Alternative Approaches**
1. **Downgrade to platform version 2023.2** and test if extensions register
2. **Try different extension types** (not just crm-card)
3. **Test with official HubSpot example templates**

### **Priority 3: Escalation Path**
1. **Engage HubSpot Developer Support** with technical details
2. **Consider platform-specific workarounds** or beta alternatives

## **Success Criteria**

✅ **Minimum Viable Product**: UI Extension appears in HubSpot Extensions section  
✅ **Functional Test**: Extension configurable in Company record sidebar  
✅ **Data Integration**: Extension displays static Glean data (from mock-glean-data.json)  
✅ **Future Ready**: Structure supports dynamic Glean API integration  

## **Development Environment Setup**

### **Required Dependencies**
```bash
npm install                    # Install root dependencies
cd src/app/extensions          
npm install                    # Install extension dependencies
```

### **HubSpot CLI Setup**
```bash
npm install -g @hubspot/cli
hs auth                        # Requires Personal Access Key from Ben
hs accounts use ProductionSandbox
```

### **GitHub Integration** (Recommended)
- Connect repository to HubSpot Projects for auto-deployment
- Builds trigger on push to main branch

## **Testing Strategy**

### **Phase 1: Validate Platform**
1. Create minimal test extension to verify registration works
2. Test with different configurations to isolate issue

### **Phase 2: Debug Current Setup**  
1. Review build logs for hidden errors
2. Compare against working HubSpot examples
3. Test component simplification approaches

### **Phase 3: Alternative Solutions**
1. Test older platform versions
2. Explore different deployment methods
3. Consider custom app approach if Projects fail

## **Questions for Developer**

1. **Experience Level**: How familiar are you with HubSpot UI Extensions and the 2025.1 platform?
2. **Account Access**: Do you have access to HubSpot Enterprise/Sandbox accounts for testing?
3. **Approach**: Would you prefer to debug the current setup or start fresh with proven examples?
4. **Timeline**: How quickly can you identify if this is a platform issue vs. configuration problem?

## **Communication**

- **Primary Contact**: Ben (project owner)
- **Repository Updates**: Push to feature branches, create PRs for review
- **Issue Tracking**: Use GitHub Issues for technical problems
- **Status Updates**: Regular check-ins on investigation progress

## **Fallback Options**

If UI Extensions can't be resolved:
1. **Custom Property Approach**: Use HubSpot custom properties with external data sync
2. **Iframe Embedding**: Simple iframe solution with Glean URL + company parameters  
3. **Webhook Integration**: Server-side integration with custom dashboard

---

**Note**: This project represents significant time investment in troubleshooting. A fresh expert perspective could quickly identify if we're dealing with a platform limitation or a solvable configuration issue. 