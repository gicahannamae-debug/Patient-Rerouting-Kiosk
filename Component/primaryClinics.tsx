'use client';
import React, { useState } from "react";

type QuestionSection = "symptoms" | "history";

type Question = {
  id: string;
  section: QuestionSection;
  text: string;
  redFlag: boolean;
};

type ClinicOption =
  | "General Surgery"
  | "Internal Medicine"
  | "OB-GYNE"
  | "OB-Gyne"
  | "Pediatrics"
  | "Family Medicine";

type SubComplaint = {
  id: string;
  label: string;
  sublabel?: string;
  systemValue: string;
  clinic: ClinicOption;
  questions: Question[];
};

type ChiefComplaint = {
  id: string;
  label: string;
  icon: string;
  subComplaints: SubComplaint[];
};

type Group = {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  clinic: ClinicOption;
  chiefComplaints: ChiefComplaint[];
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA — All 5 groups fully populated from routing table
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_GROUPS: Group[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP 1 — GENERAL SURGERY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "GRP_SURG",
    label: "Stomach, Breast, Neck, Groin & Urinary",
    shortLabel: "Surgical Concerns",
    icon: "🔬",
    description: "Belly pain, lumps, groin bulge, or urinary problems",
    clinic: "General Surgery",
    chiefComplaints: [
      {
        id: "CC_STOMACH",
        label: "Stomach, Belly, or Tummy Pain",
        icon: "🫁",
        subComplaints: [
          {
            id: "SUB_RUQ",
            label: "Pain in the upper right belly",
            sublabel: "Near the liver or gallbladder area",
            systemValue: "GS_RUQ_PAIN",
            clinic: "General Surgery",
            questions: [
              { id: "q_ruq_fatty",    section: "symptoms", text: "Did your symptoms start after eating a fatty or oily meal?",                                          redFlag: false },
              { id: "q_ruq_fever",    section: "symptoms", text: "Do you have fever, nausea, or vomiting right now?",                                                   redFlag: false },
              { id: "q_ruq_jaundice", section: "symptoms", text: "Is your skin or the whites of your eyes turning yellow (jaundice)?",                                  redFlag: false },
              { id: "q_ruq_dark_urine",section: "history", text: "Is your urine very dark — like tea or cola?",                                                         redFlag: false },
              { id: "q_ruq_pale_stool",section: "history", text: "Are your stools very pale or almost white?",                                                          redFlag: false },
              { id: "q_ruq_rigors",   section: "history",  text: "Are you having severe uncontrollable shaking chills (rigors)?",                                       redFlag: true  },
              { id: "q_ruq_low_bp",   section: "history",  text: "Are you feeling extremely faint, dizzy, or has anyone told you your blood pressure is dangerously low?", redFlag: true },
            ],
          },
          {
            id: "SUB_EPIGASTRIC",
            label: "Pain in the upper middle stomach",
            sublabel: "Between the chest and the belly button",
            systemValue: "GS_EPIGASTRIC",
            clinic: "General Surgery",
            questions: [
              { id: "q_epi_food",        section: "symptoms", text: "Does eating food make your stomach pain better or worse?",                               redFlag: false },
              { id: "q_epi_alcohol",     section: "symptoms", text: "Do you drink alcohol regularly or take pain relievers like Ibuprofen or Aspirin often?", redFlag: false },
              { id: "q_epi_vomit_blood", section: "symptoms", text: "Have you vomited blood or material that looks like coffee grounds?",                     redFlag: true  },
              { id: "q_epi_black_stool", section: "history",  text: "Have you noticed black, tarry stools?",                                                 redFlag: true  },
              { id: "q_epi_boardlike",   section: "history",  text: "Does your stomach feel as hard as a wooden board when pressed?",                        redFlag: true  },
            ],
          },
          {
            id: "SUB_LRQ_LLQ",
            label: "Pain in the lower sides or lower belly",
            sublabel: "Lower right or lower left area",
            systemValue: "GS_LRQ_LLQ",
            clinic: "General Surgery",
            questions: [
              { id: "q_lrq_sudden",    section: "symptoms", text: "Did the pain start suddenly in the lower right belly?",                    redFlag: false },
              { id: "q_lrq_appetite",  section: "symptoms", text: "Have you lost your appetite, or do you feel nauseous or feverish?",        redFlag: false },
              { id: "q_lrq_duration",  section: "symptoms", text: "Has this pain been going on for more than 3 days?",                       redFlag: false },
              { id: "q_lrq_boardlike", section: "history",  text: "Does your stomach feel as hard as a wooden board when pressed?",          redFlag: true  },
              { id: "q_lrq_high_fever",section: "history",  text: "Do you have a very high fever right now?",                                redFlag: true  },
              { id: "q_lrq_rapid_hr",  section: "history",  text: "Is your heart beating very fast or racing?",                              redFlag: true  },
            ],
          },
          {
            id: "SUB_DIFFUSE",
            label: "Pain all over the belly",
            sublabel: "Generalized abdominal pain",
            systemValue: "GS_DIFFUSE_ABD",
            clinic: "General Surgery",
            questions: [
              { id: "q_diff_bloat",     section: "symptoms", text: "Is your stomach visibly swollen or bloated?",                                   redFlag: false },
              { id: "q_diff_no_gas",    section: "symptoms", text: "Are you unable to pass gas or have a bowel movement?",                          redFlag: false },
              { id: "q_diff_prev_surg", section: "history",  text: "Have you had any stomach or abdominal surgery in the past?",                    redFlag: false },
              { id: "q_diff_silent",    section: "history",  text: "Has your stomach become completely silent — no gurgling sounds or gas at all?", redFlag: true  },
              { id: "q_diff_fever_dist",section: "history",  text: "Do you have a severe fever together with the bloating and pain?",               redFlag: true  },
            ],
          },
          {
            id: "SUB_ABD_MASS",
            label: "A lump or mass in the belly",
            sublabel: "A growth you can feel in the abdomen",
            systemValue: "GS_ABD_MASS",
            clinic: "General Surgery",
            questions: [
              { id: "q_mass_growing",  section: "symptoms", text: "Have you noticed a lump in your belly that seems to be slowly growing?",                redFlag: false },
              { id: "q_mass_bowel",    section: "symptoms", text: "Have your bowel habits changed recently?",                                             redFlag: false },
              { id: "q_mass_fam_hx",   section: "history",  text: "Does anyone in your family have a history of colon cancer?",                           redFlag: false },
              { id: "q_mass_fast_grow",section: "history",  text: "Is the lump growing very fast — noticeably larger over just days or weeks?",           redFlag: true  },
              { id: "q_mass_wt_loss",  section: "history",  text: "Have you lost weight without trying — unexplained weight loss?",                       redFlag: true  },
              { id: "q_mass_bleeding", section: "history",  text: "Is the lump bleeding or is there any unusual bleeding from your body?",                redFlag: true  },
            ],
          },
        ],
      },
      {
        id: "CC_BREAST",
        label: "Breast Complaint",
        icon: "🎗️",
        subComplaints: [
          {
            id: "SUB_BREAST_LUMP",
            label: "A lump in the breast",
            sublabel: "A new or growing lump you can feel",
            systemValue: "GS_BREAST_LUMP",
            clinic: "General Surgery",
            questions: [
              { id: "q_bl_duration",    section: "symptoms", text: "Have you noticed this lump for more than 1 week?",                                     redFlag: false },
              { id: "q_bl_period",      section: "symptoms", text: "Does it feel tender or change with your monthly menstrual cycle?",                     redFlag: false },
              { id: "q_bl_fam_hx",      section: "history",  text: "Is there a family history of breast cancer?",                                         redFlag: false },
              { id: "q_bl_fast_grow",   section: "history",  text: "Has the lump grown very quickly — noticeably larger in just days or weeks?",          redFlag: true  },
              { id: "q_bl_skin_dimple", section: "history",  text: "Is the skin over the lump dimpled or puckered — like an orange peel?",                redFlag: true  },
              { id: "q_bl_nipple_pull", section: "history",  text: "Is the nipple being pulled inward (inverted nipple)?",                                redFlag: true  },
              { id: "q_bl_bloody_disc", section: "history",  text: "Is there bloody discharge coming from the nipple?",                                   redFlag: true  },
            ],
          },
          {
            id: "SUB_BREAST_PAIN",
            label: "Breast pain",
            sublabel: "Pain or tenderness in one or both breasts",
            systemValue: "GS_BREAST_PAIN",
            clinic: "General Surgery",
            questions: [
              { id: "q_bp_cycle",      section: "symptoms", text: "Does the pain come and go with your monthly menstrual cycle?",                                              redFlag: false },
              { id: "q_bp_one_both",   section: "symptoms", text: "Is the pain in one breast only, or in both breasts?",                                                      redFlag: false },
              { id: "q_bp_hard_lump",  section: "history",  text: "Is there a single, hard lump in the breast that does NOT hurt when pressed, in a woman over 40?",         redFlag: true  },
            ],
          },
          {
            id: "SUB_NIPPLE_DISC",
            label: "Discharge from the nipple",
            sublabel: "Fluid leaking from the nipple",
            systemValue: "GS_NIPPLE_DISC",
            clinic: "General Surgery",
            questions: [
              { id: "q_nd_color",       section: "symptoms", text: "Is the fluid bloody, milky, or clear in color?",                    redFlag: false },
              { id: "q_nd_spontaneous", section: "symptoms", text: "Does the fluid come out on its own without squeezing?",             redFlag: false },
              { id: "q_nd_one_nipple",  section: "history",  text: "Is bloody fluid leaking spontaneously from only ONE nipple?",       redFlag: true  },
            ],
          },
          {
            id: "SUB_BREAST_INFECT",
            label: "Swelling, redness, or breast infection",
            sublabel: "Signs of inflammation or mastitis",
            systemValue: "GS_BREAST_INFECT",
            clinic: "General Surgery",
            questions: [
              { id: "q_bi_postpartum", section: "symptoms", text: "Have you given birth in the last 6 weeks (postpartum)?",                                             redFlag: false },
              { id: "q_bi_warm_red",   section: "symptoms", text: "Is the breast warm, red, and very painful to touch?",                                               redFlag: false },
              { id: "q_bi_fever",      section: "symptoms", text: "Do you have a fever right now?",                                                                    redFlag: false },
              { id: "q_bi_high_fever", section: "history",  text: "Is the fever very high, and are you feeling dizzy or faint?",                                       redFlag: true  },
              { id: "q_bi_low_bp",     section: "history",  text: "Has anyone noted your blood pressure is dangerously low or that you appear unstable?",              redFlag: true  },
            ],
          },
        ],
      },
      {
        id: "CC_NECK",
        label: "Neck or Throat Issues",
        icon: "🦒",
        subComplaints: [
          {
            id: "SUB_GOITER",
            label: "Swelling in the neck (goiter)",
            sublabel: "Enlarged thyroid area",
            systemValue: "GS_GOITER",
            clinic: "General Surgery",
            questions: [
              { id: "q_goi_fam_hx",   section: "symptoms", text: "Is there a family history of thyroid problems?",                                   redFlag: false },
              { id: "q_goi_symptoms", section: "symptoms", text: "Do you feel nervous, shaky, or unusually tired?",                                  redFlag: false },
              { id: "q_goi_swallow",  section: "symptoms", text: "Do you have trouble swallowing?",                                                  redFlag: false },
              { id: "q_goi_fast",     section: "history",  text: "Is the neck lump growing very fast?",                                             redFlag: true  },
              { id: "q_goi_fixed",    section: "history",  text: "Does the lump feel completely stuck or fixed — it cannot be moved?",              redFlag: true  },
              { id: "q_goi_stridor",  section: "history",  text: "Do you hear a harsh whistling sound when you breathe in?",                       redFlag: true  },
            ],
          },
          {
            id: "SUB_THYROID_NODULE",
            label: "A single lump in the thyroid gland",
            sublabel: "Solitary thyroid nodule",
            systemValue: "GS_THYROID_NODULE",
            clinic: "General Surgery",
            questions: [
              { id: "q_tn_pressure",   section: "symptoms", text: "Is the lump causing any pressure or discomfort in your neck?",                    redFlag: false },
              { id: "q_tn_duration",   section: "symptoms", text: "How long have you noticed this lump in your neck or thyroid area?",               redFlag: false },
              { id: "q_tn_hard_fixed", section: "history",  text: "Does the lump feel very hard and completely fixed — stuck in place?",            redFlag: true  },
              { id: "q_tn_lymph",      section: "history",  text: "Are there swollen, hard lumps (lymph nodes) on the side of your neck as well?", redFlag: true  },
            ],
          },
          {
            id: "SUB_NECK_LUMP",
            label: "A lump in the neck (not thyroid)",
            sublabel: "Other neck masses or swollen lymph nodes",
            systemValue: "GS_NECK_LUMP",
            clinic: "General Surgery",
            questions: [
              { id: "q_nl_duration",  section: "symptoms", text: "Have you noticed this lump for more than 1 week?",                               redFlag: false },
              { id: "q_nl_pain",      section: "symptoms", text: "Is the lump painful, or do you have fever or signs of infection?",               redFlag: false },
              { id: "q_nl_smoking",   section: "history",  text: "Do you smoke or drink alcohol regularly?",                                      redFlag: false },
              { id: "q_nl_fast",      section: "history",  text: "Is the lump growing very fast?",                                               redFlag: true  },
              { id: "q_nl_b_symp",    section: "history",  text: "Do you have constant tiredness, fever, or unexplained weight loss?",            redFlag: true  },
              { id: "q_nl_age",       section: "history",  text: "Are you over 40 years old with a history of smoking?",                         redFlag: true  },
            ],
          },
          {
            id: "SUB_JAW_LUMP",
            label: "A lump near the jaw or salivary glands",
            sublabel: "Jaw, parotid, or salivary gland swelling",
            systemValue: "GS_JAW_LUMP",
            clinic: "General Surgery",
            questions: [
              { id: "q_jaw_eating",     section: "symptoms", text: "Does the lump hurt especially when you are eating?",                        redFlag: false },
              { id: "q_jaw_fever",      section: "symptoms", text: "Do you have a fever or jaw stiffness?",                                    redFlag: false },
              { id: "q_jaw_ear_pain",   section: "history",  text: "Do you have ear pain along with a foul-smelling discharge from the ear?", redFlag: true  },
              { id: "q_jaw_face_drop",  section: "history",  text: "Is there weakness or drooping on one side of your face?",                 redFlag: true  },
            ],
          },
        ],
      },
      {
        id: "CC_GROIN",
        label: "Groin, Hernia, or Scrotal Issues",
        icon: "⚕️",
        subComplaints: [
          {
            id: "SUB_DIRECT_HERNIA",
            label: "A bulge in the groin (direct hernia)",
            sublabel: "Groin bulge that stays in the groin area",
            systemValue: "GS_DIRECT_HERNIA",
            clinic: "General Surgery",
            questions: [
              { id: "q_dh_strain",    section: "symptoms", text: "Does the bulge appear or get worse when you strain or lift heavy objects?",        redFlag: false },
              { id: "q_dh_groin",     section: "symptoms", text: "Does the bulge stay in the groin area and NOT go down into the scrotum?",         redFlag: false },
              { id: "q_dh_reducible", section: "history",  text: "Can you push the bulge back in with gentle pressure?",                           redFlag: false },
              { id: "q_dh_stuck",     section: "history",  text: "Is the groin or belly bulge stuck and cannot be pushed back in, with severe pain?",redFlag: true },
              { id: "q_dh_fever_hr",  section: "history",  text: "Do you have fever and a racing heartbeat along with the stuck bulge?",           redFlag: true  },
            ],
          },
          {
            id: "SUB_INDIRECT_HERNIA",
            label: "A bulge in the groin (indirect hernia)",
            sublabel: "Groin bulge that may extend into the scrotum",
            systemValue: "GS_INDIRECT_HERNIA",
            clinic: "General Surgery",
            questions: [
              { id: "q_ih_childhood", section: "symptoms", text: "Has this bulge been present since childhood or since you were very young?",           redFlag: false },
              { id: "q_ih_scrotal",   section: "symptoms", text: "Does the bulge sometimes go down into the scrotum?",                                 redFlag: false },
              { id: "q_ih_stuck",     section: "history",  text: "Is the bulge now stuck and you cannot push it back in, with vomiting or constant pain?", redFlag: true },
            ],
          },
          {
            id: "SUB_FEMORAL_HERNIA",
            label: "A bulge in the upper thigh area (femoral hernia)",
            sublabel: "Bulge just below the groin crease",
            systemValue: "GS_FEMORAL_HERNIA",
            clinic: "General Surgery",
            questions: [
              { id: "q_fh_location", section: "symptoms", text: "Is the bulge in the crease of your upper thigh, just below the groin area?",                                  redFlag: false },
              { id: "q_fh_trapped",  section: "history",  text: "Does the bulge appear trapped with its blood supply cut off — cold, discolored, or very painful?",           redFlag: true  },
            ],
          },
          {
            id: "SUB_SCROTAL_SWELLING",
            label: "Swelling in the scrotum",
            sublabel: "Hydrocele, varicocele, or scrotal mass",
            systemValue: "GS_SCROTAL_SWELLING",
            clinic: "General Surgery",
            questions: [
              { id: "q_ss_heaviness",   section: "symptoms", text: "Do you feel a heaviness or dull ache in the scrotum?",                                    redFlag: false },
              { id: "q_ss_wormy",       section: "symptoms", text: "Is there a bulge that looks or feels like a 'bag of worms' inside the scrotum?",          redFlag: false },
              { id: "q_ss_sudden_pain", section: "history",  text: "Did sudden, severe pain in the testicles or scrotum come on without warning?",            redFlag: true  },
            ],
          },
          {
            id: "SUB_TESTICULAR_PAIN",
            label: "Ongoing pain in the testicles",
            sublabel: "Gradual or chronic scrotal/testicular pain",
            systemValue: "GS_TESTICULAR_PAIN",
            clinic: "General Surgery",
            questions: [
              { id: "q_tp_gradual",  section: "symptoms", text: "Did the pain come on gradually over time?",                                                                            redFlag: false },
              { id: "q_tp_burning",  section: "symptoms", text: "Do you have burning or pain when you urinate, or any scrotal swelling?",                                               redFlag: false },
              { id: "q_tp_sudden",   section: "history",  text: "Did sudden, very severe testicular pain start less than 6 hours ago, with one testicle sitting unusually high?",      redFlag: true  },
            ],
          },
        ],
      },
      {
        id: "CC_URINARY",
        label: "Urinary or Peeing Problems",
        icon: "💧",
        subComplaints: [
          {
            id: "SUB_VOIDING",
            label: "Trouble peeing (slow stream, frequent, or urgent)",
            sublabel: "Weak urine stream or unable to empty the bladder",
            systemValue: "GS_VOIDING",
            clinic: "General Surgery",
            questions: [
              { id: "q_void_weak",     section: "symptoms", text: "Do you have a weak stream, trouble starting to pee, or feel like your bladder is never empty?", redFlag: false },
              { id: "q_void_nocturia", section: "symptoms", text: "Do you have to get up many times at night to urinate?",                                         redFlag: false },
              { id: "q_void_complete", section: "history",  text: "Are you completely unable to pass any urine at all?",                                          redFlag: true  },
              { id: "q_void_pressure", section: "history",  text: "Do you have severe, painful pressure or distension in your lower stomach area?",               redFlag: true  },
            ],
          },
          {
            id: "SUB_KIDNEY_STONE",
            label: "Severe back or side pain (kidney stones)",
            sublabel: "Sharp flank pain that moves to the groin",
            systemValue: "GS_KIDNEY_STONE",
            clinic: "General Surgery",
            questions: [
              { id: "q_ks_flank",      section: "symptoms", text: "Do you have sharp pain in your back or side that moves down toward your groin?",               redFlag: false },
              { id: "q_ks_blood",      section: "symptoms", text: "Have you seen blood in your urine?",                                                           redFlag: false },
              { id: "q_ks_fever",      section: "symptoms", text: "Do you have a fever with nausea or vomiting?",                                                 redFlag: false },
              { id: "q_ks_fever_tap",  section: "history",  text: "Is there a fever together with severe pain when the lower back or side is gently tapped?",    redFlag: true  },
              { id: "q_ks_blocked",    section: "history",  text: "Are you completely unable to urinate normally due to the blockage?",                           redFlag: true  },
            ],
          },
          {
            id: "SUB_BLOOD_URINE",
            label: "Blood in your urine",
            sublabel: "Hematuria — visible or microscopic",
            systemValue: "GS_HEMATURIA",
            clinic: "General Surgery",
            questions: [
              { id: "q_bu_visible",     section: "symptoms", text: "Have you seen blood in your urine with your own eyes?",                                        redFlag: false },
              { id: "q_bu_painful",     section: "symptoms", text: "Is it painful when you urinate?",                                                              redFlag: false },
              { id: "q_bu_clots",       section: "symptoms", text: "Have you noticed any clots in your urine?",                                                   redFlag: false },
              { id: "q_bu_painless_40", section: "history",  text: "Is there heavy, visible blood in the urine that causes NO pain, in a patient over 40 years old?", redFlag: true },
            ],
          },
          {
            id: "SUB_PROSTATE",
            label: "Pain or discomfort in the prostate area",
            sublabel: "Perineal pain, burning urination, or prostatitis",
            systemValue: "GS_PROSTATE",
            clinic: "General Surgery",
            questions: [
              { id: "q_pro_perineum", section: "symptoms", text: "Do you have pain between your scrotum and anus (the perineal area)?",                                                                       redFlag: false },
              { id: "q_pro_dysuria",  section: "symptoms", text: "Do you have burning when you pee, or pain during ejaculation?",                                                                             redFlag: false },
              { id: "q_pro_sepsis",   section: "history",  text: "Are you having extreme shivering, very high fever, confusion, rapid breathing, and a very fast heart rate — all at the same time?",        redFlag: true  },
            ],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP 2 — INTERNAL MEDICINE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "GRP_INTERNAL",
    label: "General Illness, Respiratory, Cardiac, Endocrine & Others",
    shortLabel: "Medical Concerns",
    icon: "🫀",
    description: "Fever, cough, breathing problems, heart, diabetes, or blood pressure concerns",
    clinic: "Internal Medicine",
    chiefComplaints: [
      {
        id: "CC_GENERAL_ILLNESS",
        label: "General Illness",
        icon: "🌡️",
        subComplaints: [
          {
            id: "SUB_FEVER_IM",
            label: "Fever",
            sublabel: "New or ongoing elevated temperature",
            systemValue: "IM_FEVER",
            clinic: "Internal Medicine",
            questions: [
              { id: "q_fim_duration",  section: "symptoms", text: "Have you had a fever for more than 24 hours?",                                                                             redFlag: false },
              { id: "q_fim_other_sx",  section: "symptoms", text: "Do you have other symptoms like a cough, rash, joint pain, or pain when peeing?",                                         redFlag: false },
              { id: "q_fim_highfever", section: "history",  text: "Do you have a very high fever together with severe dizziness or fainting (signs of dangerously low blood pressure)?",     redFlag: true  },
              { id: "q_fim_confused",  section: "history",  text: "Have you experienced sudden confusion, unusual sleepiness, or acting very strangely?",                                    redFlag: true  },
            ],
          },
          {
            id: "SUB_JAUNDICE_IM",
            label: "Yellow Skin or Eyes",
            sublabel: "Yellowing of the skin or whites of the eyes",
            systemValue: "IM_JAUNDICE",
            clinic: "Internal Medicine",
            questions: [
              { id: "q_jdim_duration", section: "symptoms", text: "How long have you been yellow?",                                                                       redFlag: false },
              { id: "q_jdim_alcohol",  section: "symptoms", text: "Do you drink alcohol or take any medications regularly?",                                              redFlag: false },
              { id: "q_jdim_urine",    section: "symptoms", text: "Has your urine or stool changed color (very dark urine or pale stools)?",                              redFlag: false },
              { id: "q_jdim_o2",       section: "history",  text: "Has your blood oxygen level dropped below 90%, or are you struggling terribly to breathe?",           redFlag: true  },
            ],
          },
          {
            id: "SUB_WEIGHT_LOSS_IM",
            label: "Unexplained Weight Loss",
            sublabel: "Losing weight without trying",
            systemValue: "IM_WEIGHT_LOSS",
            clinic: "Internal Medicine",
            questions: [
              { id: "q_wlim_duration", section: "symptoms", text: "Have you lost weight unexpectedly in the last month?",                                                                                    redFlag: false },
              { id: "q_wlim_other",    section: "symptoms", text: "Do you also have night sweats, fever, or a new cough?",                                                                                  redFlag: false },
              { id: "q_wlim_bp",       section: "history",  text: "Has your blood pressure been measured over 180/120, along with a sudden severe headache, blurry vision, or chest pain?",               redFlag: true  },
              { id: "q_wlim_10pct",    section: "history",  text: "Have you lost more than 10% of your total body weight, along with constant fatigue, night sweats, or low-grade fevers?",               redFlag: true  },
            ],
          },
        ],
      },
      {
        id: "CC_RESPIRATORY_IM",
        label: "Respiratory / Cough / Breathing",
        icon: "🫁",
        subComplaints: [
          {
            id: "SUB_COUGH_IM",
            label: "Cough or difficulty breathing (non-acute)",
            sublabel: "Persistent cough or shortness of breath",
            systemValue: "IM_COUGH",
            clinic: "Internal Medicine",
            questions: [
              { id: "q_cim_duration", section: "symptoms", text: "Have you been coughing for more than 2 weeks?",                                                                            redFlag: false },
              { id: "q_cim_blood",    section: "symptoms", text: "Do you have blood in your spit, or have you been around someone with tuberculosis (TB)?",                                 redFlag: false },
              { id: "q_cim_wt_loss",  section: "symptoms", text: "Have you lost weight unexpectedly along with the cough?",                                                                redFlag: false },
              { id: "q_cim_o2",       section: "history",  text: "Has your blood oxygen dropped below 90%, or are you struggling terribly to breathe?",                                    redFlag: true  },
              { id: "q_cim_lying",    section: "history",  text: "Are you unable to breathe while lying flat and need to sit up just to breathe, with wet bubbly sounds in your lungs?",   redFlag: true  },
            ],
          },
        ],
      },
      {
        id: "CC_CARDIO_IM",
        label: "Cardiovascular / Chest / Palpitations",
        icon: "❤️",
        subComplaints: [
          {
            id: "SUB_CHEST_IM",
            label: "Heart racing or chest discomfort",
            sublabel: "Palpitations, tightness, or irregular heartbeat",
            systemValue: "IM_CHEST_PALP",
            clinic: "Internal Medicine",
            questions: [
              { id: "q_chim_moving",  section: "symptoms", text: "Does the feeling happen when you are moving or when you are resting?",                                           redFlag: false },
              { id: "q_chim_hx",      section: "symptoms", text: "Do you have any known heart problems?",                                                                        redFlag: false },
              { id: "q_chim_radiate", section: "history",  text: "Is the chest pain spreading to your arm, neck, or jaw?",                                                      redFlag: true  },
              { id: "q_chim_sweat",   section: "history",  text: "Are you breaking out in a cold sweat along with the chest pain?",                                             redFlag: true  },
            ],
          },
          {
            id: "SUB_HTN_IM",
            label: "High blood pressure (hypertension follow-up or new)",
            sublabel: "Known or newly discovered high blood pressure",
            systemValue: "IM_HTN",
            clinic: "Internal Medicine",
            questions: [
              { id: "q_htn_readings", section: "symptoms", text: "Do you have recent blood pressure readings you can share?",                                                                redFlag: false },
              { id: "q_htn_sx",       section: "symptoms", text: "Do you get headaches, chest pain, or blurry vision?",                                                                    redFlag: false },
              { id: "q_htn_bp_crisis",section: "history",  text: "Has your blood pressure been measured over 180/120, along with a sudden severe headache, blurry vision, or chest pain?", redFlag: true  },
              { id: "q_htn_bleeding", section: "history",  text: "Are you experiencing rapidly worsening confusion, easy bruising, or bleeding that won't stop?",                          redFlag: true  },
            ],
          },
        ],
      },
      {
        id: "CC_ENDOCRINE_IM",
        label: "Metabolic / Endocrine",
        icon: "🩸",
        subComplaints: [
          {
            id: "SUB_DM_IM",
            label: "Diabetes management or new diagnosis",
            sublabel: "High blood sugar, frequent urination, or extreme thirst",
            systemValue: "IM_DIABETES",
            clinic: "Internal Medicine",
            questions: [
              { id: "q_dm_polyuria",  section: "symptoms", text: "Are you urinating very frequently or feeling extremely thirsty or hungry?",                                   redFlag: false },
              { id: "q_dm_wt_loss",   section: "symptoms", text: "Have you had unexplained weight loss?",                                                                     redFlag: false },
              { id: "q_dm_bs_high",   section: "history",  text: "Has your blood sugar been measured over 400 mg/dL, with a sweet or fruity smell on your breath and constant vomiting?", redFlag: true },
            ],
          },
          {
            id: "SUB_THYROID_IM",
            label: "Thyroid symptoms",
            sublabel: "Feeling too hot or cold, hair loss, or shaking hands",
            systemValue: "IM_THYROID",
            clinic: "Internal Medicine",
            questions: [
              { id: "q_thy_temp",    section: "symptoms", text: "Do you feel like you are always too hot or too cold?",                                                          redFlag: false },
              { id: "q_thy_hair",    section: "symptoms", text: "Have you noticed hair loss, shaking hands, or feeling very tired?",                                            redFlag: false },
              { id: "q_thy_lying",   section: "history",  text: "Are you unable to breathe while lying flat and need to sit up to breathe, with wet bubbly or crackling sounds in your lungs?", redFlag: true },
              { id: "q_thy_delirium",section: "history",  text: "Do you have a dangerously high fever with a racing heartbeat and sudden confusion or agitation?",              redFlag: true  },
            ],
          },
        ],
      },
      {
        id: "CC_OTHERS_IM",
        label: "Others",
        icon: "🔵",
        subComplaints: [
          {
            id: "SUB_SWOLLEN_LEGS_IM",
            label: "Swollen legs",
            sublabel: "Leg swelling, possibly with shortness of breath",
            systemValue: "IM_SWOLLEN_LEGS",
            clinic: "Internal Medicine",
            questions: [
              { id: "q_sl_hx",     section: "symptoms", text: "Do you have a history of heart, kidney, or liver problems?",                                                    redFlag: false },
              { id: "q_sl_sob",    section: "symptoms", text: "Do you get short of breath when you move around?",                                                              redFlag: false },
              { id: "q_sl_fever",  section: "history",  text: "Do you have a dangerously high fever with a racing heartbeat and sudden confusion or delirium?",               redFlag: true  },
            ],
          },
          {
            id: "SUB_DIABFOOT_IM",
            label: "Diabetic foot wound",
            sublabel: "A sore or wound on the foot in a diabetic patient",
            systemValue: "IM_DIAB_FOOT",
            clinic: "Internal Medicine",
            questions: [
              { id: "q_df_sore",   section: "symptoms", text: "Do you currently have a sore or open wound on your foot?",                                                     redFlag: false },
              { id: "q_df_smell",  section: "symptoms", text: "Does the wound have a bad smell, or do you currently have a fever?",                                           redFlag: false },
              { id: "q_df_black",  section: "history",  text: "Is the wound foul-smelling, black, or wet-looking (signs of tissue death/gangrene)?",                         redFlag: true  },
              { id: "q_df_sepsis", section: "history",  text: "Do you have signs of a body-wide infection — high fever, severe shivering, or rapid breathing?",              redFlag: true  },
            ],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP 3 — OB-GYNE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "GRP_OBGYNE",
    label: "Pregnancy Care, Reproductive Care & Gynecologic Symptoms",
    shortLabel: "Women's Health",
    icon: "🤱",
    description: "Prenatal visits, menstrual concerns, or gynecologic problems",
    clinic: "OB-Gyne",
    chiefComplaints: [
      {
        id: "CC_PREGNANCY_CARE",
        label: "Pregnancy Care",
        icon: "🤰",
        subComplaints: [
          {
            id: "SUB_PRENATAL_OB",
            label: "Prenatal check-up (OB consult)",
            sublabel: "First visit or regular follow-up during pregnancy",
            systemValue: "OB_PRENATAL",
            clinic: "OB-Gyne",
            questions: [
              { id: "q_pre_lmp",       section: "symptoms", text: "Are you pregnant? When was the first day of your last menstrual period?",                              redFlag: false },
              { id: "q_pre_first",     section: "symptoms", text: "Is this your first prenatal check-up?",                                                               redFlag: false },
              { id: "q_pre_headache",  section: "history",  text: "Do you have a severe headache together with high blood pressure (over 140/90) or sudden swelling of the face or hands?", redFlag: true },
            ],
          },
          {
            id: "SUB_VAG_BLEED_PREG",
            label: "Vaginal bleeding (during pregnancy)",
            sublabel: "Bleeding while pregnant",
            systemValue: "OB_VAG_BLEED_PREG",
            clinic: "OB-Gyne",
            questions: [
              { id: "q_vbp_trimester", section: "symptoms", text: "Are you in your third trimester (more than 6 months pregnant)?",                                       redFlag: false },
              { id: "q_vbp_heavy",     section: "symptoms", text: "Is the bleeding heavy?",                                                                              redFlag: false },
              { id: "q_vbp_movement",  section: "symptoms", text: "Are you feeling the baby move? Do you have any pain along with the bleeding?",                        redFlag: false },
              { id: "q_vbp_shock",     section: "history",  text: "Are you feeling severely dizzy, fainting, having cold sweats, or a racing pulse (signs of dangerously low blood pressure)?", redFlag: true },
            ],
          },
        ],
      },
      {
        id: "CC_REPRO_HEALTH",
        label: "Reproductive Health",
        icon: "💊",
        subComplaints: [
          {
            id: "SUB_VAG_BLEED_OB",
            label: "Vaginal bleeding (non-pregnant)",
            sublabel: "Abnormal or heavy bleeding when not pregnant",
            systemValue: "OB_VAG_BLEED_NONPREG",
            clinic: "OB-Gyne",
            questions: [
              { id: "q_vbn_heavy",    section: "symptoms", text: "Is your bleeding heavier than a normal period?",                                                   redFlag: false },
              { id: "q_vbn_post_sex", section: "symptoms", text: "Have you had any bleeding after sex or between your periods?",                                     redFlag: false },
              { id: "q_vbn_shock",    section: "history",  text: "Are you soaking through pads rapidly and feeling severely dizzy, confused, or having a racing pulse?", redFlag: true },
            ],
          },
          {
            id: "SUB_AMENORRHEA_OB",
            label: "Missed period (amenorrhea)",
            sublabel: "No menstrual period for one or more cycles",
            systemValue: "OB_AMENORRHEA",
            clinic: "OB-Gyne",
            questions: [
              { id: "q_am_pregnant",  section: "symptoms", text: "Is it possible you could be pregnant?",                                                             redFlag: false },
              { id: "q_am_changes",   section: "symptoms", text: "Have you had any big changes in your weight, stress level, or exercise recently?",                  redFlag: false },
              { id: "q_am_ectopic",   section: "history",  text: "Do you have a missed period AND a positive pregnancy test AND severe sharp belly pain AND feel faint or dizzy?", redFlag: true },
            ],
          },
          {
            id: "SUB_FAMPLAN_OB",
            label: "Family planning consult",
            sublabel: "Starting or changing birth control",
            systemValue: "OB_FAMPLAN",
            clinic: "OB-Gyne",
            questions: [
              { id: "q_fp_current",  section: "symptoms", text: "Are you here to start or change a birth control method?",                                                redFlag: false },
              { id: "q_fp_pap",      section: "symptoms", text: "When was your last Pap smear?",                                                                        redFlag: false },
              { id: "q_fp_pelvic",   section: "history",  text: "Do you have a foul-smelling vaginal discharge together with fever and severe pain in the lower belly or pelvic area?", redFlag: true },
            ],
          },
        ],
      },
      {
        id: "CC_GYNE_SYMPTOMS",
        label: "Gynecological Symptoms",
        icon: "🔴",
        subComplaints: [
          {
            id: "SUB_ABD_PAIN_OB",
            label: "Abdominal pain (gynecological)",
            sublabel: "Pelvic or lower belly pain related to reproductive organs",
            systemValue: "OB_ABD_PAIN",
            clinic: "OB-Gyne",
            questions: [
              { id: "q_apob_location", section: "symptoms", text: "Where does it hurt? Is the pain related to your menstrual period?",                                   redFlag: false },
              { id: "q_apob_iud",      section: "symptoms", text: "Do you use any form of birth control like an IUD?",                                                  redFlag: false },
              { id: "q_apob_ectopic",  section: "history",  text: "Do you have a positive pregnancy test, lower belly pain, and vaginal bleeding — even if blood pressure seems stable?", redFlag: true },
            ],
          },
          {
            id: "SUB_VAG_DISC_OB",
            label: "Vaginal discharge",
            sublabel: "Change in color, smell, or texture of discharge",
            systemValue: "OB_VAG_DISC",
            clinic: "OB-Gyne",
            questions: [
              { id: "q_vd_color",   section: "symptoms", text: "Have you noticed any change in the color, smell, or texture of your discharge?",                        redFlag: false },
              { id: "q_vd_itch",    section: "symptoms", text: "Do you have any itching or irritation?",                                                               redFlag: false },
            ],
          },
          {
            id: "SUB_BREAST_LUMP_OB",
            label: "Breast lump (female)",
            sublabel: "A new lump or change in the breast",
            systemValue: "OB_BREAST_LUMP",
            clinic: "OB-Gyne",
            questions: [
              { id: "q_blob_appeared", section: "symptoms", text: "Has this lump appeared or grown in the last week?",                                                    redFlag: false },
              { id: "q_blob_cycle",    section: "symptoms", text: "Does it change depending on where you are in your monthly cycle?",                                    redFlag: false },
              { id: "q_blob_immobile", section: "history",  text: "Does the lump feel stuck or immovable, with skin dimpling (orange-peel appearance), in a patient over 40? (Routes to Surgery)", redFlag: true },
            ],
          },
          {
            id: "SUB_MENOPAUSE_OB",
            label: "Menopausal symptoms",
            sublabel: "Hot flashes, mood changes, or vaginal dryness",
            systemValue: "OB_MENOPAUSE",
            clinic: "OB-Gyne",
            questions: [
              { id: "q_men_sx",      section: "symptoms", text: "Are you having hot flashes, mood changes, or vaginal dryness?",                                       redFlag: false },
              { id: "q_men_lmp",     section: "symptoms", text: "When was your last menstrual period?",                                                               redFlag: false },
              { id: "q_men_bleeding",section: "history",  text: "Have you had any vaginal bleeding or spotting after already going through menopause?",                redFlag: true  },
            ],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP 4 — PEDIATRICS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "GRP_PEDIA",
    label: "Acute Childhood Illness, Neonatal & Wellness",
    shortLabel: "Child's Health",
    icon: "👶",
    description: "Concerns for patients under 19 years old",
    clinic: "Pediatrics",
    chiefComplaints: [
      {
        id: "CC_ACUTE_CHILD",
        label: "Acute Childhood Illness",
        icon: "🌡️",
        subComplaints: [
          {
            id: "SUB_FEVER_PED",
            label: "Fever in a child",
            sublabel: "New or high fever in a child",
            systemValue: "PED_FEVER",
            clinic: "Pediatrics",
            questions: [
              { id: "q_pf_duration",    section: "symptoms", text: "Has your child had a fever for more than 24 hours?",                                                       redFlag: false },
              { id: "q_pf_rash",        section: "symptoms", text: "Does the child have a rash, seizures, or trouble breathing along with the fever?",                        redFlag: false },
              { id: "q_pf_confused",    section: "history",  text: "Has the child had a sudden confusion or severe drowsiness?",                                              redFlag: true  },
              { id: "q_pf_purpura",     section: "history",  text: "Are there tiny, flat purple or red spots on the child's skin (not fading when pressed)?",                 redFlag: true  },
              { id: "q_pf_dehydration", section: "history",  text: "Does the child appear severely dehydrated — sunken eyes, dry mouth, or not passing any urine?",          redFlag: true  },
            ],
          },
          {
            id: "SUB_COUGH_PED",
            label: "Cough or difficulty breathing (child)",
            sublabel: "Noisy breathing, persistent cough, or feeding difficulties",
            systemValue: "PED_COUGH",
            clinic: "Pediatrics",
            questions: [
              { id: "q_cpd_duration", section: "symptoms", text: "How long has the child been coughing?",                                                                    redFlag: false },
              { id: "q_cpd_noisy",    section: "symptoms", text: "Does the child's breathing sound noisy or whistling?",                                                     redFlag: false },
              { id: "q_cpd_feeding",  section: "symptoms", text: "Is the child feeding and drinking normally?",                                                              redFlag: false },
              { id: "q_cpd_retracts", section: "history",  text: "Is there deep sucking-in of the chest or ribs when the child breathes (chest retractions)?",              redFlag: true  },
              { id: "q_cpd_stridor",  section: "history",  text: "Is there a harsh, high-pitched whistling sound with every breath in (stridor)?",                          redFlag: true  },
              { id: "q_cpd_o2",       section: "history",  text: "Has the child's blood oxygen level dropped below 90%?",                                                   redFlag: true  },
            ],
          },
          {
            id: "SUB_DIARRHEA_PED",
            label: "Diarrhea or vomiting (child)",
            sublabel: "Frequent loose stools or vomiting in a child",
            systemValue: "PED_DIARRHEA",
            clinic: "Pediatrics",
            questions: [
              { id: "q_dpd_frequency", section: "symptoms", text: "Is the child having diarrhea more than 3 times a day?",                                                  redFlag: false },
              { id: "q_dpd_blood",     section: "symptoms", text: "Is there blood in the stool?",                                                                          redFlag: false },
              { id: "q_dpd_urine",     section: "symptoms", text: "Is the child passing less urine than usual today?",                                                     redFlag: false },
              { id: "q_dpd_dehydrate", section: "history",  text: "Does the child have severe dehydration — sunken eyes, dry mouth — and is not passing any urine at all?",redFlag: true  },
              { id: "q_dpd_drowsy",    section: "history",  text: "Is the child extremely drowsy or unable to be fully woken up?",                                         redFlag: true  },
            ],
          },
        ],
      },
      {
        id: "CC_NEONATAL_PED",
        label: "Neonatal / Specialized",
        icon: "🍼",
        subComplaints: [
          {
            id: "SUB_NEWBORN_PED",
            label: "Newborn concern (under 1 month old)",
            sublabel: "For babies 0–28 days old",
            systemValue: "PED_NEWBORN",
            clinic: "Pediatrics",
            questions: [
              { id: "q_nb_birth",    section: "symptoms", text: "Were there any complications during the baby's birth?",                                               redFlag: false },
              { id: "q_nb_feeding",  section: "symptoms", text: "Is the baby feeding well? Do you notice any yellowing of the skin or eyes?",                          redFlag: false },
              { id: "q_nb_fever",    section: "history",  text: "Is the baby under 28 days old and developing a fever or suddenly too weak to feed or suck milk?",    redFlag: true  },
            ],
          },
          {
            id: "SUB_TUMMY_PED",
            label: "Tummy pain (child)",
            sublabel: "Abdominal pain in a child",
            systemValue: "PED_TUMMY_PAIN",
            clinic: "Pediatrics",
            questions: [
              { id: "q_tpd_location", section: "symptoms", text: "Where does it hurt? Is the child constipated?",                                                      redFlag: false },
              { id: "q_tpd_blood",    section: "symptoms", text: "Have you noticed blood in the stool?",                                                              redFlag: false },
              { id: "q_tpd_board",    section: "history",  text: "Does the child's stomach feel as hard as a wooden board, with fever and severe pain that spikes sharply when a hand is lifted from the belly?", redFlag: true },
            ],
          },
        ],
      },
      {
        id: "CC_WELLNESS_PED",
        label: "Wellness & Others",
        icon: "💉",
        subComplaints: [
          {
            id: "SUB_EAR_PED",
            label: "Ear pain or ear discharge (child)",
            sublabel: "Pain in the ear or fluid coming out",
            systemValue: "PED_EAR",
            clinic: "Pediatrics",
            questions: [
              { id: "q_ear_duration", section: "symptoms", text: "Has this symptom been present for more than 3 days?",                                                 redFlag: false },
              { id: "q_ear_fluid",    section: "symptoms", text: "Is there any fluid coming out of the ear, or does the child seem to have trouble hearing?",          redFlag: false },
              { id: "q_ear_swelling", section: "history",  text: "Is there painful, red swelling behind the ear with fever or signs like a droopy face or dizziness?", redFlag: true  },
            ],
          },
          {
            id: "SUB_RASH_PED",
            label: "Skin rash (child)",
            sublabel: "A new or spreading rash",
            systemValue: "PED_RASH",
            clinic: "Pediatrics",
            questions: [
              { id: "q_rash_duration", section: "symptoms", text: "Has the rash been present for more than 48 hours?",                                                  redFlag: false },
              { id: "q_rash_new",      section: "symptoms", text: "Did you start any new medicines or foods recently? Is there a fever?",                               redFlag: false },
              { id: "q_rash_purpura",  section: "history",  text: "Are there tiny, flat purple or red spots on the skin together with high fever and the child looking extremely ill or pale?", redFlag: true },
            ],
          },
          {
            id: "SUB_GROWTH_PED",
            label: "Growth or developmental concern",
            sublabel: "Weight, height, or milestone worries",
            systemValue: "PED_GROWTH",
            clinic: "Pediatrics",
            questions: [
              { id: "q_grw_wt_ht",    section: "symptoms", text: "Are you concerned about the child's weight or height?",                                              redFlag: false },
              { id: "q_grw_milestone",section: "symptoms", text: "Is the child reaching their milestones (like sitting or talking) for their age?",                    redFlag: false },
              { id: "q_grw_malnutr",  section: "history",  text: "Does the child have extreme wasting or severe body swelling from malnutrition, along with high fever, severe weakness, or breathing trouble?", redFlag: true },
            ],
          },
          {
            id: "SUB_VACC_PED",
            label: "Immunization or well-child visit",
            sublabel: "Routine vaccination or developmental check-up",
            systemValue: "PED_WELLNESS",
            clinic: "Pediatrics",
            questions: [
              { id: "q_vacc_routine", section: "symptoms", text: "Are you here for a routine vaccination visit?",                                                      redFlag: false },
              { id: "q_vacc_dev",     section: "history",  text: "Do you have any concerns about the child's growth or development?",                                 redFlag: false },
            ],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP 5 — FAMILY MEDICINE / PRIMARY CARE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "GRP_PRIMARY",
    label: "General Wellness, Common Ailments, Chronic Disease & Mental Health",
    shortLabel: "Primary Care",
    icon: "🏥",
    description: "Check-ups, minor illness, chronic condition follow-up, or mental health",
    clinic: "Family Medicine",
    chiefComplaints: [
      {
        id: "CC_WELLNESS_FAM",
        label: "General Wellness",
        icon: "✅",
        subComplaints: [
          {
            id: "SUB_ANNUAL_FAM",
            label: "Annual health exam or school / pre-employment check-up",
            sublabel: "Routine physical examination",
            systemValue: "FM_ANNUAL_EXAM",
            clinic: "Family Medicine",
            questions: [
              { id: "q_ann_purpose",  section: "symptoms", text: "Are you here for an annual health exam, a school check-up, or a pre-employment medical?",            redFlag: false },
              { id: "q_ann_abnormal", section: "history",  text: "Has any abnormal finding been discovered that may require referral to a specialist?",               redFlag: true  },
            ],
          },
          {
            id: "SUB_PREEMPLOY_FAM",
            label: "Occupational or pre-employment exam",
            sublabel: "Employer or school required medical form",
            systemValue: "FM_PREEMPLOY",
            clinic: "Family Medicine",
            questions: [
              { id: "q_pe_form",      section: "symptoms", text: "Do you have a specific form or list of requirements that your employer or school needs filled out?",  redFlag: false },
              { id: "q_pe_headache",  section: "history",  text: "Do you have the sudden onset of the worst headache of your life, along with a stiff neck or inability to touch your chin to your chest?", redFlag: true },
            ],
          },
        ],
      },
      {
        id: "CC_COMMON_AILMENTS",
        label: "Common Ailments",
        icon: "🤧",
        subComplaints: [
          {
            id: "SUB_FATIGUE_FAM",
            label: "Fatigue or body malaise",
            sublabel: "Persistent tiredness or general feeling of being unwell",
            systemValue: "FM_FATIGUE",
            clinic: "Family Medicine",
            questions: [
              { id: "q_fat_duration", section: "symptoms", text: "Have you been feeling tired or unwell for more than 1 week?",                                         redFlag: false },
              { id: "q_fat_sleep",    section: "symptoms", text: "Are you having trouble sleeping, losing weight, or feeling sad or anxious?",                          redFlag: false },
              { id: "q_fat_anemia",   section: "history",  text: "Do you appear extremely pale and weak, with unexplained weight loss and heavy sweating at night (signs of severe anemia)?", redFlag: true },
            ],
          },
          {
            id: "SUB_URI_FAM",
            label: "Minor upper respiratory infection",
            sublabel: "Cough or colds present for less than 2 weeks",
            systemValue: "FM_URI",
            clinic: "Family Medicine",
            questions: [
              { id: "q_uri_duration", section: "symptoms", text: "Have you had this cough for less than 2 weeks?",                                                      redFlag: false },
              { id: "q_uri_throat",   section: "symptoms", text: "Do you have a sore throat or runny nose, and are you breathing okay?",                               redFlag: false },
              { id: "q_uri_stridor",  section: "history",  text: "Do you have severe difficulty breathing or a harsh, high-pitched whistling sound when breathing in (stridor)?", redFlag: true },
            ],
          },
          {
            id: "SUB_MSK_FAM",
            label: "Musculoskeletal pain (non-traumatic)",
            sublabel: "Joint or muscle pain without a recent injury",
            systemValue: "FM_MSK",
            clinic: "Family Medicine",
            questions: [
              { id: "q_msk_location", section: "symptoms", text: "Where is the pain? Does it feel stiff in the morning, or did you have a recent injury?",             redFlag: false },
              { id: "q_msk_deformed", section: "history",  text: "Did a severe injury or fall result in a visibly deformed limb or joint with total inability to move it? (Routes to Surgery)", redFlag: true },
            ],
          },
          {
            id: "SUB_HEADACHE_FAM",
            label: "Headache (non-urgent)",
            sublabel: "Headache lasting more than 24 hours",
            systemValue: "FM_HEADACHE",
            clinic: "Family Medicine",
            questions: [
              { id: "q_ha_duration",  section: "symptoms", text: "Has this headache lasted for more than 24 hours?",                                                    redFlag: false },
              { id: "q_ha_nausea",    section: "symptoms", text: "Does it make you feel sick to your stomach, or are you having any vision changes?",                  redFlag: false },
              { id: "q_ha_sudden",    section: "history",  text: "Is this the sudden onset of the worst headache of your life, along with a stiff neck?",              redFlag: true  },
            ],
          },
          {
            id: "SUB_SKIN_FAM",
            label: "Skin concern (non-mass)",
            sublabel: "Itching, rash, or skin irritation",
            systemValue: "FM_SKIN",
            clinic: "Family Medicine",
            questions: [
              { id: "q_skn_itch",    section: "symptoms", text: "Is the area itchy, red, or have you noticed a new rash?",                                             redFlag: false },
              { id: "q_skn_new",     section: "symptoms", text: "Have you started using any new soaps or products lately?",                                           redFlag: false },
              { id: "q_skn_spread",  section: "history",  text: "Is a skin infection, rash, or redness expanding very quickly across the body with a high fever or chills?", redFlag: true },
            ],
          },
        ],
      },
      {
        id: "CC_CHRONIC_MENTAL",
        label: "Chronic & Mental Health",
        icon: "🧠",
        subComplaints: [
          {
            id: "SUB_MENTAL_FAM",
            label: "Mental health concern",
            sublabel: "Mood, sleep, anxiety, or emotional concerns",
            systemValue: "FM_MENTAL",
            clinic: "Family Medicine",
            questions: [
              { id: "q_mh_mood",     section: "symptoms", text: "Are you having trouble with your mood, sleep, or appetite?",                                         redFlag: false },
              { id: "q_mh_anxiety",  section: "symptoms", text: "Do you feel anxious or worried often?",                                                             redFlag: false },
              { id: "q_mh_suicidal", section: "history",  text: "Are you having thoughts of harming yourself or ending your life, along with a specific plan?",      redFlag: true  },
            ],
          },
          {
            id: "SUB_CHRONIC_FAM",
            label: "Chronic disease follow-up (stable)",
            sublabel: "Diabetes, hypertension, asthma, or other ongoing illness",
            systemValue: "FM_CHRONIC",
            clinic: "Family Medicine",
            questions: [
              { id: "q_chr_reason",  section: "symptoms", text: "Are you here for a follow-up on your diabetes, high blood pressure, or asthma?",                    redFlag: false },
              { id: "q_chr_meds",    section: "symptoms", text: "Are you currently taking your medicines as prescribed?",                                            redFlag: false },
              { id: "q_chr_worsen",  section: "history",  text: "Have you had a sudden, severe worsening of your condition recently — such as a sudden kidney or heart failure episode?", redFlag: true },
            ],
          },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function RedFlagOverlay({ onReset }: { onReset: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/95">
      <div className="mx-4 w-full max-w-2xl rounded-2xl border-4 border-white bg-red-600 p-8 text-center shadow-2xl">
        <p className="mb-2 text-5xl">🔴</p>
        <h3 className="mb-3 text-3xl font-extrabold text-white">IMMEDIATE ER REDIRECTION</h3>
        <p className="mb-4 text-lg text-red-100">
          One of your answers indicates a potential emergency condition.
        </p>
        <div className="inline-block rounded-xl bg-red-950 px-6 py-4 text-xl font-semibold text-white">
          Please get your ticket and proceed immediately to the Emergency Room!
        </div>
        <button
          type="button"
          onClick={onReset}
          className="mx-auto mt-6 block cursor-pointer text-xs text-red-300 opacity-70 hover:underline"
        >
          Cancel / Reset kiosk
        </button>
      </div>
    </div>
  );
}

function NavBar() {
  return (
    <nav className="flex w-full items-center justify-between bg-yellow-50 px-8 py-4 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold leading-tight text-cyan-950">BICA</h1>
        <p className="text-xs text-cyan-800">Better Informed Care Access</p>
      </div>
      <ul className="hidden space-x-6 text-sm font-semibold text-cyan-900 md:flex">
        <li><a href="#" className="hover:underline">Triage Form |</a></li>
        <li><a href="#" className="hover:underline">Vital Signs |</a></li>
        <li><a href="#" className="text-orange-600 underline">Chief Complaints |</a></li>
        <li><a href="#" className="hover:underline">Summary |</a></li>
      </ul>
    </nav>
  );
}

function Breadcrumb({ step, group, cc, sub }: { step: number; group: Group | null; cc: ChiefComplaint | null; sub: SubComplaint | null }) {
  const steps = [
    { label: "Body Area",                         done: step > 1, active: step === 1 },
    { label: group?.shortLabel ?? "Concern Area", done: step > 2, active: step === 2 },
    { label: cc?.label ?? "Specific Complaint",   done: step > 3, active: step === 3 },
    { label: sub?.label ?? "Key History",         done: false,    active: step === 4 },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold
            ${s.done   ? "border-emerald-500 bg-emerald-950 text-emerald-400"
            : s.active ? "border-orange-300 bg-cyan-950 text-orange-200"
            :            "border-cyan-800 text-cyan-600"}`}>
            {s.done && "✓ "}{s.label}
          </span>
          {i < steps.length - 1 && <span className="text-cyan-700 text-sm">›</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function SummaryPanel({ step, group, cc, sub, answers }: { step: number; group: Group | null; cc: ChiefComplaint | null; sub: SubComplaint | null; answers: Record<string, boolean> }) {
  const totalQ   = sub?.questions.length ?? 0;
  const yesCount = Object.values(answers).filter(Boolean).length;
  return (
    <div className="w-52 flex-shrink-0">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-white">Your Selections</p>
      <div className="flex min-h-[12rem] flex-col gap-3 rounded-xl border border-cyan-800 bg-cyan-950 p-4">
        {group ? (
          <div>
            <p className="text-xs font-semibold uppercase text-cyan-500">Group</p>
            <p className="mt-0.5 text-sm font-bold text-orange-200">{group.icon} {group.shortLabel}</p>
          </div>
        ) : <p className="text-xs italic text-cyan-600">No selection yet.</p>}
        {cc && (
          <div className="border-t border-cyan-800 pt-2">
            <p className="text-xs font-semibold uppercase text-cyan-500">Complaint</p>
            <p className="mt-0.5 text-sm font-bold text-orange-200">{cc.label}</p>
          </div>
        )}
        {sub && (
          <div className="border-t border-cyan-800 pt-2">
            <p className="text-xs font-semibold uppercase text-cyan-500">Sub-complaint</p>
            <p className="mt-0.5 text-sm font-bold text-orange-200">{sub.label}</p>
            <p className="mt-0.5 text-xs text-cyan-500">→ {sub.clinic}</p>
          </div>
        )}
        {totalQ > 0 && (
          <div className="border-t border-cyan-800 pt-2">
            <p className="text-xs font-semibold uppercase text-cyan-500">YES answers</p>
            <p className="mt-0.5 text-sm font-bold text-orange-200">{yesCount} of {totalQ}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── STEP 1 ───────────────────────────────────────────────────────────────────
function Step1({ onSelect }: { onSelect: (group: Group) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-3xl font-bold text-white">Where is the problem?</h2>
        <p className="mt-1 text-base text-cyan-300">Choose the group that best describes your concern.</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {CATEGORY_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onSelect(g)}
            className="group cursor-pointer rounded-xl border-2 border-cyan-800 bg-cyan-950 px-6 py-5
              text-left transition-all hover:border-orange-300 hover:bg-[#0e4f68]"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{g.icon}</span>
              <div>
                <p className="text-base font-bold text-white group-hover:text-orange-100">{g.shortLabel}</p>
                <p className="mt-0.5 text-sm text-cyan-400 group-hover:text-cyan-300">{g.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── STEP 2 ───────────────────────────────────────────────────────────────────
function Step2({ group, onSelect }: { group: Group; onSelect: (cc: ChiefComplaint) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">
          {group.icon} {group.shortLabel}
        </p>
        <h2 className="text-3xl font-bold text-white">What is your main concern?</h2>
        <p className="mt-1 text-base text-cyan-300">Choose the category that best describes your problem.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {group.chiefComplaints.map((cc) => (
          <button
            key={cc.id}
            type="button"
            onClick={() => onSelect(cc)}
            className="group cursor-pointer rounded-xl border-2 border-cyan-800 bg-cyan-950 px-5 py-6
              text-left transition-all hover:border-orange-300 hover:bg-[#0e4f68]"
          >
            <p className="text-2xl mb-1">{cc.icon}</p>
            <p className="text-base font-bold leading-snug text-white group-hover:text-orange-100">{cc.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── STEP 3 ───────────────────────────────────────────────────────────────────
function Step3({ cc, onSelect }: { cc: ChiefComplaint; onSelect: (sub: SubComplaint) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">
          {cc.icon} {cc.label}
        </p>
        <h2 className="text-3xl font-bold text-white">Which describes you best?</h2>
        <p className="mt-1 text-base text-cyan-300">Select the option that most closely matches your situation.</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {cc.subComplaints.map((sc) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => onSelect(sc)}
            className="group cursor-pointer rounded-xl border-2 border-cyan-800 bg-cyan-950 px-5 py-5
              text-left transition-all hover:border-orange-300 hover:bg-[#0e4f68]"
          >
            <p className="text-base font-bold text-white group-hover:text-orange-100">{sc.label}</p>
            {sc.sublabel && (
              <p className="mt-0.5 text-sm text-cyan-400 group-hover:text-cyan-300">{sc.sublabel}</p>
            )}
          </button>
        ))}
      </div>
      <div className="border-t border-dashed border-cyan-700 pt-2">
        <button type="button" className="cursor-pointer text-sm text-orange-200 hover:underline">
          My concern is not listed here… →
        </button>
      </div>
    </div>
  );
}

// ─── STEP 4 ───────────────────────────────────────────────────────────────────
function Step4({ sub, answers, onAnswer }: { sub: SubComplaint; answers: Record<string, boolean>; onAnswer: (id: string, value: boolean) => void }) {
  const symptomQs = sub.questions.filter((q: Question) => q.section === "symptoms");
  const historyQs = sub.questions.filter((q: Question) => q.section === "history");
  const answered  = Object.keys(answers).length;
  const total     = sub.questions.length;

  let globalIdx = 0;
  const renderQuestion = (q: Question) => {
    const idx    = globalIdx++;
    const isYes  = answers[q.id] === true;
    return (
      <div
        key={q.id}
        className={`flex items-center justify-between gap-4 rounded-xl border-2 px-5 py-4 transition-all
          ${q.redFlag ? "border-red-900 bg-red-950" : "border-cyan-800 bg-cyan-950"}`}
      >
        <div className="flex flex-1 items-start gap-3">
          <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold
            ${q.redFlag
              ? "bg-red-700 text-white"
              : answers[q.id] !== undefined
                ? "bg-emerald-700 text-white"
                : "bg-cyan-800 text-cyan-400"}`}>
            {idx + 1}
          </span>
          <div>
            <p className={`text-sm font-semibold leading-snug ${q.redFlag ? "text-red-200" : "text-white"}`}>
              {q.text}
            </p>
            {q.redFlag && <p className="mt-0.5 text-xs font-bold text-red-400">⚠ Urgent if YES</p>}
          </div>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 flex-shrink-0">
          <input
            type="checkbox"
            checked={isYes}
            onChange={(e) => onAnswer(q.id, e.target.checked)}
            className="h-5 w-5 rounded border-cyan-700 text-emerald-500 focus:ring-2 focus:ring-emerald-400"
          />
          <span className="text-sm font-semibold text-white">Yes</span>
        </label>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-orange-300">{sub.label}</p>
        <h2 className="text-3xl font-bold text-white">Key History Questions</h2>
        <p className="mt-1 text-base text-cyan-300">
          Check <span className="font-bold text-emerald-400">YES</span> for anything that applies to you.
        </p>
      </div>

      {symptomQs.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 pb-1 border-b border-cyan-800">
            Current Symptoms
          </p>
          {symptomQs.map(renderQuestion)}
        </div>
      )}

      {historyQs.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 pb-1 border-b border-cyan-800">
            Health History &amp; Observation
          </p>
          {historyQs.map(renderQuestion)}
        </div>
      )}

      <div className="pt-1">
        <div className="mb-1 flex justify-between text-xs text-cyan-500">
          <span>{answered} of {total} answered</span>
          <span>{total - answered} remaining</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-cyan-900">
          <div
            className="h-full rounded-full bg-orange-400 transition-all duration-300"
            style={{ width: total > 0 ? `${(answered / total) * 100}%` : "0%" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface PrimaryClinicsProps {
  onBack?: () => void;
  onProceed?: (payload: any) => void;
}

export default function PrimaryClinics({ onBack, onProceed }: PrimaryClinicsProps) {
  const [step,    setStep]    = useState<number>(1);
  const [group,   setGroup]   = useState<Group | null>(null);
  const [cc,      setCc]      = useState<ChiefComplaint | null>(null);
  const [sub,     setSub]     = useState<SubComplaint | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [redFlag, setRedFlag] = useState(false);

  const selectGroup = (g: Group) => { setGroup(g); setCc(null); setSub(null); setAnswers({}); setStep(2); };
  const selectCc    = (c: ChiefComplaint) => { setCc(c);    setSub(null); setAnswers({}); setStep(3); };
  const selectSub   = (s: SubComplaint) => { setSub(s);   setAnswers({}); setStep(4); };

  const handleAnswer = (id: string, value: boolean) => {
    const question = sub?.questions.find((q) => q.id === id);
    if (question?.redFlag && value === true) { setRedFlag(true); return; }
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleBack = () => {
    if      (step === 4) { setStep(3); setAnswers({}); }
    else if (step === 3) { setStep(2); setSub(null); }
    else if (step === 2) { setStep(1); setGroup(null); setCc(null); }
  };

  const handleReset = () => {
    setRedFlag(false); setStep(1);
    setGroup(null); setCc(null); setSub(null); setAnswers({});
  };

  const handleProceed = () => {
    const payload = {
      group_id:     group?.id,
      group_label:  group?.label,
      cc_id:        cc?.id,
      cc_label:     cc?.label,
      sub_id:       sub?.id,
      sub_label:    sub?.label,
      system_value: sub?.systemValue,
      clinic:       sub?.clinic,
      answers,
    };
    console.log("BICA Payload → ML Model:", JSON.stringify(payload, null, 2));
    if (onProceed) {
      onProceed(payload);
    } else {
      alert(`Routing to: ${sub?.clinic}\nSystem Value: ${sub?.systemValue}`);
    }
  };

  const yesCount = Object.values(answers).filter(Boolean).length;

  return (
    <div>
      {redFlag && <RedFlagOverlay onReset={handleReset} />}

      <NavBar />

      <div className="flex min-h-screen flex-col items-center gap-6 bg-cyan-950 px-4 py-8">

        {onBack && (
          <div className="w-full max-w-[72rem] pl-4">
            <button onClick={onBack} className="text-sm text-white/80 hover:text-white">← Back to Safety</button>
          </div>
        )}

        <div className="text-center">
          <p className="mb-1 text-sm font-bold uppercase tracking-widest text-orange-300">Chief Complaints</p>
          <h1 className="text-4xl font-bold text-white">Tell us about your concern</h1>
        </div>

        <Breadcrumb step={step} group={group} cc={cc} sub={sub} />

        <div className="flex w-[72rem] max-w-full flex-row gap-6 rounded-2xl bg-cyan-900 px-8 py-8">

          <div className="min-w-0 flex-1">
            {step === 1 && <Step1 onSelect={selectGroup} />}
            {step === 2 && group && <Step2 group={group} onSelect={selectCc} />}
            {step === 3 && cc    && <Step3 cc={cc} onSelect={selectSub} />}
            {step === 4 && sub   && <Step4 sub={sub} answers={answers} onAnswer={handleAnswer} />}
          </div>

          <div className="flex flex-col justify-between gap-4">
            <SummaryPanel step={step} group={group} cc={cc} sub={sub} answers={answers} />

            <div className="mt-4 flex flex-col gap-2">
              {step === 4 && (
                <button
                  type="button"
                  disabled={yesCount < 1}
                  onClick={handleProceed}
                  className={`rounded-xl px-5 py-3 text-base font-bold transition-all
                    ${yesCount >= 1
                      ? "cursor-pointer bg-orange-50 text-cyan-950 hover:bg-orange-100"
                      : "cursor-not-allowed bg-cyan-800 text-cyan-500"}`}
                >
                  Proceed →
                </button>
              )}

              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="cursor-pointer rounded-xl border border-orange-200 bg-transparent
                    px-5 py-2.5 text-sm font-semibold text-orange-100 hover:bg-cyan-800"
                >
                  ← Back
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="mt-1 cursor-pointer text-center text-xs text-cyan-600 hover:text-cyan-400 hover:underline"
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