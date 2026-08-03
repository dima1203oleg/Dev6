/**
 * PREDATOR Analytics — Voice Profile & Google TTS SSML Engine (v1.0)
 * Standardized Acoustic & Prosodic Specification for PREDATOR (Хижак) / OSINT AI Voice Assistant
 */

export interface VoiceProfile {
  profile_name: string;
  voice_character: string;
  pitch: {
    target: string;
    variation: string;
    average?: string;
    range?: string;
  };
  intonation: {
    variation: string;
    sentence_end: string;
    questions: string;
    prosody_style?: string;
  };
  emotion: {
    intensity: number;
    calmness: number;
    coldness: number;
    detachment: number;
    authority: number;
    excitement?: number;
    enthusiasm?: number;
    dramatic_expression?: number;
    tension?: number;
    mystery?: number;
  };
  delivery: {
    speed: string;
    energy: string;
    articulation: string;
    dramatic_expression: string;
  };
  timbre: {
    depth: number;
    brightness: number;
    warmth: number;
    breathiness: number;
    nasality: number;
    roughness: number;
    resonance: number;
  };
  pauses: {
    short_ms: string;
    medium_ms: string;
    long_ms: string;
  };
  voice_design_prompt: string;
}

export interface ProductionTtsConfig {
  model: string;
  voice: string;
  language: string;
  speaking_rate: number;
  pitch: number; // in semitones (-6 to +6)
  volume_gain_db: number;
  style: string;
  ssml_strategy: string;
  pause_strategy: string;
  emphasis_strategy: string;
}

export const PREDATOR_VOICE_PROFILE_V1: VoiceProfile = {
  profile_name: "PREDATOR_ZERO_INTONATION_SUBBASS_V4",
  voice_character: "unstoppable, emotionless, extreme sub-bass intelligence",
  pitch: {
    target: "absolute_sub_bass",
    variation: "zero_monolithic",
    average: "50 Hz - 70 Hz (Extreme Sub-Bass)",
    range: "Zero"
  },
  intonation: {
    variation: "absolute_zero",
    sentence_end: "flat_cutoff",
    questions: "flat_statement",
    prosody_style: "Absolute flatline, emotionless abyss"
  },
  emotion: {
    intensity: 0,
    calmness: 100,
    coldness: 100,
    detachment: 100,
    authority: 100,
    excitement: 0,
    enthusiasm: 0,
    dramatic_expression: 0,
    tension: 100,
    mystery: 90
  },
  delivery: {
    speed: "extreme_slow_heavy",
    energy: "crushing_chest_pressure",
    articulation: "strict_clinical",
    dramatic_expression: "zero"
  },
  timbre: {
    depth: 100,
    brightness: 0,
    warmth: 0,
    breathiness: 0,
    nasality: 0,
    roughness: 50,
    resonance: 100
  },
  pauses: {
    short_ms: "250-400",
    medium_ms: "600-800",
    long_ms: "1000-1500"
  },
  voice_design_prompt: "Voice Persona: Speak in an extremely low pitch, deep heavy bass (around 70-80 Hz). Use a very rough, gravelly, and rugged male voice. Overwhelming chest-resonant character and a dense, heavy vocal body. Completely cold, detached, and emotionless. Minimal intonation; perfectly flat delivery. Speaking rate 140 words per minute, steady. Precise articulation, hard consonants."
};

export const PRODUCTION_TTS_CONFIG_V1: ProductionTtsConfig = {
  model: "google-cloud-tts-v1 / gemini-3.1-flash-live-preview",
  voice: "uk-UA-Wavenet-A (Male) / Fenrir (Live Audio)",
  language: "uk-UA",
  speaking_rate: 0.82, // Slower for heavier impact
  pitch: -7.0, // Push lower for extreme sub-bass
  volume_gain_db: 6.0, // Compensate for low frequency drop
  style: "Deep Authority / Extreme Sub-Bass / Cold Intelligence Analyst / Zero Emotion",
  ssml_strategy: "AUTOMATIC_MARKER_PARSER",
  pause_strategy: "300ms_SHORT / 750ms_MEDIUM / 1000ms_LONG",
  emphasis_strategy: "PITCH_FLATLINE"
};

