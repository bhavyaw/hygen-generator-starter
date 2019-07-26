import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { showDesktopNotification } from 'common/utils';
import PopupContainer from './PopupContainer/PopupContainer';
import { EXTENSION_MODULES, subscribe } from '../common/crxMessenger';

console.log('inside popup script', EXTENSION_MODULES);
startPopUpScript();

function startPopUpScript() {
  initialize();
  // inter exchange message handler
  showDesktopNotification('Popup Started');
}

function initialize() {
  renderPopupComponent();
  subscribe('GOOGLE_OPEN', (data, sendResponseCallback) => {
    console.log(
      'Inside options.js subscriber for message GOOGLE_OPEN',
      data,
      sendResponseCallback
    );
    setTimeout(() => {
      sendResponseCallback({
        fromPopup: true,
        pingback: true,
        data,
      });
    }, 200);
  });
}

function renderPopupComponent() {
  // Get the DOM Element that will host our React application
  const rootEl = document.getElementById('pop-up-container');
  // Render the React application to the DOM
  ReactDOM.render(<PopupContainer />, rootEl);
}
