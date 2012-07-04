function LicenseAssistant(argFromPusher) {
}

LicenseAssistant.prototype = {
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
		
},
	
	handleCommand: function(event) {
                if (event.type === Mojo.Event.command) {
                        if (event.command == 'goBack') {
                        this.controller.stageController.popScene();
                        }
                }
                

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

	}
};
