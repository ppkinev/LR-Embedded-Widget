(() => {
    Elements.confirmEmail = function (widget, callback) {
        const template = Mustache.to_html('@@import js/partials/confirm-email/confirm-email.mustache');
        const page = Helpers.createEl('div', template);

        const btn = $$('.dg-btn', page);
        const holder = $$('#email-confirm', page);
        const holderSent = $$('#email-sent', page);

        btn.addEventListener('click', () => {
            Api.postVerifyEmail().then(() => {
                holder.style.set('display', 'none');

                holderSent.textContent = `Confirmation email was sent to ${User.Email}`;
                holderSent.style.set('display', 'block');
            });
        });

        if (callback) callback(page);
    };
})();