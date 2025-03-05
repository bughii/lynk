import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";
import ChatPageContainer from "@/pages/chat/chat-page-container";
import { MemoryRouter } from "react-router-dom";

// Mock child components
vi.mock("./ChatInfo", () => ({
  default: () => <div data-testid="chat-info">Chat Info</div>,
}));

vi.mock("./MessageContainer", () => ({
  default: () => <div data-testid="message-container">Message Container</div>,
}));

vi.mock("./MessageBar", () => ({
  default: () => <div data-testid="message-bar">Message Bar</div>,
}));

describe("ChatPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all child components correctly", () => {
    render(
      <MemoryRouter>
        <ChatPageContainer />
      </MemoryRouter>
    );

    // Verify the presence of child components
    expect(screen.getByTestId("chat-info")).toBeInTheDocument();
    expect(screen.getByTestId("message-container")).toBeInTheDocument();
    expect(screen.getByTestId("message-bar")).toBeInTheDocument();
  });

  it("applies the correct layout styles", () => {
    render(
      <MemoryRouter>
        <ChatPageContainer />
      </MemoryRouter>
    );

    const container = screen.getByTestId("chat-info").parentElement;

    // Verify layout classes
    expect(container).toHaveClass("fixed");
    expect(container).toHaveClass("flex");
    expect(container).toHaveClass("flex-col");
    expect(container).toHaveStyle({ backgroundColor: "#1c1d25" });
  });

  it("integrates interactions between components", async () => {
    // Render the full container
    render(
      <MemoryRouter>
        <ChatPageContainer />
      </MemoryRouter>
    );

    // Mock user interaction (example: sending a message)
    const messageBar = screen.getByTestId("message-bar");
    const sendButton = screen.getByRole("button", { name: /send/i }); // Mocked button in MessageBar
    const messageInput = screen.getByPlaceholderText(/type a message/i);

    fireEvent.change(messageInput, { target: { value: "Hello, world!" } });
    fireEvent.click(sendButton);

    // Verify the message appears in MessageContainer
    await waitFor(() =>
      expect(screen.getByText("Hello, world!")).toBeInTheDocument()
    );
  });
});
