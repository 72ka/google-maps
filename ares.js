opus = {
	paths: {},
	depends: [],
	path: {
		// match $[anything]/
		pattern: /\$([^\/\\]*)(\/)?/g,
		// replace macros of the form $pathname with the mapped value of paths.pathname
		rewrite: function(inPath) {
			var working, result = inPath;
			do {
				working = false;
				result = result.replace(this.pattern, function(macro, name) {
					working = true;
					var path = opus.paths[name];
					return path ? (path.charAt(path.length-1) == "/" ? path : path + "/") : "";
				});
			} while (working);
			return result;
		}
	},
	argify: function(inSearch) {
		var args = inSearch.slice(1).split("&");
		for (var i=0, a, nv; a=args[i]; i++) {
			// convert "name=value" to [name, value] 
			nv = args[i] = a.split("=");
			// and then to name: value
			args[nv[0]] = nv.length > 1 ? nv[1] : true;
		}
		return args;
	},
	locateScript: function(inName) {
		var l = inName.length;
		var scripts = document.getElementsByTagName("script");
		for(var i=0, s, src; (s=scripts[i]); i++) {
			src = s.getAttribute("src") || "";
			if(src.slice(-l) == inName) {
				return src.slice(0, -l);
			}
		}
	},
	/*
		depends() does (when evaluated in JS, basically, debug mode):
			for dependencies that are packages (no extension [ug?])
				- determine name, establish path (paths["opus-Aerie"] = "$opus/library/Aerie")
				- load the package dependencies ($opus/library/Aerie/opus-Aerie-depends.js)
			for all others:
				- load the resources
	*/
	_depend: function(inPath) {
		var tag, path = opus.path.rewrite(inPath);
		if (path.slice(-3) == "css") {
			// css
			tag = '<link href="' + path + '" media="screen" rel="stylesheet" type="text/css" />';
			//console.log("(css): " + path);
		} else if (path.slice(-2) == "js") {
			// js
			//console.log("(js): " + path);
		} else {
			// package
			// must encoded like so:
			// [folder]/[name of package without extension]
			var parts = path.split("/");
			var name = parts.pop();
			var folder = parts.join("/") + (parts.length ? "/" : "");
			opus.paths[name] = folder;
			//console.log("make alias: " + name + ": " + folder);
			path = folder + name + "-depends.js";
			//console.log("(depends): " + path);
		}
		if (!tag) {
			tag = '<script src="' + path + '" type="text/javascript" x-mojo-version="1"></script>';
		}
		document.write(tag);
	},
	depends: function(inDepends) {
		//console.info("processing dependencies");
		var d;
		if (d = inDepends.paths) {
			for (var n in d) {
				opus.paths[n] = d[n];
			}
		}
		if (d = inDepends.nobuild) {
			for (i=0; b=d[i]; i++) {
				this._depend(b);
			}
		}
		if (d = inDepends.build) {
			for (var i=0, b; b=d[i]; i++) {
				this._depend(b);
			}
		}
	}
};

(function(){
	if (!opus.paths.opus) {
		opus.paths.opus = opus.locateScript("bootloader.js");
	}
	opus.args = opus.argify(location.search);
	var app = opus.args.app || (opus.args.debug ? "depends.js" : "app.js");
	document.write('<script src="' + app + '" onerror="opus._tryDebug()" type="text/javascript"></script>');
	opus._tryDebug = function() {
		app = "depends.js";
		document.write('<script src="' + app + '" type="text/javascript"></script>');
	};
})();