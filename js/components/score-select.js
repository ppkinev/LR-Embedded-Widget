(() => {
    Components.ScoreSelect = class {
        constructor(holder, limit) {
            let MAX_SCORE = limit.max || 9;
            let valueEl = $$('.dg-score-value', holder),
                up = $$('.dg-score-up', holder),
                down = $$('.dg-score-down', holder);
            this.value = 0;

            down.setAttribute('disabled', 'disabled');

            up.addEventListener('click', () => {
                if (!up[0].getAttribute('disabled')) {
                    down.removeAttribute('disabled');
                    if (limit.base < MAX_SCORE) {
                        this.value++;
                        limit.base++;
                    }
                    valueEl.innerHTML = this.value;
                }
            });
            down.addEventListener('click', () => {
                if (!down[0].getAttribute('disabled')) {
                    up.removeAttribute('disabled');
                    if (limit.base > 0 && this.value > 0) {
                        this.value--;
                        limit.base--;
                    }
                    valueEl.innerHTML = this.value;
                }
            });
        }

        getValue() {
            return this.value;
        }
    };
})();