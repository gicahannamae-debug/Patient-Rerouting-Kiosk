// lib/triage/cebuano.ts
// Cebuano text. Anything missing here falls back to English, so you can translate gradually.
import type { Category } from "./types";
import type { KioskLanguage } from "@/lib/kioskLanguage";

export const CEBUANO_TEXT: Record<string, string> = {
  // ⬇ PASTE your existing CEBUANO_TEXT entries from the old PrimaryClinics.tsx here
  // New UI strings used by the updated component:
  "Questions": "Mga Pangutana",
  "Pain level": "Lebel sa Sakit",
  "None of these": "Wala niini",
  "Answer each question below.": "Tubaga ang matag pangutana sa ubos.",
  "How bad is the pain right now?": "Unsa ka grabe ang sakit karon?",
  "None": "Wala",
  "Mild": "Gamay",
  "Moderate": "Kasagaran",
  "Severe": "Grabe",
  "Very severe": "Grabe kaayo",
  "No pain": "Walay sakit",
  "Noticeable, does not limit activity": "Mabati pero dili makababag sa buluhaton",
  "Interferes with daily activity": "Makababag sa adlaw-adlaw nga buluhaton",
  "Limits most activity": "Makababag sa kadaghanan nga buluhaton",
  "Agonizing, unbearable": "Hilabihan ug dili maagwanta",
};

export const textForLanguage = (text: string, language: KioskLanguage) =>
  language === "ceb" ? CEBUANO_TEXT[text] ?? text : text;

/** Dev helper: every English string in the data file that has no Cebuano yet. */
export function missingTranslations(categories: Category[]): string[] {
  const all = new Set<string>();
  for (const c of categories) {
    [c.label, c.shortLabel, c.description].forEach((t) => all.add(t));
    for (const cc of c.complaints) {
      all.add(cc.label);
      if (cc.sublabel) all.add(cc.sublabel);
      for (const q of cc.questions) {
        all.add(q.text);
        if (q.type === "count") { all.add(q.unit); all.add(q.short); }
        else q.options.forEach((o) => all.add(o.label));
      }
    }
  }
  return [...all].filter((t) => !CEBUANO_TEXT[t]).sort();
}