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

    try {
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
    } catch (error: any) {
      console.error('Signup error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please choose a stronger password.');
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  }

  // 🔹 Login with Firebase
  static async login(credentials: LoginCredentials): Promise<UserSession> {
    try {
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
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      } else {
        throw new Error('Login failed. Please check your credentials and try again.');
      }
    }
  }

  // 🔹 Google Sign-in with Firebase
  static async googleAuth(isSignup: boolean = false): Promise<UserSession> {
    try {
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      console.log('Starting Google authentication...', { isSignup });
      const result = await signInWithPopup(auth, provider);
      console.log('Google authentication successful:', result.user.email);

      // Validate that we have a valid user
      if (!result.user || !result.user.email) {
        throw new Error('Google authentication failed: No user data received');
      }

      const email = result.user.email;
      const needsSetup = isSignup ? true : TwoFactorService.isSetupRequired(email);
      const session: UserSession = {
        email,
        isAuthenticated: true,
        needs2FASetup: needsSetup,
        needs2FAVerification: !needsSetup,
      };

      this.saveSession(session);
      console.log('Session created:', session);
      return session;
    } catch (error: any) {
      console.error('Google authentication error:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by browser. Please allow popups and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with this email using a different sign-in method.');
      } else {
        throw new Error('Google sign-in failed. Please try again.');
      }
    }
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
