const msal = require('@azure/msal-node');
require('dotenv').config();

// API endpoint to get the Power BI access token
const AccessToken = async (req, res) => {
  // MSAL Configuration for Azure AD Authentication
  const msalConfig = {
    auth: {
      clientId: process.env.CLIENT_ID,
      authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`, // Azure AD tenant ID
      clientSecret: process.env.CLIENT_SECRET,
    },
  };

  const cca = new msal.ConfidentialClientApplication(msalConfig);

  const tokenRequest = {
    scopes: ['https://analysis.windows.net/powerbi/api/.default'], // Power BI API scope
    forceRefresh: true, // Ensure to bypass cache and get a fresh token
  };

  try {
    // Get token using client credentials flow
    const response = await cca.acquireTokenByClientCredential(tokenRequest);
    const accessToken = response.accessToken;

    res.json({ accessToken });
  } catch (error) {
    console.error('Error acquiring token:', error);
    res.status(500).json({ error: 'Failed to acquire access token' });
  }
};

module.exports = { AccessToken };
