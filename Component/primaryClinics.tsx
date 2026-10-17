'use client';
import React, { useState } from "react";
import KioskHeader from "@/Component/kioskHeader";
import type { KioskLanguage } from "@/lib/kioskLanguage";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ClinicOption = "General Surgery" | "Internal Medicine" | "OB-GYNE" | "Pediatrics";

type StepKey = "category" | "complaint" | "details" | "pain" | "severity";
type DurationUnit = "hours" | "days" | "weeks" | "months";

type PainSet =
  | "abdomen" | "chest" | "head" | "breast" | "neck" | "flank"
  | "groin" | "pelvic" | "ear" | "joints" | "urinary" | "foot" | "injury";

/** A "how many?" question that is specific to the complaint (empty input) */
type NumberField = {
  id: string;
  label: string;    // short label used in the summary
  question: string; // what the patient sees
  unit: string;     // e.g. "times", "pads", "kg"
};

type Complaint = {
  id: string;
  label: string;
  sublabel?: string;
  systemValue: string;
  durationQuestion: string; // "How long has the fever been going on?"
  extras?: NumberField[];   // "How many times ...?"
  pain?: PainSet;           // if set, the "location" step is shown
};

type Category = {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  clinic: ClinicOption;
  complaints: Complaint[];
};

export interface PrimaryClinicsPayload {
  group_id: string;
  group_label: string;
  cc_id: string;
  cc_label: string;
  cc_label_cebuano: string;
  sub_id: string;
  sub_label: string;
  system_value: string;
  clinic: ClinicOption;
  answers: Record<string, boolean>; // kept empty for compatibility
  duration_value: number;
  duration_unit: DurationUnit;
  duration_text: string;
  extras: Record<string, number>;
  pain_locations: string[];
  severity: number; // 1 (very mild) to 5 (very severe)
  severity_label: string;
  summary_text: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const PAIN_LOCATIONS: Record<PainSet, string[]> = {
  abdomen: [
    "Upper right belly", "Upper middle (stomach area)", "Upper left belly",
    "Around the belly button", "Lower right belly", "Lower middle belly",
    "Lower left belly", "All over the belly",
  ],
  chest: [
    "Center of the chest", "Left side of the chest", "Right side of the chest",
    "Spreads to arm, neck, or jaw", "Back",
  ],
  head: ["Forehead", "One side of the head", "Back of the head", "Whole head"],
  breast: ["Left breast", "Right breast", "Both breasts", "Nipple area"],
  neck: [
    "Front of the neck (thyroid area)", "Left side of the neck",
    "Right side of the neck", "Under the jaw or near the ear",
  ],
  flank: [
    "Lower back - left", "Lower back - right",
    "Side moving down to the groin", "Whole lower back",
  ],
  groin: ["Groin - left", "Groin - right", "Scrotum or testicles", "Upper thigh crease"],
  pelvic: [
    "Lower belly - center", "Lower belly - left",
    "Lower belly - right", "Deep inside the pelvis",
  ],
  ear: ["Left ear", "Right ear", "Both ears", "Behind the ear"],
  joints: [
    "Knee", "Shoulder", "Hip", "Back", "Hands or wrists",
    "Feet or ankles", "Muscles (arms or legs)",
  ],
  urinary: [
    "Burning when peeing", "Lower belly above the pubic bone",
    "Lower back or side", "Around the genital area",
  ],
  foot: ["Toes", "Sole of the foot", "Top of the foot", "Heel", "Ankle"],
  injury: [
    "Head or face", "Shoulder or arm", "Hand or wrist", "Hip or leg",
    "Knee", "Foot or ankle", "Back", "Chest or belly",
  ],
};

const CEBUANO_TEXT: Record<string, string> = {
  "Child Health": "Kahimsog sa Bata",
  "For patients under 19 years old": "Alang sa mga pasyenteng ubos sa 19 anyos",
  "Women's & Pregnancy Health": "Kahimsog sa Kababayen-an ug Pagmabdos",
  "Women's Health": "Kahimsog sa Kababayen-an",
  "Pregnancy, periods, and women's health concerns": "Pagmabdos, regla, ug ubang kabalaka sa kahimsog sa kababayen-an",
  "Adult Illness": "Mga Sakit sa Hamtong",
  "Fever, cough, heart, blood pressure, sugar, and other illness in adults": "Hilanat, ubo, kasingkasing, presyon sa dugo, asukar, ug uban pang sakit sa hamtong",
  "Lumps, Injuries & Belly Problems": "Bukol, Kadaot ug Problema sa Tiyan",
  "Surgical Concerns": "Mga Kabalaka nga Kinahanglan og Operasyon",
  "Belly pain, lumps or swelling, groin bulge, urinary problems, wounds and injuries": "Sakit sa tiyan, bukol o hubag, bukol sa singit, problema sa pag-ihi, samad ug kadaot",
  "Other concern (not listed)": "Ubang kabalaka (wala sa lista)",
  "You can explain more to the nurse": "Mahimo nimong ipasabot pa kini sa nars",
  "Fever": "Hilanat",
  "Warm to touch or high temperature": "Init ang panit o taas ang temperatura",
  "New or ongoing high temperature": "Bag-o o nagpadayon nga taas nga temperatura",
  "Cough or difficulty breathing": "Ubo o kalisod sa pagginhawa",
  "Noisy breathing, cough, or colds": "Tingog sa pagginhawa, ubo, o sip-on",
  "Cough or shortness of breath": "Ubo o kalisod sa pagginhawa",
  "Diarrhea or vomiting": "Kalibanga o pagsuka",
  "Loose stools or throwing up": "Luag nga tai o pagsuka",
  "Tummy pain": "Sakit sa tiyan",
  "Belly pain in a child": "Sakit sa tiyan sa bata",
  "Ear pain or ear discharge": "Sakit sa dalunggan o naay mogawas nga likido",
  "Pain in the ear or fluid coming out": "Sakit sa dalunggan o naay mogawas nga likido",
  "Skin rash": "Pantal sa panit",
  "A new or spreading rash": "Bag-o o nagkaylap nga pantal",
  "Newborn concern (under 1 month)": "Kabalaka sa bag-ong natawo (ubos sa 1 ka bulan)",
  "For babies 0 to 28 days old": "Alang sa mga bata nga 0 hangtod 28 ka adlaw",
  "Pregnancy check-up or concern": "Pagsusi sa pagmabdos o kabalaka",
  "Prenatal visit or a problem while pregnant": "Pagsusi sa pagmabdos o problema samtang nagmabdos",
  "Vaginal bleeding while pregnant": "Pagdugo sa puwerta samtang nagmabdos",
  "Any bleeding during pregnancy": "Bisan unsang pagdugo samtang nagmabdos",
  "Vaginal bleeding (not pregnant)": "Pagdugo sa puwerta (dili nagmabdos)",
  "Heavy or unusual bleeding": "Grabe o dili kasagarang pagdugo",
  "Missed period": "Wala magregla",
  "No period for one or more months": "Walay regla sulod sa usa o daghang bulan",
  "Lower belly or pelvic pain": "Sakit sa ubos nga tiyan o balakang",
  "Pain linked to the reproductive organs": "Sakit nga may kalabotan sa mga organo sa pagpanganak",
  "Vaginal discharge or itching": "Mogawas nga likido o katol sa puwerta",
  "Change in color, smell, or texture": "Pag-usab sa kolor, baho, o porma",
  "Breast lump or pain": "Bukol o sakit sa suso",
  "A new lump or a change in the breast": "Bag-ong bukol o kausaban sa suso",
  "Lump, pain, swelling, or nipple discharge": "Bukol, sakit, hubag, o likido sa utong",
  "Menopause symptoms": "Mga sintomas sa menopause",
  "Hot flashes, mood changes, or dryness": "Kalit nga pagbati og kainit, kausaban sa pagbati, o pagkauga",
  "Chest discomfort or racing heart": "Dili komportable nga dughan o paspas nga pitik sa kasingkasing",
  "Tightness, palpitations, irregular heartbeat": "Paghuot, kusog nga pitik, o dili regular nga pitik sa kasingkasing",
  "High blood pressure": "Taas nga presyon sa dugo",
  "Known or newly found": "Nahibaloan na o bag-o lang nadiskobrehan",
  "Diabetes or high blood sugar": "Diabetes o taas nga asukar sa dugo",
  "Very thirsty, peeing often, or sugar follow-up": "Sige'g uhaw, kanunay mangihi, o follow-up sa asukar",
  "Headache or dizziness": "Sakit sa ulo o kalipong",
  "Head pain or feeling lightheaded": "Sakit sa ulo o pagbati og kalipong",
  "Swollen legs": "Hubag nga mga bitiis",
  "Leg swelling, with or without shortness of breath": "Hubag sa bitiis, adunay o walay kalisod sa pagginhawa",
  "Yellow skin or eyes": "Pagkadilaw sa panit o mata",
  "Yellowing of the skin or whites of the eyes": "Pagkadilaw sa panit o puti sa mata",
  "Unexplained weight loss": "Pagniwang nga walay klarong hinungdan",
  "Losing weight without trying": "Pagniwang bisan wala naningkamot",
  "Diabetic foot wound": "Samad sa tiil tungod sa diabetes",
  "A sore or wound on the foot": "Samad sa tiil",
  "Joint or muscle pain (no injury)": "Sakit sa lutahan o kaunoran (walay kadaot)",
  "Pain without a recent fall or accident": "Sakit nga walay bag-ong pagkahulog o aksidente",
  "Stomach or belly pain": "Sakit sa tiyan",
  "Pain anywhere in the belly": "Sakit bisan asa sa tiyan",
  "Lump or swelling in the belly": "Bukol o hubag sa tiyan",
  "A growth you can feel": "Bukol nga mabati",
  "Lump or swelling in the neck": "Bukol o hubag sa liog",
  "Thyroid area or other neck lumps": "Dapit sa thyroid o ubang bukol sa liog",
  "Bulge in the groin or upper thigh": "Bukol sa singit o ibabaw nga bahin sa paa",
  "Possible hernia": "Posibleng hernia",
  "Scrotal swelling or testicular pain": "Hubag sa scrotum o sakit sa itlog",
  "Swelling, heaviness, or pain": "Hubag, kabug-at, o sakit",
  "Trouble peeing": "Kalisod sa pag-ihi",
  "Weak stream, frequent, or urgent": "Hinay nga agas, kanunay, o dinaliang pag-ihi",
  "Blood in the urine": "Dugo sa ihi",
  "Red or brown urine": "Pula o brown nga ihi",
  "Severe back or side pain": "Grabe nga sakit sa likod o kilid",
  "Sharp pain that may move to the groin": "Tusok nga sakit nga mahimong mokaylap sa singit",
  "Injury, wound, or burn": "Kadaot, samad, o paso",
  "Cuts, falls, suspected broken bone": "Hiwa, pagkahulog, o posibleng bali nga bukog",
  "How long has this been going on?": "Unsa na kini kadugay?",
  "How long has your child had the fever?": "Unsa na kadugay nga gihilanat ang imong anak?",
  "How long has your child been coughing or having trouble breathing?": "Unsa na kadugay nga nag-ubo o naglisod og ginhawa ang imong anak?",
  "How long has the tummy pain lasted?": "Unsa na kadugay ang sakit sa tiyan?",
  "How long has the ear problem been there?": "Unsa na kadugay ang problema sa dalunggan?",
  "How long has the rash been there?": "Unsa na kadugay ang pantal?",
  "How long have you been pregnant?": "Pila na kadugay nga nagmabdos ka?",
  "How long have you been bleeding?": "Unsa na kadugay nga nagdugo ka?",
  "How long has it been since your last period?": "Pila na kadugay sukad sa imong kataposang regla?",
  "How long have you had the pain?": "Unsa na kadugay nga gibati nimo ang sakit?",
  "How long have you noticed the discharge or itching?": "Unsa na kadugay nga namatikdan nimo ang mogawas nga likido o katol?",
  "How long have you noticed it?": "Unsa na kadugay nga namatikdan nimo kini?",
  "How long have you had these symptoms?": "Unsa na kadugay nga gibati nimo kini nga mga sintomas?",
  "How long have you had the fever?": "Unsa na kadugay nga gihilanat ka?",
  "How long have you been coughing or having trouble breathing?": "Unsa na kadugay nga nag-ubo o naglisod ka og ginhawa?",
  "How long have you had the chest discomfort or racing heart?": "Unsa na kadugay nga dili komportable ang imong dughan o paspas ang pitik sa kasingkasing?",
  "How long have you had high blood pressure?": "Unsa na kadugay nga taas ang imong presyon sa dugo?",
  "How long have you had diabetes or high sugar symptoms?": "Unsa na kadugay nga adunay diabetes o sintomas sa taas nga asukar?",
  "How long have you had the headache or dizziness?": "Unsa na kadugay nga sakit ang ulo o nalipong ka?",
  "How long have your legs been swollen?": "Unsa na kadugay nga mihubag ang imong mga bitiis?",
  "How long have you been yellow?": "Unsa na kadugay nga nanilaw ang imong panit o mata?",
  "Over how long have you been losing weight?": "Unsa na kadugay nga nagniwang ka?",
  "How long have you had the wound?": "Unsa na kadugay ang imong samad?",
  "How long have you had the belly pain?": "Unsa na kadugay nga sakit ang imong tiyan?",
  "How long have you noticed the lump?": "Unsa na kadugay nga namatikdan nimo ang bukol?",
  "How long have you noticed the bulge?": "Unsa na kadugay nga namatikdan nimo ang bukol?",
  "How long have you had the swelling or pain?": "Unsa na kadugay nga mihubag o misakit kini?",
  "How long have you had trouble peeing?": "Unsa na kadugay nga naglisod ka sa pag-ihi?",
  "How long have you seen blood in your urine?": "Unsa na kadugay nga nakakita ka og dugo sa imong ihi?",
  "How long ago did the injury happen?": "Kanus-a nahitabo ang kadaot?",
  "How many times do you wake up at night to pee?": "Pila ka beses ka momata sa gabii aron mangihi?",
  "How many times did your child pass loose stool today?": "Pila ka beses nagkalibang og luag ang imong anak karong adlawa?",
  "How many times did your child vomit today?": "Pila ka beses nagsuka ang imong anak karong adlawa?",
  "How many times did your child pee (or wet the diaper) in the last 24 hours?": "Pila ka beses nangihi ang imong anak (o nabasa ang lampin) sulod sa miaging 24 oras?",
  "How many days old is the baby?": "Pila na ka adlaw ang edad sa bata?",
  "How many pads have you used in the last 24 hours?": "Pila ka pad ang imong gigamit sulod sa miaging 24 oras?",
  "About how many kilograms have you lost?": "Mga pila ka kilo ang imong nawala?",
  "Night-time peeing": "Pag-ihi sa gabii",
  "Loose stools today": "Luag nga tai karong adlawa",
  "Vomiting today": "Pagsuka karong adlawa",
  "Pees / wet diapers in 24h": "Ihi / nabasa nga lampin sulod sa 24 oras",
  "Baby's age": "Edad sa bata",
  "Pads used in 24h": "Mga pad nga gigamit sulod sa 24 oras",
  "Weight lost": "Nawalang timbang",
  "What is the problem about?": "Unsa ang imong problema?",
  "Choose the group that best describes your concern.": "Pilia ang grupo nga labing naghulagway sa imong kabalaka.",
  "What is your main complaint?": "Unsa ang imong pangunang reklamo?",
  "Choose the one that bothers you the most.": "Pilia ang labing nakasamok kanimo.",
  "Tell us a little more": "Isulti pa kanamo ang dugang detalye",
  "Type a number to answer each question.": "Isulod ang numero isip tubag sa matag pangutana.",
  "Number": "Numero",
  "Tap to enter": "Pislita aron mosulod",
  "times": "ka beses",
  "days": "ka adlaw",
  "Hours": "Oras",
  "Days": "Adlaw",
  "Weeks": "Semana",
  "Months": "Bulan",
  "Where is the pain or problem?": "Asa dapit ang sakit o problema?",
  "Tap all the places that apply.": "Pilia ang tanang dapit nga angay.",
  "Other area": "Ubang dapit",
  "How bad is it right now?": "Unsa ka grabe kini karon?",
  "Tap the face that matches how you feel.": "Pilia ang nawong nga naghulagway sa imong gibati.",
  "Very mild": "Gamay ra kaayo",
  "Mild": "Gamay",
  "Moderate": "Kasagaran",
  "Severe": "Grabe",
  "Very severe": "Grabe kaayo",
  "Concern Area": "Klase sa Kabalaka",
  "Chief Complaint": "Pangunang Reklamo",
  "Duration": "Kadugayon",
  "Location": "Dapit",
  "Severity": "Kagrabe",
  "Your Selections": "Imong mga Gipili",
  "No selection yet.": "Wala pay napili.",
  "Concern": "Kabalaka",
  "Complaint": "Reklamo",
  "Details": "Mga Detalye",
  "Chief Complaints": "Mga Pangunang Reklamo",
  "Tell us about your concern": "Isulti kanamo ang imong kabalaka",
  "Saving patient…": "Gitipigan ang impormasyon sa pasyente…",
  "Proceed →": "Padayon →",
  "Continue →": "Padayon →",
  "Start over": "Sugdi pag-usab",
  "Could not save the patient record.": "Dili matipigan ang rekord sa pasyente.",
  "Upper right belly": "Ibabaw nga tuo sa tiyan",
  "Upper middle (stomach area)": "Ibabaw nga tunga (dapit sa tiyan)",
  "Upper left belly": "Ibabaw nga wala sa tiyan",
  "Around the belly button": "Palibot sa pusod",
  "Lower right belly": "Ubos nga tuo sa tiyan",
  "Lower middle belly": "Ubos nga tunga sa tiyan",
  "Lower left belly": "Ubos nga wala sa tiyan",
  "All over the belly": "Tibuok tiyan",
  "Center of the chest": "Tunga sa dughan",
  "Left side of the chest": "Wala nga bahin sa dughan",
  "Right side of the chest": "Tuo nga bahin sa dughan",
  "Spreads to arm, neck, or jaw": "Mokeylap sa bukton, liog, o apapangig",
  Back: "Likod",
  Forehead: "Agtang",
  "One side of the head": "Usa ka bahin sa ulo",
  "Back of the head": "Luyo sa ulo",
  "Whole head": "Tibuok ulo",
  "Left breast": "Wala nga suso",
  "Right breast": "Tuo nga suso",
  "Both breasts": "Ang duha ka suso",
  "Nipple area": "Dapit sa utong",
  "Front of the neck (thyroid area)": "Atubangan sa liog (dapit sa thyroid)",
  "Left side of the neck": "Wala nga bahin sa liog",
  "Right side of the neck": "Tuo nga bahin sa liog",
  "Under the jaw or near the ear": "Ubos sa apapangig o duol sa dalunggan",
  "Lower back - left": "Ubos nga likod - wala",
  "Lower back - right": "Ubos nga likod - tuo",
  "Side moving down to the groin": "Kilid nga mokaylap paubos sa singit",
  "Whole lower back": "Tibuok ubos nga likod",
  "Groin - left": "Singit - wala",
  "Groin - right": "Singit - tuo",
  "Scrotum or testicles": "Scrotum o itlog",
  "Upper thigh crease": "Lukot sa ibabaw nga bahin sa paa",
  "Lower belly - center": "Ubos nga tiyan - tunga",
  "Lower belly - left": "Ubos nga tiyan - wala",
  "Lower belly - right": "Ubos nga tiyan - tuo",
  "Deep inside the pelvis": "Lawom sulod sa balakang",
  "Left ear": "Wala nga dalunggan",
  "Right ear": "Tuo nga dalunggan",
  "Both ears": "Ang duha ka dalunggan",
  "Behind the ear": "Luyo sa dalunggan",
  Knee: "Tuhod",
  Shoulder: "Abaga",
  Hip: "Balakang",
  Hands: "Kamot",
  "Hands or wrists": "Kamot o pulso",
  "Feet or ankles": "Tiil o buol-buol",
  "Muscles (arms or legs)": "Kaunoran (bukton o bitiis)",
  "Burning when peeing": "Hapdos kon mangihi",
  "Lower belly above the pubic bone": "Ubos nga tiyan ibabaw sa bukog sa pubic",
  "Lower back or side": "Ubos nga likod o kilid",
  "Around the genital area": "Palibot sa kinatawo",
  Toes: "Mga tudlo sa tiil",
  "Sole of the foot": "Lapalapa sa tiil",
  "Top of the foot": "Ibabaw sa tiil",
  Heel: "Tikod",
  Ankle: "Buol-buol",
  "Head or face": "Ulo o nawong",
  "Shoulder or arm": "Abaga o bukton",
  "Hand or wrist": "Kamot o pulso",
  "Hip or leg": "Balakang o bitiis",
  "Foot or ankle": "Tiil o buol-buol",
  "Back or belly": "Likod o tiyan",
};

const textForLanguage = (text: string, language: KioskLanguage) =>
  language === "ceb"
    ? CEBUANO_TEXT[text] ?? (() => {
        const separator = text.indexOf(": ");
        if (separator === -1) return text;
        const label = text.slice(0, separator);
        const value = text.slice(separator + 2).replace(/\btimes\b/g, "ka beses");
        return `${CEBUANO_TEXT[label] ?? label}: ${value}`;
      })()
    : text;

const other = (code: string): Complaint => ({
  id: `CC_${code}_OTHER`,
  label: "Other concern (not listed)",
  sublabel: "You can explain more to the nurse",
  systemValue: `${code}_OTHER`,
  durationQuestion: "How long has this been going on?",
});

const NIGHT_PEES: NumberField = {
  id: "night_pees",
  label: "Night-time peeing",
  question: "How many times do you wake up at night to pee?",
  unit: "times",
};

const CATEGORIES: Category[] = [
  // ═══════════════ CHILD HEALTH (PEDIATRICS) ═══════════════
  {
    id: "CAT_PEDIA",
    label: "Child Health",
    shortLabel: "Child Health",
    icon: "👶",
    description: "For patients under 19 years old",
    clinic: "Pediatrics",
    complaints: [
      {
        id: "CC_PED_FEVER", label: "Fever", sublabel: "Warm to touch or high temperature",
        systemValue: "PED_FEVER",
        durationQuestion: "How long has your child had the fever?",
      },
      {
        id: "CC_PED_COUGH", label: "Cough or difficulty breathing", sublabel: "Noisy breathing, cough, or colds",
        systemValue: "PED_COUGH",
        durationQuestion: "How long has your child been coughing or having trouble breathing?",
      },
      {
        id: "CC_PED_DIARRHEA", label: "Diarrhea or vomiting", sublabel: "Loose stools or throwing up",
        systemValue: "PED_DIARRHEA",
        durationQuestion: "How long has this been going on?",
        extras: [
          { id: "stools_today", label: "Loose stools today", question: "How many times did your child pass loose stool today?", unit: "times" },
          { id: "vomit_today", label: "Vomiting today", question: "How many times did your child vomit today?", unit: "times" },
          { id: "pees_24h", label: "Pees / wet diapers in 24h", question: "How many times did your child pee (or wet the diaper) in the last 24 hours?", unit: "times" },
        ],
      },
      {
        id: "CC_PED_TUMMY", label: "Tummy pain", sublabel: "Belly pain in a child",
        systemValue: "PED_TUMMY_PAIN",
        durationQuestion: "How long has the tummy pain lasted?",
        pain: "abdomen",
      },
      {
        id: "CC_PED_EAR", label: "Ear pain or ear discharge", sublabel: "Pain in the ear or fluid coming out",
        systemValue: "PED_EAR",
        durationQuestion: "How long has the ear problem been there?",
        pain: "ear",
      },
      {
        id: "CC_PED_RASH", label: "Skin rash", sublabel: "A new or spreading rash",
        systemValue: "PED_RASH",
        durationQuestion: "How long has the rash been there?",
      },
      {
        id: "CC_PED_NEWBORN", label: "Newborn concern (under 1 month)", sublabel: "For babies 0 to 28 days old",
        systemValue: "PED_NEWBORN",
        durationQuestion: "How long has this problem been going on?",
        extras: [
          { id: "baby_age", label: "Baby's age", question: "How many days old is the baby?", unit: "days" },
        ],
      },
      other("PED"),
    ],
  },

  // ═══════════════ WOMEN'S & PREGNANCY HEALTH (OB-GYNE) ═══════════════
  {
    id: "CAT_OBGYNE",
    label: "Women's & Pregnancy Health",
    shortLabel: "Women's Health",
    icon: "🤰",
    description: "Pregnancy, periods, and women's health concerns",
    clinic: "OB-GYNE",
    complaints: [
      {
        id: "CC_OB_PRENATAL", label: "Pregnancy check-up or concern", sublabel: "Prenatal visit or a problem while pregnant",
        systemValue: "OB_PRENATAL",
        durationQuestion: "How long have you been pregnant?",
      },
      {
        id: "CC_OB_BLEED_PREG", label: "Vaginal bleeding while pregnant", sublabel: "Any bleeding during pregnancy",
        systemValue: "OB_VAG_BLEED_PREG",
        durationQuestion: "How long have you been bleeding?",
        extras: [
          { id: "pads_24h", label: "Pads used in 24h", question: "How many pads have you used in the last 24 hours?", unit: "pads" },
        ],
      },
      {
        id: "CC_OB_BLEED", label: "Vaginal bleeding (not pregnant)", sublabel: "Heavy or unusual bleeding",
        systemValue: "OB_VAG_BLEED_NONPREG",
        durationQuestion: "How long have you been bleeding?",
        extras: [
          { id: "pads_24h", label: "Pads used in 24h", question: "How many pads have you used in the last 24 hours?", unit: "pads" },
        ],
      },
      {
        id: "CC_OB_AMENORRHEA", label: "Missed period", sublabel: "No period for one or more months",
        systemValue: "OB_AMENORRHEA",
        durationQuestion: "How long has it been since your last period?",
      },
      {
        id: "CC_OB_PELVIC_PAIN", label: "Lower belly or pelvic pain", sublabel: "Pain linked to the reproductive organs",
        systemValue: "OB_ABD_PAIN",
        durationQuestion: "How long have you had the pain?",
        pain: "pelvic",
      },
      {
        id: "CC_OB_DISCHARGE", label: "Vaginal discharge or itching", sublabel: "Change in color, smell, or texture",
        systemValue: "OB_VAG_DISC",
        durationQuestion: "How long have you noticed the discharge or itching?",
      },
      {
        id: "CC_OB_BREAST", label: "Breast lump or pain", sublabel: "A new lump or a change in the breast",
        systemValue: "OB_BREAST_LUMP",
        durationQuestion: "How long have you noticed it?",
        pain: "breast",
      },
      {
        id: "CC_OB_MENOPAUSE", label: "Menopause symptoms", sublabel: "Hot flashes, mood changes, or dryness",
        systemValue: "OB_MENOPAUSE",
        durationQuestion: "How long have you had these symptoms?",
      },
      other("OB"),
    ],
  },

  // ═══════════════ ADULT ILLNESS (INTERNAL MEDICINE) ═══════════════
  {
    id: "CAT_INTERNAL",
    label: "Adult Illness",
    shortLabel: "Adult Illness",
    icon: "🫀",
    description: "Fever, cough, heart, blood pressure, sugar, and other illness in adults",
    clinic: "Internal Medicine",
    complaints: [
      {
        id: "CC_IM_FEVER", label: "Fever", sublabel: "New or ongoing high temperature",
        systemValue: "IM_FEVER",
        durationQuestion: "How long have you had the fever?",
      },
      {
        id: "CC_IM_COUGH", label: "Cough or difficulty breathing", sublabel: "Cough or shortness of breath",
        systemValue: "IM_COUGH",
        durationQuestion: "How long have you been coughing or having trouble breathing?",
      },
      {
        id: "CC_IM_CHEST", label: "Chest discomfort or racing heart", sublabel: "Tightness, palpitations, irregular heartbeat",
        systemValue: "IM_CHEST_PALP",
        durationQuestion: "How long have you had the chest discomfort or racing heart?",
        pain: "chest",
      },
      {
        id: "CC_IM_HTN", label: "High blood pressure", sublabel: "Known or newly found",
        systemValue: "IM_HTN",
        durationQuestion: "How long have you had high blood pressure?",
      },
      {
        id: "CC_IM_DM", label: "Diabetes or high blood sugar", sublabel: "Very thirsty, peeing often, or sugar follow-up",
        systemValue: "IM_DIABETES",
        durationQuestion: "How long have you had diabetes or high sugar symptoms?",
        extras: [NIGHT_PEES],
      },
      {
        id: "CC_IM_HEADACHE", label: "Headache or dizziness", sublabel: "Head pain or feeling lightheaded",
        systemValue: "IM_HEADACHE",
        durationQuestion: "How long have you had the headache or dizziness?",
        pain: "head",
      },
      {
        id: "CC_IM_LEGS", label: "Swollen legs", sublabel: "Leg swelling, with or without shortness of breath",
        systemValue: "IM_SWOLLEN_LEGS",
        durationQuestion: "How long have your legs been swollen?",
      },
      {
        id: "CC_IM_JAUNDICE", label: "Yellow skin or eyes", sublabel: "Yellowing of the skin or whites of the eyes",
        systemValue: "IM_JAUNDICE",
        durationQuestion: "How long have you been yellow?",
      },
      {
        id: "CC_IM_WEIGHT", label: "Unexplained weight loss", sublabel: "Losing weight without trying",
        systemValue: "IM_WEIGHT_LOSS",
        durationQuestion: "Over how long have you been losing weight?",
        extras: [
          { id: "kg_lost", label: "Weight lost", question: "About how many kilograms have you lost?", unit: "kg" },
        ],
      },
      {
        id: "CC_IM_FOOT", label: "Diabetic foot wound", sublabel: "A sore or wound on the foot",
        systemValue: "IM_DIAB_FOOT",
        durationQuestion: "How long have you had the wound?",
        pain: "foot",
      },
      {
        id: "CC_IM_MSK", label: "Joint or muscle pain (no injury)", sublabel: "Pain without a recent fall or accident",
        systemValue: "IM_MSK",
        durationQuestion: "How long have you had the pain?",
        pain: "joints",
      },
      other("IM"),
    ],
  },

  // ═══════════════ LUMPS, INJURIES & BELLY PROBLEMS (SURGERY) ═══════════════
  {
    id: "CAT_SURG",
    label: "Lumps, Injuries & Belly Problems",
    shortLabel: "Surgical Concerns",
    icon: "🩹",
    description: "Belly pain, lumps or swelling, groin bulge, urinary problems, wounds and injuries",
    clinic: "General Surgery",
    complaints: [
      {
        id: "CC_GS_BELLY", label: "Stomach or belly pain", sublabel: "Pain anywhere in the belly",
        systemValue: "GS_ABD_PAIN",
        durationQuestion: "How long have you had the belly pain?",
        pain: "abdomen",
      },
      {
        id: "CC_GS_MASS", label: "Lump or swelling in the belly", sublabel: "A growth you can feel",
        systemValue: "GS_ABD_MASS",
        durationQuestion: "How long have you noticed the lump?",
        pain: "abdomen",
      },
      {
        id: "CC_GS_BREAST", label: "Breast lump or pain", sublabel: "Lump, pain, swelling, or nipple discharge",
        systemValue: "GS_BREAST_LUMP",
        durationQuestion: "How long have you noticed it?",
        pain: "breast",
      },
      {
        id: "CC_GS_NECK", label: "Lump or swelling in the neck", sublabel: "Thyroid area or other neck lumps",
        systemValue: "GS_NECK_LUMP",
        durationQuestion: "How long have you noticed the lump?",
        pain: "neck",
      },
      {
        id: "CC_GS_HERNIA", label: "Bulge in the groin or upper thigh", sublabel: "Possible hernia",
        systemValue: "GS_HERNIA",
        durationQuestion: "How long have you noticed the bulge?",
        pain: "groin",
      },
      {
        id: "CC_GS_SCROTAL", label: "Scrotal swelling or testicular pain", sublabel: "Swelling, heaviness, or pain",
        systemValue: "GS_SCROTAL_SWELLING",
        durationQuestion: "How long have you had the swelling or pain?",
        pain: "groin",
      },
      {
        id: "CC_GS_VOIDING", label: "Trouble peeing", sublabel: "Weak stream, frequent, or urgent",
        systemValue: "GS_VOIDING",
        durationQuestion: "How long have you had trouble peeing?",
        extras: [NIGHT_PEES],
        pain: "urinary",
      },
      {
        id: "CC_GS_HEMATURIA", label: "Blood in the urine", sublabel: "Red or brown urine",
        systemValue: "GS_HEMATURIA",
        durationQuestion: "How long have you seen blood in your urine?",
      },
      {
        id: "CC_GS_KIDNEY", label: "Severe back or side pain", sublabel: "Sharp pain that may move to the groin",
        systemValue: "GS_KIDNEY_STONE",
        durationQuestion: "How long have you had the pain?",
        pain: "flank",
      },
      {
        id: "CC_GS_INJURY", label: "Injury, wound, or burn", sublabel: "Cuts, falls, suspected broken bone",
        systemValue: "GS_INJURY",
        durationQuestion: "How long ago did the injury happen?",
        pain: "injury",
      },
      other("GS"),
    ],
  },
];

const DURATION_UNITS: { id: DurationUnit; label: string }[] = [
  { id: "hours", label: "Hours" },
  { id: "days", label: "Days" },
  { id: "weeks", label: "Weeks" },
  { id: "months", label: "Months" },
];

const SEVERITY = [
  { value: 1, emoji: "😊", label: "Very mild" },
  { value: 2, emoji: "🙂", label: "Mild" },
  { value: 3, emoji: "😐", label: "Moderate" },
  { value: 4, emoji: "😣", label: "Severe" },
  { value: 5, emoji: "😭", label: "Very severe" },
];

const formatDuration = (value: string, unit: DurationUnit | "", language: KioskLanguage = "en") => {
  if (!value || !unit) return "";
  const n = Number(value);
  const cebuanoUnits: Record<DurationUnit, [string, string]> = {
    hours: ["ka oras", "ka oras"],
    days: ["ka adlaw", "ka adlaw"],
    weeks: ["ka semana", "ka semana"],
    months: ["ka bulan", "ka bulan"],
  };
  const label = language === "ceb"
    ? cebuanoUnits[unit][n === 1 ? 0 : 1]
    : n === 1 ? unit.slice(0, -1) : unit;
  return `${n} ${label}`;
};

const stepsFor = (c: Complaint | null): StepKey[] => [
  "category",
  "complaint",
  "details",
  ...(c?.pain ? (["pain"] as StepKey[]) : []),
  "severity",
];

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Breadcrumb({
  steps, current, category, complaint, onNavigate, language,
}: {
  steps: StepKey[];
  current: StepKey;
  category: Category | null;
  complaint: Complaint | null;
  onNavigate: (step: StepKey) => void;
  language: KioskLanguage;
}) {
  const labels: Record<StepKey, string> = {
    category: textForLanguage(category?.shortLabel ?? "Concern Area", language),
    complaint: textForLanguage(complaint?.label ?? "Chief Complaint", language),
    details: textForLanguage("Duration", language),
    pain: textForLanguage("Location", language),
    severity: textForLanguage("Severity", language),
  };
  const activeIdx = steps.indexOf(current);
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {steps.map((s, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <React.Fragment key={s}>
            {done ? (
              <button
                type="button"
                onClick={() => onNavigate(s)}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold hover:underline
                  ${done ? "border-emerald-500 bg-emerald-950 text-emerald-400"
                  : active ? "border-orange-300 bg-cyan-950 text-orange-200"
                  : "border-cyan-800 text-cyan-600"}`}
              >
                ✓ {labels[s]}
              </button>
            ) : (
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold
                ${done ? "border-emerald-500 bg-emerald-950 text-emerald-400"
                : active ? "border-orange-300 bg-cyan-950 text-orange-200"
                : "border-cyan-800 text-cyan-600"}`}
              >
                {labels[s]}
              </span>
            )}
            {i < steps.length - 1 && <span className="text-sm text-cyan-700">›</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SummaryRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-cyan-800 pt-2 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase text-cyan-500">{title}</p>
      <div className="mt-0.5 text-sm font-bold text-orange-200">{children}</div>
    </div>
  );
}

function SummaryPanel({
  category, complaint, durationText, extraLines, painLocations, severity, language,
}: {
  category: Category | null;
  complaint: Complaint | null;
  durationText: string;
  extraLines: string[];
  painLocations: string[];
  severity: number | null;
  language: KioskLanguage;
}) {
  const sev = SEVERITY.find((s) => s.value === severity);

  return (
    <div className="w-56 flex-shrink-0">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white">{textForLanguage("Your Selections", language)}</p>
      <div className="flex min-h-[12rem] flex-col gap-3 rounded-xl border border-cyan-800 bg-cyan-950 p-4">
        {!category && <p className="text-xs italic text-cyan-600">{textForLanguage("No selection yet.", language)}</p>}
        {category && <SummaryRow title={textForLanguage("Concern", language)}>{category.icon} {textForLanguage(category.shortLabel, language)}</SummaryRow>}
        {complaint && <SummaryRow title={textForLanguage("Complaint", language)}>{textForLanguage(complaint.label, language)}</SummaryRow>}
        {durationText && <SummaryRow title={textForLanguage("Duration", language)}>{durationText}</SummaryRow>}
        {extraLines.length > 0 && (
          <SummaryRow title={textForLanguage("Details", language)}>
            <ul className="space-y-0.5 font-semibold">
              {extraLines.map((l) => <li key={l}>{textForLanguage(l, language)}</li>)}
            </ul>
          </SummaryRow>
        )}
        {painLocations.length > 0 && <SummaryRow title={textForLanguage("Location", language)}>{painLocations.map((location) => textForLanguage(location, language)).join(", ")}</SummaryRow>}
        {sev && <SummaryRow title={textForLanguage("Severity", language)}>{sev.emoji} {textForLanguage(sev.label, language)}</SummaryRow>}
      </div>
    </div>
  );
}

// ─── STEP: CATEGORY ──────────────────────────────────────────────────────────
function StepCategory({ onSelect, language }: { onSelect: (c: Category) => void; language: KioskLanguage }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-3xl font-bold text-white">{textForLanguage("What is the problem about?", language)}</h2>
        <p className="mt-1 text-base text-cyan-300">{textForLanguage("Choose the group that best describes your concern.", language)}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className="group cursor-pointer rounded-xl border-2 border-cyan-800 bg-cyan-950 px-6 py-7 text-left transition-all hover:border-orange-300 hover:bg-[#0e4f68]"
          >
            <p className="mb-2 text-4xl">{c.icon}</p>
            <p className="text-xl font-bold text-white group-hover:text-orange-100">{textForLanguage(c.label, language)}</p>
            <p className="mt-1 text-sm text-cyan-400 group-hover:text-cyan-300">{textForLanguage(c.description, language)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── STEP: COMPLAINT ─────────────────────────────────────────────────────────
function StepComplaint({ category, onSelect, language }: { category: Category; onSelect: (c: Complaint) => void; language: KioskLanguage }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">
          {category.icon} {textForLanguage(category.label, language)}
        </p>
        <h2 className="text-3xl font-bold text-white">{textForLanguage("What is your main complaint?", language)}</h2>
        <p className="mt-1 text-base text-cyan-300">{textForLanguage("Choose the one that bothers you the most.", language)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {category.complaints.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className="group cursor-pointer rounded-xl border-2 border-cyan-800 bg-cyan-950 px-5 py-5 text-left transition-all hover:border-orange-300 hover:bg-[#0e4f68]"
          >
            <p className="text-base font-bold leading-snug text-white group-hover:text-orange-100">{textForLanguage(c.label, language)}</p>
            {c.sublabel && <p className="mt-0.5 text-sm text-cyan-400 group-hover:text-cyan-300">{textForLanguage(c.sublabel, language)}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── STEP: DETAILS (duration + how many) ─────────────────────────────────────
const numberInputClass =
  "w-44 rounded-xl border-2 border-cyan-700 bg-cyan-950 px-4 py-3 text-3xl font-bold text-white " +
  "placeholder:text-cyan-700 focus:border-orange-300 focus:outline-none";

function StepDetails({
  complaint, durationValue, durationUnit, extras,
  onDurationValue, onDurationUnit, onExtra, language,
}: {
  complaint: Complaint;
  durationValue: string;
  durationUnit: DurationUnit | "";
  extras: Record<string, string>;
  onDurationValue: (v: string) => void;
  onDurationUnit: (u: DurationUnit) => void;
  onExtra: (id: string, v: string) => void;
  language: KioskLanguage;
}) {
  const [durationKeypadOpen, setDurationKeypadOpen] = useState(false);
  const [activeExtraId, setActiveExtraId] = useState<string | null>(null);
  const activeExtra = complaint.extras?.find((field) => field.id === activeExtraId);

  const appendExtraValue = (digit: string, decimal: boolean) => {
    if (!activeExtra) return;
    const current = extras[activeExtra.id] ?? "";
    if (digit === ".") {
      if (!decimal || current.includes(".")) return;
      onExtra(activeExtra.id, `${current || "0"}.`);
      return;
    }
    const [whole, fraction] = current.split(".");
    if (whole.length >= 3 || (fraction !== undefined && fraction.length >= 1)) return;
    onExtra(activeExtra.id, `${current}${digit}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">{textForLanguage(complaint.label, language)}</p>
        <h2 className="text-3xl font-bold text-white">{textForLanguage("Tell us a little more", language)}</h2>
        <p className="mt-1 text-base text-cyan-300">{textForLanguage("Type a number to answer each question.", language)}</p>
      </div>

      {/* Duration */}
      <div className="rounded-xl border-2 border-cyan-800 bg-cyan-950 p-5">
        <p className="mb-3 text-lg font-bold text-white">{textForLanguage(complaint.durationQuestion, language)}</p>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            inputMode="none"
            readOnly
            value={durationValue}
            onClick={() => setDurationKeypadOpen(true)}
            placeholder={textForLanguage("Tap to enter", language)}
            aria-label={textForLanguage("Duration", language)}
            className={numberInputClass}
          />
          <div className="flex flex-wrap gap-2">
            {DURATION_UNITS.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => onDurationUnit(u.id)}
                className={`cursor-pointer rounded-xl border-2 px-5 py-3 text-lg font-bold transition-all
                  ${durationUnit === u.id
                    ? "border-orange-300 bg-orange-300 text-cyan-950"
                    : "border-cyan-700 bg-cyan-900 text-white hover:border-orange-300"}`}
              >
                {textForLanguage(u.label, language)}
              </button>
            ))}
          </div>
        </div>
        {durationKeypadOpen && (
          <section className="mt-4 max-w-sm rounded-xl border border-cyan-600 bg-cyan-900 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">
                {language === "en" ? "Duration Keypad" : "Keypad sa Kadugayon"}
              </h3>
              <button
                type="button"
                onClick={() => setDurationKeypadOpen(false)}
                className="rounded-md bg-cyan-800 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
              >
                {language === "en" ? "Done" : "Human"}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => {
                    onDurationValue(`${durationValue}${digit}`);
                  }}
                  className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200 active:bg-orange-300"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onDurationValue("")}
                className="min-h-14 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-500"
              >
                {language === "en" ? "Clear" : "Haw-asa"}
              </button>
              <button
                type="button"
                onClick={() => onDurationValue(`${durationValue}0`)}
                className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => onDurationValue(durationValue.slice(0, -1))}
                aria-label={language === "en" ? "Delete last digit" : "Tangtanga ang kataposang numero"}
                className="min-h-14 rounded-lg bg-cyan-700 text-xl font-bold text-white hover:bg-cyan-600"
              >
                ⌫
              </button>
            </div>
          </section>
        )}
      </div>

      {/* How many ... */}
      {complaint.extras?.map((f) => (
        <div key={f.id} className="rounded-xl border-2 border-cyan-800 bg-cyan-950 p-5">
          <p className="mb-3 text-lg font-bold text-white">{textForLanguage(f.question, language)}</p>
          <div className="flex items-center gap-3">
            <input
            type="text"
            inputMode="none"
            readOnly
              value={extras[f.id] ?? ""}
            onClick={() => setActiveExtraId(f.id)}
            placeholder={textForLanguage("Tap to enter", language)}
            aria-label={textForLanguage(f.question, language)}
            className={numberInputClass}
          />
          <span className="text-xl font-semibold text-cyan-300">{textForLanguage(f.unit, language)}</span>
        </div>
        {activeExtraId === f.id && (
          <section className="mt-4 max-w-sm rounded-xl border border-cyan-600 bg-cyan-900 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">
                {language === "en" ? "Number Keypad" : "Keypad sa Numero"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveExtraId(null)}
                className="rounded-md bg-cyan-800 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
              >
                {language === "en" ? "Done" : "Human"}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => appendExtraValue(digit, f.unit === "kg")}
                  className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200 active:bg-orange-300"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onExtra(f.id, "")}
                className="min-h-14 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-500"
              >
                {language === "en" ? "Clear" : "Haw-asa"}
              </button>
              <button
                type="button"
                onClick={() => appendExtraValue("0", f.unit === "kg")}
                className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200"
              >
                0
              </button>
              {f.unit === "kg" ? (
                <button
                  type="button"
                  onClick={() => appendExtraValue(".", true)}
                  className="min-h-14 rounded-lg border border-cyan-700 bg-orange-50 text-2xl font-bold text-cyan-950 hover:bg-orange-200"
                >
                  .
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onExtra(f.id, (extras[f.id] ?? "").slice(0, -1))}
                  aria-label={language === "en" ? "Delete last digit" : "Tangtanga ang kataposang numero"}
                  className="min-h-14 rounded-lg bg-cyan-700 text-xl font-bold text-white hover:bg-cyan-600"
                >
                  ⌫
                </button>
              )}
              {f.unit === "kg" && (
                <button
                  type="button"
                  onClick={() => onExtra(f.id, (extras[f.id] ?? "").slice(0, -1))}
                  aria-label={language === "en" ? "Delete last digit" : "Tangtanga ang kataposang numero"}
                  className="col-span-3 min-h-14 rounded-lg bg-cyan-700 text-xl font-bold text-white hover:bg-cyan-600"
                >
                  ⌫
                </button>
              )}
            </div>
          </section>
        )}
      </div>
      ))}
    </div>
  );
}

// ─── STEP: PAIN LOCATION ─────────────────────────────────────────────────────
function StepPain({
  complaint, selected, onToggle, language,
}: { complaint: Complaint; selected: string[]; onToggle: (loc: string) => void; language: KioskLanguage }) {
  const options = [...PAIN_LOCATIONS[complaint.pain!], "Other area"];
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">{textForLanguage(complaint.label, language)}</p>
        <h2 className="text-3xl font-bold text-white">{textForLanguage("Where is the pain or problem?", language)}</h2>
        <p className="mt-1 text-base text-cyan-300">{textForLanguage("Tap all the places that apply.", language)}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {options.map((loc) => {
          const on = selected.includes(loc);
          return (
            <button
              key={loc}
              type="button"
              onClick={() => onToggle(loc)}
              className={`cursor-pointer rounded-xl border-2 px-5 py-5 text-left text-lg font-bold transition-all
                ${on
                  ? "border-orange-300 bg-orange-300/20 text-orange-100 ring-2 ring-orange-300"
                  : "border-cyan-800 bg-cyan-950 text-white hover:border-orange-300 hover:bg-[#0e4f68]"}`}
            >
              <span className="flex items-center justify-between gap-3">
                <span>{textForLanguage(loc, language)}</span>
                {on && <span>✓</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── STEP: SEVERITY (emoticons) ──────────────────────────────────────────────
function StepSeverity({
  complaint, severity, onSelect, language,
}: { complaint: Complaint; severity: number | null; onSelect: (v: number) => void; language: KioskLanguage }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">{textForLanguage(complaint.label, language)}</p>
        <h2 className="text-3xl font-bold text-white">{textForLanguage("How bad is it right now?", language)}</h2>
        <p className="mt-1 text-base text-cyan-300">{textForLanguage("Tap the face that matches how you feel.", language)}</p>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {SEVERITY.map((s) => {
          const on = severity === s.value;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => onSelect(s.value)}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 px-2 py-6 transition-all
                ${on
                  ? "scale-105 border-orange-300 bg-orange-300/20 ring-2 ring-orange-300"
                  : "border-cyan-800 bg-cyan-950 hover:border-orange-300 hover:bg-[#0e4f68]"}`}
            >
              <span className="text-6xl leading-none">{s.emoji}</span>
              <span className={`text-sm font-bold ${on ? "text-orange-100" : "text-cyan-300"}`}>{textForLanguage(s.label, language)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface PrimaryClinicsProps {
  language: KioskLanguage;
  onLogout?: () => void;
  onProceed?: (payload: PrimaryClinicsPayload) => void | Promise<void>;
  onNavigateStep?: (step: number) => void;
  onNavigateVitalPart?: (part: number) => void;
}

export default function PrimaryClinics({
  language,
  onLogout,
  onProceed,
  onNavigateStep,
  onNavigateVitalPart,
}: PrimaryClinicsProps) {
  const [stepKey, setStepKey] = useState<StepKey>("category");
  const [category, setCategory] = useState<Category | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);

  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState<DurationUnit | "">("");
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [painLocations, setPainLocations] = useState<string[]>([]);
  const [severity, setSeverity] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const steps = stepsFor(complaint);
  const stepIdx = steps.indexOf(stepKey);

  const resetDetails = () => {
    setDurationValue("");
    setDurationUnit("");
    setExtras({});
    setPainLocations([]);
    setSeverity(null);
  };

  const handleReset = () => {
    setStepKey("category");
    setCategory(null);
    setComplaint(null);
    resetDetails();
  };

  const selectCategory = (c: Category) => {
    setCategory(c);
    setComplaint(null);
    resetDetails();
    setStepKey("complaint");
  };

  const selectComplaint = (c: Complaint) => {
    setComplaint(c);
    resetDetails();
    setStepKey("details");
  };

  const togglePain = (loc: string) =>
    setPainLocations((prev) => (prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]));

  // ── Validation ──────────────────────────────────────────────────────────────
  const detailsValid =
    !!complaint &&
    durationValue !== "" && Number(durationValue) > 0 && durationUnit !== "" &&
    (complaint.extras ?? []).every((f) => extras[f.id] !== undefined && extras[f.id] !== "" && Number(extras[f.id]) >= 0);

  const canContinue =
    stepKey === "details" ? detailsValid
    : stepKey === "pain" ? painLocations.length > 0
    : stepKey === "severity" ? severity !== null
    : false;

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (!canContinue) return;
    if (stepKey === "severity") {
      handleProceed();
      return;
    }
    setStepKey(steps[stepIdx + 1]);
  };

  const handleWizardNavigate = (target: StepKey) => {
    if (steps.indexOf(target) >= stepIdx) return;
    if (target === "category") {
      setCategory(null);
      setComplaint(null);
      resetDetails();
    } else if (target === "complaint") {
      setComplaint(null);
      resetDetails();
    }
    setStepKey(target);
  };

  // ── Payload ─────────────────────────────────────────────────────────────────
  const extraLines = (complaint?.extras ?? [])
    .filter((f) => extras[f.id] !== undefined && extras[f.id] !== "")
    .map((f) => `${f.label}: ${extras[f.id]} ${f.unit}`);

  const durationText = formatDuration(durationValue, durationUnit);
  const displayDurationText = formatDuration(durationValue, durationUnit, language);

  const handleProceed = async () => {
    if (!category || !complaint || severity === null || durationUnit === "") return;
    const sev = SEVERITY.find((s) => s.value === severity)!;

    const summaryParts = [
      complaint.label,
      `for ${durationText}`,
      ...extraLines,
      ...(painLocations.length ? [`Location: ${painLocations.join(", ")}`] : []),
      `Severity: ${sev.label} (${sev.value}/5)`,
    ];

    const payload: PrimaryClinicsPayload = {
      group_id: category.id,
      group_label: category.shortLabel,
      cc_id: complaint.id,
      cc_label: complaint.label,
      cc_label_cebuano: textForLanguage(complaint.label, "ceb"),
      sub_id: "",
      sub_label: "",
      system_value: complaint.systemValue,
      clinic: category.clinic,
      answers: {},
      duration_value: Number(durationValue),
      duration_unit: durationUnit,
      duration_text: durationText,
      extras: Object.fromEntries(
        (complaint.extras ?? []).map((f) => [f.id, Number(extras[f.id])])
      ),
      pain_locations: painLocations,
      severity: sev.value,
      severity_label: sev.label,
      summary_text: summaryParts.join(" · "),
    };

    console.log("BICA Payload → ML Model:", JSON.stringify(payload, null, 2));
    if (onProceed) {
      setIsSubmitting(true);
      setSubmissionError("");
      try {
        await onProceed(payload);
      } catch (error) {
        setSubmissionError(error instanceof Error ? error.message : "Could not save the patient record.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      alert(`Routing to: ${payload.clinic}\n${payload.summary_text}`);
    }
  };

  return (
    <div className="min-h-screen bg-cyan-950 flex flex-col font-sans">
      <KioskHeader
        language={language}
        activeStep={6}
        onNavigateStep={onNavigateStep}
        onNavigateVitalPart={onNavigateVitalPart}
        onLogout={onLogout}
      />

      <div className="flex flex-1 flex-col items-center gap-6 bg-cyan-950 px-4 py-8">
        <div className="text-center">
          <p className="mb-1 text-sm font-bold uppercase tracking-widest text-orange-300">{textForLanguage("Chief Complaints", language)}</p>
          <h1 className="text-4xl font-bold text-white">{textForLanguage("Tell us about your concern", language)}</h1>
        </div>

        <Breadcrumb
          steps={steps}
          current={stepKey}
          category={category}
          complaint={complaint}
          onNavigate={handleWizardNavigate}
          language={language}
        />

        <div className="flex w-[72rem] max-w-full flex-row gap-6 rounded-2xl bg-cyan-900 px-8 py-8">
          <div className="min-w-0 flex-1">
            {stepKey === "category" && <StepCategory onSelect={selectCategory} language={language} />}
            {stepKey === "complaint" && category && (
              <StepComplaint category={category} onSelect={selectComplaint} language={language} />
            )}
            {stepKey === "details" && complaint && (
              <StepDetails
                complaint={complaint}
                durationValue={durationValue}
                durationUnit={durationUnit}
                extras={extras}
                onDurationValue={setDurationValue}
                onDurationUnit={setDurationUnit}
                onExtra={(id, v) => setExtras((prev) => ({ ...prev, [id]: v }))}
                language={language}
              />
            )}
            {stepKey === "pain" && complaint?.pain && (
              <StepPain complaint={complaint} selected={painLocations} onToggle={togglePain} language={language} />
            )}
            {stepKey === "severity" && complaint && (
              <StepSeverity complaint={complaint} severity={severity} onSelect={setSeverity} language={language} />
            )}
          </div>

          <div className="flex flex-col justify-between gap-4">
            <SummaryPanel
              category={category}
              complaint={complaint}
              durationText={displayDurationText}
              extraLines={extraLines}
              painLocations={painLocations}
              severity={severity}
              language={language}
            />

            <div className="mt-4 flex flex-col gap-2">
              {submissionError && (
                <p role="alert" className="rounded-lg border border-red-700 bg-red-950/60 px-3 py-2 text-sm text-red-200">
                  {language === "en" ? submissionError : textForLanguage(submissionError, language)}
                </p>
              )}
              {(stepKey === "details" || stepKey === "pain" || stepKey === "severity") && (
                <button
                  type="button"
                  disabled={!canContinue || isSubmitting}
                  onClick={handleContinue}
                  className={`rounded-xl px-5 py-3 text-base font-bold transition-all
                    ${canContinue && !isSubmitting
                      ? "cursor-pointer bg-orange-50 text-cyan-950 hover:bg-orange-100"
                      : "cursor-not-allowed bg-cyan-800 text-cyan-500"}`}
                >
                  {isSubmitting
                    ? textForLanguage("Saving patient…", language)
                    : textForLanguage(stepKey === "severity" ? "Proceed →" : "Continue →", language)}
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="mt-1 cursor-pointer text-center text-xs text-cyan-600 hover:text-cyan-400 hover:underline"
              >
                {textForLanguage("Start over", language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}