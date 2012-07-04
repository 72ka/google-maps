function MarkerInfoAssistant(place) {
	// place is response from google place service
	this.place = place;
}

MarkerInfoAssistant.prototype = {
setup: function() {
	
//setup UI widgets

//set localized text
$("DeatilsText").innerHTML = $L("Details");

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
	

if(this.isTouchPad()){

  var menuModel = {
  visible: true,
  items:  [
      {
          items: [
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
	
  var menuModel = {
  visible: true,
  items: [
      {
          items: [
             
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
this.controller.setupWidget(Mojo.Menu.commandMenu,
         this.attributes = {
             spacerHeight: 0,
             menuClass: 'no-fade'
         },
         menuModel
	);

// Show everything available from place on this scene
if (this.place.icon) { $("place-icon").innerHTML = "<img width='48' height='48' src='" + this.place.icon + "'>";  };
if (this.place.name) { $("name").innerHTML = this.place.name; };
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
if (this.place.url) { $("url").innerHTML = "<a href='" + this.place.url + "'>" + $L("Show full Google page") + "</a>"; };
if (this.place.website) { $("website").innerHTML = $L("Home page") + ":<br>" + "<a href='" + this.place.website + "'>" + this.place.website + "</a>"; };




		
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
                        	this.controller.stageController.popScene();
                        }
                          if (event.command == 'share') {
                            this.sharePopUp(event);
                        }
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

var Address = "<br><b>" + $L("Address") + ":</b> " + this.place.formatted_address;
if (this.place.url) gURL = "<br><b>" + $L("Google Maps URL") + ": </b><a href='" + this.place.url + "'>" + this.place.url + "</a>";
if (this.place.website) website = "<br><b>" + $L("Home page") + ":</b> " + "<a href='" + this.place.website + "'>" + this.place.website + "</a>";

var EmailText = "<b>" + $L("Name") + ":</b> " + this.place.name + Address + "<br><b>" + $L("Location") + ":</b> " + this.place.geometry.location + gURL + website + "</p><i><h6><font color='grey'>" + $L("-- Sent from") + " <a href='http://www.webosnation.com/google-maps-72ka'>" + $L("homebrew Google Maps</a> application for WebOS") + "</font><h6></i>";
				


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

if (this.place.url) gURL = " gURL: " + this.place.url;
if (this.place.website) website = " WWW: " + this.place.website;
		
var SMSText = this.place.name + ", " + this.place.formatted_address + " " + $L("Loc: ") + this.place.geometry.location + gURL + website;
				


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

var Address = ", " + $L("Address") + ": " + this.place.formatted_address;
if (this.place.url) gURL = ", " + $L("Google Maps URL") + ": " + this.place.url;
if (this.place.website) website = ", " + $L("Home page") + ": " + this.place.website;

var CBtext = $L("Name") + ": " + this.place.name + Address + ", " + $L("Location") + ": " + this.place.geometry.location + gURL + website;
		
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
	note: $L('Added by homebrew Google Maps.')
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
