import isEmpty from 'lodash/isEmpty';
import isObject from 'lodash/isObject';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import get from 'lodash/get';
import uniq from 'lodash/uniq';

export const EXTENSION_MODULES = {
  BACKGROUND: 'BACKGROUND',
  background: 'BACKGROUND',
  POPUP: 'POPUP',
  popup: 'POPUP',
  OPTIONS: 'OPTIONS',
  options: 'OPTIONS',
  CONTENT_SCRIPT: 'CONTENT_SCRIPT',
  content_script: 'CONTENT_SCRIPT',
  INJECTED_SCRIPT: 'INJECTED_SCRIPT',
  injected_script: 'INJECTED_SCRIPT',
};

// To take care of the missing messages
const messageQueue = new Set();
const messageSubscriptionMap = new Map();
const messageSenderLinkMap = new Map();
let currentExtensionModule = null;
let messageReceiverInitialized = false;

initialize();
/**
 * File needs to be imported from any page
 */
function initialize() {
  console.log('Initializing CRX Messenger');
  setCurrentExtensionModule();
}

// add check for content script and background - to use custom function to send and receive messages
export function subscribe() {
  const { senderModule, message, callback } = extractSubscribeMessageArguments(
    arguments
  );
  const validArguments = validateArguments(senderModule, message);

  if (validArguments) {
    if (!messageReceiverInitialized) {
      messageReceiverInitialized = true;
      chrome.runtime.onMessage.addListener(onMessageHandler); // eslint-disable-line no-undef
    }
    const messageListeners = messageSubscriptionMap.get(message);
    const newMessageListeners = messageListeners
      ? [callback]
      : [...messageListeners, callback];
    messageSubscriptionMap.set(message, newMessageListeners);

    if (senderModule) {
      const messageSendersList = messageSenderLinkMap.get(message);
      const newMessageSendersList = messageSendersList
        ? [senderModule]
        : uniq([...messageSendersList, senderModule]);
      messageSenderLinkMap.set(message, newMessageSendersList);
    }
  }
}

function onMessageHandler(messageObj, senderObj, sendResponseCallback) {
  if (isArray(messageObj)) {
    messageObj.forEach(singleMessageObj =>
      onMessageHandler(singleMessageObj, senderObj, sendResponseCallback)
    );

    return;
  }

  const { receiver, data, sender, message } = messageObj;
  const messageRestrictedSenders = messageSenderLinkMap.get(message);

  if (
    !messageRestrictedSenders ||
    (messageRestrictedSenders && messageRestrictedSenders.indexOf(sender) > -1)
  ) {
    if (!receiver || (receiver && receiver === currentExtensionModule)) {
      dispatchMessagesToReceivers(message, data, sendResponseCallback);
    }
  }

  return true;
}

function dispatchMessagesToReceivers(message, data, sendResponseCallback) {
  const messageListeners = messageSubscriptionMap.get(message);

  if (isArray(messageListeners) && !isEmpty(messageListeners)) {
    messageListeners.forEach(messageListener => {
      messageListener(data, sendResponseCallback);
    });
  }
}

// @priority medium
// TODO - To handle unsubscription via subscription id
// Return subscription id after subscribing to any message
function unsubscribe(message, callback) {}

export function publish() {
  const {
    receiverModule,
    message,
    data,
    responseCallback,
  } = extractSendMessageArgs(arguments);
  let senderModule = null;
  const validArguments = validateArguments(receiverModule, message, data);
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

  if (validArguments) {
    switch (senderModule) {
      case EXTENSION_MODULES.BACKGROUND:
        if (isNumber(receiverModule)) {
          messageObj.receiver = EXTENSION_MODULES.CONTENT_SCRIPT;
          sendMessageFromBackgroundToActiveTab(
            receiverModule,
            messageObj,
            responseCallback
          );
        } else {
          chrome.runtime.sendMessage(messageObj, responseCallback); // eslint-disable-line no-undef
        }
        break;

      case EXTENSION_MODULES.CONTENT_SCRIPT:
      case EXTENSION_MODULES.POPUP:
      case EXTENSION_MODULES.OPTIONS:
        chrome.runtime.sendMessage(messageObj, responseCallback); // eslint-disable-line no-undef
        break;

      default:
    }
  }
}

