export const APP_COPY = {
  appTitle: "Better Auth Demo",
} as const;

export const LOGIN_COPY = {
  title: "Log in",
  description: "Use your email and password.",
  emailLabel: "Email",
  passwordLabel: "Password",
  emailPlaceholder: "you@example.com",
  passwordPlaceholder: "••••••••",
  submit: "Log in",
  submitLoading: "Logging in...",
  noAccountPrefix: "Don’t have an account?",
  noAccountLink: "Sign up",
  toast: {
    fallbackInvalidCredentials: "Invalid email or password",
    success: "Logged in.",
    failure: "Login failed",
  },
} as const;

export const SIGNUP_COPY = {
  title: "Sign up",
  description: "Create an account with email and password.",
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
  },
} as const;

export const DASHBOARD_COPY = {
  title: "Dashboard",
  description: "Minimal authenticated page.",
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

