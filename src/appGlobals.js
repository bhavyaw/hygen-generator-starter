/**
 *  For non-persistent data sharing b/w various content script modules
 *  For persistent data sharing use chrome storage
 */
const appGlobals = {
    userId : null,
    appVersion : null
};

Object.seal(appGlobals);

export default appGlobals;