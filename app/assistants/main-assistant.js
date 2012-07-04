function MainAssistant(arg) {
this.maploc = arg.maploc;
this.mapto = arg.mapto;
this.LaunchArg = arg;
this.MapCookie = arg.Cookies.MapCookie;
this.TrafficCookie = arg.Cookies.TrafficCookie;
this.PrefsCookie = arg.Cookies.PrefsCookie;
}

MainAssistant.prototype = {
	setup: function() {

Ares.setupSceneAssistant(this);

//Check internet connectivity at first
this.checkConnectivity();



/* SETUP UI WIDGETS */

//setup directions panel scroller

this.controller.setupWidget("DirectionsPanelScroller",
  this.attributes = {
      mode: 'vertical'
  },
  this.DirectionsPanelScrollerModel = {
      snapElements: {
      x: []
      }
  }
);

if (this.isTouchPad()) {
	// set height of scroller for TP
	var listheight = Math.round(this.controller.window.innerHeight*0.84) + "px";
	document.getElementById("DirectionsPanelScroller").style.maxHeight = "620px";
	// TP as onlyone WebOS device support optimized markers in newest gAPI v3
	this.optimizedmarkers = true;
} else {
	// set height of scroller depends on device resolution
	var listheight = Math.round(this.controller.window.innerHeight*0.7) + "px";
	document.getElementById("DirectionsPanelScroller").style.maxHeight = listheight;
	// Older WebOS devices doesn't support optimized markers in newest gAPI v3
	this.optimizedmarkers = false;
	};

//setup toggle button directions type

this.controller.setupWidget("DirectType",
  this.attributes = {
      choices: [
          {label: $L("Drive"), value: "driving"},
          {label: $L("Walk"), value: "walking"},
        //  {label: "Pub.", value: 3}, not at this time
          {label: $L("Bike"), value: "bicycling"}
      ]
  },
  this.model = {
      value: "driving",
      disabled: false
  }
);

this.DirectTypeEventHandler = this.DirectType.bindAsEventListener(this);
this.DirectType = this.controller.get('DirectType');
Mojo.Event.listen(this.DirectType, Mojo.Event.propertyChange, this.DirectTypeEventHandler);

//setup get directions buttons

this.controller.setupWidget("GetDirectionsButton",
  this.attributes = {
  },
  this.DirectionsButtonModel = {
      label : $L("Get Directions >"),
      disabled: false
  }
);

this.GetDirectionsButtonEventHandler = this.GetDirectionsButtonTap.bindAsEventListener(this);
this.GetDirectionsButton = this.controller.get('GetDirectionsButton');
Mojo.Event.listen(this.GetDirectionsButton, Mojo.Event.tap, this.GetDirectionsButtonEventHandler);


//setup Origin Markers button listener

this.OriginMarkersButtonEventHandler = this.OriginMarkersButtonTap.bindAsEventListener(this);
this.OriginMarkersButton = this.controller.get('OriginMarkersButton');
Mojo.Event.listen(this.OriginMarkersButton, Mojo.Event.tap, this.OriginMarkersButtonEventHandler);

//setup Destination Markers button listener

this.DestinationMarkersButtonEventHandler = this.DestinationMarkersButtonTap.bindAsEventListener(this);
this.DestinationMarkersButton = this.controller.get('DestinationMarkersButton');
Mojo.Event.listen(this.DestinationMarkersButton, Mojo.Event.tap, this.DestinationMarkersButtonEventHandler);

//setup map hold listener

this.MapHoldEventHandler = this.MapHold.bindAsEventListener(this);
this.MapHold = this.controller.get('map_canvas');
Mojo.Event.listen(this.MapHold, Mojo.Event.hold, this.MapHoldEventHandler);


//setup TP Back buttons

this.controller.setupWidget("TPBackButton",
  this.attributes = {
  },
  this.BackButtonModel = {
      label : "Back",
      disabled: false
  }
);

this.TPBackButtonEventHandler = this.handleBackSwipe.bindAsEventListener(this);
this.TPBackButton = this.controller.get('TPBackButton');
Mojo.Event.listen(this.TPBackButton, Mojo.Event.tap, this.TPBackButtonEventHandler);

this.controller.setupWidget("TPBackButtonD",
  this.attributes = {
  },
  this.BackButtonModel
);

this.TPBackButtonD = this.controller.get('TPBackButtonD');
Mojo.Event.listen(this.TPBackButtonD, Mojo.Event.tap, this.TPBackButtonEventHandler);

// setup loading spinner

this.controller.setupWidget("LoadingSpinner",
  this.attributes = {
      spinnerSize: "large"
  },
  this.LoadApiModel = {
      spinning: true
  }
);

//Observe a Swap button element in Directions input
this.SwapDirectionsHandler = this.SwapDirections.bindAsEventListener(this);
this.controller.get('SwapButton').observe(Mojo.Event.tap, this.SwapDirectionsHandler);

//Set localized HTML texts
this.setLocalizedHTML();

// --- test EVENETS help function for me
/*
 var gestures = [
         'click',
         'dragstart',
         'dragfinish',
         'drag',
         'drop',
         'dragover',
         'dragout',
         'mousedown',
         'mousehold',
         'mouseholdpulse',
         'mousemove',
         'mouseout',
         'mouseover',
         'mouserelease',
         'mouseup',
         'touchstart',
         'touchmove',
         'touchend',
         'touchcancel'];
      for (var g in gestures) {
         document.addEventListener(gestures[g], function(event) {
             Mojo.Log.info("*** EVENT TEST ***",event.type);
         }, true);
      };

*/


	this.$.gps1.startTracking();

	/* vsechny normalni pristroje az na Pre3 maji rozdil pro velikost menu 170 */
	this.widthadd = 170-60;
	this.heightadd = 170-60;
	
	//Puvodne jsem to prirazoval natvrdo, tohle je obecnejsi, ziskat pixel ratio (Pre3 1.5, ostatni 1.0)
	this.ScreenRoughRatio = this.controller.window.devicePixelRatio;
	
	if(this.isPre3()){
		Mojo.Log.info("*** Detected device is Pre3 ***");
		this.widthadd = 330-60;
		this.heightadd = 440-60;
		//this.ScreenRoughRatio = this.controller.window.devicePixelRatio;
		this.restmenuwidth = Mojo.Environment.DeviceInfo.screenWidth - this.widthadd;
	} else {
		//this.ScreenRoughRatio = this.controller.window.devicePixelRatio;
		/* hodnota zbytku menu */
		this.restmenuwidth = this.controller.window.innerWidth - this.widthadd;
		};


	this.createMenu();

	
	this.GPSFix = false;

	//setup geocoder
	this.geocoder = new google.maps.Geocoder();

	//setup map
	this.MyLocation = new google.maps.LatLng(37.39281, -122.04046199999999);
	
	//if this is enabled, the poi's on the map are disabled
	var mapStyles =[
    {
        featureType: "all",
        elementType: "labels",
        stylers: [
              { visibility: "off" }
        ]
    }
	];
	
this.mapStyleNight = [
[
  {
    stylers: [
      { saturation: -73 },
      { visibility: "simplified" }
    ]
  }
],
[
  {
    featureType: "road",
    stylers: [
      { hue: "#dd00ff" }
    ]
  },{
    featureType: "water",
    stylers: [
      { hue: "#00f6ff" },
      { lightness: -18 },
      { saturation: 62 }
    ]
  },{
    featureType: "landscape",
    stylers: [
      { hue: "#ffc300" },
      { saturation: 63 },
      { lightness: -16 }
    ]
  }
],
[
  {
    elementType: "geometry",
    stylers: [
      { gamma: 3.16 }
    ]
  },{
    featureType: "transit",
    stylers: [
      { visibility: "on" },
      { hue: "#ff0008" },
      { saturation: 95 },
      { lightness: -40 }
    ]
  },{
    featureType: "road",
    elementType: "labels",
    stylers: [
      { visibility: "off" }
    ]
  },{
    featureType: "water",
    stylers: [
      { saturation: 59 },
      { lightness: -8 }
    ]
  }
],
[
  {
    stylers: [
      { invert_lightness: true }
    ]
  }
]
];

    var myOptions = {
        zoom: 2,
        center: this.MyLocation,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        scaleControl: true,
        maxZoom: 20,
        minZoom: 1,
        //styles: mapStyleNight[3],
      	draggable: false	
    };
    this.map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

	this.MapType = this.MapCookie.get();
	
	if (this.MapType == undefined)  {
		this.ActualMapType = [true, false, false, false];
		Mojo.Log.info("DEFAULT:" , this.MapType);
		} else {
			//this.MapType.remove();
			Mojo.Log.info("Cookie MapType:" , this.MapType);
			try {
				this.handlePopMapType(this.MapType);
				}
			catch (error) {
				Mojo.Log.info("Layers cookie not properly defined, revert to default", error);
				this.MapCookie.remove();
				this.MapType = "Roadmap";
				this.MapCookie.put(this.MapType);
				this.handlePopMapType(this.MapType);
				};
		};
		
	// Setup the overlay to use for projections (pixels to latlng and vice versa, etc...)
	this.overlay = new google.maps.OverlayView();
	this.overlay.draw = function() {};
	this.overlay.setMap(this.map); 

	/** Setup the Preferences variables */
	
	this.Preferences = this.PrefsCookie.get();
	Mojo.Log.info("PREFERENCES: %j" , this.Preferences);
	
	if (this.Preferences == undefined)  {
		this.Preferences = DefaultPreferences;
		this.PrefsCookie.put(this.Preferences);
		} else {
			try {
				this.checkAllPreferences(this.Preferences);
				//this.setPrefsWidgets(this.Preferences);
				}
			catch (error) {
				Mojo.Log.info("Preferences not properly defined, revert to default", error);
				this.PrefsCookie.remove();
				this.Preferences = DefaultPreferences;
				this.PrefsCookie.put(this.Preferences);
				//this.setPrefsWidgets(this.Preferences);
				};
		};
		
	this.controller.enableFullScreenMode(this.Preferences.Fullscreen);
	
    // Na pozdeji implementace jinych mapovych podkladu napr. openstreetmaps
    /*
    this.map.mapTypes.set("Google", new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                    return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
                },
                tileSize: new google.maps.Size(256, 256),
                name: "OpenStreetMap",
                maxZoom: 18
            }));
    */

    	// setup autocompleter for main search
		this.MainInput = "";
		this.MainInput = document.getElementById("MainSearchField");
        this.Mainautocomplete = new google.maps.places.Autocomplete(this.MainInput);
        this.Mainautocomplete.bindTo('bounds', this.map);

        new google.maps.event.addListener(this.Mainautocomplete, 'place_changed', this.SelectedPlace.bind(this));


        // setup autocompleter for origin search
		this.OriginInput = "";
		this.OriginInput = document.getElementById("OriginSearchField");
        this.Originautocomplete = new google.maps.places.Autocomplete(this.OriginInput);
        this.Originautocomplete.bindTo('bounds', this.map);

        new google.maps.event.addListener(this.Originautocomplete, 'place_changed', this.SelectedOriginPlace.bind(this));

        // setup autocompleter for destination search
		this.DestinationInput = "";
		this.DestinationInput = document.getElementById("DestinationSearchField");
        this.Destinationautocomplete = new google.maps.places.Autocomplete(this.DestinationInput);
        this.Destinationautocomplete.bindTo('bounds', this.map);

        new google.maps.event.addListener(this.Destinationautocomplete, 'place_changed', this.SelectedDestinationPlace.bind(this));

    //Setup arrays to hold our markers and infoBubbles and other variables
    this.markers = [];
	this.infoBubbles = [];
	this.DirectinfoBubbles = [];
	this.Directmarkers = [];
	this.DirectStep = 0;
	this.NearbyinfoBubbles = [];
	this.Nearbymarkers = [];
	this.NearbyStep = 0;
	this.blockTPPan = false;
	this.isdragging = false;
	this.wasflicked = true;
	this.Pre3refreshcounter = 0;


	// map doesn't follow GPS as default
	this.followMap = false;

	//setup direction service
    var rendererOptions = {
  		map: this.map,
  		suppressMarkers: true,
  		suppressInfoWindows: true,
  		draggable: false,
		}
    this.directionsService = new google.maps.DirectionsService();
	this.directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
	this.directionsDisplay.setPanel(document.getElementById('directions-panel'));
	
	//this.TrafficVisibile = false;
    this.trafficLayer = new google.maps.TrafficLayer();

	// load cookie for traffic layer
	this.TrafficVisibile = this.TrafficCookie.get();
	Mojo.Log.info("TRAFFIC:" , this.TrafficVisibile);
	if (this.TrafficVisibile == undefined)  {
		this.TrafficVisibile = false;
		this.TrafficCookie.put(true);
		} else {
			try {
					this.Traffic();					
				}
			catch (error) {				
					Mojo.Log.info("Cookie not properly defined, revert to default", error);
					this.TrafficCookie.remove();
					this.TrafficCookie.put(false);
					this.TrafficVisibile = false;
				  }
			  
		};
		
	//Setup Bycicling layer
    this.bikeLayer = new google.maps.BicyclingLayer();
    this.BikeVisibile = this.Preferences.Bike;
    if (this.BikeVisibile) {this.bikeLayer.setMap(this.map)};
    
	//Setup Weather layer
	this.weatherLayer = new google.maps.weather.WeatherLayer({
		suppressInfoWindows: true
	});
	this.WeatherVisibile = this.Preferences.Weather;
	if (this.WeatherVisibile) {this.weatherLayer.setMap(this.map)};
		
	//Setup Cloud Layer
	this.cloudLayer = new google.maps.weather.CloudLayer();
	this.CloudVisibile = this.Preferences.Cloud;
	if (this.CloudVisibile) {this.cloudLayer.setMap(this.map)};
	
	//Setup Night Style
	this.NightVisibile = this.Preferences.Night;
	if (this.NightVisibile) {
		var styleoptions = {
		styles: this.mapStyleNight[3]
		};
			this.map.setOptions(styleoptions);
	};
	
	//Set to last view
	var lastlatlng = new google.maps.LatLng(this.Preferences.LastLoc.lat, this.Preferences.LastLoc.lng);
	this.map.setCenter(lastlatlng);
	this.map.setZoom(this.Preferences.LastLoc.zoom);
	
	/*
	//Setup Panoramio Layer
	var panoramioOptions = {
		suppressInfoWindows: true,
		optimized: false
	};
	var panoramioLayer = new google.maps.panoramio.PanoramioLayer(panoramioOptions);
	panoramioLayer.setMap(this.map);
	*/

	


 	new google.maps.event.addListener(this.map, 'idle', this.MapIdle.bind(this));
 	new google.maps.event.addListener(this.map, 'tilesloaded', this.MapTilesLoaded.bind(this));
 	new google.maps.event.addListener(this.map, 'bounds_changed', this.MapCenterChanged.bind(this));
 	//new google.maps.event.addListener(this.map, 'projection_changed', this.ProjectionChanged.bind(this));
 	this.CenterChanged = true;
 	
 	new google.maps.event.addDomListener(document.getElementById('map_canvas'), 'resize', this.Resize.bind(this));
 	
 	//key press listener
 	this.KeypresseventHandler = this.Keypress.bindAsEventListener(this);
	this.controller.listen(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);
	this.KeyWasPressed = false;
	
	//searchfield key press listener
 	this.SearchKeypresseventHandler = this.SearchKeypress.bindAsEventListener(this);
	this.controller.listen(document.getElementById('MainSearchField'), 'keydown', this.SearchKeypresseventHandler);
	this.SearchKeyWasPressed = false;
	
	//searchfield onpaste listener
 	this.SearchPasteeventHandler = this.SearchPaste.bindAsEventListener(this);
	this.controller.listen(document.getElementById('MainSearchField'), 'paste', this.SearchPasteeventHandler);

  	// Map Pinch to Zoom lisetener
	Mojo.Event.listen(this.controller.get("map_canvas"), "gesturestart", this.handleGestureStart.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get("map_canvas"), "gesturechange", this.handleGestureChange.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get("map_canvas"), "gestureend", this.handleGestureEnd.bindAsEventListener(this));
	//Mojo.Event.listen(this.controller.get("map_canvas"), "click", this.click.bindAsEventListener(this));

	//setup dragging listeners
	this.dragStartHandler = this.dragStart.bindAsEventListener(this);
	//this.dragEndHandler = this.dragEnd.bindAsEventListener(this);
	this.draggingHandler = this.dragging.bindAsEventListener(this);
	this.flickHandler = this.flick.bindAsEventListener(this);


	// TODO: mousedown event is needed by hiding the command menu
	//Mojo.Event.listen(this.controller.get("map_canvas"), 'mousedown', this.mousedownHandler.bind(this));

//******* zjistovani devices *******

/*
Mojo.Log.info("**** VERZE ****", Mojo.Environment.DeviceInfo.platformVersion);
Mojo.Log.info("**** VERZE ****", Mojo.Environment.DeviceInfo.platformVersionMajor);
Mojo.Log.info("**** VERZE ****", Mojo.Environment.DeviceInfo.platformVersionMinor);
Mojo.Log.info("**** VERZE ****", Mojo.Environment.DeviceInfo.platformVersionDot);
//Mojo.Log.info("**** VERZE ****", Mojo.Environment.DeviceInfo.screenWidth);
*/
//*******************************

},
/*
setPreferences: function(argPreferences) {
	
	
	Mojo.Log.info("**** Setting preferences %j ****", argPreferences);
	this.Fullscreen = argPreferences.Fullscreen;
	this.MapRotate = argPreferences.MapRotate;
	this.MaptoOverride = argPreferences.MaptoOverride;
	
},
*/
handleCommand: function(event) {
	
	if(event.type == Mojo.Event.commandEnable && (event.command == Mojo.Menu.helpCmd || event.command == Mojo.Menu.prefsCmd)) {
      event.stopPropagation();
    };
                if (event.type === Mojo.Event.command) {
                        if (event.command == 'zoomOut') {
                                        this.map.setZoom(this.map.getZoom() - 1);
                        }
                        if (event.command == 'zoomIn') {
                                        this.map.setZoom(this.map.getZoom() + 1);
                        }
                        if ((event.command == 'forward-step') || (event.command == 'back-step')) {
                                        this.moveOnRoute(event.command);
                        }
                        if (event.command == 'maptype') {
                                         var near = event.originalEvent && event.originalEvent.target;
                                         this.controller.popupSubmenu({
																				  onChoose:  this.handlePopMapType,
																				  placeNear: near,
																				  items: [
																				      {secondaryIconPath:'images/maptype-roadmap.png', label: $L('Roadmap'), command: 'Roadmap', chosen: this.ActualMapType[0]},
																				      {secondaryIconPath:'images/maptype-hybrid.png', label: $L('Hybrid'), command: 'Hybrid', chosen: this.ActualMapType[1]},
																				      {secondaryIconPath:'images/maptype-terrain.png', label: $L('Terrain'), command: 'Terrain', chosen: this.ActualMapType[2]},
																				      {secondaryIconPath:'images/maptype-satellite.png', label: $L('Satellite'), command: 'Satellite', chosen: this.ActualMapType[3]},
																				      {secondaryIconPath:'images/night.png', label: $L('Night'), command: 'do-night', chosen: this.NightVisibile},
																				      {secondaryIconPath:'images/traffic-icon.png', label: $L('Traffic'), command: 'do-traffic', chosen: this.TrafficVisibile},
																				      {secondaryIconPath:'images/bike.png', label: $L('Bike'), command: 'do-bike', chosen: this.BikeVisibile},
																				      {secondaryIconPath:'images/weather.png', label: $L('Weather'), command: 'do-weather', chosen: this.WeatherVisibile},
																				      {secondaryIconPath:'images/cloud.png', label: $L('Clouds'), command: 'do-cloud', chosen: this.CloudVisibile},
																				      
																				  ]
																				});
                        }
                        if (event.command == 'do-about') {
                        								this.controller.stageController.pushScene({'name': 'about'});
                        }
                        if (event.command == 'do-license') {
                        								this.controller.stageController.pushScene({'name': 'license'});
                        }
                        if (event.command == 'searchPlaces') {
                        								this.Search();
                        }
                        if (event.command == 'debug') {
                        								this.Debug();
                        }
                        if (event.command == 'MyLoc') {
                        								this.mylocation();
                        }
                        if (event.command == 'PopMenu') {

                        								var near = event.originalEvent && event.originalEvent.target;
                        								if (!this.Preferences.Fullscreen) {
														this.controller.popupSubmenu({
																				  onChoose:  this.handlePopMenu,
																				  placeNear: near,
																				  items: [
																					  {iconPath:'images/markers-icon.png', label: $L('Markers'), command: 'do-markers'},
																					  {iconPath:'images/direction-icon.png', label: $L('Directions'), command: 'do-direct'},
																				      {iconPath:'images/street.png', label: $L('Street View'), command: 'do-street'},					      
																				      //{iconPath:'images/traffic-icon.png', label: 'Traffic', command: 'do-traffic', chosen: this.TrafficVisibile},
																				      {iconPath:'images/clear-map.png', label: $L('Clear map'), command: 'do-clearmap'}
																				  ]
																				});} else {
																				this.controller.popupSubmenu({
																				  onChoose:  this.handlePopMenu,
																				  placeNear: near,
																				  items: [
																					  {iconPath:'images/exit-fullscreen.png', label: $L('Exit Fullscreen'), command: 'do-fullscreenoff'},
																				      {iconPath:'images/markers-icon.png', label: $L('Markers'), command: 'do-markers'},
																					  {iconPath:'images/direction-icon.png', label: $L('Directions'), command: 'do-direct'},
																				      {iconPath:'images/street.png', label: $L('Street View'), command: 'do-street'},
																				      //{iconPath:'images/traffic-icon.png', label: 'Traffic', command: 'do-traffic', chosen: this.TrafficVisibile},
																				      {iconPath:'images/clear-map.png', label: $L('Clear map'), command: 'do-clearmap'}
																						  ]
																						});
																					};
                        }
                        if (event.command == 'searchDone') {
                        								this.zoom();
                        }
                        if (event.command == Mojo.Menu.prefsCmd) {
                        	this.controller.stageController.pushScene({'name': 'preferences'}, this.PrefsCookie);							
                        }
                        if (event.command == Mojo.Menu.helpCmd) {
                        								
                        }
                };
             
            //handle Back swipe event   
            if (event.type == Mojo.Event.back) {
				this.handleBackSwipe(event);
			}
  },



cleanup: function() {
		
		Ares.cleanupSceneAssistant(this);
		
		//Save last location and zoom
		this.Preferences.LastLoc.lat = this.map.getCenter().lat();
		this.Preferences.LastLoc.lng = this.map.getCenter().lng();
		this.Preferences.LastLoc.zoom = this.map.getZoom();
		this.PrefsCookie.put(this.Preferences);

		/* Stop all running listeners */
		Mojo.Event.stopListening(this.controller.get("trick_container"), "gesturestart", this.handleGestureStart.bind(this));
		Mojo.Event.stopListening(this.controller.get("trick_container"), "gesturechange", this.handleGestureChange.bind(this));
		Mojo.Event.stopListening(this.controller.get("trick_container"), "gestureend", this.handleGestureEnd.bind(this));
		Mojo.Event.stopListening(this.controller.get("map_canvas"), 'mousedown', this.mousedownHandler.bind(this));
		Mojo.Event.stopListening(this.controller.get("map_canvas"), "click", this.click.bind(this));
		Mojo.Event.stopListening(this.controller.sceneElement, Mojo.Event.keydown, this.KeypresseventHandler);

		if (this.WebOS22) { //asi to vypinalo listenery na TP a pak neslo posouvat mapu
			Mojo.Event.stopListening(this.controller.stageController.document, Mojo.Event.dragStart, this.dragStartHandler);
			Mojo.Event.stopListening(this.controller.get("map_canvas"), 'mouseup', this.mouseup.bind(this)); //dragEnd isn't working, I don't know why
			Mojo.Event.stopListening(this.controller.stageController.document, Mojo.Event.dragging, this.draggingHandler);
			Mojo.Event.stopListening(this.controller.stageController.document, Mojo.Event.flick, this.flickHandler);
			
			
		};

		Mojo.Event.stopListening(this.DirectType, Mojo.Event.propertyChange, this.DirectTypeEventHandler);
		Mojo.Event.stopListening(this.GetDirectionsButton, Mojo.Event.tap, this.GetDirectionsButtonEventHandler);
		Mojo.Event.stopListening(this.TPBackButton, Mojo.Event.tap, this.TPBackButtonEventHandler);
		Mojo.Event.stopListening(this.TPBackButtonD, Mojo.Event.tap, this.TPBackButtonEventHandler);
		Mojo.Event.stopListening(this.OriginMarkersButton, Mojo.Event.tap, this.OriginMarkersButtonEventHandler);
		Mojo.Event.stopListening(this.DestinationMarkersButton, Mojo.Event.tap, this.DestinationMarkersButtonEventHandler);
		Mojo.Event.stopListening(this.MapHold, Mojo.Event.hold, this.MapHoldEventHandler);
},


createMenu: function() {

	if(this.isTouchPad()){
		//this.restmenuwidth = 598; //workaround of Touchpad Orientation handle event BUG
		$("TPBackButton").show(); //zapnu vsude backbuttony
		$("TPBackButtonD").show();
		this.actualTPwidth = this.controller.window.innerWidth;
		//document.getElementById("MainSearchField").style.width= '60% !important;';
	};

/* Setup bottom command menu */
this.cmdMenuModel = {
  visible: true,
  items: [
      {
          items: [
          ]
      },
      {
          items: [
              //{label: $L('DEV'), command:'debug'},
              {label: $L('Minus'), iconPath:'images/zoomout.png', command:'zoomOut'},
              {label: $L(''), iconPath:'images/list-view-icon.png', command:'PopMenu'},
              {label: $L('Plus'), iconPath:'images/zoomin.png', command:'zoomIn'}
          ]
      },
      {
          items: [
          ]
      }
  ]
};

this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass:'bottom-menu'}, this.cmdMenuModel);

