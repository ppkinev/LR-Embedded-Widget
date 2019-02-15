(() => {
	Elements.widgetPlaceholder = function(image){
		const template = Mustache.to_html('@@import js/partials/widget/placeholder.mustache', {
			image
		});
		return Helpers.createEl('div', template);
	};
})();