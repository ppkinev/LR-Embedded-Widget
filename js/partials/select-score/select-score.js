(() => {
	Elements.selectScore = function (widget) {
		const template = Mustache.to_html('@@import js/partials/select-score/select-score.mustache', {
				NextMatch, logo: widget.getImage(), backBtn: Components.Icons.back
			}, {dgScore: '@@import js/partials/select-score/dg-score-select.mustache'}
		);

		let page = Helpers.createEl('div', template);

		let scoreLimits = {max: 9, base: 0};
		let home = new Components.ScoreSelect($$('.dg-score-holder', $$('.dg-home', page)), scoreLimits);
		let away = new Components.ScoreSelect($$('.dg-score-holder', $$('.dg-away', page)), scoreLimits);

		let confirm = $$('.dg-confirm', page);

		let totalCount = NextMatch['Questions']['CorrectScore']['TotalAnswersCount'],
			awayCountArr = NextMatch['Questions']['CorrectScore']['Outcomes']['AwayTeam'],
			homeCountArr = NextMatch['Questions']['CorrectScore']['Outcomes']['HomeTeam'],
			drawCountArr = NextMatch['Questions']['CorrectScore']['Outcomes']['Draw'];

		confirm.addEventListener('click', () => {
			let result = 0, count,
				score = String(home.getValue() + '-' + away.getValue()),
				outcomeFound = null, image = null, side = null;

			if (home.getValue() > away.getValue()) {
				homeCountArr.forEach((r) => {
					if (score === r['Score']) {
						count = r['AnswersCount'];
						result = ++count;
						outcomeFound = r['OutcomeId'];
						image = NextMatch['HomeTeam']['ImageUrl'];
						side = 'home';
					}
				});
			} else if (home.getValue() < away.getValue()) {
				score = String(away.getValue() + '-' + home.getValue());
				awayCountArr.forEach((r) => {
					if (score === r['Score']) {
						count = r['AnswersCount'];
						result = ++count;
						outcomeFound = r['OutcomeId'];
						image = NextMatch['AwayTeam']['ImageUrl'];
						side = 'away';
					}
				});
			} else {
				drawCountArr.forEach((r) => {
					if (score === r['Score']) {
						count = r['AnswersCount'];
						result = ++count;
						outcomeFound = r['OutcomeId'];
						side = 'draw';
					}
				});
			}
			totalCount++;

			if (outcomeFound) {
				widget.addOutcome({
					question: `The game to finish <b>${score}</b>`,
					id: outcomeFound,
					icon: image,
					choice: score,
					side: side,
                    type: 'correctScore'
				});
				$$('.dg-score-results span', page).innerHTML = Helpers.countPercents(result, totalCount);
				$$(page).addClass('dg-results');
				window.setTimeout(() => {
					if (widget) widget.changeState();
				}, Config.resultsDuration);

				GA.event('Quiz Answers', `${side} full time score`, NextMatch['MatchId'], score);

			} else {
				widget.notificationShow(['This outcome is unsupported', 'Try another one, please'], 'error');
			}
			Config.app.backBtn = false;
		});

		let backBtn = $$('.dg-page-back', page);
		if (backBtn.length > 0) {
			backBtn.addEventListener('click', () => {
				widget.changeState('back');
				widget.removeLastOutcome();
			});
		}

		let newPage = `full_time_score=${NextMatch['MatchId']}`;
		GA.pageView(`${App.currentPage}//${newPage}`);
		App.currentPage = newPage;

		return page;
	}
})();