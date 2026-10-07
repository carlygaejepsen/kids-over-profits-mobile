import { citeWords, cleanProse, isOwnSource, roleLine, usableCitations } from '@/lib/citations';

describe('isOwnSource', () => {
  it('drops citations that only point back to us', () => {
    expect(isOwnSource({ cite: 'Kids Over Profits network map', source: 'Network map', url: 'https://kidsoverprofits.org/network-map/#open=a' })).toBe(true);
    expect(isOwnSource({ url: 'https://kidsoverprofits.org/facility/hyde-school-ct/' })).toBe(true);
    expect(isOwnSource({ url: '/network-map/' })).toBe(true);
  });
  it('keeps other people’s sources', () => {
    expect(isOwnSource({ source: 'r/troubledteens wiki: page "Canyon State Academy"', url: 'https://youtu.be/abc' })).toBe(false);
    expect(isOwnSource({ source: 'SCIAD NET, the WWASP Survivor Truth archive', url: 'https://example.org/x' })).toBe(false);
  });
  it('keeps our copies of documents from elsewhere', () => {
    expect(isOwnSource({ cite: 'Woodbury Reports, October 2010, p. 2', url: 'https://kidsoverprofits.org/wp-content/uploads/2024/12/woodbury-1010.pdf#page=2' })).toBe(false);
  });
});

describe('usableCitations', () => {
  it('leaves out ours and empty ones', () => {
    const list = usableCitations([
      { cite: 'Kids Over Profits network map', url: 'https://kidsoverprofits.org/network-map/' },
      { source: 'Reuters', url: 'https://example.org/a' },
      {},
    ]);
    expect(list).toHaveLength(1);
    expect(list[0].source).toBe('Reuters');
  });
});

describe('citeWords', () => {
  it('drops the Woodbury Reports wording', () => {
    expect(citeWords({ cite: 'Woodbury Reports, October 2010, p. 2' })).toBe('');
    expect(citeWords({ source: 'Hartford Courant, 2019' })).toBe('Hartford Courant, 2019');
  });
});

describe('cleanProse', () => {
  it('removes a whole Woodbury citation and the address after it', () => {
    expect(
      cleanProse('Operator: Centers for Adolescent Recovery and Education (CARE) (Woodbury Reports, February 2009, p. 20) https://kidsoverprofits.org/wp-content/uploads/2024/12/woodbury-0209.pdf#page=20'),
    ).toBe('Operator: Centers for Adolescent Recovery and Education (CARE)');
  });
  it('leaves no "(:" or empty brackets where an address was removed', () => {
    expect(cleanProse('Serves: Female (: https://example.org/x)')).toBe('Serves: Female');
    expect(cleanProse('Serves: Female (https://example.org/x)')).toBe('Serves: Female');
    expect(cleanProse('Founded 1995 (see note)')).toBe('Founded 1995 (see note)');
  });
  it('keeps the years when only the source name is in the parentheses', () => {
    expect(cleanProse('Admissions (2009-2010, Woodbury Reports). Previously: Staff')).toBe('Admissions (2009-2010). Previously: Staff');
  });
  it('handles an issue number and page range', () => {
    expect(cleanProse('Opened in 1999 (Woodbury Reports, July 2007 (#155), pp. 21-22).')).toBe('Opened in 1999.');
  });
  it('leaves other parentheses and plain text alone', () => {
    expect(cleanProse('Runs two homes (boys and girls).')).toBe('Runs two homes (boys and girls).');
    expect(cleanProse('')).toBe('');
    expect(cleanProse(null)).toBe('');
  });
});

describe('roleLine', () => {
  it('turns a trailing year note into a comma and drops the source wording', () => {
    expect(roleLine('President (2009, Woodbury Reports)')).toBe('President, 2009');
    expect(roleLine('Executive Director (2016)')).toBe('Executive Director, 2016');
    expect(roleLine('Teacher (before 2013)')).toBe('Teacher, before 2013');
  });
  it('drops a trailing ", left"', () => {
    expect(roleLine('Director (2008, Woodbury Reports), left')).toBe('Director, 2008');
    expect(roleLine('Director, left')).toBe('Director');
  });
  it('keeps a year range and long titles', () => {
    expect(
      roleLine('NATSAP Board member, Senior Vice President - Northeast Division, Vice President (2008-2009, Woodbury Reports)'),
    ).toBe('NATSAP Board member, Senior Vice President - Northeast Division, Vice President, 2008-2009');
  });
  it('says a repeated title once', () => {
    expect(roleLine('Admissions, Business Development and Marketing, Admissions (2009-2010, Woodbury Reports)')).toBe(
      'Admissions, Business Development and Marketing, 2009-2010',
    );
    expect(roleLine('Admissions, Business Development and Marketing, Admissions')).toBe('Admissions, Business Development and Marketing');
  });
  it('drops empty parentheses and stray punctuation, and is empty for nothing', () => {
    expect(roleLine('Director ()')).toBe('Director');
    expect(roleLine(' Director, ')).toBe('Director');
    expect(roleLine('Director (interim)')).toBe('Director (interim)');
    expect(roleLine('')).toBe('');
    expect(roleLine(undefined)).toBe('');
  });
});

describe('real facility text', () => {
  const f = require('./fixtures/facility-9607.json');
  const strings: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === 'string') strings.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      // cite, source and url are the citation's own fields (the app shows them as a "(source)" link), not prose
      for (const [k, x] of Object.entries(v)) if (!['cite', 'source', 'url', 'label'].includes(k)) walk(x);
    }
  };
  walk(f.facts);
  walk(f.staff);
  walk(f.incidents);
  walk(f.summary);

  it('has no Woodbury wording or bare address left once cleaned', () => {
    const dirty = strings.filter((s) => /woodbury reports|https?:\/\//i.test(s));
    expect(dirty.length).toBeGreaterThan(0); // the fixture really holds some
    for (const s of dirty) {
      const text = cleanProse(s);
      if (/^https?:\/\//i.test(s.trim())) continue; // an address kept as its own field is not prose
      expect(text).not.toMatch(/woodbury reports/i);
      expect(text).not.toMatch(/https?:\/\//i);
    }
  });
  it('keeps no citation that points back to us', () => {
    const cites: { cite?: string; source?: string; url?: string }[] = [];
    const collect = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(collect);
      else if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        if ('cite' in o || 'source' in o) cites.push(o as { cite?: string; source?: string; url?: string });
        Object.values(o).forEach(collect);
      }
    };
    collect(f.staff);
    collect(f.fact_sources);
    expect(cites.length).toBeGreaterThan(0);
    for (const c of usableCitations(cites)) {
      expect(`${c.cite} ${c.source}`).not.toMatch(/kids over profits|network map/i);
    }
  });
});
