const axios = require('axios');

function gatewayPublicUrl() {
  return (process.env.OAUTH_GATEWAY_PUBLIC_URL || 'http://localhost:5000').replace(/\/$/, '');
}

function redirectUri(provider) {
  const custom = process.env[`OAUTH_${provider.toUpperCase()}_REDIRECT_URI`];
  if (custom) return custom;
  return `${gatewayPublicUrl()}/api/auth/oauth/${provider}/callback`;
}

function getGoogleAuthUrl(state) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Chưa cấu hình GOOGLE_CLIENT_ID');
  }
  const uri = redirectUri('google');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: uri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function getFacebookAuthUrl(state) {
  const clientId = process.env.FACEBOOK_APP_ID;
  if (!clientId) {
    throw new Error('Chưa cấu hình FACEBOOK_APP_ID');
  }
  const uri = redirectUri('facebook');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: uri,
    state,
    scope: 'email,public_profile',
  });
  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

function getGithubAuthUrl(state) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    throw new Error('Chưa cấu hình GITHUB_CLIENT_ID');
  }
  const uri = redirectUri('github');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: uri,
    state,
    scope: 'read:user user:email',
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

function getAuthorizationUrl(provider, state) {
  switch (provider) {
    case 'google':
      return getGoogleAuthUrl(state);
    case 'facebook':
      return getFacebookAuthUrl(state);
    case 'github':
      return getGithubAuthUrl(state);
    default:
      throw new Error('Provider OAuth không hợp lệ');
  }
}

async function exchangeGoogleCode(code) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const uri = redirectUri('google');
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: uri,
    grant_type: 'authorization_code',
  });
  const { data } = await axios.post('https://oauth2.googleapis.com/token', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  const accessToken = data.access_token;
  const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return {
    providerId: String(profile.id),
    email: profile.email,
    firstName: profile.given_name || (profile.name ? profile.name.split(' ')[0] : '') || 'User',
    lastName:
      profile.family_name || (profile.name ? profile.name.split(' ').slice(1).join(' ') : '') || '',
    avatarUrl: profile.picture || null,
  };
}

async function exchangeFacebookCode(code) {
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  const uri = redirectUri('facebook');
  const tokenParams = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: uri,
    code,
  });
  const { data: tokenData } = await axios.get(
    `https://graph.facebook.com/v18.0/oauth/access_token?${tokenParams.toString()}`
  );
  const accessToken = tokenData.access_token;
  const { data: me } = await axios.get('https://graph.facebook.com/me', {
    params: {
      fields: 'id,name,email,picture.type(large)',
      access_token: accessToken,
    },
  });
  const email = me.email;
  if (!email) {
    throw new Error('Facebook không trả email — hãy cấp quyền email cho ứng dụng');
  }
  const pic = me.picture?.data?.url || null;
  const nameParts = (me.name || 'User').trim().split(/\s+/);
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts.slice(1).join(' ') || '';
  return {
    providerId: String(me.id),
    email,
    firstName,
    lastName,
    avatarUrl: pic,
  };
}

async function exchangeGithubCode(code) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const uri = redirectUri('github');
  const { data } = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: uri,
    },
    { headers: { Accept: 'application/json' } }
  );
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }
  const accessToken = data.access_token;
  const { data: user } = await axios.get('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  });
  const { data: emails } = await axios.get('https://api.github.com/user/emails', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
    },
  });
  const primary = emails.find((e) => e.primary) || emails.find((e) => e.verified) || emails[0];
  const email = primary?.email || user.email;
  if (!email) {
    throw new Error('GitHub không có email công khai — hãy bật email trong cài đặt GitHub');
  }
  const nameParts = (user.name || user.login || 'User').trim().split(/\s+/);
  const firstName = nameParts[0] || 'User';
  const lastName = nameParts.slice(1).join(' ') || '';
  return {
    providerId: String(user.id),
    email,
    firstName,
    lastName,
    avatarUrl: user.avatar_url || null,
  };
}

async function exchangeCode(provider, code) {
  switch (provider) {
    case 'google':
      return exchangeGoogleCode(code);
    case 'facebook':
      return exchangeFacebookCode(code);
    case 'github':
      return exchangeGithubCode(code);
    default:
      throw new Error('Provider OAuth không hợp lệ');
  }
}

module.exports = {
  getAuthorizationUrl,
  exchangeCode,
  redirectUri,
};
