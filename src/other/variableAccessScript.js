import WindowMessenger from 'common/windowsMessenger';

let messenger = null;

init();

function init() {
  // console.log(`Inspecting chrome object : `, chrome); // eslint-disable-line no-undef
  console.log(`variableAccessScript initialization`);
  messenger = new WindowMessenger(window);
  messenger.enableWindowMessageListener();
  initSubscribers();
}

function initSubscribers() {
  messenger.subscribe('TEST_MESSAGE', data => {
    console.log(
      `variableAccesscript.js : TEST_MESSAGE subscriber fired..`,
      data
    );
  });
}
