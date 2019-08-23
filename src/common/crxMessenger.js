import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import isMatch from 'lodash/isMatch';
import isSet from 'lodash/isSet';
import get from 'lodash/get';
import uniq from 'lodash/uniq';
import isUndefined from 'lodash/isUndefined';

export const EXTENSION_MODULES = {
  BACKGROUND: 'BACKGROUND',
  POPUP: 'POPUP',
  OPTIONS: 'OPTIONS',
  TAB: 'TAB',
  VARIABLE_ACCESS_SCRIPT: 'VARIABLE_ACCESS_SCRIPT',
  OPTIONS_EMBEDDED: 'OPTIONS_EMBEDDED', // TODO : enhancements
};

// To take care of the missing messages
const messageSubscriptionMap = new Map();
const receiveMessagesFromMap = new Map();
const tabMessageQueueMap = new Map();
let currentExtensionModule = null;
let messageReceiverInitialized = false;

initialize();
/**
 * File needs to be imported from any page
 */
function initialize() {
  console.log('Initializing CRX Messenger');
  currentExtensionModule = getCurrentExtensionModule();
}

// add check for content script and background - to use custom function to send and receive messages
export function subscribe() {
  const {
    senderModule,
    message,
    responseCallback,
  } = extractSubscribeMessageArguments(arguments);
  console.log(
    `crxMessenger.js : subscribe() : extracted arguments: `,
    senderModule,
    message,
    responseCallback
  );
  const validArguments = validateArguments(senderModule, message);

  if (validArguments) {
    if (!messageReceiverInitialized) {
      messageReceiverInitialized = true;
      chrome.runtime.onMessage.addListener(onMessageHandler); // eslint-disable-line no-undef
    }
    const messageListeners = messageSubscriptionMap.get(message);
    const newMessageListeners = messageListeners
      ? [...messageListeners, responseCallback]
      : [responseCallback];
    messageSubscriptionMap.set(message, newMessageListeners);

    if (senderModule) {
      const messageSendersList = receiveMessagesFromMap.get(message);
      const newMessageSendersList = messageSendersList
        ? uniq([...messageSendersList, senderModule])
        : [senderModule];
      receiveMessagesFromMap.set(message, newMessageSendersList);
    }
  }
}

function onMessageHandler(messageObj, senderObj, sendResponseCallback) {
  if (isArray(messageObj)) {
    messageObj.forEach(singleMessageObj =>
      onMessageHandler(singleMessageObj, senderObj, sendResponseCallback)
    );

    return true;
  }

  const { receiver, data, sender, message } = messageObj;
  const messageRestrictedSenders = receiveMessagesFromMap.get(message);

  if (
    !messageRestrictedSenders ||
    (messageRestrictedSenders && messageRestrictedSenders.indexOf(sender) > -1)
  ) {
    if (!receiver || (receiver && receiver === currentExtensionModule)) {
      dispatchMessagesToListeners(
        message,
        data,
        sendResponseCallback,
        senderObj
      );
    }
  }

  return true;
}

function dispatchMessagesToListeners(
  message,
  data,
  sendResponseCallback,
  senderObj
) {
  const messageListeners = messageSubscriptionMap.get(message);

  if (isArray(messageListeners) && !isEmpty(messageListeners)) {
    messageListeners.forEach(messageListener => {
      messageListener(data, sendResponseCallback, senderObj);
    });
  }
}

// @priority medium
// TODO - To handle unsubscription via subscription id
// Return subscription id after subscribing to any message
function unsubscribe(message, callback) {}

export async function publish() {
  const {
    receiverModule,
    receiverModuleOptions,
    message,
    data,
    responseCallback,
  } = extractSendMessageArgs(arguments);
  let senderModule = null;
  console.log(
    `crxMesseneger.js - publish() : Extracted Args : `,
    receiverModule,
    receiverModuleOptions,
    message,
    data
  );
  const validArguments = validateArguments(
    receiverModule,
    message,
    data,
    receiverModuleOptions
  );
  const messageObj = {};

  messageObj.message = message;
  if (receiverModule) {
    messageObj.receiver = receiverModule;
  }

  if (data) {
    messageObj.data = data;
  }

  if (currentExtensionModule) {
    senderModule = currentExtensionModule;
    messageObj.sender = currentExtensionModule;
  }

  if (!validArguments) {
    return;
  }

  switch (true) {
    case receiverModule === EXTENSION_MODULES.TAB:
    case receiverModule === EXTENSION_MODULES.tab:
      if (senderModule !== EXTENSION_MODULES.TAB) {
        // send to specific tab
        const requiredActiveTabs = await filterTabs(receiverModuleOptions);
        if (requiredActiveTabs) {
          console.log(
            `Fitlered Tabs to broadcast message to : `,
            requiredActiveTabs
          );
          requiredActiveTabs.forEach(activeTab => {
            messageObj.data.url = activeTab.url; // for testing purposes only
            console.log(
              `Message data : `,
              JSON.stringify(messageObj, undefined, 4)
            );
            sendMessageToTabWithId(activeTab.id, messageObj, responseCallback);
          });
        }
      }
      break;

    case (receiverModule === EXTENSION_MODULES.VARIABLE_ACCESS_SCRIPT &&
      senderModule === EXTENSION_MODULES.TAB) ||
      (receiverModule === EXTENSION_MODULES.TAB &&
        senderModule === EXTENSION_MODULES.VARIABLE_ACCESS_SCRIPT):
      throw new Error(`Use Windows messenger utility for this purpose`);

    default:
      chrome.runtime.sendMessage(messageObj, responseCallback); // eslint-disable-line no-undef
      break;
  }
}

