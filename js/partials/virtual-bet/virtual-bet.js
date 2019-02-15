(() => {
    Elements.virtualBet = function (widget, odds, callback, intermidiateOnSuccess) {
        let singles = odds.singles;
        let accumulatedOdd = odds.accumulatedOdd;
        let error = odds.err && odds.err.error;

        let buildVirtualBetPanel = function (props) {
            const {title, icon, question, odds, ids, onSuccess} = props;
            const template = Mustache.to_html('@@import js/partials/virtual-bet/virtual-bet-single.mustache', {
                title, icon, question,
                betSlider: '@@import js/components/bet-slider/bet-slider.mustache'
            });
            const page = Helpers.createEl('div', template);

            const isPointsBet = Flow.virtual === 'points';
            const currency = isPointsBet ? 'points' : 'credits';

            const slider = new Components.BetSlider({
                holder: $$('.dg-bet-holder', page)[0],
                odds: odds,
                max: isPointsBet ? User.Wallet.PointsConfirmed : User.Wallet.CreditsConfirmed,
                currency
            });
            const btn = $$('.dg-btn.dg-branded', page);
            const makeBet = isPointsBet ? Api.makePointsBet : Api.makeCreditsBet;
            btn.addEventListener('click', (ev) => {
                // Do the betting flow
                if (slider.getValue() && slider.getValue() !== '0') {
                    btn[0].setAttribute('disabled', 'disabled');
                    makeBet(NextMatch.MatchId, slider.getValue(), ids).then((res) => {
                        User.Wallet = res['User']['Wallet'];
                        if (onSuccess) onSuccess();
                    }).catch((err) => {
                        btn[0].removeAttribute('disabled');
                        widget.notificationShow(Helpers.errorParser(err.error).messages, 'error');
                    });
                } else {
                    widget.notificationShow([`Add some ${currency} to make a bet`], 'error');
                }
            });

            // Change slider to text field if needed
            const swapSlider = window.location.href.indexOf('evertonfc.com') !== -1;
            if (!isMobile.any && swapSlider) {
                $$('.dg-bet-slider', page).style.set('display', 'none');
                $$('.dg-bet-slider.dg-bet-slider-text', page).style.set('display', 'block');
            }

            return page;
        };

        let buildPage = function (betOptions, errors) {
            const template = Mustache.to_html('@@import js/partials/virtual-bet/virtual-bet.mustache', {
                betSlider: '@@import js/components/bet-slider/bet-slider.mustache',
                error: errors ? {errors} : null
            });
            let page = Helpers.createEl('div', template);
            let holder = $$('.dg-virtual-bet-holder', page);

            function succesfullBet(){
                page.style.display = 'none';
                widget.notificationShow(['Well done!', 'We\'ll let you now on the results.', 'Till then you can bet on other matches']);

                if (intermidiateOnSuccess) intermidiateOnSuccess();
            }

            if (!errors) {

                if (betOptions.accumulated) holder.appendChild(buildVirtualBetPanel(Object.assign(betOptions.accumulated, {onSuccess: succesfullBet})));
                if (betOptions.singles) {
                    betOptions.singles.forEach((single) => {
                        single.onSuccess = succesfullBet;
                        holder.appendChild(buildVirtualBetPanel(single));
                    });
                }

                $$('.dg-edit', page).addEventListener('click', () => {
                    widget.reload();
                    Config.app.newMatch = false;
                });

                $$('.dg-next', page).addEventListener('click', () => {
                    GA.event('Navigation', 'Exit Match Quiz', `Next Fixture Click=${NextMatch['MatchId']}`);
                    App.reloadWidgetsWithNextMatch();
                    Config.app.newMatch = true;
                });

            } else {
                let btn = $$('.dg-btn.dg-error', page);
                btn.addEventListener('click', (ev) => {
                    widget.reload();
                    widget.clearOutcomes();
                });
            }

            if (callback) callback(page);
        };

        if (error) {
            let invalid = JSON.parse(error)['InvalidOutcomeIds'];
            let questions = [];
            if (invalid) {
                invalid.forEach((id) => {
                    widget.getOutcomes().forEach((o) => {
                        if (o.id === id) questions.push(o.question);
                    });
                });
            }
            if (questions.length > 0) {
                buildPage(null, questions);
            }
        } else {
            let betOptions = {
                accumulated: accumulatedOdd ? {
                    title: 'Make a scorecast bet',
                    odds: accumulatedOdd,
                    ids: widget.getOutcomes().map((o) => o.id)
                } : null,
                singles: widget.getOutcomes().map((o) => {
                    singles.forEach((s) => {
                        if (s['OutcomeId'] === o.id) o.odds = s['Odds'];
                    });
                    o.ids = [o.id];
                    return o;
                })
            };
            buildPage(betOptions);
        }
    };
})();