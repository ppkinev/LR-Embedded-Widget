(() => {
    Elements.betList = function (widget) {
        const template = Mustache.to_html('@@import js/partials/bet-list/bet-list.mustache');
        let page = Helpers.createEl('div', template);

        if (widget.getDimensions().width <= Config.SMALL_SCREEN) {
            $$(page).addClass(Config.SMALL_SCREEN_CLASS);
        }

        let matchWasPlayed = widget.getUserEntries().some((e) => {
            return NextMatch['MatchId'] === e;
        });

        let getProperUserWallet = function (user) {
            if (!user) return 0;
            return Number(Helpers.numToFixed(user.Wallet.CreditsConfirmed));
        };

        let addVirtualPanel = function (odds) {
            let liveMatch = NextMatch['StartDateTimecode'] - Date.now() <= 0;

            // Triggering auto redirect to the next match
            // if user made a bet and no main betting available
            const intermidiateRedirect = !(Flow.virtual && !Flow.betting) ? null :
                () => {
                    window.setTimeout(function () {
                        App.reloadWidgetsWithNextMatch(widget.getTeam());
                    }, 1000);
                };

            if (
                Flow.virtual
                && User && getProperUserWallet(User) > 0
                && !NextMatch['MatchEntry']
                && NextMatch['IsOpenForBetting']
                && !liveMatch
                && !matchWasPlayed
            ) {
                Elements.virtualBet(widget, odds,
                    (virtualBetPage) => {
                        page.appendChild(virtualBetPage);
                    },
                    intermidiateRedirect
                );
            }

            // Triggering auto redirect to the next match
            // if user has no points for virtual flow
            if (
                Flow.virtual
                && !Flow.betting
                && User && getProperUserWallet(User) === 0
            ) {
                window.setTimeout(function () {
                    App.reloadWidgetsWithNextMatch(widget.getTeam());
                }, 1000);
            }
        };

        let checkClickCookie = function () {
            let bookmaker = Helpers.cookies.readCookie(GA.betClick);
            if (bookmaker) {
                GA.event('Navigation', 'Back from Outside', `Back from ${bookmaker}`);
                Helpers.cookies.eraseCookie(GA.betClick);
            }
        };

        let matchId = NextMatch.MatchId;
        let outcomes = widget.getOutcomes().map((o) => o.id);

        function initBetPage(odds) {
            let singles = odds['OutcomeOdds'];
            let accumulatedOdd = odds['ScorecastOdds'];

            if (Flow.betting) {
                Api.getBetList(matchId, outcomes).then((data) => {
                    let bookmakers = data.Bookmakers;

                    bookmakers.forEach((b) => {
                        b['Odds'] = JSON.parse(JSON.stringify(singles));

                        b['Odds'].forEach((o) => {
                            let same = widget.getOutcomes().filter((outcome) => outcome.id === o['OutcomeId'])[0];
                            Object.assign(o, same);

                            let odd = o['Odds'];
                            let min = b['MinimumBet'];
                            let freeBet = b['FreeBet'];

                            o.gaName = b['Name'];
                            o.url = b['BetSlipUrl'];
                            o.cta = `A £${min} bet Wins £${((min + freeBet) * odd).toFixed(0)}`;
                        });

                        b['Odds'].sort((a, b) => {
                            let aOdd = a['Odds'];
                            let bOdd = b['Odds'];

                            return bOdd - aOdd;
                        });
                    });

                    page.innerHTML = Mustache.to_html('@@import js/partials/bet-list/bet-panels.mustache', bookmakers);

                    activateConfirmEmailPanel();

                    $$('[data-url]', page).addEventListener('click', (ev) => {
                        let name = ev.currentTarget.getAttribute('data-ga-name');
                        UserMemory.bookmakerUrl = ev.currentTarget.getAttribute('data-url');
                        // if (Flow.authorized && !User) {
                        // 	if (widget) widget.changeState('login');
                        // } else {
                        let w = window.open(UserMemory.bookmakerUrl, '_blank');
                        if (window.focus) w.focus();
                        // }

                        checkClickCookie();
                        GA.event('Navigation', 'Go Outside', `Bet with ${name} - ${$$('.dg-choice-answer',
                            ev.currentTarget).innerText}=${NextMatch['MatchId']}`);
                        let newPage = `bookmaker_${name.replace(/\s*/g, '')}=${NextMatch['MatchId']}`;
                        GA.pageView(`${App.currentPage}//${newPage}`);
                        App.currentPage = newPage;

                        Helpers.cookies.createCookie(GA.betClick, name);
                    });

                    $$('.dg-edit', page).addEventListener('click', () => {
                        checkClickCookie();
                        widget.reload();
                        Config.app.newMatch = false;
                    });

                    $$('.dg-next', page).addEventListener('click', () => {
                        checkClickCookie();
                        GA.event('Navigation', 'Exit Match Quiz', `Next Fixture Click=${NextMatch['MatchId']}`);
                        App.reloadWidgetsWithNextMatch();
                        Config.app.newMatch = true;
                    });

                    addVirtualPanel({singles, accumulatedOdd});

                }).catch((err) => {
                    // Refactor later
                    Elements.virtualBet(widget, {err}, (virtualBetPage) => {
                        page.appendChild(virtualBetPage);
                    });
                });
            } else {
                addVirtualPanel({singles, accumulatedOdd});
            }
        }

        function activateConfirmEmailPanel() {
            //...
            // Adding confirmation email panel, if needed
            if (Flow.virtual && User && !User['IsEmailConfirmed']) {
                Elements.confirmEmail(widget, (confirmEmail) => {
                    page.insertBefore(confirmEmail, page.children[0]);
                });
            }
        }

        activateConfirmEmailPanel();


        Api.getOdds(matchId, outcomes).then((odds) => {
            initBetPage(odds);
        }).catch((err) => {

            // Refactor later
            Elements.virtualBet(widget, {err}, (virtualBetPage) => {
                page.appendChild(virtualBetPage);
            });
        });


        if (Flow.pushNotifications && widget.isPushNotificationsToShow()) {
            window.setTimeout(() => {
                widget.showPushNotificationPage();
            }, 500);
        }

        // Prediction happens here
        if (User && widget.getOutcomes().length && !widget.getPredicted() && !matchWasPlayed && NextMatch['IsOpenForBetting']) {
            Api.makePrediction(NextMatch.MatchId, widget.getOutcomes().map(o => o.id)).then((res) => {
                const successMessage = ['We\'ve got your prediction'];
                if (getProperUserWallet(User) > 0 && Flow.virtual) successMessage.push('Now bet something!');

                widget.notificationShow(successMessage, 'success');
            }).catch((err) => {
                widget.notificationShow(Helpers.errorParser(err.error).messages, 'error');
            });
        }

        let newPage = `prediction_bet=${NextMatch['MatchId']}`;
        GA.pageView(`${App.currentPage}//${newPage}`);
        App.currentPage = newPage;

        return page;
    };
})();