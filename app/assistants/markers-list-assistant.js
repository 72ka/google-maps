function MarkersListAssistant(Markers, Preferences) {
	// place is response from google place service
	this.Preferences = Preferences;
}

MarkersListAssistant.prototype = {
setup: function() {
	
Mojo.Log.info("GLOBAL: %j ", MarkersArray.length);
//setup UI widgets


//set localized text
document.getElementById("TitleText").innerHTML = $L("Markers list");
document.getElementById("LabelMyLocText").innerHTML = $L("My Location");
document.getElementById("LabelNearbyText").innerHTML = $L("Nearby places");
document.getElementById("LabelPlacesText").innerHTML = $L("Places");
document.getElementById("SortedBy").innerHTML = $L("Relevance");

//setup NearbyDrawer collapsible
this.controller.setupWidget("NearbyDrawer",
  this.attributes = {
      modelProperty: 'open',
      unstyled: true
  },
  this.NearbyDrawerModel = {
      open: true
  }
); 

//setup Nearby places collapsible arrow listener
this.NearbyDrawerEventHandler = this.toggleNearbyDrawer.bindAsEventListener(this);
this.NearbyDrawer = this.controller.get('NearbyButArrow');
Mojo.Event.listen(this.NearbyDrawer, Mojo.Event.tap, this.NearbyDrawerEventHandler);

//setup NearbyDrawer collapsible
this.controller.setupWidget("MarkersDrawer",
  this.attributes = {
      modelProperty: 'open',
      unstyled: true
  },
  this.MarkersDrawerModel = {
      open: true
  }
); 

//setup Places collapsible arrow listener
this.MarkersDrawerEventHandler = this.toggleMarkersDrawer.bindAsEventListener(this);
this.MarkersDrawer = this.controller.get('MarkersButArrow');
Mojo.Event.listen(this.MarkersDrawer, Mojo.Event.tap, this.MarkersDrawerEventHandler);


//setup Nearby places list widget
this.controller.setupWidget("NearbyMarkersList",
	{
		itemTemplate: 'markers-list/listentry',
		swipeToDelete: true,
		autoconfirmDelete: true,
        reorderable: false
	},
       this.NearbyListModel = {
		items : [    
				]
  }
);

// setup NearbyMarkersList tap listener
this.NearbyMarkersListEventHandler = this.ListTap.bindAsEventListener(this);
this.NearbyMarkersList = this.controller.get('NearbyMarkersList');
Mojo.Event.listen(this.NearbyMarkersList, Mojo.Event.listTap, this.NearbyMarkersListEventHandler);

//setup NearbyMarkersList delete listener
this.DeleteMarkersListEventHandler = this.MarkersListDelete.bindAsEventListener(this);
Mojo.Event.listen(this.NearbyMarkersList, Mojo.Event.listDelete, this.DeleteMarkersListEventHandler);


//setup Places list widget
this.controller.setupWidget("MarkersList",
	{
		itemTemplate: 'markers-list/listentry',
		swipeToDelete: true,
		autoconfirmDelete: true,
        reorderable: false
		//dividerFunction : this.whatPosition
	},
       this.MarkersListModel = {
		items : [    
				]
  }
);

//setup MarkersList tap listener
this.MarkersListEventHandler = this.ListTap.bindAsEventListener(this);
this.MarkersList = this.controller.get('MarkersList');
Mojo.Event.listen(this.MarkersList, Mojo.Event.listTap, this.MarkersListEventHandler);

//setup MarkersList delete listener
Mojo.Event.listen(this.MarkersList, Mojo.Event.listDelete, this.DeleteMarkersListEventHandler);

//setup Favorites list widget
this.controller.setupWidget("FavoritesList",
	{
		itemTemplate: 'markers-list/listentry',
		swipeToDelete: true,
        reorderable: false
		//dividerFunction : this.whatPosition
	},
       this.FavoritesListModel = {
		items : [    
				]
  }
);

//setup MarkersList tap listener
this.FavoritesListEventHandler = this.ListTap.bindAsEventListener(this);
this.FavoritesList = this.controller.get('FavoritesList');
Mojo.Event.listen(this.FavoritesList, Mojo.Event.listTap, this.FavoritesListEventHandler);

//setup My Location list widget
this.controller.setupWidget("MyLocationList",
	{
		itemTemplate: 'markers-list/listentry',
		//listTemplate: 'home/listcontainer',
		//addItemLabel: 'Add New',
		swipeToDelete: false,
        reorderable: false
		//dividerFunction : this.whatPosition
	},
       this.MyLocationListModel = {
		items : [ 
				{name: $L("My Location"), address: $L("Unknown"), distance: $L("Loc: ") + MarkersArray[2].place.geometry.location, place: MarkersArray[2].place}
				]
  }
);

//setup MyLocation List tap listener
this.MyLocationListEventHandler = this.ListTap.bindAsEventListener(this);
this.MyLocationList = this.controller.get('MyLocationList');
Mojo.Event.listen(this.MyLocationList, Mojo.Event.listTap, this.MyLocationListEventHandler);


//Observe a Share button element in list
//this.ShareHandler = this.Share.bindAsEventListener(this);
//this.controller.get('ShareButton').observe(Mojo.Event.tap, this.ShareHandler);

//setup sort button listener

this.SortButtonEventHandler = this.SortButtonTap.bindAsEventListener(this);
this.SortButton = this.controller.get('SortButton');
Mojo.Event.listen(this.SortButton, Mojo.Event.tap, this.SortButtonEventHandler);

this.SortedBy = "sort-relevance"; //default sort after scene launch

//define variables
this.pop = [];
this.pop.action = null;


//Geocode My Location to address
this.GeocodeFromLatLng(MarkersArray[2].place.geometry.location);	

//Action is passed argument from main assistant, what to do
this.Action = MarkersArray.action;
Mojo.Log.info("** ACTION *** %j", MarkersArray.action);	

//fill the lists
this.UpdateList();

//show containers, that contains markers
if (MarkersArray[0][0]) { $('NearbyContainer').show(); $('SortByContainer').show(); };
if (MarkersArray[1][0]) { $('PlacesContainer').show(); $('SortByContainer').show(); };
  
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

};

		
},
	
