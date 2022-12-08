/**
 * @copyright 2013 The Chromium Authors
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

import './styles/style.scss'
import OfflineSprite100 from './images/default_100_percent/offline/100-offline-sprite.png'
import OfflineSprite200 from './images/default_200_percent/offline/200-offline-sprite.png'
import ButtonPress from './sounds/button-press.mp3'
import Hit from './sounds/hit.mp3'
import ScoreReached from './sounds/score-reached.mp3'

import './scripts/jstemplate_compiled'
import './scripts/interstitial_mobile_nav'
import './scripts/load_time_data_deprecated'
import './scripts/offline'
import './scripts/offline-sprite-definitions'
import './scripts/error_page_controller_ios'

import { primaryControlOnLeft, onDocumentLoadOrUpdate } from './scripts/neterror'
import {loadTimeData} from "./scripts/load_time_data_deprecated";

function onDocumentLoad () {
  // set sprites img element src
  document.getElementById('offline-resources-1x').src = OfflineSprite100
  document.getElementById('offline-resources-2x').src = OfflineSprite200

  // set sounds audio element src
  const resourceTemplate =
    document.getElementById('audio-resources').content

  resourceTemplate.getElementById('offline-sound-press').src = ButtonPress
  resourceTemplate.getElementById('offline-sound-hit').src = Hit
  resourceTemplate.getElementById('offline-sound-reached').src = ScoreReached

  // Sets up the proper button layout for the current platform.
  const buttonsDiv = document.getElementById('buttons')
  if (primaryControlOnLeft) {
    buttonsDiv.classList.add('suggested-left')
  } else {
    buttonsDiv.classList.add('suggested-right')
  }

  onDocumentLoadOrUpdate()

  const tp = document.getElementById('t')
  window.jstProcess(new window.JsEvalContext(loadTimeData.data), tp)
}
document.addEventListener('DOMContentLoaded', onDocumentLoad)

console.log('load')
