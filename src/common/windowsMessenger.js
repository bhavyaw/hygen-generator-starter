import isString from 'lodash/isString';
import isFunction from 'lodash/isFunction';
import { EXTENSION_MODULES, validateArguments } from './crxMessenger';

export default class WindowsMessenger {
  variableScriptListeners = [];

  windowNode = window;

  headNode = document.getElementsByTagName('head')[0];

  variableFetchingFileUrl = null;

  constructor(windowNode, headNode) {
    this.windowNode = windowNode || this.windowNode;
    this.headNode = headNode || this.headNode;
  }

  addListener(handlerCallback) {
    if (!isFunction(handlerCallback)) {
      throw new Error('Handler callback should be a function');
    }

    if (!this.variableScriptListeners.length) {
      this.windowNode.addEventListener('message', this.handleEventListener);
    } else {
      this.variableScriptListeners.push(handlerCallback);
    }
  }

  sendMessage(messageObj, senderModule) {
    if (
      !senderModule ||
      EXTENSION_MODULES[senderModule] !== EXTENSION_MODULES.CONTENT_SCRIPT ||
      EXTENSION_MODULES[senderModule] !==
        EXTENSION_MODULES.VARIABLE_ACCESS_SCRIPT
    ) {
      throw new Error('Please enter a valid sender module : ', senderModule);
    }

    const validArguments = validateArguments({ messageObj, senderModule });

    if (validArguments) {
      const finalMessageObj = {
        ...messageObj,
        sender: senderModule,
      };
      const targetUrl = `${location.protocol}//${location.hostname}`;
      this.windowNode.postMessage(finalMessageObj, targetUrl);
    }
  }

  handleEventListener(e) {
    // We only accept messages from ourselves
    if (this.windowNode !== e.source) {
      return;
    }

    const { data } = e;
    this.variableScriptListeners.forEach(variableScriptListener =>
      this.variableScriptListener(data)
    );
  }

  // To be used at the content script end only
  async injectVariableAccessScript(variableAccessScriptPath) {
    if (!variableAccessScriptPath || !isString(variableAccessScriptPath)) {
      throw new Error(`Please enter a valid variableAccess Script Path`);
    }
    // eslint-disable-next-line no-undef
    this.variableFetchingFileUrl = chrome.extension.getURL(
      this.variableAccessScriptPath
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
          resolve();
        };
      } else {
        resolve();
      }
    });
  }
}
