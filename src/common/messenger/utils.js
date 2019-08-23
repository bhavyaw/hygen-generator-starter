import get from 'lodash/get';

export const EXTENSION_MODULES = {
  BACKGROUND: 'BACKGROUND',
  POPUP: 'POPUP',
  OPTIONS: 'OPTIONS',
  TAB: 'TAB',
  VARIABLE_ACCESS_SCRIPT: 'VARIABLE_ACCESS_SCRIPT',
  OPTIONS_EMBEDDED: 'OPTIONS_EMBEDDED', // TODO : enhancements
};

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
