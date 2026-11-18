/** Ids that link a tab and its panel (aria-controls, aria-labelledby) */
export const tabId = (prefix: string, key: string) => `${prefix}-tab-${key}`
export const panelId = (prefix: string, key: string) => `${prefix}-panel-${key}`
