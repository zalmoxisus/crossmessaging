import forIn from 'lodash/object/forIn';

export function onConnect(init, responses, connections, tab, error) {
  if (typeof connections === 'undefined' && !window.bgConnections) {
    window.bgConnections = {}; connections = window.bgConnections;
  }
  
  chrome.runtime.onConnect.addListener(function(port) {
    function extensionListener(message) {
      if (message.name === 'init') {
        connections[message.tabId || port.sender.tab.id] = port;

        if (tab && message.tabId !== tab.id) {
          error(port);
          return;
        }
        port.postMessage(init());
      }
      else if(responses[message.name]) {
        const res = responses[message.name](message);
        if (res) port.postMessage(res);
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

export function connect(arg) {
  if (!arg) return chrome.runtime.connect();
  if (typeof arg === 'boolean' && arg) {
    window.bgConnection = chrome.runtime.connect();
    return window.bgConnection;
  }
  return chrome.runtime.connect(arg);
}

export function onMessage(messaging) {
  if (chrome.runtime.onMessage) chrome.runtime.onMessage.addListener(messaging);
}

export const sendToBg = chrome.runtime.sendMessage;

export function sendToTab(...args) {
  chrome.tabs.sendMessage(...args);
}

export function sendToTabs(message, connections) {
  if (!connections) {
    if (window.bgConnections) connections = window.bgConnections;
    else return;
  }
  forIn(connections, connection => {
    connection.postMessage(message);
  });
}
