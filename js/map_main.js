
// TODO move this into init?
var element = document.getElementById("map");

var other_img = {
  url: 'img/marker-person.png',
  //url: 'red_arrow.png',
  scaledSize: new google.maps.Size(50, 50), // scaled size
  labelOrigin: new google.maps.Point(30, 0),
  rotation: 90,
};
var image = {
    url: "img/person_icon.png", // url
    // size: new google.maps.Size(512, 512),
    scaledSize: new google.maps.Size(50, 50),
    labelOrigin: new google.maps.Point(70, 70), // scaled size
};
var trail_icon = {
  url: 'img/red_circle.png',
  scaledSize: new google.maps.Size(10, 10), // scaled size
};

var statusOff = {
  url: 'img/red_circle_icon.png',
    scaledSize: new google.maps.Size(20, 20), // scaled size
};

var statusOn = {
  url: 'img/green_circle_icon.png',
    scaledSize: new google.maps.Size(20, 20), // scaled size
};

var map = new google.maps.Map(element, {
  center: new google.maps.LatLng(37, -122),
  zoom: 10,
  mapTypeId: "OSM",
  mapTypeControl: false,
  streetViewControl: false,
  keyboardShortcuts: false,

});

var trackAllPoints = true;
var img = document.getElementById("trackImg")
// username -> marker.
var markers = {};
// username -> position
var lastPosition = {};

function init_map() {

  map.controls[google.maps.ControlPosition.TOP_CENTER].push($('#username').get(0));
  map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push($('#toggle-div').get(0));

  map.mapTypes.set("OSM", new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
      return "https://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
    },
    tileSize: new google.maps.Size(256, 256),
    name: "OpenStreetMap",
    maxZoom: 18
  }));

  // SF default location
  var myLatlng = new google.maps.LatLng(37.744913, -122.446713);
  map.setCenter(myLatlng)


  var trail_hist = {}; //new Array();

  // UI
  var controlDiv = document.createElement('div');
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
  controlDiv.style.padding = '5px';

  var button = document.getElementById("trackButton")
  controlDiv.appendChild(button)



  google.maps.event.addDomListener(controlDiv, 'click', function() {
    console.log("CLICK", button, img)
    if (trackAllPoints == true) {
      disableTrackAll()
    } else {
      enableTrackAll()
    }
  });
  
  
  var controlDiv_st = document.createElement('div');
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlDiv_st);
  controlDiv_st.style.padding = '5px';
}

function addNameButton() {
  var btn = document.createElement("BUTTON");        // Create a <button> element
  var t = document.createTextNode("Add NAME");       // Create a text node
  btn.appendChild(t);                                // Append the text to <button>
  map.controls[google.maps.ControlPosition.LEFT_TOP].push(btn);
  btn.addEventListener ("click", function() {
    var user = prompt("Please enter your name:", "");
    if (user != "" && user != null) {
      userName = user;
      window.localStorage.setItem("username", userName);
      var name = document.createTextNode(userName);
      controlDiv_st.appendChild(name);
      controlDiv_st.style.fontSize = '16px';
      btn.style.display = 'block';
      btn.style.display = 'none'
  
      if (markers[userID]) {
        markers[userID].setLabel({
          text: userName,
          color: '#660033',
          fontWeight: 'bold',
          fontSize: '14px'});
    }
          }
  });
}

function displayUserName(username) {

}

function enableTrackAll() {
  img.src = "img/icon_fullscreen_on.png";
  trackAllPoints = true;
  updateBoundingBox();
}

function disableTrackAll() {
  img.src = "img/icon_fullscreen_off.png";
  trackAllPoints = false;
}




// List of clients in the session: with green circle if online, red - if offline

