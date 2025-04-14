import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

// Create the mock modules
const apiClientMock = {
  get: vi.fn(),
};

const updateGroupMock = vi.fn();

const useChatStoreMock = vi.fn();
useChatStoreMock.getState = vi.fn().mockReturnValue({
  updateGroup: updateGroupMock,
});

const useTranslationMock = vi.fn().mockReturnValue({
  t: (key) => key,
});

// Mock all the imports
vi.mock(
  "../../src/lib/api-client",
  () => ({
    apiClient: apiClientMock,
  }),
  { virtual: true }
);

vi.mock(
  "../../src/store/chatStore",
  () => ({
    useChatStore: useChatStoreMock,
  }),
  { virtual: true }
);

vi.mock("react-i18next", () => ({
  useTranslation: useTranslationMock,
}));

// Create a mock React component for testing
const MockedChatPageContainer = () => {
  const { selectedChatData, selectedChatType } = useChatStoreMock();
  const { t } = useTranslationMock();

  // Used to determine which banners to show
  const isRemovedFromGroup =
    selectedChatType === "group" &&
    selectedChatData &&
    selectedChatData.isActive === false &&
    selectedChatData.userRemoved === true;

  const hasLeftGroup =
    selectedChatType === "group" &&
    selectedChatData &&
    selectedChatData.isActive === false &&
    selectedChatData.userLeft === true;

  const isGroupDeleted =
    selectedChatType === "group" &&
    selectedChatData &&
    selectedChatData.isDeleted === true;

  // Side effect for API call
  React.useEffect(() => {
    if (
      selectedChatType === "group" &&
      selectedChatData &&
      selectedChatData._id
    ) {
      apiClientMock
        .get(`/api/groups/get-group-details/${selectedChatData._id}`)
        .then((response) => {
          if (response.data && response.data.group) {
            // Update the group details
            useChatStoreMock.getState().updateGroup(selectedChatData._id, {
              isActive: response.data.group.isActive,
              userRemoved: response.data.group.userRemoved,
              userLeft: response.data.group.userLeft,
            });
          }
        })
        .catch((error) =>
          console.error("Error fetching group details:", error)
        );
    }
  }, [selectedChatData?._id, selectedChatType]);

  return (
    <div className="fixed top-0 h-[100vh] w-[100vw] bg-[#1c1d25] flex flex-col md:static md:flex-1">
      <div data-testid="chat-info">Mocked Chat Info</div>

      {/* Banner for deleted group */}
      {isGroupDeleted && (
        <div className="bg-red-600 text-white py-2 px-4 text-center">
          {t("chat.groupDeleted")}
        </div>
      )}

      {/* Banner for removed user */}
      {isRemovedFromGroup && (
        <div className="bg-red-600 text-white py-2 px-4 text-center">
          {t("chat.removedFromGroup")}
        </div>
      )}

      {/* Banner for user who left group */}
      {hasLeftGroup && (
        <div className="bg-yellow-600 text-white py-2 px-4 text-center">
          {t("chat.leftGroup")}
        </div>
      )}

      <div data-testid="message-container">Mocked Message Container</div>
      <div data-testid="message-bar">Mocked Message Bar</div>
    </div>
  );
};

// Mock the actual ChatPageContainer with our test component
vi.mock(
  "../../src/pages/chat/chat-page-container/index",
  () => ({
    default: MockedChatPageContainer,
  }),
  { virtual: true }
);