handleCommand: function(event) {
                if (event.type === Mojo.Event.command) {
                        if (event.command == 'goBack') {
                        this.controller.stageController.popScene(this.pop);
                        }
                };
                
                //handle Back swipe event   
				if (event.type == Mojo.Event.back) {
					this.controller.stageController.popScene(this.pop);
				};
                

},

SortButtonTap: function(event) {
		
		this.controller.popupSubmenu({
			onChoose:  this.handleSortBy,
			manualPlacement	: true,
			popupClass: "details-sort-selector-popup",
			itemTemplate: 'markers-list/popupentry',
			placeNear: event.target,
			toggleCmd: this.SortedBy,
			items: [
				{label: $L('Sort by:'), command: '', id: "sort-item-first"},
				{label: $L('Relevance'), command: 'sort-relevance'},
				{label: $L('Distance'), command: 'sort-distance'},
				{label: $L('Rating'), command: 'sort-rating'}
			]
		});

},

handleSortBy: function(SortBy) {
	
	
	switch (SortBy) {

        case 'sort-relevance':
			MarkersArray[0].sort(function(a, b){
			 return a.place.relevance - b.place.relevance; //sort ascending
			}.bind(this));
			
			MarkersArray[1].sort(function(a, b){
			 return a.place.relevance - b.place.relevance; //sort ascending
			}.bind(this));  
			 
			this.NearbyListModel.items.clear();
			this.MarkersListModel.items.clear();
			this.UpdateList();
			this.controller.get('SortedBy').update($L("Relevance"));
			this.SortedBy = SortBy;
            break;
        case 'sort-distance':
			MarkersArray[0].sort(function(a, b){
			 return a.place.distance - b.place.distance; //sort ascending
			}.bind(this));
			
			MarkersArray[1].sort(function(a, b){
			 return a.place.distance - b.place.distance; //sort ascending
			}.bind(this));
			
			this.NearbyListModel.items.clear();
			this.MarkersListModel.items.clear();
			this.UpdateList();
			this.controller.get('SortedBy').update($L("Distance"));
			this.SortedBy = SortBy;
            break;
        case 'sort-rating':
			MarkersArray[0].sort(function(a, b){
					 var ratingA = a.place.rating, ratingB = b.place.rating;
					 if (!a.place.rating) {ratingA = 0}; //unrated places will be bottom
					 if (!b.place.rating) {ratingB = 0}; //unrated places will be bottom
					 return ratingB - ratingA; //sort descending
			}.bind(this));
			
			MarkersArray[1].sort(function(a, b){
					 var ratingA = a.place.rating, ratingB = b.place.rating;
					 if (!a.place.rating) {ratingA = 0}; //unrated places will be bottom
					 if (!b.place.rating) {ratingB = 0}; //unrated places will be bottom
					 return ratingB - ratingA; //sort descending
			}.bind(this));
			
			this.NearbyListModel.items.clear();
			this.MarkersListModel.items.clear();
			this.UpdateList();
			this.controller.get('SortedBy').update($L("Rating"));
			this.SortedBy = SortBy;
            break;
      }
	
},

