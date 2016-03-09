export function onConnect(init, responses, connections, onDisconnect) {
  if (typeof connections === 'undefined' && !window.bgConnections) {
    window.bgConnections = {}; connections = window.bgConnections;
  }

  function onConnectListener(port) {
    function extensionListener(message) {
      if (init && message.name === 'init') {
        connections[message.tabId || port.sender.tab.id] = port;
        port.postMessage(init(message.tabId || port.sender.tab.id));
      }
      else if(responses[message.name]) {
        const res = responses[message.name](message, port);
        if (res) port.postMessage(res);
        else if (window.bgConnections) {
          sendToTabsExcept(message, port, window.bgConnections);
        }
      }
    }

    port.onMessage.addListener(extensionListener);
    port.onDisconnect.addListener(function(portDiscon) {
      portDiscon.onMessage.removeListener(extensionListener);
      if (onDisconnect) onDisconnect(portDiscon);
      Object.keys(connections).some(function(id) {
        if (connections[id] === portDiscon) {
          delete connections[id];
          return true;
        }
        return false;
      });
    });
  }

  chrome.runtime.onConnect.addListener(onConnectListener);
  chrome.runtime.onConnectExternal.addListener(onConnectListener);
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
  if (chrome.runtime.onMessageExternal) chrome.runtime.onMessageExternal.addListener(messaging);
}

export function sendToBg(...args) {
  if (!window.bgConnection) chrome.runtime.sendMessage(...args);
  else {
    window.bgConnection.postMessage(...args);
  }
}

export function sendToTab(...args) {
  chrome.tabs.sendMessage(...args);
}

export function sendToTabs(message, connections) {
  if (!connections) {
    if (window.bgConnections) connections = window.bgConnections;
    else return;
  }
  Object.keys(connections).forEach(function(id) {
    connections[id].postMessage(message);
  });
}

export function sendToTabsExcept(message, port, connections) {
  Object.keys(connections).forEach(function(id) {
    if (connections[id] !== port) {
      connections[id].postMessage(message);
    }
  });
}

export function sendMessage(message) {
  if (window.bgConnection) window.bgConnection.postMessage(message);
  else sendToTabs(message);
}
