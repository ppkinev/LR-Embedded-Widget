(() => {
    let lastLinkElement = $$('link')[$$('link').length - 1];
    let widgetStyles = document.createElement('link');
    let cssFile = 'style.min.css';
    widgetStyles.rel = 'stylesheet';
    widgetStyles.type = 'text/css';

    if (Auth.isSilent) return 'App is loaded in an iframe';

    Auth.checkApp(() => {
        widgetStyles.addEventListener('load', function () {
            const isExternalPush = Helpers.getURLParameter('externalpush');
            Api.getApp().then((res) => {
                if (res['IsActive']) {
                    Config.app = {
                        name: res['FoundationName'],
                        foundationUrl: res['FoundationRewardsSiteUrl'],
                        ssoTunnel: `${res['FoundationRewardsSiteUrl']}sso/tunnel`,
                        pushNotificationUrl: `${res['FoundationRewardsSiteUrl']}welcome/push`,
                        pushNotificationCookie: 'dg-notification-allowed'
                    };

                    let getFlow = function () {
                        let authorized = false;

                        let betting = true,
                            leaderBoard = true,
                            virtual = false,
                            excludeEntries = false,
                            oneQuestionOnly = true,
                            pushNotifications = false;

                        let cData = res['CustomData'];
                        if (res['CustomData']) {
                            if (cData['LoginFlow'] !== undefined) authorized = cData['LoginFlow'];
                            if (cData['NotificationFlow'] !== undefined) pushNotifications = cData['NotificationFlow'];
                            if (cData['OneQuestionOnly'] !== undefined) oneQuestionOnly = cData['OneQuestionOnly'];
                            if (cData['VirtualBetFlow'] !== undefined && cData['VirtualBetFlow'] !== null && cData['VirtualBetFlow'] !== 'off')
                                virtual = cData['VirtualBetFlow'];
                            if (cData['LeaderBoardFlow'] !== undefined) leaderBoard = cData['LeaderBoardFlow'];
                            if (cData['BettingFlow'] !== undefined) betting = cData['BettingFlow'];
                        }

                        // Check push notification rules
                        let browserIsSupported = !Helpers.isOS() && (Helpers.isSafari() || Helpers.isChrome());

                        // Browser support is checked on parent page
                        // then is sent in a post message to a widget class if isn't supported
                        if (isExternalPush === '1' && window.parent) browserIsSupported = true;

                        if (
                            Helpers.cookies.readCookie(Config.app.pushNotificationCookie)
                            || !browserIsSupported
                        ) {
                            if (pushNotifications) authorized = true;
                            pushNotifications = false;
                        }

                        return {
                            authorized, leaderBoard, virtual,
                            betting, oneQuestionOnly, pushNotifications,
                            excludeEntries
                        };
                    };

                    GA.init(Config.app.name).then(() => {
                        GA.pageView('-//holder_page');
                        App.currentPage = 'holder_page';
                    });
                    Config.app.widgetJustLoaded = true;
                    Object.assign(Flow, getFlow());
                    TrackElementsCountdown();
                } else {
                    console.warn('Widget is disabled');
                }
            }).catch();
        });

        switch (Config.SKIN) {
            case 'black':
                cssFile = 'styles-black.min.css';
            case 'mbet':
                cssFile = 'styles-mbet.min.css';
        }

        widgetStyles.href = Config.path + cssFile;
        Helpers.insertAfter(widgetStyles, lastLinkElement, $$('head'));
    });
})();