/** @type {{ key: 'instagram' | 'facebook' | 'x' | 'googleBusiness', label: string, placeholder: string, hosts: string[] }[]} */
export const socialProfiles = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/your-profile/', hosts: ['instagram.com', 'www.instagram.com'] },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/your-page/', hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.me'] },
  { key: 'x', label: 'X', placeholder: 'https://x.com/your-profile', hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'] },
  { key: 'googleBusiness', label: 'Google Business Profile', placeholder: 'https://maps.app.goo.gl/your-profile', hosts: ['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl', 'g.page', 'share.google'] },
];

export function safeSocialUrl(value, hosts) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && hosts.includes(url.hostname) && !url.username && !url.password && !url.port ? url.href : '';
  } catch { return ''; }
}
