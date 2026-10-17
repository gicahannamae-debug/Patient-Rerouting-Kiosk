export type KioskLanguage = "en" | "ceb";

export const localize = (
  language: KioskLanguage,
  english: string,
  cebuano: string,
) => (language === "ceb" ? cebuano : english);
