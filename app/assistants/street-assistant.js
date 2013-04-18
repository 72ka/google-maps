function StreetAssistant(argFromPusher) {
this.MainAssistant = Mojo.Controller.getAppController().assistant;
this.position = argFromPusher;
}

StreetAssistant.prototype = {
	setup: function() {

		if (Mojo.Environment.DeviceInfo.platformVersionMajor == "2" && Mojo.Environment.DeviceInfo.platformVersionMinor == "2") {
			this.SdragStartHandler = this.SdragStart.bindAsEventListener(this);
			this.SdraggingHandler = this.Sdragging.bindAsEventListener(this);

			//Mojo.Log.info("WebOS 2.2.x detected", Mojo.Environment.DeviceInfo.platformVersion);
			Mojo.Event.listen(this.controller.stageController.document, Mojo.Event.dragStart, this.SdragStartHandler);
			Mojo.Event.listen(this.controller.stageController.document, Mojo.Event.dragging, this.SdraggingHandler);	
		};
      
this.controller.setupWidget("StreetSpinner",
  this.attributes = {
      spinnerSize: "large"
  },
  this.model = {
      spinning: true
  }
);

    
var menuModel = {
  visible: true,
  items: [
      {
          items: [
              
          ]
      }, 
      {
          items: [
              {label: $L('Minus'), iconPath:'images/zoomout.png', command:'zoomOut'},
              {icon: "back", command: "goBack"},
              {label: $L('Plus'), iconPath:'images/zoomin.png', command:'zoomIn'}              
          ]
      },
      {
          items: [
          ]
      }
  ]
};
     this.controller.setupWidget(Mojo.Menu.commandMenu,
         this.attributes = {
             spacerHeight: 0,
             menuClass: 'street-bottom-menu'
         },
         menuModel
     );   
$('overlay-scrim').show();


// Check for a street view at the position
this.streetViewCheck = new google.maps.StreetViewService();  
this.streetViewCheck.getPanoramaByLocation(this.position, 50, function(result, status) {
		//Mojo.Log.info("STATUS", status);
    if (status == google.maps.StreetViewStatus.ZERO_RESULTS) {
        this.streetViewAvailable = false;  
        this.handleZEROResponse();    
    }else{
        this.streetViewAvailable = true;
        if (Mojo.Environment.DeviceInfo.platformVersionMajor == "2" && Mojo.Environment.DeviceInfo.platformVersionMinor == "1") {
			//this.Panorama21();  //panorama pro webos 2.1
			/* Looks like the new API supports finally the webOS 2.1 webkit */
			this.Panorama();
		} else {
			this.Panorama();  //vsechny webos krome 2.1
		};
  
    }
}.bind(this));

},
	
handleZEROResponse: function(response) {

		 this.controller.get('StreetSpinner').mojo.stop();
		 $('overlay-scrim').hide();
         this.controller.showAlertDialog({
            onChoose: function(value) {
            
               this.controller.stageController.popScene();
            },
            title: $L("Street View not available"),
            message: $L("Street View is not available for this location."),
            choices: [{
               label: $L("OK"),
               value: ""
            }]
         });
},
	
Panorama: function() {
             
       var panoramaOptions = {
				  position: this.position,
				  visible: false,
				  addressControl: true,
				  linksControl: true,				  
				  panControl: false,
				  zoomControl: false,
				  enableCloseButton: false,
				  pov: {
				    heading: 34,
				    pitch: 10,
				    zoom: 1
				  			}
			};

this.controller.get('StreetSpinner').mojo.stop(); //stop spinner
$('overlay-scrim').hide();

try {
				this.panorama = new google.maps.StreetViewPanorama(document.getElementById("street_canvas"), panoramaOptions);
				this.panorama.setVisible(true);
				}
			catch (error) {
				Mojo.Log.info("Cannot initiate StreetView - system error", error);
				
				};


},

/* DEPRECATED */
Panorama21: function() {
	
		var width = Mojo.Environment.DeviceInfo.screenWidth;
		var height = Mojo.Environment.DeviceInfo.screenHeight;
	
		this.controller.get('StreetSpinner').mojo.stop();
		$('overlay-scrim').hide();
		 
		 var panoOptions = {
          visible: true,
          panControl: false,
		  zoomControl: false
        };
		 
		 
		 this.panorama = new google.maps.StreetViewPanorama(
            document.getElementById('street_canvas'), panoOptions
        );

        this.panorama.registerPanoProvider(function(pano) {
          return {
            tiles: {
				
			  tileSize: new google.maps.Size(width, height),
              worldSize: new google.maps.Size(width*4, height),
              centerHeading: 45,
              getTileUrl: function(pano, zoom, tileX, tileY) {
				  if (tileX < 4) {
					  return "http://maps.googleapis.com/maps/api/streetview?size=" + width + "x" + height + "&location=" + this.position + " &heading="+ tileX*90 +"&fov=90&pitch=0&sensor=false";
					  }
				  else {
					  return "";
					  };
				  
                
              }.bind(this)
          }
        };
        }.bind(this));

        this.panorama.setPano('panorama');

},

	
handleCommand: function(event) {
                if (event.type === Mojo.Event.command) {
                        if (event.command == 'goBack') {
                        this.controller.stageController.popScene();

                        }
                        if (event.command == 'zoomOut') { 
                                      	this.panorama.setPov({ heading: this.panorama.getPov().heading, pitch: this.panorama.getPov().pitch, zoom: this.panorama.getPov().zoom-1 });

                        }
                        if (event.command == 'zoomIn') { 
                                        this.panorama.setPov({ heading: this.panorama.getPov().heading, pitch: this.panorama.getPov().pitch, zoom: this.panorama.getPov().zoom+1 });
                        }
                }
},

SdragStart: function(event) {

            this.oldx = event.down.x;
            this.oldy = event.down.y; 
        },
        
Sdragging: function(event) {
    				this.headingoffset = Math.round((this.oldx - event.move.x)*0.25);
    				this.pitchoffset = Math.round((this.oldy - event.move.y)*0.25);

        this.panorama.setPov({ heading: this.panorama.getPov().heading + this.headingoffset, pitch: this.panorama.getPov().pitch - this.pitchoffset, zoom: this.panorama.getPov().zoom });

        this.oldx = event.move.x;
        this.oldy = event.move.y;
},

cleanup: function() {	
	 if (Mojo.Environment.DeviceInfo.platformVersionMajor == "2" && Mojo.Environment.DeviceInfo.platformVersionMinor == "2") {
		Mojo.Event.stopListening(this.controller.stageController.document, Mojo.Event.dragStart, this.SdragStartHandler);
		Mojo.Event.stopListening(this.controller.stageController.document, Mojo.Event.dragging, this.SdraggingHandler);
		
		this.SdragStartHandler = null;
		this.SdraggingHandler = null;
		
		};
		this.panorama.setVisible(true);
		this.panorama = null;
	}
};
