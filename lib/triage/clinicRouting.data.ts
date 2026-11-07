// ─────────────────────────────────────────────────────────────────────────────
// THE FILE YOU EDIT when the clinical sheet changes.
//
// Each complaint has:
//   questions → what the patient is asked (single / multi / count)
//   rules     → URGENT(...) / PRIORITY(...) with a plain reason for the nurse
//   pain      → PAIN_STD if the 1-5 pain scale applies (omit if not)
//   defaultLevel → only when "no rule matched" should NOT be REGULAR
// Highest matching level wins. After editing, run validateRouting() (it also runs
// automatically in dev and logs to the console).
//
// HOW TO CHANGE THINGS
//   Rename/add a symptom option  → edit the ["id","Label"] pair, update rules that use the id
//   Change urgency of a symptom  → move its id between URGENT(...) and PRIORITY(...) rules
//   Change a number cut-off      → edit THRESHOLDS below
// ─────────────────────────────────────────────────────────────────────────────
import type {
  Category, Complaint, Cond, PainRule, Question, Range, Rule, VitalKey,
} from "./types";

/** Numeric cut-offs used by the rules. Change them here only. */
export const THRESHOLDS = {
  feverVeryHighC: 40,
  spo2Low: 90,
  sbpCrisis: 180,
  dbpCrisis: 120,
  sbpElevated: 140,   // pregnancy "elevated BP"
  dbpElevated: 90,
  glucoseCrisis: 400, // mg/dL
  stoolsUrgentOver: 5,
  vomitUrgentOver: 3,
  nightPeeFrequent: 3,
} as const;
const T = THRESHOLDS;

export const PAIN_SCALE = [
  { value: 1, emoji: "😊", label: "None", hint: "No pain" },
  { value: 2, emoji: "🙂", label: "Mild", hint: "Noticeable, does not limit activity" },
  { value: 3, emoji: "😐", label: "Moderate", hint: "Interferes with daily activity" },
  { value: 4, emoji: "😣", label: "Severe", hint: "Limits most activity" },
  { value: 5, emoji: "😭", label: "Very severe", hint: "Agonizing, unbearable" },
];

// ── helpers (keep the data below short) ──────────────────────────────────────
type Pairs = [string, string][];
const opts = (p: Pairs) => p.map(([id, label]) => ({ id, label }));
const single = (id: string, text: string, p: Pairs): Question => ({ id, text, type: "single", options: opts(p) });
const multi = (id: string, text: string, p: Pairs): Question => ({ id, text, type: "multi", options: opts(p) });
const count = (id: string, text: string, unit: string, short: string, decimal = false): Question =>
  ({ id, text, type: "count", unit, short, decimal });

const is = (q: string, ...ids: string[]): Cond => ({ q, is: ids });
const n = (q: string, num: Range): Cond => ({ q, num });
const vit = (vital: VitalKey, r: Range): Cond => ({ vital, ...r });
const pain = (...p: number[]): Cond => ({ pain: p });
const all = (...c: Cond[]): Cond => ({ all: c });
const any = (...c: Cond[]): Cond => ({ any: c });
const not = (c: Cond): Cond => ({ not: c });
const U = (reason: string, when: Cond): Rule => ({ level: "URGENT", reason, when });
const P = (reason: string, when: Cond): Rule => ({ level: "PRIORITY", reason, when });

const PAIN_STD: PainRule = { urgent: [4, 5], priority: [3] };

