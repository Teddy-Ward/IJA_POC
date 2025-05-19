// --- IJA Chatbot Logic (ija-chatbot-logic.js) ---

// Configuration will be provided by the host page via IJA_Chatbot.init()
let ijaConfig = {}; // Initialize as an empty object, to be populated by init()

const CHATBOT_PLACEHOLDER_ID = 'ija-chatbot-placeholder';

// --- DOM Element Selection ---
let formInputs = null;
let chatMessagesContainer = null;
let initialBotMessageElement = null;
let loanAmountInput = null; // Specific reference for the loan amount field

// --- IJA Chatbot Functions ---
let hesitationTimer = null;
let lastFocusedField = null; // Tracks the contextKey of the last field that received a primary help message

// --- Global IJA Object to expose init function ---
window.IJA_Chatbot = {
    init: function(journeyConfig) {
        if (journeyConfig && typeof journeyConfig === 'object' && Object.keys(journeyConfig).length > 0) {
            ijaConfig = journeyConfig;
        } else {
            console.error("IJA Chatbot: No valid configuration provided during initialization! Using error defaults.");
            ijaConfig = {
                lenderName: "ErrorLender",
                journeyType: "ErrorJourney",
                chatbotHeaderTitle: "Assistant (Config Error)",
                initialGreeting: "Configuration error. Assistance is currently unavailable.",
                hesitationTimeMs: 999999,
                helpMessages: {},
                rules: {}
            };
        }
        // console.log("IJA Config Initialized with:", ijaConfig);
    }
};

function renderChatbotUI() {
    const placeholder = document.getElementById(CHATBOT_PLACEHOLDER_ID);
    if (!placeholder) {
        console.error(`IJA Chatbot: Placeholder element with ID '${CHATBOT_PLACEHOLDER_ID}' not found.`);
        return false;
    }
    placeholder.innerHTML = '';

    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'ija-chatbot-container';

    const header = document.createElement('div');
    header.className = 'ija-chatbot-header';
    header.textContent = `${ijaConfig.chatbotHeaderTitle || 'Assistant'} (${ijaConfig.lenderName || 'N/A'} - ${ijaConfig.journeyType || 'N/A'})`;
    chatbotContainer.appendChild(header);

    const messagesArea = document.createElement('div');
    messagesArea.id = 'ija-chat-messages';
    chatbotContainer.appendChild(messagesArea);

    const inputArea = document.createElement('div');
    inputArea.className = 'ija-chat-input-area';
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.placeholder = 'Ask a question (simulated)...';
    inputField.disabled = true;
    inputArea.appendChild(inputField);
    chatbotContainer.appendChild(inputArea);

    placeholder.appendChild(chatbotContainer);
    return true;
}

