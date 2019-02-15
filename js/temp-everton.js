(() => {

if (window.location.href.indexOf('everton') !== -1) {

	// Side section instead of NEWS
	let news = document.querySelector('.WidgetPanel .NewsWidget');
	if (news && window.location.href.indexOf('fixtures') !== -1) {
		let newsInner = news.querySelector('.WidgetInner'),
			newsTitle = news.querySelector('.WidgetTitle');

		newsInner.className = newsInner.className.replace('ng-scope', '').trim();
		newsInner.removeAttribute('ng-controller');

		newsTitle.innerHTML = '<h3>Score Predictor</h3>';
		newsInner.innerHTML = '<div data-lr-widget data-default-image="everton"></div>';
	}

	// Home page
	let carousel = document.querySelector('.HomeCarousel');
	if (carousel) {
		let panel = carousel.querySelector('.HomePanel.TakeOverDefault');
		const WIDTH = 380;
		let currentWidth = Number(carousel.style.width.replace('px', ''));
		panel.innerHTML = '';
		panel.className = panel.className.replace('SmallPanel', '');
		panel.setAttribute('data-lr-widget', '');
		panel.setAttribute('data-default-image', 'everton');
		panel.style.backgroundColor = '#f2f5f7';
		if (window.innerWidth > 420) {
			panel.style.width = WIDTH + 'px';
			panel.style.overflowY = 'auto';
			carousel.style.width = (currentWidth + WIDTH + 50) + 'px';
		}
	}
}

})();