UpdateList: function() {
	
//this.FillFavorites(this.FavoritesListModel);
this.FillIndexList(0, this.NearbyListModel); //Index 0 means Nearby markers
this.controller.modelChanged(this.NearbyListModel);
this.FillIndexList(1, this.MarkersListModel); //Index 1 means Markers
this.controller.modelChanged(this.MarkersListModel);

},

FillFavorites: function (model) {
	
	this.getFromFavDB();
},

FillIndexList: function(index, model) {
	
	var i = 0;
	for (var k = 0; k < MarkersArray[index].length; k++) {
		
		if (MarkersArray[index][k].tobedeleted != true) {	
					
			var ratingElement = '';
			var distanceElement = '';
			var favoriteElement = '';

			if (MarkersArray[index][k].place.rating) {
				ratingElement = '<div class="rating_bar"><div id="ratingstar" style="width: ' + MarkersArray[index][k].place.rating*20 + '%;"></div></div>';
			};
			
			if (MarkersArray[index][k].place.distance) {
				distanceElement = this.getDistanceInCorrectUnits(MarkersArray[index][k].place.distance);
				//distanceElement = (MarkersArray[index][i].place.distance/1000).toFixed(2) + " km ";
			};
			
			if (MarkersArray[index][k].place.favorite) {
				favoriteElement = "<img src='images/star-favorite.png'></img>";
			};
				
			model.items[i] = {name: MarkersArray[index][k].place.name, address: MarkersArray[index][k].place.vicinity, distance: distanceElement, rating: ratingElement, favorite: favoriteElement, place: MarkersArray[index][k].place };
			i++;
		};
	};
	
},

getDistanceInCorrectUnits: function (distance) {
	
	switch (this.Preferences.LengthUnits) {
        case "metric":
            return (distance/1000).toFixed(2) + " km ";
            break;
        case "imperial":
			return (distance*0.000621371192).toFixed(2) + " " + $L("miles") + " ";
			break;
	};
	
},

toggleNearbyDrawer: function(){

this.drawer = this.controller.get('NearbyDrawer');
//this will toggle the drawers state
this.drawer.mojo.setOpenState(!this.drawer.mojo.getOpenState());

if (this.drawer.mojo.getOpenState() == true)
	{
		this.controller.get('NearbyButArrow').removeClassName('palm-arrow-closed').addClassName('palm-arrow-expanded');

	} else {
		
		this.controller.get('NearbyButArrow').removeClassName('palm-arrow-expanded').addClassName('palm-arrow-closed');

	};

},

toggleMarkersDrawer: function(){

this.drawer = this.controller.get('MarkersDrawer');
//this will toggle the drawers state
this.drawer.mojo.setOpenState(!this.drawer.mojo.getOpenState());

if (this.drawer.mojo.getOpenState() == true)
	{
		this.controller.get('MarkersButArrow').removeClassName('palm-arrow-closed').addClassName('palm-arrow-expanded');

	} else {
		
		this.controller.get('MarkersButArrow').removeClassName('palm-arrow-expanded').addClassName('palm-arrow-closed');

	};

},

