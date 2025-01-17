export class ChatBox {
  static instance = null;

  constructor() {
    // Implement singleton pattern
    if (ChatBox.instance) {
      return ChatBox.instance;
    }
    // Only set the instance if we're actually creating a new one
    ChatBox.instance = this;

    this.messages = [];
    this.isVisible = false;
    this.isLoading = false;
    this.boundKeydownHandler = this.handleKeydown.bind(this);
    this.boundOverlayClick = this.hide.bind(this);

    // Check if DOM is ready
    if (document.readyState === "loading") {
      // If DOM is not ready, wait for it
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      // If DOM is ready, initialize immediately
      this.init();
    }
  }

  init() {
    // Ensure we only initialize once
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    this.createElements();
    this.setupEventListeners();
    this.addInitialMessage();

    // Additional initialization check after a short delay
    setTimeout(() => {
      if (!this.overlay || !this.chatbox) {
        this.createElements();
        this.setupEventListeners();
      }
    }, 100);
  }

  createElements() {
    this.overlay = document.createElement("div");
    this.overlay.className = "overlay";
    document.body.appendChild(this.overlay);

    this.chatbox = document.createElement("div");
    this.chatbox.className = "chat-box";

    // Updated header with welcome message and close button
    const header = document.createElement("div");
    header.className = "chat-header";

    const welcomeMessage = document.createElement("div");
    welcomeMessage.className = "welcome-message";
    welcomeMessage.textContent = "Hey, how can I help you?";

    const closeButton = document.createElement("button");
    closeButton.className = "close-button";
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => this.hide());

    header.appendChild(welcomeMessage);
    header.appendChild(closeButton);
    this.chatbox.appendChild(header);

    // Messages container
    this.messagesContainer = document.createElement("div");
    this.messagesContainer.className = "messages";

    // Input container
    const inputContainer = document.createElement("div");
    inputContainer.className = "input-container";

    this.messageInput = document.createElement("input");
    this.messageInput.className = "message-input";
    this.messageInput.placeholder = "Type a message...";

    const sendButton = document.createElement("button");
    sendButton.className = "send-button";
    sendButton.innerHTML = "→";
    sendButton.addEventListener("click", () => this.sendMessage());

    inputContainer.appendChild(this.messageInput);
    inputContainer.appendChild(sendButton);

    this.chatbox.appendChild(this.messagesContainer);
    this.chatbox.appendChild(inputContainer);
    document.body.appendChild(this.chatbox);
  }

  handleKeydown(e) {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this.toggle();
    }
    if (this.isVisible && e.key === "Escape") {
      this.hide();
    }
  }

  setupEventListeners() {
    // Remove any existing listeners before adding new ones
    document.removeEventListener("keydown", this.boundKeydownHandler);
    this.overlay?.removeEventListener("click", this.boundOverlayClick);

    // Add new listeners
    document.addEventListener("keydown", this.boundKeydownHandler);
    this.overlay?.addEventListener("click", this.boundOverlayClick);

    // Add enter key listener for input
    this.messageInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.sendMessage();
      }
    });
  }

  cleanup() {
    // Remove event listeners
    document.removeEventListener("keydown", this.boundKeydownHandler);
    this.overlay?.removeEventListener("click", this.boundOverlayClick);

    // Remove DOM elements
    this.overlay?.remove();
    this.chatbox?.remove();

    // Reset singleton instance
    ChatBox.instance = null;
  }

  addInitialMessage() {
    console.log("ChatBox initialized.");
  }

  setLoading(isLoading) {
    this.isLoading = isLoading;
    if (isLoading) {
      const loadingMessage = {
        id: "loading",
        type: "system",
        content: "Processing your query, please wait...",
        timestamp: new Date(),
      };
      this.messages.push(loadingMessage);
    } else {
      this.messages = this.messages.filter((msg) => msg.id !== "loading");
    }
    this.renderMessages();
  }

  fetchChatHistory(userName, problemTitle) {
    console.log(
      "Fetching history for user:",
      userName,
      "and problem:",
      problemTitle
    );

    if (!userName || !problemTitle) {
      this.messages.push({
        id: Date.now(),
        type: "system",
        content: "Error: Unable to fetch chat history.",
        timestamp: new Date(),
      });
      this.renderMessages();
      return;
    }

    fetch(
      `https://ai-helper-extention.vercel.app/history?user_name=${userName}&problem_title=${problemTitle}`
    )
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch chat history");
        return response.json();
      })
      .then((data) => {
        if (data.status === "success") {
          if (data.conversation.length === 0) {
            console.log("No conversation found. Starting a new chat.");
            this.messages = [];
          } else {
            this.messages = data.conversation.map((msg) => ({
              id: Date.now(),
              type: msg.role === "user" ? "user" : "system",
              content: msg.parts,
              timestamp: new Date(),
            }));
          }
          this.renderMessages();
        } else {
          throw new Error(data.error || "Unknown error occurred");
        }
      })
      .catch((error) => {
        console.error("Error fetching chat history:", error);
        this.messages.push({
          id: Date.now(),
          type: "system",
          content: "Something went wrong. Please try again later.",
          timestamp: new Date(),
        });
        this.renderMessages();
      });
  }

  sendMessage() {
    const content = this.messageInput.value.trim();
    if (!content) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content,
      timestamp: new Date(),
    };
    this.messages.push(userMessage);
    this.messageInput.value = "";

    this.renderMessages();
    this.setLoading(true);

    const userName = localStorage.getItem("az_user_tracking_id");
    if (!userName) {
      this.setLoading(false);
      this.messages.push({
        id: Date.now(),
        type: "system",
        content:
          "Error: User name is missing. Please log in or set your user ID.",
        timestamp: new Date(),
      });
      this.renderMessages();
      return;
    }

    // Fetch intercepted context from background
    chrome.storage.local
      .get("interceptedContext")
      .then((data) => {
        if (!data || !data.interceptedContext) {
          throw new Error(
            "Missing problem context. Please reload and try again."
          );
        }

        const { interceptedContext } = data;
        const { problemTitle, context } = interceptedContext;
        const problemId = context.id;

        // Send a message to the background script to get user code
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              type: "get_user_code",
              response: JSON.stringify({ data: { id: problemId } }),
            },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response?.status === "error") {
                reject(new Error(response.error));
              } else {
                resolve({
                  interceptedContext,
                  userCode: response?.message || null,
                });
              }
            }
          );
        });
      })
      .then(({ interceptedContext, userCode }) => {
        const requestBody = {
          query: content,
          context: {
            ...interceptedContext.context,
            code_written_by_user:
              userCode || interceptedContext.context.code_written_by_user,
          },
          db_data: {
            user_name: userName,
            problem_title: interceptedContext.problemTitle,
          },
        };

        this.queryAI(requestBody);
      })
      .catch((error) => {
        console.error("Error in sendMessage:", error);
        this.setLoading(false);
        this.messages.push({
          id: Date.now(),
          type: "system",
          content:
            error.message || "Something went wrong. Please try again later.",
          timestamp: new Date(),
        });
        this.renderMessages();
      });
  }

  queryAI(requestBody) {
    fetch("https://ai-helper-extention.vercel.app/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        this.setLoading(false);
        if (!response.ok) throw new Error("Server error");
        return response.json();
      })
      .then((data) => {
        if (data.status === "success") {
          const aiMessage = {
            id: Date.now(),
            type: "system",
            content: data.response,
            timestamp: new Date(),
          };
          this.messages.push(aiMessage);
          this.renderMessages();
        } else {
          throw new Error(data.error || "Unknown error occurred");
        }
      })
      .catch((error) => {
        this.setLoading(false);
        this.messages.push({
          id: Date.now(),
          type: "system",
          content: "Something went wrong. Please try again later.",
          timestamp: new Date(),
        });
        this.renderMessages();
      });
  }

  renderMessages() {
    this.messagesContainer.innerHTML = "";

    this.messages.forEach((message) => {
      const messageElement = document.createElement("div");
      messageElement.className = `message ${message.type}`;

      const contentElement = document.createElement("div");
      contentElement.className = "message-content";

      if (message.type === "system") {
        contentElement.innerHTML = message.content;
      } else {
        contentElement.textContent = message.content;
      }

      const timeElement = document.createElement("div");
      timeElement.className = "message-time";
      timeElement.textContent = message.timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      messageElement.appendChild(contentElement);
      messageElement.appendChild(timeElement);
      this.messagesContainer.appendChild(messageElement);
    });

    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  show() {
    if (!this.overlay || !this.chatbox) {
      this.createElements();
      this.setupEventListeners();
    }
    this.isVisible = true;
    this.overlay.classList.add("visible");
    this.chatbox.classList.add("visible");
    this.messageInput.focus();

    const userName = localStorage.getItem("az_user_tracking_id");
    const fetchUserName = () => {
      if (!userName) {
        setTimeout(fetchUserName, 100);
      } else {
        chrome.storage.local.get("interceptedContext", (data) => {
          const { problemTitle } = data.interceptedContext || {};
          if (problemTitle) {
            this.fetchChatHistory(userName, problemTitle);
          }
        });
      }
    };
    fetchUserName();
  }

  hide() {
    this.isVisible = false;
    this.overlay?.classList.remove("visible");
    this.chatbox?.classList.remove("visible");
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}
export function initializeChatBox() {
  // Create the ChatBox instance when the script loads
  const chatBox = new ChatBox();

  // Add it to the window for debugging purposes
  window.chatBox = chatBox;

  return chatBox;
}
