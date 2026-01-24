import type { Account } from 'appwrite';

type OAuthProvider = 'google' | 'github';

const PROVIDER_API: Record<OAuthProvider, { field: string; url: string }> = {
  google: { url: 'https://www.googleapis.com/oauth2/v2/userinfo', field: 'picture' },
  github: { url: 'https://api.github.com/user', field: 'avatar_url' },
};

const PREFS_KEY: Record<OAuthProvider, string> = {
  google: 'avatarGoogle',
  github: 'avatarGithub',
};

export async function syncUserAvatar(account: Account): Promise<void> {
  const session = await account.getSession({ sessionId: 'current' });
  const provider = session.provider as OAuthProvider;
  const { providerAccessToken } = session;

  if (!providerAccessToken || !PROVIDER_API[provider]) return;

  const user = await account.get();
  const prefsKey = PREFS_KEY[provider];
  const existingAvatar = user.prefs?.[prefsKey] as string | undefined;

  // Check if stored URL is still valid
  if (existingAvatar) {
    try {
      const response = await fetch(existingAvatar, { method: 'HEAD' });

      if (response.ok) return;
    } catch {
      // URL broken, continue to fetch new one
    }
  }

  // Fetch avatar from provider API
  const { field, url } = PROVIDER_API[provider];
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${providerAccessToken}` },
  });

  if (!response.ok) return;

  const data = await response.json();
  const avatarUrl = data[field];

  if (avatarUrl) {
    await account.updatePrefs({ prefs: { ...user.prefs, [prefsKey]: avatarUrl } });
  }
}
