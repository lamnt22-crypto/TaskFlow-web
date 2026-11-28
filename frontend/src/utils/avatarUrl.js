/**
 * Resolves a stored avatar_url (full URL, Data URL, or backend relative path)
 * into a browser-loadable src string.
 */
export const resolveAvatarUrl = (avatarUrl) => {
  if (!avatarUrl || typeof avatarUrl !== 'string') return null;

  const trimmed = avatarUrl.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const backendOrigin = apiBase.replace(/\/api\/?$/, '');
  return `${backendOrigin}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};
