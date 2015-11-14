export function onConnect(respond, connections = {}, tab, error) {
  chrome.runtime.onConnect.addListener(function(port) {
    function extensionListener(message) {
      if (message.name === 'init') {
        connections[message.tabId || port.sender.tab.id] = port;

        if (tab && message.tabId !== tab.id) {
          error(port);
          return;
        }
        port.postMessage(respond());
      }
    }

    port.onMessage.addListener(extensionListener);
    port.onDisconnect.addListener(function(portDiscon) {
      portDiscon.onMessage.removeListener(extensionListener);
      Object.keys(connections).forEach(function(id) {
        if (connections[id] === portDiscon) {
          delete connections[id];
        }
      });
    });

  });
}

export const connect = chrome.runtime.connect;

export function onMessage(messaging) {
  if (chrome.runtime.onMessage) chrome.runtime.onMessage.addListener(messaging);
}

export const sendToBg = chrome.runtime.sendMessage;

export function sendToTab(...args) {
  chrome.tabs.sendMessage(...args);
}
