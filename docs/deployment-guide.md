# Deployment Guide: Glean-HubSpot UI Extension

This guide provides multiple deployment approaches for the Glean-HubSpot UI Extension, prioritized by ease of implementation and reliability.

## 🎯 Deployment Options Overview

| Method | Complexity | Reliability | Features | Use Case |
|--------|------------|-------------|----------|----------|
| **Manual Projects Builder** | Low | High | Basic iframe | Quick MVP |
| **CLI Upload** | Medium | Currently Blocked | Full features | When CLI works |
| **Component Copy-Paste** | Medium | High | Full features | Manual setup |
| **Template Repository** | Low | High | Basic setup | Team replication |

## Option 1: Manual Projects Builder (Recommended for MVP)

### Simple iframe Approach

**Time to deploy**: 15 minutes  
**Complexity**: Beginner  
**Maintenance**: Low

#### Steps:

1. **Access HubSpot Developer Portal**
   - Log into your HubSpot account
   - Go to Developer Portal → Projects (UI Extensions) Builder

2. **Create New Project**
   - Click "Create Project"
   - Name: "Glean Strategic Insights"
   - Description: "AI-powered strategic account planning"

3. **Add Custom Card**
   - Click "Add Component" → "Custom Card"
   - Title: "Strategic Account Plan"
   - Placement: Company record sidebar

4. **Configure iframe**
   - Card Type: iframe
   - URL: `https://app.glean.com/chat/agents/5057a8a588c649d6b1231d648a9167c8?`
   - Width: 100%
   - Height: 600px

5. **Add Dynamic Context** (if supported)
   ```
   https://app.glean.com/chat/agents/5057a8a588c649d6b1231d648a9167c8?company={{company.name}}&domain={{company.domain}}&industry={{company.industry}}
   ```

6. **Save and Test**
   - Save the project
   - Navigate to a Company record
   - Verify the card appears and loads Glean

#### Pros:
- ✅ Quick to implement
- ✅ No CLI dependencies
- ✅ Reliable deployment
- ✅ Can pass company context

#### Cons:
- ❌ Limited customization
- ❌ Basic UI integration
- ❌ No mock data for development

---

## Option 2: Manual Component Creation

**Time to deploy**: 45 minutes  
**Complexity**: Intermediate  
**Maintenance**: Medium

### Steps:

1. **Create Project Structure in Projects Builder**
   - Follow Option 1 steps 1-3
   - Choose "React Component" instead of iframe

2. **Copy Component Code**
   - Open `src/app/extensions/cards/GleanCard.jsx`
   - Copy the entire component code
   - Paste into Projects Builder code editor

3. **Configure Dependencies**
   - Ensure these imports are available:
     ```jsx
     import React, { useState, useEffect } from 'react';
     import {
       Divider, Text, Button, Flex, Box, 
       LoadingSpinner, Alert, hubspot
     } from '@hubspot/ui-extensions';
     ```

4. **Test Mock Data**
   - Save and preview in HubSpot
   - Test "Generate Strategic Plan" button
   - Verify company data loading

5. **Configure Real Glean Integration** (optional)
   - Replace mock data with actual Glean API calls
   - Add authentication handling

#### Pros:
- ✅ Full feature set
- ✅ Custom UI components
- ✅ Mock data for testing
- ✅ Company context integration

#### Cons:
- ❌ More complex setup
- ❌ Requires code understanding
- ❌ Manual maintenance

---

## Option 3: CLI Upload (When Available)

**Time to deploy**: 30 minutes  
**Complexity**: Intermediate  
**Maintenance**: Low

### Prerequisites:
- CLI 405 error resolved by HubSpot
- Project structure complete
- Dependencies installed

### Steps:

