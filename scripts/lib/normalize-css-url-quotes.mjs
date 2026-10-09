// HTML-escaped paired quote styles around the same CSS URL are equivalent.
// Do not decode or otherwise normalize URLs, declarations or unpaired quotes.
export function normalizeCssUrlQuoteEntities(style) {
  return String(style).replace(/url\((&(?:#39|quot);)([^<>]*?)\1\)/g, (_all,_quote,url)=>`url(&quot;${url}&quot;)`);
}
