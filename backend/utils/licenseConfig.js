// backend/utils/licenseConfig.js

export const LICENSE_CONFIG = {
  basic: {
    name: "Basic Lease",
    streamLimit: "50,000",
    distributionLimit: 2000,
    fileFormats: ["MP3"],
    isExclusive: false,
    commercialUse: false,
    creditRequired: true,
    description: "Non-commercial use only. MP3 delivery."
  },
  premium: {
    name: "Premium Lease",
    streamLimit: "500,000",
    distributionLimit: 10000,
    fileFormats: ["MP3", "WAV"],
    isExclusive: false,
    commercialUse: true,
    creditRequired: true,
    description: "Commercial use allowed. MP3 + WAV delivery."
  },
  exclusive: {
    name: "Exclusive Rights",
    streamLimit: "Unlimited",
    distributionLimit: null,
    fileFormats: ["MP3", "WAV", "Stems"],
    isExclusive: true,
    commercialUse: true,
    creditRequired: false,
    description: "Full exclusive rights. Beat retired from marketplace."
  }
};

// Map subscription plan to allowed license types
export const PLAN_LICENSE_ACCESS = {
  Free:     ["basic"],
  Standard: ["basic", "premium"],
  Pro:      ["basic", "premium", "exclusive"]
};

// Revenue share per seller subscription plan
export const REVENUE_SHARE = {
  Free:     0.60,  // seller keeps 60%, Dhuun keeps 40%
  Standard: 0.80,
  Pro:      0.95
};