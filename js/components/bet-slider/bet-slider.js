(() => {
    Components.BetSlider = class {
        constructor({holder, odds, max, currency}) {
            let title = $$('.dg-bet-value', holder),
                slider = $$('.dg-bet-slider', holder),
                oddsEl = $$('.dg-bet-odds', holder);

            if (max) slider.set('max', max);
            else max = 0;
			this.value = max;

            // Set start values to maximum
            slider.set('value', max);
            if (currency === 'points') slider.set('step', 1);
            $$('.dg-bet-slider-text', holder)[0].setAttribute('maxlength', String(String(max).length));
			$$('.dg-bet-slider-text', holder).addEventListener('click', (ev) => {
				ev.currentTarget.focus();
			});
			title.innerHTML = `${max} ${currency}`;
			oddsEl.innerHTML = `Odds: ${odds}/1 win ${Math.floor(max * odds)} ${currency}`;

            slider.addEventListener('input', (ev) => {
                let val = ev.target.value;
                if (val > max) {
                	slider.set('value', max);
					val = max;
				}
                title.innerHTML = `${val} ${currency}`;
                oddsEl.innerHTML = `Odds: ${odds}/1 win ${Math.floor(val * odds)} ${currency}`;
                this.value = val;
            });
        }

        getValue() {
            return this.value;
        }
    };
})();