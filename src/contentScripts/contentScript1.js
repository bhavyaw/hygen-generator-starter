import WindowsMessenger from 'common/messenger/windowsMessenger';
import { APP_CONSTANTS } from '../appConstants';
import { APP_MESSAGES } from '../appMessages';

console.log(`Inside content Script file - contentScript1.js`);
startContentScript();
let windowsMessenger = null;

function startContentScript() {
  // console.log(`Inspecting chrome object : `, chrome); // eslint-disable-line no-undef
  window.onload = windowOnloadHandler;
}

function windowOnloadHandler() {
  console.log(`Page associated with contentScript1 loaded`);
  extractPageDetails();
  insertTestButton();
}

async function extractPageDetails() {
  windowsMessenger = new WindowsMessenger(window, document.head);

  try {
    await windowsMessenger.injectVariableAccessScript(
      'js/variableAccessScript.js'
    );
    windowsMessenger.subscribe('RETURN_MESSAGE', data => {
      console.log(`Inside contentScript1 : `, data);
    });
  } catch (e) {
    console.log(`Some error occured in loading variable access script : `, e);
  }
}

function insertTestButton() {
  const btn = document.createElement('button');
  btn.textContent = `Ext. Fn Tester`;
  btn.onclick = onTestBtnClick;
  btn.style.cssText = `
    position:fixed;top:0,left:0
  `.trim();
  document.body.appendChild(btn);
}

function onTestBtnClick(e) {
  windowsMessenger.sendMessage('TEST_MESSAGE', { name: 'bhavya' });
}