const other = (code: string): Complaint => ({
  id: `CC_${code}_OTHER`, label: "Other concern (not listed)", sublabel: "You can explain more to the nurse",
  systemValue: `${code}_OTHER`, pain: PAIN_STD,
  questions: [single("dur", "How long has this been going on?",
    [["lt24h", "Less than 24 hours"], ["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["gt1w", "More than 1 week"]])],
  rules: [],
});

const breast = (id: string, systemValue: string, surgery: boolean): Complaint => ({
  id, systemValue,
  label: "Breast lump or pain",
  sublabel: surgery ? "Lump, pain, swelling, or nipple discharge" : "A new lump or a change in the breast",
  pain: surgery ? PAIN_STD : undefined,
  questions: [
    multi("loc", "Which breast and where?", [["right", "Right breast"], ["left", "Left breast"],
      ["upperOuter", "Upper/outer area"], ["underNipple", "Under the nipple"], ["lower", "Lower area"]]),
    single("dur", "How long has the lump been present?",
      [["lt1w", "Appeared within the last week"], ["1to4w", "1 to 4 weeks"], ["gt1m", "More than 1 month"]]),
    multi("flags", "Any of these?", [
      ["growing", "Growing quickly"], ["dimple", "Skin dimpling or nipple changes"],
      ["hard", "Hard and unchanged"], ["cycle", "Changes with the monthly cycle"],
      ...(surgery ? ([["painFever", "Painful lump with fever"], ["discharge", "Fluid coming from the nipple on its own"],
        ["infection", "Swelling, redness, or warmth"]] as Pairs) : []),
    ]),
  ],
  rules: [
    U("Lump appeared within the last week", is("dur", "lt1w")),
    U("Growing quickly", is("flags", "growing")),
    U("Skin dimpling or nipple changes (fast-track to Surgery)", is("flags", "dimple")),
    P("Hard, unchanged lump for more than 1 month", all(is("dur", "gt1m"), is("flags", "hard"))),
    ...(surgery ? [
      U("Painful lump with fever", is("flags", "painFever")),
      // TODO(clinical): the Surgery breast row in the sheet had no rules of its own; these two are assumptions
      P("Nipple discharge", is("flags", "discharge")),
      P("Swelling, redness, or warmth", is("flags", "infection")),
    ] : []),
  ],
});

/** Groin / scrotal complaints share questions and rules. */
const groin = (id: string, systemValue: string, label: string, sublabel: string, loc: Pairs): Complaint => ({
  id, systemValue, label, sublabel, pain: PAIN_STD,
  questions: [
    single("loc", "Where is it?", loc),
    single("dur", "How long has the bulge, swelling, or pain been present?", [
      ["sudden", "Started suddenly (within hours)"], ["1to4w", "1 to 4 weeks"],
      ["gt1m", "More than 1 month"], ["childhood", "Since childhood"]]),
    single("pattern", "When is it worst?", [
      ["constant", "Constant"], ["standing", "Only when standing, coughing, or lifting"],
      ["reducible", "Comes and goes (goes back in on its own)"]]),
    multi("flags", "Any of these?", [
      ["stuck", "Bulge cannot be pushed back in"], ["vomitFever", "Vomiting or fever"],
      ["racing", "Racing heartbeat"], ["severeTesticular", "Severe sudden testicle pain"],
      ["painful", "The bulge is painful"], ["growing", "Discomfort is growing"],
      ["heavy", "Painless heaviness"]]),
  ],
  rules: [
    U("Bulge stuck + vomiting/fever + racing heartbeat",
      all(is("pattern", "constant"), is("flags", "stuck"), is("flags", "vomitFever"), is("flags", "racing"))),
    U("Sudden severe testicular pain (torsion protocol)", all(is("dur", "sudden"), is("flags", "severeTesticular"))),
    U("Painful bulge at the thigh crease (femoral)", all(is("loc", "femoral"), is("flags", "painful"))),
    U("Groin bulge with constant pain, hours old",
      all(is("loc", "direct", "indirect", "femoral"), is("dur", "sudden"), is("pattern", "constant"))),
    P("Bulge for 1 to 4 weeks", all(is("loc", "direct", "indirect", "femoral"), is("dur", "1to4w"))),
    P("Over 1 month with growing discomfort", all(is("dur", "gt1m"), is("flags", "growing"))),
    P("Ongoing testicular pain", is("loc", "testPain")),
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
export const CATEGORIES: Category[] = [
  // ═══════════════ CHILD HEALTH (PEDIATRICS) ═══════════════
  {
    id: "CAT_PEDIA", label: "Child Health", shortLabel: "Child Health", icon: "👶",
    description: "For patients under 19 years old", clinic: "Pediatrics",
    complaints: [
      {
        id: "CC_PED_FEVER", label: "Fever", sublabel: "Warm to touch or high temperature", systemValue: "PED_FEVER",
        pain: PAIN_STD,
        questions: [
          single("dur", "How long has your child had the fever?",
            [["lt24h", "Less than 24 hours"], ["1to3d", "1 to 3 days"], ["gt3d", "More than 3 days"]]),
          multi("pattern", "Is the fever...?", [
            ["constant", "Constant (not coming down)"], ["intermittent", "Comes and goes"],
            ["rash", "With rash or spots on the skin"], ["seizure", "With seizures or unusual sleepiness"]]),
        ],
        rules: [
          U("Seizures or unusual sleepiness with fever", is("pattern", "seizure")),
          U("Fever with rash or spots", is("pattern", "rash")),
          U("Constant fever, not coming down", is("pattern", "constant")),
          P("Fever for more than 3 days", is("dur", "gt3d")),
        ],
      },
      {
        id: "CC_PED_COUGH", label: "Cough or difficulty breathing", sublabel: "Noisy breathing, cough, or colds",
        systemValue: "PED_COUGH",
        questions: [
          single("dur", "How long has your child been coughing or having trouble breathing?",
            [["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["1to2w", "1 to 2 weeks"], ["gt2w", "More than 2 weeks"]]),
          single("breathing", "When does the breathing difficulty happen?", [
            ["none", "No trouble breathing"], ["constant", "Constant, even at rest"],
            ["cough", "Only when coughing or crying"], ["feeding", "Only when feeding"]]),
          multi("signs", "Any of these?", [["wheeze", "Whistling sound when breathing"]]),
        ],
        rules: [
          U("Constant breathing distress, even at rest", is("breathing", "constant")),
          U("Cough more than 2 weeks (TB screening)", is("dur", "gt2w")),
          U("Breathing effort only when feeding (poor feeding)", is("breathing", "feeding")),
          P("Cough for 1 to 2 weeks", is("dur", "1to2w")),
          P("4 to 7 days with whistling sound", all(is("dur", "4to7d"), is("signs", "wheeze"))),
        ],
      },
      {
        id: "CC_PED_DIARRHEA", label: "Diarrhea or vomiting", sublabel: "Loose stools or throwing up",
        systemValue: "PED_DIARRHEA", pain: { urgent: [], priority: [3, 4] },
        questions: [
          single("dur", "How long has this been going on?", [
            ["lt24h", "Less than 24 hours"], ["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["gt1w", "More than 1 week"]]),
          count("stools", "How many times did your child pass loose stool today?", "times", "Loose stools today"),
          count("vomit", "How many times did your child vomit today?", "times", "Vomiting today"),
          multi("flags", "Any of these?", [
            ["noPee", "Has not peed today"], ["lessPee", "Peeing less than usual"],
            ["drowsy", "Extremely drowsy or cannot be woken"], ["noRetain", "Cannot keep anything down"],
            ["blood", "Blood or mucus in the stool"]]),
        ],
        rules: [
          U("No urine today + extreme drowsiness", all(is("flags", "noPee"), is("flags", "drowsy"))),
          U("Vomiting more than 3 times and nothing retained",
            all(n("vomit", { gt: T.vomitUrgentOver }), is("flags", "noRetain"))),
          U("More than 5 stools per day", n("stools", { gt: T.stoolsUrgentOver })),
          U("Blood or mucus in stool", is("flags", "blood")),
          U("Peeing less than usual", is("flags", "lessPee")),
          P("3 to 5 stools per day for 1 to 3 days", all(n("stools", { gte: 3, lte: T.stoolsUrgentOver }), is("dur", "1to3d"))),
          P("Watery stool for more than 1 week", is("dur", "gt1w")),
        ],
      },
      {
        id: "CC_PED_TUMMY", label: "Tummy pain", sublabel: "Belly pain in a child", systemValue: "PED_TUMMY_PAIN",
        pain: { urgent: [5], priority: [3, 4] },
        questions: [
          single("loc", "Where does it hurt?", [
            ["navel", "Around the belly button"], ["lrq", "Lower right belly"], ["llq", "Lower left belly"],
            ["upper", "Upper belly"], ["all", "All over the belly"]]),
          single("dur", "How long has the pain lasted?", [
            ["constant", "Constant (non-stop)"], ["gt1d", "More than 1 day"], ["4to24h", "4 to 24 hours"],
            ["intermittent", "Comes and goes (cramping)"]]),
          multi("flags", "Any of these?", [
            ["fever", "Fever"], ["rigid", "Belly feels hard like a wooden board"], ["worsening", "Getting worse"],
            ["vomitNoStool", "Vomiting and no stool passed today"], ["plays", "Child plays normally between episodes"]]),
        ],
        rules: [
          U("Constant pain with fever or rigid belly", all(is("dur", "constant"), is("flags", "fever", "rigid"))),
          U("Constant and worsening", all(is("dur", "constant"), is("flags", "worsening"))),
          U("Vomiting with no stool passed today", is("flags", "vomitNoStool")),
          U("Severe pain (4) with fever", all(pain(4), is("flags", "fever"))),
          P("Pain for more than 1 day", is("dur", "gt1d")),
          P("Persistent upper or lower belly pain", all(is("loc", "lrq", "llq", "upper"), is("dur", "constant"))),
        ],
      },
      {
        id: "CC_PED_EAR", label: "Ear pain or ear discharge", sublabel: "Pain in the ear or fluid coming out",
        systemValue: "PED_EAR", pain: PAIN_STD,
        questions: [
          single("side", "Which ear is affected?", [["right", "Right ear"], ["left", "Left ear"], ["both", "Both ears"]]),
          single("dur", "How long has the pain or discharge lasted?",
            [["today", "Started today"], ["1to3d", "1 to 3 days"], ["gt3d", "More than 3 days"]]),
          multi("flags", "Any of these?", [
            ["swellBehind", "Painful red swelling behind the ear"], ["fever", "Fever"],
            ["nerve", "Droopy face, dizziness, or confusion"], ["foul", "Continuous foul-smelling discharge"],
            ["discharge", "Any discharge"]]),
        ],
        rules: [
          U("Swelling behind the ear + fever", all(is("flags", "swellBehind"), is("flags", "fever"))),
          U("Nerve signs (droopy face, dizziness, confusion)", is("flags", "nerve")),
          U("Continuous foul-smelling discharge", is("flags", "foul")),
          U("Ear pain for more than 3 days", is("dur", "gt3d")),
          P("1 to 3 days of pain, no discharge", all(is("dur", "1to3d"), not(is("flags", "discharge")))),
        ],
      },
      {
        id: "CC_PED_RASH", label: "Skin rash", sublabel: "A new or spreading rash", systemValue: "PED_RASH",
        questions: [
          single("loc", "Where is the rash?", [
            ["face", "Face only"], ["trunk", "Body/trunk"], ["limbs", "Arms and legs"],
            ["all", "All over the body"], ["diaper", "Diaper area"]]),
          single("dur", "How long has the rash been there?",
            [["lt24h", "Less than 24 hours"], ["24to48h", "24 to 48 hours"], ["gt48h", "More than 48 hours"]]),
          multi("flags", "Any of these?", [
            ["purple", "Tiny flat purple/red spots"], ["fever", "Fever"],
            ["looksIll", "Child looks extremely ill, pale, or weak"], ["spreading", "Rash is spreading"],
            ["itchy", "Itchy and widespread"]]),
        ],
        rules: [
          U("Purple/red spots + fever + looks extremely ill",
            all(is("flags", "purple"), is("flags", "fever"), is("flags", "looksIll"))),
          U("Rash with fever", is("flags", "fever")),
          P("Rash over 48 hours and spreading", all(is("dur", "gt48h"), is("flags", "spreading"))),
          P("Itchy and widespread", is("flags", "itchy")),
        ],
      },
      {
        id: "CC_PED_NEWBORN", label: "Newborn concern (under 1 month)", sublabel: "For babies 0 to 28 days old",
        systemValue: "PED_NEWBORN",
        questions: [
          single("age", "How many days old is the baby?", [["0to7", "0 to 7 days"], ["8to14", "8 to 14 days"], ["15to28", "15 to 28 days"]]),
          single("dur", "How long has the problem (yellow skin or feeding) lasted?",
            [["today", "Noticed today (sudden)"], ["1to3d", "1 to 3 days"], ["constant", "Constant and getting worse"]]),
          multi("flags", "Any of these?", [
            ["fever", "Fever"], ["weak", "Too weak to feed or suck"], ["palms", "Palms and soles also yellow"],
            ["lessHalf", "Feeding less than half of usual"], ["slightLess", "Feeding slightly less, otherwise stable"],
            ["faceChest", "Yellow face and chest"], ["faceOnly", "Yellow face only, feeding normally"]]),
        ],
        rules: [
          U("Newborn with fever", is("flags", "fever")),
          U("Too weak to feed or suck", is("flags", "weak")),
          U("Jaundice spreading to palms and soles", is("flags", "palms")),
          U("Feeding less than half of usual", is("flags", "lessHalf")),
          U("Constant, worsening concern", is("dur", "constant")),
          P("Face and chest jaundice at 8 to 28 days", all(is("age", "8to14", "15to28"), is("flags", "faceChest"))),
          P("Feeding slightly reduced", is("flags", "slightLess")),
        ],
      },
      {
        id: "CC_PED_GROWTH", label: "Growth or development concern", sublabel: "Not gaining weight or missing milestones",
        systemValue: "PED_GROWTH",
        questions: [
          single("dur", "How long has the concern been observed?",
            [["lt3m", "Less than 3 months"], ["3to6m", "3 to 6 months"], ["gt6m", "More than 6 months"]]),
          single("pattern", "Is the concern...?", [
            ["constant", "No weight gain / no new skills (not improving)"], ["slowed", "Slowed but still progressing"],
            ["regress", "Lost skills previously gained"]]),
          multi("flags", "Any of these?", [
            ["wasting", "Extreme thinness or severe body swelling"], ["fever", "Fever"],
            ["weak", "Weakness"], ["breathing", "Trouble breathing"]]),
        ],
        rules: [
          U("Lost skills previously gained (regression)", is("pattern", "regress")),
          U("Severe wasting/swelling + fever, weakness, or breathing trouble",
            all(is("flags", "wasting"), is("flags", "fever", "weak", "breathing"))),
          P("No weight gain / milestone progress", is("pattern", "constant")),
          P("Slowed progress beyond 3 months", all(is("pattern", "slowed"), is("dur", "3to6m", "gt6m"))),
        ],
      },
      {
        id: "CC_PED_IMMUNIZATION", label: "Vaccination or well-child visit", sublabel: "Routine shots or growth check-up",
        systemValue: "PED_IMMUNIZATION",
        questions: [
          single("purpose", "What is the purpose of the visit?", [
            ["routine", "Routine scheduled vaccination"], ["catchup", "Catch-up vaccination (missed dose)"],
            ["growth", "Routine growth check-up"]]),
          single("symptoms", "Any current symptoms?", [
            ["none", "None"], ["mildFever", "Mild fever (less than 24 hours) after a previous vaccine"],
            ["illness", "Active illness today"]]),
        ],
        rules: [
          U("Active illness today (reroute to the illness pathway)", is("symptoms", "illness")),
          P("Mild fever less than 24 hours after a previous vaccine", is("symptoms", "mildFever")),
        ],
      },
      other("PED"),
    ],
  },

  // ═══════════════ WOMEN'S & PREGNANCY HEALTH (OB-GYNE) ═══════════════
  {
    id: "CAT_OBGYNE", label: "Women's & Pregnancy Health", shortLabel: "Women's Health", icon: "🤰",
    description: "Pregnancy, periods, and women's health concerns", clinic: "OB-GYNE",
    complaints: [
      {
        id: "CC_OB_PRENATAL", label: "Pregnancy check-up or concern", sublabel: "Prenatal visit or a problem while pregnant",
        systemValue: "OB_PRENATAL",
        questions: [
          single("visit", "Is this visit...?", [["first", "First check-up (new pregnancy)"], ["followup", "Routine follow-up"]]),
          single("tri", "How far along are you?", [
            ["t1", "Less than 14 weeks"], ["t2", "14 to 27 weeks"], ["t3", "28 weeks or more"]]),
          multi("sym", "Any of these?", [
            ["swelling", "Headache with swelling of the face or hands"], ["constant", "Constant headache"],
            ["intermittent", "Headache that comes and goes"]]),
        ],
        rules: [
          U("Constant headache in pregnancy", is("sym", "constant")),
          U("Headache + swelling with elevated blood pressure",
            all(is("sym", "swelling"), any(vit("systolic", { gte: T.sbpElevated }), vit("diastolic", { gte: T.dbpElevated })))),
          P("Headache with face/hand swelling", is("sym", "swelling")),
          P("Intermittent headache", is("sym", "intermittent")),
          P("First check-up already in 3rd trimester", all(is("visit", "first"), is("tri", "t3"))),
        ],
      },
      {
        id: "CC_OB_BLEED_PREG", label: "Vaginal bleeding while pregnant", sublabel: "Any bleeding during pregnancy",
        systemValue: "OB_VAG_BLEED_PREG", pain: PAIN_STD, defaultLevel: "PRIORITY", // any bleeding in pregnancy is at least Priority
        questions: [
          single("tri", "How far along are you?", [["t1", "Less than 14 weeks"], ["t2", "14 to 27 weeks"], ["t3", "28 weeks or more"]]),
          single("bleed", "How heavy is the bleeding?", [
            ["spotting", "Spotting only"], ["moderate", "2 to 3 pads per day"], ["heavy", "Soaking 1 pad or more per hour"]]),
          single("dur", "How long has the bleeding lasted?", [
            ["sudden", "Started within the last few hours"], ["4to24h", "4 to 24 hours"], ["gt1d", "More than 1 day"]]),
          single("painLoc", "Where is any pain?", [
            ["none", "No pain"], ["all", "Lower belly, all over"], ["right", "Right lower belly"],
            ["left", "Left lower belly"], ["cramp", "Cramping, comes and goes"]]),
          multi("flags", "Any of these?", [["dizzy", "Dizziness or faintness"]]),
        ],
        rules: [
          U("Heavy bleeding (1+ pad per hour)", is("bleed", "heavy")),
          U("Sudden bleeding with pain or dizziness",
            all(is("dur", "sudden"), any(is("flags", "dizzy"), pain(2, 3, 4, 5)))),
          U("Moderate bleeding (2 to 3 pads per day)", is("bleed", "moderate")),
          U("Any bleeding in the 3rd trimester", is("tri", "t3")),
          P("Spotting in 1st or 2nd trimester", all(is("bleed", "spotting"), is("tri", "t1", "t2"))),
          P("Bleeding for more than 1 day", is("dur", "gt1d")),
        ],
      },
      {
        id: "CC_OB_BLEED", label: "Vaginal bleeding (not pregnant)", sublabel: "Heavy or unusual bleeding",
        systemValue: "OB_VAG_BLEED_NONPREG", pain: PAIN_STD,
        questions: [
          single("dur", "How long has this bleeding lasted?", [["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["gt7d", "More than 7 days"]]),
          single("when", "When does the bleeding happen?", [
            ["usual", "During my usual period"], ["constant", "Constant (continuous flow)"],
            ["afterSex", "After sexual intercourse"], ["between", "Between periods"]]),
          single("flow", "How heavy is the flow?", [
            ["same", "Same as a normal period"], ["heavier", "Heavier than a normal period"],
            ["heavyFaint", "Soaking pads rapidly, with faintness or racing pulse"]]),
        ],
        rules: [
          U("Soaking pads rapidly with faintness/racing pulse", is("flow", "heavyFaint")),
          U("Bleeding for more than 7 days", is("dur", "gt7d")),
          U("Heavier than a normal period", is("flow", "heavier")),
          U("Bleeding after sexual intercourse", is("when", "afterSex")),
          P("4 to 7 days of heavier flow", all(is("dur", "4to7d"), is("flow", "heavier"))), // CHECK: unreachable, "heavier" is already URGENT above
          P("Bleeding between periods", is("when", "between")),
        ],
      },
      {
        id: "CC_OB_AMENORRHEA", label: "Missed period", sublabel: "No period for one or more months",
        systemValue: "OB_AMENORRHEA", pain: PAIN_STD,
        questions: [
          single("dur", "How long has the period been missed?", [
            ["lt1w", "Less than 1 week (just due)"], ["1to4w", "1 to 4 weeks"], ["1to3m", "1 to 3 months"], ["gt3m", "More than 3 months"]]),
          single("pattern", "Is the absence...?", [
            ["none", "No period at all since the last one"], ["irregular", "Irregular cycles for months before this"],
            ["single", "Single missed cycle, regular before"]]),
          multi("flags", "Any of these?", [
            ["possPreg", "Possibly pregnant"], ["pregPos", "Positive pregnancy test"],
            ["sharpFaint", "Severe sharp belly pain with faintness"]]),
        ],
        rules: [
          U("Severe sharp belly pain + faintness, possibly pregnant (ectopic protocol)",
            all(is("flags", "possPreg", "pregPos"), is("flags", "sharpFaint"))),
          U("Missed more than 3 months with possible pregnancy", all(is("dur", "gt3m"), is("flags", "possPreg", "pregPos"))),
          P("Missed 1 to 3 months", is("dur", "1to3m")),
          P("Irregular cycles for months", is("pattern", "irregular")),
        ],
      },
      {
        id: "CC_OB_FAMILY_PLANNING", label: "Family planning", sublabel: "Starting or changing a method",
        systemValue: "OB_FAMILY_PLANNING", pain: { urgent: [], priority: [3] },
        questions: [
          single("lmp", "When was the first day of your last period?", [
            ["lt7d", "Within the last 7 days"], ["1to4w", "1 to 4 weeks ago"], ["gt4w", "More than 4 weeks ago"]]),
          single("status", "Current status?", [
            ["first", "Starting a method for the first time"], ["change", "Changing method"],
            ["side", "Current method with side effects"]]),
          multi("flags", "Any of these?", [
            ["foulFever", "Foul-smelling discharge + fever + severe lower belly pain"],
            ["severeSide", "Severe side effects (strong pain, heavy bleeding)"], ["mildSide", "Mild side effects"]]),
        ],
        rules: [
          U("Foul discharge + fever + severe lower belly pain", is("flags", "foulFever")),
          U("Severe side effects (pain, heavy bleeding)", is("flags", "severeSide")),
          P("Mild side effects", is("flags", "mildSide")),
        ],
      },
      {
        id: "CC_OB_PELVIC_PAIN", label: "Lower belly or pelvic pain", sublabel: "Pain linked to the reproductive organs",
        systemValue: "OB_ABD_PAIN", pain: PAIN_STD,
        questions: [
          single("loc", "Where is the pain?", [
            ["rlq", "Right lower belly"], ["llq", "Left lower belly"], ["center", "Center of the lower belly"], ["all", "All over the lower belly"]]),
          single("dur", "How long has the pain lasted?", [["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["gt7d", "More than 7 days"]]),
          single("pattern", "Is the pain...?", [
            ["constant", "Constant (non-stop)"], ["intermittent", "Comes and goes"], ["cyclic", "Only during my period"]]),
          multi("flags", "Any of these?", [["pregPos", "Positive pregnancy test"], ["bleeding", "Vaginal bleeding"]]),
        ],
        rules: [
          U("Constant pain + positive pregnancy test or bleeding", all(is("pattern", "constant"), is("flags", "pregPos", "bleeding"))),
          P("One-sided lower belly pain, 1 to 3 days, on and off",
            all(is("loc", "rlq", "llq"), is("dur", "1to3d"), is("pattern", "intermittent"))),
        ],
      },
      {
        id: "CC_OB_DISCHARGE", label: "Vaginal discharge or itching", sublabel: "Change in color, smell, or texture",
        systemValue: "OB_VAG_DISC", pain: PAIN_STD,
        questions: [
          single("dur", "How long has the discharge lasted?", [["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["gt1w", "More than 1 week"]]),
          single("pattern", "Is the discharge...?", [["constant", "Constant (daily)"], ["intermittent", "Comes and goes"]]),
          multi("flags", "Any of these?", [
            ["foul", "Foul-smelling"], ["blood", "Blood mixed in"], ["color", "Yellow, green, or gray color"],
            ["itch", "Itching or irritation"], ["fever", "Fever"], ["severePelvic", "Severe lower belly/pelvic pain"]]),
        ],
        rules: [
          U("Discharge + fever + severe pelvic pain (pelvic infection protocol)", all(is("flags", "fever"), is("flags", "severePelvic"))),
          U("Foul-smelling discharge", is("flags", "foul")),
          U("Blood mixed in", is("flags", "blood")),
          P("Color change", is("flags", "color")),
          P("Itching/irritation for more than 1 week", all(is("flags", "itch"), is("dur", "gt1w"))),
        ],
      },
      breast("CC_OB_BREAST", "OB_BREAST_LUMP", false),
      {
        id: "CC_OB_MENOPAUSE", label: "Menopause symptoms", sublabel: "Hot flashes, mood changes, or dryness",
        systemValue: "OB_MENOPAUSE",
        questions: [
          single("lmp", "How long since your last period?", [["1to6m", "1 to 6 months"], ["6to12m", "6 to 12 months"], ["gt12m", "More than 12 months"]]),
          single("dur", "How long have the symptoms lasted?", [["lt1m", "Less than 1 month"], ["1to6m", "1 to 6 months"], ["gt6m", "More than 6 months"]]),
          single("freq", "How often are the hot flashes?", [["constant", "Many times a day"], ["intermittent", "A few per week"]]),
          multi("flags", "Any of these?", [
            ["bleed", "Vaginal bleeding or spotting after menopause"], ["disrupt", "Hot flashes disrupt sleep or daily life"]]),
        ],
        rules: [
          U("Bleeding after menopause", is("flags", "bleed")),
          P("Frequent hot flashes disrupting sleep/daily life", all(is("freq", "constant"), is("flags", "disrupt"))),
        ],
      },
      other("OB"),
    ],
  },

  // ═══════════════ ADULT ILLNESS (INTERNAL MEDICINE) ═══════════════
  {
    id: "CAT_INTERNAL", label: "Adult Illness", shortLabel: "Adult Illness", icon: "🫀",
    description: "Fever, cough, heart, blood pressure, sugar, and other illness in adults", clinic: "Internal Medicine",
    complaints: [
      {
        id: "CC_IM_FEVER", label: "Fever", sublabel: "New or ongoing high temperature", systemValue: "IM_FEVER",
        pain: PAIN_STD,
        questions: [
          single("dur", "How long have you had the fever?", [["lt24h", "Less than 24 hours"], ["1to3d", "1 to 3 days"], ["gt1w", "More than 1 week"]]),
          single("pattern", "Is the fever...?", [["constant", "Constant (not coming down)"], ["intermittent", "Comes and goes"]]),
          multi("flags", "Any of these?", [
            ["dizzy", "Severe dizziness or fainting"], ["confusion", "Sudden confusion, sleepiness, or acting strangely"],
            ["breathless", "Exhausting shortness of breath"], ["noBetter", "Not getting better"]]),
        ],
        rules: [
          U("Very high fever + severe dizziness/fainting",
            all(vit("temp", { gte: T.feverVeryHighC }), is("flags", "dizzy"))),
          U("Sudden confusion/sleepiness/acting strangely", is("flags", "confusion")),
          U("Low oxygen with exhausting breathlessness", all(vit("spo2", { lt: T.spo2Low }), is("flags", "breathless"))),
          U("Constant fever", is("pattern", "constant")),
          U("Fever for more than 1 week", is("dur", "gt1w")),
          P("1 to 3 days, not improving", all(is("dur", "1to3d"), is("flags", "noBetter"))),
        ],
      },
      {
        id: "CC_IM_COUGH", label: "Cough or difficulty breathing", sublabel: "Cough or shortness of breath", systemValue: "IM_COUGH",
        questions: [
          single("dur", "How long have you been coughing?", [
            ["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["1to2w", "1 to 2 weeks"], ["gt2w", "More than 2 weeks"]]),
          single("breathing", "When is the breathing difficulty?", [
            ["none", "No trouble breathing"], ["constant", "Constant, even at rest"], ["cough", "Only when coughing or moving"],
            ["flat", "Only when lying flat (must sit up)"], ["exertion", "Only with exertion (walking, stairs)"]]),
          multi("flags", "Any of these?", [["bloodSpit", "Blood in the spit"], ["breathless", "Exhausting shortness of breath"]]),
        ],
        rules: [
          U("Constant breathlessness", is("breathing", "constant")),
          U("Low oxygen + exhausting breathlessness", all(vit("spo2", { lt: T.spo2Low }), is("flags", "breathless"))),
          U("Cough over 2 weeks with blood in spit (TB screening)", all(is("dur", "gt2w"), is("flags", "bloodSpit"))),
          U("Breathless only when lying flat", is("breathing", "flat")),
          P("Cough for 1 to 2 weeks", is("dur", "1to2w")),
          P("Breathless with exertion", is("breathing", "exertion")),
        ],
      },
      {
        id: "CC_IM_CHEST", label: "Chest discomfort or racing heart", sublabel: "Tightness, palpitations, irregular heartbeat",
        systemValue: "IM_CHEST_PALP", pain: PAIN_STD,
        questions: [
          multi("loc", "Where is the chest discomfort?", [
            ["center", "Center of the chest"], ["left", "Left side of the chest"], ["right", "Right side of the chest"],
            ["spreads", "Spreads to arm, neck, or jaw"]]),
          single("ep", "How long does each episode last?", [
            ["brief", "Seconds to a few minutes"], ["5to30m", "5 to 30 minutes"], ["gt30m", "More than 30 minutes"]]),
          multi("flags", "Any of these?", [
            ["coldSweat", "Sudden cold sweat"], ["atRest", "Happens at rest"],
            ["exertion", "Only when moving or exercising"], ["knownHeart", "Known heart problem"]]),
        ],
        rules: [
          U("Severe chest pain spreading to arm/neck/jaw + cold sweat",
            all(is("loc", "spreads"), is("flags", "coldSweat"), pain(4, 5))),
          U("Episode over 30 minutes at rest", all(is("ep", "gt30m"), is("flags", "atRest"))),
          U("Central or spreading pain lasting 5 to 30 minutes", all(is("loc", "center", "spreads"), is("ep", "5to30m"))),
          P("Brief episodes with a known heart problem", all(is("ep", "brief"), is("flags", "knownHeart"))),
        ],
      },
      {
        id: "CC_IM_HTN", label: "High blood pressure", sublabel: "Known or newly found", systemValue: "IM_HTN",
        questions: [
          single("dur", "How long have the headaches or symptoms lasted?", [
            ["none", "No symptoms"], ["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["daily", "Constant (every day)"]]),
          single("when", "When do the symptoms occur?", [
            ["none", "No symptoms"], ["allDay", "Constant throughout the day"], ["morning", "Mostly in the morning"],
            ["intermittent", "Comes and goes"]]),
          multi("flags", "Any of these?", [
            ["severeHead", "Sudden severe headache"], ["blurry", "Blurry vision"], ["chestPain", "Chest pain"],
            ["noReadings", "No blood pressure readings yet (new diagnosis)"]]),
        ],
        rules: [
          U("BP over 180/120 with organ-damage signs",
            all(any(vit("systolic", { gt: T.sbpCrisis }), vit("diastolic", { gt: T.dbpCrisis })),
              is("flags", "severeHead", "blurry", "chestPain"))),
          U("Constant daily headaches", is("dur", "daily")),
          P("Symptoms mostly in the morning", is("when", "morning")),
          P("New diagnosis without readings", is("flags", "noReadings")),
        ],
      },
      {
        id: "CC_IM_DM", label: "Diabetes or high blood sugar", sublabel: "Very thirsty, peeing often, or sugar follow-up",
        systemValue: "IM_DIABETES",
        questions: [
          single("dur", "How long have the symptoms (thirst, frequent peeing, hunger) lasted?", [
            ["none", "No symptoms (routine follow-up)"], ["lt1w", "Less than 1 week"], ["1to4w", "1 to 4 weeks"], ["gt1m", "More than 1 month"]]),
          single("freq", "Is the frequent urination...?", [
            ["none", "Not frequent"], ["constant", "Constant (day and night)"], ["day", "Only during the day"],
            ["night", "Mostly at night (3 or more times)"]]),
          multi("flags", "Any of these?", [["dka", "Fruity-smelling breath with constant vomiting"]]),
        ],
        rules: [
          U("Very high sugar signs (fruity breath + vomiting)", is("flags", "dka")),
          U("Blood sugar over 400 mg/dL", vit("glucose", { gt: T.glucoseCrisis })),
          U("New symptoms (<1 week) + constant urination", all(is("dur", "lt1w"), is("freq", "constant"))),
          P("Mostly night-time urination", is("freq", "night")),
          P("Uncontrolled symptoms for more than 1 month", is("dur", "gt1m")),
        ],
      },
      {
        id: "CC_IM_THYROID", label: "Thyroid symptoms", sublabel: "Feeling too hot/cold, shakiness, tiredness",
        systemValue: "IM_THYROID",
        questions: [
          single("dur", "How long have the symptoms lasted?", [["lt1w", "Less than 1 week"], ["1to4w", "1 to 4 weeks"], ["gt1m", "More than 1 month"]]),
          single("pattern", "Are the symptoms...?", [["constant", "Constant"], ["intermittent", "Come and go"]]),
          multi("flags", "Any of these?", [
            ["neckSwell", "Growing neck swelling"],
            ["sobFlat", "Severe shortness of breath, cannot breathe lying flat, wet/bubbly breathing"]]),
        ],
        rules: [
          U("Severe breathlessness, cannot lie flat, crackling lungs", is("flags", "sobFlat")),
          U("Constant symptoms + growing neck swelling", all(is("pattern", "constant"), is("flags", "neckSwell"))),
          P("Intermittent symptoms for more than 1 month", all(is("pattern", "intermittent"), is("dur", "gt1m"))),
        ],
      },
      {
        id: "CC_IM_LEGS", label: "Swollen legs", sublabel: "Leg swelling, with or without shortness of breath", systemValue: "IM_SWOLLEN_LEGS",
        questions: [
          single("area", "Which legs/areas are swollen?", [
            ["both", "Both legs"], ["right", "Right leg only"], ["left", "Left leg only"],
            ["ankles", "Ankles and feet only"], ["thighs", "Up to the thighs"]]),
          single("dur", "How long has the swelling lasted?", [["acute", "1 to 3 days (sudden)"], ["1to4w", "1 to 4 weeks"], ["gt1m", "More than 1 month"]]),
          multi("flags", "Any of these?", [
            ["feverConfused", "Very high fever + racing heartbeat + sudden confusion or agitation"],
            ["sobFlat", "Breathless when lying flat"], ["sobExertion", "Breathless with exertion"],
            ["knownOrgan", "Known heart, kidney, or liver problem"]]),
        ],
        rules: [
          U("High fever + racing heart + confusion/delirium", is("flags", "feverConfused")),
          U("Sudden swelling of one leg (clot concern)", all(is("dur", "acute"), is("area", "right", "left"))),
          U("Swelling + breathless lying flat", is("flags", "sobFlat")),
          P("Over 1 month with known organ problem + breathless on exertion",
            all(is("dur", "gt1m"), is("flags", "knownOrgan"), is("flags", "sobExertion"))),
        ],
      },
      {
        id: "CC_IM_JAUNDICE", label: "Yellow skin or eyes", sublabel: "Yellowing of the skin or whites of the eyes",
        systemValue: "IM_JAUNDICE",
        questions: [
          single("dur", "How long have the skin/eyes been yellow?", [["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["gt1w", "More than 1 week"]]),
          single("pattern", "Is the yellowing...?", [["constant", "Getting darker each day"], ["intermittent", "Comes and goes"], ["stable", "Mild and not changing"]]),
          multi("flags", "Any of these?", [
            ["tea", "Dark (tea-colored) urine and pale stool"],
            ["chillsFaint", "Shaking chills with dizziness or faintness"], ["confusion", "Sudden confusion"]]),
        ],
        rules: [
          U("Shaking chills + low blood pressure signs + yellowing", is("flags", "chillsFaint")),
          U("Yellowing + sudden confusion", is("flags", "confusion")),
          U("Getting darker each day", is("pattern", "constant")),
          U("Dark urine and pale stool", is("flags", "tea")),
          P("Comes and goes", is("pattern", "intermittent")),
          P("Yellow for 4 to 7 days", is("dur", "4to7d")),
        ],
      },
      {
        id: "CC_IM_WEIGHT", label: "Unexplained weight loss", sublabel: "Losing weight without trying", systemValue: "IM_WEIGHT_LOSS",
        questions: [
          single("dur", "Over what period did the weight loss happen?", [["lt1m", "Less than 1 month"], ["1to3m", "1 to 3 months"], ["gt3m", "More than 3 months"]]),
          single("pattern", "Is the weight loss...?", [["progressive", "Still continuing"], ["stable", "Stabilized"]]),
          multi("flags", "Any of these?", [["sweats", "Night sweats or fever"]]),
          count("kg", "About how many kilograms have you lost?", "kg", "Weight lost", true),
        ],
        rules: [
          U("Sudden weight loss (<1 month)", is("dur", "lt1m")),
          P("Weight loss over 1 to 3 months", is("dur", "1to3m")),
          P("With night sweats or fever", is("flags", "sweats")),
        ],
      },
      {
        id: "CC_IM_FOOT", label: "Diabetic foot wound", sublabel: "A sore or wound on the foot", systemValue: "IM_DIAB_FOOT",
        pain: PAIN_STD,
        questions: [
          single("side", "Which foot/area is the wound on?", [
            ["right", "Right foot (sole, toes, heel)"], ["left", "Left foot (sole, toes, heel)"], ["between", "Between the toes"]]),
          single("dur", "How long has the wound been there?", [["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["gt1w", "More than 1 week"]]),
          multi("flags", "Any of these?", [
            ["gangrene", "Foul-smelling, black, or wet decaying wound"],
            ["sepsis", "High fever, severe shivering, or rapid breathing"],
            ["discharge", "Discharge or spreading redness"]]),
        ],
        rules: [
          U("Decaying wound + body-wide infection signs", all(is("flags", "gangrene"), is("flags", "sepsis"))),
          U("Non-healing >1 week with discharge/spreading redness", all(is("dur", "gt1w"), is("flags", "discharge"))),
          P("Wound for 4 to 7 days", is("dur", "4to7d")),
        ],
      },
      other("IM"),
    ],
  },

  // ═══════════════ LUMPS, INJURIES & BELLY PROBLEMS (SURGERY) ═══════════════
  {
    id: "CAT_SURG", label: "Lumps, Belly & Urinary Problems", shortLabel: "Surgical Concerns", icon: "🩹",
    description: "Belly pain, lumps or swelling, groin bulge, and urinary problems", clinic: "General Surgery",
    complaints: [
      {
        id: "CC_GS_BELLY", label: "Stomach or belly pain", sublabel: "Pain anywhere in the belly", systemValue: "GS_ABD_PAIN",
        pain: PAIN_STD,
        questions: [
          single("loc", "Where is the pain?", [
            ["ruq", "Upper right (liver/gallbladder area)"], ["upperMid", "Upper middle (stomach area)"],
            ["lower", "Lower sides or lower belly"], ["all", "All over the belly"]]),
          single("dur", "How long has the pain lasted?", [
            ["today", "Started today (sudden)"], ["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["gt1w", "More than 1 week"]]),
          single("pattern", "Is the pain...?", [
            ["constant", "Constant"], ["intermittent", "Comes and goes (cramping)"],
            ["afterEating", "Worse after eating"], ["foodChange", "Better or worse with food"]]),
          multi("flags", "Any of these?", [
            ["fever", "Fever"], ["rigid", "Belly feels hard like a wooden board"], ["worsening", "Getting worse"],
            ["vomitBlood", "Vomiting blood or black tarry stools"], ["vomiting", "Vomiting"],
            ["noGas", "No gas or stool passing"], ["noAppetite", "No appetite or nausea"],
            ["chillsJaundice", "Shaking chills with dizziness and yellow skin/eyes"],
            ["bloating", "Persistent bloating"]]),
        ],
        rules: [
          // Upper right
          U("Upper right: constant pain + rigid belly + fever",
            all(is("loc", "ruq"), is("pattern", "constant"), is("flags", "rigid"), is("flags", "fever"))),
          U("Upper right: shaking chills + low BP signs + jaundice", all(is("loc", "ruq"), is("flags", "chillsJaundice"))),
          U("Upper right: constant, worsening, vomiting, no gas/stool",
            all(is("loc", "ruq"), is("pattern", "constant"), is("flags", "worsening"), is("flags", "vomiting"), is("flags", "noGas"))),
          U("Upper right: pain started today", all(is("loc", "ruq"), is("dur", "today"))),
          P("Upper right: 1 to 3 days", all(is("loc", "ruq"), is("dur", "1to3d"))),
          P("Upper right: worse after eating", all(is("loc", "ruq"), is("pattern", "afterEating"))),
          U("Upper right: vomiting blood or black tarry stools", all(is("loc", "ruq"), is("flags", "vomitBlood"))),
          // Upper middle
          U("Upper middle: vomiting blood/black stools + rigid belly", all(is("loc", "upperMid"), is("flags", "vomitBlood"), is("flags", "rigid"))),
          P("Upper middle: 1 to 3 days", all(is("loc", "upperMid"), is("dur", "1to3d"))),
          P("Upper middle: better or worse with food", all(is("loc", "upperMid"), is("pattern", "foodChange"))),
          // Lower
          U("Lower: constant, worsening + no appetite/nausea or fever",
            all(is("loc", "lower"), is("pattern", "constant"), is("flags", "worsening"), is("flags", "noAppetite", "fever"))),
          P("Lower: 1 to 3 days, on and off", all(is("loc", "lower"), is("dur", "1to3d"), is("pattern", "intermittent"))),
          // All over
          U("All over: constant, worsening, fever, silent belly",
            all(is("loc", "all"), is("pattern", "constant"), is("flags", "worsening"), is("flags", "fever"), is("flags", "noGas"))),
          P("All over: 4 to 7 days of persistent bloating", all(is("loc", "all"), is("dur", "4to7d"), is("flags", "bloating"))),
        ],
      },
      {
        id: "CC_GS_MASS", label: "Lump or swelling in the belly", sublabel: "A growth you can feel", systemValue: "GS_ABD_MASS",
        pain: PAIN_STD,
        questions: [
          single("dur", "How long has the bloating/swelling lasted?", [["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["gt1w", "More than 1 week"]]),
          multi("pattern", "Is the swelling...?", [
            ["worsening", "Constant and getting worse"], ["cramp", "Comes and goes with cramping pain"],
            ["vomiting", "With vomiting"], ["stable", "Long-standing, stable, unchanged"]]),
          multi("flags", "Any of these?", [["weightLoss", "Unexplained weight loss or unusual bleeding"]]),
        ],
        rules: [
          U("Constant and getting worse", is("pattern", "worsening")),
          U("With unexplained weight loss or unusual bleeding", is("flags", "weightLoss")),
          P("New swelling (4 to 7 days)", is("dur", "4to7d")),
        ],
      },
      breast("CC_GS_BREAST", "GS_BREAST_LUMP", true),
      {
        id: "CC_GS_NECK", label: "Lump or swelling in the neck", sublabel: "Thyroid area or other neck lumps", systemValue: "GS_NECK_LUMP",
        pain: PAIN_STD,
        questions: [
          single("loc", "Where is the swelling?", [
            ["goiter", "Front of the neck (goiter)"], ["thyroid", "A single lump in the thyroid area"],
            ["other", "Neck lump not in the thyroid area"], ["jaw", "Near the jaw or salivary glands"]]),
          single("dur", "How long has it been there?", [["lt1w", "Less than 1 week"], ["1to4w", "1 to 4 weeks"], ["gt1m", "More than 1 month"]]),
          multi("pattern", "Is the swelling...?", [
            ["constant", "Always present, same size"], ["growing", "Growing steadily"],
            ["eatBigger", "Gets bigger when eating"], ["comes", "Comes and goes"]]),
          multi("flags", "Any of these?", [
            ["swallow", "Trouble swallowing or a harsh whistling sound when breathing"],
            ["painFever", "Painful lump with fever"], ["hardFixed", "Hard, fixed lump"],
            ["nodes", "Swollen, hard lymph nodes on the side of the neck"], ["softLong", "Long-standing soft swelling"]]),
        ],
        rules: [
          U("Growing + trouble swallowing/breathing noise", all(is("pattern", "growing"), is("flags", "swallow"))),
          U("New painful lump with fever", all(is("dur", "lt1w"), is("flags", "painFever"))),
          U("Gets bigger when eating", is("pattern", "eatBigger")),
          P("Hard, fixed lump for more than 1 month", all(is("dur", "gt1m"), is("flags", "hardFixed"))),
          P("Swollen, hard lymph nodes on side of neck", is("flags", "nodes")),
        ],
      },
      groin("CC_GS_HERNIA", "GS_HERNIA", "Bulge in the groin or upper thigh", "Possible hernia", [
        ["direct", "Bulge in the groin (direct)"], ["indirect", "Bulge in the groin (indirect)"],
        ["femoral", "Bulge lower down at the thigh crease"]]),
      groin("CC_GS_SCROTAL", "GS_SCROTAL_SWELLING", "Scrotal swelling or testicular pain", "Swelling, heaviness, or pain", [
        ["scrotal", "Swelling in the scrotum"], ["testPain", "Ongoing pain in the testicles"]]),
      {
        id: "CC_GS_VOIDING", label: "Trouble peeing", sublabel: "Weak stream, frequent, urgent, or burning", systemValue: "GS_VOIDING",
        pain: PAIN_STD,
        questions: [
          single("dur", "How long have the urinary symptoms lasted?", [
            ["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["1to4w", "1 to 4 weeks"], ["gt1m", "More than 1 month"]]),
          multi("pattern", "Is it...?", [
            ["constant", "Constant discomfort"], ["burning", "Burning when peeing"],
            ["onlyUrinating", "Only when peeing"], ["ejac", "Only during/after ejaculation"],
            ["fever", "With fever and shivering"]]),
          multi("flags", "Any of these?", [
            ["noPee", "Cannot pass any urine"], ["pressure", "Severe painful pressure in the lower belly"],
            ["flank", "Severe pain in the back or side"],
            ["sepsis", "Confusion, rapid breathing, or a very fast heartbeat"]]),
          count("night", "How many times do you wake up at night to pee?", "times", "Night-time peeing"),
        ],
        rules: [
          U("Cannot pass urine + severe lower belly pressure", all(is("flags", "noPee"), is("flags", "pressure"))),
          U("Fever + severe flank pain + cannot pass urine", all(is("pattern", "fever"), is("flags", "flank"), is("flags", "noPee"))),
          U("Fever with confusion/rapid breathing/fast heartbeat (body-wide infection)", all(is("pattern", "fever"), is("flags", "sepsis"))),
          U("Constant discomfort + burning, with fever", all(is("pattern", "constant"), is("pattern", "burning"), is("pattern", "fever"))),
          P("Symptoms for 4 to 7 days, no fever", all(is("dur", "4to7d"), not(is("pattern", "fever")))),
          P("Peeing 3 or more times at night", n("night", { gte: T.nightPeeFrequent })),
        ],
      },
      {
        id: "CC_GS_HEMATURIA", label: "Blood in the urine", sublabel: "Red or brown urine", systemValue: "GS_HEMATURIA",
        defaultLevel: "PRIORITY", // TODO(clinical): sheet only lists the heavy-blood URGENT case; confirm default
        questions: [
          single("dur", "How long have you seen blood in your urine?", [["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["gt1w", "More than 1 week"]]),
          multi("flags", "Any of these?", [["heavy", "Visible heavy blood"], ["painless", "No pain when peeing"]]),
        ],
        rules: [
          U("Visible heavy blood in urine (painless over 40 = cancer screen)", is("flags", "heavy")),
        ],
      },
      {
        id: "CC_GS_KIDNEY", label: "Severe back or side pain", sublabel: "Sharp pain that may move to the groin",
        systemValue: "GS_KIDNEY_STONE", pain: PAIN_STD,
        questions: [
          single("loc", "Where is the pain?", [
            ["left", "Lower back - left"], ["right", "Lower back - right"],
            ["moves", "Side moving down to the groin"], ["whole", "Whole lower back"]]),
          single("dur", "How long have you had the pain?", [["1to3d", "1 to 3 days"], ["4to7d", "4 to 7 days"], ["gt1w", "More than 1 week"]]),
          multi("flags", "Any of these?", [["fever", "Fever"], ["noPee", "Cannot pass urine"]]),
        ],
        rules: [
          U("Back/side pain moving down to the groin (stone protocol)", is("loc", "moves")),
          U("Fever + cannot pass urine", all(is("flags", "fever"), is("flags", "noPee"))),
        ],
      },
      other("GS"),
    ],
  },
];