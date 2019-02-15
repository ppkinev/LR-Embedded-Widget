(() => {
    // Custom methods to expand $$ (Node List)
    $$.NL.addClass = function (className) {
        this.forEach(function (node) {
            node.classList.add(className);
        });
    };

    $$.NL.removeClass = function (className) {
        this.forEach(function (node) {
            node.classList.remove(className);
        });
    };
})();

let Helpers = {
    datePassed: (endDate) => {
        endDate = (endDate.substring(endDate.length - 1).toLowerCase() === 'z') ? endDate : endDate + 'Z';
        return new Date(endDate) - new Date() < 0;
    },
    datesDiff: (date01, date02) => new Date(date01) - new Date(date02),
    insertAfter: (newNode, referenceNode, _fallbackNode) => {
        if (referenceNode) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        } else {
            if (_fallbackNode) _fallbackNode.appendChild(newNode);
        }
    },
    createEl: (type, template) => {
        let el = document.createElement(type);
        $$(el).innerHTML = template;
        el = $$(el).firstChild || $$(el).childNodes[0];
        return el[0];
    },
    addPrecedingZeros: (value) => {
        value = +value;
        if (isNaN(value)) return 0;
        return value < 10 ? ('0' + value) : value;
    },
    getMonth: (month) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month],
    getFormattedDate: (dateString) => {
        let date = new Date(dateString);
        return Helpers.getMonth(date.getMonth()) + ' ' + date.getDate() + ' at ' +
            Helpers.addPrecedingZeros(date.getHours()) + ':' + Helpers.addPrecedingZeros(date.getMinutes());
    },
    splitByCapitals: (text) => text.split(/(?=[A-Z])/).join(' '),
    countPercents: (count, total) => Math.floor(count / total * 100),
    errorParser: (error) => {
        if (!error) return;
        if (typeof error === 'string') error = JSON.parse(error);
        let errorsArray = [],
            errorsFields = [];
        if (error.ModelState) {
            for (let model in error.ModelState) {
                if (error.ModelState.hasOwnProperty(model)) {
                    if (Array.isArray(error.ModelState[model])) {
                        errorsArray.push(error.ModelState[model][error.ModelState[model].length - 1]);
                        errorsFields.push(model.substr(6).toLowerCase());
                    }
                }
            }
        } else {
            errorsArray.push(error.Message);
        }

        // TODO: use errorsFields as names for inputs
        return {messages: errorsArray, inputs: errorsFields};
    },
    centerWindowPopup: (url, title, w = 460, h = 340, getWindow) => {
        let windowCheckCloseInterval;
        let dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left,
            dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top,
            width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width,
            height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height,
            left = ((width / 2) - (w / 2)) + dualScreenLeft,
            top = ((height / 2) - (h / 2)) + dualScreenTop;
        let win = window.open(url, title, 'menubar=no,location=no,resizable=no,scrollbars=yes,status=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
        if (window.focus) win.focus();

        if (!getWindow) {
            return new Promise((resolve) => {
                windowCheckCloseInterval = window.setInterval(() => {
                    if (win.closed) {
                        clearInterval(windowCheckCloseInterval);
                        resolve();
                    }
                }, 50);
            });
        } else {
            return win;
        }
    },
    isOS: () => !!navigator.userAgent.match(/iP(ad|hone|od)/i),
    isChrome: () => {
        let chrome = navigator.userAgent.indexOf('Chrome') > -1;
        let opera = navigator.userAgent.toLowerCase().indexOf('op') > -1;
        if ((chrome) && (opera)) chrome = false;

        return chrome;
    },
    isSafari: () => {
        let ua = navigator.userAgent;
        let iOS = !!ua.match(/iP(ad|hone|od)/i);
        let webkit = !!ua.match(/WebKit/i);
        let iOSSafari = iOS && webkit && !ua.match(/CriOS/i) && !ua.match(/OPiOS/i);

        let isSafari = navigator.vendor && navigator.vendor.indexOf('Apple') > -1 &&
            navigator.userAgent && !navigator.userAgent.match('CriOS');

        return isMobile.any ? iOSSafari : isSafari;
    },
    getSafariFixUrl: () => {
        if (Config.app) {
            // TODO: use ios-webview cookie somewhere to detect redirect if needed
            let hostUrl = `&hosturl=${window.location.href + (window.location.search.length > 0 ? '&' : '?')}ios-webview-click`;
            return `${Config.tunnel}?safarifix&authpoint=${window.encodeURIComponent(window.btoa(Config.app.ssoTunnel + '?safarifix' + hostUrl))}`;
        }
    },
    cookies: {
        createCookie: function (name, value, days) {
            let expires = '';
            if (days) {
                let date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = '; expires=' + date.toGMTString();
            }
            document.cookie = name + '=' + value + expires + ';';
        },
        readCookie: function (name) {
            let nameEQ = name + '=';
            let ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        },
        eraseCookie: function (name) {
            this.createCookie(name, '', -1);
        },
    },
    numToFixed: function (num, fixed) {
        if (num === null || num === undefined || isNaN(num)) return new Error('NUM is not a number');
        if (fixed && fixed < 0) return num;
        let parts = String(num).split('.');
        if (parts.length === 1) return Number(parts[0]).toFixed(fixed);
        if (fixed === 0) return String(parts[0]);
        return parts[0] + '.' + parts[1].substring(0, fixed);
    },
    fixUserWallet: function () {
        User.Wallet.CreditsConfirmed = Number(Helpers.numToFixed(User.Wallet.CreditsConfirmed, 2));
        User.Wallet.CreditsPending = Number(Helpers.numToFixed(User.Wallet.CreditsPending, 2));
    },
    getURLParameter: function (name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },
    getHashParameters: function (url) {
        const hash = url ? url.substring(url.lastIndexOf('#') + 1, url.length) : window.location.hash.substr(1);

        return hash.split('&').reduce(function (result, item) {
            const parts = item.split('=');
            if (parts[0].length === 0 || parts[0] === '/') return result;
            result[parts[0]] = parts[1];
            return result;
        }, {});
    },
    getDrawInfo: function (drawId, callback) {
        Api.getDraws({upcoming: true, take: 20}).then((result) => {
            if (callback) callback(result['Draws'].filter(draw => draw.DrawId === drawId));
        }).catch(() => {
            callback([]);
        });
    },

    getAccessToken: function (callback) {
        if (!callback) return null;
        userManager.getUser().then(function (user) {
            if (user) {
                if (Date.now() - (user.expires_at * 1000) >= 0) {
                    userManager.removeUser();
                    callback(window.localStorage.getItem(`${Config.apiKey}:access_token`));
                } else {
                    callback(user.token_type + ' ' + user.access_token);
                }
            } else {
                callback(window.localStorage.getItem(`${Config.apiKey}:access_token`));
            }
        });
    },


    saveAccessToken: function (token) {
        window.localStorage.setItem(`${Config.apiKey}:access_token`, token);
    },

    saveAuthSettings: function ({page, isPopup, isLogOut, isSilent, loginRequired, isInIFrame} = {}) {
        window.localStorage.setItem(`${Config.apiKey}:auth_settings`, JSON.stringify({
            page,
            isPopup,
            isLogOut,
            isSilent,
            loginRequired,
            isInIFrame,
        }));
    },

    getAuthSettings: function () {
        const set = window.localStorage.getItem(`${Config.apiKey}:auth_settings`);
        return set && JSON.parse(set);
    },

    isEmptyObj: function(obj) {
        for(var key in obj) {
            if(obj.hasOwnProperty(key))
                return false;
        }
        return true;
    }
};

