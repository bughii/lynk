import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import Authentication from "../../src/pages/authentication";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

const mockLogin = vi.fn();
const mockSignup = vi.fn();
const mockGetState = vi.fn();

const mockUseAuthStore = {
  user: null,
  login: mockLogin,
  signup: mockSignup,
  setState: vi.fn(),
};

// Mock the translation hook
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) =>
      ({
        "auth.login": "Login",
        "auth.signup": "Signup",
        "auth.confirmPassword": "Confirm Password",
        "auth.errors.emailRequired": "Email is required",
        "auth.errors.passwordRequired": "Password is required",
        "auth.errors.usernameRequired": "Username is required",
        "auth.errors.passwordMismatch": "Passwords do not match",
        "auth.errors.loginError": "Login failed",
        "auth.errors.registrationError": "Registration failed",
        "auth.enterCredentials": "Enter your credentials",
        "auth.forgotPassword": "Forgot Password?",
        "auth.errors.emailInUse": "Email is already in use",
        "auth.errors.usernameInUse": "Username is already in use",
      }[key] || key),
    i18n: {
      changeLanguage: vi.fn().mockResolvedValue({}),
      language: "en",
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },

  i18n: {
    changeLanguage: vi.fn().mockResolvedValue({}),
    language: "en",
    exists: vi.fn(),
    t: vi.fn((key) => key),
    use: vi.fn().mockReturnThis(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: vi.fn(() => mockUseAuthStore),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  ...vi.importActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }) => <>{children}</>,
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

describe("Authentication Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations for each test
    mockLogin.mockReset();
    mockSignup.mockReset();
    mockGetState.mockReset();
    mockGetState.mockImplementation(() => ({ user: { profileSetup: true } }));
  });
  it("renders login and signup tabs with correct labels", () => {
    render(
      <MemoryRouter>
        <Authentication />
      </MemoryRouter>
    );

    // Locating the tabs
    const loginTab = screen.getByRole("tab", { name: "Login tab" });
    const signupTab = screen.getByRole("tab", { name: "Signup tab" });

    // Checks if the tabs are present in the document
    expect(loginTab).toBeInTheDocument();
    expect(signupTab).toBeInTheDocument();

    // Check the translated content
    expect(loginTab).toHaveTextContent("Login");
    expect(signupTab).toHaveTextContent("Signup");
  });

  it("renders login form by default", () => {
    render(
      <MemoryRouter>
        <Authentication />
      </MemoryRouter>
    );

    // Verify the login form inputs are present
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("switches to signup tab and renders signup form", async () => {
    render(
      <MemoryRouter>
        <Authentication />
      </MemoryRouter>
    );

    // Find and click the signup tab
    const signupTab = screen.getByRole("tab", { name: "Signup tab" });
    await userEvent.click(signupTab);

    // Verify the signup form inputs are visible
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Signup" })).toBeInTheDocument();
  });
});

describe("Login form validation", () => {
  it("shows error when submitting empty email", async () => {
    render(
      <MemoryRouter>
        <Authentication />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(toast.error).toHaveBeenCalledWith("Email is required");
  });

  it("shows error when submitting empty password", async () => {
    render(
      <MemoryRouter>
        <Authentication />
      </MemoryRouter>
    );

    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(toast.error).toHaveBeenCalledWith("Password is required");
  });

  it("handles successful login", async () => {
    mockLogin.mockResolvedValueOnce({ success: true });

    render(
      <MemoryRouter>
        <Authentication />
      </MemoryRouter>
    );

    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
  });

  it("handles login error with custom message", async () => {
    const errorMessage = "Custom error message";
    mockLogin.mockRejectedValueOnce({ message: errorMessage });

    render(
      <MemoryRouter>
        <Authentication />
      </MemoryRouter>
    );

    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it("handles login error with fallback message", async () => {
    mockLogin.mockRejectedValueOnce(new Error());

    render(
      <MemoryRouter>
        <Authentication />
      </MemoryRouter>
    );

    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Login failed");
    });
  });
});

describe("Signup Form Validation", () => {
  beforeEach(async () => {
    render(
      <MemoryRouter>
        <Authentication />
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole("tab", { name: "Signup tab" }));
  });

  it("shows error when submitting empty email", async () => {
    await userEvent.click(screen.getByRole("button", { name: "Signup" }));

    expect(toast.error).toHaveBeenCalledWith("Email is required");
  });

  it("shows error when submitting empty username", async () => {
    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );
    await userEvent.click(screen.getByRole("button", { name: "Signup" }));

    expect(toast.error).toHaveBeenCalledWith("Username is required");
  });

  it("shows error when passwords don't match", async () => {
    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );
    await userEvent.type(screen.getByPlaceholderText("Username"), "testuser");
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Confirm Password"),
      "password456"
    );
    await userEvent.click(screen.getByRole("button", { name: "Signup" }));

    expect(toast.error).toHaveBeenCalledWith("Passwords do not match");
  });

  it("handles successful signup", async () => {
    mockSignup.mockResolvedValueOnce({ success: true });

    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );
    await userEvent.type(screen.getByPlaceholderText("Username"), "testuser");
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Confirm Password"),
      "password123"
    );
    await userEvent.click(screen.getByRole("button", { name: "Signup" }));

    expect(mockSignup).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
      "testuser"
    );
  });

  it("handles email already in use error", async () => {
    mockSignup.mockRejectedValueOnce({ errorType: "email_in_use" });

    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );
    await userEvent.type(screen.getByPlaceholderText("Username"), "testuser");
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Confirm Password"),
      "password123"
    );
    await userEvent.click(screen.getByRole("button", { name: "Signup" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email is already in use");
    });
  });

  it("handles username already in use error", async () => {
    mockSignup.mockRejectedValueOnce({
      errorType: "username_in_use",
    });

    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );
    await userEvent.type(screen.getByPlaceholderText("Username"), "testuser");
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Confirm Password"),
      "password123"
    );
    await userEvent.click(screen.getByRole("button", { name: "Signup" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Username is already in use");
    });
  });

  it("handles signup error with fallback message", async () => {
    mockSignup.mockRejectedValueOnce(new Error());

    await userEvent.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );
    await userEvent.type(screen.getByPlaceholderText("Username"), "testuser");
    await userEvent.type(
      screen.getByPlaceholderText("Password"),
      "password123"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Confirm Password"),
      "password123"
    );
    await userEvent.click(screen.getByRole("button", { name: "Signup" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Registration failed");
    });
  });
});
