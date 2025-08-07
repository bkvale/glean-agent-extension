# HubSpot Support Request: UI Extensions Not Registering Despite Successful Deployment

## **Issue Summary**
UI Extensions are not registering in the Extensions section of Private Apps, despite successful project builds and deployments on the 2025.1 platform.

## **Account Details**
- **Account ID**: 47610017
- **Account Type**: Standard Sandbox
- **Platform Version**: 2025.1
- **Project Name**: glean-agent-extension
- **Private App Name**: Glean Test Card

## **Problem Description**
1. ✅ **Project builds successfully** (multiple builds completed)
2. ✅ **Project deploys successfully** (auto-deployment working)
3. ✅ **Private app gets created automatically** (visible in Private Apps section)
4. ❌ **Extensions section shows "This private app doesn't have any extensions"**

**Critical Finding**: This issue occurs across multiple account types:
- ✅ Standard Sandbox (47610017): Builds succeed, extensions don't register
- ✅ Production Account: Builds succeed, extensions don't register  
- ❌ Developer Account (242835255): Build fails (expected behavior)

This confirms the issue is a platform bug, not an account provisioning problem.

## **Technical Configuration**

### **Project Structure**
```
glean-agent-extension/
├── hsproject.json
├── package.json
├── src/
│   └── app/
│       ├── app.json
│       └── extensions/
│           ├── package.json
│           ├── node_modules/
│           └── cards/
│               └── GleanCard.jsx
```

### **hsproject.json**
```json
{
  "name": "glean-agent-extension",
  "srcDir": "src",
  "platformVersion": "2025.1"
}
```

### **app.json**
```json
{
  "name": "Glean Test Card",
  "description": "Simple test for UI Extensions",
  "version": "1.0.0",
  "public": false,
  "scopes": [
    "crm.objects.companies.read"
  ],
  "extensions": {
    "test-card": {
      "type": "crm-card",
      "file": "./extensions/cards/GleanCard.jsx",
      "context": [
        "crm.record.company.view"
      ],
      "title": "Test Card"
    }
  }
}
```

### **React Component** (Minimal Test)
```jsx
import React from 'react';
import { Text, Box } from '@hubspot/ui-extensions';

const GleanCard = () => {
  return (
    <Box>
      <Text>Hello from Glean Test Card!</Text>
    </Box>
  );
};

export default GleanCard;
```

## **Troubleshooting Steps Performed**

### **1. Account Type Verification**
- ✅ Confirmed account is Standard Sandbox (supports UI Extensions)
- ✅ Verified beta enrollment for CRM Development Tools
- ✅ Tested with multiple account types (developer accounts failed as expected)

### **2. Platform Version Updates**
- Updated from platformVersion "4.0" to "2025.1"
- Resolved all build validation errors
- Updated @hubspot/ui-extensions to "latest"

### **3. Configuration Validation**
- Fixed app.json schema issues (added required "public" and "scopes" fields)
- Changed extensions from array to object format (per 2025.1 requirements)
- Simplified React component to minimal structure

### **4. Dependencies Installation**
- Installed npm dependencies in both root and extensions directories
- Created proper package.json in extensions directory
- Verified all required dependencies (@hubspot/ui-extensions, react, react-dom)

### **5. CLI Troubleshooting**
- Attempted `hs project create`, `hs project upload`, `hs project deploy`
- All CLI commands consistently fail with generic errors
- Used GitHub integration as workaround (working successfully)

## **Build Evidence**

### **Successful Builds**
- Build #1: Auto-deployed successfully
- Build #2: Auto-deployed successfully with minimal component
- All builds show: "Successfully validated app" and "Built and validated app"

### **Error Pattern**
- **Build Status**: ✅ Success
- **Deployment Status**: ✅ Success  
- **Private App Creation**: ✅ Success
- **Extension Registration**: ❌ Fails (Extensions section empty)

## **Attempted Solutions**

### **1. Component Simplification**
Reduced React component to absolute minimum to eliminate code complexity as a factor.

### **2. Configuration Validation**
Verified app.json structure matches 2025.1 schema requirements and official documentation.

### **3. Multiple Account Testing**
- Tested on developer accounts (correctly failed with "not supported" error)
- Tested on development test account (deployment failures)
- Current standard sandbox account (builds succeed, extensions don't register)

### **4. Template Comparison**
Attempted to create project from official HubSpot ui-extensions-examples template for comparison (CLI failed).

## **Research Findings**

Based on research of HubSpot documentation and developer community:
1. Account type requirements are met (standard sandbox)
2. Configuration follows 2025.1 specifications exactly
3. No known workarounds documented for this specific issue
4. Similar issues reported in developer community without clear resolution

## **Specific Request**

Please investigate why Extensions are not registering despite successful builds and deployment. This appears to be either:
1. A platform bug with 2025.1 extension registration
2. An account provisioning issue requiring additional enablement
3. An undocumented configuration requirement

## **Expected Outcome**

The "Test Card" extension should appear in the Extensions section of the Private App and be available for configuration in HubSpot CRM Company record sidebar.

## **Additional Information Available**

- Complete project code repository
- Detailed build logs from all attempts
- Screenshots of current state
- CLI error logs

Please advise on next steps or escalate to the appropriate engineering team for platform-level investigation. 