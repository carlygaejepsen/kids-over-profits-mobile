import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchAdminTools, signOutEverywhere, startAdminSession } from '@/api/admin';
import { groupTools } from '@/app/(tabs)/admin';
import { clearAdminSession, hasAdminSession, isSiteUrl, loginRedirect, markAdminSession } from '@/lib/adminSession';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }), useFocusEffect: jest.fn() }));

const creds = { username: 'dani', appPassword: 'abcd efgh ijkl' };

function fakeFetch(status: number, body: unknown) {
  return jest.fn(async () => ({ status, ok: status >= 200 && status < 300, json: async () => body })) as unknown as jest.Mock & typeof fetch;
}

describe('login page detection', () => {
  it('answers the plain login form with its redirect_to', () => {
    expect(loginRedirect('https://kidsoverprofits.org/wp-login.php?redirect_to=https%3A%2F%2Fkidsoverprofits.org%2Fwp-admin%2Fadmin.php%3Fpage%3Dkop-fornits&reauth=1')).toBe(
      'https://kidsoverprofits.org/wp-admin/admin.php?page=kop-fornits',
    );
    expect(loginRedirect('https://www.kidsoverprofits.org/wp-login.php')).toBe('https://kidsoverprofits.org/wp-admin/');
  });
  it('never undoes a sign-out, and ignores other sites and pages', () => {
    expect(loginRedirect('https://kidsoverprofits.org/wp-login.php?action=logout&_wpnonce=x')).toBeNull();
    expect(loginRedirect('https://kidsoverprofits.org/wp-login.php?loggedout=true')).toBeNull();
    expect(loginRedirect('https://example.com/wp-login.php')).toBeNull();
    expect(loginRedirect('https://kidsoverprofits.org/wp-admin/')).toBeNull();
  });
  it('keeps only the site in the web view', () => {
    expect(isSiteUrl('https://kidsoverprofits.org/wp-admin/')).toBe(true);
    expect(isSiteUrl('https://www.kidsoverprofits.org/x/')).toBe(true);
    expect(isSiteUrl('https://kidsoverprofits.org.evil.com/')).toBe(false);
    expect(isSiteUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('session note', () => {
  beforeEach(() => AsyncStorage.clear());
  it('lasts until cleared or expired', async () => {
    expect(await hasAdminSession()).toBe(false);
    await markAdminSession(1000);
    expect(await hasAdminSession(2000)).toBe(true);
    expect(await hasAdminSession(1000 + 361 * 86400000)).toBe(false);
    await clearAdminSession();
    expect(await hasAdminSession(2000)).toBe(false);
  });
});

describe('admin API', () => {
  it('lists site tools only, sending the login in both headers', async () => {
    const f = fakeFetch(200, {
      user: 'Dani',
      tools: [
        { category: 'Review queue', title: 'Fornits', desc: 'd', url: 'https://kidsoverprofits.org/wp-admin/admin.php?page=kop-fornits' },
        { category: 'X', title: 'Elsewhere', desc: '', url: 'https://example.com/' },
      ],
    });
    const r = await fetchAdminTools(creds, f);
    expect(r.user).toBe('Dani');
    expect(r.tools.map((t) => t.title)).toEqual(['Fornits']);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://kidsoverprofits.org/wp-json/kop/v1/app/tools');
    expect(init.headers.Authorization).toMatch(/^Basic /);
    expect(init.headers['X-KOP-Authorization']).toBe(init.headers.Authorization);
  });
  it('names a non-admin account', async () => {
    await expect(fetchAdminTools(creds, fakeFetch(403, { code: 'rest_forbidden' }))).rejects.toThrow('not an administrator');
  });
  it('asks for a session landing on the tool', async () => {
    const f = fakeFetch(200, { url: 'https://kidsoverprofits.org/app-login/?t=ab12' });
    await expect(startAdminSession(creds, 'https://kidsoverprofits.org/wp-admin/', f)).resolves.toBe('https://kidsoverprofits.org/app-login/?t=ab12');
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ redirect: 'https://kidsoverprofits.org/wp-admin/' });
  });
  it('signs out everywhere', async () => {
    const f = fakeFetch(200, { signed_out: true });
    await signOutEverywhere(creds, f);
    expect(f.mock.calls[0][0]).toBe('https://kidsoverprofits.org/wp-json/kop/v1/app/signout');
    expect(f.mock.calls[0][1].method).toBe('POST');
  });
});

describe('groupTools', () => {
  const tools = [
    { category: 'Review queue', title: 'Fornits', desc: 'survivor forum', url: 'u1' },
    { category: 'Records & editors', title: 'Glossary Editor', desc: '', url: 'u2' },
    { category: 'Review queue', title: 'Drive Docs', desc: '', url: 'u3' },
  ];
  it('keeps the site order and filters on title, description and category', () => {
    expect(groupTools(tools, '').map((g) => [g.category, g.tools.length])).toEqual([
      ['Review queue', 2],
      ['Records & editors', 1],
    ]);
    expect(groupTools(tools, 'forum').map((g) => g.tools[0].title)).toEqual(['Fornits']);
    expect(groupTools(tools, 'zzz')).toEqual([]);
  });
});
