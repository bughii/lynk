import { render, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";
import EmailVerificationPage from "@/pages/email-verification";

// Mock useTranslation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useAuthStore
const mockVerifyEmail = vi.fn();
vi.mock("@/store/authStore", () => ({
  useAuthStore: () => ({
    verifyEmail: mockVerifyEmail,
  }),
}));

describe("EmailVerificationPage", () => {
  it("should render input fields and button", () => {
    const { getAllByRole, getByRole } = render(<EmailVerificationPage />);
    const inputs = getAllByRole("textbox");
    const submitButton = getByRole("button", {
      name: /emailVerification.button/i,
    });

    expect(inputs).toHaveLength(6);
    inputs.forEach((input) => {
      expect(input).toHaveValue("");
    });
    expect(submitButton).toBeDisabled();
  });

  it("should allow inputting a single digit in each field", () => {
    const { getAllByRole } = render(<EmailVerificationPage />);
    const inputs = getAllByRole("textbox");

    fireEvent.change(inputs[0], { target: { value: "1" } });
    fireEvent.change(inputs[1], { target: { value: "2" } });

    expect(inputs[0]).toHaveValue("1");
    expect(inputs[1]).toHaveValue("2");
  });

  it("should automatically focus on the next input field when a digit is entered", () => {
    const { getAllByRole } = render(<EmailVerificationPage />);
    const inputs = getAllByRole("textbox");

    fireEvent.change(inputs[0], { target: { value: "1" } });

    expect(document.activeElement).toBe(inputs[1]);
  });

  it("should automatically focus on the previous input field on backspace when empty", () => {
    const { getAllByRole } = render(<EmailVerificationPage />);
    const inputs = getAllByRole("textbox");

    fireEvent.change(inputs[1], { target: { value: "2" } });
    fireEvent.keyDown(inputs[1], { key: "Backspace" });

    expect(document.activeElement).toStrictEqual(inputs[0]);
  });

  it("should handle pasting multiple digits into the first input and focusing the last filled input", () => {
    const { getAllByRole } = render(<EmailVerificationPage />);
    const inputs = getAllByRole("textbox");

    fireEvent.change(inputs[0], { target: { value: "123456" } });

    inputs.forEach((input, index) => {
      expect(input).toHaveValue((index + 1).toString());
    });
    expect(document.activeElement).toBe(inputs[5]);
  });

  it("should call handleSubmit when all fields are filled", async () => {
    const { getAllByRole } = render(<EmailVerificationPage />);
    const inputs = getAllByRole("textbox");

    inputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: (index + 1).toString() } });
    });

    expect(mockVerifyEmail).toHaveBeenCalledWith("123456");
  });

  it("should disable the submit button if any field is empty", () => {
    const { getAllByRole, getByRole } = render(<EmailVerificationPage />);
    const inputs = getAllByRole("textbox");
    const submitButton = getByRole("button", {
      name: /emailVerification.button/i,
    });

    fireEvent.change(inputs[0], { target: { value: "1" } });
    fireEvent.change(inputs[1], { target: { value: "2" } });

    expect(submitButton).toBeDisabled();
  });

  it("should navigate to /profile and display success toast on successful verification", async () => {
    mockVerifyEmail.mockResolvedValueOnce({ success: true });
    const { getAllByRole } = render(<EmailVerificationPage />);
    const inputs = getAllByRole("textbox");

    inputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: (index + 1).toString() } });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/profile");
    });
  });

  it("should display error toast on failed verification", async () => {
    mockVerifyEmail.mockRejectedValueOnce(new Error("Verification failed"));
    const { getAllByRole } = render(<EmailVerificationPage />);
    const inputs = getAllByRole("textbox");

    inputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: (index + 1).toString() } });
    });

    // Assuming toast.error has been mocked globally to test its call });
  });
});
