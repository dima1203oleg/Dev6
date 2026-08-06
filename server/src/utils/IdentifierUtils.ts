import { RnokppValidator } from '../validation/RnokppValidator';

export class IdentifierUtils {
  public static normalizeRnokpp(rnokpp: string): string {
    const validation = RnokppValidator.validate(rnokpp);
    if (validation.isValid) {
      return validation.normalizedValue;
    }
    return rnokpp.replace(/\s+/g, '');
  }
}
