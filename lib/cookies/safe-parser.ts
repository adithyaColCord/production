/**
 * This utility helps prevent cookie parsing errors with Supabase auth cookies
 */

/**
 * Safely extract and handle Supabase session tokens from cookies
 * @param cookieValue The raw cookie value
 */
export function safeParseToken(cookieValue: string | undefined | null) {
    if (!cookieValue) return null;
    
    // If the cookie starts with base64-, it's a Supabase session token
    if (typeof cookieValue === 'string' && cookieValue.startsWith('base64-')) {
      return cookieValue; // Return as-is, don't try to parse
    }
    
    try {
      return JSON.parse(cookieValue);
    } catch {
      return cookieValue; // If parsing fails, return the original value
    }
  }
  
  /**
   * Setup global patching for JSON.parse to avoid cookie parsing errors
   */
  export function setupSafeJsonParsing() {
    if (typeof window !== 'undefined') {
      const originalParse = JSON.parse;
      JSON.parse = function(text: string) {
        if (typeof text === 'string' && text.startsWith('base64-')) {
          console.debug('Intercepted attempt to parse Supabase token as JSON');
          return text; // Return the original string instead of throwing an error
        }
        return originalParse(text);
      };
    }
  }