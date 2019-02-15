// looking for "drawid" url param for auto draw bet

(() => {
    'use strict';
    const ERR_CLASS = 'dg-error';
    const NO_USER = /not\sfound/;
    const HIDDEN_CLASS = 'dg-input-hidden';
    const SAFARI_FIX = 'dg-safarifix';


    const drawId = Helpers.getURLParameter('drawid');
    let drawToEnter = null;

    let userLoggedIn = function (widget, openWindow) {
        Api.getMe().then((user) => {
            User = user;
            widget.setUserEntries(() => {
                widget.changeState('betList');
            });
            if (UserMemory.bookmakerUrl && openWindow) {
                let w = window.open(UserMemory.bookmakerUrl, '_blank');
            }

            if (window.parent) {
                const url = (window.location !== window.parent.location)
                    ? document.referrer
                    : document.location.href;
                window.parent.postMessage('SP_LOGIN', url);
            }

            if (drawToEnter && User && User['IsEmailConfirmed']) {
                const points = User.Wallet.PointsConfirmed;
                if (points > 0) {
                    Api.drawBet(drawId, Math.min(points, 10)).then(() => {
                        widget.notificationShow([
                            `Congratulations, ${User.UserName}!`,
                            `You've entered the draw to win ${title}`, `${desc}`
                        ]);
                    });
                }
            }

            widget.notificationShow([`Hi, ${user.UserName}!`, `Now you can select the bet you want!`]);
        }).catch((err) => {
            widget.notificationShow(['You need to be logged in to make a bet'], 'error');
        });
    };

    Elements.login = function (widget) {
        const template = Mustache.to_html('@@import js/partials/login/login.mustache',
            {trophey: Components.Icons.trophey}
        );
        let page = Helpers.createEl('div', template);

        $$('.dg-fb-login', page).addEventListener('click', (ev) => {
            // Launch FB login
            Auth.triggerLogInFlow({
                isFB: true,
                callback: () => {
                    userLoggedIn(widget);
                }
            });
        });

        $$('.dg-email-login', page).addEventListener('click', (ev) => {

            Auth.triggerLogInFlow({
                callback: () => {
                    userLoggedIn(widget);
                }
            });

        });

        if (drawId) {
            const loginTitle = $$('.dg-title', page);
            const loginImage = $$('.dg-trophey', page);
            Helpers.getDrawInfo(drawId, (draw) => {
                if (draw.length > 0) {
                    const {Title: title, ImageUrl: image, Description: desc} = draw[0].Prize;
                    drawToEnter = {title, image, desc};
                    loginTitle.textContent = `Sign up with Facebook to have a chance to win ${title}`;

                    const imageEl = Helpers.createEl('img', `<img class="dg-trophey" src="${image}" alt="${title}" />`);
                    loginTitle[0].parentNode.insertBefore(imageEl, loginTitle[0]);
                    loginImage.style.set('display', 'none');
                }
            });
        }

        return page;
    };

})();