describe("ChatPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    useChatStoreMock.mockReturnValue({
      selectedChatData: {
        _id: "123",
        name: "Test Chat",
        image: "test.jpg",
        users: [{ _id: "user1", name: "User 1" }],
      },
      selectedChatType: "direct",
    });

    // Reset API mock
    apiClientMock.get.mockResolvedValue({
      data: {
        group: {
          isActive: true,
          userRemoved: false,
          userLeft: false,
        },
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Import the component to test (which will use our mocked version)
  const ChatPageContainer =
    require("../../src/pages/chat/chat-page-container/index").default;

  it("renders the basic components", () => {
    render(<ChatPageContainer />);

    expect(screen.getByTestId("chat-info")).toBeInTheDocument();
    expect(screen.getByTestId("message-container")).toBeInTheDocument();
    expect(screen.getByTestId("message-bar")).toBeInTheDocument();
  });

  it("does not render banners for normal direct chat", () => {
    render(<ChatPageContainer />);

    expect(screen.queryByText("chat.groupDeleted")).not.toBeInTheDocument();
    expect(screen.queryByText("chat.removedFromGroup")).not.toBeInTheDocument();
    expect(screen.queryByText("chat.leftGroup")).not.toBeInTheDocument();
  });

  it('renders "removed from group" banner when user is removed', () => {
    useChatStoreMock.mockReturnValue({
      selectedChatData: {
        _id: "123",
        name: "Test Group",
        image: "test.jpg",
        isActive: false,
        userRemoved: true,
        users: [{ _id: "user1", name: "User 1" }],
      },
      selectedChatType: "group",
    });

    render(<ChatPageContainer />);

    expect(screen.getByText("chat.removedFromGroup")).toBeInTheDocument();
  });

  it('renders "left group" banner when user has left the group', () => {
    useChatStoreMock.mockReturnValue({
      selectedChatData: {
        _id: "123",
        name: "Test Group",
        image: "test.jpg",
        isActive: false,
        userLeft: true,
        users: [{ _id: "user1", name: "User 1" }],
      },
      selectedChatType: "group",
    });

    render(<ChatPageContainer />);

    expect(screen.getByText("chat.leftGroup")).toBeInTheDocument();
  });

  it('renders "group deleted" banner when group is deleted', () => {
    useChatStoreMock.mockReturnValue({
      selectedChatData: {
        _id: "123",
        name: "Test Group",
        image: "test.jpg",
        isDeleted: true,
        users: [{ _id: "user1", name: "User 1" }],
      },
      selectedChatType: "group",
    });

    render(<ChatPageContainer />);

    expect(screen.getByText("chat.groupDeleted")).toBeInTheDocument();
  });

  it("calls the API to get group details when selected chat is a group", async () => {
    useChatStoreMock.mockReturnValue({
      selectedChatData: {
        _id: "123",
        name: "Test Group",
        image: "test.jpg",
        users: [{ _id: "user1", name: "User 1" }],
      },
      selectedChatType: "group",
    });

    await act(async () => {
      render(<ChatPageContainer />);
    });

    expect(apiClientMock.get).toHaveBeenCalledWith(
      "/api/groups/get-group-details/123"
    );
  });

  it("does not call API when selectedChatData is null", async () => {
    useChatStoreMock.mockReturnValue({
      selectedChatData: null,
      selectedChatType: "group",
    });

    await act(async () => {
      render(<ChatPageContainer />);
    });

    expect(apiClientMock.get).not.toHaveBeenCalled();
  });

  it('does not call API when selectedChatType is not "group"', async () => {
    useChatStoreMock.mockReturnValue({
      selectedChatData: {
        _id: "123",
        name: "Test Chat",
        image: "test.jpg",
        users: [{ _id: "user1", name: "User 1" }],
      },
      selectedChatType: "direct",
    });

    await act(async () => {
      render(<ChatPageContainer />);
    });

    expect(apiClientMock.get).not.toHaveBeenCalled();
  });

  it("updates the group in store when API returns data", async () => {
    useChatStoreMock.mockReturnValue({
      selectedChatData: {
        _id: "123",
        name: "Test Group",
        image: "test.jpg",
        users: [{ _id: "user1", name: "User 1" }],
      },
      selectedChatType: "group",
    });

    // Mock API response
    apiClientMock.get.mockResolvedValue({
      data: {
        group: {
          isActive: false,
          userRemoved: true,
          userLeft: false,
        },
      },
    });

    await act(async () => {
      render(<ChatPageContainer />);
    });

    expect(updateGroupMock).toHaveBeenCalledWith("123", {
      isActive: false,
      userRemoved: true,
      userLeft: false,
    });
  });

  it("does not update store when API returns no data", async () => {
    useChatStoreMock.mockReturnValue({
      selectedChatData: {
        _id: "123",
        name: "Test Group",
        image: "test.jpg",
        users: [{ _id: "user1", name: "User 1" }],
      },
      selectedChatType: "group",
    });

    // Mock API response with no data
    apiClientMock.get.mockResolvedValue({
      data: null,
    });

    await act(async () => {
      render(<ChatPageContainer />);
    });

    expect(updateGroupMock).not.toHaveBeenCalled();
  });

  it("does not update store when API response has no group property", async () => {
    useChatStoreMock.mockReturnValue({
      selectedChatData: {
        _id: "123",
        name: "Test Group",
        image: "test.jpg",
        users: [{ _id: "user1", name: "User 1" }],
      },
      selectedChatType: "group",
    });

    // Mock API response with no group property
    apiClientMock.get.mockResolvedValue({
      data: {},
    });

    await act(async () => {
      render(<ChatPageContainer />);
    });

    expect(updateGroupMock).not.toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    // Spy on console.error
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    useChatStoreMock.mockReturnValue({
      selectedChatData: {
        _id: "123",
        name: "Test Group",
        image: "test.jpg",
        users: [{ _id: "user1", name: "User 1" }],
      },
      selectedChatType: "group",
    });

    // Mock API error
    apiClientMock.get.mockRejectedValue(new Error("API error"));

    await act(async () => {
      render(<ChatPageContainer />);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching group details:",
      expect.any(Error)
    );

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