GeocodeFromLatLng: function(latlng) {
	
	var geocoder = new google.maps.Geocoder();
	
    geocoder.geocode({'latLng': latlng}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
		    this.MyLocationListModel.items[0].address = results[1].formatted_address;
		    //this.MyLocationListModel.items[0].reference = results[1].reference;
		    if (this.WebOSVersion1()) {
				var newlatlng = new google.maps.LatLng(latlng.lat, latlng.lng);
				var LocationString = $L("Loc: ") + newlatlng;
			} else {
				var LocationString = $L("Loc: ") + latlng;
			};
			this.MyLocationListModel.items[0].place.formatted_address = results[1].formatted_address;
			this.MyLocationListModel.items[0].place.geometry.location = latlng;
		    this.MyLocationListModel.items[0].distance = LocationString;
		    
			this.controller.modelChanged(this.MyLocationListModel);
          return results[1];
        } else {
          return false;
        }
      } else {
        Mojo.Log.info("Geocoder failed due to: " + status);
        return false;
      }
    }.bind(this));
	
},

ListTap: function(event) {
	
	// Only respond to clicks on the img icon element, not the row
        if(event.originalEvent.target.tagName == "IMG") {
			this.PlaceToShare = event.item.place;
			//Mojo.Log.info("** PLACE %j ***", event.item.place);
			if (event.item.name == $L("My Location")) {
				this.PlaceToShare.name = $L("My Location");
				this.PlaceToShare.icon = "images/blue_dot.png";
				this.controller.stageController.pushScene({'name': 'marker-info', transition: Mojo.Transition.none}, this.PlaceToShare);
			} else {
				this.PlaceInfo();
			};
			
            
        } else {
			event.item.action = this.Action; //action passed from main and back
			this.controller.stageController.popScene(event.item);
		};
},

PlaceInfo: function () {
	
var marker = [];
marker.place = this.PlaceToShare;
this.controller.stageController.parentSceneAssistant(this).markerInfo(marker);

},

markerInfo: function (place) {

	//var infostring = marker.subtitle + " | Loc: " + marker.marker.getPosition();
	//Mojo.Log.info("** REFERENCE ***", place.reference);
	var request = {
		reference: place.reference
	};

	this.InfoService = new google.maps.places.PlacesService();
	this.InfoService.getDetails(request, function(place, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				//this.result = place;
				//this.controller.stageController.pushScene({'name': 'marker-info', transition: Mojo.Transition.none}, place);
				Mojo.Log.info("** ADRESA RESULT ***", place.formatted_address);
			}
		}.bind(this));

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

activate: function(arg) {
	
		this.pop = arg;
	
		if (arg != undefined) {
				switch (arg.action) {
					case "updatefavorites":
						this.updateFavorites(arg.markerindex);
					break;
				
				};
			
			};
},

updateFavorites: function (markerindex) {
	Mojo.Log.info("** UPDATE FAV ***");
	this.UpdateList();
},

MarkersListDelete: function (event) {
	Mojo.Log.info("** To Be deleted: %j ***", event.item.place.id);	
	for (var type = 0; type < MarkersArray.length; type++) {
			for (var k = 0; k < MarkersArray[type].length; k++) {			
				if (MarkersArray[type][k].place && MarkersArray[type][k].place.id != undefined) {
					if (event.item.place.id == MarkersArray[type][k].place.id) {
						MarkersArray[type][k].tobedeleted = true;
					};
				} else if (MarkersArray[type][k].id != undefined) {
					if (event.item.place.id == MarkersArray[type][k].id) {
						MarkersArray[type][k].tobedeleted = true;
					};
				};			
			};
	};	
},

cleanup: function() {
		
		// Stop all listeners
		Mojo.Event.stopListening(this.NearbyDrawer, Mojo.Event.tap, this.NearbyDrawerEventHandler);
		Mojo.Event.stopListening(this.MarkersDrawer, Mojo.Event.tap, this.MarkersDrawerEventHandler);
		Mojo.Event.stopListening(this.NearbyMarkersList, Mojo.Event.listTap, this.NearbyMarkersListEventHandler);
		Mojo.Event.stopListening(this.MarkersList, Mojo.Event.listTap, this.MarkersListEventHandler);
		Mojo.Event.stopListening(this.MarkersList, Mojo.Event.listDelete, this.DeleteMarkersListEventHandler);
		Mojo.Event.stopListening(this.MyLocationList, Mojo.Event.listTap, this.MyLocationListEventHandler);
		Mojo.Event.stopListening(this.SortButton, Mojo.Event.tap, this.SortButtonEventHandler);
		
	}
};
