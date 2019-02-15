class Widget {
	constructor(holder) {
		this._Holder = holder;
		this._questions = [];
		this._isSmallestScreen = null;
		let matchInterval;
		let defaultImage = Config.defaultImage;
		this._team = holder.getAttribute('data-team') || '';
		this.isLeaderboardShown = !(holder.getAttribute('data-leaderboard') && holder.getAttribute('data-leaderboard') === 'off');
		this.isFitHeight = holder.getAttribute('data-fit') && holder.getAttribute('data-fit') === 'true';

		this._pushNotificationWasCancelled = false;

		// checking URL parameter to know
		// if the flow contains push notifications in the parent window
		this._isExternalPush = Helpers.getURLParameter('externalpush') === '1';

		switch (holder.getAttribute('data-default-image')) {
			case 'ronaldo7':
                defaultImage = Config.path + 'imgs/ronaldo7-logo.svg';
				break;
			case 'everton':
                defaultImage = Config.path + 'imgs/everton-logo.png';
				break;
			case 'mbet':
				defaultImage = Config.path + 'imgs/mbet-logo.png';
		}

		// TODO:
		// 1. Make NEXTMatch and matchesLoaded local to widget instance, not global

		this._outcomes = [];
		this._predicted = false;
		this._userEntries = [];

		this._defaultImage = defaultImage;
		this._Holder.appendChild(Elements.widgetPlaceholder(defaultImage));

		let launchMatchesFlow = () => {
			Matches.getNextMatch({
				team: this._team,
				matchesLoaded: Config.matchesLoaded,

				// if no real betting, get only matches that weren't played yet
				// with real betting can use any matches
                notPlayed: !Flow.betting
			}).then((match) => {
				NextMatch = match;
				Config.matchesLoaded++;
				if (!this.isMatchAvalableForUser()) {
                  launchMatchesFlow();
				} else {
                    if (Helpers.isEmptyObj(match['Questions'])) {
                        // no questions yet for the match
                        this.notificationShow(['New matches will be available soon.'], 'error');
                    } else {
                        this.setQuestionsList(match['Questions']);
                        this._init();
                    }
				}
			}).catch((err) => {
                // this._init_login_test();
                if (err === 404) {
                    this.fitHeightToHolder();
                	this.notificationShow(['New matches will be available soon.'], 'error');
                }
			});
		};

		if (App.widgets.length === 0) {
			userManager.getUser().then((user) => {
				if (user) {
                    Api.getMe().then((user) => {
                        this.setUserEntries();
                        User = user;
                        if (Config.platform === 'test') App.user = User;
                        launchMatchesFlow();
                    }).catch(() => {
                        launchMatchesFlow();
                    });
				} else {
                    launchMatchesFlow();
				}
			});

		} else {
			matchInterval = window.setInterval(() => {
				if (NextMatch) {
					window.clearInterval(matchInterval);
					this._init();
				}
			}, 100);
		}

		if (window.parent) {
            window.parent.postMessage({type: 'SP_WIDGET_STARTED'}, '*');

            if (this._isExternalPush) {
                window.addEventListener('message', (message) => {
                    if (message.data) {
                        if (message.data.type === 'PUSH_ALLOWED_ON_START') {
                            Flow.pushNotifications = false;
                            Flow.authorized = true;
                        }

                        if (message.data.type === 'PUSH_NOT_SUPPORTED') {
                            Flow.pushNotifications = false;
                            Flow.authorized = true;
                        }
                    }
                });
            }
        }
	}

	_init_login_test() {
        this._Holder.innerHTML = '';
        this._Holder.appendChild(Elements.core());
        this._body = $$('.dg-embedded-widget', this._Holder)[0];
        this.changeState('login');
	}

	_init() {
		this._Holder.innerHTML = '';
		this._Holder.appendChild(Elements.core());
		this._body = $$('.dg-embedded-widget', this._Holder)[0];
		this._currentState = this._questions[0];
		this.changeState(this._currentState);
		let showLeaderboard = (players) => {
			let leaderBoardPage = Elements['leaderBoard'](players, this);
			this._body.appendChild(leaderBoardPage);
			window.setTimeout(() => {
				this.fixSmallestScreen(leaderBoardPage);
			}, 0);
		};

		if (Flow.leaderBoard && this.isLeaderboardShown) { // if LEADERBOARDS
			if (!App.topPlayers) {
				Api.getLeaderboard().then((data) => {
					App.topPlayers = data.Players;
					if (App.topPlayers.length) showLeaderboard(App.topPlayers);
				}).catch();
			} else {
                if (App.topPlayers.length) showLeaderboard(App.topPlayers);
			}
		}
	}

	_getNextState() {
		let state = null;
		let curState = this._questions.indexOf(this._currentState);
		if (curState !== -1) {
			if (curState === this._questions.length - 1) {
				// Last question
				if (Flow.authorized && !User) state = 'login';
				else state = 'betList';
			} else {
				state = ++curState;
				state = this._questions[state];
			}
			return state;
		}
		return null;
	}

	_getPreviousState() {
		let state = null;
		let curState = this._questions.indexOf(this._currentState);
		if (curState !== -1) {
			if (curState === 0) {
				// Last question
				state = this._questions[0];
			} else {
				state = --curState;
				state = this._questions[state];
			}
			return state;
		}
		return null;
	}

	el() {
		return $$('.dg-embedded-widget-holder', this._Holder)[0];
	}

	pageClose() {
		if (this.el().children[0]) {
			$$(this.el().children[0]).addClass('dg-hide');
			window.setTimeout(() => {
				this.el().removeChild(this.el().children[0]);
			}, 200);
		}
	}

	checkState(state, callback) {
		if (!state || state === 'next') state = this._getNextState();
		if (state === 'back') {
			Config.app.backBtn = true;
			state = this._getPreviousState();
		}
		if (state === null) throw 'Null state is not allowed (use named state outside of questions)';

		if (state === 'login' && !User) {
			userManager.getUser().then(user => {
				if (user) {
                    Api.getMe().then((user) => {
                        User = user;
                        this.getUserEntries();
                        callback(this._getNextState());
                    }).catch((err) => {
                        callback(state);
                    });
				} else {
                    callback(state);
				}
			});

		} else {
			callback(state);
		}
	}

	changeState(state) {
		let page, fullHeightPage = false;

		this.checkState(state, (state) => {
			this._currentState = state;
			this.pageClose();
			page = Elements[state](this);
			if (state !== 'selectScore' && state !== 'virtualBet' && state !== 'whoWillWin') {
				fullHeightPage = true;
			}
			this.el().appendChild(page);
			window.setTimeout(() => {
				this.fixSmallestScreen(page, fullHeightPage);
			}, 0);

            this.fitHeightToHolder();
		});
	}

	fitHeightToHolder(){
        if (this.isFitHeight) {
            $$(this._Holder).addClass('fit-height');
        }
	}

	reload() {
		this.changeState(this._questions[0]);
		this._outcomes = [];
	}

	showPlaceholder() {
		this._Holder.innerHTML = '';
		this._Holder.appendChild(Elements.widgetPlaceholder(this._defaultImage));
	}

	notificationShow(lines, type) {
		new Components.Notification($$(this._Holder), lines, type);
	}

	getOutcomes() {
		return this._outcomes;
	}

	addOutcome(id) {
		this._outcomes.push(id);
	}

	clearOutcomes() {
		this._outcomes = [];
		this._predicted = false;
	}


	getPredicted() {
		return this._predicted;
	}

	setPredicted() {
		this._predicted = true;
	}

	getUserEntries() {
		return this._userEntries;
	}

	setUserEntries(callback) {
		Api.getUserEntries().then((res) => {
			this._userEntries = res['MatchQuizEntries'].reduce((acc, e) => {
				if (e['BetAmount'] || e['CreditsBetAmount']) {
					acc.push(e['MatchId']);
				}
				return acc;
			}, []);
			if (callback) callback();
		});
	}

	removeLastOutcome() {
		this._outcomes.splice(this._outcomes.length - 1, 1);
	}

	getTeam() {
		return this._team;
	}

	showPushNotificationPage() {
		if (this._isExternalPush && window.parent) App.initExternalPushNotifications(this);
		else this._body.appendChild(Elements.pushNotification(this._body, this));
	}

	getDimensions() {
		return this._Holder.getBoundingClientRect();
	}

	isFixedHeightHolder() {
		if (this._isSmallestScreen === null) {
			let leaderBoard = (Flow.leaderBoard && User) ? 100 : 0;
			this._isSmallestScreen = this._Holder.getBoundingClientRect().height - this.el().getBoundingClientRect().height - leaderBoard < 0;
		}
		return this._isSmallestScreen;
	}

	evertonSlider() {
		let currentEl = this._Holder;
		let evertonSlider = false;
		for (let i = 0; i < 5; i++) {
			if (currentEl.tagName === 'HTML') break;
			if (Array.prototype.slice.call(currentEl.classList).indexOf('InnerPanel') !== -1) {
				evertonSlider = currentEl;
				break;
			} else {
				currentEl = currentEl.parentNode;
			}
		}

		return evertonSlider;
	}

	getFullHeight() {
		let shift = 20;
		if (Config.SKIN === 'black') shift = 0;
		return this.getDimensions().height - shift + 'px';
	}

	fixSmallestScreen(page, fullHeight) {
		let slider = this.evertonSlider();
		if (slider && window.innerHeight < 850 && !isMobile.any) {
			let maxHeight = slider.getBoundingClientRect().height - 56 + 'px';
			let holderInner = this._Holder.querySelector('.dg-embedded-widget');
			$$(page).addClass('dg-no-logo');

			// Adding specific height to widget holder to reveal scroll if needed
			holderInner.style.height = maxHeight;
			$$(holderInner).addClass('dg-everton-slider');
		}

		// Removing shadows from panels, to make solid white version
		// Comment this part if panels are needed, also comment same part in the leaderboards
		if (slider && !isMobile.any) {
			$$(page).addClass('dg-no-shadows');
		}
		// End of no panels version
	}

	getImage() {
		return this._defaultImage;
	}

    isMatchAvalableForUser() {
        const isOnlyVirtualFlow = Flow.virtual && !Flow.betting;
        const isUpcoming = !NextMatch['IsEnded'];
        const isOpenForBetting = NextMatch['IsOpenForBetting'];
        const matchWasPlayed = this.getUserEntries().some((e) => {
            return NextMatch['MatchId'] === e;
        });

		if (isOnlyVirtualFlow) {
			return isUpcoming && isOpenForBetting && !matchWasPlayed;
		}

		return isUpcoming;
    }

	setQuestionsList(questions) {
		//  CorrectScore  FirstGoalScorer  FirstHalfResult  MatchResult
		this._questions = [];
		if (questions['FirstHalfResult']) this._questions.push('whoWillWin');
		if (questions['CorrectScore']) this._questions.push('selectScore');
		if (questions['FirstGoalScorer']) this._questions.push('goalScorer');

		if (Flow.oneQuestionOnly) this._questions = ['selectScore'];
	}

	preventPushNotificationPrompts() {
        this._pushNotificationWasCancelled = true;
	}

	isPushNotificationsToShow() {
		return !this._pushNotificationWasCancelled;
	}
}

App.reloadWidgetsWithNextMatch = function (team) {
	Matches.clearNextMatch();
	Matches.getNextMatch({
		team: App.widgets[0].getTeam(),
		matchesLoaded: Config.matchesLoaded,

        // if no real betting, get only matches that weren't played yet
        // with real betting can use any matches
        notPlayed: !Flow.betting
	}).then((match) => {
		NextMatch = match;
		Config.matchesLoaded++;
		if (App.widgets[0].isMatchAvalableForUser()) {
			App.widgets.forEach((widget) => {
				if (Helpers.isEmptyObj(match['Questions'])) {
					// no questions yet for the match
                    widget.notificationShow(['New matches will be available soon.'], 'error');
                } else {
                    widget.setQuestionsList(match['Questions']);
                    widget.reload();
				}
			});
		} else {
			App.reloadWidgetsWithNextMatch(team);
		}
	}).catch((err) => {
		if (err === 404) {
			App.widgets.forEach((widget) => {
				widget.notificationShow(['New matches will be available soon.'], 'error');
			});
		}
	});
};