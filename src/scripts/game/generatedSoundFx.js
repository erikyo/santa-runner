import { IS_IOS } from '../offline'

/**
 * Generated sound FX class for audio cues.
 * @constructor
 */
export function GeneratedSoundFx () {
  this.audioCues = false
  this.context = null
  this.panner = null
}

GeneratedSoundFx.prototype = {
  init () {
    this.audioCues = true
    if (!this.context) {
      // iOS only supports the webkit version.
      this.context = new AudioContext()
      if (IS_IOS) {
        this.context.onstatechange = function () {
          if (this.context.state !== 'running') {
            this.context.resume()
          }
        }.bind(this)
        this.context.resume()
      }
      this.panner = this.context.createStereoPanner
        ? this.context.createStereoPanner()
        : null
    }
  },

  stopAll () {
    this.cancelFootSteps()
  },

  /**
   * Play oscillators at certain frequency and for a certain time.
   * @param {number} frequency
   * @param {number} startTime
   * @param {number} duration
   * @param {?number=} optVol
   * @param {number=} optPan
   */
  playNote (frequency, startTime, duration, optVol, optPan) {
    const osc1 = this.context.createOscillator()
    const osc2 = this.context.createOscillator()
    const volume = this.context.createGain()

    // Set oscillator wave type
    osc1.type = 'triangle'
    osc2.type = 'triangle'
    volume.gain.value = 0.1

    // Set up node routing
    if (this.panner) {
      this.panner.pan.value = optPan || 0
      osc1.connect(volume).connect(this.panner)
      osc2.connect(volume).connect(this.panner)
      this.panner.connect(this.context.destination)
    } else {
      osc1.connect(volume)
      osc2.connect(volume)
      volume.connect(this.context.destination)
    }

    // Detune oscillators for chorus effect
    osc1.frequency.value = frequency + 1
    osc2.frequency.value = frequency - 2

    // Fade out
    volume.gain.setValueAtTime(optVol || 0.01, startTime + duration - 0.05)
    volume.gain.linearRampToValueAtTime(0.00001, startTime + duration)

    // Start oscillators
    osc1.start(startTime)
    osc2.start(startTime)
    // Stop oscillators
    osc1.stop(startTime + duration)
    osc2.stop(startTime + duration)
  },

  background () {
    if (this.audioCues) {
      const now = this.context.currentTime
      this.playNote(493.883, now, 0.116)
      this.playNote(659.255, now + 0.116, 0.232)
      this.loopFootSteps()
    }
  },

  loopFootSteps () {
    if (this.audioCues && !this.bgSoundIntervalId) {
      this.bgSoundIntervalId = setInterval(function () {
        this.playNote(73.42, this.context.currentTime, 0.05, 0.16)
        this.playNote(69.30, this.context.currentTime + 0.116, 0.116, 0.16)
      }.bind(this), 280)
    }
  },

  cancelFootSteps () {
    if (this.audioCues && this.bgSoundIntervalId) {
      clearInterval(this.bgSoundIntervalId)
      this.bgSoundIntervalId = null
      this.playNote(103.83, this.context.currentTime, 0.232, 0.02)
      this.playNote(116.54, this.context.currentTime + 0.116, 0.232, 0.02)
    }
  },

  collect () {
    if (this.audioCues) {
      this.cancelFootSteps()
      const now = this.context.currentTime
      this.playNote(830.61, now, 0.116)
      this.playNote(1318.51, now + 0.116, 0.232)
    }
  },

  jump () {
    if (this.audioCues) {
      const now = this.context.currentTime
      this.playNote(659.25, now, 0.116, 0.3, -0.6)
      this.playNote(880, now + 0.116, 0.232, 0.3, -0.6)
    }
  }
}
