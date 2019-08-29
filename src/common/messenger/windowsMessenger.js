import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import isObject from 'lodash/isObject';
import { EXTENSION_MODULES, getCurrentExtensionModule } from './utils';

export default class WindowsMessenger {
  variableScriptListeners = [];

  webAccessScriptFetchingUrl = null;

  webAccessScriptLoaded = false;

  messageSubscriptionMap = new Map();

  currentExtensionModule = null;

  listenerAdded = false;

  constructor(windowNode, headNode) {
    this.windowNode = windowNode || window;
    this.headNode = headNode || document.getElementsByTagName('head')[0];
    this.currentExtensionModule = getCurrentExtensionModule();

    // in case of variable access script we don't inject any script but we have to
    // enable window listeners in order to listen for events. Also, because there's no code sharing
    // b/w webAccessScript and contentScripts
    if (
      this.currentExtensionModule === EXTENSION_MODULES.VARIABLE_ACCESS_SCRIPT
    ) {
      this.enableWindowMessageListener();
    }
  }

  subscribe(message, responseCallback) {
    if (
      this.validateMessagingArguments(message, responseCallback, 'subscribe')
    ) {
      const messageListeners = this.messageSubscriptionMap.get(message);
      const newMessageListeners = messageListeners
        ? [...messageListeners, responseCallback]
        : [responseCallback];
      this.messageSubscriptionMap.set(message, newMessageListeners);
    }
  }

  // publish
  sendMessage(message, data) {
    if (
      this.currentExtensionModule === EXTENSION_MODULES.TAB &&
      !this.webAccessScriptLoaded
    ) {
      throw new Error(`Variable Script is not loaded yet..`);
    }

    if (this.validateMessagingArguments(message, data, 'publish')) {
      const messageObj = {};
      messageObj.message = message;
      if (data) {
        messageObj.data = data;
      }
      const targetUrl = `${location.protocol}//${location.hostname}`;
      this.windowNode.postMessage(messageObj, targetUrl);
    }
  }

  enableWindowMessageListener() {
    if (!this.listenerAdded) {
      this.listenerAdded = true;
      this.windowNode.addEventListener('message', e => {
        this._handleEventListener(e);
      });
    }
  }

  // dispatch messages
  _handleEventListener(e) {
    // We only accept messages from ourselves
    if (this.windowNode !== e.source) {
      return;
    }

    const { data: messageObj } = e;
    const { data, message } = messageObj;

    const messageListeners = this.messageSubscriptionMap.get(message);

    if (isArray(messageListeners) && !isEmpty(messageListeners)) {
      messageListeners.forEach(messageListener => {
        messageListener(data);
      });
    }
  }

  // For content script only
  async injectWebAccessScript(webAccessScriptPath) {
    if (
      this.currentExtensionModule === EXTENSION_MODULES.VARIABLE_ACCESS_SCRIPT
    ) {
      throw new Error(
        `Cannot inject script from variable access script. Supposed to be called from content script`
      );
    }

    if (!webAccessScriptPath || !isString(webAccessScriptPath)) {
      throw new Error(`Please enter a valid variableAccess Script Path`);
    }
    // eslint-disable-next-line no-undef
    this.webAccessScriptFetchingUrl = chrome.extension.getURL(
      webAccessScriptPath
    );
    const existingScriptElem = document.getElementById(
      'ce-variable-access-script'
    );

    return new Promise(resolve => {
      if (!existingScriptElem) {
        const scriptElem = document.createElement('script');
        // const chromeRuntimeId = chrome.runtime.id;
        scriptElem.setAttribute('type', 'text/javascript');
        scriptElem.setAttribute('src', this.webAccessScriptFetchingUrl);
        scriptElem.setAttribute('id', 'ce-variable-access-script');
        // scriptElem.setAttribute("extensionId", chromeRuntimeId);
        console.log(
          `windowsMessenger.js - InjectWebAccessScript() : Appending Web Access Script in head element of the page: `,
          this.webAccessScriptFetchingUrl
        );
        this.headNode.appendChild(scriptElem);
        scriptElem.onload = () => {
          console.log(`External variable access script loaded`);
          this.webAccessScriptLoaded = true;
          this.enableWindowMessageListener();
          resolve();
        };
      } else {
        resolve();
      }
    });
  }

  // Utils
  validateMessagingArguments(firstArgument, secondArgument, validationCase) {
    let argumentsValid = true;

    if (validationCase === 'subscribe') {
      if (secondArgument && !isFunction(secondArgument)) {
        throw new Error(
          `Second Argument to subscribe function should be a function`
        );
      }
    } else if (validationCase === 'publish') {
      if (secondArgument && !isObject(secondArgument)) {
        throw new Error(
          `Second Argument to publish function should be an Object`
        );
      }
    }

    if (isEmpty(firstArgument)) {
      argumentsValid = false;
      throw new Error(`Required : Message Param missing`);
    }

    return argumentsValid;
  }
}
