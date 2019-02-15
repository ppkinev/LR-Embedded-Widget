(() => {
    'use strict';
    const drawId = Helpers.getURLParameter('drawid');

    App.initExternalPushNotifications = (widget) => {
        let drawDetails = null;

        function waitForNotificationReply(message) {
            if (message.data) {
                if (message.data.type === 'PUSH_ALLOWED') {
                    const line = drawDetails
                        ? `Hooray! You've just increased your chances to win ${drawDetails.prizeTitle}!`
                        : 'Hooray! You\'ve just increased your chances to win!';
                    widget.notificationShow([line, 'We\'ll let you know when you become a winner!']);

                    // To block further push prompts
                    // as we know pushes are already allowed
                    Flow.pushNotifications = false;
                    widget.preventPushNotificationPrompts();
                    // ...
                    window.removeEventListener('message', waitForNotificationReply);
                }

                if (message.data.type === 'PUSH_DECLINED') {
                    widget.preventPushNotificationPrompts();
                    widget.notificationShow(['Enabling push notifications will significantly increase your bet journey'], 'error');
                    window.removeEventListener('message', waitForNotificationReply);
                }
            }
        }

        window.addEventListener('message', waitForNotificationReply);

        const sendEmptyPush = () => {
            window.parent.postMessage({type: 'SP_EXTERNAL_PUSH'}, '*');
        };

        if (drawId) {
            Helpers.getDrawInfo(drawId, (draw) => {
                if (draw.length > 0) {
                    const {Title: title, ImageUrl: image, Description: desc} = draw[0].Prize;
                    drawDetails = {
                        prizeImage: image,
                        prizeTitle: title
                    };
                    window.parent.postMessage({
                        type: 'SP_EXTERNAL_PUSH',
                        prizeImage: image,
                        prizeTitle: title
                    }, '*');
                } else {
                    sendEmptyPush();
                }
            });
        } else {
            sendEmptyPush();
        }
    };
})();

