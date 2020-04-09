const SERVER_BASE = 'http://localhost:7280';

// fire DOM event code taken from user S.Mishra from https://stackoverflow.com/questions/2490825/how-to-trigger-event-in-javascript
function fireDOMEvent(node, eventName) {
    // Make sure we use the ownerDocument from the provided node to avoid cross-window problems
    var doc;
    if (node.ownerDocument) {
        doc = node.ownerDocument;
    } else if (node.nodeType == 9) {
        // the node may be the document itself, nodeType 9 = DOCUMENT_NODE
        doc = node;
    } else {
        throw new Error('Invalid node passed to fireEvent: ' + node.id);
    }

    if (node.dispatchEvent) {
        // Gecko-style approach (now the standard) takes more work
        var eventClass = '';

        // Different events have different event classes.
        // If this switch statement can't map an eventName to an eventClass,
        // the event firing is going to fail.
        switch (eventName) {
            case 'click': // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
            case 'mousedown':
            case 'mouseup':
                eventClass = 'MouseEvents';
                break;

            case 'focus':
            case 'change':
            case 'blur':
            case 'select':
                eventClass = 'HTMLEvents';
                break;

            default:
                throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
                break;
        }
        var event = doc.createEvent(eventClass);

        var bubbles = eventName == 'change' ? false : true;
        event.initEvent(eventName, bubbles, true); // All events created as bubbling and cancelable.

        event.synthetic = true; // allow detection of synthetic events
        // The second parameter says go ahead with the default action
        node.dispatchEvent(event, true);
    } else if (node.fireEvent) {
        // IE-old school style
        var event = doc.createEventObject();
        event.synthetic = true; // allow detection of synthetic events
        node.fireEvent('on' + eventName, event);
    }
}

// escape HTML function code taken from user bjornd from https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
const escapeHTML = (unsafe) => {
    return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
};

const getCredentials = () => {
    // get credentials from local storage
    const credentials = JSON.parse(localStorage.getItem('minecraft-trading-market-credentials'));

    return credentials;
};

const getAuthorizationHeader = () => {
    // get credentials
    const credentials = getCredentials();

    if (!credentials) {
        return 'denied';
    }

    // create authorization header
    const authorizationHeader = 'Basic ' + btoa(credentials.username + ':' + credentials.pin);

    return authorizationHeader;
};

const verifyCredentials = async () => {
    const response = await fetch(SERVER_BASE + '/api/auth/', {
        method: 'GET',
        headers: new Headers({
            Authorization: getAuthorizationHeader(),
            'Content-Type': 'application/x-www-form-urlencoded',
        }),
    });

    switch (response.status) {
        case 200:
            return 'accepted';
            break;
        case 401:
            return 'denied';
            break;
        case 500:
            return 'servererror';
    }
    return;
};

const setCredentials = (username, pin) => {
    localStorage.setItem('minecraft-trading-market-credentials', JSON.stringify({ username, pin }));
};

// if credentials are valid, go to logged in homepage
window.addEventListener('load', () => {
    (async () => {
        if ((await verifyCredentials()) == 'accepted') {
            if (!(window.location.href.toString().indexOf('app.html') > -1)) {
                window.open('app.html', '_self');
            }
        } else {
            if (!window.location.href.toString().endsWith('/')) {
                window.open('/../', '_self');
            }
        }
    })();
});