(() => {
    const authURLs = {
        everton: {
            live: 'https://everton.auth.rewarded.club',
            test: 'http://everton.auth-test.rewarded.club',
            dev: 'http://everton.auth.localhost:5001'
        },
        mancity: {
            live: 'https://mancity.auth.rewarded.club',
            test: 'http://mancity.auth-test.rewarded.club',
            dev: 'http://mancity.auth.localhost:5001'
        },
        qpr: {
            live: 'https://qpr.auth.rewarded.club',
            test: 'http://qpr.auth-test.rewarded.club',
            dev: 'http://qpr.auth.localhost:5001'
        }
    };

    const prolongClientToken = function (expires_in, endpoint) {
        const THRESHOLD = 30;
        const checkIn = expires_in > THRESHOLD ? expires_in - THRESHOLD : expires_in;

        userManager.getUser().then(function (user) {
            if (!user) {
                const timeout = window.setTimeout(function () {
                    window.clearTimeout(timeout);
                    getClientToken(endpoint);
                }, checkIn * 1000);
            }
        });
    };

    const getClientToken = function (endpoint, callback) {
        const data = Qs.stringify({
            grant_type: 'client_credentials',

            client_id: Config.apiKey, // should be taken from the data-attribute or api

            scope: 'coreapi_full'
        });

        axios({url: endpoint, method: 'post', data: data})
            .then(function (response) {
                console.info('Getting client access token');
                const access_token = response.data.access_token;
                const token_type = response.data.token_type;
                const expires_in = response.data.expires_in;

                Helpers.saveAccessToken(token_type + ' ' + access_token);

                prolongClientToken(expires_in, endpoint);
                if (callback) callback();
            })
            .catch(function (error) {
                console.warn('Failing client access token');
                console.warn(error);
            });
    };

    const initClientTokenFn = function (authURL, callback) {
        const configURL = authURL + '.well-known/openid-configuration';

        axios({url: configURL}).then(function (response) {
            console.info('Getting URL for obtaining client access token');
            getClientToken(response.data.token_endpoint, callback);
        }).catch(function (error) {
            console.warn('Failing getting URL for client access token');
            console.warn(error);
        });
    };

    const initUserManager = function (authURL, callback) {
        let callbackURI = window.location.origin;
        console.info('OpenID callbackURI', callbackURI);

        if (callbackURI.indexOf('localhost') !== -1) callbackURI = 'http://localhost/spr-everton';

        userManager = new Oidc.UserManager({
            authority: authURL,
            client_id: Config.apiKey, // should be taken from the data-attribute or api
            redirect_uri: callbackURI, // on successful login getting back to the same page
            silent_redirect_uri: callbackURI, // trying same URI to fetch silent token renewal
            response_type: 'id_token token',
            scope: 'openid coreapi_full',
            post_logout_redirect_uri: callbackURI, // getting back to the same page on logout

            // setting local storage as default user storage
            userStore: new Oidc.WebStorageStateStore({store: window.localStorage}),

            // should automatically renew the token using silent redirect page
            // check it, if not working, do this logic yourself
            automaticSilentRenew: true
        });

        const tokenEvents = new Oidc.AccessTokenEvents();
        tokenEvents.addAccessTokenExpired(function () {
            console.log('TOKEN expired')
        });

        userManager.events.addUserSignedOut(function () {
            userManager.removeUser();


            // TODO:
            // DGW.global.methods.unAuthorize();
            // DGW.main.methods.changeMainState('profile');
        });

        if (Helpers.getAuthSettings() && Helpers.getAuthSettings().loginRequired) {
            userManager.removeUser();
        }

        window.userManager = userManager;

        // it uses authorization server to sign in in the background
        // if user logged in using other app
        // catch is needed as this shit always throws an error
        // right after retrieving the result
        Helpers.saveAuthSettings({isSilent: callbackURI, isInIFrame: window !== window.parent});


        userManager.signinSilent().catch(function (err) {

        });

        // wrapping with a timeout to make sure that signinSilent will be able to finish its job
        window.setTimeout(function () {
            if (callback) callback();
        }, 1000);
    };

    // public API call to retrieve auth server address
    function dummyPublicAPICall(callback) {
        let authURL = authURLs.everton.live; // get this from the public API

        switch (Config.platform) {
            case 'test':
                authURL = authURLs.everton.test;
                break;
            case 'local':
                authURL = authURLs.everton.dev;
        }

        if (authURL[authURL.length - 1] !== '/') authURL += '/';

        if (callback) callback(authURL);
    }

    // Is fired if no user on startup or user has logout
    const checkApp = function (callback) {
        dummyPublicAPICall(function (authURL) {
            initUserManager(authURL, function () {
                initClientTokenFn(authURL, callback);
            });
        });
    };

    function onSuccessLogIn(response, callback) {
        if (callback) callback(response);
    }

    function onSuccessLogOut(response, callback) {
        if (callback) callback(response);
    }

    // var popupSettings = 'menubar=no,location=no,resizable=no,scrollbars=yes,status=no, width=200, height=200, top=0, left=0';
    const getPopupSettings = function (params) {
        const w = params.w;
        const h = params.h;

        const width = w || 480;
        const height = h || 750;

        const top = screen.height / 2 - height / 2;
        const left = screen.width / 2 - width / 2;


        const popupSettings = 'menubar=no,location=no,resizable=no,scrollbars=yes,status=no, ' +
            'width=' + width + ', ' +
            'height=' + height + ', ' +
            'top=' + top + ', ' +
            'left=' + left;

        return popupSettings;
    };

    const triggerLogInFlow = function ({page, isFB, callback}) {
        const signinRequestArgs = {};

        if (isFB) signinRequestArgs.acr_values = 'idp:facebook';
        if (!isMobile.any) signinRequestArgs.popupWindowFeatures = getPopupSettings({w: 480, h: 750, isCentered: true});

        if (isMobile.any) {
            // for mobile
            Helpers.saveAuthSettings({page: page});

            userManager.signinRedirect(signinRequestArgs)
                .then(function (response) {
                    onSuccessLogIn(response, callback);
                })
                .catch(function (err) {
                    console.warn('OpenID redirect error', err);
                });
        } else {
            // for desktop
            Helpers.saveAuthSettings({page: page, isPopup: true});

            userManager.signinPopup(signinRequestArgs)
                .then(function (response) {
                    onSuccessLogIn(response, callback);
                })
                .catch(function (err) {
                    userManager.getUser().then(user => {
                        if (user) onSuccessLogIn(user, callback)
                        else console.warn('OpenID popup error', err);
                    });
                });
        }
    };

    const triggerLogOutFlow = function (page, callback) {
        if (isMobile.any) {
            // for mobile
            Helpers.saveAuthSettings({page: page, isLogOut: true});

            userManager.signoutRedirect()
                .then(function (response) {
                    onSuccessLogOut(response, callback);
                })
                .catch(function (err) {
                    console.warn('OpenID redirect error', err);
                });
        } else {
            // for desktop
            Helpers.saveAuthSettings({page: page, isPopup: true, isLogOut: true});

            userManager.signoutPopup({
                popupWindowFeatures: getPopupSettings({w: 780, h: 450, isCentered: true})
            })
                .then(function (response) {
                    onSuccessLogOut(response, callback);
                })
                .catch(function (err) {
                    console.warn('OpenID popup error', err);
                });
        }
    };

    Auth.checkApp = checkApp;
    Auth.triggerLogInFlow = triggerLogInFlow;
    Auth.triggerLogOutFlow = triggerLogOutFlow;
})();