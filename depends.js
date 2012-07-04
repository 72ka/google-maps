opus.depends({
	paths: {
		Ares: "/Ares",
		opus: opus.args.apache ? "$Ares/foss/opus/opus" : "/opus/opus",
		Palm: opus.args.apache ? "$Ares/ide" : "/ide",
		mojo: "/usr/palm/frameworks/mojo/",
		controls: "$opus/library/controls/",
		AresLib: "$Palm/library/Ares",
		MojoLib: "$Palm/library/Mojo/"
	},
	nobuild: [
		"$mojo/mojo.js"
	],
	build: [
		"$AresLib/source/kit.js",
		"$opus/source/util.js",
		"$opus/source/xhr.js",
		"$opus/source/declare.js",
		"$opus/source/Object.js",
		"$opus/source/Component.js",
		"$opus/source/DomNode.js",
		"$opus/source/Style.js",
		"$opus/source/Bounds.js",
		"$opus/source/Control.js",
		"$opus/source/layout/Layout.js",
		"$opus/source/layout/Absolute.js",
		"$opus/source/layout/Box.js",
		"$opus/source/layout/Float.js",
		"$opus/source/layout/Grid.js",
		"$opus/source/Container.js",
		"$opus/source/View.js",
		"$opus/source/Json.js",
		"$opus/source/Gizmo.js",
		"$controls/source/Image.js",
		"$MojoLib/Palm-Mojo"
	]
});