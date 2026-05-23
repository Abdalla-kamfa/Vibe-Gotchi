const LANG_PREFIXES: Record<string, string[]> = {
  python:     ["Pyro", "Serpentine", "Pythia", "Anaconda", "Cobalt"],
  javascript: ["JSX", "Promisey", "Asynco", "Callbackus", "Nodestorm"],
  typescript: ["Typed", "Stricto", "Inferred", "Generic"],
  rust:       ["Ferrus", "Borrow", "Crabby", "Rustacle", "Unsafe"],
  go:         ["Gopher", "Goroutine", "Gordo", "Channely"],
  java:       ["Verbose", "Beano", "JVM", "Springy"],
  "c++":      ["Segfault", "Pointers", "Destructor"],
  ruby:       ["Gemstone", "Railsy", "Rubyx"],
  php:        ["Lampy", "Composter", "Artisan"],
  swift:      ["Optio", "Swiftly", "Cupertino"],
};

const SUFFIXES = [
  "the Magnificent", "of Doom", "Prime", "Monster", "Beast",
  "the Wise", "Omega", "Ultra", "Reborn", "the Destroyer",
  "Supreme", "X", "Jr.", "the Sleepless", "of the Void",
  "Reloaded", "Ascended", "the Merciless", "404",
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

export function generatePetName(username: string, topLanguage: string): string {
  const lang = topLanguage.toLowerCase();
  const prefixes = LANG_PREFIXES[lang] ?? ["Vibe", "Commit", "Merge", "Fork", "Git"];
  const h = hash(username.toLowerCase());
  const prefix = prefixes[h % prefixes.length];
  const suffix = SUFFIXES[(h >>> 4) % SUFFIXES.length];
  return `${prefix} ${suffix}`;
}
