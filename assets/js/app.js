/* display notifier */
const displayOnNotifier = (text) => {
    const notifierElm = document.querySelector('.notifier');
    notifierElm.innerText = text;
    notifierElm.classList.add('active');
    setTimeout(() => {
        if (notifierElm.classList.contains('active')) {
            notifierElm.classList.remove('active');
        }
    }, 2500);
};

/* show scrolling nav when scrolling */
(() => {
    const navElm = document.querySelector('nav');
    const checkNavType = () => {
        if (window.pageYOffset > 0) {
            if (!navElm.classList.contains('scrolling')) {
                navElm.classList.add('scrolling');
            }
        } else {
            if (navElm.classList.contains('scrolling')) {
                navElm.classList.remove('scrolling');
            }
        }
    };

    window.addEventListener('load', checkNavType);
    window.addEventListener('scroll', checkNavType);
})();

/* sign out button functionality and text */
(() => {
    const signOutButton = document.querySelector('.nav .right .sign-out');
    const usernameSpan = document.createElement('span');
    usernameSpan.innerText = ` (${getCredentials().username})`;
    usernameSpan.style.opacity = 0.65;
    signOutButton.appendChild(usernameSpan);
    signOutButton.addEventListener('click', () => {
        localStorage.setItem('minecraft-trading-market-credentials', null);
        window.open('/../', '_self');
    });
})();

/* create a trade nav button functionality */
(() => {
    const createtradeButton = document.querySelector('.nav .right .create-trade');
    const createtradeModalContainer = document.querySelector('.create-trade-modal-container');
    const createtradeModal = document.querySelector('.create-trade-modal');
    createtradeButton.addEventListener('click', () => {
        createtradeModalContainer.classList.remove('fadeOut');
        createtradeModal.classList.remove('zoomOut');

        createtradeModalContainer.classList.add('active');
        createtradeModalContainer.classList.add('fadeIn');
        createtradeModal.classList.add('zoomIn');

        setTimeout(() => createtradeModalContainer.classList.add('animated-in'), 350);
    });

    /* close create a trade modal */
    const closeModal = () => {
        createtradeModalContainer.classList.remove('animated-in');
        createtradeModalContainer.classList.remove('fadeIn');
        createtradeModal.classList.remove('zoomIn');

        createtradeModalContainer.classList.add('fadeOut');
        createtradeModal.classList.add('zoomOut');

        setTimeout(() => createtradeModalContainer.classList.remove('active'), 350);
    };

    const closeModalBtn = document.querySelector('.create-trade-modal .close-button');
    closeModalBtn.addEventListener('click', closeModal);
    document.addEventListener('click', (e) => {
        if (e.target == createtradeModalContainer && createtradeModalContainer.classList.contains('animated-in')) {
            closeModal();
        }
    });
})();

// create trade modal functionality
(() => {
    const errorElm = document.querySelector('.create-trade-modal .error');

    // function to display error
    const displayError = (text) => {
        errorElm.innerText = text;
        if (!errorElm.classList.contains('active')) {
            errorElm.classList.add('active');
        }
    };

    const nameInputElm = document.querySelector('.create-trade-modal input[name=name]');
    const descriptionInputElm = document.querySelector('.create-trade-modal .input[name=description]');

    const createTradeBtnElm = document.querySelector('.create-trade-modal .button[name=create-trade]');

    createTradeBtnElm.addEventListener('click', async () => {
        name = nameInputElm.value;
        description = descriptionInputElm.value;

        const response = await fetch(SERVER_BASE + '/api/market/', {
            method: 'POST',
            headers: new Headers({
                Authorization: getAuthorizationHeader(),
                'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
                name,
                description,
            }),
        });

        switch (response.status) {
            case 200:
                fireDOMEvent(document.querySelector('.create-trade-modal .close-button'), 'click');
                displayOnNotifier('Trade Successfully Created');
                refreshLogAndNotifications();
                refreshMarketItems();
                break;
            case 401:
                displayError('Invalid Account Sign-In');
                break;
            case 400:
                const responseJSON = await response.json();
                displayError(responseJSON.errors.map((item) => item.msg).join('\n'));
                break;
            case 500:
                displayError('Server Error');
                break;
            default:
                displayError(`Unknown Error: Status ${response.status}`);
                console.log(await response.text());
        }
    });
})();

