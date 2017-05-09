;(function(){

function authInterceptor(API, auth) {
  return {
    // automatically attach Authorization header
    request: function(config) {
      return config;
    },

    // If a token was sent back, save it
    response: function(res) {
      return res;
    },
  }
}

///////////

function authService($window) {
  var self = this;

  // Parsing JWT

  self.parseJwt = function(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/'); // Will able to decode properly
    return JSON.parse($window.atob(base64));
  }

  console.log(self.parseJwt('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImRhbnkiLCJpZCI6MCwiZXhwIjoxNDk0NDQwNDc3LCJpYXQiOjE0OTQzNTQwNzd9.mTuWbB9zya0AW7zw8UJaFcLvA7SPXfnkrq1gA2poRHk'));

  // Save token to localstorage
  self.saveToken = function(token) {
    $window.localStorage['jwtToken'] = token;
  }

  // Retrieve token from localstorage
  self.getToken = function() {
    return $window.localStorage['jwtToken'];
  }

  console.log("Token cargado: " + self.getToken());

  // Is the user auth?
  self.isAuthed = function(){
    // retrieve the token from local storage
    var token = self.getToken();
    if(token){
      var params = self.parseJwt(token);

      //
      return Math.round(new Date().getTime() / 1000) <= params.exp;
    } else {
      return false;
    }
  }
  console.log("am I authed?", self.isAuthed());

  // Logout service
  self.logout = function() {
    $window.localStorage.removeItem('jwtToken');
  }
}

///////////

function userService($http, API, auth) {
  var self = this;
  self.getQuote = function() {
    return $http.get(API + '/auth/quote')
  }

  // Register service
  self.register = function(username, password) {
    return $http.post(API + '/auth/register', {
        username: username,
        password: password
      })
  }

  // Login service
  self.login = function(username, password) {
    return $http.post(API + '/auth/login', {
        username: username,
        password: password
      }).then(function(res){
        auth.saveToken(res.data.token)

        return res
      })
  }
}

///////////

// We won't touch anything in here
function MainCtrl(user, auth) {
  var self = this;

  function handleRequest(res) {
    var token = res.data ? res.data.token : null;
    if(token) { console.log('JWT:', token); }
    self.message = res.data.message;
  }

  self.login = function() {
    user.login(self.username, self.password)
      .then(handleRequest, handleRequest)
  }
  self.register = function() {
    user.register(self.username, self.password)
      .then(handleRequest, handleRequest)
  }
  self.getQuote = function() {
    user.getQuote()
      .then(handleRequest, handleRequest)
  }
  self.logout = function() {
    auth.logout && auth.logout()
  }
  self.isAuthed = function() {
    return auth.isAuthed ? auth.isAuthed() : false
  }
}

angular.module('app', [])
.factory('authInterceptor', authInterceptor)
.service('user', userService)
.service('auth', authService)
.constant('API', 'http://test-routes.herokuapp.com')
.config(function($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
})
.controller('Main', MainCtrl)
})();