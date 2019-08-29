import { APP_CONSTANTS } from '../appConstants';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import PopupContainer from './PopupContainer/PopupContainer';
import {showDesktopNotification} from 'common/utils';
import "./Popup.scss";

console.log("inside popup script");
startPopUpScript();

function startPopUpScript() {
  initialize();
  // inter exchange message handler
  showDesktopNotification("Popup Started");
}

function initialize() {
  renderPopupComponent();
}

function renderPopupComponent() {
  // Get the DOM Element that will host our React application
  const rootEl = document.getElementById('pop-up-container');
  // Render the React application to the DOM
  ReactDOM.render(<PopupContainer />, rootEl);
}
