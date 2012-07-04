opus.depends({
	paths: {
		"Ares": "/Ares",
		"mojo": "/usr/palm/frameworks/mojo/",
		"opus": "$Ares/foss/opus/opus",
		"Palm": "$Ares/ide",
		"controls": "$opus/library/controls/",
		"AresLib": "$Palm/library/Ares",
		"MojoLib": "$Palm/library/Mojo/",
		"Palm-Mojo": "$MojoLib/"
	},
	nobuild: [
		"$mojo/mojo.js",
		"app-build.js"
	]
});