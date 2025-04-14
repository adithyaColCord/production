/**
 * Safe cookie parsing utility to prevent "Failed to parse cookie" errors
 */

/**
 * Safely parse a cookie value that might be JSON or base64 encoded
 */
export function safeJSONParse(str: string | undefined | null) {
    if (!str) return null;
    
    // Check if it starts with base64 prefix
    if (str.startsWith('base64-')) {
      return str; // Return as is, don't try to parse
    }
    
    try {
      return JSON.parse(str);
    } catch (e) {
      // If JSON parsing fails, return the original string
      return str;
    }
  }
  
  /**
   * Debug utility to help identify where cookie parsing errors are happening
   */
  export function setupCookieParsingDebug() {
    if (typeof window !== 'undefined') {
      const originalParse = JSON.parse;
      JSON.parse = function(text) {
        try {
          return originalParse(text);
        } catch (e) {
          if (text && typeof text === 'string' && text.startsWith('base64-')) {
            console.warn('Attempted to parse base64 cookie as JSON:', new Error().stack);
            return text; // Return the original string instead of throwing
          }
          throw e;
        }
      };
    }
  }