/* Setup application menu */
this.appMenuModel = {
  items: [
      {label: $L("About..."), command: 'do-about', shortcut: 'a'},
      {label: $L("License"), command: 'do-license', shortcut: 'l'}
  ]
};

this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: false }, this.appMenuModel);

/* Setup top menu */
this.feedMenuModel = {
  visible: true,
  items: [

  		{
          items: [
          ]
      },
  		{
      items: [
		  //{template:'main/top-bar-template'},
		  {},
          //{ icon: "search", command: 'searchPlaces', label: ""},
          //{template:'main/search', width: 200},
          { label: $L("Google Maps"), command: 'searchPlaces', width: this.restmenuwidth},
          //{ label: $L("Tap or type to search..."), command: 'searchPlaces', width: this.restmenuwidth},
          { iconPath: "images/layers.png", command: 'maptype', label: $L('M')},
          {label: $L('MyLoc'), iconPath:'images/menu-icon-mylocation.png', command:'MyLoc'}
      ]
      },
      {
          items: [
          ]
      }
  ]
 };

this.controller.setupWidget(Mojo.Menu.viewMenu,
  { spacerHeight: 0, menuClass:'no-fade' },
  this.feedMenuModel);

},

gps1Success: function(inSender, inResponse, inRequest) {


	var accuracy = 500; // default accuracy

	var Mylatlng = new google.maps.LatLng(inResponse.latitude, inResponse.longitude);

	// tady je to nutne, aby GPS nedavala nedefinovane souradnice
	if (inResponse.latitude != undefined) {
	
	/*	//UNCOMMENT IT FOR TESTING PURPOSES IN EMULATOR
		if (this.MyLocation != undefined) {
			this.Heading = this.GetHeadingFromLatLng(this.MyLocation, Mylatlng);
			Mojo.Log.info("** HEADING ***", this.Heading);
			this.MapHeadingRotate(-this.Heading);
		};
		*/
	
		
	this.MyLocation = Mylatlng;


	// follow the map if the button in menu is active
	if (this.followMap) {
		//this.controller.window.innerWidth = 480;
		//Mojo.Log.info("** FOLLOWING MAP ***");
		//Mojo.Log.info("** INNER WIDTH ***", this.controller.window.innerWidth);
		//Mojo.Log.info("** INNER HEIGHT ***", this.controller.window.innerHeight);
		//Mojo.Log.info("** PIXEL RATIO ***", this.controller.window.devicePixelRatio)
		this.map.panTo(this.MyLocation);
		if (this.isPre3()) this.Pre3refreshcounter++;
		if (this.isPre3() && this.Pre3refreshcounter > 5) {
			this.Pre3Refresh();
			this.Pre3refreshcounter = 0;
			};
		//this.map.setCenter(this.MyLocation);
		if (inResponse.velocity > 0.5) {
			var velocity = Math.round(inResponse.velocity*3.6) + " km/h";
			this.SetTopMenuText(velocity);
		} else {
			this.SetTopMenuText($L("Google Maps"));
		};
		
		//google.maps.event.trigger(this.map, "center_changed");
	};


	//Mojo.Log.info("** MyLocation ***", this.MyLocation);
	this.accuracy = inResponse.horizAccuracy;

	if (this.accuracy < 0) {
		this.accuracy = 350; //odpovida accuracy fix 2
	}

	if (this.GPSFix == false) {
		var oldaccuracy = this.accuracy;
		this.circle = new google.maps.Circle({
			center: this.MyLocation,
			radius: this.accuracy, //radius v metrech
			map: this.map,
			optimized: this.optimizedmarkers,
			fillColor: "#60bbe5",
			fillOpacity: 0.1,
			strokeColor: "#60bbe5",
			strokeOpacity: 0.4,
			strokeWeight: 1
		});


if(this.isPre3()){
				var image = new google.maps.MarkerImage('images/blue_dot.png',
				new google.maps.Size(24, 24),
				new google.maps.Point(0, 0), // origin
				new google.maps.Point(12, 12), // anchor
				new google.maps.Point(24, 24) //Scale to - kdyz neni aktivovano, dela to hranate kolecko na Pre3
				);
				} else {
				var image = new google.maps.MarkerImage('images/blue_dot.png',
				new google.maps.Size(24, 24),
				new google.maps.Point(0, 0), // origin
				new google.maps.Point(12, 12) // anchor
				);
};

				this.MyLocMarker = new google.maps.Marker({
					position: this.MyLocation,
					map: this.map,
					icon: image,
					optimized: this.optimizedmarkers,
					flat: true,
					title: 'I might be here'
				});


				this.GPSFix = true;
				this.map.setCenter(this.MyLocation);

				/* v pripade spusteni s argumentem maploc chceme zustat na markeru a ne prejit na polohu */
				if (this.maploc == undefined) {
						//set the zoom level to the circle's size
						this.map.fitBounds(this.circle.getBounds());
						if ( this.map.getZoom() > 14 ) {
		    				this.map.setZoom(14);
		  					}
  			};

				/* po zjisteni polohy spusti dalsi scenu s directions*/
				if (this.LaunchArg.Action == "mapto") {

					this.handleMapTo();
					//and close the GPS wait dialog
					this.GPSdialog.mojo.close();
				};

		} else {
			this.MyLocMarker.setPosition(this.MyLocation); //update markeru
			this.circle.bindTo('center', this.MyLocMarker, 'position');

			if (this.accuracy != this.oldaccuracy) {
				this.circle.setRadius(this.accuracy); // update accuracy circle
				this.oldaccuracy = this.accuracy;
			};
			
			if (inResponse.heading != -1 && this.followMap && this.Preferences.MapRotate && (inResponse.velocity > 0.83)) { //funguje
				this.MapHeadingRotate(-inResponse.heading); //funguje
			};

		};
		
	};


},