/** *
 * Extended Api's
 */

export function sendMessageFromBackgroundToActiveTab(
  preferableTabId,
  messageObj,
  responseCallback
) {
  if (isEmpty(preferableTabId) || isNaN(preferableTabId)) {
    throw new Error(
      'Argument preferrableTabId cannot be empty or not a number'
    );
  }

  messageQueue.add(messageObj);

  // eslint-disable-next-line no-undef
  chrome.tabs.get(preferableTabId, preferableTab => {
    const messagesToSend = [...messageQueue];

    if (preferableTab) {
      // eslint-disable-next-line no-undef
      chrome.tabs.sendMessage(
        preferableTab.id,
        messagesToSend,
        {},
        responseCallback
      );
    }
    messageQueue.clear();
  });
}

/**
 * Utils
 */

export function validateArguments(receiverOrSenderModule, message, data) {
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

  return areArgumentsValid;
}

function extractSendMessageArgs(args) {
  let receiverModule;
  let message;
  let data;
  let responseCallback;

  /* eslint-disable prefer-destructuring */

  if (isString(args[0]) && isString(args[1])) {
    receiverModule = args[0];
    message = args[1];

    if (isObject(args[2])) {
      data = args[2];

      if (isFunction(args[3])) {
        responseCallback = args[3];
      }
    } else if (isFunction(args[2])) {
      responseCallback = args[2];
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
  };
}

function extractSubscribeMessageArguments(args) {
  let senderModule;
  let message;
  let responseCallback;

  /* eslint-disable prefer-destructuring */
  if (isString(args[0]) && isString(args[1])) {
    senderModule = args[0];
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

async function setCurrentExtensionModule() {
  const manifest = chrome.runtime.getManifest(); // eslint-disable-line no-undef
  const pageWindowLocation = window.location.href;

  let popupPageFileName = get(manifest, 'browser_action.default_popup', '');
  let optionsPageFileName = get(manifest, 'options_page', '');

  // console.log(
  //   'Inside setCurrentExtensionModule() : ',
  //   manifest,
  //   popupPageFileName,
  //   optionsPageFileName
  // );
  if (isEmpty(popupPageFileName)) {
    popupPageFileName = await getPopupFileName();
  }

  if (isEmpty(optionsPageFileName)) {
    optionsPageFileName = get(manifest, 'options_ui.page', '');
  }

  popupPageFileName = popupPageFileName.split('/').pop();
  optionsPageFileName = optionsPageFileName.split('/').pop();

  /* eslint-disable no-undef */
  if (
    chrome &&
    chrome.extension &&
    chrome.extension.getBackgroundPage &&
    chrome.extension.getBackgroundPage() === window
  ) {
    currentExtensionModule = EXTENSION_MODULES.BACKGROUND;
  } else if (
    chrome &&
    chrome.extension &&
    chrome.extension.getBackgroundPage &&
    chrome.extension.getBackgroundPage() !== window
  ) {
    if (pageWindowLocation.includes(popupPageFileName)) {
      currentExtensionModule = EXTENSION_MODULES.POPUP;
    } else if (pageWindowLocation.includes(optionsPageFileName)) {
      currentExtensionModule = EXTENSION_MODULES.OPTIONS;
    }
  } else if (!chrome || !chrome.runtime || !chrome.runtime.onMessage) {
    currentExtensionModule = EXTENSION_MODULES.INJECTED_SCRIPT;
  } else {
    currentExtensionModule = EXTENSION_MODULES.CONTENT_SCRIPT;
  }

  console.log(`Current Extensions Module is : `, currentExtensionModule);
  /* eslint-enable no-undef */
}

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
