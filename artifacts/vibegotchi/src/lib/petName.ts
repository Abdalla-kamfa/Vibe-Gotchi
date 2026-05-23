const LANG_PREFIXES: Record<string, string[]> = {
  python:     ["Pyro", "Serpentine", "Pythora", "Wyrmcode"],
  javascript: ["Jscribe", "Nodeling", "Asyncra", "Promisio"],
  typescript: ["Typheus", "Strictra", "Infernus", "Generico"],
  rust:       ["Ferris", "Oxidus", "Borrowck", "Lifetima"],
  go:         ["Goroutine", "Gopher", "Concurra", "Channelio"],
  java:       ["Verbose", "Beano", "JVM", "Springy"],
  "c++":      ["Segfault", "Pointers", "Destructor"],
  ruby:       ["Gemstone", "Railsy", "Rubyx"],
  php:        ["Lampy", "Composter", "Artisan"],
  swift:      ["Optio", "Swiftly", "Cupertino"],
};
const DEFAULT_PREFIXES = ["Commitron", "Pushling", "Mergeling", "Rebasura"];

const SUFFIXES = [
  "the Mighty", "of the Void", "the Undeployed",
  "the Legendary", "who Ships", "the Sleeper",
  "of Main Branch", "the Merciless", "Ascended",
  "of the Void", "404", "Reloaded",
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generatePetName(username: string, topLanguage: string): string {
  const lang = topLanguage.toLowerCase();
  const prefixes = LANG_PREFIXES[lang] ?? DEFAULT_PREFIXES;
  const h = hash(username.toLowerCase());
  const prefix = prefixes[h % prefixes.length];
  const suffix = SUFFIXES[(h >>> 4) % SUFFIXES.length];
  return `${prefix} ${suffix}`;
}
