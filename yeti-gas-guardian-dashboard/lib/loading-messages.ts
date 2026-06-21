export const LAUNCH_LOADING_MESSAGES = [
  'Checking where your money disappeared...',
  'Consulting the Yeti...',
  'Counting gas fees...',
  'Looking for regrets...',
  'Preparing your wallet therapy session...',
  'Finding your most expensive decisions...',
  'Polishing the pocket watch...',
  'Dusting off onchain receipts...',
  'Measuring your fee trauma...',
  'Syncing with the regret ledger...',
] as const

export const WALLET_ANALYSIS_STAGES = [
  { label: 'Connecting to chains...', progress: 12 },
  { label: 'Reading transactions...', progress: 28 },
  { label: 'Calculating fees...', progress: 45 },
  { label: 'Consulting the Yeti...', progress: 62 },
  { label: 'Identifying regrets...', progress: 78 },
  { label: 'Preparing your PocketWatch report...', progress: 94 },
] as const