StreetView: function() {

	this.WebOS2Events("stop");
	var position = this.map.getCenter();
	this.controller.stageController.pushScene({'name': 'street', transition: Mojo.Transition.none}, position);

},

zoom: function() {
		//var oldZoom = this.map.getZoom();

  this.map.setZoom(7);
	},

mylocation: function() {

								if (this.GPSFix == true) {
									
									//block screen timeout
									this.BlockScreenTimeout(true);

									// change the icon as "follow map is active"
									this.feedMenuModel.items[1].items[3].iconPath = 'images/menu-icon-mylocation-follow.png';
									this.controller.modelChanged(this.feedMenuModel);
									this.followMap = true;

									//start the mousedown listener
									this.mousedownInterruptsFollowHandler = this.mousedownInterruptsFollow.bindAsEventListener(this);
									Mojo.Event.listen(this.controller.get("map_canvas"), 'mousedown', this.mousedownInterruptsFollowHandler);

									this.map.panTo(this.MyLocation);
									//set the zoom level to the circle's size
									this.map.fitBounds(this.circle.getBounds());
									if ( this.map.getZoom() > 16 ) {
											this.map.setZoom(16);
										}
										
									if (this.isPre3()) {	
										this.Pre3Refresh(); // Pre3 centering offset workaround
									};

									//Mojo.Log.info("** MyLocation BUTTON ***", this.MyLocation);
								} else {Mojo.Controller.errorDialog($L("Wait for GPS fix!"));}
},

mousedownInterruptsFollow: function () {

	//stop the mousedown listener
	Mojo.Event.stopListening(this.controller.get("map_canvas"), 'mousedown', this.mousedownInterruptsFollowHandler);

	this.followMap = false;
	
	//unblock screen timeout
	this.BlockScreenTimeout(false);

	// change the icon as "follow map is active"
	this.feedMenuModel.items[1].items[3].iconPath = 'images/menu-icon-mylocation.png';
	this.controller.modelChanged(this.feedMenuModel);
	
	//rotate the map to the default heading
	this.MapHeadingRotate(0); 
	
	//set default text to the top menu
	this.SetTopMenuText($L("Google Maps"));


},

BlockScreenTimeout: function(value) {
	
	//block screen timeout
	this.controller.stageController.setWindowProperties(
	{
		blockScreenTimeout: value 
	}
	);
},

handlePopMapType: function(MapType) {


      switch (MapType) {

        case 'Roadmap':
            this.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
            this.ClearMapType();
            this.ActualMapType[0] = true;
            this.MapCookie.put(MapType);
            break;
        case 'Hybrid':
            this.map.setMapTypeId(google.maps.MapTypeId.HYBRID);
            this.ClearMapType();
            this.ActualMapType[1] = true;
            this.MapCookie.put(MapType);
            break;
        case 'Terrain':
            this.map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
            this.ClearMapType();
            this.ActualMapType[2] = true;
            this.MapCookie.put(MapType);
            break;
        case 'Satellite':
            this.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
            this.ClearMapType();
            this.ActualMapType[3] = true;
            this.MapCookie.put(MapType);
            break;
        case 'do-traffic':
            this.Traffic();
        	break;
        case 'do-bike':
            this.Bike();
        	break;
        case 'do-weather':
            this.Weather();
        	break;
        case 'do-cloud':
            this.Cloud();
        	break;
        case 'do-night':
            this.Night();
        	break;
      }

	},

ClearMapType: function() {

	this.ActualMapType = [false, false, false, false];

	},

handlePopMenu: function(Case) {


      switch (Case) {
		 case 'do-fullscreenoff':
            this.FullscreenOff();
            break;
         case 'do-markers':
            this.getMarkerFromList("info");
            break;	  
         case 'do-street':
            this.StreetView();
            break;
         case 'do-direct':
			this.Directions();
            break;
         case 'do-clearmap':
            this.mapClear();
         	break;
      }

	},

activate: function(args) {
	
	
		try {
				//update a Preferences variables from Cookies after each activate
				this.Preferences = this.PrefsCookie.get();	
				}
			catch (error) {
				Mojo.Log.info("Preferences cookie not properly defined", error);
				};
				
				//Mojo.Log.info("** PREFERENCES *** %j", this.Preferences);
		
				//resize the map after each focus back
				google.maps.event.trigger(this.map, "resize");


		if (this.LaunchArg.Action != undefined) {
			
				// Override mapto -> maploc if set in Preferences
				if (this.LaunchArg.Action == "mapto" && this.Preferences.MaptoOverride) {
					this.LaunchArg.Action = "maploc";
					this.maploc = this.mapto;
					this.mapto = undefined;
				Mojo.Log.info("*** LAUNCH MAPTO DIRECTIONS AND OVERRIDING TO MAPLOC ***", this.maploc);
				//this.handleMapLoc();
				};
				
				// byla aplikace spustena jako hledani mista?
				if (this.LaunchArg.Action == "maploc" || this.maploc != undefined) {
				this.handleMapLoc();
				};

				// byla aplikace spustena jako navigace na misto?
				if (this.LaunchArg.Action == "mapto" || this.mapto != undefined) {
				Mojo.Log.info("*** LAUNCH MAPTO DIRECTIONS ***", this.mapto);
				this.handleMapTo();
				};
		};

		//Mojo.Log.info("** MAIN ACTIVATE ***");
		// Zarizeni s WebOS 2.2.x potrebuji odchytavat primo eventy z touchscreenu, v activate je to proto aby se aktivovaly odposlouchavace i pri navratu na mapu
		this.WebOS2Events('start');

		// navrat na stred markeru
		if (args != undefined) {
			//Mojo.Log.info("*** ACTION IN ACTIVATE ***", args.action);
				switch (args.action) {

					case "mapto-from-active":
						this.handleMapTo();
					break;		
					case "info":
						this.map.panTo(args.place.geometry.location);
						this.map.setZoom(17);
						
						//block TP pan
						this.blockTPPan = true;
						
						//unblock the TP pan after 2 seconds
						(function(){
								this.blockTPPan = false;
								
						}).bind(this).delay(2);
						
					break;	
					case "origin":
						this.origin = args.place.geometry.location;
						if (args.place.vicinity != "") {
							this.controller.get("OriginSearchField").value = args.place.name + ", " + args.place.vicinity;
						} else {
							this.controller.get("OriginSearchField").value = args.place.name;
						};
					break;
					case "destination":
						this.destination = args.place.geometry.location;
						if (args.place.vicinity != "") {
							this.controller.get("DestinationSearchField").value = args.place.name + ", " + args.place.vicinity;
						} else {
							this.controller.get("DestinationSearchField").value = args.place.name;
						};
					break;
				
				};
			
			};

			/* zobrazeni mapy s cestou */
  			if (this.bounds != undefined) {
  					this.map.fitBounds(this.bounds);
  					this.bounds = null;
  			};
  			if(this.isTouchPad() == true){
						google.maps.event.trigger(this.map, "resize");
				}

},

handleMapLoc: function(maploc) {

	if (this.maploc == undefined) { //this occurs when the app is relanuching with parameter
		this.maploc = maploc;
		this.maploc = this.maploc.replace(/%20/gi,' '); //replaces all the %20 to spaces
		this.maploc = this.maploc.replace(/%2C/gi,','); //replaces all the %2C to commas
		google.maps.event.trigger(this.map, "idle");
	};

	if (this.maploc != undefined) {
		this.maploc = this.maploc.replace(/%20/gi,' '); //replaces all the %20 to spaces
		this.maploc = this.maploc.replace(/%2C/gi,','); //replaces all the %2C to commas
		Mojo.Log.info("*** LAUNCH MAPLOC PLACES ***", this.maploc);
	};

},

WebOS2Events: function (action) {

	if (Mojo.Environment.DeviceInfo.platformVersionMajor == "2" && Mojo.Environment.DeviceInfo.platformVersionMinor == "2") {
		this.WebOS22 = true;
	};
	/* this function starts or stop dragging listeners needed for WebOS2.2.x devices */
	//if (Mojo.Environment.DeviceInfo.platformVersionMajor == "2" && Mojo.Environment.DeviceInfo.platformVersionMinor == "2") {
	if(true) { //force it, in 0.1.3 is manually moving on all devices and the map is default not draggable by options, this is first attemption to speed up the map moving
		//this.WebOS22 = true;
		 switch (action) {
         case 'start':
         	//Mojo.Log.info("*** START LISTENERS ***");
		   Mojo.Event.listen(this.controller.get("map_canvas"), Mojo.Event.flick, this.flickHandler);
		   Mojo.Event.listen(this.controller.get("map_canvas"), "click", this.click.bind(this));
		   Mojo.Event.listen(this.controller.get("map_canvas"), "mouseup", this.mouseup.bind(this)); //dragEnd isn't working properly, I don't know why, instead use mouseup
		   Mojo.Event.listen(this.controller.get("map_canvas"), Mojo.Event.dragStart, this.dragStart.bind(this));
		   Mojo.Event.listen(this.controller.get("map_canvas"), Mojo.Event.dragging, this.dragging.bind(this));
		   //Mojo.Event.listen(this.controller.get("map_canvas"), Mojo.Event.dragEnd, this.dragEnd.bind(this));



           break;
         case 'stop':
         	//Mojo.Log.info("*** STOP LISTENERS ***");
           Mojo.Event.stopListening(this.controller.get("map_canvas"), Mojo.Event.dragStart, this.dragStartHandler);
           Mojo.Event.stopListening(this.controller.get("map_canvas"), 'mouseup', this.mouseup.bind(this));
		   Mojo.Event.stopListening(this.controller.get("map_canvas"), Mojo.Event.dragging, this.draggingHandler);
		   Mojo.Event.stopListening(this.controller.get("map_canvas"), Mojo.Event.flick, this.flickHandler);
		   Mojo.Event.stopListening(this.controller.get("map_canvas"), "click", this.click.bind(this));
		   break;

      };
	};

},

