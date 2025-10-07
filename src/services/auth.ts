// src/services/auth.ts
import { auth } from "./firebase";
import { TwoFactorService } from "./twoFactor";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";

export interface UserSession {
  email: string;
  isAuthenticated: boolean;
  needs2FASetup: boolean;
  needs2FAVerification: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export class AuthService {
  private static readonly SESSION_KEY = "colovision-session";

  static getCurrentSession(): UserSession | null {
    const savedSession = localStorage.getItem(this.SESSION_KEY);
    if (savedSession) {
      try {
        return JSON.parse(savedSession) as UserSession;
      } catch (error) {
        localStorage.removeItem(this.SESSION_KEY);
        return null;
      }
    }
    return null;
  }

  static saveSession(session: UserSession): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  // 🔹 Signup with Firebase (includes confirmPassword check)
  static async signup(credentials: SignupCredentials): Promise<UserSession> {
    if (credentials.password !== credentials.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const userCred: UserCredential = await createUserWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );

    const session: UserSession = {
      email: userCred.user.email || credentials.email,
      isAuthenticated: true,
      needs2FASetup: true, // future: connect Firebase MFA
      needs2FAVerification: false,
    };

    this.saveSession(session);
    return session;
  }

  // 🔹 Login with Firebase
  static async login(credentials: LoginCredentials): Promise<UserSession> {
    const userCred: UserCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );

    const email = userCred.user.email || credentials.email;
    const needsSetup = TwoFactorService.isSetupRequired(email);
    const session: UserSession = {
      email,
      isAuthenticated: true,
      needs2FASetup: needsSetup,
      needs2FAVerification: !needsSetup,
    };

    this.saveSession(session);
    return session;
  }

  // 🔹 Google Sign-in with Firebase
  static async googleAuth(isSignup: boolean = false): Promise<UserSession> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    const email = result.user.email || "unknown@google.com";
    const needsSetup = isSignup ? true : TwoFactorService.isSetupRequired(email);
    const session: UserSession = {
      email,
      isAuthenticated: true,
      needs2FASetup: needsSetup,
      needs2FAVerification: !needsSetup,
    };

    this.saveSession(session);
    return session;
  }

  // 🔹 Logout
  static async logout(): Promise<void> {
    await signOut(auth);
    this.clearSession();
  }

  // 🔹 Basic validation before hitting Firebase
  static validateCredentials(email: string, password: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && password.length >= 1;
  }

  // 🔹 Strong password rules for signup
  static validateSignupPassword(password: string): {
    isValid: boolean;
    checks: {
      minLength: boolean;
      hasUpperCase: boolean;
      hasLowerCase: boolean;
      hasNumbers: boolean;
      hasSpecialChar: boolean;
    };
  } {
    const checks = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const isValid = Object.values(checks).every((check) => check);

    return { isValid, checks };
  }
}
