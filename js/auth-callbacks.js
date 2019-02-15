(() => {
    // app is launched in iframe and has errors in url
// most probably it is due to silent sign in attempt
    if (window.parent !== window) {
        if (Helpers.getHashParameters().error) {
            if (Helpers.getHashParameters().error === 'login_required') {
                (function(){
                    const settings = Helpers.getAuthSettings();
                    settings.loginRequired = true;
                    Helpers.saveAuthSettings(settings);
                })();
            }

            Auth.isSilent = true;

            return null;
        }

        if (Helpers.getAuthSettings() && Helpers.getAuthSettings().isSilent && !Helpers.getAuthSettings().isInIFrame) {
            (new Oidc.UserManager({
                userStore: new Oidc.WebStorageStateStore({store: window.localStorage})
            })).signinRedirectCallback().catch(err => {});
            Helpers.saveAuthSettings({isSilent: null});
            Auth.isSilent = true;
            return null;
        }
    }


    (function () {
        const url = window.location.href;
        const set = Helpers.getAuthSettings() || {}; // {page, isPopup, isLogOut}
        const manager = new Oidc.UserManager({
            userStore: new Oidc.WebStorageStateStore({store: window.localStorage})
        });

        const params = Helpers.getHashParameters();

        function clearHash() {
            window.setTimeout(function () {
                window.location.hash = '/';
            }, 100);
        }

        function closeWinAttempt() {
            window.setTimeout(function () {
                window.close();
            }, 300);
        }

        // logout for some reason uses search query instead of hashes
        // so handled separately
        // if (url.indexOf('state=') !== -1 && set.isLogOut) {
        if (set.isLogOut) {
            if (set.isPopup) {
                manager.signoutPopupCallback();
                closeWinAttempt();
            } else {
                manager.signoutRedirectCallback();
                clearHash();
            }

            Helpers.saveAuthSettings({page: set.page})
        }


        if (params.access_token && params.id_token) {
            if (set.isPopup) {
                manager.signinPopupCallback();
                closeWinAttempt();
            } else {
                manager.signinRedirectCallback();
                clearHash();

                // window.setTimeout(function () {
                //
                //     DGW.main.methods.showWidget(set.page);
                // }, 300);
            }

            Helpers.saveAuthSettings({page: set.page});
        }


        if (params.error) {
            switch (params.error) {
                // user is not logged in or token has to be obtained using UI
                case 'login_required':

                    break;
                // user has to grant permissions to the app to get be logged in
                case 'consent_required':

                    break;
                // user cancelled window or any other reason
                case 'access_denied':

                    break;
            }

            console.warn('Authorization error occurred', params.error);

            if (set.isPopup) {
                closeWinAttempt();
            } else {
                clearHash();
            }
            Helpers.saveAuthSettings({page: set.page})
        }
    }());

})();