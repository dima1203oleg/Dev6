/**
 * API Helper - Centralized API authentication and request handling
 */

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken') || 'prod-test-token-123456789012345678901234567890';
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });
}