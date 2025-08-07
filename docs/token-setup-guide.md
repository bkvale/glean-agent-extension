# Glean API Token Setup Guide

This guide explains how to configure the Glean API token for team-wide use.

## 🎯 Setup Method: Environment Variables

The extension uses HubSpot environment variables to store the Glean API token securely. This approach allows:
- ✅ **One-time setup** - Admin configures once for the entire team
- ✅ **No individual token entry** - Users don't need to enter tokens
- ✅ **Secure storage** - Token stored in HubSpot's secure environment
- ✅ **Easy updates** - Admin can update token centrally

## 📋 Setup Steps

### For HubSpot Admins

1. **Go to HubSpot Developer Portal**
   - Navigate to your project: "Glean Test Card"
   - Click "Manage app"

2. **Access Environment Variables**
   - Look for "Environment Variables" or "Settings" section
   - Find the `GLEAN_API_TOKEN` variable

3. **Set the Token Value**
   - Enter your Glean API token: `LOlifCRAD8smihnO8ETHiku7Rmy5zDO5hEgTruy6luQ=`
   - Save the configuration

4. **Redeploy (if needed)**
   - Some platforms require a redeploy after environment variable changes
   - Trigger a new build if the token isn't immediately available

### For End Users

**No setup required!** Once the admin configures the environment variable:
- ✅ Extension works immediately for all team members
- ✅ No token entry needed
- ✅ Just click "Generate Plan" and it works

## 🔍 Troubleshooting

### If "Generate Plan" Button is Disabled

**Symptom**: Button shows as disabled with warning message
**Cause**: Environment variable not set or not loaded
**Solution**: 
1. Admin should verify `GLEAN_API_TOKEN` is set in HubSpot Developer Portal
2. Try refreshing the page or clearing browser cache
3. Check if a redeploy is needed

### If API Calls Fail

**Symptom**: "Generate Plan" works but returns errors
**Cause**: Invalid or expired token
**Solution**:
1. Admin should verify the token value is correct
2. Test the token manually with Glean API
3. Update environment variable with new token if needed

## 🛠 Alternative Approaches (if environment variables don't work)

### Option 1: Hardcode Token (Less Secure)
If environment variables aren't supported, we can hardcode the token in the source code:
- ✅ Simple and works immediately
- ❌ Token visible in source code
- ❌ Requires code change to update token

### Option 2: HubSpot Custom Properties
Store the token in a HubSpot custom property:
- ✅ Secure storage in HubSpot
- ✅ Admin can manage via HubSpot UI
- ❌ More complex implementation

### Option 3: External API/Service
Use a separate service to manage tokens:
- ✅ Very secure
- ✅ Centralized management
- ❌ Requires additional infrastructure

## 📞 Support

If environment variables don't work in your HubSpot setup:
1. **Check HubSpot Documentation** - Look for environment variable support in UI Extensions
2. **Contact HubSpot Support** - Ask about environment variable configuration
3. **Fallback Options** - We can implement one of the alternative approaches above

---

**Recommended**: Try environment variables first. If they don't work, we can quickly switch to a hardcoded approach for immediate functionality. 