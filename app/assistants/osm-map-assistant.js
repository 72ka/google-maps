function OSMMapType(Preferences) {
	this.Preferences = Preferences;
	this.MapCacheBasePath = this.Preferences.MapCacheExternal ? "/media/internal/.MapTool/" : "/media/internal/appdata/cz.72ka.googlemaps/cache/OSM/";

}

OSMMapType.prototype = {

tileSize: new google.maps.Size(256, 256),
isPng: true,
name: "OpenStreetMap",
credit: 'OpenStreetMap',
maxZoom: 18,

getTile: function(coord, zoom, ownerDocument) {
	
	this.checkFileExist(this.MapCacheBasePath + zoom + "/" + coord.x + "/" + coord.y + ".png", zoom, coord.x, coord.y, ownerDocument);
	
	var tileUrl = this.MapCacheBasePath + zoom + '/' + coord.x + '/' + coord.y + '.png';

	var tile = ownerDocument.createElement('img');
	tile.width = this.tileSize.width;
	tile.height = this.tileSize.height;
	tile.src = tileUrl;
	tile.id = "NoTrans" + zoom.toString() + coord.x.toString() + coord.y.toString();

	return tile;
},

checkFileExist: function (path, zoom, x, y, ownerDocument) {

    var xhr = new XMLHttpRequest();

	  xhr.onreadystatechange = 
		function(){
		  if (xhr.readyState == 4){
			if (xhr.status == 200){
			  return true;
			}
			else {
			  this.downloadTile("http://tile.openstreetmap.org/" + zoom + "/" + x + "/" + y + ".png", zoom, x, y, ownerDocument);
			}
		  }
		}.bind(this);

	  xhr.open("HEAD", path, true);
	  xhr.send();
},

downloadTile: function (path, zoom, x, y, ownerDocument) {
	
	var tile = document.getElementById("NoTrans" + zoom.toString() + x.toString() + y.toString());
    tile.src = "images/saving-to-cache.png";

	new Mojo.Service.Request('palm://com.palm.downloadmanager/', {
			method: 'download', 
			parameters: {
				target: path,
				targetDir : this.MapCacheBasePath + zoom + "/" + x + "/",
				targetFilename : y + ".png"
			},
			onSuccess : function (resp) {
				this.refreshTile(resp.target, zoom, x, y, ownerDocument);
			}.bind(this),
			onFailure : function (e) {
				Mojo.Log.error("Error while downloading tile.");
			}
		}); 
},

refreshTile: function (tile, zoom, x, y, ownerDocument) {
		var tile = document.getElementById("NoTrans" + zoom.toString() + x.toString() + y.toString());
        tile.src = "http://tile.openstreetmap.org/" + zoom + "/" + x + "/" + y + ".png";
}

};
