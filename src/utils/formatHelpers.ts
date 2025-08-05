/**
 * Utility functions for formatting values
 */

/**
 * Format number with thousand separators using Czech locale
 * @param value - Number or string to format
 * @returns Formatted string with thousand separators
 */
export const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return num.toLocaleString('cs-CZ');
};

/**
 * Format currency amount in CZK with thousand separators
 * @param value - Number or string to format
 * @returns Formatted string with currency symbol
 */
export const formatCurrency = (value: number | string): string => {
  return `${formatNumber(value)} Kč`;
};
