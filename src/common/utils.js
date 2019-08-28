export function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function reportError(message, errorDetails, throwError) {
  console.log('Reporting Error to admin', message, errorDetails);

  if (throwError) {
    throw errorDetails;
  }
}

export function showDesktopNotification(
  message,
  title = '',
  type = 'basic',
  iconUrl = '../icon48.png'
) {
  // eslint-disable-next-line no-undef
  chrome.notifications.create({
    message,
    type,
    title,
    iconUrl,
  });
}
