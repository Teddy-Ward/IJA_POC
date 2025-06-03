console.log("[multi-journey-configs.js] Loading configurations...");

window.ALL_JOURNEY_CONFIGS = {
  ClientSite_LenderX_FTB: {
    apiKey: "SITE_OWNER_UNIQUE_API_KEY_123", // This would be consistent for a given website owner
    journeyId: "ClientSite_LenderX_FTB",
    lenderName: "LenderX",
    journeyType: "FirstTimeBuyerAssist",
    chatbotHeaderTitle: "LenderX First-Time Buyer Guide",
    initialGreeting:
      "Welcome to your LenderX First-Time Buyer application! I'm here to help you every step of the way. Focus on a field for guidance.",
    globalSettings: {
      // These settings are used by intelliguide-embed.js
      widgetThemeColor: "#007bff",
      widgetHeaderText: "LenderX FTB Helper",
      enableGeneralPageQuestions: true,
      widgetPosition: "bottom-right",
      defaultKnowledgeBaseKeys: ["LenderX_FTB_GeneralFAQ"],
    },
    contextualRules: [
      {
        id: "euFullName",
        triggerType: "focus",
        targetSelector: "#eu_fullName",
        actionType: "displayStaticMessage",
        staticMessage:
          "<strong>Your Full Name (LenderX):</strong> Please enter your full legal name as it appears on your passport or driving licence.",
      },
      {
        id: "euEmail",
        triggerType: "focus",
        targetSelector: "#eu_email",
        actionType: "displayStaticMessage",
        staticMessage:
          "<strong>Your Email (LenderX):</strong> We'll use this for all communications about your LenderX mortgage. Please use your primary email address.",
      },
      {
        id: "euAnnualIncome",
        triggerType: "focus",
        targetSelector: "#eu_annualIncome",
        actionType: "displayStaticMessage",
        staticMessage:
          "<strong>Your Annual Income (£) (LenderX):</strong> Enter your gross (before tax) annual income. If self-employed, refer to our specific guide (simulated ask)!",
      },
      {
        id: "euDepositAmount",
        triggerType: "focus",
        targetSelector: "#eu_depositAmount",
        actionType: "generateLLMResponse", // Example using LLM
        llmPromptInstruction:
          "User is focused on the deposit amount field for a LenderX First Time Buyer application. Briefly explain the importance of the deposit and mention that LenderX has specific minimum requirements.",
        knowledgeBaseKeys: ["LenderX_FTB_DepositInfo"],
      },
      {
        // Example of a hesitation rule
        id: "euDepositHesitation",
        triggerType: "hesitation",
        targetSelector: "#eu_depositAmount",
        hesitationTimeMs: 3000,
        actionType: "displayStaticMessage",
        staticMessage:
          "<strong>Still on Deposit Amount?</strong> Remember, a larger deposit can sometimes lead to better mortgage rates with LenderX.",
      },
    ],
    knowledgeBase: {
      // Snippets for RAG
      LenderX_FTB_DepositInfo:
        "LenderX typically requires a minimum 5% deposit for First Time Buyers on most properties, but this can vary based on the specific mortgage product and property value. A financial advisor can provide precise figures.",
      LenderX_FTB_GeneralFAQ:
        "For general questions about LenderX First Time Buyer mortgages, key things to know are our competitive rates, support for various deposit sources including gifted deposits (subject to criteria), and our dedicated first-time buyer support team.",
    },
  },
  BrokerPortal_CaseView: {
    apiKey: "SITE_OWNER_UNIQUE_API_KEY_123",
    journeyId: "BrokerPortal_CaseView",
    lenderName: "Broker Portal", // Or could be dynamic if broker selects a lender within this view
    journeyType: "CaseManagementAndPolicy",
    chatbotHeaderTitle: "Broker Assist Pro",
    initialGreeting:
      "Welcome Broker! How can I help you with policies, product details, or case notes today?",
    globalSettings: {
      widgetThemeColor: "#28a745",
      widgetHeaderText: "Broker Assist Pro",
      enableGeneralPageQuestions: true,
      widgetPosition: "bottom-left",
      defaultKnowledgeBaseKeys: ["Broker_GeneralPolicySearchTips"],
    },
    contextualRules: [
      {
        id: "brSelectLender",
        triggerType: "change",
        targetSelector: "#br_lenderName",
        actionType: "displayStaticMessage",
        staticMessage:
          "<strong>Lender Selected:</strong> You can now ask specific policy questions for the chosen lender or use the keyword search.",
      },
      {
        id: "brPolicyKeyword",
        triggerType: "focus",
        targetSelector: "#br_policyKeyword",
        actionType: "displayStaticMessage",
        staticMessage:
          "<strong>Policy Keyword:</strong> Enter terms like 'gifted deposit', 'LTV limits for self-employed', or 'stress test rates'.",
      },
      {
        id: "brLenderXFTBCriteriaLink",
        triggerType: "click",
        targetSelector: "[data-help-context='broker_LenderX_FTBCriteria']",
        actionType: "generateLLMResponse",
        llmPromptInstruction:
          "The broker clicked a link for 'LenderX FTB Criteria Summary'. Provide a concise summary of key First Time Buyer criteria for LenderX, including typical LTV, income multiples, and views on gifted deposits.",
        knowledgeBaseKeys: ["LenderX_FTB_CriteriaSummary_Broker"],
      },
      {
        id: "brLenderYRemortgageRatesLink",
        triggerType: "click",
        targetSelector: "[data-help-context='broker_LenderY_RemortgageRates']",
        actionType: "generateLLMResponse",
        llmPromptInstruction:
          "The broker clicked a link for 'LenderY Remortgage Rates'. Provide a brief overview of current LenderY remortgage rate types and any notable features. Advise to check the full rate sheet for specifics.",
        knowledgeBaseKeys: ["LenderY_Remortgage_RateOverview_Broker"],
      },
    ],
    knowledgeBase: {
      LenderX_FTB_CriteriaSummary_Broker:
        "LenderX FTB Key Criteria: Max LTV typically 90-95% (product dependent). Income multiples around 4.5x, potentially higher with good credit. Gifted deposits accepted from close family with appropriate documentation. Always verify latest criteria sheet.",
      LenderY_Remortgage_RateOverview_Broker:
        "LenderY Remortgage Rates: Offer a range of Fixed, Tracker, and Discounted rates. Features often include options for no early repayment charges on some products, and cashback incentives. Check current rate sheet for specific product codes and up-to-date figures.",
      Broker_GeneralPolicySearchTips:
        "When searching for policies, use precise keywords. You can ask me directly about a specific lender's criteria, for example: 'What is LenderZ's maximum LTV for new builds?'",
    },
  },
  // Add more journey configurations as needed
};

console.log(
  "[multi-journey-configs.js] ALL_JOURNEY_CONFIGS defined on window.",
  window.ALL_JOURNEY_CONFIGS
);
