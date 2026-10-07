// The staging profile blocks the whole site, including preserved game payloads.
export const STAGING_ROBOTS_TEXT = 'User-agent: *\nDisallow: /\n';

export function stagingRobotsErrors(text) {
  const lines = String(text).split(/\r?\n/u)
    .map(line => line.replace(/#.*/u, '').trim()).filter(Boolean);
  if (lines.some(line => /^Allow\s*:\s*\/(?:\s|$)/iu.test(line))) {
    return ['Staging robots.txt contains a conflicting root Allow rule.'];
  }
  if (lines.length !== 2 || !/^User-agent\s*:\s*\*$/iu.test(lines[0]) ||
      !/^Disallow\s*:\s*\/$/iu.test(lines[1])) {
    return ['Staging robots.txt must contain one wildcard User-agent group with only Disallow: /.'];
  }
  return [];
}
