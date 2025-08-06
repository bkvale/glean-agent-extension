import React, { useState, useEffect } from 'react';
import {
  Divider,
  Text,
  Button,
  Flex,
  Box,
  LoadingSpinner,
  Alert,
  hubspot
} from '@hubspot/ui-extensions';

// Custom hook to get company data
const useCompanyData = () => {
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current company record data
    const getCompanyInfo = async () => {
      try {
        const properties = await hubspot.crm.record.getObjectProperties();
        setCompanyData({
          name: properties.name || 'Unknown Company',
          domain: properties.domain || properties.website || '',
          industry: properties.industry || '',
          annualrevenue: properties.annualrevenue || ''
        });
      } catch (error) {
        console.error('Error fetching company data:', error);
        setCompanyData({ name: 'Unknown Company', domain: '', industry: '', annualrevenue: '' });
      } finally {
        setLoading(false);
      }
    };

    getCompanyInfo();
  }, []);

  return { companyData, loading };
};

const GleanCard = () => {
  const { companyData, loading } = useCompanyData();
  const [gleanData, setGleanData] = useState(null);
  const [gleanLoading, setGleanLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load mock Glean data for development
  const loadGleanInsights = async () => {
    setGleanLoading(true);
    setError(null);
    
    try {
      // For now, we'll use mock data. In production, this would call Glean API
      // or load from a serverless function
      setTimeout(() => {
        const mockInsights = {
          strategicScore: 85,
          keyOpportunities: [
            "Expand into their emerging markets division",
            "Leverage partnership opportunities in Q2",
            "Focus on digital transformation initiatives"
          ],
          riskFactors: [
            "Budget constraints noted in recent earnings",
            "Leadership changes in procurement"
          ],
          nextActions: [
            "Schedule executive briefing on Q2 roadmap",
            "Prepare ROI analysis for digital initiatives",
            "Connect with new procurement lead"
          ]
        };
        setGleanData(mockInsights);
        setGleanLoading(false);
      }, 1500);
    } catch (err) {
      setError('Failed to load Glean insights');
      setGleanLoading(false);
    }
  };

  const openGleanAgent = () => {
    const gleanUrl = 'https://app.glean.com/chat/agents/5057a8a588c649d6b1231d648a9167c8?';
    
    // Try to pass company context if available
    if (companyData?.name) {
      const params = new URLSearchParams({
        company: companyData.name,
        ...(companyData.domain && { domain: companyData.domain }),
        ...(companyData.industry && { industry: companyData.industry })
      });
      window.open(`${gleanUrl}&${params.toString()}`, '_blank');
    } else {
      window.open(gleanUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <Box padding="medium">
        <LoadingSpinner />
        <Text>Loading company information...</Text>
      </Box>
    );
  }

  return (
    <Box padding="medium">
      <Flex direction="column" gap="medium">
        <Text variant="h3">Strategic Account Plan</Text>
        
        <Box>
          <Text variant="microcopy" color="secondary">
            AI-powered insights for: {companyData?.name}
          </Text>
        </Box>

        <Divider />

        {!gleanData ? (
          <Flex direction="column" gap="medium" align="center">
            <Text>Generate strategic insights for this account using Glean AI</Text>
            <Button 
              type="primary" 
              onClick={loadGleanInsights}
              disabled={gleanLoading}
            >
              {gleanLoading ? 'Generating Insights...' : 'Generate Strategic Plan'}
            </Button>
            <Button 
              type="secondary" 
              onClick={openGleanAgent}
            >
              Open Full Glean Agent
            </Button>
          </Flex>
        ) : (
          <Flex direction="column" gap="medium">
            {/* Strategic Score */}
            <Box>
              <Text variant="h4">Strategic Score</Text>
              <Flex align="center" gap="small">
                <Text variant="h2" color="success">{gleanData.strategicScore}/100</Text>
                <Text variant="microcopy">High potential account</Text>
              </Flex>
            </Box>

            <Divider />

            {/* Key Opportunities */}
            <Box>
              <Text variant="h4">Key Opportunities</Text>
              <Flex direction="column" gap="small">
                {gleanData.keyOpportunities.map((opportunity, index) => (
                  <Text key={index} variant="body">• {opportunity}</Text>
                ))}
              </Flex>
            </Box>

            <Divider />

            {/* Risk Factors */}
            <Box>
              <Text variant="h4">Risk Factors</Text>
              <Flex direction="column" gap="small">
                {gleanData.riskFactors.map((risk, index) => (
                  <Text key={index} variant="body" color="warning">⚠ {risk}</Text>
                ))}
              </Flex>
            </Box>

            <Divider />

            {/* Next Actions */}
            <Box>
              <Text variant="h4">Recommended Actions</Text>
              <Flex direction="column" gap="small">
                {gleanData.nextActions.map((action, index) => (
                  <Text key={index} variant="body">✓ {action}</Text>
                ))}
              </Flex>
            </Box>

            <Divider />

            <Flex gap="medium">
              <Button 
                type="secondary" 
                onClick={() => {
                  setGleanData(null);
                  loadGleanInsights();
                }}
              >
                Refresh Insights
              </Button>
              <Button 
                type="primary" 
                onClick={openGleanAgent}
              >
                Open Full Glean Agent
              </Button>
            </Flex>
          </Flex>
        )}

        {error && (
          <Alert title="Error" variant="error">
            {error}
          </Alert>
        )}
      </Flex>
    </Box>
  );
};

export default GleanCard; 