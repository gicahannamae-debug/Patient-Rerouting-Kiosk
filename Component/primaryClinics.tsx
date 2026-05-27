'use client';
import React, { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Question {
  id: string;           // system ID fed to ML
  text: string;         // what patient reads
  redFlag?: boolean;    // if YES → instant ER alert
}

interface SubComplaint {
  id: string;
  label: string;        // patient-friendly button label
  systemValue: string;  // hidden ML value
  clinic: string;       // target clinic
  questions: Question[];
}

interface Category {
  id: string;
  label: string;
  description: string;
  icon: string;
  subComplaints: SubComplaint[];
}

interface Answers {
  [questionId: string]: boolean; // true = YES, false = NO
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA — sourced from NMMC OPD Clinical Decision Tree & Sorting Mechanism
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  // ── STOMACH & BODY ────────────────────────────────────────────────────────
  {
    id: "stomach",
    label: "Stomach / Body",
    description: "Belly pain, lumps, or digestive problems",
    icon: "🫁",
    subComplaints: [
      {
        id: "SUB_RUQ",
        label: "Upper Right Belly Pain",
        systemValue: "GS_RUQ_PAIN",
        clinic: "General Surgery",
        questions: [
          { id: "q_fatty",     text: "Did the pain start after eating fatty or oily food?",          redFlag: false },
          { id: "q_fever_ruq", text: "Do you have a fever right now or recently?",                    redFlag: false },
          { id: "q_nausea",    text: "Are you feeling nauseous or have you vomited?",                 redFlag: false },
          { id: "q_jaundice",  text: "Is your skin or the whites of your eyes yellowish?",            redFlag: false },
          { id: "q_dark_urine",text: "Is your urine very dark — like tea or cola?",                   redFlag: false },
          { id: "q_pale_stool",text: "Are your stools pale, clay-colored, or whitish?",               redFlag: false },
          { id: "q_rigors",    text: "Are you having severe uncontrollable chills / shaking?",        redFlag: true  },
        ],
      },
      {
        id: "SUB_EPIGASTRIC",
        label: "Upper Middle Belly Pain",
        systemValue: "GS_EPIGASTRIC",
        clinic: "General Surgery",
        questions: [
          { id: "q_heartburn",   text: "Do you feel a burning sensation in your chest or belly?",     redFlag: false },
          { id: "q_food_relief", text: "Does eating food make the pain better or worse?",             redFlag: false },
          { id: "q_nsaids",      text: "Do you regularly take pain relievers (aspirin, ibuprofen)?",  redFlag: false },
          { id: "q_alcohol",     text: "Do you drink alcohol regularly or heavily?",                  redFlag: false },
          { id: "q_vomit_blood", text: "Have you vomited blood or coffee-ground material?",           redFlag: true  },
          { id: "q_black_stool", text: "Is your stool black and tarry?",                              redFlag: true  },
        ],
      },
      {
        id: "SUB_LRQ",
        label: "Lower Right / Left Belly Pain",
        systemValue: "GS_LRQ_LLQ",
        clinic: "General Surgery",
        questions: [
          { id: "q_sudden_rlq",  text: "Did the pain come on suddenly, within minutes?",             redFlag: false },
          { id: "q_anorexia",    text: "Have you lost your appetite since the pain started?",         redFlag: false },
          { id: "q_fever_rlq",   text: "Do you have a fever right now?",                             redFlag: false },
          { id: "q_rebound",     text: "Does it hurt more when you release pressure from your belly?",redFlag: true  },
          { id: "q_rlq_loc",     text: "Is the pain mostly on the lower RIGHT side of your belly?",  redFlag: false },
        ],
      },
      {
        id: "SUB_DIFFUSE",
        label: "Pain All Over the Belly",
        systemValue: "GS_DIFFUSE_ABD",
        clinic: "General Surgery",
        questions: [
          { id: "q_distension",  text: "Is your belly visibly swollen or bloated?",                  redFlag: false },
          { id: "q_no_bowel",    text: "Have you had no bowel movement for several days?",           redFlag: false },
          { id: "q_no_flatus",   text: "Are you unable to pass gas?",                                redFlag: false },
          { id: "q_prev_surg",   text: "Have you had any previous abdominal surgery?",               redFlag: false },
          { id: "q_boardlike",   text: "Does your belly feel very hard, like a board?",              redFlag: true  },
        ],
      },
      {
        id: "SUB_ABD_MASS",
        label: "Lump / Mass in the Belly",
        systemValue: "GS_ABD_MASS",
        clinic: "General Surgery",
        questions: [
          { id: "q_growing",     text: "Is the lump growing bigger over days or weeks?",             redFlag: true  },
          { id: "q_bowel_ch",    text: "Have your bowel habits changed recently?",                   redFlag: false },
          { id: "q_wt_loss_m",   text: "Have you lost weight without trying?",                       redFlag: false },
          { id: "q_fam_colon",   text: "Does anyone in your family have colon cancer?",              redFlag: false },
        ],
      },
      {
        id: "SUB_HERNIA",
        label: "Hernia / Groin Bulge",
        systemValue: "GS_HERNIA",
        clinic: "General Surgery",
        questions: [
          { id: "q_straining",   text: "Does the bulge appear or worsen when you strain or cough?",  redFlag: false },
          { id: "q_scrotal",     text: "Does the bulge extend into the scrotal area?",               redFlag: false },
          { id: "q_reducible",   text: "Can the bulge be pushed back in when you press on it?",      redFlag: false },
          { id: "q_irreducible", text: "Is the bulge stuck, hard, and very painful — cannot push back?", redFlag: true },
        ],
      },
    ],
  },

  // ── CHEST & BREATHING ────────────────────────────────────────────────────
  {
    id: "chest",
    label: "Chest & Breathing",
    description: "Cough, breathing problems, or heart concerns",
    icon: "🫀",
    subComplaints: [
      {
        id: "SUB_COUGH",
        label: "Cough / Breathing Problem",
        systemValue: "IM_COUGH_BREATHING",
        clinic: "Internal Medicine",
        questions: [
          { id: "q_cough_dur",   text: "Has the cough been going on for more than 2 weeks?",         redFlag: false },
          { id: "q_blood_sputum",text: "Do you cough up blood or blood-streaked phlegm?",             redFlag: true  },
          { id: "q_tb_exp",      text: "Have you been in close contact with a TB patient?",           redFlag: false },
          { id: "q_wt_loss_c",   text: "Have you lost weight without trying recently?",              redFlag: false },
          { id: "q_smoker",      text: "Do you currently smoke or have you smoked in the past?",     redFlag: false },
          { id: "q_night_sw",    text: "Do you wake up drenched in sweat at night?",                 redFlag: false },
        ],
      },
      {
        id: "SUB_CHEST_PAIN",
        label: "Chest Pain / Palpitations",
        systemValue: "IM_CHEST_PALP",
        clinic: "Internal Medicine",
        questions: [
          { id: "q_exertional",  text: "Does the chest pain happen during physical activity?",       redFlag: false },
          { id: "q_radiating",   text: "Does the pain spread to your arm, jaw, or shoulder?",        redFlag: true  },
          { id: "q_cold_sweat",  text: "Are you sweating coldly / clammy along with the pain?",      redFlag: true  },
          { id: "q_palpitation", text: "Do you feel your heart racing or fluttering?",               redFlag: false },
          { id: "q_cardiac_hx",  text: "Have you been diagnosed with a heart condition before?",     redFlag: false },
        ],
      },
      {
        id: "SUB_EDEMA",
        label: "Leg Swelling / Body Swelling",
        systemValue: "IM_EDEMA",
        clinic: "Internal Medicine",
        questions: [
          { id: "q_bilateral",   text: "Are BOTH legs or feet swollen equally?",                     redFlag: false },
          { id: "q_doe",         text: "Do you get short of breath with light activity or walking?", redFlag: false },
          { id: "q_orthopnea",   text: "Do you need extra pillows or to sit up to breathe comfortably?", redFlag: true },
          { id: "q_heart_hx",    text: "Do you have a history of heart, kidney, or liver disease?",  redFlag: false },
        ],
      },
      {
        id: "SUB_HPN",
        label: "High Blood Pressure",
        systemValue: "IM_HYPERTENSION",
        clinic: "Internal Medicine",
        questions: [
          { id: "q_home_bp",     text: "Have your home blood pressure readings been high?",          redFlag: false },
          { id: "q_meds_hpn",    text: "Are you currently taking blood pressure medicines?",         redFlag: false },
          { id: "q_headache_hpn",text: "Do you have a headache along with high blood pressure?",     redFlag: false },
          { id: "q_chest_hpn",   text: "Do you feel chest pain along with high blood pressure?",     redFlag: true  },
          { id: "q_vision_hpn",  text: "Are you having sudden vision changes?",                      redFlag: true  },
        ],
      },
      {
        id: "SUB_DM",
        label: "Diabetes / Blood Sugar",
        systemValue: "IM_DIABETES",
        clinic: "Internal Medicine",
        questions: [
          { id: "q_polyuria",    text: "Are you urinating very frequently and feeling very thirsty?",redFlag: false },
          { id: "q_polyphagia",  text: "Are you very hungry even after eating?",                     redFlag: false },
          { id: "q_high_bg",     text: "Are your blood sugar readings consistently very high?",      redFlag: false },
          { id: "q_fruity",      text: "Do you notice a fruity or sweet smell on your breath?",      redFlag: true  },
          { id: "q_foot_wound",  text: "Do you have a wound on your foot that is not healing?",      redFlag: false },
        ],
      },
      {
        id: "SUB_JAUNDICE",
        label: "Yellowing of Skin / Eyes",
        systemValue: "IM_JAUNDICE",
        clinic: "Internal Medicine",
        questions: [
          { id: "q_alc_jau",    text: "Do you drink alcohol regularly or heavily?",                  redFlag: false },
          { id: "q_meds_jau",   text: "Are you taking many medications?",                            redFlag: false },
          { id: "q_hep_exp",    text: "Have you been exposed to someone with hepatitis?",            redFlag: false },
          { id: "q_dark_urine_j",text: "Is your urine dark — like tea or cola?",                    redFlag: false },
          { id: "q_pale_st_j",  text: "Are your stools pale or clay-colored?",                      redFlag: false },
          { id: "q_confused",   text: "Are you feeling confused or disoriented?",                    redFlag: true  },
        ],
      },
    ],
  },

  // ── WOMEN'S HEALTH ───────────────────────────────────────────────────────
  {
    id: "womens",
    label: "Women's Health",
    description: "Pregnancy, menstrual, or gynecologic concerns",
    icon: "🤱",
    subComplaints: [
      {
        id: "SUB_PRENATAL",
        label: "Prenatal / Pregnancy Check-up",
        systemValue: "OB_PRENATAL",
        clinic: "OB-Gyne",
        questions: [
          { id: "q_first_ob",    text: "Is this your first prenatal visit / just found out you are pregnant?", redFlag: false },
          { id: "q_regular_ob",  text: "Is this a regular scheduled prenatal follow-up?",            redFlag: false },
          { id: "q_danger_signs",text: "Do you have severe headache, blurred vision, or swollen face?", redFlag: true },
          { id: "q_less_fm",     text: "Are you feeling fewer baby movements than usual?",           redFlag: true  },
        ],
      },
      {
        id: "SUB_VAG_BLEED_PREG",
        label: "Vaginal Bleeding (Pregnant)",
        systemValue: "OB_BLEED_PREGNANT",
        clinic: "OB-Gyne",
        questions: [
          { id: "q_aog",         text: "Are you currently pregnant?",                                redFlag: false },
          { id: "q_heavy_bp",    text: "Is the bleeding very heavy — soaking a pad within an hour?", redFlag: true  },
          { id: "q_pain_bp",     text: "Do you have severe abdominal pain with the bleeding?",       redFlag: true  },
          { id: "q_tissue",      text: "Have you passed any tissue or clots?",                       redFlag: true  },
        ],
      },
      {
        id: "SUB_VAG_BLEED_NONPREG",
        label: "Vaginal Bleeding (Not Pregnant)",
        systemValue: "OB_BLEED_NONPREG",
        clinic: "OB-Gyne",
        questions: [
          { id: "q_outside_period",text: "Is the bleeding outside your normal menstrual period?",    redFlag: false },
          { id: "q_post_coital",  text: "Does the bleeding happen after sexual intercourse?",        redFlag: false },
          { id: "q_heavy_np",     text: "Is the bleeding very heavy — soaking pads quickly?",        redFlag: true  },
          { id: "q_postmeno",     text: "Have you already gone through menopause (no period for > 1 year)?", redFlag: true },
        ],
      },
      {
        id: "SUB_PELVIC_PAIN",
        label: "Pelvic / Lower Belly Pain (Female)",
        systemValue: "OB_PELVIC_PAIN",
        clinic: "OB-Gyne",
        questions: [
          { id: "q_cycle_rel",   text: "Is the pain related to your menstrual cycle?",               redFlag: false },
          { id: "q_missed_per",  text: "Have you missed your period?",                               redFlag: false },
          { id: "q_iud",         text: "Do you have an IUD (intrauterine device)?",                  redFlag: false },
          { id: "q_acute_ectopic",text: "Is there severe sudden pain + positive pregnancy test + dizziness?", redFlag: true },
        ],
      },
      {
        id: "SUB_DISCHARGE",
        label: "Vaginal Discharge",
        systemValue: "OB_DISCHARGE",
        clinic: "OB-Gyne",
        questions: [
          { id: "q_color_disc",  text: "Is the discharge yellow, green, or foul-smelling?",         redFlag: false },
          { id: "q_itching",     text: "Do you have itching or burning along with the discharge?",   redFlag: false },
          { id: "q_fever_disc",  text: "Do you have a fever with pelvic or lower belly pain?",       redFlag: true  },
        ],
      },
      {
        id: "SUB_FAMILY_PLAN",
        label: "Family Planning / Contraception",
        systemValue: "OB_FAMILY_PLAN",
        clinic: "OB-Gyne",
        questions: [
          { id: "q_current_contra", text: "Are you currently using a contraceptive method?",         redFlag: false },
          { id: "q_new_method",  text: "Are you looking for a new or first contraceptive method?",   redFlag: false },
          { id: "q_last_pap",    text: "Is it time for your Pap smear or gynecologic check-up?",     redFlag: false },
        ],
      },
    ],
  },

  // ── CHILDREN'S HEALTH ────────────────────────────────────────────────────
  {
    id: "pedia",
    label: "Child's Health",
    description: "Concerns for patients under 19 years old",
    icon: "👶",
    subComplaints: [
      {
        id: "SUB_FEVER_CHILD",
        label: "Fever",
        systemValue: "PED_FEVER",
        clinic: "Pediatrics",
        questions: [
          { id: "q_convulsion",  text: "Did the child have a seizure / convulsion with the fever?",  redFlag: true  },
          { id: "q_rash_child",  text: "Does the child have a rash along with the fever?",           redFlag: false },
          { id: "q_dengue_exp",  text: "Has the child been near a dengue area or mosquito exposure?",redFlag: false },
          { id: "q_altered_ms",  text: "Is the child confused, unresponsive, or very hard to wake?", redFlag: true  },
          { id: "q_petechiae",   text: "Are there small red or purple spots on the skin?",           redFlag: true  },
        ],
      },
      {
        id: "SUB_COUGH_CHILD",
        label: "Cough / Breathing (Child)",
        systemValue: "PED_COUGH",
        clinic: "Pediatrics",
        questions: [
          { id: "q_barking",     text: "Does the cough sound barking or seal-like?",                 redFlag: false },
          { id: "q_stridor_c",   text: "Do you hear a high-pitched sound when the child breathes in?",redFlag: true },
          { id: "q_retraction",  text: "Is the child's chest sinking in with every breath?",         redFlag: true  },
          { id: "q_spo2_child",  text: "Is the child's oxygen reading below 90%?",                   redFlag: true  },
          { id: "q_feeding",     text: "Is the child refusing to eat or drink because of breathing?",redFlag: false },
        ],
      },
      {
        id: "SUB_DIARRHEA_CHILD",
        label: "Diarrhea / Vomiting (Child)",
        systemValue: "PED_DIARRHEA",
        clinic: "Pediatrics",
        questions: [
          { id: "q_blood_stool_c",text: "Is there blood in the child's stool?",                     redFlag: true  },
          { id: "q_no_urine",    text: "Has the child not urinated for several hours?",              redFlag: true  },
          { id: "q_sunken_eyes", text: "Does the child have sunken eyes or very dry lips?",          redFlag: true  },
          { id: "q_lethargy",    text: "Is the child very weak, limp, or unusually sleepy?",         redFlag: true  },
        ],
      },
      {
        id: "SUB_ABD_CHILD",
        label: "Belly Pain (Child)",
        systemValue: "PED_ABD_PAIN",
        clinic: "Pediatrics",
        questions: [
          { id: "q_loc_abd_c",   text: "Is the pain mainly on the lower RIGHT side of the belly?",  redFlag: false },
          { id: "q_fever_abd_c", text: "Does the child have a fever with the belly pain?",           redFlag: false },
          { id: "q_board_c",     text: "Does the belly feel very hard or rigid?",                    redFlag: true  },
          { id: "q_rebound_c",   text: "Does it hurt more when you quickly remove pressure from the belly?", redFlag: true },
        ],
      },
      {
        id: "SUB_VACC",
        label: "Vaccination / Well-Child Visit",
        systemValue: "PED_WELLNESS",
        clinic: "Pediatrics",
        questions: [
          { id: "q_routine_vacc",text: "Is this a routine vaccination visit?",                       redFlag: false },
          { id: "q_dev_concern", text: "Do you have concerns about the child's growth or development?",redFlag: false },
          { id: "q_well_baby",   text: "Is this a well-baby or annual physical check-up?",           redFlag: false },
        ],
      },
      {
        id: "SUB_RASH_CHILD",
        label: "Skin Rash (Child)",
        systemValue: "PED_RASH",
        clinic: "Pediatrics",
        questions: [
          { id: "q_fever_rash",  text: "Does the child have a fever with the rash?",                 redFlag: false },
          { id: "q_petechiae_r", text: "Are the spots red or purple and do NOT turn white when pressed?",redFlag: true },
          { id: "q_measles_exp", text: "Has the child been near someone with measles or chickenpox?",redFlag: false },
          { id: "q_med_rash",    text: "Did the rash start after taking a new medicine?",            redFlag: false },
        ],
      },
    ],
  },

  // ── GENERAL / OTHERS ─────────────────────────────────────────────────────
  {
    id: "general",
    label: "General / Others",
    description: "Follow-ups, wellness, mental health, or other concerns",
    icon: "🏥",
    subComplaints: [
      {
        id: "SUB_CHECKUP",
        label: "General Check-up / Wellness",
        systemValue: "FAMED_CHECKUP",
        clinic: "Family Medicine",
        questions: [
          { id: "q_annual",      text: "Is this a routine annual physical exam?",                    redFlag: false },
          { id: "q_pre_employ",  text: "Is this a pre-employment or school physical?",               redFlag: false },
          { id: "q_no_complaint",text: "Do you have no specific symptom — just a wellness check?",   redFlag: false },
        ],
      },
      {
        id: "SUB_MILD_ILLNESS",
        label: "Mild Cough / Colds / UTI",
        systemValue: "FAMED_MILD_ILLNESS",
        clinic: "Family Medicine",
        questions: [
          { id: "q_mild_cough",  text: "Has the cough or colds been going on for less than 2 weeks?",redFlag: false },
          { id: "q_burning_uri", text: "Do you have burning or pain when urinating?",                redFlag: false },
          { id: "q_freq_uri",    text: "Are you urinating more frequently than usual?",              redFlag: false },
          { id: "q_no_dyspnea",  text: "Are you breathing comfortably — no shortness of breath?",   redFlag: false },
        ],
      },
      {
        id: "SUB_CHRONIC_FOLLOW",
        label: "Chronic Disease Follow-up (Stable)",
        systemValue: "FAMED_CHRONIC",
        clinic: "Family Medicine",
        questions: [
          { id: "q_stable",      text: "Is your condition currently stable and well-controlled?",    redFlag: false },
          { id: "q_meds_refill", text: "Do you need a medication refill or prescription renewal?",   redFlag: false },
          { id: "q_dm_hpn",      text: "Is this a follow-up for diabetes or hypertension?",          redFlag: false },
          { id: "q_decompensate",text: "Have you had any sudden worsening of your condition recently?",redFlag: true },
        ],
      },
      {
        id: "SUB_MENTAL_HEALTH",
        label: "Mental Health / Anxiety",
        systemValue: "FAMED_MENTAL",
        clinic: "Family Medicine",
        questions: [
          { id: "q_low_mood",    text: "Have you been feeling persistently sad or hopeless?",        redFlag: false },
          { id: "q_anxiety",     text: "Are you experiencing excessive worry or panic attacks?",     redFlag: false },
          { id: "q_sleep",       text: "Are you having significant problems sleeping?",              redFlag: false },
          { id: "q_suicidal",    text: "Are you having thoughts of harming yourself?",               redFlag: true  },
        ],
      },
      {
        id: "SUB_HEADACHE",
        label: "Headache",
        systemValue: "FAMED_HEADACHE",
        clinic: "Family Medicine",
        questions: [
          { id: "q_worst_ever",  text: "Is this the worst headache of your life — sudden and severe?",redFlag: true },
          { id: "q_nausea_ha",   text: "Do you have nausea or vomiting with the headache?",          redFlag: false },
          { id: "q_neck_stiff",  text: "Is your neck stiff — hard to bend your chin to your chest?", redFlag: true  },
          { id: "q_vision_ha",   text: "Are you having vision changes with the headache?",           redFlag: false },
          { id: "q_recurring",   text: "Do these headaches keep coming back repeatedly?",            redFlag: false },
        ],
      },
      {
        id: "SUB_MUSCULO",
        label: "Bone / Joint / Back Pain",
        systemValue: "FAMED_MSK",
        clinic: "Family Medicine",
        questions: [
          { id: "q_joint_swell", text: "Is any joint swollen, red, or warm?",                       redFlag: false },
          { id: "q_morning_st",  text: "Is the joint stiffness worst in the morning and lasts over an hour?",redFlag: false },
          { id: "q_trauma_msk",  text: "Was there a recent fall, accident, or sports injury?",       redFlag: false },
          { id: "q_limited_rom", text: "Are you unable to move the affected joint or area?",         redFlag: false },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NAV BAR
// ─────────────────────────────────────────────────────────────────────────────

function NavBar() {
  return (
    <nav className="w-full px-8 py-4 bg-yellow-50 text-cyan-950 flex items-center justify-between shadow-sm">
      <div>
        <h1 className="text-2xl font-bold leading-tight">BICA</h1>
        <p className="text-xs text-cyan-800">Better Informed Care Access</p>
      </div>
      <ul className="hidden md:flex space-x-6 text-base font-semibold">
        <li><a href="#" className="hover:underline">Triage Form |</a></li>
        <li><a href="#" className="hover:underline">Vital Signs |</a></li>
        <li><a href="#" className="hover:underline text-orange-600 underline">Chief Complaints |</a></li>
        <li><a href="#" className="hover:underline">Summary |</a></li>
      </ul>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP BREADCRUMB
// ─────────────────────────────────────────────────────────────────────────────

type Step = "category" | "subcomplaint" | "questions";

function Breadcrumb({
  step,
  category,
  sub,
}: {
  step: Step;
  category: Category | null;
  sub: SubComplaint | null;
}) {
  const crumbs = [
    { label: "Body Area", active: step === "category", done: step !== "category" },
    { label: category?.label ?? "Your Concern", active: step === "subcomplaint", done: step === "questions" },
    { label: sub?.label ?? "Screening Questions", active: step === "questions", done: false },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full border
            ${c.done    ? "border-emerald-500 text-emerald-400 bg-emerald-950"
            : c.active  ? "border-orange-300 text-orange-200 bg-cyan-950"
            :             "border-cyan-800 text-cyan-600 bg-transparent"}`}>
            {c.done && "✓ "}{c.label}
          </span>
          {i < crumbs.length - 1 && (
            <span className="text-cyan-700 text-sm">›</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY PANEL
// ─────────────────────────────────────────────────────────────────────────────

function SummaryPanel({
  category,
  sub,
  answers,
}: {
  category: Category | null;
  sub: SubComplaint | null;
  answers: Answers;
}) {
  const yesCount = Object.values(answers).filter(Boolean).length;

  return (
    <div className="w-56 flex-shrink-0 flex flex-col gap-3">
      <p className="text-xs font-bold text-white uppercase tracking-wider">Your Selections</p>

      <div className="bg-cyan-950 border border-cyan-800 rounded-xl p-4 flex flex-col gap-3 min-h-[10rem]">
        {category ? (
          <div>
            <p className="text-xs text-cyan-500 uppercase font-semibold">Body Area</p>
            <p className="text-sm font-bold text-orange-200 mt-0.5">{category.icon} {category.label}</p>
          </div>
        ) : (
          <p className="text-xs text-cyan-600 italic">No selection yet.</p>
        )}

        {sub && (
          <div className="border-t border-cyan-800 pt-2">
            <p className="text-xs text-cyan-500 uppercase font-semibold">Concern</p>
            <p className="text-sm font-bold text-orange-200 mt-0.5">{sub.label}</p>
          </div>
        )}

        {sub && (
          <div className="border-t border-cyan-800 pt-2">
            <p className="text-xs text-cyan-500 uppercase font-semibold">Target Clinic</p>
            <p className="text-sm font-bold text-emerald-300 mt-0.5">{sub.clinic}</p>
          </div>
        )}

        {yesCount > 0 && (
          <div className="border-t border-cyan-800 pt-2">
            <p className="text-xs text-cyan-500 uppercase font-semibold">YES answers</p>
            <p className="text-sm font-bold text-orange-200 mt-0.5">{yesCount} of {sub?.questions.length}</p>
          </div>
        )}
      </div>

      {/* System value — hidden from patient, visible here for dev reference */}
      {sub && (
        <div className="bg-cyan-950 border border-dashed border-cyan-800 rounded-lg px-3 py-2">
          <p className="text-xs text-cyan-600 font-mono">SYS: {sub.systemValue}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RED FLAG OVERLAY
// ─────────────────────────────────────────────────────────────────────────────

function RedFlagOverlay({ onReset }: { onReset: () => void }) {
  return (
    <div className="fixed inset-0 bg-red-950 bg-opacity-95 flex items-center justify-center z-50">
      <div className="max-w-lg w-full mx-4 bg-red-900 border-4 border-red-400 rounded-2xl p-10 text-center animate-pulse">
        <p className="text-6xl mb-4">🚨</p>
        <h2 className="text-3xl font-black text-white mb-3">PROCEED TO EMERGENCY</h2>
        <p className="text-red-200 text-lg mb-6">
          One of your answers indicates you may need immediate medical attention.
          Please inform clinic staff or proceed to the Emergency Room now.
        </p>
        <div className="bg-red-950 rounded-xl px-6 py-4 mb-6">
          <p className="text-yellow-300 font-bold text-lg">→ Go to the ER desk immediately</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-red-400 hover:underline cursor-pointer"
        >
          Cancel / Reset kiosk
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 3 — CATEGORY SELECTION
// ─────────────────────────────────────────────────────────────────────────────

function Screen3({ onSelect }: { onSelect: (c: Category) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-3xl font-bold text-white">Where is the problem?</h2>
        <p className="text-cyan-300 text-base mt-1">
          Tap the area of your body where you feel the main concern.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat)}
            className="bg-cyan-950 border-2 border-cyan-800 rounded-xl px-6 py-8
              hover:border-orange-300 hover:bg-[#0e4f68] transition-all cursor-pointer text-left group"
          >
            <p className="text-4xl mb-2">{cat.icon}</p>
            <p className="text-lg font-bold text-white group-hover:text-orange-100">{cat.label}</p>
            <p className="text-sm text-cyan-400 mt-1 group-hover:text-cyan-300">{cat.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 4 — SUB-COMPLAINT SELECTION
// ─────────────────────────────────────────────────────────────────────────────

function Screen4({
  category,
  onSelect,
}: {
  category: Category;
  onSelect: (sc: SubComplaint) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-orange-300 text-xs font-bold uppercase tracking-widest mb-1">
          {category.icon} {category.label}
        </p>
        <h2 className="text-3xl font-bold text-white">What is your main concern?</h2>
        <p className="text-cyan-300 text-base mt-1">
          Choose the one that best describes what is bothering you most.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {category.subComplaints.map((sc) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => onSelect(sc)}
            className="bg-cyan-950 border-2 border-cyan-800 rounded-xl px-5 py-6
              hover:border-orange-300 hover:bg-[#0e4f68] transition-all cursor-pointer text-left group"
          >
            <p className="text-base font-bold text-white group-hover:text-orange-100 leading-snug">
              {sc.label}
            </p>
            <p className="text-xs text-emerald-400 mt-2 font-semibold">→ {sc.clinic}</p>
          </button>
        ))}
      </div>

      <div className="pt-2 border-t border-dashed border-cyan-700">
        <button
          type="button"
          onClick={() => console.log("Concern not listed — flag for nurse")}
          className="text-sm text-orange-200 hover:text-white hover:underline cursor-pointer"
        >
          My concern is not listed here... →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 5 — YES / NO SCREENING QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

function Screen5({
  sub,
  answers,
  onAnswer,
}: {
  sub: SubComplaint;
  answers: Answers;
  onAnswer: (id: string, value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-orange-300 text-xs font-bold uppercase tracking-widest mb-1">
          {sub.label}
        </p>
        <h2 className="text-3xl font-bold text-white">Answer these questions</h2>
        <p className="text-cyan-300 text-base mt-1">
          Tap <span className="font-bold text-emerald-400">YES</span> or{" "}
          <span className="font-bold text-cyan-400">NO</span> for each item. Be as honest as you can.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {sub.questions.map((q, idx) => {
          const answered = answers[q.id] !== undefined;
          const isYes = answers[q.id] === true;
          const isNo = answers[q.id] === false;

          return (
            <div
              key={q.id}
              className={`rounded-xl border-2 px-5 py-4 flex items-center justify-between gap-4 transition-all
                ${q.redFlag
                  ? "border-red-900 bg-red-950"
                  : "border-cyan-800 bg-cyan-950"}`}
            >
              {/* Question text */}
              <div className="flex items-start gap-3 flex-1">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  ${answered ? "bg-emerald-700 text-white" : "bg-cyan-800 text-cyan-400"}`}>
                  {idx + 1}
                </span>
                <div>
                  <p className={`text-sm font-semibold leading-snug ${q.redFlag ? "text-red-200" : "text-white"}`}>
                    {q.text}
                  </p>
                  {q.redFlag && (
                    <p className="text-xs text-red-400 font-bold mt-0.5">⚠ Urgent if YES</p>
                  )}
                </div>
              </div>

              {/* YES / NO buttons */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onAnswer(q.id, true)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-black border-2 cursor-pointer transition-all
                    ${isYes
                      ? "bg-emerald-500 border-emerald-400 text-white"
                      : "bg-transparent border-emerald-800 text-emerald-500 hover:border-emerald-500"}`}
                >
                  YES
                </button>
                <button
                  type="button"
                  onClick={() => onAnswer(q.id, false)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-black border-2 cursor-pointer transition-all
                    ${isNo
                      ? "bg-cyan-700 border-cyan-400 text-white"
                      : "bg-transparent border-cyan-800 text-cyan-500 hover:border-cyan-500"}`}
                >
                  NO
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="pt-1">
        <div className="flex justify-between text-xs text-cyan-500 mb-1">
          <span>{Object.keys(answers).length} of {sub.questions.length} answered</span>
          <span>{sub.questions.length - Object.keys(answers).length} remaining</span>
        </div>
        <div className="w-full h-1.5 bg-cyan-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-400 rounded-full transition-all duration-300"
            style={{ width: `${(Object.keys(answers).length / sub.questions.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function primaryClinics () {
  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubComplaint | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [showRedFlag, setShowRedFlag] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat);
    setSelectedSub(null);
    setAnswers({});
    setStep("subcomplaint");
  };

  const handleSubSelect = (sc: SubComplaint) => {
    setSelectedSub(sc);
    setAnswers({});
    setStep("questions");
  };

  const handleAnswer = (id: string, value: boolean) => {
    // Check if this is a red flag question answered YES
    const question = selectedSub?.questions.find((q) => q.id === id);
    if (question?.redFlag && value === true) {
      setShowRedFlag(true);
      return;
    }
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleBack = () => {
    if (step === "questions") {
      setStep("subcomplaint");
      setAnswers({});
    } else if (step === "subcomplaint") {
      setStep("category");
      setSelectedCategory(null);
    }
  };

  const handleReset = () => {
    setShowRedFlag(false);
    setStep("category");
    setSelectedCategory(null);
    setSelectedSub(null);
    setAnswers({});
  };

  const handleProceed = () => {
    // Build the payload the ML model will receive
    const payload = {
      category_id:    selectedCategory?.id,
      sub_id:         selectedSub?.id,
      system_value:   selectedSub?.systemValue,
      target_clinic:  selectedSub?.clinic,
      answers,
    };
    console.log("BICA Payload → ML Model:", JSON.stringify(payload, null, 2));
  };

  const allAnswered =
    selectedSub !== null &&
    Object.keys(answers).length === selectedSub.questions.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="">
      {showRedFlag && <RedFlagOverlay onReset={handleReset} />}

      <NavBar />

      <div className="min-h-screen bg-cyan-950 py-8 px-4 flex flex-col items-center gap-6">

        {/* Header */}
        <div className="text-center">
          <p className="text-orange-300 text-sm font-bold uppercase tracking-widest mb-1">
            Chief Complaints
          </p>
          <h1 className="text-4xl font-bold text-white">Tell us about your concern</h1>
          <p className="text-base font-serif text-cyan-300 mt-1">
            Tap the buttons — no typing needed.
          </p>
        </div>

        {/* Breadcrumb */}
        <Breadcrumb step={step} category={selectedCategory} sub={selectedSub} />

        {/* Card */}
        <div className="flex flex-row gap-6 bg-cyan-900 px-8 py-8 rounded-2xl w-[72rem] max-w-full">

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {step === "category" && (
              <Screen3 onSelect={handleCategorySelect} />
            )}
            {step === "subcomplaint" && selectedCategory && (
              <Screen4 category={selectedCategory} onSelect={handleSubSelect} />
            )}
            {step === "questions" && selectedSub && (
              <Screen5 sub={selectedSub} answers={answers} onAnswer={handleAnswer} />
            )}
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4 justify-between">
            <SummaryPanel category={selectedCategory} sub={selectedSub} answers={answers} />

            <div className="flex flex-col gap-2 mt-4">
              {/* Proceed — only on questions step when all answered */}
              {step === "questions" && (
                <button
                  type="button"
                  disabled={!allAnswered}
                  onClick={handleProceed}
                  className={`text-base font-bold px-5 py-3 rounded-xl transition-all
                    ${allAnswered
                      ? "bg-orange-50 text-cyan-950 hover:bg-orange-100 cursor-pointer"
                      : "bg-cyan-800 text-cyan-500 cursor-not-allowed"}`}
                >
                  Proceed →
                </button>
              )}

              {/* Back */}
              {step !== "category" && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-sm font-semibold bg-transparent text-orange-100
                    border border-orange-200 px-5 py-2.5 rounded-xl hover:bg-cyan-800 cursor-pointer"
                >
                  ← Back
                </button>
              )}

              {/* Reset */}
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-cyan-600 hover:text-cyan-400 hover:underline cursor-pointer text-center mt-1"
              >
                Reset kiosk
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}