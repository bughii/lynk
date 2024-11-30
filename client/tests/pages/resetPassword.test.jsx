import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";
import ResetPasswordPage from "@/pages/reset-password";
import { useAuthStore } from "@/store/authStore";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// Mock dependencies
vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useParams: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));
vi.mock("@/store/authStore", () => ({
  useAuthStore: vi.fn(),
}));

describe("ResetPasswordPage", () => {
  const navigateMock = vi.fn();
  const resetPasswordMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mock calls and state before each test
    useNavigate.mockReturnValue(navigateMock); // Mock useNavigate
    useParams.mockReturnValue({ token: "mock-token" }); // Mock useParams
    useAuthStore.mockReturnValue({ resetPassword: resetPasswordMock }); // Mock store
  });

  it("renders the reset password form correctly", () => {
    render(<ResetPasswordPage />);

    // Check for inputs and button
    expect(
      screen.getByPlaceholderText("resetPassword.placeholder1")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("resetPassword.placeholder2")
    ).toBeInTheDocument();
    expect(screen.getByText("resetPassword.resetButton")).toBeInTheDocument();
  });

  it("shows an error toast when passwords do not match", async () => {
    render(<ResetPasswordPage />);

    fireEvent.change(
      screen.getByPlaceholderText("resetPassword.placeholder1"),
      {
        target: { value: "Password123" },
      }
    );
    fireEvent.change(
      screen.getByPlaceholderText("resetPassword.placeholder2"),
      {
        target: { value: "Password456" },
      }
    );

    fireEvent.click(screen.getByText("resetPassword.resetButton"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("resetPassword.passwordMismatch")
    );
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it("calls resetPassword and shows success message on valid input", async () => {
    resetPasswordMock.mockResolvedValueOnce();

    render(<ResetPasswordPage />);

    fireEvent.change(
      screen.getByPlaceholderText("resetPassword.placeholder1"),
      {
        target: { value: "Password123" },
      }
    );
    fireEvent.change(
      screen.getByPlaceholderText("resetPassword.placeholder2"),
      {
        target: { value: "Password123" },
      }
    );

    fireEvent.click(screen.getByText("resetPassword.resetButton"));

    // Wait for the async function to complete
    await waitFor(() =>
      expect(resetPasswordMock).toHaveBeenCalledWith(
        "mock-token",
        "Password123"
      )
    );

    expect(toast.success).toHaveBeenCalledWith(
      "resetPassword.passwordResetSuccess"
    );
    await waitFor(
      () => {
        expect(navigateMock).toHaveBeenCalledWith("/auth");
      },
      { timeout: 3100 }
    ); // Slightly more than the setTimeout delay
  });

  it("shows an error message on API failure", async () => {
    resetPasswordMock.mockRejectedValueOnce(new Error("API Error"));

    render(<ResetPasswordPage />);

    fireEvent.change(
      screen.getByPlaceholderText("resetPassword.placeholder1"),
      {
        target: { value: "Password123" },
      }
    );
    fireEvent.change(
      screen.getByPlaceholderText("resetPassword.placeholder2"),
      {
        target: { value: "Password123" },
      }
    );

    fireEvent.click(screen.getByText("resetPassword.resetButton"));

    // Wait for the async function to complete
    await waitFor(() =>
      expect(resetPasswordMock).toHaveBeenCalledWith(
        "mock-token",
        "Password123"
      )
    );

    expect(toast.error).toHaveBeenCalledWith(
      "resetPassword.passwordResetError"
    );
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("displays success message when the form is submitted", async () => {
    resetPasswordMock.mockResolvedValueOnce();

    render(<ResetPasswordPage />);

    fireEvent.change(
      screen.getByPlaceholderText("resetPassword.placeholder1"),
      {
        target: { value: "Password123" },
      }
    );
    fireEvent.change(
      screen.getByPlaceholderText("resetPassword.placeholder2"),
      {
        target: { value: "Password123" },
      }
    );

    fireEvent.click(screen.getByText("resetPassword.resetButton"));

    await waitFor(() => {
      expect(
        screen.getByText("resetPassword.resetSuccessText")
      ).toBeInTheDocument();
    });
  });
});
