let Api = (function () {


    const POST = 'POST',
        GET = 'GET';

    function getApi(options, callback) {
        const {method = GET, ep: endpoint, data} = options;
        // const params = method === GET ? data : JSON.stringify(data);

        return new Promise((resolve, reject) => {
            Helpers.getAccessToken(function (token) {
                if (token) {
                    const axiosConfig = {
                        url: Config.apiPrefix + endpoint,
                        method: method,
                        mode: 'cors',
                        headers: {
                            'Authorization': token
                        }
                    };

                    if (method === 'POST') axiosConfig.data = data;
                    else axiosConfig.params = data;


                    console.info('Getting ' + endpoint + ' using axios');
                    axios(axiosConfig)
                        .then(function (result) {
                            const status = result.status;
                            console.info('Getting ' + endpoint + ' succeed');

                            if (status === 401) {
                                // do something on unauthorize
                                // DGW.global.methods.unAuthorize();
                            }

                            if (callback) callback(result);
                            resolve(result.data);
                        })
                        .catch(function (error) {
                            if (error.response) {
                                console.warn('Getting ' + endpoint + ' failed');
                                console.warn(error);

                                const status = error.response.status;
                                if (status === 401) {
                                    // do something on unauthorize
                                    // DGW.global.methods.unAuthorize();
                                }
                                if (callback) callback(error.response);
                                reject(error);
                            }
                        });

                }
            });

            // rpc.apiTunnel(
            //     {
            //         apiKey: Config.apiKey,
            //         endpoint, method, params
            //     },
            //     function onSuccess(response) {
            //         let result = response;
            //         if (result.error && result.status == 401) {
            //             // Unauthorized access
            //         }
            //         if (result.status !== 200) reject(result);
            //         else {
            //             resolve(result.data);
            //             if (callback) callback(result.data);
            //
            //             if (User) Helpers.fixUserWallet();
            //         }
            //     },
            //     function onError(error) {
            //         reject(error);
            //     }
            // );
        });
    }

    return {
        // ################################# //
        // ########  App settings  ######### //
        // ################################# //
        getApp: () => {
            return getApi({ep: 'app/getclient'});
        },

        // ################################# //
        // ########  Authorization  ######## //
        // ################################# //
        signUp: (user) => {
            if (!user) throw 'User object is required';
            return getApi({
                ep: 'auth/signup', method: POST,
                data: {
                    Username: user.Username,
                    Email: user.Email,
                    Password: user.Password,
                    Referral: user.Referral || null,
                    SSO: user.SSO || 0
                }
            });
        },
        signIn: (user) => {
            if (!user) throw 'User object is required';
            return getApi({
                ep: 'auth/login', method: POST,
                data: {
                    Email: user && user.Email,
                    Password: user && user.Password,
                }
            });
        },
        signOut: () => {
            User = null;
            return getApi({ep: 'auth/logout', method: POST});
        },
        ssoLogin: (params) => {
            ssoSignIn(params);
        },
        forgotPass: (email) => {
            return getApi({
                ep: 'auth/forgotpassword', method: POST,
                data: {
                    Email: email
                }
            });
        },
        getMe: () => {
            return getApi({ep: 'user/me'});
        },

        // ################################# //
        // ######  Matches, fixtures  ###### //
        // ################################# //
        getTournaments: () => {
            // returns Tournaments - groups with matches
            return getApi({ep: 'scorepredictor/gettournaments'});
        },

        getFixturesPlayed: (tournamentId, team) => {
            return getApi({ep: 'scorepredictor/getuserentries', data: {tournamentId, team}});
        },

        // ################################# //
        // ###  Single match (questions) ### //
        // ################################# //

        getMatchDetails: (matchId) => {
            return getApi({ep: 'scorepredictor/getmatch', data: {MatchId: matchId}});
        },

        getMatches: ({take = 1, team, tournamentId, skip, upcoming = true, sortasc = true, notPlayed = false}) => {
            return getApi({
                ep: 'scorepredictor/getmatches',
                data: {
                    tournamentId,
                    team, take, skip,
                    upcoming, sortasc,
                    notPlayed,
                }
            });
        },

        getUserEntries: (tournamentId) => {
            return getApi({
                ep: 'scorepredictor/getuserentries',
                data: {
                    tournamentId
                }
            });
        },


        // ~/scorepredictor/getodds
        //
        // {"ScorecastOdds":70,"OutcomeOdds":[{"OutcomeId":"2806587e-ec25-48fd-9ba8-18e3c709d0f4","Odds":10},{"OutcomeId":"eccb8f51-b5c0-4f46-b33a-9376ec1dc5a7","Odds":7},{"OutcomeId":"a437318c-1d04-4813-9dee-bc96f91fb1c4","Odds":1.85}]}
        //
        // и если скоркаст недоступен:
        // {"OutcomeOdds":[{"OutcomeId":"eccb8f51-b5c0-4f46-b33a-9376ec1dc5a7","Odds":7},{"OutcomeId":"a437318c-1d04-4813-9dee-bc96f91fb1c4","Odds":1.85}]}
        getOdds: (matchId, answers) => {
            return getApi({
                ep: 'scorepredictor/getodds', method: POST,
                data: {matchid: matchId, OutcomeIds: answers}
            });
        },

        // WORK ON IT
        makeCreditsBet: (matchId, credits, answers) => {
            return getApi({
                ep: 'scorepredictor/bet', method: POST,
                data: {
                    MatchId: matchId,
                    CreditsAmount: credits,
                    OutcomeIds: answers
                }
            });
        },

        makePointsBet: (matchId, points, answers) => {
            return getApi({
                ep: 'scorepredictor/bet', method: POST,
                data: {
                    MatchId: matchId,
                    PointsAmount: points,
                    OutcomeIds: answers
                }
            });
        },

        makePrediction: (matchId, answers) => {
            return getApi({
                ep: 'scorepredictor/makeprediction', method: POST,
                data: {
                    MatchId: matchId,
                    OutcomeIds: answers
                }
            });
        },

        // /scorepredictor/getbookmakers
        // NO ODDS THERE
        // USE "getOdds" for odds
        getBetList: () => {
            return getApi({
                ep: 'scorepredictor/getbookmakers'
            });
        },

        // ################################# //
        // #########  Leaderboard  ######### //
        // ################################# //
        getLeaderboard: (timeperiod, filtertype) => {
            return getApi({
                ep: 'leaderboard/GetSPPlayersAnswers',
                data: {timeperiod: timeperiod || 'thismonth', filtertype: filtertype || 'allusers'}
            });
        },


        // ################################# //
        // #########  EMAIL        ######### //
        // ################################# //
        postVerifyEmail: () => {
            return getApi({
                ep: 'user/verifyemail', method: POST
            });
        },

        // ################################# //
        // #########  DRAWS        ######### //
        // ################################# //
        getDraws: ({upcoming = true, my = null, take = 1, skip = 0}) => {
            return getApi({
                ep: 'draw/getdraws',
                data: {
                    upcoming, my, skip, take
                }
            });
        },
        drawBet: (drawId, pointsAmount = 1) => {
            return getApi({
                ep: 'draw/bet', method: POST,
                data: {
                    drawId, pointsAmount
                }
            });
        }
    };
})();

if (Config.platform === 'test') App.api = Api;
