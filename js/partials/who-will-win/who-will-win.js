(() => {
    Elements.whoWillWin = function (widget) {
        const template = Mustache.to_html('@@import js/partials/who-will-win/who-will-win.mustache', {
			NextMatch, logo: widget.getImage()
        });
        let page = Helpers.createEl('div', template);

        let home = $$('.dg-home', page),
            away = $$('.dg-away', page),
            draw = $$('.dg-draw', page),
            panel = $$('.dg-panel', page);

        let homeCount = NextMatch['Questions']['FirstHalfResult']['Outcomes']['HomeTeam']['AnswersCount'],
            awayCount = NextMatch['Questions']['FirstHalfResult']['Outcomes']['AwayTeam']['AnswersCount'],
            drawCount = NextMatch['Questions']['FirstHalfResult']['Outcomes']['Draw']['AnswersCount'],
            totalCount = NextMatch['Questions']['FirstHalfResult']['TotalAnswersCount'];

        function fillResults() {
			totalCount++;

            $$('.dg-results-el span', home).innerHTML = Helpers.countPercents(homeCount, totalCount);
            $$('.dg-results-el span', away).innerHTML = Helpers.countPercents(awayCount, totalCount);

            $$(page).addClass('dg-results');

            window.setTimeout(() => {
                if (widget) widget.changeState();
            }, Config.resultsDuration);

            if (Config.app.widgetJustLoaded) {
				GA.event('Navigation', 'Start Match Quiz', `From Holder=${NextMatch['MatchId']}`);

				let newPage = `half_time_lead=${NextMatch['MatchId']}`;
				GA.pageView(`${App.currentPage}//${newPage}`);
				App.currentPage = newPage;
            }

			Config.app.backBtn = false;
			Config.app.widgetJustLoaded = false;
        }


        home.addEventListener('click', () => {
            widget.addOutcome({
                question: `<b>${NextMatch['HomeTeam']['Name']}</b> will lead at half-time`,
                id: NextMatch['Questions']['FirstHalfResult']['Outcomes']['HomeTeam']['OutcomeId'],
                icon: NextMatch['HomeTeam']['ImageUrl'],
                choice: NextMatch['HomeTeam']['Name'],
                side: 'home'
            });
            homeCount++;
			GA.event('Quiz Answers', 'Home is half time leader', NextMatch['MatchId']);
			fillResults();
        });
        away.addEventListener('click', () => {
            widget.addOutcome({
                question: `<b>${NextMatch['AwayTeam']['Name']}</b> will lead at half-time`,
                id: NextMatch['Questions']['FirstHalfResult']['Outcomes']['AwayTeam']['OutcomeId'],
                icon: NextMatch['AwayTeam']['ImageUrl'],
                choice: NextMatch['AwayTeam']['Name'],
                side: 'away'
            });
            awayCount++;
			GA.event('Quiz Answers', 'Away is half time leader', NextMatch['MatchId']);
            fillResults();
        });
        draw.addEventListener('click', () => {
            widget.addOutcome({
                question: `<b>Draw</b>`,
                id: NextMatch['Questions']['FirstHalfResult']['Outcomes']['Draw']['OutcomeId'],
                icon: null,
                choice: 'Draw',
                side: 'draw',
                type: 'halfTime'
            });
            drawCount++;
			GA.event('Quiz Answers', 'Draw on half time', NextMatch['MatchId']);
            fillResults();
        });

		if (!Config.app.widgetJustLoaded) {
			if (!Config.app.backBtn) {
				if (Config.app.newMatch) {
					GA.event('Navigation', 'Start Match Quiz', `From Previous Quiz=${NextMatch['MatchId']}`);
				} else {
					GA.event('Navigation', 'Start Match Quiz', `Back to Edit Prediction=${NextMatch['MatchId']}`);
				}
			}


			let newPage = `half_time_lead=${NextMatch['MatchId']}`;
			GA.pageView(`${App.currentPage}//${newPage}`);
			App.currentPage = newPage;
		}

        return page;
    };
})();