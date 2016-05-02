'use strict';
var test = require('tape');

// allow `npm run selenium <url>` usage
var baseURL = process.argv.length >= 3 ? process.argv[2] : 'https://talky.io';

// https://code.google.com/p/selenium/wiki/WebDriverJs
// var seleniumHelpers = require('./selenium-lib');
var webdriver = require('selenium-webdriver');

function doJoin(driver, room) {
  return driver.get(baseURL + '/' + room)
  .then(function () {
    return driver.findElement(webdriver.By.id('join'));
  })
  .then(function (button) {
    return button.click();
  });
}

function testP2P(browserA, browserB, t) {
  var room = 'testing_' + Math.floor(Math.random()*100000);

  // var userA = seleniumHelpers.buildDriver(browserA);
  var userA = new webdriver.Builder().usingServer().withCapabilities({'browserName': browserA }).build();
  doJoin(userA, room);

  // var userB = seleniumHelpers.buildDriver(browserB);
  var userB = new webdriver.Builder().usingServer().withCapabilities({'browserName': browserB }).build();
  doJoin(userB, room);

  userA.wait(function () {
    return userA.executeScript('return (function() {' +
      'var sessions = app.xmpp.jingle.sessions;' +
      'var sessionIds = Object.keys(sessions);' +
      'if (sessionIds.length != 2) return false;' +
      'if (sessions[sessionIds[0]].peer.full !== sessions[sessionIds[1]].peer.full) return false;' +
      'return sessions[sessionIds[0]]._connectionState === \'connected\';' +
      '})()');
  }, 30*1000)
  .then(function () {
    t.pass('P2P connected');
    userA.quit();
    userB.quit().then(function () {
      t.end();
    });
  })
  .then(null, function (err) {
    t.fail(err);
    userA.quit();
    userB.quit();
  });
}

test('P2P, Chrome-Chrome', function (t) {
  testP2P('chrome', 'chrome', t);
});

test('P2P, Firefox-Firefox', function (t) {
  testP2P('firefox', 'firefox', t);
});

test('P2P, Chrome-Firefox', function (t) {
  testP2P('chrome', 'firefox', t);
});

test('P2P, Firefox-Chrome', function (t) {
  testP2P('firefox', 'chrome', t);
});