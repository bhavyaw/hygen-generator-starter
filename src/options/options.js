// import { APP_CONSTANTS } from '../appConstants';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import OptionsContainer from './OptionsContainer/OptionsContainer';
import { EXTENSION_MODULES, publish } from '../common/crxMessenger';

console.log('inside options script!', EXTENSION_MODULES);
startPopUpScript();

function startPopUpScript() {
  initialize();
  // inter exchange message handler
}

function initialize() {
  renderPopupComponent();
  setTimeout(() => {
    publish('GOOGLE_OPEN', { code: 'xyz' }, data => {
      console.log(`Inside response from subscriber : `, data);
    });
  }, 5000);
}

function renderPopupComponent() {
  // Get the DOM Element that will host our React application
  const rootEl = document.getElementById('options-container');
  // Render the React application to the DOM
  ReactDOM.render(<OptionsContainer />, rootEl);
}
