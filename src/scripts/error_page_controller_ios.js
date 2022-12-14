// Copyright 2020 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @typedef {{
 *   downloadButtonClick: function(),
 *   reloadButtonClick: function(string),
 *   detailsButtonClick: function(),
 *   diagnoseErrorsButtonClick: function(),
 *   trackEasterEgg: function(),
 *   updateEasterEggHighScore: function(number),
 *   resetEasterEggHighScore: function(),
 *   launchOfflineItem: function(string, string),
 *   savePageForLater: function(),
 *   cancelSavePage: function(),
 *   listVisibilityChange: function(boolean),
 * }}
 */
export const errorPageController = {
  // Execute a button click to download page later.
  downloadButtonClick: function () {},

  // Execute a click on the reload button.
  reloadButtonClick: function (url) {
    window.location = url
  },

  // Execute a "Details" button click.
  detailsButtonClick: function () {},

  // Execute a "Diagnose Errors" button click.
  diagnoseErrorsButtonClick: function () {},

  // ???
  launchOfflineItem: function () {},
  savePageForLater: function () {},
  cancelSavePage: function () {},
  listVisibilityChange: function () {},

  // Track Easter egg plays and high scores.
  trackEasterEgg: function () {
    __gCrWeb.message.invokeOnHost(
      { command: 'errorPageController.trackEasterEgg' })
  },

  updateEasterEggHighScore: function (highScore) {
    __gCrWeb.message.invokeOnHost({
      command: 'errorPageController.updateEasterEggHighScore',
      highScore: highScore.toString()
    })
  },

  resetEasterEggHighScore: function () {
    __gCrWeb.message.invokeOnHost(
      { command: 'errorPageController.resetEasterEggHighScore' })
  }
}

// Create a __gCrWeb binding of initializeEasterEggHighScore so it can be
// called using JS messaging.
const __gCrWeb = {}
__gCrWeb.errorPageController = errorPageController
__gCrWeb.errorPageController.initializeEasterEggHighScore = function (highscore) {
  window.initializeEasterEggHighScore(highscore)
}
