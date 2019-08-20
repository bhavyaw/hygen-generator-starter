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
}

function extractPageDetails() {
  console.log(`inside extraction page details...`);
}