1. **Verify CLI Setup**
   ```bash
   hs --version  # Should be 7.5.4+
   hs accounts list  # Verify authentication
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Upload Project**
   ```bash
   hs project upload
   ```

4. **Start Development** (optional)
   ```bash
   hs project dev
   ```

#### Current Status:
🚫 **BLOCKED** - 405 Method Not Allowed error on project upload

#### Resolution Required:
- Contact HubSpot support
- Verify account has UI Extensions beta enabled
- Try from different network/machine

---

## Option 4: Template Repository Approach

**Time to deploy**: 20 minutes  
**Complexity**: Beginner  
**Maintenance**: Low

### For Team Replication:

1. **Create GitHub Template**
   - Fork this repository
   - Create template repository
   - Add team members as collaborators

2. **Documentation Package**
   - Include this deployment guide
   - Add team-specific configuration
   - Create step-by-step screenshots

3. **Standardized Setup**
   ```bash
   # Team member setup
   git clone <template-repo>
   cd glean-agent-extension
   # Follow Option 1 or 2 above
   ```

---

## 🔧 Configuration Details

### HubSpot Projects Builder Settings

```json
{
  "projectName": "Glean Strategic Insights",
  "description": "AI-powered strategic account planning",
  "components": [
    {
      "type": "crm-card",
      "name": "Strategic Account Plan",
      "placement": ["crm.record.company.view"],
      "size": "medium"
    }
  ]
}
```

### iframe Configuration

**Basic URL**:
```
https://app.glean.com/chat/agents/5057a8a588c649d6b1231d648a9167c8?
```

**With Dynamic Data** (if HubSpot supports tokens):
```
https://app.glean.com/chat/agents/5057a8a588c649d6b1231d648a9167c8?company={{company.name}}&domain={{company.domain}}&industry={{company.industry}}&revenue={{company.annualrevenue}}
```

### Component Properties

```jsx
// Available HubSpot company properties
const companyProperties = [
  'name',           // Company name
  'domain',         // Website domain
  'industry',       // Industry category
  'annualrevenue',  // Annual revenue
  'numberofemployees', // Employee count
  'city',           // Location
  'state',          // State/region
  'country'         // Country
];
```

## 🧪 Testing Checklist

### Pre-Deployment Testing

- [ ] Projects Builder accessible
- [ ] Can create new projects
- [ ] iframe loads Glean agent correctly
- [ ] Company data accessible in HubSpot
- [ ] No console errors in browser

### Post-Deployment Testing

- [ ] Card appears on Company records
- [ ] Glean agent loads properly
- [ ] Company context passed correctly
- [ ] "Open Full Glean Agent" button works
- [ ] Mock insights display correctly (for full component)
- [ ] No performance issues

### User Acceptance Testing

- [ ] Sales team can access insights
- [ ] Workflow doesn't disrupt existing processes
- [ ] Insights are relevant and useful
- [ ] No training required for basic usage

## 🚨 Troubleshooting Common Issues

### iframe Not Loading
```javascript
// Check if URL is accessible
console.log('Testing Glean URL:', 'https://app.glean.com/chat/agents/5057a8a588c649d6b1231d648a9167c8?');

// Verify in browser first
// Then test in HubSpot iframe
```

### Company Data Not Available
```jsx
// Debug company properties
useEffect(() => {
  hubspot.crm.record.getObjectProperties()
    .then(props => console.log('Available properties:', props))
    .catch(err => console.error('Property access error:', err));
}, []);
```

### Authentication Issues
```bash
# Re-authenticate HubSpot CLI
hs auth

# Verify account access
hs accounts list

# Check developer portal permissions
```

## 📋 Deployment Recommendations

### For Immediate MVP (Choose Option 1)
- Use simple iframe approach
- Deploy in 15 minutes
- Test with real users
- Gather feedback

### For Full Features (Choose Option 2)
- Manual component creation
- Include mock data and full UI
- Better user experience
- More development time required

### For Production (Wait for Option 3)
- Resolve CLI upload issues first
- Use proper development workflow
- Version control and deployment pipeline
- Automated testing and updates

---

## 📞 Next Steps

1. **Choose deployment option** based on timeline and requirements
2. **Follow step-by-step guide** for chosen option
3. **Test thoroughly** before rolling out to team
4. **Document any customizations** for future maintenance
5. **Plan for CLI migration** when 405 errors are resolved

**Recommended Priority**: Start with Option 1 (iframe) for immediate value, then migrate to Option 2 or 3 as time and requirements allow. 