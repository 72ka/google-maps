var maploc;
var mapto;
var LaunchAction;

//setup the variable Cookie models
var Cookies = [];
Cookies.MapCookie = new Mojo.Model.Cookie('MapCookie');
Cookies.TrafficCookie = new Mojo.Model.Cookie('TrafficCookie');
Cookies.PrefsCookie = new Mojo.Model.Cookie('PrefsCookie');
var DefaultPreferences = {
		Fullscreen: false,
		MapRotate: false,
		MaptoOverride: false,
		APILang: {code:"",name:"DEFAULT"},
		Bike: false,
		Weather: false,
		Cloud: false,
		Night: false,
		LastLoc: {lat: 37.39281, lng: -122.04046199999999, zoom: 2},
	};
//Cookies.MapCookie.remove();
//Cookies.TrafficCookie.remove();
//Cookies.PrefsCookie.remove();


function AppAssistant(appController) {
    this.controller = appController;
    
}
    
AppAssistant.prototype.setup = function() {
	
	try {
	var Preferences = Cookies.PrefsCookie.get();
	
	//set the overriden locale
	if(Preferences.APILang.code != "" && Preferences.APILang.code) {
		Mojo.Log.info("Setting locale to: %j" , Preferences.APILang.code);
		Mojo.Locale.set(Preferences.APILang.code);
	};
		}
	catch (error) {
		Mojo.Log.info("Preferences not properly defined, locale is set to default");
	};
	
};

AppAssistant.prototype.handleLaunch = function(appLaunchParams) {
	
	// focus the stage controller if we have one
	if (Mojo.Controller && Mojo.Controller.stageController) {	
			Mojo.Controller.stageController.activate();
			this.resolveLaunch(appLaunchParams);
		 switch (LaunchAction) {
			 case 'maploc':
			   this.controller.getStageController("").delegateToSceneAssistant('handleMapLoc', maploc);
			   break;
			 case 'mapto':
			  this.controller.getStageController("").delegateToSceneAssistant('handleMapTo', mapto);
			  break;
      };
			
	}
	
	// if there are any launch params
	if (appLaunchParams.target != undefined && appLaunchParams.target != "") {
		this.resolveLaunch(appLaunchParams);
	}

};

AppAssistant.prototype.resolveLaunch = function(appLaunchParams) {

Mojo.Log.info("** appLaunchParams *** %j", appLaunchParams);
	
	
// if there are any launch params
	if (appLaunchParams.target != undefined && appLaunchParams.target != "") {
		
		var foundIndex = appLaunchParams.target.indexOf("mapto:");
		if (foundIndex >= 0) {
			mapto = appLaunchParams.target.substr(foundIndex + "mapto:".length);
			LaunchAction = "mapto";
		}
		else {
			foundIndex = appLaunchParams.target.indexOf("maploc:"); //toto je co me zajima!
			if (foundIndex >= 0) {
				maploc = appLaunchParams.target.substr(foundIndex + "maploc:".length);
				LaunchAction = "maploc";
			}
			else {
				LaunchAction = undefined;
			}
		}
	}

};

function StageAssistant() {
}

StageAssistant.prototype.setup = function() {

// push the main scene
this.controller.pushScene({name: "main", disableSceneScroller: true}, { Action: LaunchAction, maploc: maploc, mapto: mapto, Cookies: Cookies});
this.controller.setWindowOrientation("free");
};

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

String.prototype.insert = function (index, string) {
  if (index > 0)
    return this.substring(0, index) + string + this.substring(index, this.length);
  else
    return string + this;
};



