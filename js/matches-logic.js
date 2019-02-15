let Matches = (function () {
	'use strict';
	let _cache = {};

	let prettifyMatch = function (match) {
		match['HomeTeam'].Name = Helpers.splitByCapitals(match['HomeTeam'].Name);
		match['AwayTeam'].Name = Helpers.splitByCapitals(match['AwayTeam'].Name);

		match['HomeTeam'].Side = 'home';
		match['AwayTeam'].Side = 'away';

		match['StartDateTimecode'] = (new Date(match['StartDate'])).getTime();
		match['StartDate'] = Helpers.getFormattedDate(match['StartDate']);

		let questions = {};
		match['Questions'].forEach((q) => {
			questions[q['Type']] = q;
		});
		match['Questions'] = questions;

		// Match result
		if (match['Questions']['MatchResult']) {

			let outcomes = {};
			match['Questions']['MatchResult']['Outcomes'].forEach((o) => {
				outcomes[o['Type']] = o;
			});
			match['Questions']['MatchResult']['Outcomes'] = outcomes;

			let matchResult = match['Questions']['MatchResult']['Outcomes'];
			for (let mr in matchResult) {
				if (matchResult.hasOwnProperty(mr)) {
					matchResult[mr] = matchResult[mr]['0'];
					matchResult[mr]['Team'] = Helpers.splitByCapitals(matchResult[mr]['Team']);
				}
			}
		}

		// First half score
		if (match['Questions']['FirstHalfResult']) {

			let outcomes = {};
			let firstHalf = match['Questions']['FirstHalfResult']['Outcomes'];
			firstHalf.forEach((f) => {
				if (f['Team']) f['Team'] = Helpers.splitByCapitals(f['Team']);
				if (f['Team'] === match['HomeTeam'].Name) {
					outcomes['HomeTeam'] = f;
				} else if (f['Team'] === match['AwayTeam'].Name) {
					outcomes['AwayTeam'] = f;
				} else {
					outcomes['Draw'] = f;
				}
			});

			match['Questions']['FirstHalfResult']['Outcomes'] = outcomes;
		}


		// Correct score
		if (match['Questions']['CorrectScore']) {
			let outcomes = {};
			let correctScore = match['Questions']['CorrectScore']['Outcomes'];
			correctScore.forEach((f) => {
				if (f['Team']) f['Team'] = Helpers.splitByCapitals(f['Team']);
				if (f['Team'] === match['HomeTeam'].Name) {
					if (!outcomes['HomeTeam']) outcomes['HomeTeam'] = [];
					outcomes['HomeTeam'].push(f);
				} else if (f['Team'] === match['AwayTeam'].Name) {
					if (!outcomes['AwayTeam']) outcomes['AwayTeam'] = [];
					outcomes['AwayTeam'].push(f);
				} else {
					if (!outcomes['Draw']) outcomes['Draw'] = [];
					outcomes['Draw'].push(f);
				}
			});

			match['Questions']['CorrectScore']['Outcomes'] = outcomes;
		}


		// First goal scorer
		if (match['Questions']['FirstGoalScorer']) {
			let outcomes = {};
			let goalScorer = match['Questions']['FirstGoalScorer']['Outcomes'];
			goalScorer.forEach((f) => {
				if (f['ScorerTeam']) f['ScorerTeam'] = Helpers.splitByCapitals(f['ScorerTeam']);
				if (f['ScorerTeam'] === match['HomeTeam'].Name) {
					if (!outcomes['HomeTeam']) outcomes['HomeTeam'] = [];
					f.ImageUrl = match['HomeTeam']['ImageUrl'];
					f.Side = 'Home';
					outcomes['HomeTeam'].push(f);
				} else if (f['ScorerTeam'] === match['AwayTeam'].Name) {
					if (!outcomes['AwayTeam']) outcomes['AwayTeam'] = [];
					f.ImageUrl = match['AwayTeam']['ImageUrl'];
					f.Side = 'Away';
					outcomes['AwayTeam'].push(f);
				} else {
					if (!outcomes['Draw']) outcomes['Draw'] = [];
					f.ImageUrl = Config.path + 'imgs/icon-friendship.png';
					f.Side = 'Draw';
					outcomes['Draw'].push(f);
				}
			});

			outcomes['HomeTeam'] = [...outcomes['Draw'], ...outcomes['HomeTeam']];
			outcomes['AwayTeam'] = [...outcomes['Draw'], ...outcomes['AwayTeam']];

			match['Questions']['FirstGoalScorer']['Outcomes'] = outcomes;
		}

		return match;
	};

	return {
		clearCache: () => _cache = {},
		clearNextMatch: () => _cache.nextMatch = null,

		getNextMatch: ({team, matchesLoaded = 0, notPlayed}) => {
			return new Promise((resolve, reject) => {
				Api.getMatches({team, skip: matchesLoaded, notPlayed}).then((res) => {
					if (res.Matches.length === 0) {
						reject(404);
						return;
					}
					let match = res.Matches[0];
					if (match) {
						Api.getMatchDetails(match.MatchId).then((match) => {
							resolve(prettifyMatch(match));
						});
					} else {
						reject('No match found');
					}
				}).catch((err) => {
					reject(err);
				});
			});
		}
	}
})();

if (Config.platform === 'test') {
	App.matches = Matches;
}