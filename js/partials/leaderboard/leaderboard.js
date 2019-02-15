(() => {
	'use strict';
	Elements.leaderBoard = function (players, widget) {
		if (!players || !Array.isArray(players)) return null;
		players.sort((a, b) => b.AnswersCount - a.AnswersCount);
		if (players.length > 3) players = players.slice(0, 3);
		const template = Mustache.to_html('@@import js/partials/leaderboard/leaderboard.mustache', players);
		let page = Helpers.createEl('div', template);

		// Everton homepage slider fix
		let evSlider = widget.evertonSlider();
		if (evSlider) {
			window.setTimeout(() => {
				let evSliderHeight = evSlider.getBoundingClientRect().height - 56;
				let widgetHeight = widget._body.getBoundingClientRect().height - 10;
				let diff = 0;

				if (widgetHeight < evSliderHeight) {
					diff = evSliderHeight - widgetHeight;
					page.style.paddingBottom = diff + 'px';
				}
			}, 400);

			// No border version, comment this piece, panels are needed
			if (!isMobile.any) {
				$$(page).addClass('dg-no-shadows');
				widget._body.style.backgroundColor = 'transparent';
				evSlider.style.backgroundColor = '#ffffff';
			}
			// End of no border version
		}

		return page;
	};
})();