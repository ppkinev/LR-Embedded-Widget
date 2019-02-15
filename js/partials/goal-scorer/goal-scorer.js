(() => {
    Elements.goalScorer = function (widget) {
        const template = Mustache.to_html('@@import js/partials/goal-scorer/goal-scorer.mustache', {
			NextMatch, logo: widget.getImage(), backBtn: Components.Icons.back
		});
        const playersTemplate = '@@import js/partials/goal-scorer/dg-team-player.mustache';
        let page = Helpers.createEl('div', template);

        let playersHolder = $$('.dg-teams-players', page);
        let homeArr = NextMatch['Questions']['FirstGoalScorer']['Outcomes']['HomeTeam'],
            awayArr = NextMatch['Questions']['FirstGoalScorer']['Outcomes']['AwayTeam'];
        let homeTemplate = Mustache.to_html(playersTemplate, homeArr),
            awayTemplate = Mustache.to_html(playersTemplate, awayArr);
        let homeTeamTab = $$('.dg-team-tab.dg-team-tab-home', page),
            awayTeamTab = $$('.dg-team-tab.dg-team-tab-away', page);

        let totalCount = NextMatch['Questions']['FirstGoalScorer']['TotalAnswersCount'];
        let resultList = homeArr.concat(awayArr);
        let resultsEl = Helpers.createEl('div', '@@import js/partials/goal-scorer/dg-scorer-results.mustache');

        let sideToShow = widget.getOutcomes().length > 0 ? widget.getOutcomes()[0]['side'] : null;

        function clearTabs(el) {
            $$('.dg-team-tab').removeClass('dg-active');
            $$(el).addClass('dg-active');
            playersHolder.innerHTML = '';
        }

        function createPlayersList(template) {
            let list = document.createElement('ul');
            list.innerHTML = template;

            let image = null, choice = '', percent = 0;

            $$('li', list).addEventListener('click', (ev) => {
                let outcomeId = ev.currentTarget.getAttribute('data-id');
                let result = resultList.filter((r) => {
                    return r['OutcomeId'] === outcomeId;
                });

                choice = result.length > 0 ? result[0]['FirstScorer'] : '';
                percent = result.length > 0 ? result[0]['AnswersCount'] : 0;
                percent++;
                totalCount++;

                image = result[0] && result[0]['ImageUrl'];
				let playerClickedGA = result[0] && `${result[0]['Side']} - ${result[0]['FirstScorer']}`;

                playerClickedGA += `=${NextMatch['MatchId']}`;
				GA.event('Quiz Answers', `First Goal Scorer`, playerClickedGA);

                widget.addOutcome({
                    question: `<b>${choice}</b> to score first`,
                    id: outcomeId,
                    icon: image,
                    choice: choice,
                    type: 'goalScorer'
                });

                $$('span', resultsEl).innerHTML = Helpers.countPercents(percent, totalCount);
                ev.currentTarget.appendChild(resultsEl);

                $$(page).setAttribute('data-pos', $$(page).scrollTop[0]);
                $$(page).addClass('dg-results');

                window.setTimeout(() => {
                    if (widget) widget.changeState();
                }, Config.resultsDuration);

				Config.app.backBtn = false;
            });

            return list;
        }

        homeTeamTab.addEventListener('click', (ev) => {
            clearTabs(ev.currentTarget);
            playersHolder.appendChild(createPlayersList(homeTemplate));
        });
        awayTeamTab.addEventListener('click', (ev) => {
            clearTabs(ev.currentTarget);
            playersHolder.appendChild(createPlayersList(awayTemplate));
        });

        if (sideToShow && sideToShow === 'away') {
            awayTeamTab.addClass('dg-active');
            playersHolder.appendChild(createPlayersList(awayTemplate));
        } else {
            homeTeamTab.addClass('dg-active');
            playersHolder.appendChild(createPlayersList(homeTemplate));
        }

		let backBtn = $$('.dg-page-back', page);
		if (backBtn.length > 0) {
			backBtn.addEventListener('click', () => {
				widget.changeState('back');
				widget.removeLastOutcome();
			});
		}
		let newPage = `first_goal_scorer=${NextMatch['MatchId']}`;
		GA.pageView(`${App.currentPage}//${newPage}`);
		App.currentPage = newPage;

        return page;
    };
})();