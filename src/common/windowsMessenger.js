import isString from 'lodash/isString';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import { EXTENSION_MODULES, getCurrentExtensionModule } from './crxMessenger';

export default class WindowsMessenger {
  variableScriptListeners = [];

  variableFetchingFileUrl = null;

  variableAccessScriptLoaded = false;

  messageSubscriptionMap = new Map();

  currentExtensionModule = null;

  listenerAdded = false;

  constructor(windowNode, headNode) {
    this.windowNode = windowNode || window;
    this.headNode = headNode || document.getElementsByTagName('head')[0];
    this.currentExtensionModule = getCurrentExtensionModule();

    // in case of variable access script we don't inject any script but we have to
    // enable window listeners in order to listen for events. Also, because there's no code sharing
    // b/w variableAccessScript and contentScripts
    if (
      this.currentExtensionModule === EXTENSION_MODULES.VARIABLE_ACCESS_SCRIPT
    ) {
      this.enableWindowMessageListener();
    }
  }

  subscribe(message, responseCallback) {
    if (this.validateMessagingArguments(message)) {
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
      !this.variableAccessScriptLoaded
    ) {
      throw new Error(`Variable Script is not loaded yet..`);
    }

    if (this.validateMessagingArguments(message)) {
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
  async injectVariableAccessScript(variableAccessScriptPath) {
    if (!variableAccessScriptPath || !isString(variableAccessScriptPath)) {
      throw new Error(`Please enter a valid variableAccess Script Path`);
    }
    // eslint-disable-next-line no-undef
    this.variableFetchingFileUrl = chrome.extension.getURL(
      variableAccessScriptPath
    );
    const existingScriptElem = document.getElementById(
      'ce-variable-access-script'
    );

    return new Promise(resolve => {
      if (!existingScriptElem) {
        const scriptElem = document.createElement('script');
        // const chromeRuntimeId = chrome.runtime.id;
        scriptElem.setAttribute('type', 'text/javascript');
        scriptElem.setAttribute('src', this.variableFetchingFileUrl);
        scriptElem.setAttribute('id', 'ce-variable-access-script');
        // scriptElem.setAttribute("extensionId", chromeRuntimeId);
        this.headNode.appendChild(scriptElem);
        scriptElem.onload = () => {
          console.log(`External variable access script loaded`);
          this.variableAccessScriptLoaded = true;
          this.enableWindowMessageListener();
          resolve();
        };
      } else {
        resolve();
      }
    });
  }

  // Utils

  validateMessagingArguments(message) {
    let argumentsValid = true;

    if (isEmpty(message)) {
      argumentsValid = false;
      throw new Error(`Required : Message Param missing`);
    }

    return argumentsValid;
  }
}
