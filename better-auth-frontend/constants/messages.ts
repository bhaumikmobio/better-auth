export const APP_COPY = {
  appTitle: "Better Auth Demo",
} as const;

export const PASSWORD_POLICY = {
  minLength: 8,
} as const;

export const LOGIN_COPY = {
  title: "Log in",
  description: "Use your email and password.",
  googleButton: "Continue with Google",
  googleButtonLoading: "Redirecting to Google...",
  emailLabel: "Email",
  passwordLabel: "Password",
  emailPlaceholder: "you@example.com",
  passwordPlaceholder: "••••••••",
  submit: "Log in",
  submitLoading: "Logging in...",
  noAccountPrefix: "Don’t have an account?",
  noAccountLink: "Sign up",
  forgotPasswordLink: "Forgot password?",
  toast: {
    fallbackInvalidCredentials: "Invalid email or password",
    success: "Logged in.",
    failure: "Login failed",
    googleFailure: "Google login failed",
  },
} as const;

export const SIGNUP_COPY = {
  title: "Sign up",
  description: "Create an account with email and password.",
  googleButton: "Sign up with Google",
  googleButtonLoading: "Redirecting to Google...",
  nameLabel: "Name",
  emailLabel: "Email",
  passwordLabel: "Password",
  namePlaceholder: "Your name",
  emailPlaceholder: "you@example.com",
  passwordPlaceholder: "••••••••",
  submit: "Create account",
  submitLoading: "Creating account...",
  haveAccountPrefix: "Already have an account?",
  haveAccountLink: "Log in",
  toast: {
    fallback: "Signup failed",
    success: "Account created. Please log in.",
    googleFailure: "Google signup failed",
  },
} as const;

export const DASHBOARD_COPY = {
  title: "Dashboard",
  description: "Minimal authenticated page.",
  changePassword: "Change password",
  logout: "Logout",
  logoutLoading: "Signing out...",
  sessionLoading: "Loading session...",
  redirecting: "Redirecting to login...",
  signedInAsLabel: "Signed in as:",
  unknownEmail: "unknown",
  namePrefix: "Name:",
  toast: {
    logoutSuccess: "Logged out.",
  },
} as const;

export const FORGOT_PASSWORD_COPY = {
  title: "Forgot password",
  description: "Enter your email and we will send a reset link.",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  submit: "Send reset link",
  submitLoading: "Sending...",
  backToLogin: "Back to login",
  toast: {
    success: "If this email exists, a reset link has been sent.",
    failure: "Could not request password reset",
  },
} as const;

export const RESET_PASSWORD_COPY = {
  title: "Reset password",
  description: "Enter your new password.",
  passwordLabel: "New password",
  confirmPasswordLabel: "Confirm password",
  passwordPlaceholder: "••••••••",
  minLengthHint: `Password must be at least ${PASSWORD_POLICY.minLength} characters.`,
  submit: "Reset password",
  submitLoading: "Resetting...",
  goToLogin: "Go to login",
  invalidToken: "Reset link is invalid or expired.",
  missingToken: "Reset token is missing.",
  passwordMismatch: "New password and confirm password do not match.",
  toast: {
    success: "Password reset successful. Please log in.",
    failure: "Could not reset password",
  },
} as const;

export const CHANGE_PASSWORD_COPY = {
  title: "Change password",
  description: "Update your password using your current password.",
  currentPasswordLabel: "Current password",
  newPasswordLabel: "New password",
  confirmPasswordLabel: "Confirm new password",
  passwordPlaceholder: "••••••••",
  minLengthHint: `Password must be at least ${PASSWORD_POLICY.minLength} characters.`,
  passwordMismatch: "New password and confirm password do not match.",
  revokeOtherSessionsLabel: "Sign out other active sessions",
  submit: "Update password",
  submitLoading: "Updating...",
  backToDashboard: "Back to dashboard",
  toast: {
    success: "Password updated successfully.",
    failure: "Could not update password",
  },
} as const;