WebOSVersion1: function () {

	/* this function starts or stop dragging listeners needed for WebOS2.2.x devices */
	if (Mojo.Environment.DeviceInfo.platformVersionMajor == "1") {
		return true;
	} else {return false};


},


isTouchPad: function(){

    if(Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("ouch")>-1) {

        return true;

		}

		if(Mojo.Environment.DeviceInfo.screenWidth==1024){ return true; }

		if(Mojo.Environment.DeviceInfo.screenHeight==1024){ return true; }



		return false;

},

isPre3: function(){

		if(Mojo.Environment.DeviceInfo.screenWidth==800){ return true; }

		if(Mojo.Environment.DeviceInfo.screenHeight==800){ return true; }



		return false;

},

gps1Failure: function(inSender, inError) {
		this.GPSFix = false;
},

MapIdle: function() {
	
		this.LoadingSpinner("stop");
		//this.ActualCenter = this.map.getCenter();
		(function(){
					this.ActualCenter = this.map.getCenter();
					this.CenterChanged = true; //for sure if bounds_changed fails, the map was unmovable
					//Mojo.Log.info("ActualCenter IDLE: ", this.ActualCenter);
				}).bind(this).delay(1);
		//Mojo.Log.info("ActualCenter IDLE: ", this.ActualCenter);


		// for Just type integration, call search after map idle
		if (this.maploc != undefined) { //this occurs when the app is relanuching with parameter
			this.Search(this.maploc);
			this.maploc = undefined;
		};
		
		if(this.wasflicked && this.isPre3()) {
			this.wasflicked = false;
			this.Pre3Refresh();	
		};
		//Mojo.Log.info("IDLE: ");
	

},

MapTilesLoaded: function () {
	
	this.NewTilesHere = true;
	//Mojo.Log.info("TILES LOADED: ");
	
},

MapCenterChanged: function () {
	
	//Mojo.Log.info("BOUNDS CHANGED: ");
	//indicates that the map was moved and allow events in dragging function
	this.CenterChanged = true;	
	
	if (this.Zooming) {
		
		(function(){

		document.getElementById('map_canvas').show();
		
		google.maps.event.trigger(this.map, "resize");
		this.Zooming = false;
		}).bind(this).delay(0.7);
	};	
},

hideCommandMenu: function() {

	this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
},

Resize: function(event) {

  if (this.isTouchPad() && (this.controller.window.innerWidth != this.actualTPwidth)) {
	  //Mojo.Log.info("** ORIENT CHANGE ***");
	   switch (this.controller.window.innerWidth) {
         case 1024:
			this.orientationChanged("left");
           break;
           case 768:
			this.orientationChanged("up");
           break;
	   };

		this.actualTPwidth = this.controller.window.innerWidth;
	} else if ((this.controller.window.innerWidth == this.actualTPwidth) && (!this.searching) && (!this.directing) && (!this.blockTPPan)) {
		Mojo.Log.info("** OTHER CHANGE ***");
		this.blockTPPan = false;
		(function(){
				this.map.panTo(this.ActualCenter);
				
			}).bind(this).delay(1);
		};
},

Traffic: function() {

		if (this.TrafficVisibile == false) {
  		this.trafficLayer.setMap(this.map);
  		this.TrafficVisibile = true;
  		this.TrafficCookie.put(false);
  	} else {
  		this.trafficLayer.setMap(null);  //remove traffic layer
  		this.TrafficVisibile = false;
  		this.TrafficCookie.put(true);
  	};

},

Bike: function() {

		if (this.BikeVisibile == false) {
  		this.bikeLayer.setMap(this.map);
  		this.BikeVisibile = true;
  		this.Preferences.Bike = true;
		this.PrefsCookie.put(this.Preferences);
  	} else {
  		this.bikeLayer.setMap(null);  //remove bike layer
  		this.BikeVisibile = false;
  		this.Preferences.Bike = false;
		this.PrefsCookie.put(this.Preferences);
  	};

},

Weather: function() {

		if (this.WeatherVisibile == false) {
  		this.weatherLayer.setMap(this.map);
  		//the weather is visible only on zoom lower than 12
  		if (this.map.getZoom() > 12) this.map.setZoom(12);
  		this.WeatherVisibile = true;
  		this.Preferences.Weather = true;
		this.PrefsCookie.put(this.Preferences);
  	} else {
  		this.weatherLayer.setMap(null);
  		this.WeatherVisibile = false;
  		this.Preferences.Weather = false;
		this.PrefsCookie.put(this.Preferences);
  	};

},

Cloud: function() {

		if (this.CloudVisibile == false) {
  		this.cloudLayer.setMap(this.map);
  		//the cloud layer is visible only on zoom lower than 6
  		if (this.map.getZoom() > 6) this.map.setZoom(6);
  		this.CloudVisibile = true;
  		this.Preferences.Cloud = true;
		this.PrefsCookie.put(this.Preferences);
  	} else {
  		this.cloudLayer.setMap(null);  //remove bike layer
  		this.CloudVisibile = false;
  		this.Preferences.Cloud = false;
		this.PrefsCookie.put(this.Preferences);
  	};

},

Night: function() {

var options;

		if (this.NightVisibile == false) {
		options = {
		styles: this.mapStyleNight[3]
		};
			this.map.setOptions(options);
  		//this.cloudLayer.setMap(this.map);
  		this.NightVisibile = true;
  		this.Preferences.Night = true;
		this.PrefsCookie.put(this.Preferences);
  	} else {
		options = {
		styles: null
		};
  		this.map.setOptions(options);
  		this.NightVisibile = false;
  		this.Preferences.Night = false;
		this.PrefsCookie.put(this.Preferences);
  	};

},

fitBounds: function(bounds) {
    this.bounds = bounds;
},

handleGestureStart: function(e){
	
	this.GestureCenter = this.map.getCenter();	
	this.Zooming = true;
	this.previouszoom = this.map.getZoom();
	this.previousScale = e.scale;
	this.previousS = 0;

},
handleGestureChange: function(e){
	e.stop();

	 	s = event.scale;
	 	
		if (s<=0.187) s = -3;
	 	if (s>0.187 && s<=0.375) s = -2;
	 	if (s>0.375 && s<=0.75) s = -1;
	 	if (s>0.75 && s<=1.5) s = 0;
	 	if (s>1.5 && s<=3) s = 1;
	 	if (s>3 && s<=6) s = 2;
	 	if (s>6) s = 3;
	 	
	 	
	 	
	 	if (this.previousS!=s) {
			var z = this.previouszoom + s;
			Mojo.Log.info("setzoom+: ", z);
			this.previousS = s;
			this.map.setZoom(z);
			
		};

},
handleGestureEnd: function(e){
	e.stop();
	//Mojo.Log.info("SCALE: ", e.scale);
},



orientationChanged: function (orientation) {

	if (this.isTouchPad()) {

		//google.maps.event.trigger(this.map, "resize");

		//Mojo.Log.info("NASTAVUJI NA: ", this.ActualCenter);
		if( orientation == "left" ) {
		  this.restmenuwidth = Mojo.Environment.DeviceInfo.screenWidth - this.widthadd;
		  //Mojo.Log.info("restmenuwidth left ",  this.restmenuwidth);
	   } else {
		  this.restmenuwidth = Mojo.Environment.DeviceInfo.screenHeight - this.heightadd;
		  //Mojo.Log.info("restmenuwidth up ",  this.restmenuwidth);
	   };

	    (function(){
				this.map.panTo(this.ActualCenter);
			}).bind(this).delay(1);



   	} else {

   		google.maps.event.trigger(this.map, "resize");

		//Mojo.Log.info("Orientation changed to: ", orientation);
	   if( orientation === "right" || orientation === "left" ) {
		  this.restmenuwidth = Mojo.Environment.DeviceInfo.screenHeight - this.heightadd;
	   } else {
		  this.restmenuwidth = Mojo.Environment.DeviceInfo.screenWidth - this.widthadd;
	   };
	   this.map.setCenter(this.ActualCenter);
   };

   this.feedMenuModel.items[1].items[1].width = this.restmenuwidth;
   this.controller.modelChanged( this.feedMenuModel );

},

getGoogleTiles: function () {
	
this.child = document.getElementById('map_canvas').getElementsByTagName('*');


this.imgcount = 0;
this.imgchild = [];
for (var i = 0, l = this.child.length; i < l; i++)
		{
			
				if ((this.child[i].nodeName == 'IMG') && (this.child[i].src.indexOf(".googleapis.com/") != -1) )
				{
				  
				  this.imgchild[this.imgcount] = this.child[i];
				  this.imgcount++;

				  
				};
		};

this.ScreenSizeBackTile = this.imgchild[0].parentNode; //static image of actual map view after loading tiles

this.TilesContainer = document.getElementById('map_canvas').firstChild.firstChild; //experimental
		
return this.TilesContainer;
},

transformGoogleTiles: function(transform) {
	/* transform.action, transform.x transform.y transform.unit*/

		for (var i = 0, l = this.imgcount; i < l; i++)
			{
				this.imgchild[i].style.webkitTransform = transform.action + '('+ transform.x + transform.unit + ',' + transform.y + transform.unit + ')';
		};
	
},

getElementsByClass: function(nameOfClass) {    
  var temp, all, elements;

  all = document.getElementsByTagName("*");
  elements = [];

  for(var a=0;a<all.length;a++) {
    temp = all[a].className.split(" ");
    for(var b=0;b<temp.length;b++) {
      if(temp[b]==nameOfClass) { 
        elements.push(all[a]); 
        break; 
      }
    }
  }
  return elements;
},

hideElementsByClass: function(nameOfClass) {
	
	var elements = this.getElementsByClass(nameOfClass);
	
	for(var a=0;a<elements.length;a++) {
		//Mojo.Log.info("HIDING: ", elements[a].parentNode.parentNode.innerHTML);
		elements[a].parentNode.parentNode.hide();
	};
},

showElementsByClass: function(nameOfClass) {
	
	var elements = this.getElementsByClass(nameOfClass);
	
	for(var a=0;a<elements.length;a++) {
		//Mojo.Log.info("SHOWING: ", elements[a].parentNode.parentNode.innerHTML);
		elements[a].parentNode.parentNode.show();
	};
},

mouseup: function(event) {
	
this.FirstDrag = false;

//this.DraggsDiffX = this.DraggsDiffX + event.pageX - this.oldx;
//this.DraggsDiffY = this.DraggsDiffY + event.pageY - this.oldy;

if (this.isdragging && this.isPre3()) {
	//this.Pre3Refresh(); // HOKUS POKUS
	this.dragEnd();
};
},





dragStart: function(event) {
	
	this.isdragging = true;

	this.OLDX = event.down.x;
	this.OLDY = event.down.y;
	
	this.oldx = event.down.x;
	this.oldy = event.down.y;
},

dragging: function(event) {

		if (this.CenterChanged) {
			this.CenterChanged = false;
			this.map.panBy(this.ScreenRoughRatio*(this.oldx - event.move.x), this.ScreenRoughRatio*(this.oldy - event.move.y));
			//this.map.panBy((this.oldx - event.move.x), (this.oldy - event.move.y));
			this.oldx = event.move.x;
			this.oldy = event.move.y;
		};

		
},

dragEnd: function () {
	//Mojo.Log.info("*** DRAG END **** ");
	if (this.isPre3()) {	
		this.Pre3Refresh(); // Pre3 centering offset workaround
	};
	this.isdragging = false;
},


flick: function(event) {
	this.CenterChanged = false;
	this.wasflicked = true;
	//this.map.panBy(this.ScreenRoughRatio*(-event.velocity.x/10), this.ScreenRoughRatio*(-event.velocity.y/10));
	this.map.panBy((-event.velocity.x/10),(-event.velocity.y/10));
},

click: function(event) {
//Mojo.Log.info("*** CLICK **** ");
},

Pre3Refresh: function () {
	/* Horrible and the biggest workaround on the world... don't ask me why I did this for Pre3...
	 * If the map is moved more than pixel device width, the center will be corrected
	 * It is not documented, it is only knowledge based on experiments
	 */
	
	//Mojo.Log.info("** PRE3 REFRESH ***");

	//Map moved in dragging function is moved 1.5times more, move to 1/2 of whole move back moves the map to the correct position
	if (this.isdragging) {
		this.map.panBy((-this.OLDX + this.oldx)/2+500, (-this.OLDY + this.oldy)/2+1000);
		this.map.panBy(-500,-1000);
	} else {
		//pan the map out and back - do the recentering the map projection, this is a TRICK!
		this.map.panBy(500,1000);
		this.map.panBy(-500,-1000);
		};
	
},



