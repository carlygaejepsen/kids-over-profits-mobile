export type Run = { text: string; url?: string };

/** Split "words with a [link](https://example.org) inside" into runs the screen draws as text and links. */
export function parseMarkdownLinks(input: string): Run[] {
  const runs: Run[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(input)) !== null) {
    if (m.index > last) runs.push({ text: input.slice(last, m.index) });
    runs.push({ text: m[1], url: m[2] });
    last = m.index + m[0].length;
  }
  if (last < input.length) runs.push({ text: input.slice(last) });
  return runs;
}
