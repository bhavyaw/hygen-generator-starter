/* eslint-disable no-undef */
import { EXTENSION_MODULES, subscribe } from 'common/crxMessenger';
import { APP_CONSTANTS } from '../appConstants';
import { APP_MESSAGES } from '../appMessages';

console.log(`Inside content Script file - contentScript1.js`);
startContentScript();

function startContentScript() {
  window.onload = windowOnloadHandler;
}

function windowOnloadHandler() {
  console.log(`contentScript1 page loaded!!`);
  extractPageDetails();
  subscribe('GOOGLE_OPEN', (data, sendResponseCallback) => {
    console.log(
      'Inside options.js subscriber for message GOOGLE_OPEN',
      data,
      sendResponseCallback
    );
    sendResponseCallback({
      fromContentScript: true,
      pingback: true,
      data,
    });
  });
}

function extractPageDetails() {
  console.log(`inside extraction page details...`, EXTENSION_MODULES);
}
