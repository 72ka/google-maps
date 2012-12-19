var maploc;
var mapto;
var LaunchAction;
var appLaunchParams;

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
		OSM: false,
		LastLoc: {lat: 37.39281, lng: -122.04046199999999, zoom: 2},
		LengthUnits: "metric",
		Temperature: "celsius",
	};
//Cookies.MapCookie.remove();
//Cookies.TrafficCookie.remove();
//Cookies.PrefsCookie.remove();


function AppAssistant(appController) {
    AppAssistant.appController = appController; 
	AppAssistant.instance = this;
	this.appController = appController;   
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

AppAssistant.prototype.handleLaunch = function(launchParams){
	
   Mojo.Log.info("********* APP LAUNCH *************");
   var cardStageController = Mojo.Controller.stageController;
   Mojo.Log.info("Controller is: " + cardStageController);
 
   appLaunchParams = launchParams;
   if (!launchParams) {
      // FIRST LAUNCH or TAP on Icon when minimized
      if (cardStageController) {
         // Application already running (scenario 2)
         Mojo.Log.info("Relaunch!");
         cardStageController.activate();
      }
      else {
         // Need to launch the stage and scene (scenario 1) - standard launch
         Mojo.Log.info("Launching new stage!");
      }
   }
   else {
      if (cardStageController) {
		cardStageController.activate();
		Mojo.Controller.stageController.delegateToSceneAssistant('handleLaunch', launchParams);
	  };
   }
};

function StageAssistant(stageController) {
	
	AppAssistant.stageController = stageController;
	this.stageController = stageController;
}

StageAssistant.prototype.setup = function() {
// push the main scene
this.stageController.pushScene({name: "main", disableSceneScroller: true}, { Action: LaunchAction, maploc: maploc, mapto: mapto, Cookies: Cookies, launchParams: appLaunchParams});
this.stageController.setWindowOrientation("free");
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


