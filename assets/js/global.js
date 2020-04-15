const SERVER_BASE = 'https://minecrafttradingmarket.herokuapp.com';

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

// code for this function was taken from user etham on https://stackoverflow.com/questions/36532307/rem-px-in-javascript
const remToPx = (rem) => {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
};

// update textarea height to fit text content
const updateTextareaHeight = (textareaElm) => {
    textareaElm.style.height = 'auto';
    textareaElm.style.height = textareaElm.scrollHeight + remToPx(0.25) + 'px';
};

const getCredentials = () => {
    // get credentials from local storage
    try {
        const credentials = JSON.parse(localStorage.getItem('minecraft-trading-market-credentials'));

        const requiredFields = ['username', 'pin'];

        for (let i = 0; i < requiredFields.length; i++) {
            const currentField = requiredFields[i];

            if (!credentials[currentField]) {
                throw 'Missing username or pin field(s) in local storage credentials save.';
            }
        }

        return credentials;
    } catch (err) {
        return null;
    }
};

const setCredentials = (username, pin) => {
    localStorage.setItem('minecraft-trading-market-credentials', JSON.stringify({ username, pin }));
};

const getAuthorizationHeader = () => {
    // get credentials
    const credentials = getCredentials();

    if (!credentials) {
        return 'credentials not found';
    }

    // create authorization header
    const authorizationHeader = 'Basic ' + btoa(credentials.username + ':' + credentials.pin);

    return authorizationHeader;
};

const verifyCredentials = async () => {
    const authorizationHeader = getAuthorizationHeader();

    if (authorizationHeader == 'credentials not found') {
        return 'credentialsnotfound';
    }

    const response = await fetch(SERVER_BASE + '/api/auth/', {
        method: 'GET',
        headers: new Headers({
            Authorization: authorizationHeader,
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

// if credentials are valid, go to logged in homepage
(async () => {
    if ((await verifyCredentials()) == 'accepted') {
        if (!(window.location.href.toString().indexOf('app.html') > -1)) {
            window.open('app.html', '_self');
        }
    } else {
        if (!window.location.href.toString().endsWith('/')) {
            window.open('/minecraft/', '_self');
        }
    }

    // page has loaded and credentials have been checked
    document.body.classList.remove('loading');
})();