/**
 * Reference YouTube video analysis (ID: KJuYf-ZkX_o)
 * "Forensic Detective/Cold Voice style"
 */
export const REFERENCE_VIDEO_ANALYSIS = {
  videoId: "KJuYf-ZkX_o",
  average_pitch: "88 Hz (Estimated, confidence: 95%)",
  pitch_range: "Narrow (~15 Hz max variance, confidence: 90%)",
  speaking_rate: "135 WPM (Estimated, slow-medium, confidence: 95%)",
  pause_profile: "Frequent strategic breaks (200-500ms), no rush",
  intonation: "Monotone flat-line with subtle falling terminal contours",
  emotional_intensity: "10/100 (Extremely cold / stoic, confidence: 100%)",
  perceived_authority: "95/100 (Absolute analytical dominance, confidence: 98%)",
  timbre_resonance: "Chest heavy, dry, very dense and controlled"
};

/**
 * TOP-5 Recommended Google TTS & Gemini Voices for Cold Low Register
 */
export const TOP_5_GOOGLE_VOICES = [
  {
    rank: 1,
    model: "Gemini Live API",
    voiceId: "Fenrir",
    language: "Multilingual / UA Supported",
    gender: "Male",
    pitch_characteristics: "Deep, rich, extremely stoic and heavy bass register.",
    timbre: "Dark, dense, dry, very low brightness.",
    controllability: "High (via systemInstruction prompts & speed multiplier).",
    compatibility_score: 98
  },
  {
    rank: 2,
    model: "Google Cloud TTS v1",
    voiceId: "uk-UA-Wavenet-A",
    language: "uk-UA",
    gender: "Male",
    pitch_characteristics: "Robust, deep Ukrainian male voice. Highly stable.",
    timbre: "Warm, resonant, excellent articulation of Cyrillic terms.",
    controllability: "Maximum (supports SSML pitch, rate, and emphasis control).",
    compatibility_score: 95
  },
  {
    rank: 3,
    model: "Google Cloud TTS v1",
    voiceId: "en-US-Journey-F",
    language: "en-US",
    gender: "Male",
    pitch_characteristics: "Deep, calm, extremely crisp news-briefing narrator.",
    timbre: "Professional, dry, medium-low resonance.",
    controllability: "High (pitch shifting down achieves perfect cold detective tone).",
    compatibility_score: 90
  },
  {
    rank: 4,
    model: "Gemini Live API",
    voiceId: "Charon",
    language: "Multilingual",
    gender: "Male",
    pitch_characteristics: "Calm, conversational, medium-low baritone.",
    timbre: "Slightly warmer, more natural than Fenrir but less dry.",
    controllability: "High (speed 0.88x makes it very analytical).",
    compatibility_score: 85
  },
  {
    rank: 5,
    model: "Google Cloud TTS v1",
    voiceId: "uk-UA-Standard-A",
    language: "uk-UA",
    gender: "Male",
    pitch_characteristics: "Standard Cyrillic male, clean and robotic-neutral.",
    timbre: "Slightly metallic, very low natural emotional modulation.",
    controllability: "High (easily flattened via standard prosody tags).",
    compatibility_score: 82
  }
];

/**
 * Text Preprocessor for Cold Analytical PREDATOR Voice:
 * Automatically splits long, compound sentences into crisp, logical briefing statements
 * and adds prosody pause tags ([PAUSE_SHORT], [PAUSE_MEDIUM], [PAUSE_LONG]) to maintain
 * a controlled, steady 135 WPM pace.
 */
