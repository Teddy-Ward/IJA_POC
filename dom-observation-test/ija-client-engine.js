console.log("[ija-client-engine.js] Script parsing started.");

class DomObservationModule {
  constructor(eventCallback) {
    this.eventCallback = eventCallback;
    this.isObserving = false;
    this.config = null;
    this.handleDelegatedEvent = this.handleDelegatedEvent.bind(this);
    this.handleMutation = this.handleMutation.bind(this);
    this.mutationObserver = null;
    this.observedEvents = [
      "focus",
      "blur",
      "click",
      "input",
      "change",
      "submit",
    ];
    // console.log("[DomObservationModule] Constructor called.");
  }

  startObserving(observationConfig = {}) {
    if (this.isObserving) {
      // console.warn('[DomObservationModule] Already observing.');
      return;
    }
    this.config = {
      delegatedEventRoot: observationConfig.delegatedEventRoot || document,
      eventsToWatch: observationConfig.eventsToWatch || this.observedEvents,
      mutationObserverConfig: observationConfig.mutationObserverConfig || {
        attributes: true,
        childList: true,
        subtree: true,
      },
      observeMutationsOn: observationConfig.observeMutationsOn || document.body,
    };
    // console.log('[DomObservationModule] Starting observation with config on event root:',
    //     this.config.delegatedEventRoot ? (this.config.delegatedEventRoot.id || this.config.delegatedEventRoot.tagName || 'document') : 'N/A');

    this.config.eventsToWatch.forEach((eventType) => {
      const useCapture = eventType === "focus" || eventType === "blur";
      this.config.delegatedEventRoot.addEventListener(
        eventType,
        this.handleDelegatedEvent,
        useCapture
      );
    });

    if (window.MutationObserver && this.config.observeMutationsOn) {
      this.mutationObserver = new MutationObserver(this.handleMutation);
      try {
        this.mutationObserver.observe(
          this.config.observeMutationsOn,
          this.config.mutationObserverConfig
        );
      } catch (error) {
        console.error(
          "[DomObservationModule] Failed to start MutationObserver:",
          error
        );
      }
    }
    this.isObserving = true;
  }

  stopObserving() {
    if (!this.isObserving) return;
    if (this.config && this.config.delegatedEventRoot) {
      this.config.eventsToWatch.forEach((eventType) => {
        const useCapture = eventType === "focus" || eventType === "blur";
        this.config.delegatedEventRoot.removeEventListener(
          eventType,
          this.handleDelegatedEvent,
          useCapture
        );
      });
    }
    if (this.mutationObserver) this.mutationObserver.disconnect();
    this.isObserving = false;
    this.config = null;
    console.log("[DomObservationModule] Observation stopped.");
  }

  handleDelegatedEvent(event) {
    if (this.eventCallback) {
      const eventData = {
        type: "domEvent",
        eventType: event.type,
        target: event.target,
        targetAttributes: {
          id: event.target.id,
          className: event.target.className,
          tagName: event.target.tagName,
          type: event.target.type,
          value: event.target.value,
          helpContext: event.target.dataset
            ? event.target.dataset.helpContext
            : null,
        },
        timestamp: Date.now(),
        originalEvent: event,
      };
      this.eventCallback(eventData);
    }
  }

  handleMutation(mutationsList) {
    if (this.eventCallback) {
      const eventData = {
        type: "domMutation",
        mutations: mutationsList,
        timestamp: Date.now(),
      };
      this.eventCallback(eventData);
    }
  }
}
// console.log("[ija-client-engine.js] DomObservationModule class definition parsed.");

class IJAClientEngine {
  constructor(initialEngineConfig = {}) {
    this.config = initialEngineConfig; // This will hold the full journey config
    this.domObserver = null;
    this.isInitialized = false;
    this.lastFocusedHelpContext = null; // To store the context of the last focused field

    this.handleDomObservation = this.handleDomObservation.bind(this);
    console.log(
      "[IJAClientEngine] Constructor called. Initial config:",
      this.config
    );
  }