if (Config.platform === 'test') App.helpers = Helpers;

GA.init = function (name) {
    if (name) GA.trackerName = `${name}Esp`;

    let checkGA = function (resolve, reject) {
        if (!window.ga) {
            (function (i, s, o, g, r, a, m) {
                i['GoogleAnalyticsObject'] = r;
                i[r] = i[r] || function () {
                    (i[r].q = i[r].q || []).push(arguments);
                }, i[r].l = 1 * new Date();
                a = s.createElement(o),
                    m = s.getElementsByTagName(o)[0];
                a.async = 1;
                a.src = g;
                m.parentNode.insertBefore(a, m);
            })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

            checkGA(resolve, reject);
        } else {
            if (ga.getByName) {
                if (!ga.getByName(GA.trackerName)) {
                    ga('create', {
                        trackingId: 'UA-51923524-39',
                        cookieDomain: 'auto',
                        name: GA.trackerName,
                    });
                    resolve();
                    if (Config.platform === 'test') {
                        console.log('GA is ready');
                    }
                } else {
                    resolve();
                    if (Config.platform === 'test') {
                        console.log('GA is ready already');
                    }
                }
            } else {
                let interval = window.setInterval(function () {
                    if (ga.getByName) {
                        window.clearInterval(interval);
                        checkGA(resolve, reject);
                    }
                }, 50);
            }
        }
    };

    return new Promise((resolve, reject) => {
        checkGA(resolve, reject);
    });
};

GA.pageView = function (pageName) {
    pageName = pageName.toLowerCase();
    ga(`${GA.trackerName}.set`, 'page', pageName);
    ga(`${GA.trackerName}.send`, 'pageview', pageName);

    if (Helpers.cookies.readCookie(GA.sessionCookie) === 'set') {
        Helpers.cookies.createCookie(GA.sessionCookie, 'set', GA.expirationTime);
    }
    if (Config.platform === 'test') {
        console.info(`%c=> GA pageview: ${pageName}`, 'color:blue;font-size:12px;');
    }
};

GA.event = function (category, action = '', label = null, value = null, nonInteraction = false) {
    ga(`${GA.trackerName}.send`, {
        hitType: 'event',
        eventCategory: category,
        eventAction: action,
        eventLabel: label,
        eventValue: value,
        nonInteraction: nonInteraction,
    });
    if (Helpers.cookies.readCookie(GA.sessionCookie) === 'set') {
        Helpers.cookies.createCookie(GA.sessionCookie, 'set', GA.expirationTime);
    }
    if (Config.platform === 'test') {
        console.info(`%c=> GA event: ${category} ${action || ''} ${label || ''} ${value || ''} ${nonInteraction || ''}`, 'color:magenta;font-size:12px;');
    }
};

GA.set = function (name, value) {
    ga(`${GA.trackerName}.set`, name, value);
    if (Config.platform === 'test') {
        console.info(`%c=> GA set: ${name} with value: ${value}`, 'color:#d81b60;font-size:12px;');
    }
};