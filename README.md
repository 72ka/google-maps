Google Maps
===========

Homebrew Google Maps for WebOS (javascript API v3)

This application is trying to be a replacement of unsupported Google Maps application for WebOS devices. The application is based on the Google API V3. Development goal is to get all the features available in API on our WebOS devices and a little more, while maintaining compatibility to the oldest devices with WebOS 1.4.5 up to the newest devices like HP Touchpad. The application seeks to offer a simple and clean user interface. If you like this application, you can donate me in "About" menu.


![screenshot](http://cdn.webosnation.com/sites/webosnation.com/files/imagecache/w320/apps/screenshots/PrewareShot.PNG)

Known issues
============

Google Maps API v3 doesn´t support WebOS - it follows the strange issues:

-> WebOS 1.x and 3.x - API loads the non-touch UI, listen for Mouse events and WebOS fires the MouseEvents - OK

-> WebOS 2.x - API loads the touch UI (upon useragent string), listening for TouchEvents, but WebOS fires MouseEvents, because doesn't support TouchEvents - STRANGE, can't move, zoom or click the map
  (the user interactions with map is workarounded via Mojo events translated to API call PanBy(), setZoom(), etc... and this is the reason why the map moving is jerky )
  
-> Pre3 device UI is scaled UP 1.5 times, but the API projection is non-scaled, if user move finger on the scaled-up UI, represents scaled distance in pixels. E.g. the Pre3 physical width is 480px, in scaled UI 320px, swipe from left to right count 320px and sends to the map projection, which is always non-scaled and the map moves only by 320px in 480px wide... the map moves less than user finger. And this causes the issues on Pre3. At this time the app use non-scaled map, where the street names are small, but it is only sane way how to have correct behavior of the map.

Generally, it is very hard to have working app on unsupported device, needs many workarounds, but still better than nothing.

Jan Herman (72ka)
(Czech Republic)