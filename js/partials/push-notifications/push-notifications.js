(() => {
    'use strict';

    const drawId = Helpers.getURLParameter('drawid');
    let drawToEnter = null;

    Elements.pushNotification = function (parent, widget) {
        const template = Mustache.to_html('@@import js/partials/push-notifications/push-notifications.mustache', {
            notificationIcon: Components.Icons.notification
        });
        let page = Helpers.createEl('div', template);

        let hidePage = function () {
            $$(page).addClass('dg-hide');
            window.setTimeout(() => {
                if (page.parentNode === parent) {
                    parent.removeChild(page);
                }
            }, 310);
        };

        let enable = $$('.dg-btn.dg-branded', page),
            cancel = $$('.dg-btn.dg-white', page);

        cancel.addEventListener('click', () => {
            hidePage();
            widget.preventPushNotificationPrompts();
            widget.notificationShow(['Enabling push notifications will significantly increase your bet journey'], 'error');
        });

        enable.addEventListener('click', () => {
            let win = Helpers.centerWindowPopup(Config.app.pushNotificationUrl, 'Push', 800, 500, true);
            // let path = `${window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1)}push.html`;
            // let win = Helpers.centerWindowPopup(path, 'Push', 800, 500, true);
            function waitForNotificationReply(message) {
                if (
                    message.origin.indexOf(Config.app.foundationUrl) !== -1
                    || Config.app.foundationUrl.indexOf(message.origin) !== -1
                ) {
                    if (message.data === 'ALLOW') {
                        window.setTimeout(() => {
                            Helpers.cookies.createCookie(Config.app.pushNotificationCookie, 'allowed', 120);
                            widget.notificationShow(['Well done!', 'We\'ll let you know when the next matches start!']);
                            window.removeEventListener('message', waitForNotificationReply);
                            widget.preventPushNotificationPrompts();
                        }, 450);

                        win.close();
                        hidePage();
                    } else if (message.data === 'DENIED') {
                        window.setTimeout(() => {
                            widget.notificationShow(['Enabling push notifications will significantly increase your bet journey'], 'error');
                            window.removeEventListener('message', waitForNotificationReply);
                            widget.preventPushNotificationPrompts();
                        }, 450);
                        win.close();
                        hidePage();
                    }
                }
            }

            window.addEventListener('message', waitForNotificationReply);
        });

        if (drawId) {
            const loginTitle = $$('.dg-notification-title', page);
            const loginImage = $$('.dg-notification-icon', page);
            Helpers.getDrawInfo(drawId, (draw) => {
                if (draw.length > 0) {
                    const {Title: title, ImageUrl: image, Description: desc} = draw[0].Prize;
                    drawToEnter = {title, image, desc};
                    loginTitle.textContent = `Allow push notifications to have a chance to win ${title}`;

                    const imageEl = Helpers.createEl('img', `<img class="dg-notification-icon" src="${image}" alt="${title}" />`);
                    loginTitle[0].parentNode.insertBefore(imageEl, loginTitle[0]);
                    loginImage.style.set('display', 'none');
                }
            });
        }

        return page;
    };
})();