// tab functionality
(() => {
    // btn elms
    const activeTradesBtn = document.querySelector('.app > .tabselect > .tabbtn.active-trades');
    const completedTradesBtn = document.querySelector('.app > .tabselect > .tabbtn.completed-trades');
    const yourTradesBtn = document.querySelector('.app > .tabselect > .tabbtn.your-trades');
    const notificationsBtn = document.querySelector('.app > .tabselect > .tabbtn.notifications');
    const logBtn = document.querySelector('.app > .tabselect > .tabbtn.log');

    const appElm = document.querySelector('.app');

    const clearActiveTab = () => {
        appElm.classList.remove('active-trades');
        appElm.classList.remove('completed-trades');
        appElm.classList.remove('your-trades');
        appElm.classList.remove('notifications');
        appElm.classList.remove('log');
    };

    const btnClicked = (classname, noHash) => {
        clearActiveTab();
        appElm.classList.add(classname);

        if (noHash) return;

        // default is active trades tab
        if (classname == 'active-trades') {
            // remove hash
            // code taken from user Andy E from https://stackoverflow.com/questions/1397329/how-to-remove-the-hash-from-window-location-url-with-javascript-without-page-r
            history.pushState('', document.title, window.location.pathname + window.location.search);
        } else {
            window.location.hash = '#' + classname;
        }
    };

    activeTradesBtn.addEventListener('click', () => btnClicked('active-trades'));
    completedTradesBtn.addEventListener('click', () => btnClicked('completed-trades'));
    yourTradesBtn.addEventListener('click', () => btnClicked('your-trades'));
    notificationsBtn.addEventListener('click', () => btnClicked('notifications'));
    logBtn.addEventListener('click', () => btnClicked('log'));

    // hash functionality
    if (['active-trades', 'completed-trades', 'your-trades', 'notifications', 'log'].indexOf(window.location.hash.slice(1)) > -1) {
        btnClicked(window.location.hash.slice(1), true);
    } else {
        // default is active trades
        btnClicked('active-trades');
    }
})();

// log and notifications tab
const refreshLogAndNotifications = async () => {
    const username = getCredentials().username;

    const logTabElm = document.querySelector('.app > .tabs > .tab.log');
    const notificationsTabElm = document.querySelector('.app > .tabs > .tab.notifications');

    notificationsTabElm.innerHTML = `<h1 class="title">Notifications</h1>`;
    logTabElm.innerHTML = `<h1 class="title">Log</h1>`;

    const response = await fetch(SERVER_BASE + '/api/log/', {
        method: 'GET',
        headers: new Headers({
            Authorization: getAuthorizationHeader(),
            'Content-Type': 'application/x-www-form-urlencoded',
        }),
    });

    const log = await response.text();
    let logEntries = log.split('\n').filter((line) => line.length > 0);
    logEntries = logEntries.reverse();

    const notifications = [];

    // add momentjs date to each entry and add to notifications list if applicable
    logEntries.forEach((logEntry, index) => {
        const formattedDate = moment(logEntry.slice(logEntry.length - 24)).calendar();
        logEntries[index] = logEntry = { text: logEntry.slice(0, logEntry.length - 27), date: formattedDate };
        if (logEntry.text.indexOf(username) > -1) {
            notifications.push({
                text: logEntry.text /*.split(`"${username}"`).join('You')*/,
                date: logEntry.date,
            });
        }
    });

    const createEntryDOMElm = (entry) => {
        const curEntry = document.createElement('div');
        curEntry.classList.add('entry');

        const curEntryText = document.createElement('p');
        curEntryText.classList.add('text');
        curEntryText.innerText = entry.text;

        const curEntryDate = document.createElement('p');
        curEntryDate.classList.add('date');
        curEntryDate.innerText = entry.date;

        curEntry.appendChild(curEntryText);
        curEntry.appendChild(curEntryDate);

        return curEntry;
    };

    // loop through notifications and log entries and add
    logEntries.forEach((entry) => {
        logTabElm.appendChild(createEntryDOMElm(entry));
    });
    notifications.forEach((entry) => {
        notificationsTabElm.appendChild(createEntryDOMElm(entry));
    });
};