/** *
 * Extended Api
 */

export function sendMessageFromBackgroundToActiveTab(
  preferableTabId,
  messageObj,
  responseCallback
) {
  if (isUndefined(preferableTabId) || isNaN(preferableTabId)) {
    throw new Error(
      'Argument preferrableTabId cannot be empty or not a number'
    );
  }

  let messageQueueForPreferrableTab = tabMessageQueueMap.get(preferableTabId);
  messageQueueForPreferrableTab = !isSet(messageQueueForPreferrableTab)
    ? new Set([messageObj])
    : messageQueueForPreferrableTab.add(messageObj);
  tabMessageQueueMap.set(preferableTabId, messageQueueForPreferrableTab);

  console.log(
    `Fetching required tab and sending message to it : `,
    preferableTabId
  );
  // eslint-disable-next-line no-undef
  chrome.tabs.get(preferableTabId, activeTab => {
    if (activeTab) {
      const messageQueueForActiveTab = tabMessageQueueMap.get(activeTab.id);
      if (messageQueueForActiveTab) {
        const messagesToSend = [...messageQueueForActiveTab];
        console.log(
          `Found required tab ${activeTab.id}...sending message to it : `,
          messagesToSend
        );
        // eslint-disable-next-line no-undef
        chrome.tabs.sendMessage(
          activeTab.id,
          messagesToSend,
          {},
          responseCallback
        );
      }
      tabMessageQueueMap.delete(activeTab.id);
    }
  });
}

export function sendMessageToTabWithId(tabId, messageObj, responseCallback) {
  // eslint-disable-next-line no-undef
  chrome.tabs.get(tabId, activeTab => {
    if (activeTab) {
      messageObj.data.url = activeTab.url;
      // eslint-disable-next-line no-undef
      chrome.tabs.sendMessage(activeTab.id, messageObj, {}, responseCallback);
    }
  });
}

/** ************************************************
 *        Internal Functionality
 ************************************************* */

export function validateArguments(
  receiverOrSenderModule,
  message,
  data,
  receiverModuleOptions
) {
  let areArgumentsValid = true;

  if (receiverOrSenderModule && !EXTENSION_MODULES[receiverOrSenderModule]) {
    areArgumentsValid = false;
    throw new Error(
      `Please enter a valid Receiver/Sender Module : ${receiverOrSenderModule}. Valid Extension Modules : `,
      EXTENSION_MODULES
    );
  }

  if (isEmpty(message)) {
    areArgumentsValid = false;
    throw new Error(`Required : Message Param missing`);
  }

  if (
    receiverModuleOptions &&
    (!isFunction(receiverModuleOptions) || !isObject(receiverModuleOptions))
  ) {
    areArgumentsValid = false;
    throw new Error(
      `Receiver Module Options should either be a function or object to filter active tabs`
    );
  }

  return areArgumentsValid;
}

function extractSendMessageArgs(args) {
  let receiverModule;
  let message;
  let data;
  let responseCallback;
  let receiverModuleOptions;

  /* eslint-disable prefer-destructuring */

  if (isString(args[0]) && (isString(args[1]) || isString(args[2]))) {
    receiverModule = args[0];
    receiverModule = receiverModule.toUpperCase();

    if (isObject(args[1]) || isFunction(args[1])) {
      receiverModuleOptions = args[1];
      message = args[2];

      if (isObject(args[3])) {
        data = args[3];

        if (isFunction(args[4])) {
          responseCallback = args[4];
        }
      } else if (isFunction(args[3])) {
        responseCallback = args[3];
      }
    } else if (isString(args[1])) {
      message = args[1];

      if (isObject(args[2])) {
        data = args[2];

        if (isFunction(args[3])) {
          responseCallback = args[3];
        }
      } else if (isFunction(args[2])) {
        responseCallback = args[2];
      }
    }
  } else if (isString(args[0])) {
    message = args[0];

    if (isObject(args[1])) {
      data = args[1];

      if (isFunction(args[2])) {
        responseCallback = args[2];
      }
    } else if (isFunction(args[1])) {
      responseCallback = args[1];
    }
  }
  /* eslint-enable prefer-destructuring */

  return {
    receiverModule,
    message,
    data,
    responseCallback,
    receiverModuleOptions,
  };
}