function ListOnlineClients(name, clientId) {

      var ClientsOnline = document.createElement("div");
      ClientsOnline.id = String(clientId);
      map.controls[google.maps.ControlPosition.LEFT_TOP].push(ClientsOnline);
      ClientsOnline.style.fontSize = "16px";
      ClientsOnline.style.padding = '2px'

      var statusLight = document.createElement("img");
      statusLight.id = "img" + String(clientId);
      statusLight.src = 'img/green_circle_icon.png';
      statusLight.width = 12;
      statusLight.height = 12;

      var NameToList = document.createTextNode(String(name));
      var br = document.createElement("br");

      ClientsOnline.append(statusLight);
      ClientsOnline.appendChild(NameToList);
      ClientsOnline.appendChild(br);
}
// username -> Set of positions
var tracks = {};
function addToTracks(pos) {
  if (!(pos.username in tracks)) {
    tracks[pos.username] = new Set();
  }
  tracks[pos.username].add(pos);
}

function setDefaultTrackParam() {
  if (getTrackName() == null) {
    var x = getRandomString(5);
    setUrlParam('t', x);
    p('setting default track param to ' + x);
  }
}

// Main
function init() {
  // redirect to https. I couldn't figure out how to do this on the server
  if (location.protocol !== "https:") {
    location.protocol = "https:";
  }

  // Trigger geolocation requrest
  navigator.geolocation.getCurrentPosition(() => {});

  setDefaultTrackParam();
  setUsernameFromLocalStorage();
  init_map();
  init_firebase();

  if (geoPosition.init()) {  // Geolocation Initialisation
    scheduleGeoUpdates();
  } else {
    console.log('Geolocation not supported');
    // You cannot use Geolocation in this device
  }

  // readPoints(getTrackName(), addPosition2);
  subscribeToFirebaseUpdates();
}

// $( document ).ready(init);


function subscribeToFirebaseUpdates() {
  pointsCollection(getTrackName()).onSnapshot(handleSnapshot);
}

function handleSnapshot(snapshot) {
  p(snapshot)
  snapshot.docChanges().forEach((change) => {
    // p(change.type)
    addPosition2(change.doc.data())
});
}


function addPosition2(pos) { 
  addToTracks(pos);
  // rewrite addposition assuming a single track
  // order by timestamp
  place_trail_marker(pos.username, pos.lat, pos.lng)

  updateMarker2(pos.username)
}

function updateMarker2(username) {
  var positions = tracks[username];

  // find position with the highest ts value
  const latestPos = Array.from(positions).reduce((a,b) => a.ts > b.ts ? a:b);
  initMarker(latestPos);
  markers[username].setPosition(new google.maps.LatLng(latestPos.lat, latestPos.lng));
}

function initMarker(pos) {
  if (!(pos.username in markers)) {
    markers[pos.username] = new google.maps.Marker({
      position: new google.maps.LatLng(pos.lat, pos.lng),
      map: map,
      icon: image,
      label: {text: String(pos.username),
              color: '#660033',
              fontWeight: 'bold',
              fontSize: '18px',
              margin: '10px',
            }
    });
  }
}

function addPosition(pos) {
  console.log(pos.lat, pos.lng);
  var clientId = pos.clientId || 'clnt-default';
  console.log("clientId received:", clientId);
  var latLong = new google.maps.LatLng(pos.lat, pos.lng);
  var name = pos.username || 'username';
  console.log("username received:", name);
  var trailColorSrvr = pos.trailColor;
  console.log("trailcolor received:", trailColorSrvr);

  if (! (clientId in markers)) {
    // New (unknown) client

    // if (clientId == userID) { // self marker with blue color

      userName = name;
      trailColor = trailColorSrvr;
      // if reconnecting client with previously set username then remove button and display the Username
      if (!userName.startsWith('User')) {
        var nameNode = document.createTextNode(userName);
        controlDiv_st.appendChild(nameNode);
        controlDiv_st.style.fontSize = '16px';
        btn.style.display = 'block';
        btn.style.display = 'none';
      }
      markers[clientId] = new google.maps.Marker({
        position: latLong,
        map: map,
        icon: image,
        label: {text: String(userName),
                color: '#660033',
                fontWeight: 'bold',
                fontSize: '14px'}
      });

      trail_hist[clientId] = new Array();

    } else {   // grey marker for others
      markers[clientId] = new SlidingMarker({
        position: latLong,
        map: map,
        icon: other_img,
        label: {text: String(name),
                color: '#660033',
                fontWeight: 'bold',
                fontSize: '14px'},
        options: {easing: 'linear'}
      });

      trail_hist[clientId] = new Array();

      // add to the list of online clients
      ListOnlineClients(name, clientId);
    }

  } 
