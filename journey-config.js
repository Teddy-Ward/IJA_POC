const journeySpecificConfig = {
    lenderName: "Future Finance UK",
    journeyType: "FirstTimeBuyerAssist",
    chatbotHeaderTitle: "First-Time Buyer Helper",
    initialGreeting: "Welcome! Buying your first home is exciting. I'm here to guide you through the application. Focus on any field for help.",
    hesitationTimeMs: 1200, // Slightly different hesitation time
    helpMessages: {
        "fullNameHelp": "<strong>Full Name (First-Time Buyer):</strong> Please enter your full legal name. This should match your identification, like your passport or driving licence.",
        "emailHelp": "<strong>Your Email:</strong> We'll send important updates and documents here. Please use an email address you check often.",
        "annualIncomeHelp": "<strong>Annual Income (£):</strong> Enter your total yearly income before tax. If you have questions about what to include, just ask (simulated ask)!",
        "loanAmountHelp": "<strong>Loan Amount Needed (£):</strong> How much do you need to borrow for your new home? This is the mortgage amount you're applying for.",
        // Adding a new help message specific to this journey
        "depositAmountHelp": "<strong>Deposit Amount (£):</strong> Please enter the total amount you have saved for your deposit. This is a key part of your first home purchase!",
        // Example of a hesitation-specific message
        "loanAmountHelp_hesitated": "<strong>Thinking about the Loan Amount?</strong> It's a big decision! Make sure it aligns with the property price and your deposit. Our advisors can help you work this out."
    },
    rules: {
        "loanAmountHelp": {
            minLoan: 50000,
            maxLoan: 600000,
            messageSuffix_aboveMax: "For loans over £600,000 as a first-time buyer, specific criteria apply. We recommend speaking to an advisor.",
            messageSuffix_belowMin: "Our minimum loan for first-time buyers is £50,000. If you need less, please discuss with our team."
        },
        "depositAmountHelp": { // Rules for the new field
            minDepositPercentage: 5, // Example rule: minimum 5% deposit
            messageSuffix_general: "A larger deposit can often lead to better mortgage rates."
        }
    }
};

// Make the journey-specific configuration available globally for the IJA script to pick up.
// The ija-chatbot-logic.js script will look for this 'window.pendingIJAConfig'
// when it initializes.
window.pendingIJAConfig = journeySpecificConfig;
