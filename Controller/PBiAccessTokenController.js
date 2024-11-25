const axios = require('axios');
 
// Variables
const clientId = '5dbd81bd-24c2-40bc-bee6-bf0e34529491'; // Your Client ID
const clientSecret = 'Xjr8Q~gImtMAEg_I3Ld_lSA5oAfy2FBRKB.dSa~J'; // Your Client Secret
const tenantId = '07bb39ed-9c90-4f4f-8ea7-dae5ab5006d4'; // Your Tenant ID
const reportId = '279264e7-5394-4a94-b8eb-da9c65967003'; // Your Report ID
const datasetId = '61554d63-b649-4e46-b5d4-c1ee239fa8c3'; // Your Dataset ID
const groupId = '4678ecce-a887-4d9c-ac37-082258bcafaa'; // Your Group/Workspace ID
const authorityUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
const scope = 'https://analysis.windows.net/powerbi/api/.default';
 
// Step 1: Get Access Token
const getAccessToken = async () => {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('scope', scope);
 
  try {
    const response = await axios.post(authorityUrl, params);
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching access token:', error);
    return null;
  }
};
 
// Step 2: Generate Embed Token without RLS
const generateEmbedToken = async (accessToken) => {
  const powerBiApiUrl = `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports/${reportId}/GenerateToken`;
 
  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
 
  const body = {
    datasets: [
      {
        id: datasetId,
      },
    ],
    reports: [
      {
        id: reportId,
      },
    ],
  };
 
  try {
    const response = await axios.post(powerBiApiUrl, body, config);
    return response.data.token;
  } catch (error) {
    console.error('Error generating embed token:', error);
    return null;
  }
};
 
// Step 3: Generate Embed URL with the Token
const getEmbedUrl = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('Failed to get access token.');
    return;
  }
 
  const embedToken = await generateEmbedToken(accessToken);
  if (!embedToken) {
    console.error('Failed to generate embed token.');
    return;
  }
 
  const embedUrl = `https://app.powerbi.com/reportEmbed?reportId=${reportId}&groupId=${groupId}&config={"accessToken": "${embedToken}"}`;
  console.log('Embed URL:', embedUrl);
  return embedUrl;
};
 
// Run the function
getEmbedUrl();