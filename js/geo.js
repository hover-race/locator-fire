const GEO_UPDATE_PERIOD_SEC = 3;

function scheduleGeoUpdates() {
  getGeolocation();
  geoTaskId = setInterval(getGeolocation, GEO_UPDATE_PERIOD_SEC * 1000);
}

function unscheduleGeoUpdates() {
  clearInterval(geoTaskId);
  geoTaskId = null;
}

function getGeolocation() {
  geoPosition.getCurrentPosition(geo_success_callback, geo_error_callback, {enableHighAccuracy:true});
}

function geo_success_callback(position){
  console.log('geo success', position);
  p([position.coords.latitude, position.coords.longitude]);
  if (trackAllPoints) {
    updateBoundingBox();
  }
  writePoint(
    position.coords.latitude, 
    position.coords.longitude, 
    new Date(),
    getTrackName(), 
    getUsername(),
    );
  p('write done')
}

function geo_error_callback(p){
  console.log('error', p);
  $("#geoFailureDetails").text("Error: " + p.message);
  $("#geoFailureDialog").get(0).showModal();
  // alert(p.message);
  // p.message : error message
}