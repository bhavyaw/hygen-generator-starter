import { APP_CONSTANTS } from '../appConstants';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import OptionsContainer from './OptionsContainer/OptionsContainer';
import "./Options.scss";

console.log('inside options script!');
startPopUpScript();

function startPopUpScript() {
  initialize();
  // inter exchange message handler
}

function initialize() {
  renderPopupComponent();
}

function renderPopupComponent() {
  // Get the DOM Element that will host our React application
  const rootEl = document.getElementById('options-container');
  // Render the React application to the DOM
  ReactDOM.render(<OptionsContainer />, rootEl);
}