function extractSubscribeMessageArguments(args) {
  let senderModule;
  let message;
  let responseCallback;

  /* eslint-disable prefer-destructuring */
  if (isString(args[0]) && isString(args[1])) {
    senderModule = args[0];
    senderModule = senderModule.toUpperCase();
    message = args[1];

    if (isFunction(args[2])) {
      responseCallback = args[2];
    }
  } else if (isString(args[0])) {
    message = args[0];
    if (isFunction(args[1])) {
      responseCallback = args[1];
    }
  }
  /* eslint-enable prefer-destructuring */

  return {
    senderModule,
    message,
    responseCallback,
  };
}

export async function getCurrentExtensionModule() {
  const manifest = chrome.runtime.getManifest(); // eslint-disable-line no-undef
  const pageWindowLocation = window.location.href;

  let popupPageFileName = get(manifest, 'browser_action.default_popup', '');
  let optionsPageFileName = get(manifest, 'options_page', '');
  let extensionModule = null;

  // console.log(
  //   'Inside setCurrentExtensionModule() : ',
  //   manifest,
  //   popupPageFileName,
  //   optionsPageFileName
  // );

  /* eslint-disable no-undef */
  if (
    chrome &&
    chrome.extension &&
    chrome.extension.getBackgroundPage &&
    chrome.extension.getBackgroundPage() === window
  ) {
    extensionModule = EXTENSION_MODULES.BACKGROUND;
  } else if (
    chrome &&
    chrome.extension &&
    chrome.extension.getBackgroundPage &&
    chrome.extension.getBackgroundPage() !== window
  ) {
    if (isEmpty(popupPageFileName)) {
      popupPageFileName = await getPopupFileName();
    }

    if (isEmpty(optionsPageFileName)) {
      optionsPageFileName = get(manifest, 'options_ui.page', '');
    }

    popupPageFileName = popupPageFileName.split('/').pop();
    optionsPageFileName = optionsPageFileName.split('/').pop();

    if (pageWindowLocation.includes(popupPageFileName)) {
      extensionModule = EXTENSION_MODULES.POPUP;
    } else if (pageWindowLocation.includes(optionsPageFileName)) {
      extensionModule = EXTENSION_MODULES.OPTIONS;
    }
  } else if (!chrome || !chrome.runtime || !chrome.runtime.onMessage) {
    extensionModule = EXTENSION_MODULES.INJECTED_SCRIPT;
  } else {
    extensionModule = EXTENSION_MODULES.TAB;
  }

  console.log(`Current Extensions Module is : `, extensionModule);
  return extensionModule;
  /* eslint-enable no-undef */
}

/** ***************************************************
 *                 UTILS
 *************************************************** */

/**
 * Get popup file name in case its set dynamically using set popup
 */
async function getPopupFileName() {
  return new Promise(resolve => {
    // eslint-disable-next-line no-undef
    chrome.browserAction.getPopup({}, (popupFileName = '') => {
      resolve(popupFileName);
    });
  });
}

async function filterTabs(receiverModuleOptions) {
  let filteredTabs;

  return new Promise(resolve => {
    // eslint-disable-next-line no-undef
    chrome.tabs.query({}, tabs => {
      if (!isEmpty(receiverModuleOptions)) {
        if (isFunction(receiverModuleOptions)) {
          filteredTabs = receiverModuleOptions(tabs);
        } else if (isObject(receiverModuleOptions)) {
          filteredTabs = tabs.filter(tab =>
            isMatch(tab, receiverModuleOptions)
          );
        }

        if (
          isArray(filteredTabs) &&
          filteredTabs.every(filteredTab => isNumber(filteredTab.id))
        ) {
          resolve(filteredTabs);
        } else {
          console.log(
            `Warn : No tabs were found using the given tab options or incorrect data was returned by filter function `,
            receiverModuleOptions
          );
          resolve();
        }
      } else {
        resolve(tabs);
      }
    });
  });
}
