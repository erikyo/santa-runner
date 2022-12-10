import { IS_IOS, IS_MOBILE, Runner } from '../offline'
import { loadTimeData } from '../load_time_data_deprecated'

/**
 * Decodes the base 64 audio to ArrayBuffer used by Web Audio.
 * @param {string} base64String
 */
export function decodeBase64ToArrayBuffer (base64String) {
  const len = (base64String.length / 4) * 3
  const str = atob(base64String)
  const arrayBuffer = new ArrayBuffer(len)
  const bytes = new Uint8Array(arrayBuffer)

  for (let i = 0; i < len; i++) {
    bytes[i] = str.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Return the current timestamp.
 * @return {number}
 */
export function getTimeStamp () {
  return IS_IOS ? new Date().getTime() : performance.now()
}

/**
 * For screen readers make an announcement to the live region.
 * @param {string} phrase Sentence to speak.
 */
export function announcePhrase (phrase) {
  if (Runner.a11yStatusEl) {
    Runner.a11yStatusEl.textContent = ''
    Runner.a11yStatusEl.textContent = phrase
  }
}

/**
 * Returns a string from loadTimeData data object.
 * @param {string} stringName
 * @return {string}
 */
export function getA11yString (stringName) {
  return loadTimeData && loadTimeData.valueExists(stringName)
    ? loadTimeData.getString(stringName)
    : ''
}

/**
 * Get random number.
 * @param {number} min
 * @param {number} max
 */
export function getRandomNum (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Vibrate on mobile devices.
 * @param {number} duration Duration of the vibration in milliseconds.
 */
export function vibrate (duration) {
  if (IS_MOBILE && window.navigator.vibrate) {
    window.navigator.vibrate(duration)
  }
}