//   else {
//     // if existing client then update and draw trail

//     markers[clientId].setPosition(latLong);

//     if (pos.lat && trail_hist[clientId].length == 0) { // place the first marker if array is empty
//       place_trail_marker(clientId, pos.lat, pos.lng, trailColorSrvr);
//     }

//     else if (pos.lat && trail_hist[clientId].length >= 1) { // if the trail history is not empy check the distance before placing a trail marker

//       var len = trail_hist[clientId].length;
//       var last_elm = trail_hist[clientId][len-1];
//       var dist = distance_miles(pos.lat, pos.lng, last_elm.lat, last_elm.lng);

//       if (dist > 0.02) {     // if distance is larger
//         place_trail_marker(clientId, pos.lat, pos.lng, trailColorSrvr);
//       }
//     }
//   }
// }


function place_trail_marker(clientId, lat, lng, trailColorSrvr){

  var latLong = new google.maps.LatLng(lat, lng);
  var trail = new trail_spot(lat, lng, Date.now());
  // trail_hist[clientId].push(trail);

  var trail_marker = new google.maps.Marker({
    position: latLong,
    map: map,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 4.0,
      fillColor: String(trailColorSrvr),
      fillOpacity: 1.0,
      strokeWeight: 0.8 }

  });

  var time_only = new Date(trail.timestamp);

  var infowindow = new google.maps.InfoWindow({
    content: String(time_only.getHours() + ':' + time_only.getMinutes() + ':' + time_only.getSeconds())
  });
  trail_marker.addListener('click', function() {
    infowindow.open(map, trail_marker);
  });
  google.maps.event.addListener(map, 'click', function() {
    infowindow.close(map, trail_marker);
  });
}

function updateBoundingBox() {
  var bounds = new google.maps.LatLngBounds();
  for (i in markers) {
    m = markers[i]
    bounds.extend(m.position)
  }
  map.fitBounds(bounds);
}

// Main entry point.
// The position update happens across several callbacks:
// 1. Get own position
// 2. Send it to the server
// 3. Get all positions from server
// 4. Show them on map
function update () {
  geoPosition.getCurrentPosition(geo_success_callback,
                                 geo_error_callback,
                                 { enableHighAccuracy:true });
}

function distance_miles(lat1, lon1, lat2, lon2) { // default unit - miles
  var radlat1 = Math.PI * lat1/180
  var radlat2 = Math.PI * lat2/180
  var theta = lon1-lon2
  var radtheta = Math.PI * theta/180
  var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist)
  dist = dist * 180/Math.PI
  dist = dist * 60 * 1.1515
  return dist //* 1.609344
}

function trail_spot(lat, lng, timestamp){
  this.lat = lat;
  this.lng = lng;
  this.timestamp = timestamp;
}

function setUsernameFromLocalStorage() {
  var username = window.localStorage.getItem("username");
  if (username != null) {
    $('#username_in').val(username);
  }
}

function getUsername() {
  return $('#username_in').val();
}

function getTrackName() {
  return getUrlParam('t');
}

function username_changed(username) {
  p(username);
  window.localStorage.setItem("username", username);
}


function username_b_clicked() {
  var username = prompt('Enter your username', 'username')
  username_changed(username);
}

function recordToggled(checked) {
  console.log("recordToggled", checked);
  if (checked) {
    scheduleGeoUpdates();
  } else {
    unscheduleGeoUpdates();
  }
}