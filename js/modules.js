let TrackElementsCountdown = function () {
	'use strict';
	setInterval(() => {
		let widgets = $$(`[${Config.widgetAttribute}]:not([${Config.widgetAttribute}="active"])`);
		widgets.forEach((w) => {
			w.setAttribute(Config.widgetAttribute, 'active');
			// ...
			// TODO: Launch flow on active widgets
			App.widgets.push(new Widget(w));
			if (Config.platform === 'test') window.widget = App.widgets;
		});
	}, 1000);
};
