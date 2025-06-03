(function () {
  const IntelliGuideAI = {
    config: null, // This will store the full journey-specific configuration
    widget: null,
    messageArea: null,
    apiKey: null,
    backendApiUrl: "https://YOUR_API_GATEWAY_ENDPOINT/prod/ija", // Note: This should be replaced with your actual API Gateway endpoint

    init: function (apiKey, journeyConfig) {
      this.apiKey = apiKey;
      console.log(
        "[IntelliGuideAI] Initializing/Re-initializing with API Key:",
        this.apiKey
      );

      if (
        journeyConfig &&
        typeof journeyConfig === "object" &&
        Object.keys(journeyConfig).length > 0
      ) {
        this.config = journeyConfig; // Store the provided journey-specific configuration
        console.log(
          "[IntelliGuideAI] Loaded config for journey:",
          this.config.journeyType || this.config.journeyId || "Unknown Journey",
          this.config
        );
      } else {
        console.error(
          "[IntelliGuideAI] No valid journeyConfig provided to init! Using fallback error config."
        );
        this.config = {
          // Fallback error configuration
          apiKey: apiKey,
          globalSettings: {
            widgetThemeColor: "#d9534f",
            widgetHeaderText: "Assistant Error",
            enableGeneralPageQuestions: false,
          },
          initialGreeting: "Configuration error. Assistant unavailable.",
          contextualRules: [],
          journeyType: "ErrorState",
          journeyId: "ErrorState",
        };
      }

      // If widget already exists from a previous init (e.g., journey switch), remove it to re-render cleanly
      const existingWidget = document.getElementById("intelliguide-widget");
      if (existingWidget) {
        existingWidget.remove();
        this.widget = null;
        this.messageArea = null;
      }

      this.createWidget(); // Create and append the widget UI using the new this.config
      this.applyGlobalSettings(); // Apply theme, header from new this.config
      this.setupTriggers(); // Setup triggers based on new this.config
    },

    createWidget: function () {
      if (!this.config) {
        console.error("[IntelliGuideAI] Cannot create widget: config not set.");
        return;
      }

      this.widget = document.createElement("div");
      this.widget.id = "intelliguide-widget";
      this.widget.style.position = "fixed";
      this.widget.style.bottom = "20px";
      this.widget.style.right = "20px";
      this.widget.style.width = "300px";
      this.widget.style.maxHeight = "400px";
      this.widget.style.backgroundColor = "white";
      this.widget.style.border = "1px solid #ccc";
      this.widget.style.borderRadius = "8px";
      this.widget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      this.widget.style.display = "flex";
      this.widget.style.flexDirection = "column";
      this.widget.style.zIndex = "9999";
      this.widget.style.overflow = "hidden";

      const header = document.createElement("div");
      header.id = "intelliguide-header";
      header.style.padding = "10px 15px";
      header.style.fontWeight = "bold";
      header.style.color = "white";
      header.style.textAlign = "center";
      header.style.cursor = "pointer";
      header.style.fontSize = "15px";

      this.messageArea = document.createElement("div");
      this.messageArea.id = "intelliguide-messages";
      this.messageArea.style.flexGrow = "1";
      this.messageArea.style.padding = "10px";
      this.messageArea.style.overflowY = "auto";
      this.messageArea.style.backgroundColor = "#f9f9f9";
      this.messageArea.style.display = "flex";
      this.messageArea.style.flexDirection = "column";

      const inputArea = document.createElement("div");
      inputArea.id = "intelliguide-input-area";
      inputArea.style.padding = "10px";
      inputArea.style.borderTop = "1px solid #eee";

      const inputField = document.createElement("input");
      inputField.type = "text";
      inputField.placeholder = "Ask a question...";
      inputField.id = "intelliguide-input";
      inputField.style.width = "calc(100% - 20px)";
      inputField.style.padding = "8px 10px";
      inputField.style.border = "1px solid #ccc";
      inputField.style.borderRadius = "16px";
      inputField.style.fontSize = "14px";

      inputField.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && inputField.value.trim() !== "") {
          this.handleUserQuery(inputField.value.trim());
          inputField.value = "";
        }
      });

      inputArea.appendChild(inputField);
      this.widget.appendChild(header);
      this.widget.appendChild(this.messageArea);
      this.widget.appendChild(inputArea);
      document.body.appendChild(this.widget);

      this.messageArea.innerHTML = ""; // Clear messages before adding new initial greeting
      const initialGreeting =
        this.config.initialGreeting ||
        (this.config.globalSettings &&
          this.config.globalSettings.initialGreeting) ||
        "Welcome! How can I assist you?";
      this.displayMessageInWidget(initialGreeting, false, true);

      let isMinimized = false;
      header.onclick = () => {
        isMinimized = !isMinimized;
        this.messageArea.style.display = isMinimized ? "none" : "flex";
        inputArea.style.display = isMinimized ? "none" : "block";
        this.widget.style.maxHeight = isMinimized
          ? header.offsetHeight + "px"
          : "400px";
        if (!isMinimized && this.messageArea.children.length === 0) {
          const greeting =
            this.config.initialGreeting ||
            (this.config.globalSettings &&
              this.config.globalSettings.initialGreeting) ||
            "Welcome! How can I assist you?";
          this.displayMessageInWidget(greeting, false, true);
        }
      };
    },

    applyGlobalSettings: function () {
      if (!this.widget || !this.config || !this.config.globalSettings) {
        return;
      }
      const header = this.widget.querySelector("#intelliguide-header");
      if (header) {
        header.style.backgroundColor =
          this.config.globalSettings.widgetThemeColor || "#007bff";
        header.textContent =
          this.config.globalSettings.widgetHeaderText ||
          this.config.chatbotHeaderTitle ||
          "IntelliGuide AI";
      }

      const inputArea = this.widget.querySelector("#intelliguide-input-area");
      if (inputArea) {
        inputArea.style.display = this.config.globalSettings
          .enableGeneralPageQuestions
          ? "block"
          : "none";
      }

      const position =
        this.config.globalSettings.widgetPosition || "bottom-right";
      this.widget.style.bottom = "auto";
      this.widget.style.top = "auto";
      this.widget.style.left = "auto";
      this.widget.style.right = "auto";

      if (position === "bottom-right") {
        this.widget.style.bottom = "20px";
        this.widget.style.right = "20px";
      } else if (position === "bottom-left") {
        this.widget.style.bottom = "20px";
        this.widget.style.left = "20px";
      }
    },

    setupTriggers: function () {
      if (!this.config || !this.config.contextualRules) return;

      this.config.contextualRules.forEach((rule) => {
        try {
          const elements = document.querySelectorAll(rule.targetSelector);
          if (elements.length > 0) {
            elements.forEach((element) => {
              // Simple way to avoid duplicate listeners for MVP if re-init happens on same elements
              // A more robust solution would involve explicitly removing old listeners by name or reference.
              if (
                element._intelliguideRuleAttached &&
                element._intelliguideRuleAttached[rule.id + rule.triggerType]
              ) {
                return;
              }
              if (!element._intelliguideRuleAttached) {
                element._intelliguideRuleAttached = {};
              }

              let hesitationTimer = null;
              const triggerHandler = () => this.handleTrigger(rule, element);

              if (rule.triggerType === "hesitation") {
                const focusHandler = () => {
                  clearTimeout(hesitationTimer);
                  hesitationTimer = setTimeout(() => {
                    if (document.activeElement === element) {
                      this.handleTrigger(rule, element);
                    }
                  }, rule.hesitationTimeMs || 2000);
                };
                const blurHandler = () => {
                  clearTimeout(hesitationTimer);
                };
                element.addEventListener("focus", focusHandler);
                element.addEventListener("blur", blurHandler);
                // Storing for potential later removal (not fully implemented for MVP)
                // element._intelliguideListeners = { focus: focusHandler, blur: blurHandler };
              } else {
                element.addEventListener(rule.triggerType, triggerHandler);
                // element._intelliguideListeners = { [rule.triggerType]: triggerHandler };
              }
              element._intelliguideRuleAttached[
                rule.id + rule.triggerType
              ] = true;
            });
          }
        } catch (e) {
          console.error(
            `[IntelliGuideAI] Error setting up trigger for selector ${rule.targetSelector}:`,
            e
          );
        }
      });
    },

    handleTrigger: async function (rule, targetElement) {
      console.log(
        "[IntelliGuideAI] Triggered rule:",
        rule.id,
        "on element:",
        targetElement
      );
      this.displayMessageInWidget("Thinking...", true);

      if (rule.actionType === "displayStaticMessage" && rule.staticMessage) {
        this.displayMessageInWidget(rule.staticMessage);
      } else if (
        rule.actionType === "generateLLMResponse" &&
        rule.llmPromptInstruction
      ) {
        const payload = {
          apiKey: this.apiKey,
          promptInstruction: rule.llmPromptInstruction,
          journeyId: this.config.journeyId,
          context: {
            pageUrl: window.location.href,
            elementSelector: rule.targetSelector,
            elementTextContent: targetElement.textContent
              ? targetElement.textContent.trim().substring(0, 200)
              : "",
          },
          knowledgeBaseKeys: rule.knowledgeBaseKeys || [],
        };
        this.callBackendApi(payload);
      }
    },

    handleUserQuery: async function (query) {
      this.displayMessageInWidget(
        `You: ${this.sanitizeText(query)}`,
        false,
        false,
        true
      );
      this.displayMessageInWidget("Thinking...", true);

      const payload = {
        apiKey: this.apiKey,
        userQuery: query,
        journeyId: this.config.journeyId,
        context: {
          pageUrl: window.location.href,
          pageTitle: document.title,
        },
        knowledgeBaseKeys:
          this.config &&
          this.config.globalSettings &&
          this.config.globalSettings.defaultKnowledgeBaseKeys
            ? this.config.globalSettings.defaultKnowledgeBaseKeys
            : [],
      };
      this.callBackendApi(payload);
    },

    callBackendApi: async function (payload) {
      try {
        console.log("[IntelliGuideAI] Calling Backend with payload:", payload);
        // SIMULATED RESPONSE FOR MVP
        let simulatedAnswer =
          "This is a simulated LLM response based on your query/context.";
        let specificAnswerFound = false;

        if (payload.promptInstruction) {
          const instructionLower = payload.promptInstruction.toLowerCase();
          if (instructionLower.includes("payment section")) {
            simulatedAnswer =
              "Our payment section is secure. We accept Visa, Mastercard, and PayPal for your convenience!";
            specificAnswerFound = true;
          } else if (
            instructionLower.includes("shipping policy") ||
            (payload.knowledgeBaseKeys &&
              payload.knowledgeBaseKeys.includes("shippingPolicySummary"))
          ) {
            simulatedAnswer =
              this.config.knowledgeBase &&
              this.config.knowledgeBase.shippingPolicySummary
                ? this.config.knowledgeBase.shippingPolicySummary
                : simulatedAnswer;
            specificAnswerFound = true;
          } else if (
            instructionLower.includes("ftb criteria summary") ||
            (payload.knowledgeBaseKeys &&
              payload.knowledgeBaseKeys.includes(
                "LenderX_FTB_CriteriaSummary_Broker"
              ))
          ) {
            simulatedAnswer =
              this.config.knowledgeBase &&
              this.config.knowledgeBase.LenderX_FTB_CriteriaSummary_Broker
                ? this.config.knowledgeBase.LenderX_FTB_CriteriaSummary_Broker
                : simulatedAnswer;
            specificAnswerFound = true;
          } else if (
            instructionLower.includes("remortgage rates") ||
            (payload.knowledgeBaseKeys &&
              payload.knowledgeBaseKeys.includes(
                "LenderY_Remortgage_RateOverview_Broker"
              ))
          ) {
            simulatedAnswer =
              this.config.knowledgeBase &&
              this.config.knowledgeBase.LenderY_Remortgage_RateOverview_Broker
                ? this.config.knowledgeBase
                    .LenderY_Remortgage_RateOverview_Broker
                : simulatedAnswer;
            specificAnswerFound = true;
          } else if (
            instructionLower.includes("deposit amount field") ||
            (payload.knowledgeBaseKeys &&
              payload.knowledgeBaseKeys.includes("LenderX_FTB_DepositInfo"))
          ) {
            simulatedAnswer =
              this.config.knowledgeBase &&
              this.config.knowledgeBase.LenderX_FTB_DepositInfo
                ? this.config.knowledgeBase.LenderX_FTB_DepositInfo
                : simulatedAnswer;
            specificAnswerFound = true;
          }
        }

        if (
          !specificAnswerFound &&
          payload.userQuery &&
          this.config &&
          this.config.knowledgeBase
        ) {
          if (payload.userQuery.toLowerCase().includes("return")) {
            simulatedAnswer =
              this.config.knowledgeBase.returnPolicyBrief || simulatedAnswer;
          } else if (payload.userQuery.toLowerCase().includes("shipping")) {
            simulatedAnswer =
              this.config.knowledgeBase.shippingPolicySummary ||
              simulatedAnswer;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
        this.displayMessageInWidget(simulatedAnswer);
      } catch (error) {
        console.error("[IntelliGuideAI] Error calling backend API:", error);
        this.displayMessageInWidget(
          `Sorry, an error occurred: ${this.sanitizeText(error.message)}`,
          true
        );
      }
    },

    displayMessageInWidget: function (
      htmlOrText,
      isThinking = false,
      isInitial = false,
      isUserMessage = false
    ) {
      if (!this.messageArea) {
        if (!document.getElementById("intelliguide-widget"))
          this.createWidget();
        if (!this.messageArea) {
          console.error("[IntelliGuideAI] Message area not found.");
          return;
        }
      }
      if (isInitial) this.messageArea.innerHTML = "";
      else if (!isThinking) {
        const thinkingMsg = this.messageArea.querySelector(
          ".intelliguide-thinking"
        );
        if (thinkingMsg) thinkingMsg.remove();
      }
      const initialMsgElement = this.messageArea.querySelector(
        ".intelliguide-initial-message"
      );
      if (initialMsgElement && !isInitial) initialMsgElement.remove();

      const messageElement = document.createElement("div");
      messageElement.style.padding = "8px 12px";
      messageElement.style.borderRadius = "18px";
      messageElement.style.marginBottom = "8px";
      messageElement.style.maxWidth = "90%";
      messageElement.style.wordWrap = "break-word";
      messageElement.style.lineHeight = "1.4";
      messageElement.style.fontSize = "14px";

      if (isUserMessage) {
        messageElement.style.backgroundColor = "#f0f0f0";
        messageElement.style.color = "#333";
        messageElement.style.alignSelf = "flex-end";
        messageElement.style.borderBottomRightRadius = "4px";
        messageElement.textContent = htmlOrText;
      } else {
        messageElement.style.backgroundColor = isThinking
          ? "#e9ebee"
          : isInitial
          ? "transparent"
          : "#e7f3ff";
        messageElement.style.color = isThinking
          ? "#606770"
          : isInitial
          ? "#606770"
          : "#052c65";
        messageElement.style.alignSelf = "flex-start";
        messageElement.style.borderBottomLeftRadius = "4px";

        if (isThinking) {
          messageElement.classList.add("intelliguide-thinking");
          messageElement.textContent = htmlOrText;
        } else if (isInitial) {
          messageElement.classList.add("intelliguide-initial-message");
          messageElement.style.textAlign = "center";
          messageElement.style.width = "100%";
          messageElement.style.maxWidth = "100%";
          messageElement.textContent = htmlOrText;
        } else {
          messageElement.innerHTML = this.sanitizeHTML(htmlOrText);
        }
      }
      this.messageArea.appendChild(messageElement);
      this.messageArea.scrollTop = this.messageArea.scrollHeight;
    },

    displayErrorState: function (message) {
      if (!this.widget && !document.getElementById("intelliguide-widget"))
        this.createWidget();
      if (this.messageArea) {
        this.messageArea.innerHTML = `<div class="ija-message bot" style="background-color: #ffebee; color: #c62828; text-align:center;">${this.sanitizeText(
          message
        )}</div>`;
      }
    },
    sanitizeText: function (str) {
      const temp = document.createElement("div");
      temp.textContent = str;
      return temp.innerHTML;
    },
    sanitizeHTML: function (str) {
      return str;
    }, // Basic for MVP
  };

  window.IntelliGuideAI = IntelliGuideAI;
})();
