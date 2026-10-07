import { AuthUser, AuthCredentials } from '../types/erp';

const STORAGE_KEYS = {
  CREDENTIALS: 'sandeep_erp_auth_credentials',
  SESSION: 'sandeep_erp_auth_session',
};

const DEFAULT_CREDENTIALS: AuthCredentials = {
  loginId: 'admin',
  passwordHash: 'admin123',
  name: 'Sandeep (Store Owner)',
  updatedAt: new Date().toISOString(),
};

class AuthService {
  constructor() {
    this.initCredentials();
  }

  private initCredentials(): void {
    if (!localStorage.getItem(STORAGE_KEYS.CREDENTIALS)) {
      localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(DEFAULT_CREDENTIALS));
    }
  }

  public getCredentials(): AuthCredentials {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      return raw ? JSON.parse(raw) : DEFAULT_CREDENTIALS;
    } catch {
      return DEFAULT_CREDENTIALS;
    }
  }

  public getCurrentUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  public login(loginIdInput: string, passwordInput: string): { success: boolean; user?: AuthUser; error?: string } {
    const creds = this.getCredentials();
    const cleanId = loginIdInput.trim().toLowerCase();
    const allowedIds = [creds.loginId.toLowerCase(), '9027855051', 'sandeep'];

    // Check login ID
    if (!allowedIds.includes(cleanId)) {
      return { success: false, error: 'Login ID invalid hai. Kripya apna sahi Username ya registered Mobile No enter karein.' };
    }

    // Check Password
    if (passwordInput !== creds.passwordHash) {
      return { success: false, error: 'Aapka enter kiya gaya Password galat hai. Kripya dobara check karein.' };
    }

    const user: AuthUser = {
      loginId: creds.loginId,
      name: creds.name,
      role: 'admin',
      lastLogin: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    return { success: true, user };
  }

  public logout(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }

  public changePassword(oldPasswordInput: string, newPasswordInput: string): { success: boolean; error?: string } {
    const creds = this.getCredentials();

    if (oldPasswordInput !== creds.passwordHash) {
      return { success: false, error: 'Purana (Current) Password galat hai.' };
    }

    if (!newPasswordInput || newPasswordInput.trim().length < 4) {
      return { success: false, error: 'Naya password kam se kam 4 characters ka hona chahiye.' };
    }

    if (oldPasswordInput === newPasswordInput.trim()) {
      return { success: false, error: 'Naya password purane password se alag hona chahiye.' };
    }

    const updatedCreds: AuthCredentials = {
      ...creds,
      passwordHash: newPasswordInput.trim(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(updatedCreds));
    return { success: true };
  }
}

export const authService = new AuthService();