  init() {
    if (this.isInitialized) {
      console.warn(
        "[IJAClientEngine] Already initialized. Call stop() first to re-initialize."
      );
      return;
    }
    console.log(
      "[IJAClientEngine] Initializing with full journey config:",
      this.config
    );

    if (typeof DomObservationModule === "undefined") {
      console.error(
        "[IJAClientEngine] CRITICAL ERROR: DomObservationModule class is not defined."
      );
      return;
    }

    this.domObserver = new DomObservationModule(this.handleDomObservation);

    const domObserverConfig = {
      delegatedEventRoot: this.config.domObservationSettings
        ?.delegatedEventRootId
        ? document.getElementById(
            this.config.domObservationSettings.delegatedEventRootId
          )
        : document.body,
      eventsToWatch: this.config.domObservationSettings?.eventsToWatch || [
        "focus",
        "blur",
        "click",
        "input",
        "change",
      ],
      mutationObserverConfig: this.config.domObservationSettings
        ?.mutationObserverConfig || {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: [
          "class",
          "style",
          "disabled",
          "data-custom-attr",
          "aria-invalid",
        ],
      },
      observeMutationsOn: this.config.domObservationSettings
        ?.mutationRootElementId
        ? document.getElementById(
            this.config.domObservationSettings.mutationRootElementId
          )
        : document.body,
    };

    // Check if root elements for observation exist
    if (!domObserverConfig.delegatedEventRoot) {
      console.warn(
        `[IJAClientEngine] Delegated event root element for observation not found. Defaulting to document.body.`
      );
      domObserverConfig.delegatedEventRoot = document.body;
    }
    if (!domObserverConfig.observeMutationsOn) {
      console.warn(
        `[IJAClientEngine] Mutation observation root element not found. Defaulting to document.body.`
      );
      domObserverConfig.observeMutationsOn = document.body;
    }

    this.domObserver.startObserving(domObserverConfig);

    if (this.config.setupTestButtons) {
      this.setupTestPageButtonLogic();
    }

    this.isInitialized = true;
    console.log(
      `[IJAClientEngine] Initialized for Journey: ${
        this.config.journeyId || "N/A"
      }, Lender: ${this.config.lenderName || "N/A"}. DOM Observation active.`
    );
    this.displayInitialGreeting();
  }

  displayInitialGreeting() {
    if (this.config.initialGreeting) {
      console.log(
        `[IJAClientEngine] Welcome Message: ${this.config.initialGreeting}`
      );
      // In a real IJA with a UI module, you'd display this in the chatbot window.
      // e.g., this.uiRenderer.addBotMessage(this.config.initialGreeting, true);
    }
  }

  handleDomObservation(eventData) {
    console.groupCollapsed(
      `[IJAClientEngine] Observation Received - Type: ${eventData.type}`
    );
    console.log("Timestamp:", new Date(eventData.timestamp).toISOString());

    if (eventData.type === "domEvent") {
      console.log("Event Type:", eventData.eventType);
      console.log("Target Element:", eventData.target);
      const helpContext = eventData.targetAttributes
        ? eventData.targetAttributes.helpContext
        : null;
      console.log("Target Data Help Context:", helpContext || "N/A");

      if (eventData.eventType === "focus" && helpContext) {
        this.lastFocusedHelpContext = helpContext;
        console.log(
          `[IJAClientEngine] Stored lastFocusedHelpContext: ${this.lastFocusedHelpContext}`
        );
        // Potentially trigger proactive help based on this focus and rules
        // e.g., const action = this.rulesEngine.getHelpForFocus(helpContext, this.config.rules);
        // if(action) this.executeAction(action);
      }

      if (
        eventData.targetAttributes &&
        eventData.targetAttributes.value !== undefined
      ) {
        console.log("Target Value:", eventData.targetAttributes.value);
      }
    } else if (eventData.type === "domMutation") {
      console.log(`Mutation Count: ${eventData.mutations.length}`);
      // Further processing of mutations...
    }
    console.groupEnd();
  }

  // --- This is a SIMULATION of how a user query would be handled ---
  simulateUserQuery(queryText) {
    console.log(`[IJAClientEngine] User asked: "${queryText}"`);
    console.log(
      `[IJAClientEngine] Current focused field context (if any): ${
        this.lastFocusedHelpContext || "None"
      }`
    );
    console.log(
      `[IJAClientEngine] Current journey ID: ${this.config.journeyId || "N/A"}`
    );
    console.log(
      `[IJAClientEngine] Current lender: ${this.config.lenderName || "N/A"}`
    );

    // 1. Construct payload for backend
    const payload = {
      apiKey: this.config.apiKey || "TEST_API_KEY",
      userQuery: queryText,
      pageContext: {
        currentUrl: window.location.href,
        focusedElementHelpContext: this.lastFocusedHelpContext,
        journeyId: this.config.journeyId,
        lenderName: this.config.lenderName,
      },
    };
    console.log("[IJAClientEngine] Would send to backend:", payload);

    // 2. Simulate API call and response (replace with actual fetch in production)
    // this.apiCommunicator.fetchAssistance(payload).then(response => ...);
    console.log(
      "[IJAClientEngine] -> Backend AI Service (Simulated) -> LLM -> Response would be displayed here."
    );
    // For demo, you could show a canned response:
    // this.uiRenderer.addBotMessage(`AI Response for '${queryText}' about '${this.lastFocusedHelpContext || 'this page'}'.`);
  }
  // --- End of user query simulation ---

