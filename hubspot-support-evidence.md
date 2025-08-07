# HubSpot Support Evidence Collection

## Screenshots Needed for Support Ticket

HubSpot Support has requested visual proof of the following claims. Please gather these screenshots from your HubSpot Developer Portal (Account ID: 47610017).

### **1. ✅ Project Builds Successfully**

**Location**: Developer Portal → Projects → glean-agent-extension → Build History

**Screenshots to Take**:
- [ ] **Build list showing successful builds** 
  - Should show Build #1, #2 with "Succeeded" status
  - Include timestamps and build numbers
  
- [ ] **Build #2 details page**
  - Click on Build #2 → View build details
  - Screenshot the full build log showing:
    - "Building app from app.json"
    - "Validating app" 
    - "Successfully validated app"
    - "Built and validated app"
    - "Finished building PrivateApp component"

**Expected URLs**:
- `https://app.hubspot.com/developer/47610017/projects/glean-agent-extension/builds`

### **2. ✅ Project Deploys Successfully** 

**Location**: Same build details page as above

**Screenshots to Take**:
- [ ] **Deployment status section**
  - Should show "Deploy this build..." button or "Automatically deployed" status
  - Include any deployment timestamps
  
- [ ] **"Latest build" indicator**
  - Screenshot showing Build #2 is marked as "Latest build"

### **3. ✅ Private App Gets Created Automatically**

**Location**: Developer Portal → Private Apps section

**Screenshots to Take**:
- [ ] **Private Apps list**
  - Navigate to: `https://app.hubspot.com/developer/47610017/applications`
  - Screenshot showing "Glean Test Card" in the list
  - Include the "Created by glean-agent-extension #2" text
  
- [ ] **Private App details page**
  - Click on "Glean Test Card" 
  - Screenshot the app overview showing:
    - App name: "Glean Test Card"
    - Description: "Simple test for UI Extensions"
    - Created by: "glean-agent-extension #2"
    - Last changed timestamp

**Expected URLs**:
- `https://app.hubspot.com/developer/47610017/applications`
- `https://app.hubspot.com/developer/47610017/applications/[APP_ID]`

### **4. ❌ Extensions Section Empty (The Problem)**

**Location**: Private Apps → Glean Test Card → Extensions tab

**Screenshots to Take**:
- [ ] **Extensions tab showing empty state**
  - From the Glean Test Card app page, click "Extensions" tab
  - Screenshot the "This private app doesn't have any extensions" message
  - Include the empty-state illustration

**Expected URL**:
- `https://app.hubspot.com/developer/47610017/applications/[APP_ID]/extensions`

## **Additional Evidence (Optional but Helpful)**

### **GitHub Integration Proof**
- [ ] **GitHub repository builds**
  - Screenshot of GitHub Actions or commits showing successful pushes
  - Include commit hashes that match the HubSpot build triggers

### **Account Type Verification**
- [ ] **Account settings page** 
  - Screenshot showing account type as "Standard Sandbox"
  - Include account ID (47610017) visible in the URL or page

### **Configuration Files**
- [ ] **Project configuration**
  - Screenshot of the project settings/configuration in HubSpot
  - Should show platform version 2025.1

## **How to Take Screenshots**

1. **Login to HubSpot Developer Portal**: https://app.hubspot.com/developer/47610017
2. **Navigate to each section** listed above
3. **Take full browser screenshots** (include URL bar)
4. **Name files descriptively**:
   - `01-build-history-success.png`
   - `02-build-details-#2.png` 
   - `03-deployment-status.png`
   - `04-private-apps-list.png`
   - `05-glean-test-card-overview.png`
   - `06-extensions-empty-state.png`

## **What to Send to HubSpot Support**

**Reply with**:
> "Thank you for following up. I've attached the requested screenshots showing:
> 
> 1. **Successful Builds**: Screenshots 01-02 show Build #2 completed successfully with full validation
> 2. **Successful Deployment**: Screenshot 03 shows the build deployed automatically  
> 3. **Private App Creation**: Screenshots 04-05 show "Glean Test Card" was created automatically by the project
> 4. **The Problem**: Screenshot 06 shows the Extensions section is empty despite successful deployment
> 
> All screenshots are from account 47610017 (Standard Sandbox) taken on [TODAY'S DATE].
> 
> This demonstrates that the build/deploy pipeline works correctly, but the extension registration step is failing."

**Attach**: All 6 screenshots

## **Expected HubSpot Response**

After seeing this evidence, HubSpot Support should:
1. **Confirm the issue** - This is clearly a platform bug or account provisioning problem
2. **Escalate internally** - To their engineering team for investigation  
3. **Provide timeline** - For when this might be resolved
4. **Offer workarounds** - If any are available 