import { Platform } from 'react-native';

export type ContactAction = { kind: 'call' | 'text'; label: string; url: string };

const NUMBER = '(\\d[\\d-]*\\d|\\d)';
const digits = (n: string) => n.replace(/\D/g, '');

/** An SMS address with a first word filled in: Android reads "?body=", iOS "&body=". */
function smsUrl(number: string, body: string | undefined, platform: string): string {
  const to = `sms:${digits(number)}`;
  if (!body) return to;
  return `${to}${platform === 'ios' ? '&' : '?'}body=${encodeURIComponent(body)}`;
}

/**
 * The buttons a resource's contact line offers, in its own words: "Call or text 988" gives Call 988 and
 * Text 988, "Text HOME to 741741" gives one Text button with HOME filled in, "Call 1-866-488-7386, or
 * text START to 678-678" gives both. A line with no number ("Support groups on Zoom") gives none.
 */
export function contactActions(contact: string, platform: string = Platform.OS): ContactAction[] {
  const out: ContactAction[] = [];
  const seen = new Set<string>();
  const add = (a: ContactAction) => {
    if (seen.has(a.url)) return;
    seen.add(a.url);
    out.push(a);
  };
  for (const clause of contact.split(/,\s*|;\s*/)) {
    const both = new RegExp(`\\bcall or text ${NUMBER}`, 'i').exec(clause);
    if (both) {
      add({ kind: 'call', label: `Call ${both[1]}`, url: `tel:${digits(both[1])}` });
      add({ kind: 'text', label: `Text ${both[1]}`, url: smsUrl(both[1], undefined, platform) });
      continue;
    }
    const keyword = new RegExp(`\\btext (\\S+) to ${NUMBER}`, 'i').exec(clause);
    if (keyword) {
      add({ kind: 'text', label: `Text ${keyword[1]} to ${keyword[2]}`, url: smsUrl(keyword[2], keyword[1], platform) });
      continue;
    }
    const text = new RegExp(`\\btext ${NUMBER}`, 'i').exec(clause);
    if (text) add({ kind: 'text', label: `Text ${text[1]}`, url: smsUrl(text[1], undefined, platform) });
    const call = new RegExp(`\\bcall ${NUMBER}`, 'i').exec(clause);
    if (call) add({ kind: 'call', label: `Call ${call[1]}`, url: `tel:${digits(call[1])}` });
  }
  return out;
}
