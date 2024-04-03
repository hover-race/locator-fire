function p(x) {
  console.log(x);
}

const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';

function getRandomString(length) {
  var randomString = '';
  for (var i = 0; i < length; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomString;
}

function getUrlParam(key) {
  var searchParams = new URLSearchParams(window.location.search)
  return searchParams.get(key);
}

// Set URL param without reloading the page (via history change)
function setUrlParam(key, value) {
  var searchParams = new URLSearchParams(window.location.search)
  searchParams.set(key, value);
  var newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
  history.pushState(null, '', newRelativePathQuery);
}
