function MarkerInfoAssistant(place) {
	// place is response from google place service
	this.place = place;
}

MarkerInfoAssistant.prototype = {
setup: function() {

//setup UI widgets

Mojo.Log.info("ID %j ", this.place.id);

//set localized text
$("DeatilsText").innerHTML = $L("Details");
$("SmallHint").innerHTML = $L("Tap and hold to rename");
$("LabelReviewsText").innerHTML = $L("More details");
$("UserReviewsText").innerHTML = $L("User reviews");


//setup UserReview collapsible
this.controller.setupWidget("UserReviewDrawer",
  this.attributes = {
      modelProperty: 'open',
      unstyled: true
  },
  this.UserReviewDrawerModel = {
      open: true
  }
); 

//setup User reviews collapsible arrow listener
this.UserReviewDrawerEventHandler = this.toggleUserReviewDrawer.bindAsEventListener(this);
this.UserReviewDrawer = this.controller.get('UserReviewButArrow');
Mojo.Event.listen(this.UserReviewDrawer, Mojo.Event.tap, this.UserReviewDrawerEventHandler);


//setup User reviews list widget
this.controller.setupWidget("UserReviewList",
	{
		itemTemplate: 'marker-info/user-review-listentry',
		swipeToDelete: false,
        reorderable: false
	},
       this.UserReviewModel = {
		items : [    
				]
  }
);

//setup Photos collapsible
this.controller.setupWidget("PhotosDrawer",
  this.attributes = {
      modelProperty: 'open',
      unstyled: true
  },
  this.PhotosDrawerModel = {
      open: false
  }
); 

//setup Photos collapsible arrow listener
this.PhotosDrawerEventHandler = this.togglePhotosDrawer.bindAsEventListener(this);
this.PhotosDrawer = this.controller.get('PhotosButArrow');
Mojo.Event.listen(this.PhotosDrawer, Mojo.Event.tap, this.PhotosDrawerEventHandler);

//Observe a Photo for event
this.PhotoTapHandler = this.PhotoTap.bindAsEventListener(this);
this.controller.get('photo').observe(Mojo.Event.tap, this.PhotoTapHandler);

//setup Call button
this.controller.setupWidget("CallButton",
  this.attributes = {
  },
  this.CallButtonModel = {
      label : "",
      disabled: false
  }
);

this.CallButtonEventHandler = this.CallButtonTap.bindAsEventListener(this);
this.CallButton = this.controller.get('CallButton');
Mojo.Event.listen(this.CallButton, Mojo.Event.tap, this.CallButtonEventHandler);

this.controller.setupWidget("name",
  this.attributes = {
      hintText: $L(""),
      multiline: false,
      enterSubmits: false,
      autoFocus: false,
      holdToEdit: true,
      focusMode: Mojo.Widget.focusSelectMode,
      focus: false
  },
  this.nameModel = {
      value: this.place.name,
      disabled: false
  }
); 

this.RenameEventHandler = this.RenameChange.bindAsEventListener(this);
this.Rename = this.controller.get('name');
Mojo.Event.listen(this.Rename, Mojo.Event.propertyChange, this.RenameEventHandler);

if(this.isTouchPad()){

  this.menuModel = {
  visible: true,
  items:  [
      {
          items: [
			  { iconPath: "images/menu-icon-favorites.png", command: "do-favorites"},
              { icon: "back", command: "goBack"},
          ]
      },
      {
          items: [
          ]
      },
      {
          items: [
          	  { icon: "send", command: "share"},
          ]
      }
  ]
};
} else {
	
  this.menuModel = {
  visible: true,
  items: [
      {
          items: [
             { iconPath: "images/menu-icon-favorites.png", command: "do-favorites"},
          ]
      },
      {
          items: [
          ]
      },
      {
          items: [
          	  { icon: "send", command: "share"},
          ]
      }
  ]
};

	
};
this.pop = [];
this.pop.action = null;
this.pop.id = null;
this.openhoursNote = "";

//changes the icon upon favorite or not
this.changeFavIcon(this.place.favorite);


this.controller.setupWidget(Mojo.Menu.commandMenu,
         this.attributes = {
             spacerHeight: 0,
             menuClass: 'no-fade'
         },
         this.menuModel
);

// Show everything available from place on this scene
if (this.place.icon) { $("place-icon").innerHTML = "<img width='48' height='48' src='" + this.place.icon + "'>";  };
//if (this.place.name) { $("name").innerHTML = this.place.name; };
if (this.place.formatted_address) { $("formatted_address").innerHTML = $L("Address") + ":<br>" + this.place.formatted_address; };
$("loc").innerHTML = $L("Loc") + ":<br>" + this.place.geometry.location.toUrlValue(8);
if (this.place.formatted_phone_number) {
	 $("CallButton").show();
	 $("CallButtonLabel").innerHTML = this.place.formatted_phone_number;
	  };
if (this.place.rating) {
	$("rating-container").show();
	$("rating").innerHTML = $L("Rating") + ":<br>" + this.place.rating;
	document.getElementById("ratingstar").style.width = this.place.rating*20 + "%";
	};
	
if (this.place.opening_hours != undefined) {
	
	var d = new Date();
	var n = d.getDay()-1;
	var daynames = [$L("Monday"),$L("Tuesday"),$L("Wednesday"),$L("Thursday"),$L("Friday"),$L("Saturday"),$L("Sunday")]
	$("opening_hours").show();
	$("OpenhoursText").innerHTML = $L("Open hours:");
	this.openhoursNote = $L("Open hours:") + "\n";
	
	/* Fills the open hours week schedule */
	for (day = 0; day < 7; day++){
				  var opennow = (this.place.opening_hours.open_now ? '<font color="green">' : '<font color="red">');
				  var todaybold = ((n==day) ? '<b>' + opennow : '</font>');
				  document.getElementById('nameday'+day).innerHTML = todaybold + daynames[day] + ": " + todaybold;
				  if (this.place.opening_hours.periods[day]) {
						document.getElementById('hoursday'+day).innerHTML = todaybold + this.place.opening_hours.periods[day].open.time.insert(2, ":") + " - " + this.place.opening_hours.periods[day].close.time.insert(2, ":") + todaybold;
						this.openhoursNote = this.openhoursNote + daynames[day] + ": " + this.place.opening_hours.periods[day].open.time.insert(2, ":") + " - " + this.place.opening_hours.periods[day].close.time.insert(2, ":") + "\n";
					} else {
						document.getElementById('hoursday'+day).innerHTML = todaybold + $L("CLOSED") + todaybold;
						this.openhoursNote = this.openhoursNote + daynames[day] + ": " + $L("CLOSED") + "\n";
					};
				  
	};
};
if (this.place.url) { $("url").innerHTML = "<a href='" + this.place.url + "'>" + $L("Show full Google page") + "</a>"; };
if (this.place.website) { $("website").innerHTML = $L("Home page") + ":<br>" + "<a href='" + this.place.website + "'>" + this.place.website + "</a>"; };

//Place photos
if (this.place.photos) {
	$("PhotosContainer").show();
	$("LabelPhotosText").innerHTML = $L("Photos (" + this.place.photos.length + ")");
	
					try {
				//Mojo.Log.info("** PHOTOS getURL %j ***", place.photos[0].getUrl({'maxWidth': 35, 'maxHeight': 35}));
				Mojo.Log.info("** PHOTOS getURL %j ***", place.photos[0]);
				} catch (error) {
					Mojo.Log.info(error);
				};
	
	//var url = this.place.photos[0].getUrl({'maxWidth': 35, 'maxHeight': 35});
	//var url = this.place.photos[0].getUrl();
	//Mojo.Log.info("PHOTOS: %j", url);
	//$("photo").innerHTML = "<img width='" + (this.controller.window.innerWidth - 40) + "' height='" + (this.controller.window.innerWidth/1.33 - 40) + "' src='" + this.place.photos[0].raw_reference.fife_url + "'>";
};

//User reviews

if (this.place.reviews != undefined) {	
	this.FillUserReviewList(this.place.reviews);
	$("UserReviewContainer").show();	
};

		
},

CallButtonTap: function (event) {
	
       this.controller.serviceRequest('palm://com.palm.applicationManager', {
      method:'open',
      parameters: {target: "tel://" + this.place.international_phone_number}
       });
	
},
	
handleCommand: function(event) {
                if (event.type === Mojo.Event.command) {
                        if (event.command == 'goBack') {
                        	this.controller.stageController.popScene(this.pop);
                        }
                          if (event.command == 'share') {
                            this.sharePopUp(event);
                        }
                        if (event.command == 'do-favorites') {
                            this.Favorites(event);
                        }
                };
                
                //handle Back swipe event   
				if (event.type == Mojo.Event.back) {
					this.controller.stageController.popScene(this.pop);
				};
                

},

sharePopUp: function(event) {
	
	var near = event.originalEvent && event.originalEvent.target;
	this.controller.popupSubmenu({
		  onChoose:  this.handleShare,
		  placeNear: near,
		  items: [
		      {iconPath: "images/menu-icon-xapp-mail.png", label: $L('E-mail it'), command: 'email'},
		      {iconPath: "images/menu-icon-xapp-messaging.png", label: $L('Send it'), command: 'sms'},
		      {iconPath: "images/menu-icon-new-contact.png", label: $L('Add to contacts'), command: 'contact'},
		      {iconPath: "images/clipboard-add.png", label: $L('To clipboard'), command: 'clipboard'},
		  ]
		});
},

handleShare: function(share) {
	
	switch (share) {

        case 'email':
            this.sendEmail();
            break;
            
        case 'sms':
            this.sendSMS();
            break;
        case 'contact':
            this.sendToContacts();
            break;
        case 'clipboard':
            this.sendToClipboard();
            break;
		};
},

sendEmail: function () {

var gURL = "";
var website = "";
var phone = "";
var openhoursEmail = new Array();
var openhoursEmailText = "";

var Address = "<br><b>" + $L("Address") + ":</b> " + this.place.formatted_address;
if (this.place.url) gURL = "<br><b>" + $L("Google Maps URL") + ": </b><a href='" + this.place.url + "'>" + this.place.url + "</a>";
if (this.place.website) website = "<br><b>" + $L("Home page") + ":</b> " + "<a href='" + this.place.website + "'>" + this.place.website + "</a>";
if (this.place.formatted_phone_number) phone = "<br><b>" + $L("Phone") + ":</b> " + this.place.formatted_phone_number;
openhoursEmail = this.openhoursNote.split("\n");
openhoursEmailText = "<br><b>" + openhoursEmail[0] + "</b><br>" + openhoursEmail[1] + "<br>" + openhoursEmail[2] + "<br>" + openhoursEmail[3] + "<br>" + openhoursEmail[4] + "<br>" + openhoursEmail[5] + "<br>" + openhoursEmail[6] + "<br>" + openhoursEmail[7] + "<br>";

var EmailText = "<b>" + $L("Name") + ":</b> " + this.place.name + Address + "<br><b>" + $L("Location") + ":</b> " + this.place.geometry.location + gURL + phone + website + openhoursEmailText + "</p><i><h6><font color='grey'>" + $L("-- Sent from") + " <a href='http://www.webosnation.com/google-maps-72ka'>" + $L("homebrew Google Maps</a> application for WebOS") + "</font><h6></i>";
				


this.controller.serviceRequest(
  "palm://com.palm.applicationManager", {
      method: 'open',
      parameters: {
          id: "com.palm.app.email",
          params: {
              summary: this.place.name,
              text: EmailText,
              recipients: [{
                  type:"email",
                  role:1,
                  value:"",
                  contactDisplay:""
              }]
          }
      }
  }
);

},

sendSMS: function () {

var gURL = "";
var website = "";
var phone = "";

if (this.place.url) gURL = " gURL: " + this.place.url;
if (this.place.website) website = " WWW: " + this.place.website;
if (this.place.formatted_phone_number) phone = ", " + $L("Phone") + ": " + this.place.formatted_phone_number;
		
var SMSText = this.place.name + ", " + this.place.formatted_address + " " + $L("Loc: ") + this.place.geometry.location + gURL + phone + website;
				


this.controller.serviceRequest("palm://com.palm.applicationManager", {
             method : 'open',
             parameters: {
            id: 'com.palm.app.messaging',
            params: {
            sms:'',
            messageText: SMSText
         }

             } 

});

},

sendToClipboard: function () {

var gURL = "";
var website = "";
var phone = "";

var Address = ", " + $L("Address") + ": " + this.place.formatted_address;
if (this.place.url) gURL = ", " + $L("Google Maps URL") + ": " + this.place.url;
if (this.place.website) website = ", " + $L("Home page") + ": " + this.place.website;
if (this.place.formatted_phone_number) phone = ", " + $L("Phone") + ": " + this.place.formatted_phone_number;


var CBtext = $L("Name") + ": " + this.place.name + Address + ", " + $L("Location") + ": " + this.place.geometry.location + gURL + phone + website + "\n" + this.openhoursNote;
		
this.controller.stageController.setClipboard(CBtext ,true);

},

sendToContacts: function () {
/* This function is based on "gizmo21" code at Webosnation.com */

//define object for palm contact service
var contact = {
	organizations: { name: this.place.name },
	addresses:
	[{
		type: 'type_work',
		streetAddress: this.place.formatted_address	
	}],
	//note: $L('Added by homebrew Google Maps.')
	note: this.openhoursNote + "\n\n" + $L('Added by homebrew Google Maps.')
};

//add phone number, if we have it
if (this.place.international_phone_number) {
	contact.phoneNumbers = [{
		type:'type_work',
		value: this.place.international_phone_number,
		primary : true
	}];	
};

//add website, if we have it
if (this.place.website) {
	//WebOS 1.x has undocumented and different API
	if (Mojo.Environment.DeviceInfo.platformVersionMajor == "1") {
	contact.urls = [{
		url: this.place.website
	}];	
	} else {
	contact.urls = [{
		value: this.place.website
	}];	
	};
};

//WebOS 1.x has undocumented and different API
if (Mojo.Environment.DeviceInfo.platformVersionMajor == "1") {
	//override the variable for WebOS 1.x readable format
	contact.companyName = this.place.name;
	contact.notes = contact.note;
};

//request a service and push the contact object
this.controller.serviceRequest("palm://com.palm.applicationManager", {
	method: "open",
	parameters: 
	{
		id: "com.palm.app.contacts",
		params: 
	{
		contact: contact,
		launchType: "newContact"
	}
	}
});	

},

Favorites: function() {
	
	this.pop.action = "updatefavorites";
	this.pop.id = this.place.id;
	
	Mojo.Log.info("ID %j ", this.place.id);
	
	
	if (!this.place.favorite) {
		//add to Favorites
		Favorites.push(this.place);
		this.place.favorite = true;
		//store special latlng, because API works with latlng object and it contains unpredictable structure
		this.place.geometry.favlat = this.place.geometry.location.lat();
		this.place.geometry.favlng = this.place.geometry.location.lng();
		//this.place.geometry.location.favlng = this.place.geometry.location.lng();
		this.addToFavorites(Favorites);
		this.changeFavIcon(true);
		
		//Mojo.Log.info("MARKERS LENGTH: ", markers.length);
		
		for (var k = 0; k < markers.length; k++) {
			Mojo.Log.info("IDsss %j ", markers[k].place.id);
			if (this.place.id == markers[k].place.id) {
					Mojo.Log.info("Adding: ", k);
					markers[k].place.favorite = true;
					this.pop.markerindex = k;
				};
			};
	} else {
		//remove from Favorites
		for (var i = 0; i < Favorites.length; i++) {
			if (this.place.id == Favorites[i].id) {
					Mojo.Log.info("Removing: ", i);
					Favorites.remove(i);
					this.addToFavorites(Favorites);
					this.changeFavIcon(false);
					this.place.favorite = false;
					
				};
			};
		for (var j = 0; j < markers.length; j++) {
			if (this.place.id == markers[j].place.id) {
					markers[j].place.favorite = false;
					this.pop.markerindex = j;
				};
			};
		};
		
},



addToFavorites: function() {
	//Mojo.Log.info("Favorites %j ", Favorites);
    db.add("Favorites", Favorites, this.dbAddOK.bind(this), this.dbAddFail.bind(this));
	
},

dbAddOK: function () {
	Mojo.Log.info("........","Favorite saved OK");
},

dbAddFail: function(transaction,result) { 
    Mojo.Log.warn("Database save error (#", result.message, ") - can't save favorites list. Will need to reload on next use."); 
    Mojo.Controller.errorDialog("Database save error (#" + result.message + ") - can't save favorites list. Will need to reload on next use."); 
},

changeFavIcon: function (action) {

	switch (action) {
		case true:
			this.menuModel.items[0].items[0] = { iconPath: "images/menu-icon-favorites-favorite.png", command: "do-favorites"};
		break;
		case false:
			this.menuModel.items[0].items[0] = { iconPath: "images/menu-icon-favorites.png", command: "do-favorites"};
		break;
	};
	
	this.controller.modelChanged(this.menuModel);
},

RenameChange: function (event) {
	
	//just for to call the same function as favorites are changed (refresh the marker on the map)
	this.pop.action = "updatefavorites";
	
	Mojo.Log.info("Rename %j", event.value);
	for (var j = 0; j < markers.length; j++) {
			if (this.place.id == markers[j].place.id) {
					markers[j].place.name = event.value;
					//Mojo.Log.info("ADRESA: ", markers[this.pop.markerindex].place.formatted_address);
					this.place.name = event.value;
					this.pop.markerindex = j;
				};
	};
	
	//change name in Favorites and update db
		for (var i = 0; i < Favorites.length; i++) {
			if (this.place.id == Favorites[i].id) {
					Mojo.Log.info("Renaming: ", i);
					Favorites[i].name = event.value;
					//save the best address to favorites
					Mojo.Log.info("ADRESA: ", markers[this.pop.markerindex].place.formatted_address);
					Favorites[i].formatted_address = markers[this.pop.markerindex].place.formatted_address;
					this.addToFavorites(Favorites);				
				};
			};
},

toggleUserReviewDrawer: function(){

this.drawer = this.controller.get('UserReviewDrawer');
//this will toggle the drawers state
this.drawer.mojo.setOpenState(!this.drawer.mojo.getOpenState());

if (this.drawer.mojo.getOpenState() == true)
	{
		this.controller.get('UserReviewButArrow').removeClassName('palm-arrow-closed').addClassName('palm-arrow-expanded');

	} else {
		
		this.controller.get('UserReviewButArrow').removeClassName('palm-arrow-expanded').addClassName('palm-arrow-closed');

	};

},

togglePhotosDrawer: function(){

this.drawer = this.controller.get('PhotosDrawer');

/* Insert and image for the first time when opened */
if (!this.drawer.mojo.getOpenState() && $("photo").innerHTML == "") {
	$("photo").innerHTML = "<img class='photo-img' src='" + this.place.photos[0].raw_reference.fife_url + "'>";	
};

//this will toggle the drawers state
this.drawer.mojo.setOpenState(!this.drawer.mojo.getOpenState());

if (this.drawer.mojo.getOpenState() == true)
	{
		this.controller.get('PhotosButArrow').removeClassName('palm-arrow-closed').addClassName('palm-arrow-expanded');

	} else {
		
		this.controller.get('PhotosButArrow').removeClassName('palm-arrow-expanded').addClassName('palm-arrow-closed');

	};

},

FillUserReviewList: function(reviews) {

	for (var i = 0; i < reviews.length; i++) {
		
			var author_urlElement = '';
			var AgoElement = '';
	
			if (reviews[i].author_url) {				
				var photourl = this.getUserPhoto(reviews[i].author_url);		
				author_urlElement = '<a href="' + reviews[i].author_url + '"><img src="' + photourl + '"></img></a>';
			};
			
			var secondsNow = Math.round(new Date().getTime());
			AgoElement = this.timeDifference(secondsNow, reviews[i].time*1000);

			this.UserReviewModel.items[i] = {author_name: reviews[i].author_name, text: reviews[i].text, author_url: author_urlElement, rating: reviews[i].aspects[0].rating, agoElement: AgoElement, ratingText: $L("Rating") + ": "};
			
	};
	
	this.controller.modelChanged(this.UserReviewModel);
},

getUserPhoto: function(url) {
	
	/* grabs the UserID from the URL */
	var userID = url.slice(url.lastIndexOf("/")+1);
	var photourl = "http://profiles.google.com/s2/photos/profile/" + userID + "?sz=48";
	
	return photourl;
},

timeDifference: function(current, previous) {
    
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;
    
    var timestring = "";
    var time;
    
    var elapsed = current - previous;
    
    if (elapsed < msPerMinute) {
		 time = Math.floor(elapsed/1000);
		 timestring = time > 1 ? '#{ago} seconds ago' : '#{ago} second ago';  
    }
    
    else if (elapsed < msPerHour) {
         time = Math.floor(elapsed/msPerMinute);
         timestring = time > 1 ? '#{ago} minutes ago' : '#{ago} minute ago';   
    }
    
    else if (elapsed < msPerDay ) {
         time = Math.floor(elapsed/msPerHour);
         timestring = time > 1 ? '#{ago} hours ago' : '#{ago} hour ago';   
    }

    else if (elapsed < msPerMonth) {
         time = Math.floor(elapsed/msPerDay);
         timestring = time > 1 ? '#{ago} days ago' : '#{ago} day ago';   
    }
    
    else if (elapsed < msPerYear) {
         time = Math.floor(elapsed/msPerMonth);
         timestring = time > 1 ? '#{ago} months ago' : '#{ago} month ago';  
    }
    
    else {
         time = Math.floor(elapsed/msPerYear);
         timestring = time > 1 ? '#{ago} years ago' : '#{ago} year ago';   
    }

    return " (" + new Template($L(timestring)).evaluate({ago: time}) + ")"; 
},

PhotoTap: function (event) {
	Mojo.Log.info("** PHOTO TAP *** %j ", this.place.id);
	this.controller.stageController.pushScene({'name': 'photos', transition: Mojo.Transition.none}, this.place);
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
		
		Mojo.Event.stopListening(this.CallButton, Mojo.Event.tap, this.CallButtonEventHandler);
		
	}
};
