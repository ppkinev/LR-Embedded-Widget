(() => {
	Elements.core = function(){
		const template = '@@import js/partials/widget/widget-template.mustache';
		return Helpers.createEl('div', template);
	};
})();