import { showDesktopNotification } from 'common/utils';
import { subscribe } from '../common/crxMessenger';
// import { APP_CONSTANTS } from '../appConstants';
// import { APP_MESSAGES } from '../appMessages';

console.log(`Inside background scripts...`, chrome); // eslint-disable-line no-undef
initializeBackgroundScript();

async function initializeBackgroundScript() {
  console.log('Initializing Background script...');
  // TODO : enable this in production
  // browser start event
  // chrome.runtime.onStartup.addListener(async () => {
  // });
  showDesktopNotification('Extension started in the background!!!');
  handleBrowserStartEvent();
}

function handleBrowserStartEvent() {
  // showDesktopNotification(`Browser has started!!!`);
  listenToTabEvents();
  // extension message handler
  // subscribe('GOOGLE_OPEN', (data, sendResponseCallback) => {
  //   console.log(
  //     `Inside options.js subscribe callback : `,
  //     data,
  //     sendResponseCallback
  //   );
  //   sendResponseCallback({
  //     fromBackground: true,
  //     pingback: true,
  //     data,
  //   });
  // });
}

function listenToTabEvents() {
  const tabTestRegex1 = /myaccount\.google\.com\/(u\/\d\/|intro\/)?activitycontrols$/i;
  const tabTestRegex2 = /google.com/i;

  // eslint-disable-next-line no-undef
  chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
    if (info.status === 'complete') {
      console.log(`Tab updated  : `, tab);
      const url = new URL(tab.url);
      const completeUrl = url.host + url.pathname;

      if (tabTestRegex1.test(completeUrl)) {
        console.log('1st test tab opened');
      }

      if (tabTestRegex2.test(completeUrl)) {
        console.log(
          'Google.com opened - Publishing message to other extension modules',
          tab.id
        );
      }
    }
  });
}