handleMapTo: function(event) { // tato funkce odchytne, pokud byla aplikace spustena s parametrem mapto

				// Override mapto -> maploc if set in Preferences
				if (this.Preferences.MaptoOverride) {
					this.LaunchArg.Action = "maploc";
					this.handleMapLoc(event);
					event = undefined;
					this.mapto = undefined;
					Mojo.Log.info("*** LAUNCH MAPTO DIRECTIONS RELAUNCH AND OVERRIDING TO MAPLOC ***", this.maploc);

				};
				
              // if the event exists, the app was relaunched with parameter mapto
              if (event) {
				  this.LaunchArg.Action = "mapto";
				  this.mapto = event;
				  };
				// musim pockat na zamereni na GPSFix = true;
				if (this.GPSFix == false && this.LaunchArg.Action == 'mapto') {
					 this.GPSdialog = this.controller.showAlertDialog({
	            onChoose: function(value) {
	               this.LaunchArg.Action = null; //reset promenne ze spusteni
	               this.LaunchArg.mapto = null; //reset promenne ze spusteni
	            },
	            title: $L("Waiting for your location..."),
	            message: $L("Please wait for GPS fix or press Cancel."),
	            choices: [{
	               label: $L("Cancel"),
	               value: ""
	            }]
	         });
         };
         if (this.GPSFix == true && this.LaunchArg.Action == 'mapto') {
           this.LaunchArg.Action = null; //reset promenne ze spusteni
		// workaround at this time, needs some delay to autocompleter is initialized
           	(function(){
				this.Directions({destination: this.mapto});
			}).bind(this).delay(2);
         };


},

mousedownHandler: function() {

	this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
	this.hideCommandMenu.bind(this).delay(3);
	//shows the menu everytime when mouse down
},

Search: function(address) {


this.WebOS2Events('stop');

//stop listen to keypress
this.controller.stopListening(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);

this.searching = true;
this.IsSet = false;

this.controller.toggleMenuVisible(Mojo.Menu.viewMenu);

$('searchScrim').show();



if(address != undefined) {

				this.controller.get('MainSearchField').value = "";
				this.controller.get('MainSearchField').blur();
				this.controller.get('MainSearchField').value = address;
				this.controller.get('MainSearchField').blur();
				this.controller.get('MainSearchField').focus();
				address = undefined;

} else {

	this.controller.get('MainSearchField').focus();
	this.controller.get('MainSearchField').select();

	};

},

SelectedPlace: function (event) {

this.WebOS2Events('start');

this.controller.toggleMenuVisible(Mojo.Menu.viewMenu);

$('searchScrim').hide();

this.searching = false;

	this.IsSet = true;

	// loose focus
	this.controller.get('MainSearchField').blur();

	 var place = this.Mainautocomplete.getPlace();
			//Mojo.Log.info("** PLACE %j***", this.Mainautocomplete.getPlace());

          try {
            this.map.fitBounds(place.geometry.viewport);
          } catch (error) {
            //this.map.setCenter(place.geometry.location);
            this.map.setZoom(17);
          };

          var address = '';
          if (place.address_components) {
            address = [(place.address_components[0] &&
                        place.address_components[0].short_name || ''),
                       (place.address_components[1] &&
                        place.address_components[1].short_name || ''),
                       (place.address_components[2] &&
                        place.address_components[2].short_name || '')
                      ].join(' ');
          }
          //Mojo.Log.info("** PLACE %j***", place);

		 try {
			 if (this.isTouchPad()) {
				// specify actual center (for TP is this needed)
				this.ActualCenter = place.geometry.location;
				};

			  //place marker
			  this.PlaceMarker({position: place.geometry.location, title: place.name, subtitle: address, place: place});

			  //update the view menu text
			  this.feedMenuModel.items[1].items[1].label = place.name;
			  this.controller.modelChanged(this.feedMenuModel);
		  } catch (error) {};
          
          //start the listener for keypress
          this.controller.listen(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);


},

SearchPaste: function(event) {
	
	/* This function fires the autocomplete box 1s after paste a text in search field */
	
	(function(){
				var input = this.controller.get('MainSearchField').value;
				//Mojo.Log.info("** PASTE *** %j", input);
				this.controller.get('MainSearchField').value = "";
				this.controller.get('MainSearchField').blur();
				this.controller.get('MainSearchField').value = input;
				this.controller.get('MainSearchField').blur();
				this.controller.get('MainSearchField').focus();
			}).bind(this).delay(1);
	
},

SearchKeypress: function (event) {
	
	this.ns = [];
	var dropdown = document.getElementsByClassName('pac-container')[0];
	this.ns.checktimes = 0;
	var inp = document.getElementById('MainSearchField');
	//Mojo.Log.info("** KEY ***", event.keyCode);
	if (event.keyCode == Mojo.Char.enter) {
		//Mojo.Log.info("** ENTER ***");
		event.stop();
		var coordlatlng = this.isThereCoordinates(inp.value);
		if (coordlatlng != undefined) {
			this.setTopBarText(inp.value);
			this.DropPin(coordlatlng);
			} else {
			this.EnterSubmittedPlace(inp.value);
		};
		
		  //start the listener for keypress
          this.controller.listen(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);
          
	};
	
	 if (this.ns.checkTimer) {
                    clearTimeout(this.ns.checkTimer);
				};
              
	this.CheckSearchInput(dropdown, inp);
	
	
},

