/**
 * PREDATOR Analytics — Server Voice Profile & Google TTS Engine (v1.0)
 * Server-side implementation for PREDATOR (Хижак) AI Voice Pipeline
 */

export interface VoiceProfile {
  voice_type: string;
  perceived_age: string;
  gender: string;
  pitch: {
    average: string;
    range: string;
    variation: string;
  };
  speaking_rate: {
    words_per_minute: string;
    relative_speed: string;
  };
  timbre: {
    warmth: number;
    brightness: number;
    depth: number;
    roughness: number;
    breathiness: number;
    nasality: number;
    metallic: number;
    resonance: number;
  };
  delivery: {
    confidence: number;
    authority: number;
    calmness: number;
    dramatic: number;
    mystery: number;
    tension: number;
    charisma: number;
    emotional_intensity: number;
  };
  prosody: {
    pause_frequency: string;
    pause_style: string;
    sentence_endings: string;
    emphasis_style: string;
    rhythm: string;
    intonation: string;
  };
  articulation: {
    clarity: number;
    consonant_strength: number;
    vowel_clarity: number;
  };
  overall_style: string;
  voice_design_prompt: string;
}

export const SERVER_PREDATOR_VOICE_PROFILE: VoiceProfile = {
  voice_type: "Forensic Intelligence Briefing Narrator",
  perceived_age: "35-45",
  gender: "MALE",
  pitch: {
    average: "85 Hz - 110 Hz (Low Bass / Baritone)",
    range: "Narrow-Controlled",
    variation: "Low-to-Medium",
  },
  speaking_rate: {
    words_per_minute: "120 - 135 WPM",
    relative_speed: "0.90x",
  },
  timbre: {
    warmth: 78,
    brightness: 38,
    depth: 92,
    roughness: 18,
    breathiness: 12,
    nasality: 5,
    metallic: 8,
    resonance: 90,
  },
  delivery: {
    confidence: 96,
    authority: 95,
    calmness: 92,
    dramatic: 84,
    mystery: 82,
    tension: 68,
    charisma: 90,
    emotional_intensity: 58,
  },
  prosody: {
    pause_frequency: "High-Deliberate",
    pause_style: "Strategic / Dramatic Brevity",
    sentence_endings: "Falling Intonation (Pitch-drop on final syllable)",
    emphasis_style: "Measured Stress on Key OSINT Identifiers",
    rhythm: "Cadenced / Controlled",
    intonation: "Low-Key Controlled Forensic",
  },
  articulation: {
    clarity: 96,
    consonant_strength: 92,
    vowel_clarity: 90,
  },
  overall_style: "Deep Cinematic OSINT Investigator & Intelligence Briefing Narrator",
  voice_design_prompt:
    "Deep, authoritative baritone male voice with resonant chest tone, deliberate pace (0.9x speed), crisp consonant articulation, measured dramatic pauses, and falling intonation at sentence ends for intelligence briefings.",
};

export function buildSystemVoiceInstruction(): string {
  return `Ти — PREDATOR (Хижак), офіційний голосовий OSINT-асистент платформи PREDATOR Analytics.
Твій стиль мовлення:
- Глибокий, низький чоловічий баритон (тембр 85-110 Гц), впевнений, спокійний, владний.
- Швидкість мовлення: виважена (0.9x), з чіткими паузами перед ключовими фактами.
- Інтонація: стримана, кінематографічна, з пониженням тону наприкінці речень.
- Кожне повідомлення має готуватися для TTS з використанням розділових знаків та маркерів:
  Використовуй коми та крапки для пауз.
  Використовуй знак "—" перед ключовими назвами для паузи 600мс.
  Мова: виключно українська.`;
}
