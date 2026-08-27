/**
 * Offline AI Logic for KisanSetu
 * Provides mock analysis and guidance when internet is unavailable.
 */

export const getOfflineCropAnalysis = (image: string | null, mode: 'health' | 'price' = 'price') => {
  // In a real app, we might use a lightweight TensorFlow.js model here.
  // For this demo, we'll return a plausible mock result.
  const crops = ['Tomato', 'Onion', 'Potato', 'Wheat', 'Rice'];
  const randomCrop = crops[Math.floor(Math.random() * crops.length)];
  
  if (mode === 'health') {
    return {
      cropName: randomCrop,
      healthStatus: Math.random() > 0.5 ? 'Healthy' : 'Diseased',
      diseaseName: Math.random() > 0.5 ? 'Early Blight' : 'Leaf Spot',
      confidence: 88,
      suggestedAction: 'Apply organic fungicide and improve soil drainage.',
      symptoms: ['Yellow spots on lower leaves', 'Browning edges', 'Slight wilting'],
      treatmentSteps: [
        'Remove and destroy infected leaves.',
        'Apply Neem oil spray every 7 days.',
        'Reduce overhead watering to keep leaves dry.'
      ],
      preventionTips: [
        'Rotate crops every season.',
        'Use disease-resistant seed varieties.',
        'Maintain proper spacing for airflow.'
      ],
      isOfflineResult: true
    };
  }

  return {
    cropName: randomCrop,
    grade: 'A',
    price: `₹${(Math.random() * 2000 + 2000).toFixed(0)}`,
    demand: Math.random() > 0.5 ? 'High' : 'Medium',
    recommendation: Math.random() > 0.6 ? 'SELL NOW' : 'WAIT',
    trend: Math.random() > 0.5 ? 'Rising' : 'Stable',
    action: 'Monitor market closely',
    confidence: 85,
    qualityFactors: [
      { trait: 'Color', status: 'Vibrant & Uniform' },
      { trait: 'Texture', status: 'Firm & Fresh' },
      { trait: 'Size', status: 'Standard Export Size' },
      { trait: 'Defects', status: 'None Visible' }
    ],
    estimatedShelfLife: '7-10 Days',
    marketIntelligence: 'Local market data suggests stable demand for this season. Prices are estimated based on historical regional averages.',
    alternativeMarkets: ['Local Mandi', 'Direct Retail', 'FPO'],
    mandiComparison: [
      { name: 'Indore Mandi', price: '₹4,200', distance: '12km', trend: 'Rising' },
      { name: 'Ujjain Mandi', price: '₹4,350', distance: '45km', trend: 'Stable' },
      { name: 'Dewas Mandi', price: '₹4,100', distance: '28km', trend: 'Falling' }
    ],
    harvestMaturity: {
      score: 85,
      status: 'Near Peak Maturity',
      suggestion: 'Harvest in 2-3 days for maximum weight and quality.',
      weatherRisk: 'Low - Clear skies predicted for next 5 days.'
    },
    verifiedCertificate: {
      id: `KS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      verifiedAt: new Date().toLocaleDateString(),
      digitalSignature: 'KS-AI-VERIFIED-2026'
    },
    isOfflineResult: true
  };
};

export const getOfflineChatResponse = (input: string) => {
  const query = input.toLowerCase();
  
  if (query.includes('yellow leaves')) {
    return "Offline Insight: Yellow leaves often mean Nitrogen deficiency. Check soil moisture.";
  }
  if (query.includes('fertilizer')) {
    return "Offline Insight: Use balanced NPK (19:19:19) for general growth. Consult local experts for specific ratios.";
  }
  if (query.includes('price')) {
    return "Offline Insight: Market prices are currently cached from your last online session. Connect to internet for live updates.";
  }
  
  return "I'm working in Offline Mode. I can help with basic crop health and fertilizer tips. Connect to the internet for full AI capabilities.";
};

/**
 * Local Storage Helpers
 */
export const saveLastResult = (data: any) => {
  localStorage.setItem('kisanSetu_lastResult', JSON.stringify({
    ...data,
    timestamp: new Date().toISOString()
  }));
};

export const getLastResult = () => {
  const data = localStorage.getItem('kisanSetu_lastResult');
  return data ? JSON.parse(data) : null;
};
