import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import ForgotPasswordPage from "@/pages/forgot-password";

vi.mock("@/store/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

describe("ForgotPasswordPage", () => {
  let forgotPasswordMock;
  let navigateMock;

  beforeEach(() => {
    forgotPasswordMock = vi.fn();
    useAuthStore.mockReturnValue({ forgotPassword: forgotPasswordMock });
    navigateMock = vi.fn();
    useNavigate.mockReturnValue(navigateMock);
  });
  it("handles valid / invalid email and enables / disables the button accordingly", () => {
    const { getByPlaceholderText, getByText } = render(<ForgotPasswordPage />);
    const emailInput = getByPlaceholderText(
      "forgotPassword.enterEmailPlaceholder"
    );

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    expect(emailInput.value).toBe("test@example.com");
    expect(getByText("forgotPassword.sendLink")).toBeEnabled();

    fireEvent.change(emailInput, { target: { value: "invalidemail" } });
    expect(emailInput.value).toBe("invalidemail");
    expect(getByText("forgotPassword.sendLink")).toBeDisabled();
  });

  it("submits the form successfully", async () => {
    render(<ForgotPasswordPage />);
    const emailInput = screen.getByPlaceholderText(
      "forgotPassword.enterEmailPlaceholder"
    );
    const submitButton = screen.getByText("forgotPassword.sendLink");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    expect(forgotPasswordMock).toHaveBeenCalledWith("test@example.com");
    expect(
      await screen.findByText("forgotPassword.resetText")
    ).toBeInTheDocument();
  });

  it("does not submit form with invalid email", async () => {
    render(<ForgotPasswordPage />);
    const emailInput = screen.getByPlaceholderText(
      "forgotPassword.enterEmailPlaceholder"
    );
    const submitButton = screen.getByText("forgotPassword.sendLink");

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    expect(forgotPasswordMock).not.toHaveBeenCalledWith("invalid-email");
    expect(
      screen.queryByText("forgotPassword.resetText")
    ).not.toBeInTheDocument();
  });

  it("handles navigation correctly", () => {
    render(<ForgotPasswordPage />);
    fireEvent.click(screen.getByTestId("navigate-back"));
    expect(navigateMock).toHaveBeenCalledWith("/auth");
  });
});
