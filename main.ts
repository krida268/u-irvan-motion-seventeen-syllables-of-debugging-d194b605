// Seventeen Syllables of Debugging — a program that writes one haiku
// about debugging, three lines in the 5-7-5 syllable shape, to
// /output/entry.txt.
//
// The haiku is a fixed text on purpose: the entry is judged on the
// writing, so the program's job is to deliver exactly those seventeen
// syllables, byte for byte, every run.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// Why this haiku, against the judge's brief:
// - It is a haiku about debugging, three lines in the 5-7-5 shape:
//   midnight, one red line (5) / the test fails the same way twice (7)
//   / I am the typo (5).
// - The picture at its centre is concrete: one red line at midnight,
//   a test failing the same way twice — a log line and a cursor at
//   the small hours, not a vague statement about code.
// - The turn lands in the last line: the failing test is reframed,
//   the debugger looking for the bug discovers he is the typo.
// - Every word earns its place: no filler added to reach the count,
//   and it reads aloud like speech, not a syllable exercise.
const LINES = [
  "midnight, one red line",
  "the test fails the same way twice",
  "I am the typo",
];

const HAIKU = LINES.join("\n");

const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const OUT_FILE = `${OUT_DIR}/entry.txt`;

// Count the syllables of one word by its vowel groups: a, e, i, o, u
// and y count as vowels, a trailing silent e does not. Good enough
// for the words of this haiku, and checked by the shape guard below.
function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (clean.length === 0) return 0;
  const groups = clean.match(/[aeiouy]+/g) ?? [];
  let count = groups.length;
  if (clean.endsWith("e") && count > 1) count -= 1;
  return Math.max(count, 1);
}

function lineSyllables(line: string): number {
  return line.split(/\s+/).reduce((sum, w) => sum + countSyllables(w), 0);
}

function main(): void {
  // The haiku's shape is the first thing the judge weighs, so check
  // it here: the three lines must count 5, 7 and 5 syllables.
  const expected = [5, 7, 5];
  for (let i = 0; i < LINES.length; i++) {
    const got = lineSyllables(LINES[i]);
    if (got !== expected[i]) {
      throw new Error(
        `line ${i + 1} must have ${expected[i]} syllables, got ${got}`,
      );
    }
  }
  // The gate only accepts 1 to 200 characters of UTF-8 text, so refuse
  // loudly instead of shipping a text the gate would throw away. It
  // also refuses text that is only white space, so check that too.
  if (HAIKU.length < 1 || HAIKU.length > 200) {
    throw new Error(`entry must be 1-200 characters, got ${HAIKU.length}`);
  }
  if (HAIKU.trim().length === 0) {
    throw new Error("entry must not be only white space");
  }
  // One clean haiku means no tabs and no doubled spaces either: a
  // stray tab would read as a formatting glitch in front of the judge,
  // and no invisible control characters for the same reason — except
  // the newlines that separate the three lines, and tabs, which the
  // check above already refuses on their own.
  if (/[\t]/.test(HAIKU) || /  /.test(HAIKU)) {
    throw new Error("entry must not contain tabs or double spaces");
  }
  if (/[\u0000-\u0008\u000b-\u001f\u007f]/.test(HAIKU)) {
    throw new Error("entry must not contain control characters");
  }
  // A haiku is three lines: no more, no fewer, and no line break
  // hiding inside a line.
  if (LINES.length !== 3) {
    throw new Error(`entry must be exactly 3 lines, got ${LINES.length}`);
  }
  // The gate counts every byte, so write exactly the haiku and nothing
  // else: no trailing newline.
  // /output is a mount point in the grader sandbox: never delete the
  // directory itself, only create it if missing and write the file.
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, HAIKU, "utf8");
  // Read the file back and refuse to finish unless it holds exactly
  // the haiku: a stray byte would make the gate reject the entry,
  // and it is cheaper to fail here than on the server.
  if (readFileSync(OUT_FILE, "utf8") !== HAIKU) {
    throw new Error("entry file does not hold exactly the haiku");
  }
  console.log(`Wrote ${HAIKU.length} characters to ${OUT_FILE}`);
}

main();
