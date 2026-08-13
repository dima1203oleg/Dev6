/**
 * Enterprise Continuous Production Certification Platform v2.0
 * Screenshot Validation with golden image comparison
 * BLOCK 3
 */

import { ScreenshotValidation, VisualIssue } from './types';

export class ScreenshotValidator {
  private static goldenImages: Map<string, string> = new Map();
  private static tolerance = 0.01; // 1% pixel difference tolerance

  /**
   * Validate card screenshot against golden image
   */
  static async validateScreenshot(
    cardId: string,
    currentImage: string
  ): Promise<ScreenshotValidation> {
    const goldenImage = this.goldenImages.get(cardId);
    
    if (!goldenImage) {
      return {
        cardId,
        goldenImage: '',
        currentImage,
        diffImage: undefined,
        pixelDifference: 100,
        visualIssues: [{
          type: 'EMPTY_BLOCK',
          severity: 'HIGH',
          location: 'entire_card',
          description: 'No golden image available for comparison',
        }],
        status: 'WARNING',
        validatedAt: new Date().toISOString(),
      };
    }

    // Compare images
    const comparison = await this.compareImages(goldenImage, currentImage);
    
    // Detect visual issues
    const visualIssues = await this.detectVisualIssues(currentImage, comparison.diffImage);

    // Determine status
    const status = this.determineStatus(comparison.pixelDifference, visualIssues);

    return {
      cardId,
      goldenImage,
      currentImage,
      diffImage: comparison.diffImage,
      pixelDifference: comparison.pixelDifference,
      visualIssues,
      status,
      validatedAt: new Date().toISOString(),
    };
  }

  /**
   * Compare two images
   */
  private static async compareImages(
    _image1: string,
    _image2: string
  ): Promise<{ pixelDifference: number; diffImage?: string }> {
    // In production, this would use a proper image comparison library
    // like sharp, pixelmatch, or similar
    
    // For now, simulate comparison
    const pixelDifference = Math.random() * 5; // Simulate 0-5% difference
    
    return {
      pixelDifference,
      diffImage: undefined, // Would contain diff image in production
    };
  }

  /**
   * Detect visual issues in screenshot
   */
  private static async detectVisualIssues(
    _image: string,
    _diffImage?: string
  ): Promise<VisualIssue[]> {
    const issues: VisualIssue[] = [];

    // In production, this would use computer vision to detect:
    // - Text cutoff
    // - Color mismatches
    // - Broken icons
    // - Empty blocks
    // - Element misalignment
    // - Responsive issues

    // Simulated detection
    if (Math.random() > 0.9) {
      issues.push({
        type: 'TEXT_CUTOFF',
        severity: 'MEDIUM',
        location: 'card_header',
        description: 'Text may be cut off in header section',
      });
    }

    if (Math.random() > 0.95) {
      issues.push({
        type: 'COLOR_MISMATCH',
        severity: 'LOW',
        location: 'status_badge',
        description: 'Color may not match design system',
      });
    }

    return issues;
  }

  /**
   * Determine validation status
   */
  private static determineStatus(
    pixelDifference: number,
    visualIssues: VisualIssue[]
  ): 'PASS' | 'FAIL' | 'WARNING' {
    // Check for critical issues
    const hasCriticalIssues = visualIssues.some(i => i.severity === 'CRITICAL');
    if (hasCriticalIssues) {
      return 'FAIL';
    }

    // Check for high issues
    const hasHighIssues = visualIssues.some(i => i.severity === 'HIGH');
    if (hasHighIssues) {
      return 'FAIL';
    }

    // Check pixel difference
    if (pixelDifference > this.tolerance * 100) {
      return 'FAIL';
    }

    // Check for medium issues
    const hasMediumIssues = visualIssues.some(i => i.severity === 'MEDIUM');
    if (hasMediumIssues) {
      return 'WARNING';
    }

    // Check for low pixel difference
    if (pixelDifference > this.tolerance * 50) {
      return 'WARNING';
    }

    return 'PASS';
  }

  /**
   * Set golden image for a card
   */
  static setGoldenImage(cardId: string, image: string): void {
    this.goldenImages.set(cardId, image);
  }

  /**
   * Get golden image for a card
   */
  static getGoldenImage(cardId: string): string | undefined {
    return this.goldenImages.get(cardId);
  }

  /**
   * Remove golden image
   */
  static removeGoldenImage(cardId: string): void {
    this.goldenImages.delete(cardId);
  }

  /**
   * Validate multiple cards
   */
  static async validateMultipleCards(
    screenshots: Map<string, string>
  ): Promise<ScreenshotValidation[]> {
    const results: ScreenshotValidation[] = [];

    for (const [cardId, image] of screenshots.entries()) {
      const result = await this.validateScreenshot(cardId, image);
      results.push(result);
    }

    return results;
  }

  /**
   * Set tolerance for pixel difference
   */
  static setTolerance(tolerance: number): void {
    this.tolerance = Math.max(0, Math.min(1, tolerance));
  }

  /**
   * Get tolerance
   */
  static getTolerance(): number {
    return this.tolerance;
  }

  /**
   * Export golden images
   */
  static exportGoldenImages(): string {
    return JSON.stringify(Object.fromEntries(this.goldenImages), null, 2);
  }

  /**
   * Import golden images
   */
  static importGoldenImages(data: string): void {
    try {
      const parsed = JSON.parse(data);
      Object.entries(parsed).forEach(([cardId, image]) => {
        this.goldenImages.set(cardId, image as string);
      });
    } catch (error) {
      console.error('Failed to import golden images:', error);
    }
  }

  /**
   * Get validation statistics
   */
  static getValidationStatistics(results: ScreenshotValidation[]): {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    avgPixelDifference: number;
    totalIssues: number;
    bySeverity: Record<string, number>;
  } {
    const total = results.length;
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warnings = results.filter(r => r.status === 'WARNING').length;
    
    const avgPixelDifference = results.length > 0
      ? results.reduce((sum, r) => sum + r.pixelDifference, 0) / results.length
      : 0;

    const totalIssues = results.reduce((sum, r) => sum + r.visualIssues.length, 0);
    
    const bySeverity: Record<string, number> = {};
    results.forEach(r => {
      r.visualIssues.forEach(issue => {
        bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
      });
    });

    return {
      total,
      passed,
      failed,
      warnings,
      avgPixelDifference,
      totalIssues,
      bySeverity,
    };
  }
}
