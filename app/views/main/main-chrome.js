opus.Gizmo({
	name: "main",
	dropTarget: true,
	type: "Palm.Mojo.Panel",
	l: 0,
	w: "",
	t: 0,
	h: "",
	hAlign: "center",
	vAlign: "center",
	styles: {
		zIndex: 2
	},
	components: [
		{
			name: "gps1",
			onSuccess: "gps1Success",
			onFailure: "gps1Failure",
			accuracy: "2",
			type: "Palm.Mojo.Gps"
		}
	]
});