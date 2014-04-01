function MainAssistant(arg) {
this.MapCookie = arg.Cookies.MapCookie;
this.TrafficCookie = arg.Cookies.TrafficCookie;
this.PrefsCookie = arg.Cookies.PrefsCookie;
this.launchParams = arg.launchParams;
}

// define global variables
var markers = [];
var infoBubbles = [];
var Favorites = [];
var MarkersArray = [];

// open SQLite database
var db = new Mojo.Depot({name:"MainDB", version:1, replace:false},
                        function(){}, 
                        function(err){ Mojo.Log.error("MainDB", err.message);}
);

MainAssistant.prototype = {
	setup: function() {

//Check internet connectivity at first
this.checkConnectivity();
//this.Log("**** ZAPNOUT INTERNET CHECK ******");  

/* DEBUG FUNCTION */
this.cevent = [];
this.cevent.magHeading = 0;
this.devversion = false;
this.debug = false;
this.devfakegps = false;

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

//detect HP Touchpad

if (this.isTouchPad()) {
	// set height of scroller for TP
	var listheight = Math.round(this.controller.window.innerHeight*0.84) + "px";
	document.getElementById("DirectionsPanelScroller").style.maxHeight = "620px";
	// TP as onlyone WebOS device support optimized markers in newest gAPI v3
	this.optimizedmarkers = true;
} else {
	// set height of scroller depends on device resolution
	var listheight = Math.round(this.controller.window.innerHeight*0.75) + "px";
	document.getElementById("DirectionsPanelScroller").style.maxHeight = listheight;
	// Older WebOS devices doesn't support optimized markers in newest gAPI v3
	this.optimizedmarkers = false;
	};

//detect touch enabled engine
if ("ontouchstart" in document.documentElement)
	{
	  // It's a touch screen device.
	  this.touch = true;
	}
else {
  // Others devices.
  this.touch = false;
};

this.Log("**** Touch enable webkit: %j", this.touch);

//setup radio button directions type

this.controller.setupWidget("DirectType",
  this.attributes = {
      choices: [
          {label: $L(""), value: "driving"},
          {label: $L(""), value: "walking"},
          {label: $L(""), value: "transit"},
          {label: $L(""), value: "bicycling"} 
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

//setup radio button time picker for Transit arrival or departure time

this.controller.setupWidget("TimePickerRadio",
  this.attributes = {
      choices: [
          {label: $L("Departure"), value: "departure"},
          {label: $L("Arrival"), value: "arrival"}
      ]
  },
  this.TimePickerRadioModel = {
      value: "departure",
      disabled: false
  }
);

this.TimePickerRadioEventHandler = this.TimePickerRadio.bindAsEventListener(this);
this.TimePickerRadio = this.controller.get('TimePickerRadio');
Mojo.Event.listen(this.TimePickerRadio, Mojo.Event.propertyChange, this.TimePickerRadioEventHandler);

//setup field and observe for initiate custom date picker

this.TransitDateFieldEventHandler = this.pickDateKalendae.bindAsEventListener(this);
this.TransitDateField = this.controller.get('TransitDateField');
this.TransitDateField.observe(Mojo.Event.tap, this.TransitDateFieldEventHandler);


//Setup date picker for Transit options

//externi kalendae
this.kalendae = new Kalendae("Kalendae", {
		months: 1,
		mode: 'single',
		weekStart: 1,
		direction: 'today-future',
		selected: new Date()
});

this.kalendae.subscribe('change', this.handleKalendaeDate.bind(this));

$("TransitDateField").innerHTML = $L("Today");	
	
var todayDate = new Date();

//setup KalendaeDrawer collapsible
this.controller.setupWidget("KalendaeDrawer",
  this.attributes = {
      modelProperty: 'open',
      unstyled: true
  },
  this.KalendaeDrawerModel = {
      open: false
  }
);

//Setup time picker for Transit options

this.controller.setupWidget("TransitTime",
  this.attributes = {
      label: $L("Time"),
      modelProperty: 'time'
  },
  this.TransitDateModel = {
      time: todayDate
  }
);

//listener for timepicker
this.TransitPickerEventHandler = this.TransitPicker.bindAsEventListener(this);
this.TransitTimePicker = this.controller.get('TransitTime');
Mojo.Event.listen(this.TransitTimePicker, Mojo.Event.propertyChange, this.TransitPickerEventHandler);


//default values for direction options
this.routeAlternatives = false;
this.avoidHighways = false;
this.avoidTolls = false;


//setup Route alternatives checkbox

this.controller.setupWidget("RouteAlternatives",
  this.attributes = {
      trueValue: true,
      falseValue: false
  },
  this.RouteAlternativesModel = {
      value: this.routeAlternatives,
      disabled: false
  }
);

this.RouteAlternativesHandler = this.handleRouteAlternatives.bindAsEventListener(this);
Mojo.Event.listen(this.controller.get("RouteAlternatives"), Mojo.Event.propertyChange, this.RouteAlternativesHandler);

//setup Avoid highways checkbox

this.controller.setupWidget("AvoidHighways",
  this.attributes = {
      trueValue: true,
      falseValue: false
  },
  this.AvoidHighwaysModel = {
      value: this.avoidHighways,
      disabled: false
  }
);

this.AvoidHighwaysHandler = this.handleAvoidHighways.bindAsEventListener(this);
Mojo.Event.listen(this.controller.get("AvoidHighways"), Mojo.Event.propertyChange, this.AvoidHighwaysHandler);

//setup Avoid Tolls checkbox

this.controller.setupWidget("AvoidTolls",
  this.attributes = {
      trueValue: true,
      falseValue: false
  },
  this.AvoidTollsModel = {
      value: this.avoidTolls,
      disabled: false
  }
); 

this.AvoidTollsHandler = this.handleAvoidTolls.bindAsEventListener(this);
Mojo.Event.listen(this.controller.get("AvoidTolls"), Mojo.Event.propertyChange, this.AvoidTollsHandler);

//setup direction options scroller

this.controller.setupWidget("DirectionsOptionsScroller",
  this.attributes = {
      mode: 'vertical'
  },
  this.DirectionsOptionsScrollerModel = {
      snapElements: {
      x: []
      }
  }
);

document.getElementById("DirectionsOptionsScroller").style.maxHeight = listheight;

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

//setup map-tap listener, start listening only for webOS 2.2.x in webos2events function
this.MapTapEventHandler = this.MapTap.bindAsEventListener(this);
this.MapTap = this.controller.get('map_canvas');

//define mousedown follow listener
this.mousedownInterruptsFollowHandler = this.mousedownInterruptsFollow.bindAsEventListener(this);

//define mousedown stop pan listener
this.panMousedownHandler = this.panMousedown.bindAsEventListener(this);

//setup TP Back buttons

this.controller.setupWidget("TPBackButton",
  this.attributes = {
  },
  this.BackButtonModel = {
      label: $L("Back"),
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

// setup status panel spinner

this.controller.setupWidget("StatusPanelSpinner",
  this.attributes = {
      spinnerSize: "small"
  },
  this.StatusPanelSpinnerModel = {
      spinning: true
  }
);

//Observe a Swap button element in Directions input
this.SwapDirectionsHandler = this.SwapDirections.bindAsEventListener(this);
this.controller.get('SwapButton').observe(Mojo.Event.tap, this.SwapDirectionsHandler);

//Set localized HTML texts
this.setLocalizedHTML();

this.setStatusPanel($L("Loading Maps..."));

//Set development label
if (this.devversion) {	
	$("devlabel").show();
};

// --- test EVENETS help function for me
/*
 var gestures = [
         'click',
         'dblclick',
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
             this.Log("*** EVENT TEST ***", event.type);
         }.bind(this), true);
      };

*/

	this.firstGPSfix();
	
	this.setStatusPanel($L("Waiting for your location..."));

	/* vsechny normalni pristroje az na Pre3 maji rozdil pro velikost menu 170 */
	this.widthadd = 170-60;
	this.heightadd = 170-60;
	this.ImageRatio = 1;
	this.ImagePathAdd = "";
	
	//Puvodne jsem to prirazoval natvrdo, tohle je obecnejsi, ziskat pixel ratio (Pre3 1.5, ostatni 1.0)
	this.ScreenRoughRatio = this.controller.window.devicePixelRatio;
	
	if(this.isPre3()){
		this.Log("*** Detected device is Pre3 ***");
		this.widthadd = (330-60+2); //the +2 fixes the horizontal and vertical lines in top menu
		this.heightadd = (440-60);
		this.ImageRatio = 1.5;
		this.ImagePathAdd = "1.5/";
		this.restmenuwidth = Mojo.Environment.DeviceInfo.screenWidth - this.widthadd;
	} else {
		/* hodnota zbytku menu */
		this.restmenuwidth = this.controller.window.innerWidth - this.widthadd;
		};


	this.createMenu();

	this.GPSFix = false;

	//setup geocoder
	this.geocoder = new google.maps.Geocoder();

	//setup map
	this.MyLocation = new google.maps.LatLng(37.39281, -122.04046199999999);
	
	//this style hides the google map
	this.MapOffStyle =[
    {
        featureType: "all",
        elementType: "all",
        stylers: [
              { visibility: "off" }
        ]
    }];
    
	//if this is enabled, the poi's on the map are disabled
	var mapStyles =[
    {
        featureType: "poi",
        elementType: "labels",
        stylers: [
              { visibility: "off" }
        ]
    },{
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [
      //{ lightness: -100 }
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

this.Log("*************************************");
this.Log("* GOOGLE MAPS API VERSION: ", google.maps.version);
this.Log("*************************************");

    var myOptions = {
        zoom: 2,
        center: this.MyLocation,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        scaleControl: true,
        rotateControl: false,
        maxZoom: this.maxZoom,
        minZoom: this.minZoom,
        mapMaker: false, //ToDo feature
        //styles: mapStyles,
        keyboardShortcuts: false,
      	draggable: false	
    };
    
    this.map = new google.maps.Map(this.controller.get("map_canvas"), myOptions);

	this.MapType = this.MapCookie.get();
	
	if (this.MapType == undefined)  {
		this.ActualMapType = [true, false, false, false];
		this.Log("DEFAULT:" , this.MapType);
		} else {
			this.Log("Cookie MapType:" , this.MapType);
			try {
				this.handlePopMapType(this.MapType);
				}
			catch (error) {
				this.Log("Layers cookie not properly defined, revert to default", error);
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
	this.Log("PREFERENCES: %j" , this.Preferences);
	
	if (this.Preferences == undefined)  {
		this.Preferences = DefaultPreferences;
		this.PrefsCookie.put(this.Preferences);
		} else {
			try {
				this.checkAllPreferences(this.Preferences);
				//this.setPrefsWidgets(this.Preferences);
				}
			catch (error) {
				this.Log("Preferences not properly defined, revert to default", error);
				this.PrefsCookie.remove();
				this.Preferences = DefaultPreferences;
				this.PrefsCookie.put(this.Preferences);
				//this.setPrefsWidgets(this.Preferences);
				};
		};
		
	this.controller.enableFullScreenMode(this.Preferences.Fullscreen);
	
	//Load a Favorites from Mojo.Depot
	this.getFavorites();
	
	/* Openstreetmaps custom map type set - cached as Custom map type, non-cached as ImageMapType */
	if (this.Preferences.MapCache) {
		this.map.mapTypes.set('OSM', new OSMMapType(this.Preferences));	
	} else {		
		this.map.mapTypes.set("OSM", new google.maps.ImageMapType({
			
                getTileUrl: function(coord, zoom) {
						return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
                },
                tileSize: new google.maps.Size(256, 256),
                isPng: true,
                name: "OpenStreetMap",
                credit: 'OpenStreetMap',
                maxZoom: 18
        }));
	};

        
        /* Nokia custom map type set */
        this.map.mapTypes.set("NOKIA", new google.maps.ImageMapType({
                getTileUrl: function(coord, zoom) {
                    return "http://maptile.maps.svc.ovi.com/maptiler/maptile/newest/normal.day/" + zoom + "/" + coord.x + "/" + coord.y + "/256/png8";
                },
                tileSize: new google.maps.Size(256, 256),
				isPng: true,
				maxZoom: 17,
				name: "NOKIA"
        }));

    	// setup autocompleter for main search
		this.MainInput = "";
		this.MainInput = document.getElementById("MainSearchField");	
        this.MainAutocomplete = new google.maps.places.Autocomplete(this.MainInput);
        this.MainAutocomplete.bindTo('bounds', this.map);
        new google.maps.event.addListener(this.MainAutocomplete, 'place_changed', this.SelectedAutocomplete.bind(this));
        
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
	this.DirectinfoBubbles = [];
	this.Directmarkers = [];
	this.DirectStep = 0;
	this.NearbyinfoBubbles = [];
	this.Nearbymarkers = [];
	this.NearbyStep = 0;
	this.blockTPPan = false;
	this.wasflicked = false;
	this.isNavit = false;
	this.blockGPSFix = false;
	this.mapcanvasx = 0;
	this.mapcanvasy = 0;
	this.haveCompass = false;
	this.compassactive = false;
	this.blockpulse = false;
	this.routeIndex = 0;
	this.imagery = 0;
	this.imageryHeading = 0;
	this.cmdMenuStyle = "normal";
	this.maxZoom = 20;
	this.minZoom = 0;
	this.dontForgetToEnableZoomIn = false;
	this.dontForgetToEnableZoomOut = false;
	this.gps;
	this.parsedParams = null;
	this.idleCompassDeg = 0; 
	this.idleNeedleDeg = 0; //portrait orientation expected at the start
	this.kineting = false;
	this.trickTime = 100; //default time to trick duration for non-touch devices
	this.OSMPrefix = "http://tile.openstreetmap.org/";
	this.existsCache = [];
	this.refreshTimerCounting = false;
	this.NewTilesHere = true;

	// map doesn't follow GPS as default
	this.followMap = false;
    
	//setup direction service
    var rendererOptions = {
  		map: this.map,
  		suppressMarkers: true,
		polylineOptions: {
			//geodesic: true,
			clickable: false,
			//editable: true,
			strokeColor: '#4941e3',
			strokeOpacity: 0.7,
			strokeWeight: 8*this.ScreenRoughRatio
			},
		markerOptions: {
			optimized: this.optimizedmarkers
			},
  		suppressInfoWindows: true,
  		draggable: false,
		}
    this.directionsService = new google.maps.DirectionsService();
	this.directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
	this.directionsDisplay.setPanel(document.getElementById('directions-panel'));
	
    this.trafficLayer = new google.maps.TrafficLayer();

	// load cookie for traffic layer
	this.TrafficVisibile = this.TrafficCookie.get();
	this.Log("TRAFFIC:" , this.TrafficVisibile);
	if (this.TrafficVisibile == undefined)  {
		this.TrafficVisibile = false;
		this.TrafficCookie.put(true);
		} else {
			try {
					this.Traffic();					
				}
			catch (error) {				
					this.Log("Cookie not properly defined, revert to default", error);
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
		suppressInfoWindows: true,
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
	
	//Setup Transit layer as hidden by default
	this.TransitVisibile = false;
	
	//Set to last view
	var lastlatlng = new google.maps.LatLng(this.Preferences.LastLoc.lat, this.Preferences.LastLoc.lng);
	this.map.setCenter(lastlatlng);
	this.map.setZoom(this.Preferences.LastLoc.zoom);
	
	/* ToDo: Panoramio Layer - unusable on WebOS 2.x devices, because the pictures are not touchable */
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
 	//new google.maps.event.addListener(this.map, 'center_changed', this.MapCenterChanged.bind(this));
 	new google.maps.event.addListener(this.map, 'overlaycomplete', this.OverlayComplete.bind(this));
 	new google.maps.event.addListener(this.map, 'zoom_changed', this.zoomChanged.bind(this));
 
 	this.CenterChanged = true;

 	new google.maps.event.addDomListener(document.getElementById('map_canvas'), 'resize', this.Resize.bind(this));
 	
 	//key press listener
 	this.KeypresseventHandler = this.Keypress.bindAsEventListener(this);
 	if (!this.debug) {
		this.controller.listen(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);
	};
	this.KeyWasPressed = false;
	
	//searchfield key press listener
 	this.SearchKeypresseventHandler = this.SearchKeypress.bindAsEventListener(this);
 	if (!this.debug) {
		this.controller.listen(document.getElementById('MainSearchField'), 'keydown', this.SearchKeypresseventHandler);
	};
	this.SearchKeyWasPressed = false;
	
	//searchfield onpaste listener
 	this.SearchPasteeventHandler = this.SearchPaste.bindAsEventListener(this);
	this.controller.listen(document.getElementById('MainSearchField'), 'paste', this.SearchPasteeventHandler);

  	// Map Pinch to Zoom lisetener
	Mojo.Event.listen(this.controller.get("map_canvas"), "gesturestart", this.handleGestureStart.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get("map_canvas"), "gesturechange", this.handleGestureChange.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get("map_canvas"), "gestureend", this.handleGestureEnd.bindAsEventListener(this));
	//Mojo.Event.listen(this.controller.get("map_canvas"), "click", this.click.bindAsEventListener(this));
	
	//Setup map interaction listeners
	this.DragStartEventHandler = this.dragStart.bindAsEventListener(this);
    this.DraggingEventHandler = this.dragging.bindAsEventListener(this);
    this.DragEndEventHandler = this.dragEnd.bindAsEventListener(this);
    this.FlickEventHandler = this.flick.bindAsEventListener(this);
	
	//card minimize and maximize listeners
	this.activateHandler = this.activateWindow.bind(this);
	Mojo.Event.listen(this.controller.stageController.document, Mojo.Event.stageActivate, this.activateHandler);
	this.deactivateHandler=this.deactivateWindow.bind(this);
	Mojo.Event.listen(this.controller.stageController.document, Mojo.Event.stageDeactivate, this.deactivateHandler);
	
	//Compass for magnetic compas capable devices
	this.compassHandler = this.compassHandler.bindAsEventListener(this);
	this.controller.listen(document, "compass", this.compassHandler);
	
	this.compassTapHandler = this.compassTap.bindAsEventListener(this);
	this.controller.listen($("compass"), Mojo.Event.tap, this.compassTapHandler);
	
	/** ToDo: compas tap and hold feature **/
	//this.compassTapHoldHandler = this.compassTapHold.bindAsEventListener(this);
	//this.controller.listen($("compass"), Mojo.Event.hold, this.compassTapHoldHandler);


	// TODO: mousedown event is needed by hiding the command menu
	//Mojo.Event.listen(this.controller.get("map_canvas"), 'mousedown', this.mousedownHandler.bind(this));
	
	//Check if Navit is installed, needs FileMgr service
	this.checkNavit();
},

handleCommand: function(event) {
	if(event.type == Mojo.Event.commandEnable && (event.command == Mojo.Menu.helpCmd || event.command == Mojo.Menu.prefsCmd)) {
      event.stopPropagation();
    };
                if (event.type === Mojo.Event.command) {
                        if (event.command == 'zoomOut') {
										this.zoom("out");
                        }
                        if (event.command == 'zoomIn') {
										this.zoom("in");
                        }
                        if ((event.command == 'forward-step') || (event.command == 'back-step')) {
										this.setStatusPanel($L("Moving to next point..."));
                                        this.moveOnRoute(event.command);
                        }
                        if (event.command == 'maptype') {
                                         var near = event.originalEvent && event.originalEvent.target;
                                         this.controller.popupSubmenu({
																				  onChoose:  this.handlePopMapType,
																				  popupClass: "pre3maptype",
																				  placeNear: near,
																				  items: [
																				      {secondaryIconPath:'images/maptype-roadmap.png', label: $L('Roadmap'), command: 'Roadmap', chosen: this.ActualMapType[0]},
																				      {secondaryIconPath:'images/maptype-hybrid.png', label: $L('Hybrid'), command: 'Hybrid', chosen: this.ActualMapType[1]},
																				      {secondaryIconPath:'images/maptype-terrain.png', label: $L('Terrain'), command: 'Terrain', chosen: this.ActualMapType[2]},
																				      {secondaryIconPath:'images/maptype-satellite.png', label: $L('Satellite'), command: 'Satellite', chosen: this.ActualMapType[3]},
																				      {secondaryIconPath:'images/traffic-icon.png', label: $L('Traffic'), command: 'do-traffic', chosen: this.TrafficVisibile},
																				      {secondaryIconPath:'images/map-bubble-arrow-blue.png', label: $L('More') + ' ...', command: 'do-more', chosen: false}  
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
                        if (event.command == 'imagery-rotate') {
                        								this.ImageryRotate();
                        }
                        if (event.command == 'MyLoc') {	
                        								this.mylocation();
                        }
                        if (event.command == 'PopMenu') {

                        								var near = event.originalEvent && event.originalEvent.target;
                        								this.NearLayerTap = near;
                        								if (!this.Preferences.Fullscreen) {
														this.controller.popupSubmenu({
																				  onChoose:  this.handlePopMenu,
																				  popupClass: "pre3menu",
																				  placeNear: near,
																				  items: [
																					  {iconPath:'images/markers-icon.png', label: $L('Markers'), command: 'do-markers'},
																					  {iconPath:'images/direction-icon.png', label: $L('Directions'), command: 'do-direct'},
																				      {iconPath:'images/street.png', label: $L('Street View'), command: 'do-street'},																				    
																				      {iconPath:'images/clear-map.png', label: $L('Clear map'), command: 'do-clearmap'}
																				  ]
																				});} else {
														this.controller.popupSubmenu({
																				  onChoose:  this.handlePopMenu,
																				  popupClass: "pre3menu",
																				  placeNear: near,
																				  items: [
																					  {iconPath:'images/exit-fullscreen.png', label: $L('Exit Fullscreen'), command: 'do-fullscreenoff'},
																				      {iconPath:'images/markers-icon.png', label: $L('Markers'), command: 'do-markers'},
																					  {iconPath:'images/direction-icon.png', label: $L('Directions'), command: 'do-direct'},
																				      {iconPath:'images/street.png', label: $L('Street View'), command: 'do-street'},																	
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
			};
			//handle Forward swipe event   
            if (event.type == Mojo.Event.forward) {
				this.handleForwardSwipe(event);
			}
  },



cleanup: function() {
	
		/* Stop the GPS tracking */
		this.stopTracking();

		//Save last location and zoom
		this.Preferences.LastLoc.lat = this.map.getCenter().lat();
		this.Preferences.LastLoc.lng = this.map.getCenter().lng();
		this.Preferences.LastLoc.zoom = this.map.getZoom();
		this.PrefsCookie.put(this.Preferences);

		/* Stop all running listeners */
		Mojo.Event.stopListening(this.controller.get("map_canvas"), "gesturestart", this.handleGestureStart.bind(this));
		Mojo.Event.stopListening(this.controller.get("map_canvas"), "gesturechange", this.handleGestureChange.bind(this));
		Mojo.Event.stopListening(this.controller.get("map_canvas"), "gestureend", this.handleGestureEnd.bind(this));
		Mojo.Event.stopListening(this.controller.get("map_canvas"), 'mousedown', this.mousedownHandler.bind(this));
		Mojo.Event.stopListening(this.controller.get("map_canvas"), "click", this.click.bind(this));
		Mojo.Event.stopListening(this.controller.sceneElement, Mojo.Event.keydown, this.KeypresseventHandler);
		

		this.WebOS2Events("stop");

		Mojo.Event.stopListening(this.DirectType, Mojo.Event.propertyChange, this.DirectTypeEventHandler);
		Mojo.Event.stopListening(this.GetDirectionsButton, Mojo.Event.tap, this.GetDirectionsButtonEventHandler);
		Mojo.Event.stopListening(this.TPBackButton, Mojo.Event.tap, this.TPBackButtonEventHandler);
		Mojo.Event.stopListening(this.TPBackButtonD, Mojo.Event.tap, this.TPBackButtonEventHandler);
		Mojo.Event.stopListening(this.OriginMarkersButton, Mojo.Event.tap, this.OriginMarkersButtonEventHandler);
		Mojo.Event.stopListening(this.DestinationMarkersButton, Mojo.Event.tap, this.DestinationMarkersButtonEventHandler);
		Mojo.Event.stopListening(this.MapHold, Mojo.Event.hold, this.MapHoldEventHandler);
		Mojo.Event.stopListening(this.MapTap, Mojo.Event.tap, this.MapTapEventHandler);
		Mojo.Event.stopListening(this.TimePickerRadio, Mojo.Event.propertyChange, this.TimePickerRadioEventHandler);
		this.TransitDateField.stopObserving(Mojo.Event.tap, this.TransitDateFieldEventHandler);
		Mojo.Event.stopListening(this.TransitTimePicker, Mojo.Event.propertyChange, this.TransitPickerEventHandler);
		Mojo.Event.stopListening(this.controller.get("RouteAlternatives"), Mojo.Event.propertyChange, this.RouteAlternativesHandler);
		Mojo.Event.stopListening(this.controller.get("AvoidHighways"), Mojo.Event.propertyChange, this.AvoidHighwaysHandler);
		Mojo.Event.stopListening(this.controller.get("AvoidTolls"), Mojo.Event.propertyChange, this.AvoidTollsHandler);
		
},


createMenu: function() {

	if(this.isTouchPad()){
		$("TPBackButton").show(); //zapnu vsude backbuttony
		$("TPBackButtonD").show();
		this.actualTPwidth = this.controller.window.innerWidth;
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

this.CmdMenuHoldHandler = this.handleCmdMenuHold.bindAsEventListener(this);
Mojo.Event.listen(document.body, Mojo.Event.hold, this.CmdMenuHoldHandler);

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
          { label: $L("Google Maps"), command: 'searchPlaces', width: this.restmenuwidth},
          { iconPath: "images/layers.png", command: 'maptype', label: $L('M')},
          {label: $L('MyLoc'), iconPath:'images/menu-icon-mylocation.png', command:'MyLoc', disabled: true},
          {}
      ]
      },
      {
          items: [
          ]
      }
  ]
 };

this.controller.setupWidget(Mojo.Menu.viewMenu,
  { spacerHeight: 0, menuClass:'top-menu' },
  this.feedMenuModel);

},

firstFixSuccess: function(gps) {
	
	var accuracy = 500; // default accuracy

	var Mylatlng = new google.maps.LatLng(gps.latitude, gps.longitude);

	// tady je to nutne, aby GPS nedavala nedefinovane souradnice
	if (gps.latitude != undefined) {
		
		this.Log("** FIRST GPS FIX ***");
		this.gps = gps;
		this.MyLocation = Mylatlng;


	//this.Log("** MyLocation ***", this.MyLocation);
	this.accuracy = gps.horizAccuracy;

	if (this.accuracy < 0) {
		this.accuracy = 350; //odpovida accuracy fix 2
	};
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

				this.MyLocMarker = new google.maps.Marker({
					position: this.MyLocation,
					map: this.map,
					//icon: image,
					optimized: this.optimizedmarkers,
					flat: true,
					title: 'My Location'
				});
				
				this.setDefaultMyLocMarker();
				/* Bind the accuracy circle for the firs time */
				this.circle.bindTo('center', this.MyLocMarker, 'position');


				this.GPSFix = true;
				this.map.setCenter(this.MyLocation);
				
				/* Enable MyLocation button in view menu */
				this.feedMenuModel.items[1].items[3].disabled = false;
				this.controller.modelChanged(this.feedMenuModel);

				/* v pripade spusteni s argumentem maploc chceme zustat na markeru a ne prejit na polohu */
				if (this.maploc == undefined) {
						//set the zoom level to the circle's size
						this.map.fitBounds(this.circle.getBounds());
						if ( this.map.getZoom() > 14 ) {
		    				this.map.setZoom(14);
		  					}
  			};
				
				this.startTracking();
				
} else {
	//next attempt to get first fix if the previous fail
	this.firstGPSfix();
	};

	
},

gpsUpdate: function(gps) {
	
	

	var Mylatlng = new google.maps.LatLng(gps.latitude, gps.longitude);

	// tady je to nutne, aby GPS nedavala nedefinovane souradnice
	if (gps.latitude != undefined && gps.longitude != undefined && !this.blockGPSFix) {
		
	this.gps = gps;
		
/** FAKE GPS HEADING and VELOCITY FOR EMULATOR **/

if (this.devfakegps) {
		//this.Log("gps update");
		gps.heading = this.devpreviousheading;
		if (this.MyLocation != undefined) {
			this.Heading = this.GetHeadingFromLatLng(this.MyLocation, Mylatlng);

			if (this.Heading != 0) {
				gps.heading = this.Heading;
				this.devpreviousheading = this.Heading;
				
			} else {
				gps.heading = this.devpreviousheading;
				};
		};
		//meters per seconds velocity
		gps.velocity = google.maps.geometry.spherical.computeDistanceBetween(this.MyLocation, Mylatlng);
};

/** END OF FAKE GPS HEADING and VELOCITY FOR EMULATOR **/	
		
	this.MyLocation = Mylatlng;


	// follow the map if the button in menu is active
	if (this.followMap) {
		this.map.panTo(this.MyLocation);		
		if (gps.velocity > 0.5) {
			//var velocity = Math.round(gps.velocity*3.6) + " km/h";
			var velocity = this.getVelocityFromGPS(gps.velocity);
			this.SetTopMenuText(velocity);
		} else {
			this.SetTopMenuText($L("Google Maps"));
		};
	} else {
		this.pulseDot(this.MyLocation); //checked that this is not a memory eater
		};

	this.accuracy = gps.horizAccuracy;

	if (this.accuracy < 0) {
		this.accuracy = 500; //odpovida accuracy fix 2
	}
	try {
			this.MyLocMarker.setPosition(this.MyLocation); //update markeru
		} catch (error) {
			this.Log("Warning: MyLocMarker not defined");
		};

			if (this.accuracy != this.oldaccuracy) {
				this.circle.setRadius(this.accuracy); // update accuracy circle
				this.oldaccuracy = this.accuracy;
			};
			
			//follow the map
			if (gps.heading != -1 && this.followMap && (gps.velocity > 0.83)) {
				if (this.Preferences.MapRotate) { this.MapHeadingRotate(gps)};
				this.setScoutMarker(Math.round(gps.heading));
			};
			//set marker arrow based on heading for velocity > 2km/h
			if (gps.heading != -1 && (gps.velocity > 0.55) && !this.followMap) {
				this.setScoutMarker(Math.round(gps.heading));
			} else if (!this.followMap) {
				this.setDefaultMyLocMarker();
			};
	};
},

StreetView: function(position) {
	
	this.setStatusPanel($L("Loading StreetView..."));

	this.WebOS2Events("stop");
	if (!position) {
		var position = this.map.getCenter();
	};
	this.controller.stageController.pushScene({'name': 'street', disableSceneScroller: true, transition: Mojo.Transition.none}, position);

},

zoom: function(action) {

switch (action) {

        case 'in':
			this.blockGPSFix = true;
			this.setStatusPanel($L("Zooming in..."));
			this.map.setZoom(this.map.getZoom() + 1);
            break;
        case 'out':
			this.blockGPSFix = true;
			this.setStatusPanel($L("Zooming out..."));
			this.map.setZoom(this.map.getZoom() - 1);
            break;
		};     
},

zoomChanged: function (event) {
	
	/* back to the scale 1 */
	if (this.TilesContainer) {
		this.TilesContainer.style["-webkit-transform"] = "scale(1,1)";
		
		/* Infobubbles size stuff - back to the scale 1 */
		for (var k = 0; k < this.elementsToScale.length; k++) {
			this.elementsToScale[k].style["-webkit-transform"] =  "scale(1,1)";
		};
		
	};
	
	/* Check MAX zoom */
	if (this.map.getZoom() >= this.maxZoom) {			
				for (var z = 0; z < this.cmdMenuModel.items[1].items.length; z++) {
					if (this.cmdMenuModel.items[1].items[z].label == $L('Plus')) {
						this.cmdMenuModel.items[1].items[z].disabled = true;
					};
				};
			this.dontForgetToEnableZoomIn = true;
			this.controller.modelChanged(this.cmdMenuModel);		
	}
	else if (this.dontForgetToEnableZoomIn) {
		for (var z = 0; z < this.cmdMenuModel.items[1].items.length; z++) {
			if (this.cmdMenuModel.items[1].items[z].label == $L('Plus')) {
				this.cmdMenuModel.items[1].items[z].disabled = false;
			};
		};
	this.dontForgetToEnableZoomIn = false;
	this.controller.modelChanged(this.cmdMenuModel);
	};
		
	/* Check MIN zoom */	
	if (this.map.getZoom() <= this.minZoom) {			
				for (var z = 0; z < this.cmdMenuModel.items[1].items.length; z++) {
					if (this.cmdMenuModel.items[1].items[z].label == $L('Minus')) {
						this.cmdMenuModel.items[1].items[z].disabled = true;
					};
				};
			this.dontForgetToEnableZoomOut = true;
			this.controller.modelChanged(this.cmdMenuModel);		
	}
	else if (this.dontForgetToEnableZoomOut) {
		for (var z = 0; z < this.cmdMenuModel.items[1].items.length; z++) {
			if (this.cmdMenuModel.items[1].items[z].label == $L('Minus')) {
				this.cmdMenuModel.items[1].items[z].disabled = false;
			};
		};
	this.dontForgetToEnableZoomOut = false;
	this.controller.modelChanged(this.cmdMenuModel);
	};		
},

mylocation: function() {

								if (this.GPSFix) {
									
									this.setStatusPanel($L("Moving to My Location..."));
									
									//block screen timeout
									this.BlockScreenTimeout(true);

									// change the icon as "follow map is active"
									this.feedMenuModel.items[1].items[3].iconPath = 'images/menu-icon-mylocation-follow.png';
									this.controller.modelChanged(this.feedMenuModel);
									
									/* get all elements to be not scaled to this.elementsToScale array */
									this.getElementsToScale();
									
									this.NewTilesHere = true;
	
									this.followMap = true;

									//start the mousedown listener
									Mojo.Event.listen(this.controller.get("map_canvas"), 'mousedown', this.mousedownInterruptsFollowHandler);

									this.map.setCenter(this.MyLocation);
									//set the zoom level to the circle's size
									this.map.fitBounds(this.circle.getBounds());
									if ( this.map.getZoom() > 16 ) {
											this.map.setZoom(16);
									};
										
									//start the mousedown listener
									//Mojo.Event.listen(this.controller.get("map_canvas"), 'mousedown', this.mousedownInterruptsFollowHandler);
									
									//this.Log("** MyLocation BUTTON ***", this.MyLocation);
								} else {Mojo.Controller.errorDialog($L("Wait for GPS fix!"));}
},

mousedownInterruptsFollow: function () {

	//stop the mousedown listener
	Mojo.Event.stopListening(this.controller.get("map_canvas"), 'mousedown', this.mousedownInterruptsFollowHandler);

	//rotate the map to the default heading
	var gps = [];
	gps.heading = 0;
	gps.velocity = 0;
	this.MapHeadingRotate(gps);
	
	//remove the animations
	(function(){
		this.TilesContainer.style["-webkit-transition"] = "";
		this.TilesContainer.style["-webkit-transform"] = "";
		this.removeTransforms();
	}).bind(this).delay(1);
	
	
	// rotate back all the other elements
	/*
	try {
		for (var k = 0; k < this.elementsToScale.length; k++) {
			this.elementsToScale[k].style["-webkit-transform"] = "";
		};
	} catch (error){};
	*/
	//this.removeTransforms();
	
	this.followMap = false;
	
	//unblock screen timeout
	this.BlockScreenTimeout(false);

	// change the icon as "follow map is active"
	this.feedMenuModel.items[1].items[3].iconPath = 'images/menu-icon-mylocation.png';
	this.controller.modelChanged(this.feedMenuModel);
	
	//set default text to the top menu
	this.SetTopMenuText($L("Google Maps"));
	
	//turn back the compass
	this.compassRotate(this.idleCompassDeg);


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
			this.setStatusPanel($L("Setting map type: ") + $L('Roadmap'));
            this.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
            this.maxZoom = 20;
            this.ClearMapType();
            this.ActualMapType[0] = true;
            this.MapCookie.put(MapType);
            google.maps.event.trigger(this.map, "zoom_changed");
            break;
        case 'Hybrid':
			this.setStatusPanel($L("Setting map type: ") + $L('Hybrid'));
            this.map.setMapTypeId(google.maps.MapTypeId.HYBRID);
            this.maxZoom = 20;
            this.ClearMapType();
            this.ActualMapType[1] = true;
            this.MapCookie.put(MapType);
            google.maps.event.trigger(this.map, "zoom_changed");
            break;
        case 'Terrain':
			this.setStatusPanel($L("Setting map type: ") + $L('Terrain'));
            this.map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
            this.maxZoom = 15;
            this.ClearMapType();
            this.ActualMapType[2] = true;
            this.MapCookie.put(MapType);
            google.maps.event.trigger(this.map, "zoom_changed");
            break;
        case 'Satellite':
			this.setStatusPanel($L("Setting map type: ") + $L('Satellite'));
            this.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
            this.maxZoom = 20;
            this.ClearMapType();
            this.ActualMapType[3] = true;
            this.MapCookie.put(MapType);
            google.maps.event.trigger(this.map, "zoom_changed");
            break;
        case 'do-traffic':
            this.Traffic();
        	break;
        case 'do-transit':
            this.Transit();
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
        case 'do-osm':
            this.setStatusPanel($L("Setting map type: ") + $L('Openstreetmaps'));
            this.map.setMapTypeId("OSM");
            this.maxZoom = 18;
            this.ClearMapType();
            this.ActualMapType[4] = true;
            this.MapCookie.put(MapType);
            google.maps.event.trigger(this.map, "zoom_changed");
        	break;
        case 'do-more':
            this.moreMapLayers();
        	break;
      }
},

moreMapLayers: function (event) {
	
	//var near = event.originalEvent && event.originalEvent.target;
          this.controller.popupSubmenu({
			  onChoose:  this.handlePopMapType,
			  popupClass: "pre3maptypemore",
			  placeNear: null,
			  //manualPlacement: true,
			  //placeX: 250,
              //placeY: 200,
			  items: [
				  {secondaryIconPath:'images/OSMlogo.png', label: "OSM " + $L('map'), command: 'do-osm', chosen: this.ActualMapType[4]},
			      {secondaryIconPath:'images/night.png', label: $L('Night'), command: 'do-night', chosen: this.NightVisibile},
			      {secondaryIconPath:'images/transit.png', label: $L('Transit'), command: 'do-transit', chosen: this.TransitVisibile},
			      {secondaryIconPath:'images/bike.png', label: $L('Bike'), command: 'do-bike', chosen: this.BikeVisibile},
			      {secondaryIconPath:'images/weather.png', label: $L('Weather'), command: 'do-weather', chosen: this.WeatherVisibile},
			      {secondaryIconPath:'images/cloud.png', label: $L('Clouds'), command: 'do-cloud', chosen: this.CloudVisibile}
			      
			  ]
			});
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
            this.streetSelect();
            break;
         case 'do-direct':
			this.Directions();
            break;
         case 'do-clearmap':
            this.mapClear();
            this.mapClear(); //ToDo: temporary fix, sometimes one marker persist after map clear, thus I do it twice time
         	break;
      }

	},

activate: function(args) {
	
	//this.Log("*** ACTIVATE *** %j", args);

	this.setViewPortWidth(480);
	
	//unblock the GPS fix updates
	this.blockGPSFix = false;
	
	//start the listener for keypress
    this.controller.listen(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);
          
	   try {
				//update a Preferences variables from Cookies after each activate
				this.Preferences = this.PrefsCookie.get();	
				}
			catch (error) {
				this.Log("Preferences cookie not properly defined", error);
				};
		
				//resize the map after each focus back
				google.maps.event.trigger(this.map, "resize");

		//start handle launch parameters for standard new launch
		if (this.launchParams) {
			this.handleLaunch(this.launchParams);
			this.launchParams = null;
		};

		this.WebOS2Events('start');

		// navrat na stred markeru
		if (args != undefined) {
			//this.Log("*** ACTION IN ACTIVATE ***", args.action);
				switch (args.action) {
	
					case "info":
						this.map.setCenter(args.place.geometry.location);
						this.map.setZoom(17);
						
						//block TP pan
						this.blockTPPan = true;
						
						//unblock the TP pan after 2 seconds
						(function(){
								this.blockTPPan = false;
								
						}).bind(this).delay(2);
						
					break;	
					case "origin":
						this.setViewPortWidth(320);
						this.origin = args.place.geometry.location;
						if (args.place.vicinity != "") {
							this.controller.get("OriginSearchField").value = args.place.name + ", " + args.place.vicinity;
						} else {
							this.controller.get("OriginSearchField").value = args.place.name;
						};
					break;
					case "destination":
						this.setViewPortWidth(320);
						this.destination = args.place.geometry.location;
						if (args.place.vicinity != "") {
							this.controller.get("DestinationSearchField").value = args.place.name + ", " + args.place.vicinity;
						} else {
							this.controller.get("DestinationSearchField").value = args.place.name;
						};
					break;
					case "updatefavorites":
						this.updateFavorites(args);
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
				
	/* Update the markers (deleted, etc..) - perform at each activate */
	this.updateMarkers();
	
	// hide status panel after activate
	this.hideStatusPanel();
},

deactivate: function () {
	
	this.blockGPSFix = true;
	this.setViewPortWidth(320);
	//stop listening to the compass handler on each deactivate
	this.controller.stopListening(document, "compass", this.compassHandler);
	
},

updateFavorites: function(args) {
	
	var markerindex = args.markerindex;
	var othermarker;

	try {
	//Set the apropriate icon for marker
	var icon = (markers[markerindex].place.favorite ? 'images/' + this.ImagePathAdd + 'Map-Marker-Push-Pin-2-Right-Red-icon-fav.png' : 'images/' + this.ImagePathAdd + 'Map-Marker-Push-Pin-2-Right-Red-icon.png');
	
	var image = {
			url: icon,
			size: new google.maps.Size(64*this.ImageRatio, 64*this.ImageRatio),
			origin: new google.maps.Point(0, 0), // origin
			anchor: new google.maps.Point(31*this.ImageRatio, 62*this.ImageRatio), // anchor
			scaledSize: new google.maps.Size(48*this.ImageRatio, 48*this.ImageRatio) //scaled size
		};
		
	markers[markerindex].setIcon(image);

	//create new content of InfoBubble and set them
	var newBubbleContent = '<div id="bubble" class="phoneytext">' + markers[markerindex].place.name + '<div class="phoneytext2">' + markers[markerindex].place.formatted_address + '</div></div>';
	infoBubbles[markerindex].setContent(newBubbleContent);
	} catch (error) {
			//if the refresh fail, place new favorite marker (always if saving nerby as favorite)
			othermarker = this.getMarkerFromID(args.id);
			icon = (othermarker.place.favorite ? 'images/Map-Marker-Push-Pin-2-Right-Red-icon-fav.png' : 'images/Map-Marker-Push-Pin-2-Right-Red-icon.png');
			othermarker.setMap(null);
			for (b=0; b<this.NearbyinfoBubbles.length; b++){
				this.NearbyinfoBubbles[b].close();
			};
			othermarker.place.favorite = true;
			this.PlaceMarker({position: othermarker.place.geometry.location, title: othermarker.place.name, subtitle: othermarker.place.vicinity, place: othermarker.place, icon: 'Map-Marker-Push-Pin-2-Right-Red-icon-fav.png', popbubble: true});
		};	
},

getMarkerFromID: function (id) {
	
	var marker = null;
	
	for (e=0; e<markers.length; e++){
		if (markers[e].place.id == id) {marker = markers[e]};
	};
	
	for (e=0; e<this.Nearbymarkers.length; e++){
		if (this.Nearbymarkers[e].place.id == id) { marker = this.Nearbymarkers[e]};
	};
	
	return marker;
	
},

WebOS2Events: function (action) {

	if (Mojo.Environment.DeviceInfo.platformVersionMajor == "2" && Mojo.Environment.DeviceInfo.platformVersionMinor == "2") {
		this.WebOS22 = true;
	};
		 switch (action) {
         case 'start':
         
         //map_canvas is the common element to listen
         this.ListeningElement = this.controller.get('map_canvas');
         
         //setup dragStart listener      
		 Mojo.Event.listen(this.ListeningElement, Mojo.Event.dragStart, this.DragStartEventHandler);

		 //setup dragging listener
		 Mojo.Event.listen(this.ListeningElement, Mojo.Event.dragging, this.DraggingEventHandler);
		 
		 //setup dragEnd listener
		 Mojo.Event.listen(this.ListeningElement, Mojo.Event.dragEnd, this.DragEndEventHandler);
		 
		 //setup flick listener
		 Mojo.Event.listen(this.ListeningElement, Mojo.Event.flick, this.FlickEventHandler);
		 
		 //start mapTap listener
		 Mojo.Event.listen(this.MapTap, Mojo.Event.tap, this.MapTapEventHandler);

           break;
         case 'stop':
         
		   //stop the dragStart listener
           Mojo.Event.stopListening(this.ListeningElement, Mojo.Event.dragStart, this.DragStartEventHandler);
           
		   //stop the dragging listener
           Mojo.Event.stopListening(this.ListeningElement, Mojo.Event.dragging, this.DraggingEventHandler);
           
           //stop the dragEnd listener
           Mojo.Event.stopListening(this.ListeningElement, Mojo.Event.dragEnd, this.DragEndEventHandler);
           
           //stop the flick listener
           Mojo.Event.stopListening(this.ListeningElement, Mojo.Event.flick, this.FlickEventHandler);
           
           //stop mapTap listener
		   Mojo.Event.stopListening(this.MapTap, Mojo.Event.tap, this.MapTapEventHandler);

		   break;
      };
},

WebOSVersion1: function () {

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
	
		this.wasflicked = false;
		
		// unblock GPS only if the main scene is active
		if (this.controller.stageController.activeScene().sceneName == "main") {
			this.blockGPSFix = false;
			this.blockpulse = false;
		};
		
		//Stop the spinner if it is spinning - at the app start
		if (this.LoadApiModel.spinning) {
			
			this.LoadingSpinner("stop");
			if (this.parsedParams) {
				this.launchParamsAction(this.parsedParams);
				this.parsedParams = null;
			};
		};
		(function(){
					this.ActualCenter = this.map.getCenter();
					this.CenterChanged = true; //for sure if bounds_changed fails, the map was unmovable
				}).bind(this).delay(1);
		
		//hides the status panel when idle
		this.hideStatusPanel();
		
		//check the tilt availability
		var getTilt = this.map.getTilt();
		if (getTilt != this.imagery) {
			this.imagery = getTilt;
			   switch (getTilt) {
					case 0:
						this.ChangeCmdMenu(this.cmdMenuStyle);
						this.imageryHeading = 0;
					break;
					case 45:
						this.ChangeCmdMenu("imagery");
					break;
				};
		};
},

MapTilesLoaded: function () {
	
	this.NewTilesHere = true;
	//this.Log("TILES LOADED: ");
	
	/* refresh the offline cache tiles*/
	//if (this.refreshCache) {
	//	this.refreshTiles();
	//	this.refreshCache = false;
	//};
	//hides the status panel when idle
	this.hideStatusPanel();
	
},

MapCenterChanged: function () {
	
	if (this.TilesContainer) {
	//if (false) {
		/* IMPORTANT: it needs to be ste the container to 0,0 here for invisible transition after translate */
		//this.TilesContainer.style["-webkit-transform"] = "translate(0px,0px)";
		//this.delta = Date.now() - this.setCenterTime;
		//this.Log("DELTA: %j", (Date.now() - this.setCenterTime) );
		if (!this.touch) {
			var Timer = setTimeout(function () {
				//this.TilesContainer.style["-webkit-transform"] = "";
				this.MapScrimContainer.hide();
				this.TrickContainer.style.zIndex="9999";
				this.TrickContainer.innerHTML = "";
				//this.TrickContainer.style["-webkit-transform"] = "translate(" + this.addpanevent.kx + "px," + this.addpanevent.ky + "px)";
				
			}.bind(this), this.trickTime);
		};
	
		this.TilesContainer.style["-webkit-transform"] = "";
				
		/* Elements size stuff */
		if (this.elementsToScale) {
			for (var k = 0; k < this.elementsToScale.length; k++) {
				this.elementsToScale[k].style["-webkit-transform"] = "";
			};
		};
		
		this.TilesContainer = null;
	};
	
	//indicates that the map was moved and allow events in dragging function
	this.CenterChanged = true;
},

hideCommandMenu: function() {

	this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);
},

Resize: function(event) {

  if (this.isTouchPad() && (this.controller.window.innerWidth != this.actualTPwidth)) {
	  //this.Log("** ORIENT CHANGE ***");
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
		this.Log("** OTHER CHANGE ***");
		this.blockTPPan = false;
		(function(){
				this.map.setCenter(this.ActualCenter);
				
			}).bind(this).delay(1);
		};
},

Traffic: function() {

		if (this.TrafficVisibile == false) {
		this.setStatusPanel($L("Show") + " " + $L("Traffic") + "...", 2);
  		this.trafficLayer.setMap(this.map);
  		this.TrafficVisibile = true;
  		this.TrafficCookie.put(false);
  	} else {
		this.setStatusPanel(($L("Hide") + " " + $L("Traffic") + "..."), 2);
  		this.trafficLayer.setMap(null);  //remove traffic layer
  		this.TrafficVisibile = false;
  		this.TrafficCookie.put(true);
  	};

},

Transit: function() {

		if (this.TransitVisibile == false) {
		this.setStatusPanel($L("Show") + " " + $L("Transit") + "...", 2);
  		
  		
  		var transitOptions = {
			getTileUrl: function(coord, zoom) {
			return "http://mt1.google.com/vt/lyrs=m@155076273,transit:comp|vm:&" + "hl=en&opts=r&s=Galil&z=" + zoom + "&x=" + coord.x + "&y=" + coord.y;
			//return "http://mts0.google.com/vt?hl=cs&src=app&lyrs=m@216000000,traffic|seconds_into_week:-1&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&style=2";
			//https://mts0.google.com/vt?hl=cs&src=app&lyrs=m@216000000,traffic|seconds_into_week:-1&x=4422&y=2777&z=13&style=15
			/* style 15 - normalni styl
			 * traffic|seconds.... doprava pro cr
			 * style 2 - velke texty pro vyssi DPI */
			},
			tileSize: new google.maps.Size(256, 256),
			isPng: true
		};

		var transitMapType = new google.maps.ImageMapType(transitOptions);

		this.map.overlayMapTypes.setAt(0, transitMapType);

  		this.TransitVisibile = true;
  		//this.TransitCookie.put(false);
  	} else {
		this.setStatusPanel(($L("Hide") + " " + $L("Transit") + "..."), 2);
  		this.map.overlayMapTypes.setAt(0, null);
  		this.TransitVisibile = false;
  		//this.TransitCookie.put(true);
  	};

},

Bike: function() {

		if (this.BikeVisibile == false) {
		this.setStatusPanel($L("Show") + " " + $L("Bike") + "...", 2);
  		this.bikeLayer.setMap(this.map);
  		this.BikeVisibile = true;
  		this.Preferences.Bike = true;
		this.PrefsCookie.put(this.Preferences);
  	} else {
		this.setStatusPanel($L("Hide") + " " + $L("Bike") + "...", 2);
  		this.bikeLayer.setMap(null);  //remove bike layer
  		this.BikeVisibile = false;
  		this.Preferences.Bike = false;
		this.PrefsCookie.put(this.Preferences);
  	};

},

Weather: function() {

		if (this.WeatherVisibile == false) {
		this.setStatusPanel($L("Show") + " " + $L("Weather") + "...", 2);
		this.weatherLayer.setOptions({
				temperatureUnits: this.getGoogleUnitSystem(this.Preferences.Temperature)
			});
  		this.weatherLayer.setMap(this.map);
  		//the weather is visible only on zoom lower than 12
  		if (this.map.getZoom() > 12) this.map.setZoom(12);
  		this.WeatherVisibile = true;
  		this.Preferences.Weather = true;
		this.PrefsCookie.put(this.Preferences);
  	} else {
		this.setStatusPanel($L("Hide") + " " + $L("Weather") + "...", 2);
  		this.weatherLayer.setMap(null);
  		this.WeatherVisibile = false;
  		this.Preferences.Weather = false;
		this.PrefsCookie.put(this.Preferences);
  	};

},

Cloud: function() {

		if (this.CloudVisibile == false) {
		this.setStatusPanel($L("Show") + " " + $L("Clouds") + "...", 2);
  		this.cloudLayer.setMap(this.map);
  		//the cloud layer is visible only on zoom lower than 6
  		if (this.map.getZoom() > 6) this.map.setZoom(6);
  		this.CloudVisibile = true;
  		this.Preferences.Cloud = true;
		this.PrefsCookie.put(this.Preferences);
  	} else {
		this.setStatusPanel($L("Hide") + " " + $L("Clouds") + "...", 2);
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
		this.setStatusPanel($L("Enable") + " " + $L("Night") + "...", 2);
		this.map.setOptions(options);
  		this.NightVisibile = true;
  		this.Preferences.Night = true;
		this.PrefsCookie.put(this.Preferences);
  	} else {
		options = {
		styles: null
		};
		this.setStatusPanel($L("Disable") + " " + $L("Night") + "...", 2);
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
	
	this.blockGPSFix = true;
	this.setStatusPanel($L("Zooming..."));	
	this.GestureCenter = this.map.getCenter();	
	this.Zooming = true;
	this.previouszoom = this.map.getZoom();
	this.previousScale = e.scale;
	this.previousS = 0;
	
	/* block the pulsation ring */
	$("pulse").hide();
	this.blockpulse = true;
	
	
	this.oldeventg = e;
	
	this.TilesContainer = document.getElementById('map_canvas').firstChild.firstChild;
	this.TilesContainer.style.overflow = "visible !important;";
	this.TilesContainer.style["position"] = "absolute;"
	//this.TilesContainer.style["-webkit-transition"] = "all 0.3s linear";

	this.addpaneventg = [];
	this.addpaneventg.cx = 0;
	this.addpaneventg.cy = 0;
	this.addpaneventg.oldcenter = this.overlay.getProjection().fromLatLngToContainerPixel(this.map.getCenter());
	
	/* get all elements to be not scaled to this.elementsToScale array */
	this.getElementsToScale();
	
},

handleGestureChange: function(e){
	
		e.stop();

		/* ToDo: map rotate upon gesture works... needs to be more tested */
		var rotation = 0;
		

		var rotate = "rotate3d(0,0,1," + rotation.toString() + "deg) ";

		this.TilesContainer.style["-webkit-transform"] = rotate + "scale(" + e.scale + "," + e.scale + ")" + " translate(" + (-this.oldeventg.centerX + e.centerX)/e.scale + "px," + (-this.oldeventg.centerY + e.centerY)/e.scale + "px)";

		this.addpaneventg.cx = this.addpaneventg.oldcenter.x + (this.oldeventg.centerX - e.centerX);
		this.addpaneventg.cy = this.addpaneventg.oldcenter.y + (this.oldeventg.centerY - e.centerY);
		
		/* Infobubbles size stuff */
		for (var k = 0; k < this.elementsToScale.length; k++) {
			this.elementsToScale[k].style["-webkit-transform"] = "scale(" + 1/e.scale + "," + 1/e.scale + ") rotate3d(0,0,1," + (360-rotation).toString() + "deg) ";
		};
		
		//rotation = e.rotation; //uncomment it to map rotate enable
		//this.compassRotate(rotation); //uncomment it to map rotate enable

	 	var s = e.scale;
	 	var z = 0;
	 	
		if (s<=0.187) s = -3;
	 	if (s>0.187 && s<=0.375) s = -2;
	 	if (s>0.375 && s<=0.75) s = -1;
	 	if (s>0.75 && s<=1.5) s = 0;
	 	if (s>1.5 && s<=3) s = 1;
	 	if (s>3 && s<=6) s = 2;
	 	if (s>6) s = 3;
	 	
	 	
	 	
	 	if (this.previousS!=s) {
			this.z = this.previouszoom + s;
			this.previousS = s;
			//z = (s>=0)? s*2 : 1/(Math.abs(s)*2);
			//this.TilesContainer.style["-webkit-transform"] = "scale(" + z + "," + z + ")" + " translate(" + (-this.oldeventg.centerX + e.centerX)/e.scale + "px," + (-this.oldeventg.centerY + e.centerY)/e.scale + "px)";			
		};
		


},
handleGestureEnd: function(e){
	e.stop();
	this.TilesContainer.style["-webkit-transition"] = "";
	
	this.doTrick();
	this.trickTime = 1000;
	
	this.map.setZoom(this.z);	
	var point = new google.maps.Point(this.addpaneventg.cx, this.addpaneventg.cy);
	/** Important, the setCenter here and container to 0,0 at bounds_changed event **/
	this.map.setCenter(this.overlay.getProjection().fromContainerPixelToLatLng(point));
},

doTrick: function() {
	if (!this.touch) { //do the more complicated trick only for non-touch API	
		
			this.TrickContainer = document.getElementById('map_trick_canvas');
			this.MapScrimContainer = document.getElementById('map_scrim');
			this.TrickContainer.innerHTML = this.TilesContainer.innerHTML;
		
			this.TrickContainer.style["-webkit-transform"] = this.TilesContainer.style["-webkit-transform"];
			this.TrickContainer.style.zIndex="10002";
			this.MapScrimContainer.show();
	};
},

orientationChanged: function (orientation) {

	if (this.isTouchPad()) {

		if( orientation == "left" ) {
		  this.restmenuwidth = Mojo.Environment.DeviceInfo.screenWidth - this.widthadd;
		  //this.Log("restmenuwidth left ",  this.restmenuwidth);
	   } else {
		  this.restmenuwidth = Mojo.Environment.DeviceInfo.screenHeight - this.heightadd;
		  //this.Log("restmenuwidth up ",  this.restmenuwidth);
	   };

	    (function(){
				this.map.setCenter(this.ActualCenter);
			}).bind(this).delay(1);



   	} else {

   		google.maps.event.trigger(this.map, "resize");

	this.Log("Orientation changed to: ", orientation);
	   if( orientation === "right" || orientation === "left" ) {
		  this.restmenuwidth = Mojo.Environment.DeviceInfo.screenHeight - this.heightadd;
	   } else {
		  this.restmenuwidth = Mojo.Environment.DeviceInfo.screenWidth - this.widthadd;
	   };
	   this.map.setCenter(this.ActualCenter);
	   
	   //update the list height
	   this.updateDirectListHeight();
	   
	   //resolve an compass orientation	   
	   	switch (orientation) {
         case 'right':
			this.idleNeedleDeg = 360-90;
            break;
         case 'left':
			this.idleNeedleDeg = 90;
            break;
         case 'up':
			this.idleNeedleDeg = 0;
            break;
         case 'down':
			this.idleNeedleDeg = 180;
            break;
      };
	   
   };

   this.feedMenuModel.items[1].items[1].width = this.restmenuwidth;
   this.controller.modelChanged( this.feedMenuModel );

},

getGoogleTiles: function () {
	
/** Commented obsolete code, but still usable if I need to find some elements **/
/*	
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
*/
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
		//this.Log("HIDING: ", elements[a].parentNode.parentNode.innerHTML);
		elements[a].parentNode.parentNode.hide();
	};
},

showElementsByClass: function(nameOfClass) {
	
	var elements = this.getElementsByClass(nameOfClass);
	
	for(var a=0;a<elements.length;a++) {
		//this.Log("SHOWING: ", elements[a].parentNode.parentNode.innerHTML);
		elements[a].parentNode.parentNode.show();
	};
},

dragStart: function(event) {
	
	//this.Log("*** DRAGSTART **** ");
	event.preventDefault();
	
	this.kineting = false;
	
	this.trickTime = 100;
	
	if (!this.dragging) {
		this.dragging = true;
		this.blockGPSFix = true;
		$("pulse").hide();
		this.blockpulse = true;		
	};
	
		
		if(!this.oldevent) {
			this.oldevent = event.down;
		} else {
			this.oldevent.x = this.oldevent.x + event.down.x;
			this.oldevent.y = this.oldevent.y + event.down.y;
			};
		this.CenterChanged = true;

	this.TilesContainer = document.getElementById('map_canvas').firstChild.firstChild;
	this.TilesContainer.style.overflow = "visible !important;";

	this.addpanevent = [];
	this.addpanevent.velocity = [];
	this.addpanevent.cx = 0;
	this.addpanevent.cy = 0;
	this.addpanevent.fx = 0;
	this.addpanevent.fy = 0;
	this.addpanevent.kx = 0;
	this.addpanevent.ky = 0;
	this.addpanevent.sx = 0;
	this.addpanevent.sy = 0;
	
	
	this.addpanevent.timestamp = Date.now();
	this.addpanevent.velocity.x = 0;
	this.addpanevent.velocity.y = 0;
	this.addpanevent.oldcenter = this.overlay.getProjection().fromLatLngToContainerPixel(this.map.getCenter());
	
	this.wasflicked = false;
	
},

dragging: function(event) {
	
		event.preventDefault();
		
		if (!this.TilesContainer) {
			this.TilesContainer = document.getElementById('map_canvas').firstChild.firstChild;
		};
		
		this.addpanevent.cx = this.addpanevent.oldcenter.x + this.oldevent.x - event.move.x;
		this.addpanevent.cy = this.addpanevent.oldcenter.y + this.oldevent.y - event.move.y;
		
		this.addpanevent.kx = -this.oldevent.x + event.move.x;
		this.addpanevent.ky = -this.oldevent.y + event.move.y;
		
		this.TilesContainer.style["-webkit-transform"] = "translate(" + this.addpanevent.kx + "px," + this.addpanevent.ky + "px)";
	
		this.addpanevent.timestamp = (Date.now()+this.addpanevent.timestamp)/2;
},

dragEnd: function(event) {	
	//this.Log("*** DRAGEND **** ");
	
	if (!this.wasflicked) {  //synthetic flick
		var dT = Date.now() - this.addpanevent.timestamp;
		event.velocity = [];
		event.velocity.x = 100*this.addpanevent.kx/dT;
		event.velocity.y = 100*this.addpanevent.ky/dT;
		this.flick(event);
	};
	this.dragging = false;
	
},

flick: function(event) {
	this.wasflicked = true;
	var delta = [];
	this.CenterChanged = false;	
	delta.x = event.velocity.x/10;
	delta.y = event.velocity.y/10;
	this.deltaconstX = delta.x;
	this.deltaconstY = delta.y;
	this.kineting = true;
	this.dragging = false;
	this.kineticMove(delta);
	//Mojo.Event.listen(this.controller.get("map_canvas"), 'mousedown', this.panMousedownHandler);	
	this.timeKinetic = 50;
},

click: function(event) {
//this.Log("*** CLICK **** ");
},

kineticMove: function (velocity) {
	
	//this.Log("*** KINETICMOVE **** ");
	
	if ((Math.abs(velocity.x) > 5 || Math.abs(velocity.y) > 5) && !this.dragging) {
		
		this.moveContainer(this.timeKinetic, velocity);
		this.kineting = true;
		this.oldevent = null;
		
	} else if (!this.dragging){
		
		this.doTrick();
	
			var point = new google.maps.Point(this.addpanevent.cx, this.addpanevent.cy);
			this.setCenterTime = Date.now();
			this.map.setCenter( this.overlay.getProjection().fromContainerPixelToLatLng(point) );
			
			this.oldevent = null;
			
			this.kineting = false;

	};
	
},

moveContainer: function (time, velocity) {
	
	//this.Log("*** MOVECONTAINER **** ");
	try {
		this.TilesContainer.style["-webkit-transform"] = "translate(" + (this.addpanevent.kx + (this.deltaconstX - velocity.x)) + "px," + (this.addpanevent.ky +  (this.deltaconstY - velocity.y)) + "px)";
	} catch (error) {};
	this.addpanevent.cx = this.addpanevent.oldcenter.x - (this.addpanevent.kx + (this.deltaconstX - velocity.x));
	this.addpanevent.cy = this.addpanevent.oldcenter.y - (this.addpanevent.ky + (this.deltaconstY - velocity.y));
	
	this.kineticTimer = setTimeout(function(){
		
		velocity.x = velocity.x/1.6;
		velocity.y = velocity.y/1.6;
		this.kineticMove(velocity);
	}.bind(this), time);

},

panMousedown: function() {
/* unused */	
	var velocity = [];
	velocity.x = 0;
	velocity.y = 0;
	
	Mojo.Event.stopListening(this.controller.get("map_canvas"), 'mousedown', this.panMousedownHandler);
	clearTimeout(this.kineticTimer);
	this.kineticMove(velocity);
	
},

mousedownHandler: function() {
/* unused */
	this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);
	this.hideCommandMenu.bind(this).delay(3);
	//shows the menu everytime when mouse down
},

Search: function(address) {


	this.setViewPortWidth(320);

	this.WebOS2Events('stop');

	//stop listen to keypress
	this.controller.stopListening(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);

	this.searching = true;
	this.IsSet = false;

	/* Hide the menu instead of toggle, fixes the sometimes hidden menu */
	this.controller.setMenuVisible(Mojo.Menu.viewMenu, false);
	this.controller.setMenuVisible(Mojo.Menu.commandMenu, false);

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

SelectedAutocomplete: function (event) {

	//get actual map bounds
	var NorthEast = this.map.getBounds().getNorthEast();
	var SouthWest = this.map.getBounds().getSouthWest();

	this.WebOS2Events('start');

	this.setViewPortWidth(480);

	this.controller.setMenuVisible(Mojo.Menu.viewMenu, true);
	this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);


	$('searchScrim').hide();

	this.searching = false;
	this.IsSet = true;

	// loose focus
	this.controller.get('MainSearchField').blur();

	 var place = this.MainAutocomplete.getPlace();

          try {
            this.map.fitBounds(place.geometry.viewport);
          } catch (error) {
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

		 try {
			 if (this.isTouchPad()) {
				// specify actual center (for TP is this needed)
				this.ActualCenter = place.geometry.location;
				};
				
			  //place marker
			  this.PlaceMarker({position: place.geometry.location, title: place.name, subtitle: address, place: place, popbubble: true});

			  //update the view menu text
			  this.feedMenuModel.items[1].items[1].label = place.name;
			  this.controller.modelChanged(this.feedMenuModel);
			  
			  //start the listener for keypress
			  this.controller.listen(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);
			  
		  } catch (error) { /** Start the nearby text search if the one place search failed **/
			  
				//default radius in meters from actual map bounds
				var radius = Math.round(google.maps.geometry.spherical.computeDistanceBetween(NorthEast, SouthWest)/2);
				var input = place.name;

				if (radius > 50000) {radius = 50000};
					
				//if user write the @, do split to input and radius
				if (place.name.indexOf("@")>-1) {
					var request = place.name.split("@");

					radius = request[1];
					input = request[0];
				}; 
			  this.SearchNearbyPlaces(input, radius);
			};
},

SearchPaste: function(event) {
	
	/* This function fires the autocomplete box 1s after paste a text in search field */
	
	(function(){
				var input = this.controller.get('MainSearchField').value;
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

	
	/* DEPRECATED - new textSearch supports the coordinations directly
	 * 
	if (event.keyCode == Mojo.Char.enter) {
		//this.Log("** ENTER ***");
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
	*/
	
	 if (this.ns.checkTimer) {
                    clearTimeout(this.ns.checkTimer);
				};
              
	this.CheckSearchInput(dropdown, inp);
	
	
},

isThereCoordinates: function(input) {
	
		/** DEPRECATED - No more needed, new textSearch service supports the coordinates **/
		
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
	
	
	//this.Log("** PARTS *** %j", parts);

	try {
		//Recoginze Type 1	
		if (parts[0].indexOf(":")>-1 && parts[1].indexOf(":")>-1 && parts[0].indexOf(".") == -1 && parts[1].indexOf(".") == -1 && parts[0].split(/[NWES]/).length > 1 && parts[1].split(/[NWES]/).length > 1 && parts.length == 2) {
			//this.Log("** TYPE 1 ***");
			lat = this.ConvertDMSToDD(partscomp[0], partscomp[1], partscomp[2].substring(0, partscomp[2].length-1), partscomp[2].substring(partscomp[2].length-1, partscomp[2].length));
			lng = this.ConvertDMSToDD(partscomp[3], partscomp[4], partscomp[5].substring(0, partscomp[5].length-1), partscomp[5].substring(partscomp[5].length-1, partscomp[5].length));		
			latlng = new google.maps.LatLng(lat, lng);
		};
		
		//Recoginze Type 2	
		if (parts[0].indexOf(":")>-1 && parts[1].indexOf(":")>-1 && parts[0].indexOf(".") > -1 && parts[1].indexOf(".") > -1 && parts[0].split(/[NWES]/).length > 1 && parts[1].split(/[NWES]/).length > 1 && parts.length == 2) {
			//this.Log("** TYPE 2 ***");
			lat = this.ConvertDMSToDD(partscomp[0], partscomp[1], partscomp[2].substring(0, partscomp[2].length-1), partscomp[2].substring(partscomp[2].length-1, partscomp[2].length));
			lng = this.ConvertDMSToDD(partscomp[3], partscomp[4], partscomp[5].substring(0, partscomp[5].length-1), partscomp[5].substring(partscomp[5].length-1, partscomp[5].length));		
			latlng = new google.maps.LatLng(lat, lng);
		};
		
		//Recoginze Type 3	
		if (parts[0].indexOf("°")>-1 && parts[1].indexOf("°")>-1 && parts[0].indexOf("'") > -1 && parts[1].indexOf("'") > -1 && parts[0].indexOf('"') > -1 && parts[1].indexOf('"') > -1 && parts[0].split(/[NWES]/).length > 1 && parts[1].split(/[NWES]/).length > 1 && parts.length == 2) {
			//this.Log("** TYPE 3 ***");
			lat = this.ConvertDMSToDD(partscomp[0], partscomp[1], partscomp[2], partscomp[3]);
			lng = this.ConvertDMSToDD(partscomp[4], partscomp[5], partscomp[6], partscomp[7]);		
			latlng = new google.maps.LatLng(lat, lng);
		};
		
		//Recoginze Type 4	
		if (parts[0].indexOf("d") > -1 && parts[1].indexOf("d") > -1 && parts[0].indexOf("°") == -1 && parts[1].indexOf("°") == -1 && parts[0].indexOf("'") > -1 && parts[1].indexOf("'") > -1 && parts[0].indexOf('"') > -1 && parts[1].indexOf('"') > -1 && parts[0].split(/[NWES]/).length > 1 && parts[1].split(/[NWES]/).length > 1 && parts.length == 2) {
			//this.Log("** TYPE 4 ***");
			lat = this.ConvertDMSToDD(partscomp[0].substring(0, partscomp[0].indexOf("d")), partscomp[0].substring(partscomp[0].indexOf("d")+1, partscomp[0].substring(partscomp[0].length-1) ), partscomp[1], partscomp[2]);
			lng = this.ConvertDMSToDD(partscomp[3].substring(0, partscomp[3].indexOf("d")), partscomp[3].substring(partscomp[3].indexOf("d")+1, partscomp[3].substring(partscomp[3].length-1) ), partscomp[4], partscomp[5]);
			latlng = new google.maps.LatLng(lat, lng);
		};
				
		//Recoginze Type 5
		if (parts[0].indexOf(":") == -1 && parts[1].indexOf(":") == -1 && parts[0].indexOf(".")>-1 && parts[1].indexOf(".")>-1 && parts[0].split(/[NWES]/).length > 1 && parts[1].split(/[NWES]/).length > 1 && parts.length == 2) {
			//this.Log("** TYPE 5 ***");
			if (parts[0].indexOf("N") > -1) {lat = parts[0].substring(0, parts[0].length-1);} else {lat = -parts[0].substring(0, parts[0].length-1);};
			if (parts[1].indexOf("E") > -1) {lng = parts[1].substring(0, parts[1].length-1);} else {lng = -parts[1].substring(0, parts[1].length-1);};
			latlng = new google.maps.LatLng(lat, lng);		
		};
		
		//Recoginze Type 6	
		if (parts[0].indexOf("°") == -1 && parts[1].indexOf("°") == -1 && parts[0].indexOf(":") == -1 && parts[1].indexOf(":") == -1 && parts[0].indexOf(".")>-1 && parts[1].indexOf(".")>-1 && parts[0].split(/[NWES]/).length == 1 && parts[1].split(/[NWES]/).length == 1 && parts.length == 2) {
			//this.Log("** TYPE 6 ***");
			latlng = new google.maps.LatLng(parts[0], parts[1]);
		};
		
		//Recoginze Type 7	
		if (parts[0].indexOf("°")>-1 && parts[1].indexOf("°")>-1 && parts[0].indexOf("'") == -1 && parts[1].indexOf("'") == -1 && parts[0].indexOf('"') == -1 && parts[1].indexOf('"') == -1 && parts[0].split(/[NWES]/).length == 1 && parts[1].split(/[NWES]/).length == 1 && parts.length == 2) {
			//this.Log("** TYPE 7 ***");
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
	this.Log("** MARKER DROP ID %j ***", place.id);
	this.Log("** MARKER DROP REFERENCE %j ***", place.reference);
	//place marker
    this.PlaceMarker({position: place.geometry.location, title: this.inputstring, subtitle: subtitle, place: place, action: this.holdaction, popbubble: true});
    this.inputstring = undefined;
    this.holdaction = undefined;
},

CheckSearchInput: function (dropdown, inp) {
	
             	if (document.getElementById('MainSearchField').value == "") {
					dropdown.style.display = 'none';
				};
           
                if (inp && this.ns.checktimes < 20) { // check at most 10 seconds
					if (dropdown.style.display == '') {
						this.ns.checkTimer = null;
						};
					if (inp && dropdown.style.display == 'none' && this.ns.checktimes > 1) {
						dropdown.style.display = 'block';
						dropdown.style.top = "44px";
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

		/* args.position, args.title, args.subtitle, args.place-(everything from autocompleter), args.icon, args.popbubble */
		var ratingcontainer = "";
		if (!args.icon) {args.icon = "Map-Marker-Push-Pin-2-Right-Red-icon.png"}; //default marker icon
		
		var image = {
			url: 'images/' + this.ImagePathAdd + args.icon,
			size: new google.maps.Size(64*this.ImageRatio, 64*this.ImageRatio),
			origin: new google.maps.Point(0, 0), // origin
			anchor: new google.maps.Point(24*this.ImageRatio, 48*this.ImageRatio), // anchor
			scaledSize: new google.maps.Size(48*this.ImageRatio, 48*this.ImageRatio) //scaled size
		};

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
  	
	
	//pan and zoom not for dropped pins and without poping bubble
	if (args.action != "droppin" && args.popbubble) {
		this.map.setZoom(14);
		this.map.setCenter(args.position);
	};
	
	if (place.rating) {
		ratingcontainer = '<div class="rating-container" id="rating-container" style="padding-right: 7px; padding-left: 0px; margin-top: 5px;"><div class="rating_bar"><div id="ratingstar" style="width:' + place.rating*20 + '%"></div></div></div>';
		};	
	args.subtitle = place.vicinity || this.getVicinityFromFormattedAddress(place.formatted_address);
	place.vicinity = place.vicinity || place.formatted_address;
	
 	//--> Define the infoBubble
	var infoBubble = new InfoBubble({
		map: this.map,
		content: '<div id="bubble" class="phoneytext truncating-text">' + '<div class="truncating-text">' + args.title + '</div>' + '<div class="phoneytext2 truncating-text">' + args.subtitle + '</div>' + ratingcontainer + '</div>',
		shadowStyle: 0,
		padding: 0,
		backgroundColor: 'rgb(57,57,57)',
		borderRadius: 4*this.ImageRatio,
		arrowSize: 10*this.ImageRatio,
		borderWidth: 1,
		borderColor: '#2c2c2c',
		disableAutoPan: true,
		hideCloseButton: true,
		arrowPosition: 50,
		backgroundClassName: 'phoney',
		backgroundClassNameClicked: 'phoney-clicked',
		arrowStyle: 2,
		onClick: function(){
			//--> Start the marker bouncing so they know it was clicked
			marker.setAnimation(google.maps.Animation.BOUNCE);
			this.markerBubbleTap({marker: marker, infoBubble: infoBubble, title: args.title, subtitle: args.subtitle, place: place});

			//--> Stop bouncing the marker after 2 second
			(function(){
				marker.setAnimation(null);
			}).bind(this).delay(2);
		}.bind(this)
	});

	// show the bubble after 1 second
	this.MayBubblePop = true;


	
	if (args.popbubble) {
	(function(){
				this.toggleInfoBubble(infoBubble, marker);
			}).bind(this).delay(1);
	};

	//Add it to the array		
	infoBubble.id = place.id; //mark the infoBubble with the same ID as marker for further removing
	marker.place = place; //add place array to the marker, because of pushing to other scenes
	marker.infoBubble = infoBubble; //add infoBubble array to the marker, because of pushing to other scenes
	
	google.maps.event.addListener(marker,"click",this.toggleInfoBubble.bind(this, infoBubble, marker));
	
	//Add it to the array
	infoBubbles.push(infoBubble);
	markers.push(marker);

},

toggleInfoBubble: function(infoBubble, marker){


		(function(){
				this.MayBubblePop = true;
				//this.Log("Delay****");
			}).bind(this).delay(0.5);


		this.Log("You clicked the marker.");
		//--> Now open the bubble
		if (!infoBubble.isOpen() && this.MayBubblePop){
			//--> Clear all info bubbles...
			infoBubble.open(this.map, marker);
			this.MayBubblePop = false;
			this.hideStatusPanel();
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

	for (b=0; b<infoBubbles.length; b++){
		infoBubbles[b].close();
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
	for (b=0; b<infoBubbles.length; b++){
		if (infoBubbles[b].isOpen()){
				infoBubbles[b].close();
				VisibileBubbles.push(infoBubbles[b]);	
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

},

mapClear: function() {
	this.Log("CLEARMAP ");
	//--> Deletes ALL Markers, not favorites
	for (e=0; e<markers.length; e++){
		if (!markers[e].place.favorite) { 
			markers[e].setMap(null);
			markers.remove(e);
		};
	}

	//--> Deletes ALL infoBubbles
	for (e=0; e<infoBubbles.length; e++){
		infoBubbles[e].setMap(null);
	}
	infoBubbles.length = 0;
	//markers.length = 0;

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
	
	// Clear the cluster
	if (this.markerCluster) {
		this.markerCluster.clearMarkers();
	};

	//--> Deletes ALL Markers
	for (e=0; e<this.Nearbymarkers.length; e++){
		this.Nearbymarkers[e].setMap(null);
	}

	//--> Deletes ALL NearbyinfoBubbles
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

	//this.Log("** BACK ***");
	if(this.searching) {

			this.setViewPortWidth(480);
			
			// toggle back the scrim
			$('searchScrim').toggle();

			this.controller.setMenuVisible(Mojo.Menu.viewMenu, true);
			this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);

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
		
			this.setViewPortWidth(480);
			
			try {
				//update directions in infobubbles for alternative routes
				this.updateDirectionsResponse(this.directionsResponse);
			} catch (error) {this.Log(error)};

			$('directionsScrim').toggle();

			this.controller.setMenuVisible(Mojo.Menu.viewMenu, true);
			this.controller.setMenuVisible(Mojo.Menu.commandMenu, true);

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

	// do action only if the pressed key isn`t Escape, Enter, select and meta
	if (event.keyCode != 27 && event.keyCode != 13 && event.keyCode != 129 && event.keyCode != 231 && !this.debug) {
		this.controller.stopListening(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);
		this.KeyWasPressed = true;
		this.Search();
		this.controller.get('MainSearchField').blur();
		this.controller.get('MainSearchField').focus();
		
	} else {
		
		};
},

Directions: function (route) {

	this.setViewPortWidth(320);
	this.WebOS2Events('stop');
	
	this.KeyWasPressed = true;
	//stop listen to keypress
	this.controller.stopListening(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);
    
    //get actual time for transit options       
    this.transitTime = new Date();
    this.setTransitDatePickers(this.transitTime);
       
	this.directing = true;
	this.IsSet = false;
	this.controller.toggleMenuVisible(Mojo.Menu.viewMenu);
	this.controller.toggleMenuVisible(Mojo.Menu.commandMenu);
	$('directionsScrim').toggle();
	
	if (this.TravelMode == undefined) {
		this.travel = google.maps.DirectionsTravelMode.DRIVING;
		this.TravelMode = "driving";
		$('TransitOptions').hide();
		$('DriveOptions').show();
	};

	if (this.GPSFix && !this.firstinsertposition) {
		this.firstinsertposition = true;
		this.origin = this.MyLocation;
		// fill the origin field with MyLocation
		this.controller.get("OriginSearchField").value = $L("My Location");
		this.controller.get('DestinationSearchField').focus();
	} else if (this.controller.get('OriginSearchField').value == "") {
		this.controller.get('OriginSearchField').focus();
	};

	try {
		if (route.endAddress) {
					this.controller.get('DestinationSearchField').value = route.endAddress;
					route.endAddress = null;
		};
		if (route.startAddress) {
					this.controller.get('OriginSearchField').value = route.startAddress;
					route.startAddress = null;
			};
	} catch (error) {};
	
	//update the list height
    this.updateDirectListHeight();

},

DirectType: function (event) {
	
	this.TravelMode = event.value;

	switch (event.value) {
         case 'driving':
           this.travel = google.maps.DirectionsTravelMode.DRIVING;
           $('TransitOptions').hide();
           $('DriveOptions').show();
           break;
         case 'walking':
          this.travel = google.maps.DirectionsTravelMode.WALKING;
          $('TransitOptions').hide();
          $('DriveOptions').hide();
          break;
         case 'bicycling':
           this.travel = google.maps.DirectionsTravelMode.BICYCLING;
           $('TransitOptions').hide();
           $('DriveOptions').hide();
           break;
         case 'transit':
           this.travel = google.maps.DirectionsTravelMode.TRANSIT;
           $('DriveOptions').hide();
           $('TransitOptions').show();
           break;
      };
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
		
	  //reset the route index to the first route
      this.routeIndex = 0;
      
      /** Set the transit options **/

      switch (this.TransitWhichTime) {
         case 'departure':
           this.transitOptions = {
				departureTime: new Date(this.transitTime.getTime())
		   };
           break;
         case 'arrival':
          this.transitOptions = {
				arrivalTime: new Date(this.transitTime.getTime())
		   };
          break;
      };
     
  		var request = {
          origin: this.origin,
          destination: this.destination,
          unitSystem: this.getGoogleUnitSystem(this.Preferences.LengthUnits),
          provideRouteAlternatives: this.routeAlternatives,
          durationInTraffic: true,
          avoidHighways: this.avoidHighways,
		  avoidTolls: this.avoidTolls,
		  transitOptions: this.transitOptions,
          travelMode: this.travel,
        };
        this.directionsService.route(request, function(response, status) {

          if (status == google.maps.DirectionsStatus.OK) {
			  this.IsRouted(true);
			  //this.Log("** RESPONSE1 ***");
			  this.clearDirectPoints();
			  
			  if (this.WebOSVersion1()) {
			  //if (true) {
					response = this.makeFriendly145withmarkers(response); //change the response to WebOS 1.4.5 readable
			  };
			  
			  this.directionsResponse = response;

			  this.DirectionMarkers({start: this.origin, end: this.destination, start_title: response.routes[this.routeIndex].legs[0].start_address, end_title: response.routes[this.routeIndex].legs[0].end_address});

			 this.ChangeCmdMenu("directions");
			 // hides the scrim
			 this.MapIdle();

             this.directionsDisplay.setDirections(response);
             this.directionsDisplay.setMap(this.map);
             this.routeIndex = this.directionsDisplay.getRouteIndex();
             this.makeDirectMarkers(response);
             this.SetTopMenuText(response.routes[this.routeIndex].legs[0].distance.text + "; " + response.routes[this.routeIndex].legs[0].duration.text);

          } else { 
					//Mojo.Controller.errorDialog($L("No route"));
					Mojo.Controller.errorDialog($L(status));
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

/* make direction result friendly for WebOS 1.4.5 */

/** The API returns in directions result object some locations in webOS 1.x not as LatLng object, but only in single set of lat and lng fields, 
 * but directions renderer require a LatLng object. This function reads the single lat and lng fields and create LatLng objects to
 * the same position in directionresults **/
 

for (var routes = 0; routes < directionResult.routes.length; routes++) {

	  //start and end location of the leg

	  directionResult.routes[routes].legs[0].start_location = new google.maps.LatLng(directionResult.routes[routes].legs[0].start_location.lat, directionResult.routes[routes].legs[0].start_location.lng);
	  directionResult.routes[routes].legs[0].end_location = new google.maps.LatLng(directionResult.routes[routes].legs[0].end_location.lat, directionResult.routes[routes].legs[0].end_location.lng);
	  
	  
	   //waypoints
	   /**
	    * it tooks me 2 days to find this damned undocumented property, 
	    * can't understand, why alternative route use waypoints, which are not requested...
	   **/
	   
	   try {
		   
		  directionResult.routes[routes].legs[0].via_waypoint[0].location = new google.maps.LatLng(directionResult.routes[routes].legs[0].via_waypoint[0].location.lat, directionResult.routes[routes].legs[0].via_waypoint[0].location.lng);
		  
		  /** there exists via_waypoints, but does not affect the result **/
		  
		  //newlatlng = new google.maps.LatLng(myRoute.via_waypoints.lat, myRoute.via_waypoints.lng);
		  //directionResult.routes[routes].legs[0].via_waypoints = newlatlng;
		} catch (error) {};

	for (var step = 0; step < directionResult.routes[routes].legs[0].steps.length; step++) { /** bez toho nejdou na webOS 1.4.5 Transit trasy, normalni trasa jde... **/
  
	  directionResult.routes[routes].legs[0].steps[step].start_location = new google.maps.LatLng(directionResult.routes[routes].legs[0].steps[step].start_location.lat, directionResult.routes[routes].legs[0].steps[step].start_location.lng);
	  directionResult.routes[routes].legs[0].steps[step].end_location = new google.maps.LatLng(directionResult.routes[routes].legs[0].steps[step].end_location.lat, directionResult.routes[routes].legs[0].steps[step].end_location.lng);
	  directionResult.routes[routes].legs[0].steps[step].start_point = new google.maps.LatLng(directionResult.routes[routes].legs[0].steps[step].start_point.lat, directionResult.routes[routes].legs[0].steps[step].start_point.lng);
	  directionResult.routes[routes].legs[0].steps[step].end_point = new google.maps.LatLng(directionResult.routes[routes].legs[0].steps[step].end_point.lat, directionResult.routes[routes].legs[0].steps[step].end_point.lng);
	};
  
  
};

  return directionResult;
},

makeDirectMarkers: function (directionResult) {

	this.myRoute = directionResult.routes[this.routeIndex].legs[0];

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
           var markerimage = 'images/bubble/' + this.ImagePathAdd + 'flagA.png';
           var size = 48*this.ImageRatio;
           var anchor = [Math.round(23*this.ImageRatio),46*this.ImageRatio];
           break;
         case 'end':
          var markerimage = 'images/bubble/' + this.ImagePathAdd + 'flagB.png';
          var size = 48*this.ImageRatio;
          var anchor = [Math.round(23*this.ImageRatio),46*this.ImageRatio];
          break;
         case 'point':
           var markerimage = 'images/bubble/point.png';
           var size = 14;
           var anchor = [7,7];
           break;
      };

		var image = {
			url: markerimage,
			size: new google.maps.Size(size, size),
			origin: new google.maps.Point(0, 0), // origin
			anchor: new google.maps.Point(anchor[0], anchor[1]), // anchor
			scaledSize: new google.maps.Size(size, size) //scaled size
		};

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
		shadowStyle: 0,
		padding: 0,
		backgroundColor: 'rgb(57,57,57)',
		borderRadius: 4*this.ImageRatio,
		arrowSize: 10*this.ImageRatio,
		borderWidth: 1,
		borderColor: '#2c2c2c',
		disableAutoPan: false,
		hideCloseButton: true,
		arrowPosition: 50,
		backgroundClassName: 'phoney',
		backgroundClassNameClicked: 'phoney-clicked',
		arrowStyle: 2,
		onClick: function(){
			//Show directions panel on the bubble tap
			this.Directions();
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
	this.Log("**** Navit installed ****", this.isNavit);
	if (this.isNavit || this.debug) {
    this.controller.popupSubmenu({
		onChoose:  this.handlemarkerBubbleTap,
		popupClass: "pre3markerpopup",
		placeNear: near,
		items: [
			{iconPath:'images/bubble/info.png',label: $L('Info'), command: 'do-marker-info'},
			{iconPath:'images/street.png', label: $L('Street View'), command: 'do-street'},
			{iconPath:'images/bubble/flagA.png', label: $L('Route from here'), command: 'do-origin'},
			{iconPath:'images/bubble/flagB.png', label: $L('Route to here'), command: 'do-destination'},
			{iconPath:'images/navit_icon.png', label: $L('Route with Navit'), command: 'do-navit'},
			{iconPath:'images/bubble/delete.png', label: $L('Remove'), command: 'do-marker-remove'},
		]
	});
	} else {
	this.controller.popupSubmenu({
		onChoose:  this.handlemarkerBubbleTap,
		popupClass: "pre3markerpopup",
		placeNear: near,
		items: [
			{iconPath:'images/bubble/info.png',label: $L('Info'), command: 'do-marker-info'},
			{iconPath:'images/street.png', label: $L('Street View'), command: 'do-street'},
			{iconPath:'images/bubble/flagA.png', label: $L('Route from here'), command: 'do-origin'},
			{iconPath:'images/bubble/flagB.png', label: $L('Route to here'), command: 'do-destination'},
			{iconPath:'images/bubble/delete.png', label: $L('Remove'), command: 'do-marker-remove'},
		]
	});
	};


},

handlemarkerBubbleTap: function (command) {

	      switch (command) {
         case 'do-street':
			this.setStatusPanel($L("Loading StreetView..."));
            this.StreetView(this.clickedMarker.marker.getPosition());
            break;
         case 'do-marker-info':
			this.setStatusPanel($L("Loading marker info..."));
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
         case 'do-navit':
			this.openNavit(this.clickedMarker);
         	break;
         case 'do-marker-remove':
			this.markerRemove(this.clickedMarker);
         	break;
      }
},

openNavit: function(marker){
		
			this.setStatusPanel($L("Launching Navit..."), 5);
        	var name = marker.place.name;
        	var route = 1;
        	var pos = marker.marker.getPosition();

        	var lat = JSON.stringify(pos.lat());
        	var lng = JSON.stringify(pos.lng());
      	
        	lat = lat.substring(0, lat.indexOf(".")+5);
        	lng = lng.substring(0, lng.indexOf(".")+5);
        	
        	//Route to or show position?
			if (route=="0"){ //show on map
				stFile='/media/internal/appdata/org.webosinternals.navit/command.txt';
				stText='navit.pitch=0;navit.tracking=0;navit.follow_cursor=0;navit.set_center("' + lng + " " + lat + '");';
				writeMode=false;
			} else { //route to target
				stFile='/media/internal/appdata/org.webosinternals.navit/command.txt';
				stText='navit.set_destination(\"' + lng + " " + lat + '\",\"' + name + '\");';
				writeMode=false;
			};
			
 			Mojo.Log.info("Opening Navit adr:%s lng:%s lat:%s type:%s", name, lng, lat, route);
 			
 			this.request = new Mojo.Service.Request('palm://ca.canucksoftware.filemgr', {
			method: 'write',
			parameters: {
			file: stFile,
			str: stText,
			append: writeMode
				},
				onSuccess:	function(payload) {
							new Mojo.Service.Request('palm://com.palm.applicationManager', {
								method: 'open',
								parameters: {
									id: 'org.webosinternals.navit',
									params: {}
								}
							});
							delete this.request;
						}.bind(this),
				onFailure:	function(err) {
							delete this.request;
							this.Log('Set destination failed');
							Mojo.Controller.errorDialog('Set destination failed');
						}.bind(this)
			});
},

markerRemove: function (markertoremove) {
	
	//hide them on map
	markertoremove.marker.setMap(null);
		
	//remove from markers array
	for (e=0; e<markers.length; e++){
		if (markertoremove.marker.place.id == markers[e].place.id) {
					//this.Log("Removing marker from array: ", e);
					markers.remove(e);	
				};
	};
	
	//remove from nearbymarkers array
	for (e=0; e<this.Nearbymarkers.length; e++){
		if (markertoremove.marker.place.id == this.Nearbymarkers[e].place.id) {
					//this.Log("Removing marker from array: ", e);
					this.Nearbymarkers.remove(e);	
				};
	};
	
	if (markertoremove.infoBubble) {
		//hide them on map
		markertoremove.infoBubble.setMap(null);
		
		for (e=0; e<infoBubbles.length; e++){
				if (markertoremove.marker.place.id == infoBubbles[e].id) {
						//this.Log("Removing infoBubble from array: ", e);
						infoBubbles.remove(e);	
					};
		};
	};
	
	//remove from favorites
	if (markertoremove.marker.place.favorite) {
		for (var i = 0; i < Favorites.length; i++) {
			if (markertoremove.marker.place.id == Favorites[i].id) {
					//this.Log("Removing marker from favorites: ", i);
					Favorites.remove(i);
					this.addToFavorites(Favorites);				
				};
			};
	};
},

markerInfo: function (marker) {
	
	//stop listen to keypress
	this.controller.stopListening(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);
	
	if (marker.place.reference)	{		
	var request = {
		reference: marker.place.reference
	};
	//this.Log("** MARKER REFERENCE %j ***", marker.place.reference);
	this.InfoService = new google.maps.places.PlacesService(this.map);
	this.InfoService.getDetails(request, function(place, status) {
			//this.Log("** INFOSERVICE STATUS %j ***", status);
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				//save favorite mark to result if is favorite
				if (marker.place.favorite) place.favorite = marker.place.favorite;
				place.id = marker.place.id; //set the id always from previous marker
				place.geometry.location = marker.place.geometry.location; //just for sure, sometimes wrong infoservice results causes wrong coordinates
				place.name = marker.place.name; //store the name the same in whole app
				//use the longest (best) address
				try {
					if (place.formatted_address.length > marker.place.formatted_address.length) {
						place.formatted_address = marker.place.formatted_address;
						};
				} catch (error) {};
				this.controller.stageController.pushScene({'name': 'marker-info', transition: Mojo.Transition.none}, place);
				//this.Log("** ADRESA RESULT ***", place.favorite);
			} else if (marker.place.geometry.location) {
				//if getDetails failed (usually due to missing reference for dropped pins)
				this.controller.stageController.pushScene({'name': 'marker-info', transition: Mojo.Transition.none}, marker.place);				
			}
		}.bind(this));
	} else {
		/* Place without reference is usually dropped pin */
		this.controller.stageController.pushScene({'name': 'marker-info', transition: Mojo.Transition.none}, marker.place);
	};

},

ChangeCmdMenu: function(action) {

switch (action) {
	case "directions":
    	this.cmdMenuModel.items[1].items = [
			{icon:'back', command:'back-step', disabled: true},		
			{label: $L('Minus'), iconPath:'images/zoomout.png', command:'zoomOut'},
            {label: $L(''), iconPath:'images/list-view-icon.png', command:'PopMenu'},
            {label: $L('Plus'), iconPath:'images/zoomin.png', command:'zoomIn'},
            {icon:'forward', command:'forward-step'}	
			];
        this.controller.modelChanged( this.cmdMenuModel );
        this.MayBubblePop = true;
        this.toggleDirectInfoBubble(this.DirectinfoBubbles[0], this.Directmarkers[0]);
        this.cmdMenuStyle = action;
	break;
	case "normal":
		this.cmdMenuModel.items[1].items = [
			{label: $L('Minus'), iconPath:'images/zoomout.png', command:'zoomOut'},
            {label: $L(''), iconPath:'images/list-view-icon.png', command:'PopMenu'},
            {label: $L('Plus'), iconPath:'images/zoomin.png', command:'zoomIn'}
            ];
		this.controller.modelChanged( this.cmdMenuModel );
		this.cmdMenuStyle = action;
	break;
	case "imagery":
		this.cmdMenuModel.items[1].items = [
			{label: $L('Minus'), iconPath:'images/zoomout.png', command:'zoomOut'},
            {label: $L(''), iconPath:'images/list-view-icon.png', command:'PopMenu'},
            {icon:'refresh', command:'imagery-rotate'},
            {label: $L('Plus'), iconPath:'images/zoomin.png', command:'zoomIn'}
            ];
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
					this.cmdMenuModel.items[1].items[0].disabled = true;
					this.cmdMenuModel.items[1].items[4].disabled = false;
					this.controller.modelChanged( this.cmdMenuModel );
					break;
				case 1:
					this.cmdMenuModel.items[1].items[0].disabled = false;
					this.cmdMenuModel.items[1].items[4].disabled = false;
					this.controller.modelChanged( this.cmdMenuModel );
					break;
				case this.myRoute.steps.length - 2:
					this.cmdMenuModel.items[1].items[0].disabled = false;
					this.cmdMenuModel.items[1].items[4].disabled = false;
					this.controller.modelChanged( this.cmdMenuModel );
					break;
				case this.myRoute.steps.length - 1:
					this.cmdMenuModel.items[1].items[0].disabled = false;
					this.cmdMenuModel.items[1].items[4].disabled = true;
					this.controller.modelChanged( this.cmdMenuModel );
					break;
			};

},

MapHeadingRotate: function(gps) {
	
	var heading = -gps.heading;
	var translateY;
	
	//var allowrotate = true;
	if (this.NewTilesHere) {
		this.ContainerToRotate = document.getElementById('map_canvas').firstChild.firstChild;
		this.getElementsToScale(); //gets the TilesContainer too
		this.NewTilesHere = false;
		//define animations
		//this.ContainerToRotate.style["-webkit-transition"] = "-webkit-transform 1s linear";
	};
	 
     if (this.previousheading != undefined && heading !=0) {
		  heading = (heading + this.previousheading)/2;
		 };
		 
	 if(heading > 360) {
			heading = heading - 360;
		};
	
	/* velocity higher than 10km/h moves the map center to more bottom, under 30km/h is near bottom */
	if (gps.velocity > 8.3) { 
		translateY = 100*this.ScreenRoughRatio;
	} else if (2.8 <= gps.velocity <= 8.3) {
		translateY = ((gps.velocity/0.083)*this.ScreenRoughRatio);
	} else {
		translateY = 0;
		};

	/** ToDo: the animations freezes my Pre3 - works well in emulator only **/


	this.ContainerToRotate.style["-webkit-transform"] = "translateY(" + translateY + "px) rotate3d(0,0,1," + heading.toString() + "deg)";
	this.ContainerToRotate.style.overflow = "visible !important;";

	
	/* Other elements anti-rotate stuff */
	for (var k = 0; k < this.elementsToScale.length; k++) {
		//this.elementsToScale[k].style["-webkit-transition"] = "-webkit-transform 1s linear";
		this.elementsToScale[k].style["-webkit-transform"] = "rotate3d(0,0,1," + (-heading).toString() + "deg) ";
		
	};
	
	this.compassRotate(heading);
	
	this.previousheading = heading;

},

compassRotate: function (deg) {
	
	/* rotate the compass rose */
	
	//var scale = this.compassactive ? 1 : 0.5;
	//var translate = this.compassactive ? 0 : 80;
	//var translate = 40;
	
	$("compass_rotate").style["-webkit-transform"] = "rotate3d(0,0,1," + deg.toString() + "deg) ";
	
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

	//this.Log("** LOCATION *** %j", location1);

	var lat1 = location1.lat();
	var lon1 = location1.lng();
	var lat2 = location2.lat();
	var lon2 = location2.lng();
	
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
    location: this.map.getCenter(), //search from actual map center
    radius: radius,
    //rankBy: google.maps.places.RankBy.DISTANCE,
    //types: ['store']
    query: keyword
  };

this.NearbyService = new google.maps.places.PlacesService(this.map);

this.NearbyService.textSearch(request, function(results, status) {
			
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				if (results.length > 1) { //More than one marker
				
					//update the view menu text
					this.feedMenuModel.items[1].items[1].label = request.query + $L(" within ") + request.radius + $L("m"); 
					this.controller.modelChanged(this.feedMenuModel);
			  
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
					
					//Add markers to the cluster
					this.markerCluster = new MarkerClusterer(this.map, this.Nearbymarkers);
				  
				} else if (results.length == 1){ //Only one marker to place
				
					this.PlaceMarker({position: results[0].geometry.location, title: results[0].name, subtitle: results[0].formatted_address, place: results[0], popbubble: true});
					//update the view menu text
					this.feedMenuModel.items[1].items[1].label = results[0].name;
				};

			} else {
				this.ShowInfoDialog('"' + request.query + '"' + $L(" not found!"), $L(status + "_NEARBY"), $L("OK"));
			};
		}.bind(this));
		
		//start the listener for keypress
	    this.controller.listen(this.controller.stageController.document, 'keydown', this.KeypresseventHandler);

},

PlaceNearbyMarker: function(place) {
	
        var placeLoc = place.geometry.location;
		var image = {
			url: 'images/' + this.ImagePathAdd + 'MapMarker_Ball__Red.png',
			size: new google.maps.Size(48*this.ImageRatio, 48*this.ImageRatio),
			origin: new google.maps.Point(0, 0), // origin
			anchor: new google.maps.Point(23*this.ImageRatio, 47*this.ImageRatio), // anchor
			scaledSize: new google.maps.Size(48*this.ImageRatio, 48*this.ImageRatio) //scaled size
		};
		
        var marker = new google.maps.Marker({
          map: this.map,
          icon: image,
          optimized: this.optimizedmarkers, //webos 2.2 devices need it, because of click event fire Google API bug!
          animation: google.maps.Animation.DROP,
          position: place.geometry.location
		});

	//variable to identify if the bubble for this place is created
	place.infoBubble = undefined;
	
	google.maps.event.addListener(marker,"click",this.toggleNearbyInfoBubble.bind(this, marker, place));

	this.MayNearbyBubblePop = true;

	//Add it to the array		
	marker.place = place; //add place array to the marker, because of pushing to other scenes
	marker.place.vicinity = marker.place.vicinity || this.getVicinityFromFormattedAddress(marker.place.formatted_address); //if the vicinity isn't available, set vicinity as address
	
	this.Nearbymarkers.push(marker);

},

toggleNearbyInfoBubble: function(marker, place){

		(function(){
				this.MayNearbyBubblePop = true;
			}).bind(this).delay(0.5);

//add calculated distance information to each poi infobubble
var formateddistance = "<div class='phoneytext2'>(" + (place.distance/1000).toFixed(2) + "km) </div>";

if (place.rating) {
	var formateddistance = "<div class='phoneytext2' style='height: 18px; margin-top: 7px;'>(" + (place.distance/1000).toFixed(2) + "km) </div>";
	var ratingcontainer = '<div class="rating-container" id="rating-container" style="padding-right: 7px; padding-left: 0px; margin-top: 5px; float:left;"><div class="rating_bar"><div id="ratingstar" style="width:' + place.rating*20 + '%"></div></div></div>' + formateddistance;
} else {
	var ratingcontainer = formateddistance;
	};

	
			
if (place.infoBubble == undefined) {	
			
		place.vicinity = place.vicinity || this.getVicinityFromFormattedAddress(place.formatted_address);
		var infoBubble = new InfoBubble({
			map: this.map,
			content: '<div id="bubble" class="phoneytext truncating-text">' + '<div class="truncating-text">' + place.name + '</div>' + '<div class="phoneytext2 truncating-text">' + place.vicinity + '</div>' + ratingcontainer + '</div>',
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
		
		//set id to the infoBubble as the place id
		infoBubble.id = place.id;

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
				this.Log("ID:", place.id);
				//this.Log("INDEX bubble:", this.NearbyinfoBubbles.indexOf(place.id));
				
				this.MayNearbyBubblePop = false;
			};
		};

},

getVicinityFromFormattedAddress: function(formatted_address) {
	/* This function removes the country from the end of the string */
	return formatted_address.substring(0,formatted_address.lastIndexOf(","));
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
	for (var i = 0; i < markers.length; i++) {
		markers[i].place.relevance = i;
		markers[i].place.distance = google.maps.geometry.spherical.computeDistanceBetween(this.MyLocation, markers[i].place.geometry.location);
	};
	
	this.MyLocationMarker = [];
	
	this.MyLocationMarker.place = [];
	this.MyLocationMarker.place.geometry = [];
	this.MyLocationMarker.place.geometry.location = this.MyLocation;
	this.MyLocationMarker.place.name = $L("My Location");
	this.MyLocationMarker.place.vicinity = "";

	MarkersArray.action = action;
	
	MarkersArray[0] = this.Nearbymarkers; 		//nearby markers
	MarkersArray[1] = markers; 					//markers - found places
	MarkersArray[2] = this.MyLocationMarker; 	//My Location marker
	MarkersArray[3] = Favorites 				//favorites markers

	
	this.controller.stageController.pushScene({'name': 'markers-list', transition: Mojo.Transition.none}, MarkersArray, this.Preferences, this.gps);
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
        if (results[0]) {
		  this.Log("** ADRESA *** %j", results[0].formatted_address);
		  //force the result to have original coordinates
		  results[0].geometry.location = latlng;
		  //generate random number as ID for dropped markers
		  results[0].id = Math.floor((Math.random()*1000000000000)+1);
		  this.PlaceDroppedPin(results[0]);
          return results[0];
        } else {
          
        }
      } else {
        this.Log("Geocoder failed due to: ", status);
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
	
	this.setStatusPanel($L("Dropping a pin..."));

	var point = new google.maps.Point(event.down.x, event.down.y);
	var taplatlng = this.overlay.getProjection().fromContainerPixelToLatLng(point);
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
			//this.Log("** UNDEFINED PREFERENCE *** %j", Preferences[i]);
			// set undefined prefs to default value
			Preferences[i] = DefaultPreferences[i];
			this.Log("** SET NON EXIST PREFERENCE TO THEIR DEAFULT VALUE *** %j", Preferences[i]);
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
	document.getElementById("RouteAlternativesText").innerHTML = $L("Provide route alternatives");
	document.getElementById("AvoidHighwaysText").innerHTML = $L("Avoid highways");
	document.getElementById("AvoidTollsText").innerHTML = $L("Avoid tolls");
	document.getElementById("TransitDateLabel").innerHTML = $L("Date");
},

setStatusPanel: function (text, delay) {
	
	$("status-panel-text").innerHTML = "";
	$("status-panel-text").innerHTML = text;
	$("status-panel").style['-webkit-transition-duration'] = "0s";
	$("status-panel").addClassName("active");
	try {
	this.controller.get('StatusPanelSpinner').mojo.start();
	} catch (error) {};	
	
	if (delay != undefined && delay > 0) {
		(function(){
			this.hideStatusPanel();
		}).bind(this).delay(delay);
	};
},

hideStatusPanel: function (delay) {
	
		this.controller.get('StatusPanelSpinner').mojo.stop();
		$("status-panel").style['-webkit-transition-duration'] = "1s";
		$("status-panel").removeClassName("active");		
},

OverlayComplete: function () {
	this.Log("** overlay *** %j");
},

getFavorites: function() {
	 this.setStatusPanel($L("Loading Favorites from database..."));
	 db.get("Favorites", this.dbGetOK.bind(this), this.dbGetFail.bind(this))	
},

setFavorites: function(favorites) {
	
	/* This function changes the db stored Favorites to readable format for gAPI */
	var place;
	
	//renew the location data
	for (var i = 0; i < favorites.length; i++) {
		favorites[i].geometry.location = new google.maps.LatLng(favorites[i].geometry.favlat, favorites[i].geometry.favlng);
		this.PlaceMarker({position: favorites[i].geometry.location, title: favorites[i].name, subtitle: favorites[i].formatted_address, place: favorites[i], icon: 'Map-Marker-Push-Pin-2-Right-Red-icon-fav.png', popbubble: false});
	};
	
	//set the Global variable using data from db
	Favorites = favorites;
	
},

dbGetOK: function (favorites) {

	//this.Log("Favorites from db %j ", favorites);
	
	//Hide the status panel only if is it showed because of db
	if ($("status-panel-text").innerHTML == "Loading Favorites from database...") {
		this.hideStatusPanel();
	};
	//this.Log("Favorite database size: " , Object.values(favorites).size());
        if (Object.favorites == "{}" || favorites === null) { 
            Mojo.Log.warn("Retrieved empty or null list from Favorites DB");
        } else {
            this.Log("Retrieved favorites from DB");
            this.setFavorites(favorites);
        };
    //this.Log("Favorites from FAVORITES %j ", Favorites);
},

dbGetFail: function(transaction,result) { 
    Mojo.Log.warn("Database get error (#", result.message, ") - can't save favorites list. Will need to reload on next use."); 
    Mojo.Controller.errorDialog("Database save error (#" + result.message + ") - can't save favorites list. Will need to reload on next use."); 
},

addToFavorites: function() {
	//this.Log("Favorites %j ", Favorites);
    db.add("Favorites", Favorites, this.dbAddOK.bind(this), this.dbAddFail.bind(this));
	
},

dbAddOK: function () {
	this.Log("Favorite saved OK");
},

dbAddFail: function(transaction,result) { 
    Mojo.Log.warn("Database save error (#", result.message, ") - can't save favorites list. Will need to reload on next use."); 
    Mojo.Controller.errorDialog("Database save error (#" + result.message + ") - can't save favorites list. Will need to reload on next use."); 
},

setViewPortWidth: function(width) {


	// do this only for Pre3 device
	if(this.isPre3()){
	if (width == 480) {this.ImageRatio = 1.5} else {this.ImageRatio = 1};
  
		var metatags = document.getElementsByTagName('meta');
		for(cnt = 0; cnt < metatags.length; cnt++) { 
		var element = metatags[cnt];
		if(element.getAttribute('name') == 'viewport') {

		element.setAttribute('content','width='+width+'px; initial-scale=2.0, minimum-scale=1.0, maximum-scale=3.0, user-scalable=yes, height=device-height');
   }
  }
	};
	
},

activateWindow: function(event) {
  this.Log("..................Maximized State");
  this.blockGPSFix = false;
  this.startTracking();
},
deactivateWindow: function(event) {
  this.Log("..................Minimized State");
  this.blockGPSFix = true;
  this.stopTracking();
},

firstGPSfix: function () {
	
		 this.Log("Getting location...");
		 this.firstFixHandle = this.controller.serviceRequest('palm://com.palm.location', {
	     method: 'getCurrentPosition',
	  	 parameters: {
                  maximumAge: 5,
                  accuracy: 3,
			      responseTime: 1
	         },
	 	 onSuccess: this.firstFixSuccess.bind(this),
		 onFailure: function (e){ this.Log("getCurrentPosition failure, results=", JSON.stringify(e)); }
	   });
	
},

startTracking: function() {

	if (!this.trackingHandle) {	//Fixed mem. leaks, start only when not started before
		this.trackingHandle = this.controller.serviceRequest('palm://com.palm.location', {
			method: 'startTracking',
			parameters: {"subscribe":true},
			onSuccess : this.gpsUpdate.bind(this),
			onFailure : function (e){ this.Log("startTracking failure, results=", JSON.stringify(e)); }
		});
	};

},

stopTracking: function() {
	
	if (this.trackingHandle) {
		this.trackingHandle.cancel();
		this.trackingHandle = null;
	};
},

compassTap: function(event) {

	switch ($("compass").className) {
		 case '':
			this.activeCompass();
            break;
         case 'active':
			this.inactiveCompass();
            this.setDefaultMyLocMarker();
            break;	  
         
     };
},

/** ToDo - tap and hold on compass **/

compassTapHold: function(event) {
event.stop();
var near = event.originalEvent && event.originalEvent.target;
	this.controller.popupSubmenu({
	  onChoose:  this.handlecompassTapHold,
	  popupClass: "pre3maptype",
	  placeNear: near,
	  items: [
	      {secondaryIconPath:'', label: $L('Facing cone'), command: ''},
	      {secondaryIconPath:'', label: $L('Rotate map'), command: ''}
	  ]
	});

},

handlecompassTapHold: function() {
	
},

compassHandler: function(event) {
	
	/* if the device has compass, this function is called, this way I can detect the device compass capability
		and store it to the haveCompass variable
	*/
	if (!this.haveCompass) {
		this.initiateCompass();
		this.haveCompass = true;
		this.compassactive = false;
	};
	
	var currHeading = undefined;
	var previousheading;

	currHeading = Math.round(event.magHeading);

	if(currHeading!=undefined && currHeading!=previousheading) {
		if(currHeading > 360) {
			currHeading = currHeading - 360;
		};
		$("needle").style["-webkit-transform"] = "rotate3d(0,0,1,-" + (currHeading + this.idleNeedleDeg) + "deg)";
		if (this.compassactive) {
			this.setScoutMarker(currHeading);
			};
		previousheading = currHeading;		
	};
	
},

initiateCompass: function () {
	this.Log(" ** Compass capable device detected ** ");

	$("compass").show();
	$("compass_rotate").show();
	this.controller.stopListening(document, "compass", this.compassHandler);
},

activeCompass: function () {
	
	this.blockScreenTimeout(true);
	this.controller.listen(document, "compass", this.compassHandler);
	$("compass").addClassName("active");
	$("compass").style["-webkit-transform"] = "scale(1)";
	$("needle").show();
	this.compassactive = true;

},

inactiveCompass: function () {
	
	this.controller.stopListening(document, "compass", this.compassHandler);
	$("compass").removeClassName("active");	
	$("compass").style["-webkit-transform"] = "scale(0.5)";
	$("needle").hide();
	this.blockScreenTimeout(false);
	this.compassactive = false;	
},

setScoutMarker: function (heading) {
	
	/** I can't use sprite, because while map is rotated, the whole sprite is visible... strange, I'm forced to use slower switching between images **/
	/*
	//Use the 0deg sprite as for 360deg
	if (heading > 337.5) heading = 0;
	
	var originX = 1039/(360/heading);
	originX = Math.round(originX/65)*65;
	
	
	var scoutMarker = new google.maps.MarkerImage('images/1.5/sprite-rotation.png',
				new google.maps.Size(65, 65),
				new google.maps.Point(originX, 0), // origin
				new google.maps.Point(32, 32), // anchor
				//new google.maps.Size(49, 49) //Scale to - kdyz neni aktivovano, dela to hranate kolecko na Pre3
				null
	);
	
	this.MyLocMarker.setIcon(scoutMarker);
	*/
	
	if (heading > 337.5) heading = 0;
	
	var originX = 16/(360/heading);
	originX = Math.round(originX);
	originX = String("0" + originX).slice(-2);
	var anchor = Math.round(21*this.ImageRatio);
	var scaledsize = Math.round(42*this.ImageRatio);
	var scoutMarker = {
				url: 'images/1.5/blue_arrow/sprite_rotation' + originX + '.png',
				size: new google.maps.Size(65, 65),
				origin: new google.maps.Point(0, 0), // origin
				anchor: new google.maps.Point(anchor, anchor), // anchor
				scaledSize: new google.maps.Size(scaledsize, scaledsize) //Scale to - kdyz neni aktivovano, dela to hranate kolecko na Pre3
	};
	
	this.MyLocMarker.setIcon(scoutMarker);
	
},

setDefaultMyLocMarker: function () {
	
if(this.isPre3()){
				var image = {
					url: 'images/1.5/blue_dot_on.png',
					size: new google.maps.Size(64, 64),
					origin: new google.maps.Point(0, 0), // origin
					anchor: new google.maps.Point(32, 32), // anchor
					scaledSize: new google.maps.Point(64, 64) //Scale to - kdyz neni aktivovano, dela to hranate kolecko na Pre3
				};
				} else {
				var image = {
					url: 'images/blue_dot_on.png',
					size: new google.maps.Size(42, 42),
					origin: new google.maps.Point(0, 0), // origin
					anchor: new google.maps.Point(21, 21) // anchor
				};
};

this.MyLocMarker.setIcon(image);

},

blockScreenTimeout: function (block) {
	
	this.controller.stageController.window.PalmSystem.setWindowProperties({
		blockScreenTimeout: block
    });
},

pulseDot: function (latlng) {
	/* this function draw a one pulse around a dot */
	
	try {
	
	if (!this.blockpulse) {
	
	var coord = this.overlay.getProjection().fromLatLngToContainerPixel(latlng);
	
	coord.x = Math.round(coord.x-25);
	coord.y = Math.round(coord.y-25);
	//this.Log("COODR: %j", coord);

	//webOS 1.x needs this obsolete syntax
	document.getElementById("pulse").setAttribute("style", "margin: " + coord.y.toString() + "px 0 0 " + coord.x.toString() + "px;");
		
	$("pulse").show();
	
	this.blockpulse = true;
	(function(){
			$("pulse").hide();
			this.blockpulse = false;					
	}).bind(this).delay(2);
	};
	} catch (error) {};
},

TimePickerRadio: function (event) {
	this.TransitWhichTime = event.value;
},

TransitPicker: function (event) {
	var time = new Date(event.value);
	this.transitTime.setHours(time.getHours());
	this.transitTime.setMinutes(time.getMinutes());
	this.transitTime.setSeconds(time.getSeconds());
	this.Log(this.transitTime);
},

pickDateKalendae: function(event) {
	
	event.stop();
	this.controller.get('KalendaeDrawer').mojo.setOpenState(true);

},

handleKalendaeDate: function () {

	var pickedDate = this.kalendae.getSelected();
	var pickedDateAsDates = this.kalendae.getSelectedAsDates();
	this.Log(pickedDate);

	pickedDateAsDates = new Date (pickedDateAsDates);
	this.transitTime.setDate(pickedDateAsDates.getDate());
	this.transitTime.setMonth(pickedDateAsDates.getMonth());
	this.transitTime.setFullYear(pickedDateAsDates.getFullYear());

	this.controller.get('KalendaeDrawer').mojo.setOpenState(false);
	this.setTransitDatePickers(this.transitTime);

},

handleRouteAlternatives: function (event) {
	this.routeAlternatives = event.value;
},

handleAvoidHighways: function (event) {
	this.avoidHighways = event.value;
},

handleAvoidTolls: function (event) {
	this.avoidTolls = event.value;
},

updateDirectionsResponse: function (response) {
	
	if (this.routeIndex != this.directionsDisplay.getRouteIndex()) { /* update the route only if it was switched */
	  //update Route index
      this.routeIndex = this.directionsDisplay.getRouteIndex();
	  this.DirectStep = 0;
	  this.clearDirectPoints();
	  this.DirectionMarkers({start: this.origin, end: this.destination, start_title: response.routes[this.routeIndex].legs[0].start_address, end_title: response.routes[this.routeIndex].legs[0].end_address});
	  this.makeDirectMarkers(response);
	  this.SetTopMenuText(response.routes[this.routeIndex].legs[0].distance.text + "; " + response.routes[this.routeIndex].legs[0].duration.text);
  };
},

setTransitDatePickers: function (date) {
	
	//update text in custom date picker
	$("TransitDateField").innerHTML = date.getDate() + "." + date.getMonth() + "." + date.getFullYear();
	
	//update time in timepicker
	this.TransitDateModel.time = date;
	this.controller.modelChanged(this.TransitDateModel);
},

updateDirectListHeight: function () {
	
	if (this.isTouchPad()) {
	// set height of scroller for TP
	var listheight = Math.round(this.controller.window.innerHeight*0.84) + "px";
	document.getElementById("DirectionsPanelScroller").style.maxHeight = "620px";
	// TP as onlyone WebOS device support optimized markers in newest gAPI v3
	this.optimizedmarkers = true;
} else {
	// set height of scroller depends on device resolution
	var listheight = Math.round(this.controller.window.innerHeight*0.74) + "px";
	document.getElementById("DirectionsPanelScroller").style.maxHeight = listheight;
	document.getElementById("DirectionsOptionsScroller").style.maxHeight = listheight;
	// Older WebOS devices doesn't support optimized markers in newest gAPI v3
	this.optimizedmarkers = false;
	this.Log("INNER HEIGHT ", this.controller.window.innerHeight);
	};
	
},

MapTap: function (event) {

	 switch (event.count) {
        case 1:
			//this.fireTouchOnMap(event);
            break;
        case 2:
			this.setStatusPanel($L("Zooming in..."));
			this.blockGPSFix = true;
			var point = new google.maps.Point(event.down.x, event.down.y);
			var taplatlng = this.overlay.getProjection().fromContainerPixelToLatLng(point);
			this.map.panTo(taplatlng);
			this.map.setZoom(this.map.getZoom() + 1);
            break;
		};
},

handleCmdMenuHold: function () {
	//this.Log("CMD MENU HOLD ");
},

getGoogleUnitSystem: function (units) {
	
	switch (units) {
        case "metric":
            return google.maps.UnitSystem.METRIC;
            break;
        case "imperial":
			return google.maps.UnitSystem.IMPERIAL;
			break;
		case "fahrenheit":
			return google.maps.weather.TemperatureUnit.FAHRENHEIT;
			break;
		case "celsius":
			return google.maps.weather.TemperatureUnit.CELSIUS;
			break;
	};
	
},

getVelocityFromGPS: function (gpsVelocity) {
	
	switch (this.Preferences.LengthUnits) {
        case "metric":
            return Math.round(gpsVelocity*3.6) + " km/h";
            break;
        case "imperial":
			return Math.round(gpsVelocity*2.23693629) + " mph";
			break;
	};
	
},

handleForwardSwipe: function (event) {
	/** ToDo **/
	this.Log("** Forward ***");
},

ShowInfoDialog: function (title, message, label) {
	
	this.controller.showAlertDialog({
	            onChoose: function(value) {
	            },
	            title: title,
	            message: message,
	            choices: [{
	               label: label,
	               value: ""
	            }]
	 });
	        
},

streetLayer: function(action) {

	switch (action) {
        case true:
			var imageMapTypeOptions = {
				getTileUrl: function(coord,zoom){
					  return "https://mts2.google.com/mapslt?lyrs=svv&x=" + coord.x + "&y=" + coord.y + "&z=" + zoom + "&w=256&h=256&hl=en&style=40,18";
			},
			 tileSize: new google.maps.Size(256, 256),
			 isPng: true,
			 opacity: 1
			};
			var tiledImageMap = new google.maps.ImageMapType(imageMapTypeOptions);
			this.map.overlayMapTypes.setAt(2,tiledImageMap);
            break;
            
        case false:
			this.map.overlayMapTypes.setAt(2, null);
			break;
	};	
},

streetSelect: function () {
		
	this.streetLayer(true);	
	this.setStatusPanel($L("Tap on the desired street."));
	this.StreetMapTapEventHandler = this.StreetMapTap.bindAsEventListener(this);
	Mojo.Event.listen(this.MapTap, Mojo.Event.tap, this.StreetMapTapEventHandler);

},

StreetMapTap: function (event) {	 
			var point = new google.maps.Point(event.down.x, event.down.y);
			var taplatlng = this.overlay.getProjection().fromContainerPixelToLatLng(point);
			/* Do the streetview only if the finger not moved more than 5px*/
			if (Math.abs(event.down.x - event.up.x) < 5 && Math.abs(event.down.y - event.up.y) < 5) {
				Mojo.Event.stopListening(this.MapTap, Mojo.Event.tap, this.StreetMapTapEventHandler);
				this.streetLayer(false);
				this.StreetView(taplatlng);
			};
},

updateMarkers: function () {

this.setStatusPanel($L("Updating markers..."));

var markertoremove = [];

	for (var type = 0; type < MarkersArray.length; type++) {
			for (var k = 0; k < MarkersArray[type].length; k++) {
				if (MarkersArray[type][k].tobedeleted == true) {	
					this.Log("REMOVING: %j", MarkersArray[type][k].place.id);
					markertoremove.marker = MarkersArray[type][k];
					markertoremove.infoBubble = MarkersArray[type][k].infoBubble;
					this.markerRemove(markertoremove);
					k = -1; /** k -1 is important: because the markerRemove function shrinks the MarkersArray after removing **/
				};			
			};
	};
	
	/** Close ALL NearbyinfoBubbles - ToDo: delete the right bubble **/
	for (e=0; e<this.NearbyinfoBubbles.length; e++){
		this.NearbyinfoBubbles[e].setMap(null);
	};
	
	this.hideStatusPanel();
},

ImageryRotate: function () {
	this.imageryHeading = this.imageryHeading - 90;
	this.map.setHeading(this.imageryHeading);
},

/** This app is able to resolve all the same cross-app parameters as Bing maps **/

/*
 * query: The query used to search for places or location.
 * address: The address location used to center the map view.
 * location:
 * 			lat: The latitude of the location used to center the map view.
 * 			lng: The longitde of the location used to center the map view.
 * route:
 * 			startAddress: The address of the starting waypoint for a route.
 * 			endAddress:   The address of the ending waypoint for a route.
 * zoom: The zoom level of the map view.
 * mapType: The map type of the map view.  Valid map types are aerial, auto, birdseye, collinsBart, mercator, ordnanceSurvey and road.
 * target: mapto or maploc with address in URL encoded format, e.g. mapto://303%20Second%20Street%2C%20San%20Francisco
 */
 
handleLaunch: function (launchParams) {
	//this.Log("handleLAUNCH: %j", launchParams);
	var parsedParams = {};
	
	try {
		if (launchParams.target) {
			parsedParams = this.parseTargetOrQuery(launchParams);
			this.Log("TARGET: Parsed params: %j", parsedParams);
		};
		
		if (launchParams.query) {
			parsedParams.query = launchParams.query;
			this.Log("QUERY: Parsed params: %j", parsedParams);
		};
		
		if (launchParams.address) {
			parsedParams.address = launchParams.address;
			this.Log("ADDRESS: Parsed params: %j", parsedParams);
		};
		
		if (launchParams.zoom) {
			parsedParams.zoom = launchParams.zoom;
			this.Log("ZOOM: Parsed params: %j", parsedParams);
		};
		
		if (launchParams.mapType) {
			parsedParams.mapType = launchParams.mapType;
			this.Log("MAPTYPE: Parsed params: %j", parsedParams);
		};
		
		if (launchParams.location) {
			parsedParams.location = launchParams.location;
			this.Log("LOCATION: Parsed params: %j", parsedParams);
		};
		
		if (launchParams.route) {
			parsedParams.route = launchParams.route;
			this.Log("ROUTE: Parsed params: %j", parsedParams);
		};
		
		/* If the app is running (spinner is not spinning), go to the launchParamsAction() immediatelly, otherwise wait for mapidle */
		if (this.LoadApiModel.spinning) {
			this.parsedParams = parsedParams; 
		} else {
			this.launchParamsAction(parsedParams);
		};
		
	} catch (error) {
		Mojo.Controller.errorDialog($L("Wrong cross app parameters"));
		this.Log(error);
	};
},

launchParamsAction: function (parsedParams) {
	
	/* Fills the main search field */
	if (parsedParams.address) {
		this.Search(parsedParams.address);
	};
	
	if (parsedParams.route) {
		this.Directions(parsedParams.route);
	};
	
	if (parsedParams.zoom) {
		this.map.setZoom(parsedParams.zoom);
	};
	
	/** ToDo: other launch parameters **/
	
},

parseTargetOrQuery: function (params) {
      var parsedParams = {};
      if (params.query && params.query.match(/@-?\d+\.\d+,-?\d+\.\d+$/)) {  //in case of yelp adding the coords at the end of the request
        var query = params.query;
        parsedParams.query = query.replace(/@-?\d+\.\d+,-?\d+\.\d+$/, '')
      }
      if (params.target) {
        var target = decodeURIComponent(params.target);
        if (target.match(/^mapto:\/*/) && this.Preferences.MaptoOverride) {
            parsedParams.address = target.replace(/^mapto:\/*/, '');
        }
        if (target.match(/^mapto:\/*/) && !this.Preferences.MaptoOverride) {
          parsedParams.route = {
            "startAddress": "",
            "endAddress": target.replace(/^mapto:\/*/, '')
          }
        }
        if (target.match(/^maploc:\/*/)) {
          parsedParams.address = target.replace(/^maploc:\/*/, '');
        }
        if (target.match(/^(http|https):\/\/maps\.google\./i)) {
          var googleurl = new GoogleURL(target);
          if (googleurl.search) {
            parsedParams.query = googleurl.search;
          }
          if (googleurl.coordinates) {
            parsedParams.coordinates = googleurl.coordinates;
          }
          if (googleurl.near) {
            parsedParams.near = googleurl.near;
          }
          if (googleurl.routeRequest) {
            parsedParams.route = {
              "startAddress": googleurl.routeRequest.start,
              "endAddress": googleurl.routeRequest.end
            };
          }
        }
      }
      if (params.route && !params.route.startAddress) {
        parsedParams.route.startAddress = "";
      }
      if (params.route && !params.route.endAddress) {
        parsedParams.route.endAddress = "";
      }
      return parsedParams;
},

getElementsToScale: function () {
	
	/** This function gets all desired and visible elements in TilesContainer who will be rotated or scaled **/

	/* get the TilesContainer */
	this.TilesContainer = document.getElementById('map_canvas').firstChild.firstChild;
	
	/* Infobubble size stuff */
	this.elementsToScale = [];
	this.allInfoBubblesToScale = document.getElementsByClassName("infobubble"); //get all infobubbles elements
	for (var k = 0; k < this.allInfoBubblesToScale.length; k++) {
		if (this.allInfoBubblesToScale[k].style.display != "none") {
			this.allInfoBubblesToScale[k].style["-webkit-transform-origin"]="50% " + (this.allInfoBubblesToScale[k].offsetHeight + (48*this.ImageRatio)) +  "px";
			this.elementsToScale.push(this.allInfoBubblesToScale[k]);
		};
	};
	
	/* No affect the other images size stuff - like markers, points, etc */
	var child = this.TilesContainer.getElementsByTagName('IMG');
	for (var i = 0; i < child.length; i++)
		{		
				if ((child[i].src.indexOf("googleapis") == -1) && (child[i].src.indexOf("maps.") == -1) && (child[i].src.indexOf("openstreetmap.org") == -1) && (child[i].src.indexOf("sprite") == -1) && (child[i].id.indexOf("NoTrans") == -1) && (child[i].src.indexOf("m@155076273,transit") == -1) && (child[i].src.indexOf("blue_dot") == -1))
				{
				  child[i].parentNode.style["overflow"] = "visible !important;";
				  //child[i].style["-webkit-transition"] = "";
				  if ((child[i].src.indexOf("Marker") != -1) || (child[i].src.indexOf("flag") != -1)) { 
					  child[i].style["-webkit-transform-origin"]="50% 100%";
					  };	  
				  this.elementsToScale.push(child[i]);
				};
		};
},

removeTransforms: function () {
	
	/* Remove all transforms from elements array */
	for (var k = 0; k < this.elementsToScale.length; k++) {
		this.elementsToScale[k].style["-webkit-transform"] = "";
		this.elementsToScale[k].style["-webkit-transition"] = "";
	};
	
},

checkNavit: function (path) {

    var xhr = new XMLHttpRequest();

	  xhr.onreadystatechange = 
		function(){
		  if (xhr.readyState == 4){
			if (xhr.status == 200){
				this.isNavit = true;
 				this.Log("**** Navit installed ****");
			  return true;
			}
			else {
			  this.isNavit = false;
			  this.Log("**** Navit is not installed ****");
			}
		  }
		}.bind(this);

	  /* This sane and allowed way how to check the app availability - if exist the navit.xml, probably Navit is installed */
	  xhr.open("HEAD", "/media/internal/appdata/org.webosinternals.navit/navit.xml", true);
	  xhr.send();	  
},

/** HIDDEN EXPERIMENTAL STUFF FROM HERE - ONLY FOR MY DEV. PURPOSES **/

/*****Library – directly change css rule *****/
//Example:changecss('.ClassName','width','280px'); changecss('#IDname','color','red');
changecss: function (theClass,element,value) {
 var cssRules;
 for (var S = 0; S < document.styleSheets.length; S++){
  try{
   document.styleSheets[S].insertRule(theClass+' { '+element+': '+value+'; }',document.styleSheets[S][cssRules].length);
  } catch(err){
   try{document.styleSheets[S].addRule(theClass,element+': '+value+';');
   }catch(err){
    try{
     if (document.styleSheets[S]['rules']) {
      cssRules = 'rules';
     } else if (document.styleSheets[S]['cssRules']) {
      cssRules = 'cssRules';
     } else {
      //no rules found… browser unknown
     }
     for (var R = 0; R < document.styleSheets[S][cssRules].length; R++) {
      if (document.styleSheets[S][cssRules][R].selectorText == theClass) {
       if(document.styleSheets[S][cssRules][R].style[element]){
        document.styleSheets[S][cssRules][R].style[element] = value;
        break;
       }
      }
     }
    } catch (err){}
    }
   }
  }
},
 
fireEnterOnElement: function (element) {
	
	// Create new event
	var e = document.createEvent('KeyboardEvent');
	// Init key event
	e.initKeyboardEvent('keydown', true, true, window, false, false, false, false, "Q", 0);
	// Dispatch event into document
	element.dispatchEvent(e);
},

fireTouchOnMap: function (event) {
	
	try {
		var targetElement = document.elementFromPoint(event.down.x, event.down.y);
		this.Log(targetElement);
		var evt = document.createEvent('UIEvent');
		evt.initUIEvent('touchstart', true, true);

		evt.view = window;
		evt.altKey = false;
		evt.ctrlKey = false;
		evt.shiftKey = false;
		evt.metaKey = false;

		targetElement.dispatchEvent(evt);
	} catch (except){
		this.Log(except);
	}
},

Log: function (logtext, v) {
	
	if (this.debug) Mojo.Log.info(logtext, v);
	
},

Debug: function() {
	//reserved
}

};