isThereCoordinates: function(input) {
		/* This function recognize type of coordinates format and return latlng
		 * Don't ask me how I can regonzie it... it was horrible to make this function :)
		 * It could be recognized by more elegant way... ToDo*/
	 
	 		/* On the world is used 7 format of coordinates, for example:
		* All of the following are valid and acceptable ways to write geographic coordinates:
		*	40:26:46N,79:56:55W 			- type 1
		*	40:26:46.302N 79:56:55.903W		- type 2
		*	40°26′47″N 79°58′36″W			- type 3
		*	40d26′47″N 79d58′36″W			- type 4
		*	40.446195N 79.948862W			- type 5
		*	40.446195, -79.948862			- type 6 (this is the decimal format of Google API)
		*	40°26.7717, -79°56.93172		- type 7
		* I named it as type 1 to type 7 just for use here
		* Source: Wikipedia.com
		*/
	 
	var direction, lat, lng;
	var latlng = undefined;
	this.inputstring = input;
	var parts = input.split(/[^\d\w-.:°'"d]+/);
	var partscomp = input.split(/[^\d\w-.]+/);
	
	
	//Mojo.Log.info("** PARTS *** %j", parts);

	try {
		//Recoginze Type 1	
		if (parts[0].indexOf(":")>-1 && parts[1].indexOf(":")>-1 && parts[0].indexOf(".") == -1 && parts[1].indexOf(".") == -1 && parts[0].split(/[NWES]/).length > 1 && parts[1].split(/[NWES]/).length > 1 && parts.length == 2) {
			//Mojo.Log.info("** TYPE 1 ***");
			lat = this.ConvertDMSToDD(partscomp[0], partscomp[1], partscomp[2].substring(0, partscomp[2].length-1), partscomp[2].substring(partscomp[2].length-1, partscomp[2].length));
			lng = this.ConvertDMSToDD(partscomp[3], partscomp[4], partscomp[5].substring(0, partscomp[5].length-1), partscomp[5].substring(partscomp[5].length-1, partscomp[5].length));		
			latlng = new google.maps.LatLng(lat, lng);
		};
		
		//Recoginze Type 2	
		if (parts[0].indexOf(":")>-1 && parts[1].indexOf(":")>-1 && parts[0].indexOf(".") > -1 && parts[1].indexOf(".") > -1 && parts[0].split(/[NWES]/).length > 1 && parts[1].split(/[NWES]/).length > 1 && parts.length == 2) {
			//Mojo.Log.info("** TYPE 2 ***");
			lat = this.ConvertDMSToDD(partscomp[0], partscomp[1], partscomp[2].substring(0, partscomp[2].length-1), partscomp[2].substring(partscomp[2].length-1, partscomp[2].length));
			lng = this.ConvertDMSToDD(partscomp[3], partscomp[4], partscomp[5].substring(0, partscomp[5].length-1), partscomp[5].substring(partscomp[5].length-1, partscomp[5].length));		
			latlng = new google.maps.LatLng(lat, lng);
		};
		
		//Recoginze Type 3	
		if (parts[0].indexOf("°")>-1 && parts[1].indexOf("°")>-1 && parts[0].indexOf("'") > -1 && parts[1].indexOf("'") > -1 && parts[0].indexOf('"') > -1 && parts[1].indexOf('"') > -1 && parts[0].split(/[NWES]/).length > 1 && parts[1].split(/[NWES]/).length > 1 && parts.length == 2) {
			//Mojo.Log.info("** TYPE 3 ***");
			lat = this.ConvertDMSToDD(partscomp[0], partscomp[1], partscomp[2], partscomp[3]);
			lng = this.ConvertDMSToDD(partscomp[4], partscomp[5], partscomp[6], partscomp[7]);		
			latlng = new google.maps.LatLng(lat, lng);
		};
		
		//Recoginze Type 4	
		if (parts[0].indexOf("d") > -1 && parts[1].indexOf("d") > -1 && parts[0].indexOf("°") == -1 && parts[1].indexOf("°") == -1 && parts[0].indexOf("'") > -1 && parts[1].indexOf("'") > -1 && parts[0].indexOf('"') > -1 && parts[1].indexOf('"') > -1 && parts[0].split(/[NWES]/).length > 1 && parts[1].split(/[NWES]/).length > 1 && parts.length == 2) {
			//Mojo.Log.info("** TYPE 4 ***");
			lat = this.ConvertDMSToDD(partscomp[0].substring(0, partscomp[0].indexOf("d")), partscomp[0].substring(partscomp[0].indexOf("d")+1, partscomp[0].substring(partscomp[0].length-1) ), partscomp[1], partscomp[2]);
			lng = this.ConvertDMSToDD(partscomp[3].substring(0, partscomp[3].indexOf("d")), partscomp[3].substring(partscomp[3].indexOf("d")+1, partscomp[3].substring(partscomp[3].length-1) ), partscomp[4], partscomp[5]);
			latlng = new google.maps.LatLng(lat, lng);
		};
				
		//Recoginze Type 5
		if (parts[0].indexOf(":") == -1 && parts[1].indexOf(":") == -1 && parts[0].indexOf(".")>-1 && parts[1].indexOf(".")>-1 && parts[0].split(/[NWES]/).length > 1 && parts[1].split(/[NWES]/).length > 1 && parts.length == 2) {
			//Mojo.Log.info("** TYPE 5 ***");
			if (parts[0].indexOf("N") > -1) {lat = parts[0].substring(0, parts[0].length-1);} else {lat = -parts[0].substring(0, parts[0].length-1);};
			if (parts[1].indexOf("E") > -1) {lng = parts[1].substring(0, parts[1].length-1);} else {lng = -parts[1].substring(0, parts[1].length-1);};
			latlng = new google.maps.LatLng(lat, lng);		
		};
		
		//Recoginze Type 6	
		if (parts[0].indexOf("°") == -1 && parts[1].indexOf("°") == -1 && parts[0].indexOf(":") == -1 && parts[1].indexOf(":") == -1 && parts[0].indexOf(".")>-1 && parts[1].indexOf(".")>-1 && parts[0].split(/[NWES]/).length == 1 && parts[1].split(/[NWES]/).length == 1 && parts.length == 2) {
			//Mojo.Log.info("** TYPE 6 ***");
			latlng = new google.maps.LatLng(parts[0], parts[1]);
		};
		
		//Recoginze Type 7	
		if (parts[0].indexOf("°")>-1 && parts[1].indexOf("°")>-1 && parts[0].indexOf("'") == -1 && parts[1].indexOf("'") == -1 && parts[0].indexOf('"') == -1 && parts[1].indexOf('"') == -1 && parts[0].split(/[NWES]/).length == 1 && parts[1].split(/[NWES]/).length == 1 && parts.length == 2) {
			//Mojo.Log.info("** TYPE 7 ***");
			if (partscomp[0].indexOf("-")>-1) {lat = this.ConvertDMSToDD(partscomp[0], -partscomp[1], 0, "");} else {lat = this.ConvertDMSToDD(partscomp[0], partscomp[1], 0, "");};
			if (partscomp[2].indexOf("-")>-1) {lng = this.ConvertDMSToDD(partscomp[2], -partscomp[3], 0, "");} else {lng = this.ConvertDMSToDD(partscomp[2], partscomp[3], 0, "");};		
			latlng = new google.maps.LatLng(lat, lng);
		};
	} catch (error) {
		latlng = undefined;
	};
	return latlng;
},

ConvertDMSToDD: function(days, minutes, seconds, direction) {
	
	//Mojo.Log.info("** DAYS ***", days);
	//Mojo.Log.info("** MINUTES ***", minutes);
	//Mojo.Log.info("** SECONDS ***", seconds);
	//Mojo.Log.info("** DIRECTION ***", direction);
	
	days = parseFloat(days);
    minutes = parseFloat(minutes);
    seconds = parseFloat(seconds);
    
    var dd = days + minutes/60 + seconds/(60*60);


    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
},

DropPin: function (latlng) {
		
	this.GeocodeFromLatLng(latlng);
},

PlaceDroppedPin: function (place) {
	
	var subtitle = $L("Approximately: ") + place.formatted_address;
	place.name = $L("Loc: ") + this.inputstring;
	place.icon = "images/menu-icon-mylocation.png";
	place.formatted_address = subtitle;
	place.vicinity = subtitle;
	//place marker
    this.PlaceMarker({position: place.geometry.location, title: this.inputstring, subtitle: subtitle, place: place, action: this.holdaction});
    this.inputstring = undefined;
    this.holdaction = undefined;
},

EnterSubmittedPlace: function (input) {
	
this.WebOS2Events('start');

this.controller.toggleMenuVisible(Mojo.Menu.viewMenu);



this.searching = false;

this.IsSet = true;

// loose focus
this.controller.get('MainSearchField').blur();



//default radius in meters from actual map bounds

	var NorthEast = this.map.getBounds().getNorthEast();
	var SouthWest = this.map.getBounds().getSouthWest();
	var radius = Math.round(google.maps.geometry.spherical.computeDistanceBetween(NorthEast, SouthWest)/2);
	//Mojo.Log.info("** RADIUS ***", radius);
	
	if (radius > 5000) {radius = 5000};
	

//if user write the @, do split to input and radius
if (input.indexOf("@")>-1) {
	var request = input.split("@");

	radius = request[1];
	input = request[0];
};

this.SearchNearbyPlaces(input, radius);

          //update the view menu text
          this.feedMenuModel.items[1].items[1].label = input + $L(" within ") + radius + $L("m");
          this.controller.modelChanged(this.feedMenuModel);
          
          //start the listener for keypress
          this.controller.listen(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);
          
          $('searchScrim').hide();


},

CheckSearchInput: function (dropdown, inp) {
	
             	if (document.getElementById('MainSearchField').value == "") {
					dropdown.style.display = 'none';
				};
           
                if (inp && this.ns.checktimes < 20) { // check at most 10 seconds
                	//Mojo.Log.info("** DALSI ***");
                	
                	
                if (dropdown.style.display == '') {
                    //msg.innerHTML = 'has results? true';
                    Mojo.Log.info("** TRUE ***");
                    this.ns.checkTimer = null;
                	};
                if (inp && dropdown.style.display == 'none' && this.ns.checktimes > 1) {
                    //msg.innerHTML = 'has results? false';
                    //Mojo.Log.info("** FALSE ***");
                    dropdown.style.display = 'block';
                    dropdown.style.top = "50px";
                    //var child = dropdown.appendChild(child);

                    
                    dropdown.innerHTML = "<div class='pac-item'>" + $L("No results") + "...</div>";
                    this.ns.checkTimer = null;
                };
                	
                	
                	
                    this.ns.checktimes++;
                    this.ns.checkTimer = setTimeout(function () {
                        this.CheckSearchInput(dropdown, inp);
                    }.bind(this), 500);
                };
			
},


SelectedOriginPlace: function (event) {

	this.IsSet = true;

	 var place = this.Originautocomplete.getPlace();

	 this.origin = place.geometry.location;

	//set focus to destination field if is empty
	var IsEmptyDestination = this.controller.get("DestinationSearchField").value;
	if (IsEmptyDestination == "") {
		this.controller.get("DestinationSearchField").focus();
	};

},

SelectedDestinationPlace: function (event) {

	this.IsSet = true;

	 var place = this.Destinationautocomplete.getPlace();

	 this.destination = place.geometry.location;

	//set focus to origin field if is empty
	var IsEmptyOrigin = this.controller.get("OriginSearchField").value;
	if (IsEmptyOrigin == "") {
		this.controller.get("OriginSearchField").focus();
	};

},

PlaceMarker: function (args) {

		/* args.position, args.title, args.subtitle, args.place-(everything from autocompleter) */
		
		if (!args.icon) {args.icon = "Map-Marker-Push-Pin-2-Right-Red-icon.png"}; //default marker icon
		var image = new google.maps.MarkerImage('images/' + args.icon,
		new google.maps.Size(64, 64),
		new google.maps.Point(0, 0), // origin
		new google.maps.Point(31, 62), // anchor
		new google.maps.Size(64, 64) //scaled size
		);

		var marker = new google.maps.Marker(
		{
		  position: args.position,
		  map: this.map,
		  icon: image,
		  animation: google.maps.Animation.DROP,
		  //draggable: true,
		  optimized: this.optimizedmarkers,
		  title:"Marker"
		}
		);

  	// push all information from autocompleter to marker.place
  	var place = args.place;
	
	//pan and zoom not for dropped pins
	if (args.action != "droppin") {
		this.map.setZoom(14);
		this.map.setCenter(args.position);
	};

 	//--> Define the infoBubble
	var infoBubble = new InfoBubble({
		map: this.map,
		content: '<div id="bubble" class="phoneytext">' + args.title + '<div class="phoneytext2">' + args.subtitle + '</div></div>',
		shadowStyle: 1,
		padding: 0,
		backgroundColor: 'rgb(57,57,57)',
		borderRadius: 4,
		arrowSize: 10,
		borderWidth: 1,
		borderColor: '#2c2c2c',
		disableAutoPan: true,
		hideCloseButton: true,
		arrowPosition: 30,
		backgroundClassName: 'phoney',
		backgroundClassNameClicked: 'phoney-clicked',
		arrowStyle: 2,
		onClick: function(){
			//--> Start the marker bouncing so they know it was clicked
			marker.setAnimation(google.maps.Animation.BOUNCE);
			this.markerBubbleTap({marker: marker, infoBubble: infoBubble, title: args.title, subtitle: args.subtitle, place: place});
			/*
			//--> Fire off the next display
			(function(){
				var e = {};
				e.item = params;
				this.listTapHandler(e);
			}).bind(this).delay(0.75);
			*/

			//--> Stop bouncing the marker after 2 second
			(function(){
				marker.setAnimation(null);
			}).bind(this).delay(2);
		}.bind(this)
	});

	google.maps.event.addListener(marker,"click",this.toggleInfoBubble.bind(this, infoBubble, marker));

	// show the bubble after 1 second
	this.MayBubblePop = true;

	(function(){
				this.toggleInfoBubble(infoBubble, marker);
			}).bind(this).delay(1);

	//Add it to the array	
	marker.place = place; //add place array to the marker, because of pushing to other scenes
	
	//Add it to the array
	this.infoBubbles.push(infoBubble);
	this.markers.push(marker);


},

toggleInfoBubble: function(infoBubble, marker){


		(function(){
				this.MayBubblePop = true;
				//Mojo.Log.info("Delay****");
			}).bind(this).delay(0.5);


		Mojo.Log.info("You clicked the marker.");
		//--> Now open the bubble
		if (!infoBubble.isOpen() && this.MayBubblePop){
			//--> Clear all info bubbles...
			infoBubble.open(this.map, marker);
			this.MayBubblePop = false;
		}else if (this.MayBubblePop){
			infoBubble.close();
			this.MayBubblePop = false;
			//--> Clear all info bubbles...
		};

},

toggleDirectInfoBubble: function(infoBubble, marker){

		(function(){
				this.MayBubblePop = true;
			}).bind(this).delay(0.5);

		// hide other bubbles if is cliked different bubble
		if (!infoBubble.isOpen()) {
			this.hideDirectInfoBubbles();
		};

		//--> Now open the bubble
		if (!infoBubble.isOpen() && this.MayBubblePop){
			infoBubble.open(this.map, marker);
			this.MayBubblePop = false;
		}else if (this.MayBubblePop){
			infoBubble.close();
			this.MayBubblePop = false;
		};

},


hideInfoBubbles: function(){

	for (b=0; b<this.infoBubbles.length; b++){
		this.infoBubbles[b].close();
	}
},

hideDirectInfoBubbles: function(){

	for (b=0; b<this.DirectinfoBubbles.length; b++){
		this.DirectinfoBubbles[b].close();
	}
},

hideAllVisibileBubbles: function() {
	
	var VisibileBubbles = [];
	
	//close all visibile infobubbles
	for (b=0; b<this.infoBubbles.length; b++){
		if (this.infoBubbles[b].isOpen()){
				this.infoBubbles[b].close();
				VisibileBubbles.push(this.infoBubbles[b]);	
		};	
	};
	
	//close all visibile directinfobubbles
	for (b=0; b<this.DirectinfoBubbles.length; b++){
		if (this.DirectinfoBubbles[b].isOpen()){
				this.DirectinfoBubbles[b].close();
				VisibileBubbles.push(this.DirectinfoBubbles[b]);	
		};	
	};
		
		this.MayBubblePop = false;
		
		return VisibileBubbles;
	
},

showAllVisibileBubbles: function(bubbles) {
	
	var VisibileBubbles = bubbles;
	
	//open all previous visibile infobubbles
	for (b=0; b<VisibileBubbles.length; b++){
				VisibileBubbles[b].open();
	};
		
		//this.MayBubblePop = false;
	
},

mapClear: function() {
	Mojo.Log.info("CLEARMAP ");
	//--> Deletes ALL Markers
	for (e=0; e<this.markers.length; e++){
		this.markers[e].setMap(null);
	}

	//--> Deletes ALL infoBubbles
	for (e=0; e<this.infoBubbles.length; e++){
		this.infoBubbles[e].setMap(null);
	}
	this.infoBubbles.length = 0;
	this.markers.length = 0;

	// clear all route points and markers
	this.clearDirectPoints();
	
	// clear nearby POI's markers
	this.clearNearbyMarkers();

	this.directionsDisplay.setMap(null);

	 // switch to GetDirections panel if we haven't
     if ( this.DirectionsButtonModel.label != $L("Get Directions >")) {
		this.DirectionsButtonModel.label = $L("Get Directions >");
		this.controller.modelChanged(this.DirectionsButtonModel);
		$('DirectionsInput').show();
		$('DirectionsPanel').hide();
	 };

	 // change the cmd menu to normal
	 this.ChangeCmdMenu("normal");

	 this.DirectStep = 0;

	 this.origin = this.MyLocation;
	 this.destination = null;

	 this.controller.get("OriginSearchField").value = $L("My Location");
	 this.controller.get("DestinationSearchField").value = "";

	 //reset the view menu text
     this.feedMenuModel.items[1].items[1].label = $L("Google Maps");
     this.controller.modelChanged(this.feedMenuModel);
},

clearDirectPoints: function () {

	//--> Deletes ALL Markers
	for (e=0; e<this.Directmarkers.length; e++){
		this.Directmarkers[e].setMap(null);
	}

	//--> Deletes ALL DirectinfoBubbles
	for (e=0; e<this.DirectinfoBubbles.length; e++){
		this.DirectinfoBubbles[e].setMap(null);
	}
	this.DirectinfoBubbles.length = 0;
	this.Directmarkers.length = 0;
},

clearNearbyMarkers: function () {

	//--> Deletes ALL Markers
	for (e=0; e<this.Nearbymarkers.length; e++){
		this.Nearbymarkers[e].setMap(null);
	}

	//--> Deletes ALL DirectinfoBubbles
	for (e=0; e<this.NearbyinfoBubbles.length; e++){
		this.NearbyinfoBubbles[e].setMap(null);
	}
	this.NearbyinfoBubbles.length = 0;
	this.Nearbymarkers.length = 0;
},

LoadingSpinner: function (action) {

	switch (action) {
         case 'start':
            $('busy-overlay-scrim').show();
			this.controller.get('LoadingSpinner').mojo.start();
            break;
         case 'stop':
         	this.controller.get('LoadingSpinner').mojo.stop();
            $('busy-overlay-scrim').hide();
            break;
      };

},

getRegion: function() {

		var langString = "en_us"; //inject as default
		var langString = Mojo.Locale.getCurrentFormatRegion();
		this.lang = langString.substring(0,2);  //returns only the two first characters
		// This is workaround, because WebOS reports some regions in non ISO 639 format..
		switch (this.lang) {
         case 'cz':
            this.lang = "cs";
            break;
        };
		//var searchFilter = event.value;
		return this.lang;

},

handleBackSwipe: function (event) {

	//Mojo.Log.info("** BACK ***");
	if(this.searching) {

			// toggle back the scrim
			$('searchScrim').toggle();

			this.controller.toggleMenuVisible(Mojo.Menu.viewMenu);

			// loose focus
			//this.controller.get('MainSearchField').mojo.blur();
			this.searching = false;
			
			if (this.KeyWasPressed) {
			  //start the listener for keypress if is backswiping from Search
			  this.controller.listen(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);
			  this.KeyWasPressed = false;
	 		};

			//prevent from going to background
			event.stop();

		};
	if(this.directing) {

			$('directionsScrim').toggle();

			this.controller.toggleMenuVisible(Mojo.Menu.viewMenu);

			this.directing = false;
			
			if (this.KeyWasPressed) {
			  //start the listener for keypress if is backswiping from Directions
			  this.controller.listen(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);
			  this.KeyWasPressed = false;
	 		};
	 		
			//prevent from going to background
			event.stop();
		};

		this.WebOS2Events('start');

},

Keypress: function (event) {
	
	// do action only if the pressed key isn`t Escape(swipeback)
	if (event.keyCode != 27) {
		//Mojo.Log.info("** BACK ***", event.keyCode);
		this.controller.stopListening(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);
		this.KeyWasPressed = true;
		this.Search();
		this.controller.get('MainSearchField').blur();
		this.controller.get('MainSearchField').focus();
		
	} else {
		
		};
},

Directions: function (position) {

	this.WebOS2Events('stop');
	
	this.KeyWasPressed = true;
	//stop listen to keypress
	this.controller.stopListening(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);
	
	this.directing = true;
	this.IsSet = false;
	this.controller.toggleMenuVisible(Mojo.Menu.viewMenu);
	$('directionsScrim').toggle();

	if (this.GPSFix && !this.firstinsertposition) {
		this.firstinsertposition = true;
		this.origin = this.MyLocation;
		// fill the origin field with MyLocation
		this.controller.get("OriginSearchField").value = $L("My Location");
	} else if (this.controller.get('OriginSearchField').value == "") {
		this.controller.get('OriginSearchField').focus();
	};

	if (this.GPSFix && position) {
				this.controller.get('DestinationSearchField').value = "";
				this.controller.get('DestinationSearchField').blur();
				this.controller.get('DestinationSearchField').value = position.destination;
				this.controller.get('DestinationSearchField').blur();
				this.controller.get('DestinationSearchField').focus();
				address = undefined;
				this.mapto = undefined;
	};

},

DirectType: function (event) {
	this.TravelMode = event.value;
},

GetDirectionsButtonTap: function (event) {

	switch (this.DirectionsButtonModel.label) {
		case $L("Get Directions >"):
			//update MyLocation on every route request
			if (this.controller.get('OriginSearchField').value == $L("My Location")) {this.origin = this.MyLocation;};
			if (this.controller.get('DestinationSearchField').value == $L("My Location")) {this.destination = this.MyLocation;};
			this.LoadingSpinner("start");
			this.CalcRoute();
        break;
        case $L("Update Directions"):
			this.DirectionsButtonModel.label = $L("Get Directions >");
			this.controller.modelChanged(this.DirectionsButtonModel);
			$('DirectionsInput').show();
			$('DirectionsPanel').hide();
        break;
	};


},

IsRouted: function (state) {

	if (state) {
			// change the button label
			this.DirectionsButtonModel.label = $L("Update Directions");
			this.controller.modelChanged(this.DirectionsButtonModel);
			$('DirectionsInput').hide();
			$('DirectionsPanel').show();

		};

},

SwapDirections: function () {
	
	// Read actual direction request
	var origin = this.origin;
	var destination = this.destination;
	var originvalue = this.controller.get('OriginSearchField').value;
	var destinationvalue = this.controller.get('DestinationSearchField').value;
	
	// And swap them
	this.origin = destination;
	this.destination = origin;
	this.controller.get('OriginSearchField').value = destinationvalue;
	this.controller.get('DestinationSearchField').value = originvalue;
},

CalcRoute: function() {

  if (!(this.origin == undefined || this.destination == undefined)) {

				if (this.TravelMode == undefined) {
					this.TravelMode = "driving";
				};

  	 switch (this.TravelMode) {
         case 'driving':
           this.travel = google.maps.DirectionsTravelMode.DRIVING;
           break;
         case 'walking':
          this.travel = google.maps.DirectionsTravelMode.WALKING;
          break;
         case 'bicycling':
           this.travel = google.maps.DirectionsTravelMode.BICYCLING;
           break;
      };

  		var request = {
          origin: this.origin,
          destination: this.destination,
          //provideRouteAlternatives: true,
          //avoidHighways: true,
		  //avoidTolls: true,
          travelMode: this.travel,
        };
        this.directionsService.route(request, function(response, status) {

          if (status == google.maps.DirectionsStatus.OK) {
			  this.IsRouted(true);
			  //Mojo.Log.info("** RESPONSE1 ***");
			  this.clearDirectPoints();
			  this.DirectionMarkers({start: this.origin, end: this.destination, start_title: response.routes[0].legs[0].start_address, end_title: response.routes[0].legs[0].end_address});
			  if (this.WebOSVersion1()) {
					response = this.makeFriendly145withmarkers(response); //change the response to WebOS 1.4.5 readable
				} else {
					this.makeDirectMarkers(response);
					};
			  //Mojo.Log.info("** RESPONSE2 ***");

			  this.ChangeCmdMenu("directions");
			  // hides the scrim
			 this.MapIdle();
             this.directionsDisplay.setDirections(response);
             this.directionsDisplay.setMap(this.map);

          } else { Mojo.Controller.errorDialog($L("No route"));
					this.IsRouted(false);
					// hides the scrim
					this.MapIdle();
					}
        }.bind(this));
        } else {
			this.LoadingSpinner("stop");
			Mojo.Controller.errorDialog($L("Request is not complete, be sure that the Origin and Destination is set properly and try it again."));			
			};

},

makeFriendly145withmarkers: function (directionResult) {

/* make direction result friendly for WebOS 1.4.5 - positions have to be refreshed */
  var myRoute = directionResult.routes[0].legs[0];

  var NewResult = directionResult;

  for (var i = 0; i < myRoute.steps.length; i++) {

	  //start and end location
	  newlatlng = new google.maps.LatLng(myRoute.start_location.lat, myRoute.start_location.lng);
	  NewResult.routes[0].legs[0].start_location = newlatlng;

	  newlatlng = new google.maps.LatLng(myRoute.end_location.lat, myRoute.end_location.lng);
	  NewResult.routes[0].legs[0].end_location = newlatlng;

  };

  this.myRoute = NewResult.routes[0].legs[0];

  return NewResult;
},

makeDirectMarkers: function (directionResult) {

	this.myRoute = directionResult.routes[0].legs[0];

},

DirectionMarkers: function (args) {
	/* args.start, args.end, args.start_title, args.end_title */

	this.PlaceDirectionMarker({position: args.start, style: "start", title: args.start_title, subtitle: ""});
	this.PlaceDirectionMarker({position: args.end, style: "end", title: args.end_title, subtitle: ""});

	this.DirectStep = 0;

},

PlaceDirectionMarker: function (args) {

		/* args: position, style ("start", "end", "point"), title, subtitle */

		switch (args.style) {
         case 'start':
           var markerimage = 'images/bubble/flagA.png';
           var size = 48;
           var anchor = [23,46];
           break;
         case 'end':
          var markerimage = 'images/bubble/flagB.png';
          var size = 48;
          var anchor = [23,46];
          break;
         case 'point':
           var markerimage = 'images/bubble/point.png';
           var size = 14;
           var anchor = [7,7];
           break;
      };


		var image = new google.maps.MarkerImage(markerimage,
		new google.maps.Size(size, size),
		new google.maps.Point(0, 0), // origin
		new google.maps.Point(anchor[0], anchor[1]), // anchor
		new google.maps.Size(size, size) //scaled size
		);

		var marker = new google.maps.Marker(
		{
      position: args.position,
      map: this.map,
      icon: image,
      optimized: this.optimizedmarkers,
      title:"Marker"
  	}
  	);

 	//Define the infoBubble
	var infoBubble = new InfoBubble({
		map: this.map,
		content: '<div id="bubble" class="phoneytextwithoutbutton">' + args.title + '<div class="phoneytext2">' + args.subtitle + '</div></div>',
		shadowStyle: 1,
		padding: 0,
		backgroundColor: 'rgb(57,57,57)',
		borderRadius: 4,
		arrowSize: 10,
		borderWidth: 1,
		borderColor: '#2c2c2c',
		disableAutoPan: false,
		hideCloseButton: true,
		arrowPosition: 50,
		backgroundClassName: 'phoney',
		backgroundClassNameClicked: 'phoney-clicked',
		arrowStyle: 2,
		onClick: function(){
			//nothing to do for this time
		}.bind(this)
	});

	google.maps.event.addListener(marker,"click",this.toggleDirectInfoBubble.bind(this, infoBubble, marker));

	//Add it to the array

	this.DirectinfoBubbles.push(infoBubble);
	this.Directmarkers.push(marker);


},

markerBubbleTap: function(marker) {

	// contains: marker, infoBubble, title, subtitle
	this.clickedMarker = marker;

	// pops the popupmenu
	var near = event.originalEvent && event.originalEvent.target;
    this.controller.popupSubmenu({
		onChoose:  this.handlemarkerBubbleTap,
		placeNear: near,
		items: [
			{iconPath:'images/bubble/info.png',label: $L('Info'), command: 'do-marker-info'},
			{iconPath:'images/street.png', label: $L('Street View'), command: 'do-street'},
			{iconPath:'images/bubble/flagA.png', label: $L('Route from here'), command: 'do-origin'},
			{iconPath:'images/bubble/flagB.png', label: $L('Route to here'), command: 'do-destination'},
			{iconPath:'images/bubble/delete.png', label: $L('Remove'), command: 'do-marker-remove'},
		]
	});


},

handlemarkerBubbleTap: function (command) {

	      switch (command) {
         case 'do-street':
            this.StreetView();
            break;
         case 'do-marker-info':
			this.markerInfo(this.clickedMarker);
            break;
         case 'do-origin':
         	// switch to GetDirections panel if we haven't
         	if ( this.DirectionsButtonModel.label != $L("Get Directions >")) {
				this.DirectionsButtonModel.label = $L("Get Directions >");
				this.controller.modelChanged(this.DirectionsButtonModel);
				$('DirectionsInput').show();
				$('DirectionsPanel').hide();
			};
            this.origin = this.clickedMarker.marker.getPosition();
            this.firstinsertposition = true;
            this.controller.get("OriginSearchField").value = this.clickedMarker.title;
            this.controller.get("OriginSearchField").blur();
            //launch a Directions (upon user feedback)
            this.Directions();
        	break;
         case 'do-destination':
         	// switch to GetDirections panel if we haven't
         	if ( this.DirectionsButtonModel.label != $L("Get Directions >")) {
				this.DirectionsButtonModel.label = $L("Get Directions >");
				this.controller.modelChanged(this.DirectionsButtonModel);
				$('DirectionsInput').show();
				$('DirectionsPanel').hide();
			};

            this.destination = this.clickedMarker.marker.getPosition();
            this.controller.get("DestinationSearchField").value = this.clickedMarker.title;
            this.controller.get("DestinationSearchField").blur();
            //launch a Directions (upon user feedback)
            this.Directions();
         	break;
         case 'do-marker-remove':
			this.clickedMarker.marker.setMap(null);
			this.clickedMarker.infoBubble.setMap(null);
         	break;
      }
},

markerInfo: function (marker) {

	//var infostring = marker.subtitle + " | Loc: " + marker.marker.getPosition();
	
	var request = {
		reference: marker.place.reference
	};

	this.InfoService = new google.maps.places.PlacesService(this.map);
	this.InfoService.getDetails(request, function(place, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				//this.result = place;
				this.controller.stageController.pushScene({'name': 'marker-info', transition: Mojo.Transition.none}, place);
				//Mojo.Log.info("** ADRESA RESULT ***", this.result.formatted_address);
			} else if (marker.place.geometry.location) {
				//if getDetails failed (usually due to missing reference for dropped pins)
				this.controller.stageController.pushScene({'name': 'marker-info', transition: Mojo.Transition.none}, marker.place);				
			}
		}.bind(this));

},

ChangeCmdMenu: function(action) {


switch (action) {
	case "directions":
    	this.cmdMenuModel.items[0].items = [{icon:'back', command:'back-step', disabled: true},
          {icon:'forward', command:'forward-step'}];
        this.controller.modelChanged( this.cmdMenuModel );
        this.MayBubblePop = true;
        this.toggleDirectInfoBubble(this.DirectinfoBubbles[0], this.Directmarkers[0]);
	break;
	case "normal":
		this.cmdMenuModel.items[0].items = [];
		this.controller.modelChanged( this.cmdMenuModel );
	break;
	};

},

moveOnRoute: function (command) {

	switch (command) {
	case "forward-step":

	if (this.myRoute.steps.length > (this.DirectStep+1)) {

		if (this.Directmarkers.length > 2) {

				this.toggleDirectInfoBubble(this.DirectinfoBubbles[2], this.Directmarkers[2]);

				this.Directmarkers[2].setMap(null);
				this.DirectinfoBubbles[2].setMap(null);

				delete this.DirectinfoBubbles[2];
				delete this.Directmarkers[2];

				this.DirectinfoBubbles.length--;
				this.Directmarkers.length--;
			};

			this.DirectStep++;

			if (this.WebOSVersion1()) {
				var newlatlng = new google.maps.LatLng(this.myRoute.steps[this.DirectStep].start_point.lat, this.myRoute.steps[this.DirectStep].start_point.lng);
				this.myRoute.steps[this.DirectStep].start_location = newlatlng;
			};

			//create a desired marker
			this.PlaceDirectionMarker({position: this.myRoute.steps[this.DirectStep].start_location, style: "point", title: this.myRoute.steps[this.DirectStep].instructions, subtitle: "" });
			this.MayBubblePop = true;
			this.toggleDirectInfoBubble(this.DirectinfoBubbles[2], this.Directmarkers[2]);
	};

	break;
	case "back-step":

		if (0 < (this.DirectStep)) {

		if (this.Directmarkers.length > 2) {
				this.toggleDirectInfoBubble(this.DirectinfoBubbles[2], this.Directmarkers[2]);

				this.Directmarkers[2].setMap(null);
				this.DirectinfoBubbles[2].setMap(null);

				delete this.DirectinfoBubbles[2];
				delete this.Directmarkers[2];

				this.DirectinfoBubbles.length--;
				this.Directmarkers.length--;

			};

			this.DirectStep--;

			if (this.WebOSVersion1()) {
				var newlatlng = new google.maps.LatLng(this.myRoute.steps[this.DirectStep].start_point.lat, this.myRoute.steps[this.DirectStep].start_point.lng);
				this.myRoute.steps[this.DirectStep].start_location = newlatlng;
			};


			//create a desired marker
			this.PlaceDirectionMarker({position: this.myRoute.steps[this.DirectStep].start_location, style: "point", title: this.myRoute.steps[this.DirectStep].instructions, subtitle: "" });

			this.MayBubblePop = true;
			this.toggleDirectInfoBubble(this.DirectinfoBubbles[2], this.Directmarkers[2]);
	};
	break;
	};
		/* handle the command menu arrows visibility */
			switch (this.DirectStep) {

				case 0:
					this.cmdMenuModel.items[0].items[0].disabled = true;
					this.cmdMenuModel.items[0].items[1].disabled = false;
					this.controller.modelChanged( this.cmdMenuModel );
					break;
				case 1:
					this.cmdMenuModel.items[0].items[0].disabled = false;
					this.cmdMenuModel.items[0].items[1].disabled = false;
					this.controller.modelChanged( this.cmdMenuModel );
					break;
				case this.myRoute.steps.length - 2:
					this.cmdMenuModel.items[0].items[0].disabled = false;
					this.cmdMenuModel.items[0].items[1].disabled = false;
					this.controller.modelChanged( this.cmdMenuModel );
					break;
				case this.myRoute.steps.length - 1:
					this.cmdMenuModel.items[0].items[0].disabled = false;
					this.cmdMenuModel.items[0].items[1].disabled = true;
					this.controller.modelChanged( this.cmdMenuModel );
					break;
			};

},

MapHeadingRotate: function(heading) {
	
	//var allowrotate = true;
	if (this.NewTilesHere) {
		this.ContainerToRotate = this.getGoogleTiles();
		this.NewTilesHere = false;
	};
	 
     if (this.previousheading != undefined) {
		  heading = (heading + this.previousheading)/2;
		 };

	this.ContainerToRotate.style.webkitTransform = 'rotate(' + Math.round(heading) + 'deg)';
	this.ContainerToRotate.style.overflow = "visible !important;";

	
	this.previousheading = heading;
	
	
},

SetTopMenuText: function (text) {
	
	this.feedMenuModel.items[1].items[1].label = text;
    this.controller.modelChanged(this.feedMenuModel);
	
},

GetHeadingFromLatLng: function (location1, location2) {
	
	/* I use manually calculated heading for testing purposes in emulator, because the system GPS heading value isn't available in emulator */
	
	/** Converts numeric degrees to radians */
	if (typeof(Number.prototype.toRad) === "undefined") {
	  Number.prototype.toRad = function() {
		return this * Math.PI / 180;
	  }
	};
	/** Converts radians to numeric (signed) degrees */
	if (typeof(Number.prototype.toDeg) === "undefined") {
	  Number.prototype.toDeg = function() {
		return this * 180 / Math.PI;
	  }
	};

	//Mojo.Log.info("** location1 %j ***", location1);
	//Mojo.Log.info("** location2 %j ***", location2);
	var lat1 = location1.Na;
	var lon1 = location1.Oa;
	var lat2 = location2.Na;
	var lon2 = location2.Oa;
	
	var dLat = (lat2-lat1).toRad();
	var dLon = (lon2-lon1).toRad();
	var lat1 = lat1.toRad();
	var lat2 = lat2.toRad();
	
	var y = Math.sin(dLon) * Math.cos(lat2);
	var x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
	var heading = Math.atan2(y, x).toDeg();
	
	return heading;

},

FullscreenOff: function() {
	
	this.Preferences.Fullscreen = false;
	this.PrefsCookie.put(this.Preferences);
	
	this.FullscreenDialog = this.controller.showAlertDialog({
	            onChoose: function(value) {
	            },
	            title: $L("Information..."),
	            message: $L("The application must be restarted to make the changes."),
	            choices: [{
	               label: $L("Acknowledge"),
	               value: ""
	            }]
	         });
	
},

SearchNearbyPlaces: function (keyword, radius) {
	
	var request = {
    //location: this.MyLocation,
    location: this.map.getCenter(), //search poi from actual map center
    radius: radius,
    //rankBy: google.maps.places.RankBy.DISTANCE,
    //types: ['store']
    keyword: keyword
  };

this.NearbyService = new google.maps.places.PlacesService(this.map);

this.NearbyService.search(request, function(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				// clear previous nearby markers
				this.clearNearbyMarkers();
				//place all new markers
				for (var i = 0; i < results.length; i++) {
				  var place = results[i];
				  place.distance = google.maps.geometry.spherical.computeDistanceBetween(request.location, place.geometry.location);
				  this.PlaceNearbyMarker(results[i]);
				};
				//fit the map to the all nearby markers bounds
				this.MarkersFitBounds(this.Nearbymarkers);
			}
		}.bind(this));

},