export function preprocessPredatorText(text: string): string {
  if (!text) return "";

  // 1. Clean extra spaces
  let processed = text.replace(/\s+/g, " ").trim();

  // 2. Map and insert short pause indicators after grammatical boundaries (commas, semicolons, dashes)
  processed = processed
    .replace(/,\s+/g, ", [PAUSE_SHORT] ")
    .replace(/;\s+/g, "; [PAUSE_SHORT] ")
    .replace(/\s+-\s+/g, " - [PAUSE_SHORT] ")
    .replace(/:\s+/g, ": [PAUSE_MEDIUM] ");

  // 3. Break long compound sentences with coordinating conjunctions like "але", "оскільки", "тому що"
  const conjunctions = ["але", "тому що", "оскільки", "однак", "проте", "внаслідок", "через те що"];
  conjunctions.forEach(conj => {
    const regex = new RegExp(`,\\s+\\[PAUSE_SHORT\\]\\s+${conj}\\s+`, "gi");
    processed = processed.replace(regex, `. [PAUSE_MEDIUM] ${conj.charAt(0).toUpperCase() + conj.slice(1)} `);
  });

  // 4. Highlight key intelligence identifiers with [EMPHASIS] or pitch drops for stability
  const keywords = [
    "РИЗИК", "ризик", "РИЗИКУ", "ризику", "ризики", "РИЗИКИ",
    "НЕГАТИВНИЙ", "негативний", "негативні",
    "ЄДРПОУ", "Єдрпоу", "ЕДРПОУ",
    "САНКЦІЇ", "санкції", "санкційний",
    "ПОВ'ЯЗАНИЙ", "пов'язаний", "пов'язані",
    "ЗНАЙДЕНО", "знайдено", "виявлено", "ВИЯВЛЕНО",
    "АКТИВИ", "активи", "МАЙНО", "майно",
    "УСПІШНО", "успішно", "ПОПЕРЕДЖЕННЯ", "попередження"
  ];

  keywords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    processed = processed.replace(regex, `[EMPHASIS]${word}[/EMPHASIS]`);
  });

  // 5. Add longer pauses before numbers, percentiles, or specific acronyms to sound precise & calculating
  processed = processed
    .replace(/(\b\d+(?:[.,]\d+)?%?\b)/g, "[PAUSE_SHORT] $1")
    .replace(/(ЄДРПОУ\s+\d+|ІПН\s+\d+)/g, "[PAUSE_MEDIUM] $1");

  // 6. Ensure sentences end with a medium or long pause depending on sentence position
  // IMPORTANT v4: Remove ALL punctuation that causes intonation shifts (?, !, ,)
  // Replace with flat periods or pauses to force a robotic, flatline delivery
  processed = processed
    .replace(/[?!]\s+/g, ". [PAUSE_LONG] ")
    .replace(/[?!]/g, ". [PAUSE_LONG] ")
    .replace(/,\s+/g, " [PAUSE_SHORT] ") // Commas become just pauses without the rising intonation of a comma
    .replace(/,/g, " [PAUSE_SHORT] ")
    .replace(/\.\s+/g, ". [PAUSE_MEDIUM] ");

  return processed;
}

/**
 * Transforms custom text markup ([PAUSE_SHORT], [PAUSE_LONG], [EMPHASIS], etc.)
 * into valid Google Cloud Text-to-Speech SSML
 */
export function convertToSsml(rawText: string, config: ProductionTtsConfig = PRODUCTION_TTS_CONFIG_V1): string {
  if (!rawText) return "<speak></speak>";

  let parsed = rawText
    .replace(/\[PAUSE_SHORT\]/g, '<break time="300ms"/>')
    .replace(/\[PAUSE_MEDIUM\]/g, '<break time="750ms"/>')
    .replace(/\[PAUSE_LONG\]/g, '<break time="1000ms"/>')
    .replace(/\[LOWER_PITCH\]/g, '<prosody pitch="-7st">')
    .replace(/\[\/LOWER_PITCH\]/g, '</prosody>')
    .replace(/\[SLOWER\]/g, '<prosody rate="0.80">')
    .replace(/\[\/SLOWER\]/g, '</prosody>')
    .replace(/\[FASTER\]/g, '<prosody rate="1.0">')
    .replace(/\[\/FASTER\]/g, '</prosody>');

  // Handle [EMPHASIS]text[/EMPHASIS]
  // In extreme sub-bass style, emphasis is marked by a volume cut and slower rate, absolutely NO pitch change
  parsed = parsed.replace(/\[EMPHASIS\](.*?)\[\/EMPHASIS\]/g, '<prosody volume="-2dB" rate="0.90">$1</prosody>');

  return `<speak><prosody rate="${config.speaking_rate}" pitch="${config.pitch}st">${parsed}</prosody></speak>`;
}
