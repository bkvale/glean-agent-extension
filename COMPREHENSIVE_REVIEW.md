# Comprehensive Review: UI Extension Troubleshooting

## **Latest Fix Attempt (Build #3)**

**Changes Made**:
1. **Platform Version**: Downgraded from 2025.1 → 2023.2
2. **Extensions Format**: Changed from object → array format
3. **File Path**: Removed "./" prefix (relative path issue)
4. **Component Enhancement**: Added proper HubSpot UI structure
5. **Extension ID**: Changed to more descriptive "glean-strategic-card"

## **What We've Tried So Far**

### **✅ Configuration Fixes**
- [x] **Platform Version**: 4.0 → 2025.1 → 2023.2
- [x] **Extensions Format**: Array → Object → Array (for 2023.2)
- [x] **App Structure**: Added required "public" and "scopes" fields
- [x] **Dependencies**: Installed in both root and extensions directories
- [x] **Component Simplification**: Minimal test component

### **✅ Account Testing**
- [x] **Developer Account**: Failed (expected - not supported)
- [x] **Development Test Account**: Failed (deployment issues)
- [x] **Standard Sandbox**: Builds succeed, extensions don't register

### **✅ Build/Deploy Pipeline**
- [x] **GitHub Integration**: Working reliably
- [x] **Auto-deployment**: Successful
- [x] **Private App Creation**: Working
- [x] **Build Validation**: All builds pass

## **Potential Issues We've Addressed**

### **1. Platform Version Compatibility**
**Issue**: 2025.1 might have different extension registration requirements  
**Fix**: Downgraded to 2023.2 (known working version)

### **2. Extensions Schema Format**
**Issue**: 2025.1 uses object format, 2023.2 uses array format  
**Fix**: Changed to array format with explicit "id" field

### **3. File Path Resolution**
**Issue**: Relative paths might not resolve correctly in build system  
**Fix**: Removed "./" prefix, using relative path from app.json

### **4. Component Structure**
**Issue**: Minimal component might not trigger proper registration  
**Fix**: Enhanced with proper HubSpot UI components and structure

### **5. Extension ID Naming**
**Issue**: Generic "test-card" might conflict with system  
**Fix**: Changed to descriptive "glean-strategic-card"

## **What This Latest Attempt Tests**

### **Hypothesis 1**: Platform Version Issue
- **Test**: 2023.2 vs 2025.1 extension registration
- **Expected**: If 2023.2 works, it's a 2025.1 platform bug

### **Hypothesis 2**: Schema Format Issue  
- **Test**: Array format vs object format
- **Expected**: If array works, 2025.1 schema requirements changed

### **Hypothesis 3**: Component Registration Issue
- **Test**: Enhanced component vs minimal component
- **Expected**: If enhanced works, minimal component wasn't triggering registration

### **Hypothesis 4**: File Path Issue
- **Test**: Relative path resolution
- **Expected**: If path fix works, build system path handling issue

## **Expected Results**

### **If Build #3 Succeeds and Extensions Register**:
✅ **Success!** - We found the configuration issue  
✅ **Next Steps**: Gradually upgrade back to 2025.1 to identify exact breaking change

### **If Build #3 Succeeds but Extensions Still Don't Register**:
❌ **Platform Issue Confirmed** - Not a configuration problem  
❌ **Next Steps**: Escalate to HubSpot Support with this evidence

### **If Build #3 Fails**:
❌ **Configuration Error** - Need to fix the 2023.2 setup  
❌ **Next Steps**: Debug the specific build failure

## **What We'll Know After This Test**

**Success Case**: We can fix this ourselves by finding the right configuration  
**Failure Case**: This is definitely a HubSpot platform issue requiring support  

## **Alternative Approaches (If This Fails)**

### **1. Different Extension Types**
- Try `crm-sidebar` instead of `crm-card`
- Try `crm-modal` for different registration path

### **2. Different Contexts**
- Try `crm.record.contact.view` instead of company
- Try multiple contexts in array

### **3. Different File Structure**
- Move component to root of extensions directory
- Try different file naming conventions

### **4. Manual Registration**
- Check if extensions need manual activation in HubSpot UI
- Look for "Register Extension" buttons or settings

## **Timeline**

**Wait 2-3 minutes** for Build #3 to complete  
**Check Extensions section** in Developer Portal  
**Report results** - this will determine our next steps

## **Success Criteria for This Test**

✅ **Build succeeds** with 2023.2 platform  
✅ **Extension appears** in Extensions section  
✅ **Extension is configurable** in Company record sidebar  
✅ **Component renders** with "Strategic Account Plan" title  

If this works, we've solved the problem. If not, we have definitive proof it's a platform issue. 