PlaceNearbyMarker: function(place) {
	
        var placeLoc = place.geometry.location;       
        var image = new google.maps.MarkerImage('images/MapMarker_Ball__Red.png',
		new google.maps.Size(48, 48),
		new google.maps.Point(0, 0), // origin
		new google.maps.Point(23, 47), // anchor
		new google.maps.Size(48, 48) //scaled size
		);
		
        var marker = new google.maps.Marker({
          map: this.map,
          icon: image,
          optimized: this.optimizedmarkers, //webos 2.2 devices need it, because of click event fire Google API bug!
          animation: google.maps.Animation.DROP,
          position: place.geometry.location
		});

	//Mojo.Log.info("** Marker zindex ***", marker.getZIndex());
	/*
	var infowindow = new google.maps.InfoWindow();
        //arrInfoWindows[i] = infowindow;
        marker.myHtml = "Test this";
        
        //google.maps.event.addListener(marker, 'click', function () {
                infowindow.setContent(marker.myHtml);
                infowindow.open(this.map, marker);
          //  });
          */
          
            
	
	
	//variable to identify if the bubble for this place is created
	place.infoBubble = undefined;
	
	google.maps.event.addListener(marker,"click",this.toggleNearbyInfoBubble.bind(this, marker, place));

	this.MayNearbyBubblePop = true;
	//Add it to the array	
	marker.place = place; //add place array to the marker, because of pushing to other scenes
	this.Nearbymarkers.push(marker);


},

