const firebaseConfig = {
  "type": "service_account",
  "projectId": "walls-and-flags",
  "apiKey": "AIzaSyBnyVhnMwGWviZ7YRmIRWnByI1fGuoRzPk",
}
// call init_firebase before using
// const app = firebase.initializeApp(firebaseConfig);
// TODO rename / remove from global scope?
var db = null;

function init_firebase() {
  const app = firebase.initializeApp(firebaseConfig);
  db = app.firestore();
}

function pointsCollection(trackName) {
  var colName = 'track-' + trackName;
  console.log("Collection:", colName);
  return db.collection(colName);
}

function getDocRef() {
  return db.collection('my_collection').doc('my_document');
}

function readDoc() {
  getDocRef().get().then((doc) => {
    if (doc.exists) {
      var data = doc.data();
      console.log("Document data:", data);

      var field1 = doc.get('text1');

      var el = document.getElementById("t1");
      console.log(el.value);
      el.value = field1;
    
    } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
    }
  })
}

function p(x) { console.log(x); }
function writePoint(lat, lng, ts, trackName, username)
{
  var point = {
    lat: lat,
    lng: lng, 
    ts: ts,
    username: username,
  }
  p(point);

  pointsCollection(trackName).add(point)

  // console.log("write done");
}

function readPoints(track_name, pointCallback) {
  pointsCollection(track_name).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      var data = doc.data();
      pointCallback(data)
      // console.log("Document data:", data);
    });

    p(querySnapshot.size + " points")
  });
}

// functin 