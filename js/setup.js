(() => {
	'use strict';
	let script = $$('#dg-embedded-sp')[0];
	let path = script.src.substring(script.src.lastIndexOf('/') + 1, 0),
		apiKey = script.getAttribute('data-key'),
		platform = script.getAttribute('data-platform') || 'live',
		apiPrefix = 'https://api.rewarded.club/core/v1/';

	const widgetAttribute = 'data-lr-widget';
	const resultsDuration = 1000;

	const SMALL_SCREEN = 400,
		SMALL_SCREEN_CLASS = 'dg-small-screen';
	const SKIN = script.getAttribute('data-skin');


	if (platform === 'test') {
		// tunnel = 'http://spr-api-test.cloudapp.net/core/v1/xdm/tunnel';
        apiPrefix = 'http://spr-api-test.cloudapp.net/core/v1/';
		window.Mustache = Mustache;
		window.$$ = $$;
		window.App = App;
		window.Config = Config;
		window.Components = Components;
		window.Flow = Flow;
	} else if (platform === 'local') {
		// tunnel = 'http://localhostdev/spr-api/core/v1/xdm/tunnel';
        apiPrefix = 'http://localhostdev/spr-api/core/v1/';
	} else if (platform === 'securetest') {
		// tunnel = 'https://api-test.rewarded.club/core/v1/xdm/tunnel';
        apiPrefix = 'https://api-test.rewarded.club/core/v1/';
	}

	if (!apiKey) throw 'Key is not provided';

	// Internal game-play variables
	App.widgets = [];
	let matchesLoaded = 0;

	//TODO: it should be taken from ICONS
	const defaultImage = 'http://a.espncdn.com/i/teamlogos/soccer/500/default-team-logo-500.png';
	const minHeight = 450;


	Object.assign(Config, {
		path, platform, apiPrefix, apiKey,
		widgetAttribute, resultsDuration,
		matchesLoaded, defaultImage, minHeight,
		SKIN, SMALL_SCREEN, SMALL_SCREEN_CLASS
	});
})();