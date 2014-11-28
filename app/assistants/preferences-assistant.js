function PreferencesAssistant(PrefsCookie) {
	this.PrefsCookie = PrefsCookie;
}

PreferencesAssistant.prototype = {
setup: function() {

if(this.isTouchPad()){

		var menuModel = {
  visible: true,
  items: [
      {
          items: [
              { icon: "back", command: "goBack"},
          ]
      }
  ]
};
this.controller.setupWidget(Mojo.Menu.commandMenu,
         this.attributes = {
             spacerHeight: 0,
             menuClass: 'no-fade'
         },
         menuModel
	);

}; // konec if Touchpad

// SETUP THE UI WIDGETS


//set localized texts
document.getElementById("MainTitleText").innerHTML = $L("Preferences");
document.getElementById("GeneralText").innerHTML = $L("General");
document.getElementById("FullscreenModeText").innerHTML = $L("Fullscreen Mode");
document.getElementById("FullscreenModeInfoText").innerHTML = $L("Remember, app menu will be available only in non-fullscreen.<br><br>");
document.getElementById("APILangText").innerHTML = $L("Google API language");
document.getElementById("LangOverrideField").innerHTML = $L("DEFAULT");
document.getElementById("APILangInfoText").innerHTML = $L("Overrides Google API language, needs application restart.<br><br>");
document.getElementById("OverrideDirText").innerHTML = $L("Override directions launch request");
document.getElementById("OverrideDirInfoText").innerHTML = $L("If enabled, the application interprets every launch with parameters as search for place.<br><br>");
document.getElementById("ExperimentalTitleText").innerHTML = $L("Experimental features (UNSTABLE)");
document.getElementById("MapHeadingText").innerHTML = $L("Map Heading");
document.getElementById("MapHeadingInfoText").innerHTML = $L("When enabled and following map is active, the map is rotated to the actual heading if the velocity is higher than 3km/h.<br><br>");
document.getElementById("UnitsTitleText").innerHTML = $L("Units");
document.getElementById("MapCacheTitleText").innerHTML = $L("OSM Map cache (UNSTABLE)");
document.getElementById("MapCacheText").innerHTML = $L("Smart caching (OSM Map only)");
document.getElementById("MapCacheInfoText").innerHTML = $L("Enables smart caching, tiles are loaded from local storage and every new tile is saved to local storage for future use. Needs restart.");
document.getElementById("MapCachePathText").innerHTML = $L("Use MappingTool cache");
document.getElementById("MapCachePathInfoText").innerHTML = $L("If enabled, the map use the MappingTool cache in /media/internal/.MapTool directory");

// Fullscreen toggle button
this.controller.setupWidget("FullscreenToggle",
  this.FullscreenToggleAttributes = {
      trueValue: true,
      falseValue: false
  },
  this.FullscreenToggleModel = {
      value: false,
      disabled: false
  }
);
this.handleFullscreenToggleHandler = this.handleFullscreenToggle.bindAsEventListener(this);
Mojo.Event.listen(this.controller.get("FullscreenToggle"), Mojo.Event.propertyChange, this.handleFullscreenToggleHandler);

// MapRotate toggle button
this.controller.setupWidget("RotateToggle",
  this.RotateToggleAttributes = {
      trueValue: true,
      falseValue: false
  },
  this.RotateToggleModel = {
      value: false,
      disabled: false
  }
);

this.handleRotateToggleHandler = this.handleRotateToggle.bindAsEventListener(this);
Mojo.Event.listen(this.controller.get("RotateToggle"), Mojo.Event.propertyChange, this.handleRotateToggleHandler);

// Mapto toggle button
this.controller.setupWidget("MaptoToggle",
  this.MaptoToggleAttributes = {
      trueValue: true,
      falseValue: false
  },
  this.MaptoToggleModel = {
      value: false,
      disabled: false
  }
);
this.handleMaptoToggleHandler = this.handleMaptoToggle.bindAsEventListener(this);
Mojo.Event.listen(this.controller.get("MaptoToggle"), Mojo.Event.propertyChange, this.handleMaptoToggleHandler);

// MapCache toggle button
this.controller.setupWidget("MapCacheToggle",
  this.MapCacheToggleAttributes = {
      trueValue: true,
      falseValue: false
  },
  this.MapCacheToggleModel = {
      value: false,
      disabled: false
  }
);
this.handleMapCacheToggleHandler = this.handleMapCacheToggle.bindAsEventListener(this);
Mojo.Event.listen(this.controller.get("MapCacheToggle"), Mojo.Event.propertyChange, this.handleMapCacheToggleHandler);

// MapCachePath toggle button
this.controller.setupWidget("MapCachePathToggle",
  this.MapCachePathToggleAttributes = {
      trueValue: true,
      falseValue: false
  },
  this.MapCachePathToggleModel = {
      value: false,
      disabled: false
  }
);
this.handleMapCachePathToggleHandler = this.handleMapCachePathToggle.bindAsEventListener(this);
Mojo.Event.listen(this.controller.get("MapCachePathToggle"), Mojo.Event.propertyChange, this.handleMapCachePathToggleHandler);

//setup MapCahePath collapsible
this.controller.setupWidget("MapCachePathDrawer",
  this.MapCachePathDrawerAttributes = {
      modelProperty: 'open',
      unstyled: true
  },
  this.MapCachePathDrawerModel = {
      open: false
  }
); 


//Observe a text element with Language settings
this.LangOverrideFieldHandler = this.handleLangOverrideField.bindAsEventListener(this);
this.controller.get('LangOverrideField').observe(Mojo.Event.tap, this.LangOverrideFieldHandler);



//setup LangDrawer collapsible
this.controller.setupWidget("LangDrawer",
  this.attributes = {
      modelProperty: 'open',
      unstyled: true
  },
  this.LangDrawerModel = {
      open: false
  }
); 

//setup Lang list widget
this.controller.setupWidget("LangList",
	{
		itemTemplate: 'preferences/langlistentry',
		swipeToDelete: false,
        reorderable: false
	},
       this.LangListModel = {
		items : [
			{code:"",name:$L("DEFAULT")},
			{code:"ar",name:$L("Arabic")},
			{code:"eu",name:$L("Basque")},
			{code:"bg",name:$L("Bulgarian")},
			{code:"bn",name:$L("Bengali")},
			{code:"ca",name:$L("Catalan")},
			{code:"cs",name:$L("Czech")},
			{code:"da",name:$L("Danish")},
			{code:"de",name:$L("German")},
			{code:"el",name:$L("Greek")},
			{code:"en",name:$L("English")},
			{code:"en-AU",name:$L("English (Australian)")},
			{code:"en-GB",name:$L("English (Greatbritain)")},
			{code:"es",name:$L("Spanish")},
			{code:"fa",name:$L("Farsi")},
			{code:"fi",name:$L("Finnish")},
			{code:"fil",name:$L("Filipino")},
			{code:"fr",name:$L("French")},
			{code:"gl",name:$L("Galician")},
			{code:"gu",name:$L("Gujarati")},
			{code:"hi",name:$L("Hindi")},
			{code:"hr",name:$L("Croatian")},
			{code:"hu",name:$L("Hungarian")},
			{code:"id",name:$L("Indonesian")},
			{code:"it",name:$L("Italian")},
			{code:"iw",name:$L("Hebrew")},
			{code:"ja",name:$L("Japanese")},
			{code:"kn",name:$L("Kannada")},
			{code:"ko",name:$L("Korean")},
			{code:"lt",name:$L("Lithuanian")},
			{code:"lv",name:$L("Latvian")},
			{code:"ml",name:$L("Malayalam")},
			{code:"mr",name:$L("Marathi")},
			{code:"nl",name:$L("Dutch")},
			{code:"no",name:$L("Norwegian")},
			{code:"pl",name:$L("Polish")},
			{code:"pt",name:$L("Portuguese")},
			{code:"pt-BR",name:$L("Portuguese (Brazil)")},
			{code:"pt-PT",name:$L("Portuguese (Portugal)")},
			{code:"ro",name:$L("Romanian")},
			{code:"ru",name:$L("Russian")},
			{code:"sk",name:$L("Slovak")},
			{code:"sl",name:$L("Slovenian")},
			{code:"sr",name:$L("Serbian")},
			{code:"sv",name:$L("Swedish")},
			{code:"tl",name:$L("Tagalog")},
			{code:"ta",name:$L("Tamil")},
			{code:"te",name:$L("Telugu")},
			{code:"th",name:$L("Thai")},
			{code:"tr",name:$L("Turkish")},
			{code:"uk",name:$L("Ukrainian")},
			{code:"vi",name:$L("Vietnamese")},
			{code:"zh-CN",name:$L("Chinese (Simplified)")},
			{code:"zh-TW",name:$L("Chinese (Traditional)")},
			{code:"zh-HK",name:$L("Chinese (Hong Kong)")}
				]
  }
);

// setup LangList tap listener
this.LangListEventHandler = this.ListTap.bindAsEventListener(this);
this.LangList = this.controller.get('LangList');
Mojo.Event.listen(this.LangList, Mojo.Event.listTap, this.LangListEventHandler);

//setup Length units list selector
this.controller.setupWidget("LengthListselector",
  this.LengthListselectorattributes = {
      choices: [
          {label: $L("Metric"), value: "metric"},
          {label: $L("Imperial"), value: "imperial"}
      ],
      label: $L("Speed")+"/"+$L("Length")
  },
  this.LengthListselectormodel = {
      value: "metric",
      disabled: false
  }
);

// setup Lenght units listener
this.LengthListselectorEventHandler = this.LengthListselector.bindAsEventListener(this);
this.LengthListselector = this.controller.get('LengthListselector');
Mojo.Event.listen(this.LengthListselector, Mojo.Event.propertyChange, this.LengthListselectorEventHandler);
  
//setup Temperature units list selector
this.controller.setupWidget("TemperatureListselector",
  this.TemperatureListselectorattributes = {
      choices: [
          {label: $L("Celsius"), value: "celsius"},
          {label: $L("Fahrenheit"), value: "fahrenheit"}
      ],
      label: $L("Temperature")
  },
  this.TemperatureListselectormodel = {
      value: "celsius",
      disabled: false
  }
);

// setup temperature units listener
this.TemperatureListselectorEventHandler = this.TemperatureListselector.bindAsEventListener(this);
this.TemperatureListselector = this.controller.get('TemperatureListselector');
Mojo.Event.listen(this.TemperatureListselector, Mojo.Event.propertyChange, this.TemperatureListselectorEventHandler);

//SETUP PREFERENCES COOKIE

this.Preferences = this.PrefsCookie.get();
	//Mojo.Log.info("PREFERENCES: %j" , this.Preferences);
	
	if (this.Preferences == undefined)  {
		this.Preferences = DefaultPreferences;
		} else {
			try {
				this.checkAllPreferences(this.Preferences);
				this.setPrefsWidgets(this.Preferences);
				}
			catch (error) {
				Mojo.Log.info("Preferences not properly defined, revert to default", error);
				this.PrefsCookie.remove();
				this.Preferences = DefaultPreferences;
				this.PrefsCookie.put(this.Preferences);
				this.setPrefsWidgets(this.Preferences);
				};
		};

},

checkAllPreferences: function(Preferences) {
	
	// This function reads all Preferences adn Compare it to Default Preferences. If some preference is new, set the default
	// value of preference and push it to the cookies
	
	for (i in DefaultPreferences) {
		if (Preferences[i] == undefined) {
			//Mojo.Log.info("** UNDEFINED PREFERENCE *** %j", Preferences[i]);
			// set undefined prefs to default value
			Preferences[i] = DefaultPreferences[i];
			Mojo.Log.info("** SET NON EXIST PREFERENCE TO THEIR DEAFULT VALUE *** %j", Preferences[i]);
			// and put all to the Cookies
			this.PrefsCookie.put(Preferences);
		};
	};
},

activate: function() {
	this.controller.get('MapCachePathDrawer').mojo.setOpenState(this.MapCacheToggleModel.value);
	this.controller.getSceneScroller().mojo.scrollTo(0,0);
},

setPrefsWidgets: function(Preferences) {
	
	/* Set the widgets to their values */
  this.FullscreenToggleModel.value = Preferences.Fullscreen;
  this.RotateToggleModel.value = Preferences.MapRotate;
  this.MapCacheToggleModel.value = Preferences.MapCache;
  this.MapCachePathToggleModel.value = Preferences.MapCacheExternal;
  
  this.MaptoToggleModel.value = Preferences.MaptoOverride;
  var a = this.containsCode(this.LangListModel.items, Preferences.APILang.code);
  this.controller.get('LangOverrideField').innerHTML = $L(this.LangListModel.items[a].name);
  this.LengthListselectormodel.value = Preferences.LengthUnits;
  this.TemperatureListselectormodel.value = Preferences.Temperature;
 	
},

containsCode: function(a, obj) {
    var i = a.length;
    while (i--) {
       if (a[i].code === obj) {
           return i;
       }
    }
    return 0;
},
	
handleCommand: function(event) {
                if (event.type === Mojo.Event.command) {
                        if (event.command == 'goBack') {
                        this.controller.stageController.popScene();
                        }
                }
                

},

handleFullscreenToggle: function(event) {
	this.Preferences.Fullscreen = event.model.value;
	//window.PalmSystem.enableFullScreenMode(event.model.value);
	this.PrefsCookie.put(this.Preferences);
},

handleRotateToggle: function(event) {
	this.Preferences.MapRotate = event.model.value;
	this.PrefsCookie.put(this.Preferences);
},

handleMaptoToggle: function(event) {
	this.Preferences.MaptoOverride = event.model.value;
	this.PrefsCookie.put(this.Preferences);
},

handleMapCacheToggle: function(event) {
	this.Preferences.MapCache = event.model.value;
	this.PrefsCookie.put(this.Preferences);
	this.controller.get('MapCachePathDrawer').mojo.setOpenState(event.model.value);
},

handleMapCachePathToggle: function(event) {
	this.Preferences.MapCacheExternal = event.model.value;
	this.PrefsCookie.put(this.Preferences);
},

handleLangOverrideField: function(event) {
	//this will open the drawers state
	this.controller.get('LangDrawer').mojo.setOpenState(true);
},

ListTap: function (event) {
	//this will close the drawers state
	this.controller.get('LangDrawer').mojo.setOpenState(false);
	
	// save object list item (code, name) to the Cookie
	this.Preferences.APILang = event.item;
	this.PrefsCookie.put(this.Preferences);
	
	//read the name of the lang from the variable
	this.controller.get('LangOverrideField').innerHTML = this.Preferences.APILang.name;
	
},

LengthListselector: function (event) {
	this.Preferences.LengthUnits = event.value;
	this.PrefsCookie.put(this.Preferences);
},

TemperatureListselector: function (event) {
	this.Preferences.Temperature = event.value;
	this.PrefsCookie.put(this.Preferences);
},

isTouchPad: function(){

    if(Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("ouch")>-1) {

        return true;

		}

		if(Mojo.Environment.DeviceInfo.screenWidth==1024){ return true; }

		if(Mojo.Environment.DeviceInfo.screenHeight==1024){ return true; }

 

		return false;

},
cleanup: function() {

	Mojo.Event.stopListening(this.controller.get("FullscreenToggle"), Mojo.Event.propertyChange, this.handleFullscreenToggleHandler);
	Mojo.Event.stopListening(this.controller.get("RotateToggle"), Mojo.Event.propertyChange, this.handleRotateToggleHandler);
	Mojo.Event.stopListening(this.controller.get("MaptoToggle"), Mojo.Event.propertyChange, this.handleMaptoToggleHandler);
	Mojo.Event.stopListening(this.controller.get("MapCacheToggle"), Mojo.Event.propertyChange, this.handleMapCacheToggleHandler);
	Mojo.Event.stopListening(this.controller.get("MapCachePathToggle"), Mojo.Event.propertyChange, this.handleMapCachePathToggleHandler);
	}
};
