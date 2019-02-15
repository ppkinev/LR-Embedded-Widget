let App = {};
let Config = {};
let Elements = {};
let Components = {};

let User = null;
//TODO: think on a logic of getting next match
let NextMatch = null;
let Flow = {};

let UserMemory = {};

let Auth = {};
let userManager = null;

let GA = {
	init: {},
	trackerName: '',
	set: {},
	pageView: {},
	event: {},
	sessionCookie: 'dg-ga-session',
	expirationTime: 1 / 24 / 60 * 31,
	betClick: 'dg-ga-betclick'
};