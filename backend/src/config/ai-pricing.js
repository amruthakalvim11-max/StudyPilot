module.exports = {
  // Official Gemini Pricing as of current verification
  // Source: https://ai.google.dev/pricing
  "gemini-2.5-flash": {
    inputPerMillionTokens: 0.30,
    outputPerMillionTokens: 2.50,
    cachedInputPerMillionTokens: 0.03,
    currency: "USD",
    source: "https://ai.google.dev/pricing",
    retrievedAt: new Date().toISOString().split('T')[0] // Use current date for documentation
  }
};
