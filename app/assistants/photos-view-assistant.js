function PhotosAssistant(place) {
	
this.place = place;
this.photosurl = [];
this.captions = [];
}

PhotosAssistant.prototype = {

        setup : function() {
                //      Bind response handlers
                this.leftHandler = this.leftHandler.bind(this);
                this.rightHandler = this.rightHandler.bind(this);
                
                //      Store references for later
                this.cakeViewer = this.controller.get('imageViewer');
                this.captionDiv = this.controller.get('photos-header-text-right');
                this.headerText = this.controller.get('photos-header-text-left');
				this.headerText.innerHTML = this.place.name;
				
                // Setup and instantiate the image viewer
                this.viewerAttributes= {
                        noExtractFS : true,
                        highResolutionLoadTimeout: 3,
                        limitZoom: true
                };
                this.viewerModel= {
                        onLeftFunction: this.leftHandler,
                        onRightFunction: this.rightHandler
                };
                this.controller.setupWidget('imageViewer', this.viewerAttributes, this.viewerModel);
                
                for (var k = 0; k < this.place.photos.length; k++) {
					this.photosurl[k+1] = this.place.photos[k].raw_reference.fife_url;
					this.captions[k+1] = (k+1) + "/" + this.place.photos.length;
				};
				
				/* add event handlers to listen to events widgets */
				this.handleWindowResizeHandler = this.handleWindowResize.bindAsEventListener(this); //Handler function for handling the window resize event (when the orientation has changed
				this.controller.listen(this.controller.window, 'resize', this.handleWindowResizeHandler);
				
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

        ready: function(){
                this.cakeViewer.mojo.manualSize(this.controller.window.innerWidth, this.controller.window.innerHeight);
                
        },

        leftHandler: function(){
                this.movePhotoIndex('left');
                this.cakeViewer.mojo.leftUrlProvided(this.getUrlForThe('left'));
        },
        rightHandler: function(){
                this.movePhotoIndex('right');
                this.cakeViewer.mojo.rightUrlProvided(this.getUrlForThe('right'));
        },
        
        handleWindowResize: function (event){
			this.cakeViewer.mojo.manualSize(this.controller.window.innerWidth,	this.controller.window.innerHeight); //Sets the new width and height of the imageViewer to the width and height of the full screen window
		},
		
		handleCommand: function(event) {
                if (event.type === Mojo.Event.command) {
                        if (event.command == 'goBack') {
                        this.controller.stageController.popScene();
                        }
                }
                

		},
   
        // Used to recognize and record a change in the widgets 'position' in our set of images
        curPhotoIndex: 1,
        positionDelta: {
                left: -1,
                center: 0,
                right: 1
        },
        movePhotoIndex: function( direction ){
                this.curPhotoIndex = this.curPhotoIndex + this.positionDelta[direction];
                
                //      Wrap around edges
                if(this.curPhotoIndex > this.photosurl.length-1 || this.curPhotoIndex < 1) {        
                        this.curPhotoIndex = this.wrapAroundMarioStyle( this.curPhotoIndex, this.photosurl.length );
                }
                this.captionDiv.innerHTML = this.captions[this.curPhotoIndex] || "";
                        
        },
        getUrlForThe: function( position ){
                var urlIndex;
                urlIndex = this.curPhotoIndex + this.positionDelta[position];
                
                //      reach around edges
                if(urlIndex > this.photosurl.length-1 || urlIndex < 0) {    
                        urlIndex = this.wrapAroundMarioStyle( urlIndex, this.photosurl.length ); 
                }
                        
                return this.photosurl[urlIndex];
        },
        wrapAroundMarioStyle: function( index, max ){
                return Math.abs( Math.abs( index ) - max );
        },
        
        isTouchPad: function(){
			if(Mojo.Environment.DeviceInfo.modelNameAscii.indexOf("ouch")>-1) {
					return true;
				}
				if(Mojo.Environment.DeviceInfo.screenWidth==1024){ return true; }
				if(Mojo.Environment.DeviceInfo.screenHeight==1024){ return true; }
				return false;
		},
        
        activate: function() {
                this.cakeViewer.mojo.centerUrlProvided(this.getUrlForThe('center'));
                this.cakeViewer.mojo.leftUrlProvided(this.getUrlForThe('left'));
                this.cakeViewer.mojo.rightUrlProvided(this.getUrlForThe('right'));
                //set caption for the first photo
                this.captionDiv.innerHTML = this.captions[1] || "";
        },
        
        cleanup: function() {
				this.controller.stopListening(this.controller.window, 'resize', this.handleWindowResizeHandler);
		}

};
