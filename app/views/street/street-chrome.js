opus.Gizmo({
	name: "street",
	dropTarget: true,
	type: "Palm.Mojo.Panel",
	l: 0,
	t: 0,
	h: "100%",
	styles: {
		zIndex: 2
	},
	chrome: [
		{
			name: "html1",
			content: "<div id=\"street_canvas\" style=\"width: 100%; height: 100%;\" x-palm-no-drag-radius />",
			type: "Palm.Mojo.Html",
			l: 0,
			t: 0,
			h: "100%"
		}
	]
});
