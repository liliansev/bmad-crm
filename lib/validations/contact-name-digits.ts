// Frozen Unicode 17.0 Nd ranges, shared with migration 20260908120000.
// Reproduce with Node 24.20.0 (process.versions.unicode === "17.0"): enumerate
// cp=0..0x10ffff, keep /\p{Nd}/u.test(String.fromCodePoint(cp)), coalesce adjacent
// code points into ranges, render endpoints with String.fromCodePoint.
// Explicit ranges keep browser, Node and PostgreSQL validation identical.
export const CONTACT_NAME_DIGITS = /[0-9٠-٩۰-۹߀-߉०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯෦-෯๐-๙໐-໙༠-༩၀-၉႐-႙០-៩᠐-᠙᥆-᥏᧐-᧙᪀-᪉᪐-᪙᭐-᭙᮰-᮹᱀-᱉᱐-᱙꘠-꘩꣐-꣙꤀-꤉꧐-꧙꧰-꧹꩐-꩙꯰-꯹０-９𐒠-𐒩𐴰-𐴹𐵀-𐵉𑁦-𑁯𑃰-𑃹𑄶-𑄿𑇐-𑇙𑋰-𑋹𑑐-𑑙𑓐-𑓙𑙐-𑙙𑛀-𑛉𑛐-𑛣𑜰-𑜹𑣠-𑣩𑥐-𑥙𑯰-𑯹𑱐-𑱙𑵐-𑵙𑶠-𑶩𑷠-𑷩𑽐-𑽙𖄰-𖄹𖩠-𖩩𖫀-𖫉𖭐-𖭙𖵰-𖵹𜳰-𜳹𝟎-𝟿𞅀-𞅉𞋰-𞋹𞓰-𞓹𞗱-𞗺𞥐-𞥙🯰-🯹]/u;