function addBotMessage(htmlContent, isRuleMessage = false) {
    if (!chatMessagesContainer) return;

    if (!isRuleMessage && initialBotMessageElement && initialBotMessageElement.parentNode === chatMessagesContainer) {
        // Only remove initial greeting for general help messages, not for rule messages
        // This allows rule messages to appear alongside the initial greeting if no other help has been shown.
        chatMessagesContainer.removeChild(initialBotMessageElement);
        initialBotMessageElement = null;
    } else if (chatMessagesContainer.contains(initialBotMessageElement) && chatMessagesContainer.children.length > 1 && !isRuleMessage) {
        // If it's not a rule message and initial message exists with other messages, remove it.
         chatMessagesContainer.removeChild(initialBotMessageElement);
         initialBotMessageElement = null;
    }


    const messageDiv = document.createElement('div');
    messageDiv.classList.add('ija-message', 'bot');
    if (isRuleMessage) {
        messageDiv.classList.add('rule-alert'); // Optional: for different styling of rule messages
        messageDiv.innerHTML = `<strong>Rule Alert:</strong> ${htmlContent}`;
    } else {
        messageDiv.innerHTML = htmlContent;
    }
    chatMessagesContainer.appendChild(messageDiv);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

/**
 * Determines and displays the appropriate help message based on context.
 * This function is primarily for focus and hesitation, not for rule validation on input change.
 * @param {string} contextKey - The key identifying the help context (from data-help-context).
 * @param {boolean} isHesitation - True if this is a follow-up due to user hesitation.
 */
function showHelp(contextKey, isHesitation = false) {
    if (!ijaConfig.helpMessages) {
        return;
    }

    let messageContent;
    let finalMessage;

    if (isHesitation) {
        const hesitationMessageKey = `${contextKey}_hesitated`;
        messageContent = ijaConfig.helpMessages[hesitationMessageKey];
        if (messageContent) {
            finalMessage = messageContent;
            // Note: The generic rule suffix appending from the previous version is removed from here
            // as rule checking is now more direct on the loanAmount input's blur event.
            addBotMessage(finalMessage);
        }
    } else {
        messageContent = ijaConfig.helpMessages[contextKey];
        if (messageContent) {
            if (lastFocusedField !== contextKey) {
                finalMessage = messageContent;
                addBotMessage(finalMessage);
                lastFocusedField = contextKey;
            }
        }
    }
}

/**
 * Checks loan amount rules when the loan amount field loses focus (on blur).
 */
function checkLoanAmountRules() {
    if (!loanAmountInput || !ijaConfig.rules || !ijaConfig.rules.loanAmountHelp) {
        return; // No loan input found or no rules defined for it
    }

    const loanRules = ijaConfig.rules.loanAmountHelp;
    const valueStr = loanAmountInput.value;
    if (valueStr.trim() === '') return; // Don't check if empty

    const loanValue = parseFloat(valueStr);

    if (isNaN(loanValue)) {
        addBotMessage("Please enter a valid number for the loan amount.", true);
        return;
    }

    let ruleTriggered = false;
    if (loanRules.maxLoan !== undefined && loanValue > loanRules.maxLoan && loanRules.messageSuffix_aboveMax) {
        addBotMessage(loanRules.messageSuffix_aboveMax, true);
        ruleTriggered = true;
    }
    if (loanRules.minLoan !== undefined && loanValue < loanRules.minLoan && loanRules.messageSuffix_belowMin) {
        // Add this message even if the max loan message was also added, or choose one.
        // For this demo, we'll allow both to appear if applicable (e.g. value is far too low and also above a max if max < min, which is bad config)
        addBotMessage(loanRules.messageSuffix_belowMin, true);
        ruleTriggered = true;
    }

    // Optionally, you could add a "looks good" message if no rules are triggered.
    // if (!ruleTriggered) {
    //     addBotMessage("Loan amount seems within general parameters.", true);
    // }
}


function initializeIJALogic() {
    if (window.pendingIJAConfig && (!ijaConfig || Object.keys(ijaConfig).length === 0 || ijaConfig.lenderName === "ErrorLender")) {
        window.IJA_Chatbot.init(window.pendingIJAConfig);
        delete window.pendingIJAConfig;
    }

    if (!renderChatbotUI()) {
        return;
    }

    formInputs = document.querySelectorAll('#applicationForm input');
    chatMessagesContainer = document.getElementById('ija-chat-messages');
    loanAmountInput = document.querySelector('input[data-help-context="loanAmountHelp"]'); // Get specific loan input

    if (chatMessagesContainer && chatMessagesContainer.children.length === 0 && ijaConfig.initialGreeting) {
        const p = document.createElement('p');
        p.classList.add('ija-message', 'bot', 'initial-bot-message');
        p.textContent = ijaConfig.initialGreeting;
        chatMessagesContainer.appendChild(p);
        initialBotMessageElement = p;
    }

    if (!formInputs.length || !chatMessagesContainer) {
        console.error("IJA Chatbot: Could not find necessary DOM elements after UI creation.");
        return;
    }

    formInputs.forEach(input => {
        input.addEventListener('focus', (event) => {
            const contextKey = event.target.dataset.helpContext;
            if (contextKey) {
                if (hesitationTimer) clearTimeout(hesitationTimer);
                showHelp(contextKey, false);
                hesitationTimer = setTimeout(() => {
                    if (document.activeElement === event.target) {
                        showHelp(contextKey, true);
                    }
                }, ijaConfig.hesitationTimeMs || 1500);
            }
        });

        input.addEventListener('blur', (event) => {
            if (hesitationTimer) clearTimeout(hesitationTimer);
            lastFocusedField = null;

            // If the blurred input is the loan amount input, check its rules
            if (event.target === loanAmountInput) {
                checkLoanAmountRules();
            }
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIJALogic);
} else {
    initializeIJALogic();
}