toggleNearbyInfoBubble: function(marker, place){

		(function(){
				this.MayNearbyBubblePop = true;
			}).bind(this).delay(0.5);

//add calculated distance information to each poi infobubble
var formateddistance = "<div class='phoneytext2'>(" + (place.distance/1000).toFixed(2) + "km) ";

if (place.rating) {
	var formateddistance = "<div class='phoneytext2' style='height: 18px; margin-top: 7px;'>(" + (place.distance/1000).toFixed(2) + "km) ";
	var ratingcontainer = '<div class="rating-container" id="rating-container" style="padding-right: 7px; padding-left: 0px; margin-top: 5px; float:left;"><div class="rating_bar"><div id="ratingstar" style="width:' + place.rating*20 + '%"></div></div></div>' + formateddistance;
} else {
	var ratingcontainer = formateddistance;
	};

	
			
if (place.infoBubble == undefined) {	
			
		var infoBubble = new InfoBubble({
			map: this.map,
			content: '<div id="bubble" class="phoneytext">' + place.name + '<div class="phoneytext2">' + place.vicinity + ratingcontainer,
			shadowStyle: 1,
			padding: 0,
			backgroundColor: 'rgb(57,57,57)',
			borderRadius: 4,
			arrowSize: 10,
			borderWidth: 1,
			borderColor: '#2c2c2c',
			disableAutoPan: false,
			hideCloseButton: true,
			arrowPosition: 50,
			backgroundClassName: 'phoney',
			backgroundClassNameClicked: 'phoney-clicked',
			arrowStyle: 2,
			onClick: function(){
				
				//--> Start the marker bouncing so they know it was clicked
				//marker.setAnimation(google.maps.Animation.BOUNCE);
				this.markerBubbleTap({marker: marker, infoBubble: infoBubble, title: place.name, subtitle: place.vicinity, place: place});


			}.bind(this)

		});
		
		place.infoBubble = infoBubble;
		
		place.infoBubble.open(this.map, marker);


		//Add it to the array

		this.NearbyinfoBubbles.push(infoBubble);

	} else {
	
			//--> Now open the bubble
			if (!place.infoBubble.isOpen() && this.MayNearbyBubblePop){
				place.infoBubble.open(this.map, marker);
				this.MayNearbyBubblePop = false;
			}else {
				place.infoBubble.close();
				place.infoBubble.setMap(null);
				this.MayNearbyBubblePop = false;
			};
		};

},

MarkersFitBounds: function(MarkersArray) {

	//  Make an array of the LatLng's of the markers you want to show
	var LatLngList = [];
	
	for (var i = 0; i < MarkersArray.length; i++) {
				  var position = MarkersArray[i].position;
				  LatLngList.push(position);
				};
	var bounds = new google.maps.LatLngBounds();
	//  Go through each
	for (var i = 0, LtLgLen = LatLngList.length; i < LtLgLen; i++) {
	  //  And increase the bounds to take this point
	  bounds.extend (LatLngList[i]);
	};
	//  Fit these bounds to the map
	this.map.fitBounds(bounds);

},

getMarkerFromList: function (action) {
	
	this.blockTPPan = true;
	
	//index the nearby markers as "relevance"
	for (var i = 0; i < this.Nearbymarkers.length; i++) {
		this.Nearbymarkers[i].place.relevance = i;
	};
	
	//index the markers as "relevance" and add distance from actual location
	for (var i = 0; i < this.markers.length; i++) {
		this.markers[i].place.relevance = i;
		this.markers[i].place.distance = google.maps.geometry.spherical.computeDistanceBetween(this.MyLocation, this.markers[i].place.geometry.location);
	};
	
	this.MyLocationMarker = [];
	
	this.MyLocationMarker.place = [];
	this.MyLocationMarker.place.geometry = [];
	this.MyLocationMarker.place.geometry.location = this.MyLocation;
	this.MyLocationMarker.place.name = $L("My Location");
	this.MyLocationMarker.place.vicinity = "";

	var MarkersArray = [];
	MarkersArray.action = action;
	
	MarkersArray[0] = this.Nearbymarkers; //nearby markers
	MarkersArray[1] = this.markers; //markers - found places
	MarkersArray[2] = this.MyLocationMarker; //My Location marker
	//MarkersArray[3] = this.Directmarkers //origin and destination markers

	
	this.controller.stageController.pushScene({'name': 'markers-list', transition: Mojo.Transition.none}, MarkersArray);
},

OriginMarkersButtonTap: function (event) {
	this.getMarkerFromList("origin");
},

DestinationMarkersButtonTap: function (event) {
	this.getMarkerFromList("destination");
},

GeocodeFromLatLng: function(latlng) {
	
	var geocoder = new google.maps.Geocoder();
	
    geocoder.geocode({'latLng': latlng}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
		  Mojo.Log.info("** ADRESA *** %j", results[1].formatted_address);
		  //force the result to have original coordinates
		  results[1].geometry.location = latlng;
		  this.PlaceDroppedPin(results[1]);
          return results[1];
        } else {
          
        }
      } else {
        Mojo.Log.info("Geocoder failed due to: " + status);
      }
    }.bind(this));
	
},

checkConnectivity: function (callback) {
   this.controller.serviceRequest('palm://com.palm.connectionmanager', {
        method: 'getstatus',
        parameters: {},
        onSuccess: function (response) {
            var wifi = response.wifi;
            var wan = response.wan;
            var hasInternet = response.isInternetConnectionAvailable;
 
            if (hasInternet && (wifi.state === "connected" || wan.state === "connected")) {
                if(callback){
                    callback();
                }
            } else {
                this.controller.showAlertDialog({
                    onChoose: this.closeApp,
                    title: $L("No Internet Connection"),
                    message: $L("This application requires internet connection. Please close the application and try it later when the connection will be available."),
                    choices:[
                        {label:$L('Acknowledge'), value:"ok", type:'dismiss'}
                    ]
                });
            }
        }.bind(this),
        onFailure: function(response) {
            // Handle failure here...
        }.bind(this)
    });
},

MapHold: function (event) {
	
	Mojo.Log.info("** DOWN X*** %j", event.down.x);
	Mojo.Log.info("** DOWN Y*** %j", event.down.y);
 
	
	/*
	document.getElementById("map_canvas").style.width = "0%";
	document.getElementById("map_canvas").style.height = "0%";
	document.getElementById("map_canvas").style.width = "100%";
	document.getElementById("map_canvas").style.height = "100%";
	document.getElementById("map_canvas").hide();
	document.getElementById("map_canvas").show();
	*/
	//var MarkerPoint = this.overlay.getProjection().fromLatLngToContainerPixel(latlng);
	var point = new google.maps.Point(event.down.x, event.down.y);
	//Mojo.Log.info("** POINT*** %j", point);
	var taplatlng = this.overlay.getProjection().fromContainerPixelToLatLng(point);
	//var taplatlng = this.overlay.getProjection().fromDivPixelToLatLng(point);
	this.inputstring = taplatlng.toUrlValue(4);
	this.setTopBarText(this.inputstring);
	this.holdaction = "droppin";
	this.DropPin(taplatlng);
},

setTopBarText: function(text) {
	
	//set the view menu text
     this.feedMenuModel.items[1].items[1].label = text;
     this.controller.modelChanged(this.feedMenuModel);
	
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

closeApp: function () {
	this.controller.window.close();
},

setLocalizedHTML: function () {
	
	/* I'm too lazy to write each localized scene as documentation writes, instead this function pulls localized strings to one common scene */
	document.getElementById("OriginText").innerHTML = '<img src="images/bubble/flagA.png" width="24" height="24" >' + $L("Origin:");
	document.getElementById("DestinationText").innerHTML = '<img src="images/bubble/flagB.png" width="24" height="24">' + $L("Destination:");
	document.getElementById("HintText").innerHTML = $L("<b>Hint:</b> If you select place from suggestions, one marker will be placed.<br> If you are looking for nearby places, just type what you need and press Enter.<br>Example 1: '<i>pizza</i>' find nearest pizza from map center within actual map bounds<br>Example 2: '<i>hotel@5000</i>' find hotels within 5000m from map center");
},

//EXPERIMENTAL ODTUD

Debug: function() {
	


}

};
