// core/classifier/IdentifierClassifier.ts

export type IdentifierType = 'RNOKPP' | 'EDRPOU' | 'PHONE' | 'UNKNOWN';

export interface IdentifierResult {
  type: IdentifierType;
  value: string;
  isValid: boolean;
  message?: string;
}

export class IdentifierClassifier {
  static classify(input: string): IdentifierResult {
    const cleanInput = input.trim();

    // 1. РНОКПП (10 цифр)
    if (/^\d{10}$/.test(cleanInput)) {
      return { type: 'RNOKPP', value: cleanInput, isValid: true };
    }

    // 2. ЄДРПОУ (8 цифр)
    if (/^\d{8}$/.test(cleanInput)) {
      return { type: 'EDRPOU', value: cleanInput, isValid: true };
    }

    // 3. Телефон (спрощена валідація)
    if (/^\+?\d{10,12}$/.test(cleanInput)) {
      return { type: 'PHONE', value: cleanInput, isValid: true };
    }

    return { type: 'UNKNOWN', value: cleanInput, isValid: false, message: 'Некоректний формат ідентифікатора' };
  }
}
