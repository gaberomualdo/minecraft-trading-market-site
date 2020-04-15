// elm variables
const formElm = document.querySelector('.signin-form');
const usernameInputElm = document.querySelector('.signin-form > input[name=username]');
const pinInputElm = document.querySelector('.signin-form > input[name=pin]');
const errorElm = document.querySelector('.signin-form > p.error');

// function to display error
const displayError = (text) => {
    errorElm.innerText = text;
    if (!errorElm.classList.contains('active')) {
        errorElm.classList.add('active');
    }
};

formElm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setCredentials(usernameInputElm.value, pinInputElm.value);

    const authResponse = await verifyCredentials();

    switch (authResponse) {
        case 'accepted':
            window.open('app.html', '_self');
            break;
        case 'denied':
            displayError('Invalid Username or Pin');
            break;
        case 'servererror':
            displayError('Server Error');
            break;
        case 'credentialsnotfound':
        case undefined:
            displayError('Internal Error');
            break;
    }
});
