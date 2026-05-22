export interface TwoFactorSetup {
  secretKey: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  isValid: boolean;
  remainingAttempts?: number;
}

export class TwoFactorService {
  private static readonly BACKUP_CODES_KEY = 'backup-codes-';
  private static readonly SETUP_KEY = '2fa-setup-';

  static generateSetup(email: string): TwoFactorSetup {
    // Generate mock secret key
    const secretKey = 'JBSWY3DPEHPK3PXP'; // Mock secret for demo
    const appName = 'ColoVision';
    
    // Generate OTP Auth URL
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(email)}?secret=${secretKey}&issuer=${encodeURIComponent(appName)}`;
    
    // Generate QR code URL (using QR server for demo)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Store setup temporarily
    localStorage.setItem(`${this.SETUP_KEY}${email}`, JSON.stringify({
      secretKey,
      backupCodes,
      setupTime: Date.now()
    }));

    return {
      secretKey,
      qrCodeUrl,
      backupCodes
    };
  }

  static async verifyCode(email: string, code: string, isSetup: boolean = false): Promise<TwoFactorVerification> {
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return { isValid: false, remainingAttempts: 2 };
    }

    // For demo purposes, accept specific codes or any 6-digit code
    const validCodes = ['123456', '000000'];
    const isValidFormat = code.length === 6 && /^\d+$/.test(code);
    const isValid = validCodes.includes(code) || isValidFormat;

    if (isValid && isSetup) {
      // Mark 2FA as completed for this user
      this.complete2FASetup(email);
    }

    return { isValid, remainingAttempts: isValid ? undefined : 1 };
  }

  static async verifyBackupCode(email: string, code: string): Promise<TwoFactorVerification> {
    const setupData = localStorage.getItem(`${this.SETUP_KEY}${email}`);
    if (!setupData) {
      return { isValid: false };
    }

    try {
      const { backupCodes } = JSON.parse(setupData);
      const isValid = backupCodes.includes(code.toUpperCase());
      
      if (isValid) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter((c: string) => c !== code.toUpperCase());
        const updatedSetup = { ...JSON.parse(setupData), backupCodes: updatedCodes };
        localStorage.setItem(`${this.SETUP_KEY}${email}`, JSON.stringify(updatedSetup));
      }

      return { isValid };
    } catch (error) {
      return { isValid: false };
    }
  }

  static complete2FASetup(email: string): void {
    // Mark user as having completed 2FA setup
    const userKey = `user-${email}`;
    const userData = { hasSetup2FA: true };
    localStorage.setItem(userKey, JSON.stringify(userData));

    // Clean up temporary setup data
    localStorage.removeItem(`${this.SETUP_KEY}${email}`);
  }

  static isSetupRequired(email: string): boolean {
    const userKey = `user-${email}`;
    const userData = localStorage.getItem(userKey);
    
    if (!userData) return true;
    
    try {
      const { hasSetup2FA } = JSON.parse(userData);
      return !hasSetup2FA;
    } catch (error) {
      return true;
    }
  }

  static getSetupData(email: string): TwoFactorSetup | null {
    const setupData = localStorage.getItem(`${this.SETUP_KEY}${email}`);
    if (!setupData) return null;

    try {
      const { secretKey, backupCodes } = JSON.parse(setupData);
      const qrCodeUrl = this.generateQRCodeUrl(email, secretKey);
      
      return { secretKey, qrCodeUrl, backupCodes };
    } catch (error) {
      return null;
    }
  }

  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  private static generateQRCodeUrl(email: string, secretKey: string): string {
    const appName = 'ColoVision';
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(email)}?secret=${secretKey}&issuer=${encodeURIComponent(appName)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
  }

  static regenerateBackupCodes(email: string): string[] {
    const setupData = localStorage.getItem(`${this.SETUP_KEY}${email}`);
    if (!setupData) return [];

    try {
      const data = JSON.parse(setupData);
      const newBackupCodes = this.generateBackupCodes();
      
      const updatedSetup = { ...data, backupCodes: newBackupCodes };
      localStorage.setItem(`${this.SETUP_KEY}${email}`, JSON.stringify(updatedSetup));
      
      return newBackupCodes;
    } catch (error) {
      return [];
    }
  }

  static disable2FA(email: string): void {
    const userKey = `user-${email}`;
    localStorage.removeItem(userKey);
    localStorage.removeItem(`${this.SETUP_KEY}${email}`);
    localStorage.removeItem(`${this.BACKUP_CODES_KEY}${email}`);
  }
}