// display trades in correct boxes
const refreshMarketItems = async () => {
    const response = await fetch(SERVER_BASE + '/api/market/', {
        method: 'GET',
        headers: new Headers({
            Authorization: getAuthorizationHeader(),
            'Content-Type': 'application/x-www-form-urlencoded',
        }),
    });

    let marketItems = await response.json();
    marketItems = marketItems.reverse();

    // elm variables
    const activeTradesTabElm = document.querySelector('.app .tabs .active-trades');
    const completedTradesTabElm = document.querySelector('.app .tabs .completed-trades');
    const yourTradesTabElm = document.querySelector('.app .tabs .your-trades');

    activeTradesTabElm.innerHTML = `<h1 class="title">Active Trades</h1>`;
    completedTradesTabElm.innerHTML = `<h1 class="title">Completed Trades</h1>`;
    yourTradesTabElm.innerHTML = `<h1 class="title">Your Trades</h1>`;

    // generate market item box HTML
    const generateMarketItemHTML = (id, name, description, trader, date, sold, offers, winningOffer, hasOffer) => {
        let mainDate = moment(date).calendar();
        if (sold) {
            mainDate = 'Sold ' + moment(winningOffer.winDate).calendar();
        }

        let makeOfferHTML = '';
        if (!sold && trader != getCredentials().username) {
            let offerText = 'Make Offer';
            if (hasOffer) {
                offerText = 'Replace Existing Offer';
            }
            makeOfferHTML = `
            <div class='make-offer'>
                <h1>Make An Offer</h1>
                <p class="error"></p>
                <textarea spellcheck="false" placeholder="Enter offer content (what you're willing to give)" class="input"></textarea>
                <button class="button" onclick='makeOffer(this.parentElement, "${id}")'>${offerText}</button>
            </div>
            `;
        }

        let offersHTML = '';
        if (trader == getCredentials().username && !sold) {
            offersHTML = `<div class='offers'><h1 class='title'>Offers:</h1>`;
            offers.forEach((offer) => {
                offersHTML += `
                <div class='offer'>
                    <p class='date'>${moment(offer.date).calendar()}</p>
                    <p class='content'>${escapeHTML(offer.content).replace(/\n/g, '<br />')}</p>
                    <div class='bottom'>
                        <p class='buyer'>From ${escapeHTML(offer.buyer)}</p>
                        <button class='button accept' onclick='acceptOffer("${id}", "${offer.id}")'>Accept</button>
                    </div>
                </div>
                `;
            });
            if (offers.length <= 0) {
                offersHTML += "<p class='none-found'>No Offers Made Yet</p>";
            }
            offersHTML += '</div>';
        }

        let winningOfferHTML = '';
        if (sold && winningOffer) {
            winningOfferHTML = `
            <div class='winning-offer'>
                <h1 class='title'>Sold to <strong>${escapeHTML(winningOffer.buyer)}</strong> for:</h1>
                <p class='content'>${escapeHTML(winningOffer.content).replace(/\n/g, '<br />')}</p>
            </div>
            `;
        }

        return `
        <div class='market-item'>
            <p class='date'>${mainDate}</p>
            <div class='is-selling'>
                <h1 class='title'><img src='assets/img/profiles/${escapeHTML(trader)}.png' alt='Profile Picture' /><span class='text'>${escapeHTML(
            trader
        )} is selling:</span></h1>
                <p class='content'>${escapeHTML(name)}</p>
            </div>
            <div class='for'>
                <h1 class='title'>For:</h1>
                <p class='content'>${escapeHTML(description).replace(/\n/g, '<br />')}</p>
            </div>
            ${makeOfferHTML}
            ${offersHTML}
            ${winningOfferHTML}
        </div>
        `;
    };

    // loop through market items and display
    marketItems.forEach((item) => {
        if (item.sold) {
            // put in completed trades
            completedTradesTabElm.innerHTML += generateMarketItemHTML(
                item._id,
                item.name,
                item.description,
                item.trader,
                item.date,
                item.sold,
                item.offers,
                item.winningOffer,
                item.hasOffer
            );
        } else if (item.trader == getCredentials().username) {
            // put in your trades
            yourTradesTabElm.innerHTML += generateMarketItemHTML(
                item._id,
                item.name,
                item.description,
                item.trader,
                item.date,
                item.sold,
                item.offers,
                item.winningOffer,
                item.hasOffer
            );
        } else {
            // put in active trades
            activeTradesTabElm.innerHTML += generateMarketItemHTML(
                item._id,
                item.name,
                item.description,
                item.trader,
                item.date,
                item.sold,
                item.offers,
                item.winningOffer,
                item.hasOffer
            );
        }
    });
};

// make offer
const makeOffer = async (offerParentElm, marketId) => {
    const response = await fetch(`${SERVER_BASE}/api/market/${marketId}/offer`, {
        method: 'POST',
        headers: new Headers({
            Authorization: getAuthorizationHeader(),
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
            content: offerParentElm.querySelector('textarea').value,
        }),
    });

    if (response.status == 200) {
        displayOnNotifier('Offer Made Successfully');
        refreshLogAndNotifications();
        refreshMarketItems();
    } else {
        const errors = (await response.json()).errors;
        offerParentElm.querySelector('.error').innerText = errors.map((item) => item.msg).join('\n');
        offerParentElm.querySelector('.error').classList.add('active');
    }
};

// accept offer
const acceptOffer = async (marketId, offerId) => {
    const response = await fetch(`${SERVER_BASE}/api/market/${marketId}/winningoffer`, {
        method: 'POST',
        headers: new Headers({
            Authorization: getAuthorizationHeader(),
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
            offerId,
        }),
    });

    if (response.status == 200) {
        displayOnNotifier('Offer Accepted Successfully');
        refreshLogAndNotifications();
        refreshMarketItems();
    } else {
        const errorJSON = await response.json();
        alert(`An error occurred with the code ${response.status}. More info has been logged to the console.`);
        console.error(errorJSON);
    }
};

// start site
refreshLogAndNotifications();
refreshMarketItems();
