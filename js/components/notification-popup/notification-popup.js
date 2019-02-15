(() => {

	Components.Notification = class {
		constructor(holder, lines = [''], type = 'success') {
			if (!holder) return;
			if (!Array.isArray(lines)) throw 'Notifications texts type should be Array of Strings';
			this._holder = holder;
			let template = Mustache.to_html('@@import js/components/notification-popup/notification-popup.mustache',
				{
					error: type === 'error' ? Components.Icons.error : null,
					lines
				}
			);
			this._notification = Helpers.createEl('div', template);
			$$(this._notification).addClass(`dg-${type}`);

			const TIMEOUT = 3000;
			let close = $$('.dg-notification-close', this._notification);
			close.addEventListener('click', () => {
				this.destroy();
			});
			window.setTimeout(() => {
				this.destroy();
			}, TIMEOUT);

			holder.appendChild(this._notification);
		}

		destroy() {
			$$(this._notification).addClass('dg-hide');
			window.setTimeout(() => {
				if (this._notification.parentNode === this._holder[0])
					this._holder.removeChild(this._notification);
			}, 250);
		}
	}

})();