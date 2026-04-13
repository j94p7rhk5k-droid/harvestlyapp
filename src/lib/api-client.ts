import { auth } from './firebase';

/**
 * Fetch wrapper that attaches the current Firebase user's ID token as a
 * bearer token. Throws if no user is signed in.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  const token = await user.getIdToken();

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, { ...init, headers });
}