  setupTestPageButtonLogic() {
    const changeAttributeButton = document.getElementById(
      "changeAttributeButton"
    );
    const nameInput = document.getElementById("nameInput");
    if (changeAttributeButton && nameInput) {
      changeAttributeButton.addEventListener("click", () => {
        const currentAttr = nameInput.getAttribute("data-custom-attr");
        nameInput.setAttribute(
          "data-custom-attr",
          currentAttr === "val1" ? "val2" : "val1"
        );
        nameInput.classList.toggle("highlighted");
        console.log(
          "TEST PAGE ACTION (via Engine): Changed 'data-custom-attr' and class on nameInput."
        );
      });
    } else {
      // console.warn("[IJAClientEngine] Test button 'changeAttributeButton' or 'nameInput' not found for test logic setup.");
    }

    const addRemoveElementButton = document.getElementById(
      "addRemoveElementButton"
    );
    const dynamicArea = document.getElementById("dynamicArea");
    let newElement = null;
    if (addRemoveElementButton && dynamicArea) {
      addRemoveElementButton.addEventListener("click", () => {
        if (newElement && dynamicArea.contains(newElement)) {
          dynamicArea.removeChild(newElement);
          newElement = null;
          console.log(
            "TEST PAGE ACTION (via Engine): Removed dynamic element."
          );
        } else {
          newElement = document.createElement("p");
          newElement.textContent = `Dynamically added element at ${new Date().toLocaleTimeString()} (by Engine)`;
          newElement.style.color = "green";
          dynamicArea.appendChild(newElement);
          console.log("TEST PAGE ACTION (via Engine): Added dynamic element.");
        }
      });
    } else {
      //  console.warn("[IJAClientEngine] Test button 'addRemoveElementButton' or 'dynamicArea' not found for test logic setup.");
    }
  }

  stop() {
    /* ... same as before ... */
    if (!this.isInitialized) {
      console.warn("[IJAClientEngine] Not initialized, nothing to stop.");
      return;
    }
    if (this.domObserver) {
      this.domObserver.stopObserving();
    }
    this.isInitialized = false;
    console.log("[IJAClientEngine] Stopped.");
  }
}
// console.log("[ija-client-engine.js] IJAClientEngine class definition parsed.");

// --- Auto-initialize the engine when this script loads ---
document.addEventListener("DOMContentLoaded", () => {
  console.log(
    "[ija-client-engine.js] DOMContentLoaded event fired. Attempting to auto-initialize IJAClientEngine."
  );

  // SIMULATED: In a real scenario, this config would come from the specific journey (e.g., lender site, broker portal)
  const sampleJourneyConfig = {
    apiKey: "DEMO_API_KEY_123",
    journeyId: "Client_MortgageApp_Step1",
    lenderName: "Demo Bank PLC",
    initialGreeting:
      "Welcome to Demo Bank! I'm your AI assistant for this mortgage application. How can I help you with this page?",
    domObservationSettings: {
      // Specific settings for DomObservationModule
      delegatedEventRootId: "testFormContainer", // ID of element to attach delegated listeners
      mutationRootElementId: "dynamicArea", // ID of element to observe for mutations
      eventsToWatch: ["focus", "blur", "click", "input"], // Only watch these events
      // mutationObserverConfig: { attributes: true, childList: false, subtree: false } // Example override
    },
    setupTestButtons: true, // Tell engine to setup the test button listeners from the HTML
    // In a real config, you'd have helpMessages, rules, llmPrompts, etc.
    helpMessages: {
      nameField:
        "<strong>Full Legal Name:</strong> Please enter your name as it appears on official documents like your passport or driving licence.",
      emailField:
        "<strong>Email Address:</strong> We'll use this for important updates about your application.",
    },
  };

  if (typeof IJAClientEngine !== "undefined") {
    const ijaEngineInstance = new IJAClientEngine(sampleJourneyConfig); // Pass the full config
    ijaEngineInstance.init();
    // Make the instance globally accessible for console testing
    window.myIJAEngine = ijaEngineInstance;
    console.log(
      "[IJAClientEngine] Instance 'myIJAEngine' is now available globally in the console."
    );
  } else {
    console.error(
      "CRITICAL ERROR: IJAClientEngine class not found during auto-initialization!"
    );
  }
});

// console.log("[ija-client-engine.js] Script parsing finished.");
