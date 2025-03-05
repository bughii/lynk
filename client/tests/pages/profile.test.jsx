import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";
import Profile from "@/pages/profile"; // Assuming Profile is the default export.
import { toast } from "sonner";
import { MemoryRouter } from "react-router-dom";

// Mock dependencies
vi.mock("@/store/authStore", () => ({
  useAuthStore: () => ({
    user: {
      userName: "testuser",
      email: "test@example.com",
      avatar: 1,
      image: "mocked-image-path", // Ensure image is not null
      profileSetup: true,
    },
    updateProfile: vi.fn(async () => ({ status: 200 })),
    updateProfileImage: vi.fn(async () => ({
      status: 200,
      data: { image: "mocked-image-path" }, // Aggiunta immagine nella risposta
    })),
    removeProfileImage: vi.fn(async () => ({ status: 200 })),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        "profileSetup.imageUpdateSuccess": "Image updated successfully",
        "profileSetup.imageDeleteSuccess": "Image deleted successfully",
        "profileSetup.updateSuccess": "Profile updated successfully",
        "profileSetup.save": "Save",
      };
      return translations[key] || key;
    },
  }),
}));

// Selectively mock only useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Profile Component", () => {
  it("renders profile information correctly", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/username/i)).toHaveValue("testuser");
    expect(screen.getByPlaceholderText(/email/i)).toHaveValue(
      "test@example.com"
    );
  });

  it("disables username and email inputs", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const usernameInput = screen.getByPlaceholderText(/username/i);
    const emailInput = screen.getByPlaceholderText(/email/i);

    expect(usernameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
  });

  it("handles avatar selection", () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const avatars = screen.getAllByRole("img", { name: /avatar-\d+/i });
    fireEvent.click(avatars[1]); // Select second avatar

    expect(avatars[1].parentElement).toHaveClass("outline");
  });

  it("handles profile image upload", async () => {
    // Create a mock file
    const mockFile = new File(["dummy content"], "example.png", {
      type: "image/png",
    });

    // Mock FileReader
    const mockFileReader = {
      onload: null,
      readAsDataURL: function () {
        this.result = "mocked-data-url";
        this.onload();
      },
      result: null,
    };
    vi.spyOn(window, "FileReader").mockImplementation(() => mockFileReader);

    // Render the component
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Find the file input
    const fileInput = screen.getByTestId("file-input");

    // Simulate file upload
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Wait for the success toast to be triggered
    await waitFor(() => {
      // Log the actual calls to toast.success to debug
      console.log("toast.success.mock.calls:", toast.success.mock.calls);

      // Use a more flexible assertion
      expect(toast.success).toHaveBeenCalledWith("Image updated successfully");
    });
  });

  it("handles profile image deletion", async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    // Simulate hover to reveal delete button
    const avatarContainer = screen.getByTestId("profile-avatar-container");
    fireEvent.mouseEnter(avatarContainer);

    // Find and click the delete button
    const deleteButton = screen.getByTestId("avatar-action-button");
    fireEvent.click(deleteButton);

    // Wait for the success toast
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Image deleted successfully");
    });
  });

  it("shows avatar action button on hover", () => {
    const { getByTestId } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const avatarContainer = getByTestId("profile-avatar-container");

    fireEvent.mouseEnter(avatarContainer);

    const actionButton = getByTestId("avatar-action-button");
    expect(actionButton).toBeVisible();
  });

  it("shows avatar action button on hover", () => {
    const { getByTestId } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const avatarContainer = getByTestId("profile-avatar-container");

    fireEvent.mouseEnter(avatarContainer);

    const actionButton = getByTestId("avatar-action-button");
    expect(actionButton).toBeVisible();
  });

  it("triggers save changes and navigates on success", async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    );

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Profile updated successfully"
      );
      expect(mockNavigate).toHaveBeenCalledWith("/chat");
    });
  });
});
