// Copyright 2021 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { loadTimeData } from './load_time_data_deprecated'
import { Trex } from './game/trex'
import { DistanceMeter } from './game/distanceMeter'
import { Horizon } from './game/horizon'
import { GeneratedSoundFx } from './game/generatedSoundFx'
import { GameOverPanel } from './game/gameover'
import { announcePhrase, decodeBase64ToArrayBuffer, getA11yString, getTimeStamp, vibrate } from './game/utils'

/* @const
 * Add matching sprite definition and config to Runner.spriteDefinitionByType.
 */
export const GAME_TYPE = []

/**
 * Obstacle definitions.
 * minGap: minimum pixel space between obstacles.
 * multipleSpeed: Speed at which multiples are allowed.
 * speedOffset: speed faster / slower than the horizon.
 * minSpeed: Minimum speed which the obstacle can make an appearance.
 *
 * @typedef {{
 *   type: string,
 *   width: number,
 *   height: number,
 *   yPos: number,
 *   multipleSpeed: number,
 *   minGap: number,
 *   minSpeed: number,
 *   collisionBoxes: Array<CollisionBox>,
 * }}
 */
export let ObstacleType

export const HIDDEN_CLASS = 'hidden'

/**
 * T-Rex runner.
 * @param {string} outerContainerId Outer containing element id.
 * @param {!Object=} optConfig
 * @constructor
 * @implements {EventListener}
 * @export
 */
export function Runner (outerContainerId, optConfig) {
  // Singleton
  if (Runner.instance_) {
    return Runner.instance_
  }
  Runner.instance_ = this

  Runner.spriteDefinition = spriteDefinitionByType.original

  this.outerContainerEl = document.querySelector(outerContainerId)
  this.containerEl = null
  this.snackbarEl = null
  // A div to intercept touch events. Only set while (playing && useTouch).
  this.touchController = null

  this.config = optConfig || Object.assign(Runner.config, Runner.normalConfig)
  // Logical dimensions of the container.
  this.dimensions = Runner.defaultDimensions

  this.gameType = null

  this.altGameImageSprite = null
  this.altGameModeActive = false
  this.altGameModeFlashTimer = null
  this.fadeInTimer = 0

  this.canvas = null
  this.canvasCtx = null

  this.tRex = null

  this.distanceMeter = null
  this.distanceRan = 0

  this.highestScore = 0
  this.syncHighestScore = false

  this.time = 0
  this.runningTime = 0
  this.msPerFrame = 1000 / FPS
  this.currentSpeed = this.config.SPEED
  Runner.slowDown = false

  this.obstacles = []

  this.activated = false // Whether the easter egg has been activated.
  this.playing = false // Whether the game is currently in play state.
  this.crashed = false
  this.paused = false
  this.inverted = false
  this.invertTimer = 0
  this.resizeTimerId_ = null

  this.playCount = 0

  // Sound FX.
  this.audioBuffer = null

  /** @type {Object} */
  this.soundFx = {}
  this.generatedSoundFx = null

  // Global web audio context for playing sounds.
  this.audioContext = null

  // Images.
  this.images = {}
  this.imagesLoaded = 0

  // Gamepad state.
  this.pollingGamepads = false
  this.gamepadIndex = undefined
  this.previousGamepad = null

  if (this.isDisabled()) {
    this.setupDisabledRunner()
  } else {
    if (Runner.isAltGameModeEnabled()) {
      this.initAltGameType()
      Runner.gameType = this.gameType
    }
    this.loadImages()

    this.initializeEasterEggHighScore = this.initializeHighScore.bind(this)
  }
}

/**
 * Default game width.
 * @const
 */
export const DEFAULT_WIDTH = 600

/**
 * Frames per second.
 * @const
 */
export const FPS = 60

/** @const */
export const IS_HIDPI = window.devicePixelRatio > 1

/** @const */
export const IS_IOS = /CriOS/.test(window.navigator.userAgent)

/** @const */
export const IS_MOBILE = /Android/.test(window.navigator.userAgent) || IS_IOS

/** @const */
export const IS_RTL = document.querySelector('html').dir === 'rtl'

/** @const */
export const RESOURCE_POSTFIX = 'offline-resources-'

/** @const */
export const A11Y_STRINGS = {
  ariaLabel: 'dinoGameA11yAriaLabel',
  description: 'dinoGameA11yDescription',
  gameOver: 'dinoGameA11yGameOver',
  highScore: 'dinoGameA11yHighScore',
  jump: 'dinoGameA11yJump',
  started: 'dinoGameA11yStartGame',
  speedLabel: 'dinoGameA11ySpeedToggle'
}

/**
 * T-Rex runner sprite definitions.
 */
export const spriteDefinitionByType = {
  original: {
    LDPI: {
      BACKGROUND_EL: { x: 86, y: 2 },
      CACTUS_LARGE: { x: 332, y: 2 },
      CACTUS_SMALL: { x: 228, y: 2 },
      OBSTACLE_2: { x: 332, y: 2 },
      OBSTACLE: { x: 228, y: 2 },
      CLOUD: { x: 86, y: 2 },
      HORIZON: { x: 2, y: 54 },
      MOON: { x: 484, y: 2 },
      PTERODACTYL: { x: 134, y: 2 },
      RESTART: { x: 2, y: 68 },
      TEXT_SPRITE: { x: 655, y: 2 },
      TREX: { x: 848, y: 2 },
      STAR: { x: 645, y: 2 },
      COLLECTABLE: { x: 2, y: 2 },
      ALT_GAME_END: { x: 121, y: 2 }
    },
    HDPI: {
      BACKGROUND_EL: { x: 166, y: 2 },
      CACTUS_LARGE: { x: 652, y: 2 },
      CACTUS_SMALL: { x: 446, y: 2 },
      OBSTACLE_2: { x: 652, y: 2 },
      OBSTACLE: { x: 446, y: 2 },
      CLOUD: { x: 166, y: 2 },
      HORIZON: { x: 2, y: 104 },
      MOON: { x: 954, y: 2 },
      PTERODACTYL: { x: 260, y: 2 },
      RESTART: { x: 2, y: 130 },
      TEXT_SPRITE: { x: 1294, y: 2 },
      TREX: { x: 1678, y: 2 },
      STAR: { x: 1276, y: 2 },
      COLLECTABLE: { x: 4, y: 4 },
      ALT_GAME_END: { x: 242, y: 4 }
    },
    MAX_GAP_COEFFICIENT: 1.5,
    MAX_OBSTACLE_LENGTH: 3,
    HAS_CLOUDS: 1,
    BOTTOM_PAD: 10,
    TREX: {
      WAITING_1: { x: 44, w: 44, h: 47, xOffset: 0 },
      WAITING_2: { x: 0, w: 44, h: 47, xOffset: 0 },
      RUNNING_1: { x: 88, w: 44, h: 47, xOffset: 0 },
      RUNNING_2: { x: 132, w: 44, h: 47, xOffset: 0 },
      JUMPING: { x: 0, w: 44, h: 47, xOffset: 0 },
      CRASHED: { x: 220, w: 44, h: 47, xOffset: 0 },
      COLLISION_BOXES: [
        new CollisionBox(22, 0, 17, 16),
        new CollisionBox(1, 18, 30, 9),
        new CollisionBox(10, 35, 14, 8),
        new CollisionBox(1, 24, 29, 5),
        new CollisionBox(5, 30, 21, 4),
        new CollisionBox(9, 34, 15, 4)
      ]
    },
    /** @type {Array<ObstacleType>} */
    OBSTACLES: [
      {
        type: 'CACTUS_SMALL',
        width: 17,
        height: 35,
        yPos: 105,
        multipleSpeed: 4,
        minGap: 120,
        minSpeed: 0,
        collisionBoxes: [
          new CollisionBox(0, 7, 5, 27),
          new CollisionBox(4, 0, 6, 34),
          new CollisionBox(10, 4, 7, 14)
        ]
      },
      {
        type: 'CACTUS_LARGE',
        width: 25,
        height: 50,
        yPos: 90,
        multipleSpeed: 7,
        minGap: 120,
        minSpeed: 0,
        collisionBoxes: [
          new CollisionBox(0, 12, 7, 38),
          new CollisionBox(8, 0, 7, 49),
          new CollisionBox(13, 10, 10, 38)
        ]
      },
      {
        type: 'PTERODACTYL',
        width: 46,
        height: 40,
        yPos: [100, 75, 50], // Variable height.
        yPosMobile: [100, 50], // Variable height mobile.
        multipleSpeed: 999,
        minSpeed: 8.5,
        minGap: 150,
        collisionBoxes: [
          new CollisionBox(15, 15, 16, 5),
          new CollisionBox(18, 21, 24, 6),
          new CollisionBox(2, 14, 4, 3),
          new CollisionBox(6, 10, 4, 7),
          new CollisionBox(10, 8, 6, 9)
        ],
        numFrames: 2,
        frameRate: 1000 / 6,
        speedOffset: 0.8
      }
    ],
    BACKGROUND_EL: {
      CLOUD: {
        HEIGHT: 24,
        MAX_CLOUD_GAP: 400,
        MAX_SKY_LEVEL: 30,
        MIN_CLOUD_GAP: 100,
        MIN_SKY_LEVEL: 71,
        OFFSET: 4,
        WIDTH: 46,
        X_POS: 1,
        Y_POS: 120
      }
    },
    BACKGROUND_EL_CONFIG: {
      MAX_BG_ELS: 1,
      MAX_GAP: 400,
      MIN_GAP: 100,
      POS: 0,
      SPEED: 0.5,
      Y_POS: 125
    },
    LINES: [
      {
        SOURCE_X: 2,
        SOURCE_Y: 52,
        WIDTH: 600,
        HEIGHT: 12,
        YPOS: 127
      }
    ]
  }
}

/**
 * Default game configuration.
 * Shared config for all  versions of the game. Additional parameters are
 * defined in Runner.normalConfig and Runner.slowConfig.
 */
Runner.config = {
  AUDIOCUE_PROXIMITY_THRESHOLD: 190,
  AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y: 250,
  BG_CLOUD_SPEED: 0.2,
  BOTTOM_PAD: 10,
  // Scroll Y threshold at which the game can be activated.
  CANVAS_IN_VIEW_OFFSET: -10,
  CLEAR_TIME: 3000,
  CLOUD_FREQUENCY: 0.5,
  FADE_DURATION: 1,
  FLASH_DURATION: 1000,
  GAMEOVER_CLEAR_TIME: 1200,
  INITIAL_JUMP_VELOCITY: 12,
  INVERT_FADE_DURATION: 12000,
  MAX_BLINK_COUNT: 3,
  MAX_CLOUDS: 6,
  MAX_OBSTACLE_LENGTH: 3,
  MAX_OBSTACLE_DUPLICATION: 2,
  RESOURCE_TEMPLATE_ID: 'audio-resources',
  SPEED: 6,
  SPEED_DROP_COEFFICIENT: 3,
  ARCADE_MODE_INITIAL_TOP_POSITION: 35,
  ARCADE_MODE_TOP_POSITION_PERCENT: 0.1
}

Runner.normalConfig = {
  ACCELERATION: 0.001,
  AUDIOCUE_PROXIMITY_THRESHOLD: 190,
  AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y: 250,
  GAP_COEFFICIENT: 0.6,
  INVERT_DISTANCE: 200,
  MAX_SPEED: 13,
  MOBILE_SPEED_COEFFICIENT: 1.2,
  SPEED: 6
}

Runner.slowConfig = {
  ACCELERATION: 0.0005,
  AUDIOCUE_PROXIMITY_THRESHOLD: 170,
  AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y: 220,
  GAP_COEFFICIENT: 0.3,
  INVERT_DISTANCE: 350,
  MAX_SPEED: 9,
  MOBILE_SPEED_COEFFICIENT: 1.5,
  SPEED: 4.2
}

/**
 * Default dimensions.
 */
Runner.defaultDimensions = {
  WIDTH: DEFAULT_WIDTH,
  HEIGHT: 150
}

/**
 * CSS class names.
 * @enum {string}
 */
Runner.classes = {
  ARCADE_MODE: 'arcade-mode',
  CANVAS: 'runner-canvas',
  CONTAINER: 'runner-container',
  CRASHED: 'crashed',
  ICON: 'icon-offline',
  INVERTED: 'inverted',
  NIGHT: 'night',
  SNACKBAR: 'snackbar',
  SNACKBAR_SHOW: 'snackbar-show',
  TOUCH_CONTROLLER: 'controller'
}

/**
 * Sound FX. Reference to the ID of the audio tag on interstitial page.
 * @enum {string}
 */
Runner.sounds = {
  BUTTON_PRESS: 'offline-sound-press',
  HIT: 'offline-sound-hit',
  SCORE: 'offline-sound-reached'
}

/**
 * Key code mapping.
 * @enum {Object}
 */
Runner.keycodes = {
  JUMP: { 38: 1, 32: 1 }, // Up, spacebar
  DUCK: { 40: 1 }, // Down
  RESTART: { 13: 1 } // Enter
}

/**
 * Runner event names.
 * @enum {string}
 */
Runner.events = {
  ANIM_END: 'webkitAnimationEnd',
  CLICK: 'click',
  KEYDOWN: 'keydown',
  KEYUP: 'keyup',
  POINTERDOWN: 'pointerdown',
  POINTERUP: 'pointerup',
  RESIZE: 'resize',
  TOUCHEND: 'touchend',
  TOUCHSTART: 'touchstart',
  VISIBILITY: 'visibilitychange',
  BLUR: 'blur',
  FOCUS: 'focus',
  LOAD: 'load',
  GAMEPADCONNECTED: 'gamepadconnected'
}

Runner.prototype = {
  /**
   * Initialize alternative game type.
   */
  initAltGameType () {
    if (GAME_TYPE.length > 0) {
      this.gameType = loadTimeData && loadTimeData.valueExists('altGameType')
        ? GAME_TYPE[parseInt(loadTimeData.getValue('altGameType'), 10) - 1]
        : ''
    }
  }, /**
   * Whether the easter egg has been disabled. CrOS enterprise enrolled devices.
   * @return {boolean}
   */
  isDisabled () {
    return loadTimeData && loadTimeData.valueExists('disabledEasterEgg')
  }, /**
   * For disabled instances, set up a snackbar with the disabled message.
   */
  setupDisabledRunner () {
    this.containerEl = document.createElement('div')
    this.containerEl.className = Runner.classes.SNACKBAR
    this.containerEl.textContent = loadTimeData.getValue('disabledEasterEgg')
    this.outerContainerEl.appendChild(this.containerEl)

    // Show notification when the activation key is pressed.
    document.addEventListener(Runner.events.KEYDOWN, function (e) {
      if (Runner.keycodes.JUMP[e.keyCode]) {
        this.containerEl.classList.add(Runner.classes.SNACKBAR_SHOW)
        document.querySelector('.icon').classList.add('icon-disabled')
      }
    }.bind(this))
  }, /**
   * Setting individual settings for debugging.
   * @param {string} setting
   * @param {number|string} value
   */
  updateConfigSetting (setting, value) {
    if (setting in this.config && value !== undefined) {
      this.config[setting] = value

      switch (setting) {
        case 'GRAVITY':
        case 'MIN_JUMP_HEIGHT':
        case 'SPEED_DROP_COEFFICIENT':
          this.tRex.config[setting] = value
          break
        case 'INITIAL_JUMP_VELOCITY':
          this.tRex.setJumpVelocity(value)
          break
        case 'SPEED':
          this.setSpeed(/** @type {number} */ (value))
          break
      }
    }
  }, /**
   * Creates an on page image element from the base 64 encoded string source.
   * @param {string} resourceName Name in data object,
   * @return {HTMLImageElement} The created element.
   */
  createImageElement (resourceName) {
    const imgSrc = loadTimeData && loadTimeData.valueExists(resourceName)
      ? loadTimeData.getString(resourceName)
      : null

    if (imgSrc) {
      const el =
        /** @type {HTMLImageElement} */ (document.createElement('img'))
      el.id = resourceName
      el.src = imgSrc
      document.getElementById('offline-resources').appendChild(el)
      return el
    }
    return null
  }, /**
   * Cache the appropriate image sprite from the page and get the sprite sheet
   * definition.
   */
  loadImages () {
    let scale = '1x'
    this.spriteDef = Runner.spriteDefinition.LDPI
    if (IS_HIDPI) {
      scale = '2x'
      this.spriteDef = Runner.spriteDefinition.HDPI
    }

    Runner.imageSprite = /** @type {HTMLImageElement} */
      (document.getElementById(RESOURCE_POSTFIX + scale))

    if (this.gameType) {
      Runner.altGameImageSprite = /** @type {HTMLImageElement} */
        (this.createImageElement('altGameSpecificImage' + scale))
      Runner.altCommonImageSprite = /** @type {HTMLImageElement} */
        (this.createImageElement('altGameCommonImage' + scale))
    }
    Runner.origImageSprite = Runner.imageSprite

    // Disable the alt game mode if the sprites can't be loaded.
    if (!Runner.altGameImageSprite || !Runner.altCommonImageSprite) {
      Runner.isAltGameModeEnabled = () => false
      this.altGameModeActive = false
    }

    if (Runner.imageSprite.complete) {
      this.init()
    } else {
      // If the images are not yet loaded, add a listener.
      Runner.imageSprite.addEventListener(Runner.events.LOAD,
        this.init.bind(this))
    }
  }, /**
   * Load and decode base 64 encoded sounds.
   */
  loadSounds () {
    if (!IS_IOS) {
      this.audioContext = new AudioContext()

      const resourceTemplate =
        document.getElementById(this.config.RESOURCE_TEMPLATE_ID).content

      for (const sound in Runner.sounds) {
        let soundSrc =
          resourceTemplate.getElementById(Runner.sounds[sound]).src
        soundSrc = soundSrc.substr(soundSrc.indexOf(',') + 1)
        const buffer = decodeBase64ToArrayBuffer(soundSrc)

        // Async, so no guarantee of order in array.
        this.audioContext.decodeAudioData(buffer, function (index, audioData) {
          this.soundFx[index] = audioData
        }.bind(this, sound))
      }
    }
  }, /**
   * Sets the game speed. Adjust the speed accordingly if on a smaller screen.
   * @param {number=} optSpeed
   */
  setSpeed (optSpeed) {
    const speed = optSpeed || this.currentSpeed

    // Reduce the speed on smaller mobile screens.
    if (this.dimensions.WIDTH < DEFAULT_WIDTH) {
      const mobileSpeed = Runner.slowDown
        ? speed
        : speed * this.dimensions.WIDTH /
        DEFAULT_WIDTH * this.config.MOBILE_SPEED_COEFFICIENT
      this.currentSpeed = mobileSpeed > speed ? speed : mobileSpeed
    } else if (optSpeed) {
      this.currentSpeed = optSpeed
    }
  }, /**
   * Game initialiser.
   */
  init () {
    // Hide the static icon.
    document.querySelector('.' + Runner.classes.ICON).style.visibility =
      'hidden'

    this.adjustDimensions()
    this.setSpeed()

    const ariaLabel = getA11yString(A11Y_STRINGS.ariaLabel)
    this.containerEl = document.createElement('div')
    this.containerEl.setAttribute('role', IS_MOBILE ? 'button' : 'application')
    this.containerEl.setAttribute('tabindex', '0')
    this.containerEl.setAttribute('title', ariaLabel)

    this.containerEl.className = Runner.classes.CONTAINER

    // Player canvas container.
    this.canvas = createCanvas(this.containerEl, this.dimensions.WIDTH,
      this.dimensions.HEIGHT)

    // Live region for game status updates.
    this.a11yStatusEl = document.createElement('span')
    this.a11yStatusEl.className = 'offline-runner-live-region'
    this.a11yStatusEl.setAttribute('aria-live', 'assertive')
    this.a11yStatusEl.textContent = ''
    Runner.a11yStatusEl = this.a11yStatusEl

    // Add checkbox to slow down the game.
    this.slowSpeedCheckboxLabel = document.createElement('label')
    this.slowSpeedCheckboxLabel.className = 'slow-speed-option hidden'
    this.slowSpeedCheckboxLabel.textContent =
      getA11yString(A11Y_STRINGS.speedLabel)

    this.slowSpeedCheckbox = document.createElement('input')
    this.slowSpeedCheckbox.setAttribute('type', 'checkbox')
    this.slowSpeedCheckbox.setAttribute(
      'title', getA11yString(A11Y_STRINGS.speedLabel))
    this.slowSpeedCheckbox.setAttribute('tabindex', '0')
    this.slowSpeedCheckbox.setAttribute('checked', 'checked')

    this.slowSpeedToggleEl = document.createElement('span')
    this.slowSpeedToggleEl.className = 'slow-speed-toggle'

    this.slowSpeedCheckboxLabel.appendChild(this.slowSpeedCheckbox)
    this.slowSpeedCheckboxLabel.appendChild(this.slowSpeedToggleEl)

    if (IS_IOS) {
      this.outerContainerEl.appendChild(this.a11yStatusEl)
    } else {
      this.containerEl.appendChild(this.a11yStatusEl)
    }

    announcePhrase(getA11yString(A11Y_STRINGS.description))

    this.generatedSoundFx = new GeneratedSoundFx()

    this.canvasCtx =
      /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext('2d'))
    this.canvasCtx.fillStyle = '#f7f7f7'
    this.canvasCtx.fill()
    Runner.updateCanvasScaling(this.canvas)

    // Horizon contains clouds, obstacles and the ground.
    this.horizon = new Horizon(this.canvas, this.spriteDef, this.dimensions,
      this.config.GAP_COEFFICIENT)

    // Distance meter
    this.distanceMeter = new DistanceMeter(this.canvas,
      this.spriteDef.TEXT_SPRITE, this.dimensions.WIDTH)

    // Draw t-rex
    this.tRex = new Trex(this.canvas, this.spriteDef.TREX)

    this.outerContainerEl.appendChild(this.containerEl)
    this.outerContainerEl.appendChild(this.slowSpeedCheckboxLabel)

    this.startListening()
    this.update()

    window.addEventListener(Runner.events.RESIZE,
      this.debounceResize.bind(this))

    // Handle dark mode
    const darkModeMediaQuery =
      window.matchMedia('(prefers-color-scheme: dark)')
    this.isDarkMode = darkModeMediaQuery && darkModeMediaQuery.matches
    darkModeMediaQuery.addListener((e) => {
      this.isDarkMode = e.matches
    })
  }, /**
   * Create the touch controller. A div that covers whole screen.
   */
  createTouchController () {
    this.touchController = document.createElement('div')
    this.touchController.className = Runner.classes.TOUCH_CONTROLLER
    this.touchController.addEventListener(Runner.events.TOUCHSTART, this)
    this.touchController.addEventListener(Runner.events.TOUCHEND, this)
    this.outerContainerEl.appendChild(this.touchController)
  }, /**
   * Debounce the resize event.
   */
  debounceResize () {
    if (!this.resizeTimerId_) {
      this.resizeTimerId_ =
        setInterval(this.adjustDimensions.bind(this), 250)
    }
  }, /**
   * Adjust game space dimensions on resize.
   */
  adjustDimensions () {
    clearInterval(this.resizeTimerId_)
    this.resizeTimerId_ = null

    const boxStyles = window.getComputedStyle(this.outerContainerEl)
    const padding = Number(boxStyles.paddingLeft.substr(0,
      boxStyles.paddingLeft.length - 2))

    this.dimensions.WIDTH = this.outerContainerEl.offsetWidth - padding * 2
    if (this.isArcadeMode()) {
      this.dimensions.WIDTH = Math.min(DEFAULT_WIDTH, this.dimensions.WIDTH)
      if (this.activated) {
        this.setArcadeModeContainerScale()
      }
    }

    // Redraw the elements back onto the canvas.
    if (this.canvas) {
      this.canvas.width = this.dimensions.WIDTH
      this.canvas.height = this.dimensions.HEIGHT

      Runner.updateCanvasScaling(this.canvas)

      this.distanceMeter.calcXPos(this.dimensions.WIDTH)
      this.clearCanvas()
      this.horizon.update(0, 0, true)
      this.tRex.update(0)

      // Outer container and distance meter.
      if (this.playing || this.crashed || this.paused) {
        this.containerEl.style.width = this.dimensions.WIDTH + 'px'
        this.containerEl.style.height = this.dimensions.HEIGHT + 'px'
        this.distanceMeter.update(0, Math.ceil(this.distanceRan))
        this.stop()
      } else {
        this.tRex.draw(0, 0)
      }

      // Game over panel.
      if (this.crashed && this.gameOverPanel) {
        this.gameOverPanel.updateDimensions(this.dimensions.WIDTH)
        this.gameOverPanel.draw(this.altGameModeActive, this.tRex)
      }
    }
  }, /**
   * Play the game intro.
   * Canvas container width expands out to the full width.
   */
  playIntro () {
    if (!this.activated && !this.crashed) {
      this.playingIntro = true
      this.tRex.playingIntro = true

      // CSS animation definition.
      const keyframes = '@-webkit-keyframes intro { ' +
        'from { width:' + Trex.config.WIDTH + 'px }' +
        'to { width: ' + this.dimensions.WIDTH + 'px }' +
        '}'
      document.styleSheets[0].insertRule(keyframes, 0)

      this.containerEl.addEventListener(Runner.events.ANIM_END,
        this.startGame.bind(this))

      this.containerEl.style.webkitAnimation = 'intro .4s ease-out 1 both'
      this.containerEl.style.width = this.dimensions.WIDTH + 'px'

      this.setPlayStatus(true)
      this.activated = true
    } else if (this.crashed) {
      this.restart()
    }
  }, /**
   * Update the game status to started.
   */
  startGame () {
    if (this.isArcadeMode()) {
      this.setArcadeMode()
    }
    this.toggleSpeed()
    this.runningTime = 0
    this.playingIntro = false
    this.tRex.playingIntro = false
    this.containerEl.style.webkitAnimation = ''
    this.playCount++
    this.generatedSoundFx.background()
    announcePhrase(getA11yString(A11Y_STRINGS.started))

    if (Runner.audioCues) {
      this.containerEl.setAttribute('title', getA11yString(A11Y_STRINGS.jump))
    }

    // Handle tabbing off the page. Pause the current game.
    document.addEventListener(Runner.events.VISIBILITY,
      this.onVisibilityChange.bind(this))

    window.addEventListener(Runner.events.BLUR,
      this.onVisibilityChange.bind(this))

    window.addEventListener(Runner.events.FOCUS,
      this.onVisibilityChange.bind(this))
  },
  clearCanvas () {
    this.canvasCtx.clearRect(0, 0, this.dimensions.WIDTH,
      this.dimensions.HEIGHT)
  }, /**
   * Checks whether the canvas area is in the viewport of the browser
   * through the current scroll position.
   * @return boolean.
   */
  isCanvasInView () {
    return this.containerEl.getBoundingClientRect().top >
      Runner.config.CANVAS_IN_VIEW_OFFSET
  }, /**
   * Enable the alt game mode. Switching out the sprites.
   */
  enableAltGameMode () {
    Runner.imageSprite = Runner.altGameImageSprite
    Runner.spriteDefinition = Runner.spriteDefinitionByType[Runner.gameType]

    if (IS_HIDPI) {
      this.spriteDef = Runner.spriteDefinition.HDPI
    } else {
      this.spriteDef = Runner.spriteDefinition.LDPI
    }

    this.altGameModeActive = true
    this.tRex.enableAltGameMode(this.spriteDef.TREX)
    this.horizon.enableAltGameMode(this.spriteDef)
    this.generatedSoundFx.background()
  }, /**
   * Update the game frame and schedules the next one.
   */
  update () {
    this.updatePending = false

    const now = getTimeStamp()
    let deltaTime = now - (this.time || now)

    // Flashing when switching game modes.
    if (this.altGameModeFlashTimer < 0 || this.altGameModeFlashTimer === 0) {
      this.altGameModeFlashTimer = null
      this.tRex.setFlashing(false)
      this.enableAltGameMode()
    } else if (this.altGameModeFlashTimer > 0) {
      this.altGameModeFlashTimer -= deltaTime
      this.tRex.update(deltaTime)
      deltaTime = 0
    }

    this.time = now

    if (this.playing) {
      this.clearCanvas()

      // Additional fade in - Prevents jump when switching sprites
      if (this.altGameModeActive &&
        this.fadeInTimer <= this.config.FADE_DURATION) {
        this.fadeInTimer += deltaTime / 1000
        this.canvasCtx.globalAlpha = this.fadeInTimer
      } else {
        this.canvasCtx.globalAlpha = 1
      }

      if (this.tRex.jumping) {
        this.tRex.updateJump(deltaTime)
      }

      this.runningTime += deltaTime
      const hasObstacles = this.runningTime > this.config.CLEAR_TIME

      // First jump triggers the intro.
      if (this.tRex.jumpCount === 1 && !this.playingIntro) {
        this.playIntro()
      }

      // The horizon doesn't move until the intro is over.
      if (this.playingIntro) {
        this.horizon.update(0, this.currentSpeed, hasObstacles)
      } else if (!this.crashed) {
        const showNightMode = this.isDarkMode ^ this.inverted
        deltaTime = !this.activated ? 0 : deltaTime
        this.horizon.update(deltaTime, this.currentSpeed, hasObstacles, showNightMode)
      }

      // Check for collisions.
      let collision = hasObstacles &&
        checkForCollision(this.horizon.obstacles[0], this.tRex)

      // For a11y, audio cues.
      if (Runner.audioCues && hasObstacles) {
        const jumpObstacle =
          this.horizon.obstacles[0].typeConfig.type !== 'COLLECTABLE'

        if (!this.horizon.obstacles[0].jumpAlerted) {
          const threshold = Runner.isMobileMouseInput
            ? Runner.config.AUDIOCUE_PROXIMITY_THRESHOLD_MOBILE_A11Y
            : Runner.config.AUDIOCUE_PROXIMITY_THRESHOLD
          const adjProximityThreshold = threshold +
            (threshold * Math.log10(this.currentSpeed / Runner.config.SPEED))

          if (this.horizon.obstacles[0].xPos < adjProximityThreshold) {
            if (jumpObstacle) {
              this.generatedSoundFx.jump()
            }
            this.horizon.obstacles[0].jumpAlerted = true
          }
        }
      }

      // Activated alt game mode.
      if (Runner.isAltGameModeEnabled() && collision &&
        this.horizon.obstacles[0].typeConfig.type === 'COLLECTABLE') {
        this.horizon.removeFirstObstacle()
        this.tRex.setFlashing(true)
        collision = false
        this.altGameModeFlashTimer = this.config.FLASH_DURATION
        this.runningTime = 0
        this.generatedSoundFx.collect()
      }

      if (!collision) {
        this.distanceRan += this.currentSpeed * deltaTime / this.msPerFrame

        if (this.currentSpeed < this.config.MAX_SPEED) {
          this.currentSpeed += this.config.ACCELERATION
        }
      } else {
        this.gameOver()
      }

      const playAchievementSound = this.distanceMeter.update(deltaTime,
        Math.ceil(this.distanceRan))

      if (!Runner.audioCues && playAchievementSound) {
        this.playSound(this.soundFx.SCORE)
      }

      // Night mode.
      if (!Runner.isAltGameModeEnabled()) {
        if (this.invertTimer > this.config.INVERT_FADE_DURATION) {
          this.invertTimer = 0
          this.invertTrigger = false
          this.invert(false)
        } else if (this.invertTimer) {
          this.invertTimer += deltaTime
        } else {
          const actualDistance =
            this.distanceMeter.getActualDistance(Math.ceil(this.distanceRan))

          if (actualDistance > 0) {
            this.invertTrigger =
              !(actualDistance % this.config.INVERT_DISTANCE)

            if (this.invertTrigger && this.invertTimer === 0) {
              this.invertTimer += deltaTime
              this.invert(false)
            }
          }
        }
      }
    }

    if (this.playing || (!this.activated &&
      this.tRex.blinkCount < Runner.config.MAX_BLINK_COUNT)) {
      this.tRex.update(deltaTime)
      this.scheduleNextUpdate()
    }
  }, /**
   * Event handler.
   * @param {Event} e
   */
  handleEvent (e) {
    return (function (evtType, events) {
      switch (evtType) {
        case events.KEYDOWN:
        case events.TOUCHSTART:
        case events.POINTERDOWN:
          this.onKeyDown(e)
          break
        case events.KEYUP:
        case events.TOUCHEND:
        case events.POINTERUP:
          this.onKeyUp(e)
          break
        case events.GAMEPADCONNECTED:
          this.onGamepadConnected(e)
          break
      }
    }.bind(this))(e.type, Runner.events)
  }, /**
   * Initialize audio cues if activated by focus on the canvas element.
   * @param {Event} e
   */
  handleCanvasKeyPress (e) {
    if (!this.activated && !Runner.audioCues) {
      this.toggleSpeed()
      Runner.audioCues = true
      this.generatedSoundFx.init()
      Runner.generatedSoundFx = this.generatedSoundFx
      Runner.config.CLEAR_TIME *= 1.2
    } else if (e.keyCode && Runner.keycodes.JUMP[e.keyCode]) {
      this.onKeyDown(e)
    }
  }, /**
   * Prevent space key press from scrolling.
   * @param {Event} e
   */
  preventScrolling (e) {
    if (e.keyCode === 32) {
      e.preventDefault()
    }
  }, /**
   * Toggle speed setting if toggle is shown.
   */
  toggleSpeed () {
    if (Runner.audioCues) {
      const speedChange = Runner.slowDown !== this.slowSpeedCheckbox.checked

      if (speedChange) {
        Runner.slowDown = this.slowSpeedCheckbox.checked
        const updatedConfig =
          Runner.slowDown ? Runner.slowConfig : Runner.normalConfig

        Runner.config = Object.assign(Runner.config, updatedConfig)
        this.currentSpeed = updatedConfig.SPEED
        this.tRex.enableSlowConfig()
        this.horizon.adjustObstacleSpeed()
      }
      if (this.playing) {
        this.disableSpeedToggle(true)
      }
    }
  }, /**
   * Show the speed toggle.
   * From focus event or when audio cues are activated.
   * @param {Event=} e
   */
  showSpeedToggle (e) {
    const isFocusEvent = e && e.type === 'focus'
    if (Runner.audioCues || isFocusEvent) {
      this.slowSpeedCheckboxLabel.classList.toggle(
        HIDDEN_CLASS, isFocusEvent ? false : !this.crashed)
    }
  }, /**
   * Disable the speed toggle.
   * @param {boolean} disable
   */
  disableSpeedToggle (disable) {
    if (disable) {
      this.slowSpeedCheckbox.setAttribute('disabled', 'disabled')
    } else {
      this.slowSpeedCheckbox.removeAttribute('disabled')
    }
  }, /**
   * Bind relevant key / mouse / touch listeners.
   */
  startListening () {
    // A11y keyboard / screen reader activation.
    this.containerEl.addEventListener(
      Runner.events.KEYDOWN, this.handleCanvasKeyPress.bind(this))
    if (!IS_MOBILE) {
      this.containerEl.addEventListener(
        Runner.events.FOCUS, this.showSpeedToggle.bind(this))
    }
    this.canvas.addEventListener(
      Runner.events.KEYDOWN, this.preventScrolling.bind(this))
    this.canvas.addEventListener(
      Runner.events.KEYUP, this.preventScrolling.bind(this))

    // Keys.
    document.addEventListener(Runner.events.KEYDOWN, this)
    document.addEventListener(Runner.events.KEYUP, this)

    // Touch / pointer.
    this.containerEl.addEventListener(Runner.events.TOUCHSTART, this)
    document.addEventListener(Runner.events.POINTERDOWN, this)
    document.addEventListener(Runner.events.POINTERUP, this)

    if (this.isArcadeMode()) {
      // Gamepad
      window.addEventListener(Runner.events.GAMEPADCONNECTED, this)
    }
  }, /**
   * Remove all listeners.
   */
  stopListening () {
    document.removeEventListener(Runner.events.KEYDOWN, this)
    document.removeEventListener(Runner.events.KEYUP, this)

    if (this.touchController) {
      this.touchController.removeEventListener(Runner.events.TOUCHSTART, this)
      this.touchController.removeEventListener(Runner.events.TOUCHEND, this)
    }

    this.containerEl.removeEventListener(Runner.events.TOUCHSTART, this)
    document.removeEventListener(Runner.events.POINTERDOWN, this)
    document.removeEventListener(Runner.events.POINTERUP, this)

    if (this.isArcadeMode()) {
      window.removeEventListener(Runner.events.GAMEPADCONNECTED, this)
    }
  }, /**
   * Process keydown.
   * @param {Event} e
   */
  onKeyDown (e) {
    // Prevent native page scrolling whilst tapping on mobile.
    if (IS_MOBILE && this.playing) {
      e.preventDefault()
    }

    if (this.isCanvasInView()) {
      // Allow toggling of speed toggle.
      if (Runner.keycodes.JUMP[e.keyCode] &&
        e.target === this.slowSpeedCheckbox) {
        return
      }

      if (!this.crashed && !this.paused) {
        // For a11y, screen reader activation.
        const isMobileMouseInput =
          (IS_MOBILE && e.type === Runner.events.POINTERDOWN && e.pointerType === 'mouse' && e.target === this.containerEl) ||
          (IS_IOS && e.pointerType === 'touch' && document.activeElement === this.containerEl)

        if (Runner.keycodes.JUMP[e.keyCode] ||
          e.type === Runner.events.TOUCHSTART || isMobileMouseInput ||
          (Runner.keycodes.DUCK[e.keyCode] && this.altGameModeActive)) {
          e.preventDefault()
          // Starting the game for the first time.
          if (!this.playing) {
            // Started by touch so create a touch controller.
            if (!this.touchController && e.type === Runner.events.TOUCHSTART) {
              this.createTouchController()
            }

            if (isMobileMouseInput) {
              this.handleCanvasKeyPress(e)
            }
            this.loadSounds()
            this.setPlayStatus(true)
            this.update()
            if (window.errorPageController) {
              window.errorPageController.trackEasterEgg()
            }
          }
          // Start jump.
          if (!this.tRex.jumping && !this.tRex.ducking) {
            if (Runner.audioCues) {
              this.generatedSoundFx.cancelFootSteps()
            } else {
              this.playSound(this.soundFx.BUTTON_PRESS)
            }
            this.tRex.startJump(this.currentSpeed)
          }
          // Ducking is disabled on alt game modes.
        } else if (
          !this.altGameModeActive && this.playing &&
          Runner.keycodes.DUCK[e.keyCode]) {
          e.preventDefault()
          if (this.tRex.jumping) {
            // Speed drop, activated only when jump key is not pressed.
            this.tRex.setSpeedDrop()
          } else if (!this.tRex.jumping && !this.tRex.ducking) {
            // Duck.
            this.tRex.setDuck(true)
          }
        }
      }
    }
  }, /**
   * Process key up.
   * @param {Event} e
   */
  onKeyUp (e) {
    const keyCode = String(e.keyCode)
    const isjumpKey = Runner.keycodes.JUMP[keyCode] ||
      e.type === Runner.events.TOUCHEND || e.type === Runner.events.POINTERUP

    if (this.isRunning() && isjumpKey) {
      this.tRex.endJump()
    } else if (Runner.keycodes.DUCK[keyCode]) {
      this.tRex.speedDrop = false
      this.tRex.setDuck(false)
    } else if (this.crashed) {
      // Check that enough time has elapsed before allowing jump key to restart.
      const deltaTime = getTimeStamp() - this.time

      if (this.isCanvasInView() &&
        (Runner.keycodes.RESTART[keyCode] || this.isLeftClickOnCanvas(e) ||
          (deltaTime >= this.config.GAMEOVER_CLEAR_TIME &&
            Runner.keycodes.JUMP[keyCode]))) {
        this.handleGameOverClicks(e)
      }
    } else if (this.paused && isjumpKey) {
      // Reset the jump state
      this.tRex.reset()
      this.play()
    }
  }, /**
   * Process gamepad connected event.
   * @param {Event} e
   */
  onGamepadConnected (e) {
    if (!this.pollingGamepads) {
      this.pollGamepadState()
    }
  }, /**
   * rAF loop for gamepad polling.
   */
  pollGamepadState () {
    const gamepads = navigator.getGamepads()
    this.pollActiveGamepad(gamepads)

    this.pollingGamepads = true
    requestAnimationFrame(this.pollGamepadState.bind(this))
  }, /**
   * Polls for a gamepad with the jump button pressed. If one is found this
   * becomes the "active" gamepad and all others are ignored.
   * @param {!Array<Gamepad>} gamepads
   */
  pollForActiveGamepad (gamepads) {
    for (let i = 0; i < gamepads.length; ++i) {
      if (gamepads[i] && gamepads[i].buttons.length > 0 &&
        gamepads[i].buttons[0].pressed) {
        this.gamepadIndex = i
        this.pollActiveGamepad(gamepads)
        return
      }
    }
  }, /**
   * Polls the chosen gamepad for button presses and generates KeyboardEvents
   * to integrate with the rest of the game logic.
   * @param {!Array<Gamepad>} gamepads
   */
  pollActiveGamepad (gamepads) {
    if (this.gamepadIndex === undefined) {
      this.pollForActiveGamepad(gamepads)
      return
    }

    const gamepad = gamepads[this.gamepadIndex]
    if (!gamepad) {
      this.gamepadIndex = undefined
      this.pollForActiveGamepad(gamepads)
      return
    }

    // The gamepad specification defines the typical mapping of physical buttons
    // to button indicies: https://w3c.github.io/gamepad/#remapping
    this.pollGamepadButton(gamepad, 0, 38) // Jump
    if (gamepad.buttons.length >= 2) {
      this.pollGamepadButton(gamepad, 1, 40) // Duck
    }
    if (gamepad.buttons.length >= 10) {
      this.pollGamepadButton(gamepad, 9, 13) // Restart
    }

    this.previousGamepad = gamepad
  }, /**
   * Generates a key event based on a gamepad button.
   * @param {!Gamepad} gamepad
   * @param {number} buttonIndex
   * @param {number} keyCode
   */
  pollGamepadButton (gamepad, buttonIndex, keyCode) {
    const state = gamepad.buttons[buttonIndex].pressed
    let previousState = false
    if (this.previousGamepad) {
      previousState = this.previousGamepad.buttons[buttonIndex].pressed
    }
    // Generate key events on the rising and falling edge of a button press.
    if (state !== previousState) {
      const e = new KeyboardEvent(state
        ? Runner.events.KEYDOWN
        : Runner.events.KEYUP,
      { keyCode })
      document.dispatchEvent(e)
    }
  }, /**
   * Handle interactions on the game over screen state.
   * A user is able to tap the high score twice to reset it.
   * @param {Event} e
   */
  handleGameOverClicks (e) {
    if (e.target !== this.slowSpeedCheckbox) {
      e.preventDefault()
      if (this.distanceMeter.hasClickedOnHighScore(e) && this.highestScore) {
        if (this.distanceMeter.isHighScoreFlashing()) {
          // Subsequent click, reset the high score.
          this.saveHighScore(0, true)
          this.distanceMeter.resetHighScore()
        } else {
          // First click, flash the high score.
          this.distanceMeter.startHighScoreFlashing()
        }
      } else {
        this.distanceMeter.cancelHighScoreFlashing()
        this.restart()
      }
    }
  }, /**
   * Returns whether the event was a left click on canvas.
   * On Windows right click is registered as a click.
   * @param {Event} e
   * @return {boolean}
   */
  isLeftClickOnCanvas (e) {
    return e.button != null && e.button < 2 &&
      e.type === Runner.events.POINTERUP &&
      (e.target === this.canvas ||
        (IS_MOBILE && Runner.audioCues && e.target === this.containerEl))
  }, /**
   * RequestAnimationFrame wrapper.
   */
  scheduleNextUpdate () {
    if (!this.updatePending) {
      this.updatePending = true
      this.raqId = requestAnimationFrame(this.update.bind(this))
    }
  }, /**
   * Whether the game is running.
   * @return {boolean}
   */
  isRunning () {
    return !!this.raqId
  }, /**
   * Set the initial high score as stored in the user's profile.
   * @param {number} highScore
   */
  initializeHighScore (highScore) {
    this.syncHighestScore = true
    highScore = Math.ceil(highScore)
    if (highScore < this.highestScore) {
      if (window.errorPageController) {
        window.errorPageController.updateEasterEggHighScore(this.highestScore)
      }
      return
    }
    this.highestScore = highScore
    this.distanceMeter.setHighScore(this.highestScore)
  }, /**
   * Sets the current high score and saves to the profile if available.
   * @param {number} distanceRan Total distance ran.
   * @param {boolean=} optResetScore Whether to reset the score.
   */
  saveHighScore (distanceRan, optResetScore) {
    this.highestScore = Math.ceil(distanceRan)
    this.distanceMeter.setHighScore(this.highestScore)

    // Store the new high score in the profile.
    if (this.syncHighestScore && window.errorPageController) {
      if (optResetScore) {
        window.errorPageController.resetEasterEggHighScore()
      } else {
        window.errorPageController.updateEasterEggHighScore(this.highestScore)
      }
    }
  }, /**
   * Game over state.
   */
  gameOver () {
    this.playSound(this.soundFx.HIT)
    vibrate(200)

    this.stop()
    this.crashed = true
    this.distanceMeter.achievement = false

    this.tRex.update(100, Trex.status.CRASHED)

    // Game over panel.
    if (!this.gameOverPanel) {
      const origSpriteDef = IS_HIDPI
        ? spriteDefinitionByType.original.HDPI
        : spriteDefinitionByType.original.LDPI

      if (this.canvas) {
        if (Runner.isAltGameModeEnabled) {
          this.gameOverPanel = new GameOverPanel(
            this.canvas, origSpriteDef.TEXT_SPRITE, origSpriteDef.RESTART,
            this.dimensions, origSpriteDef.ALT_GAME_END,
            this.altGameModeActive)
        } else {
          this.gameOverPanel = new GameOverPanel(
            this.canvas, origSpriteDef.TEXT_SPRITE, origSpriteDef.RESTART,
            this.dimensions)
        }
      }
    }

    this.gameOverPanel.draw(this.altGameModeActive, this.tRex)

    // Update the high score.
    if (this.distanceRan > this.highestScore) {
      this.saveHighScore(this.distanceRan)
    }

    // Reset the time clock.
    this.time = getTimeStamp()

    if (Runner.audioCues) {
      this.generatedSoundFx.stopAll()
      announcePhrase(
        getA11yString(A11Y_STRINGS.gameOver)
          .replace(
            '$1',
            this.distanceMeter.getActualDistance(this.distanceRan)
              .toString()) +
        ' ' +
        getA11yString(A11Y_STRINGS.highScore)
          .replace(
            '$1',

            this.distanceMeter.getActualDistance(this.highestScore)
              .toString()))
      this.containerEl.setAttribute(
        'title', getA11yString(A11Y_STRINGS.ariaLabel))
    }
    this.showSpeedToggle()
    this.disableSpeedToggle(false)
  },
  stop () {
    this.setPlayStatus(false)
    this.paused = true
    cancelAnimationFrame(this.raqId)
    this.raqId = 0
    this.generatedSoundFx.stopAll()
  },
  play () {
    if (!this.crashed) {
      this.setPlayStatus(true)
      this.paused = false
      this.tRex.update(0, Trex.status.RUNNING)
      this.time = getTimeStamp()
      this.update()
      this.generatedSoundFx.background()
    }
  },
  restart () {
    if (!this.raqId) {
      this.playCount++
      this.runningTime = 0
      this.setPlayStatus(true)
      this.toggleSpeed()
      this.paused = false
      this.crashed = false
      this.distanceRan = 0
      this.setSpeed(this.config.SPEED)
      this.time = getTimeStamp()
      this.containerEl.classList.remove(Runner.classes.CRASHED)
      this.clearCanvas()
      this.distanceMeter.reset()
      this.horizon.reset()
      this.tRex.reset()
      this.playSound(this.soundFx.BUTTON_PRESS)
      this.invert(true)
      this.flashTimer = null
      this.update()
      this.gameOverPanel.reset()
      this.generatedSoundFx.background()
      this.containerEl.setAttribute('title', getA11yString(A11Y_STRINGS.jump))
      announcePhrase(getA11yString(A11Y_STRINGS.started))
    }
  },
  setPlayStatus (isPlaying) {
    if (this.touchController) {
      this.touchController.classList.toggle(HIDDEN_CLASS, !isPlaying)
    }
    this.playing = isPlaying
  }, /**
   * Whether the game should go into arcade mode.
   *
   * This has been changed to allow the game mode to always be enabled.
   *
   * @return {boolean}
   */
  isArcadeMode () {
    return true
  }, /**
   * Hides offline messaging for a fullscreen game only experience.
   */
  setArcadeMode () {
    document.body.classList.add(Runner.classes.ARCADE_MODE)
    this.setArcadeModeContainerScale()
  }, /**
   * Sets the scaling for arcade mode.
   */
  setArcadeModeContainerScale () {
    const windowHeight = window.innerHeight
    const scaleHeight = windowHeight / this.dimensions.HEIGHT
    const scaleWidth = window.innerWidth / this.dimensions.WIDTH
    const scale = Math.max(1, Math.min(scaleHeight, scaleWidth))
    const scaledCanvasHeight = this.dimensions.HEIGHT * scale
    // Positions the game container at 10% of the available vertical window
    // height minus the game container height.
    const translateY = Math.ceil(Math.max(0, (windowHeight - scaledCanvasHeight -
          Runner.config.ARCADE_MODE_INITIAL_TOP_POSITION) *
        Runner.config.ARCADE_MODE_TOP_POSITION_PERCENT)) *
      window.devicePixelRatio

    const cssScale = IS_RTL ? -scale + ',' + scale : scale
    this.containerEl.style.transform =
      'scale(' + cssScale + ') translateY(' + translateY + 'px)'
  }, /**
   * Pause the game if the tab is not in focus.
   */
  onVisibilityChange (e) {
    if (document.hidden || document.webkitHidden || e.type === 'blur' ||
      document.visibilityState !== 'visible') {
      this.stop()
    } else if (!this.crashed) {
      this.tRex.reset()
      this.play()
    }
  }, /**
   * Play a sound.
   * @param {AudioBuffer} soundBuffer
   */
  playSound (soundBuffer) {
    if (soundBuffer) {
      const sourceNode = this.audioContext.createBufferSource()
      sourceNode.buffer = soundBuffer
      sourceNode.connect(this.audioContext.destination)
      sourceNode.start(0)
    }
  }, /**
   * Inverts the current page / canvas colors.
   * @param {boolean} reset Whether to reset colors.
   */
  invert (reset) {
    const htmlEl = document.firstElementChild

    if (reset) {
      /** @variation (@erikyo83) remove the "invert" class and applies a custom "night" class */
      htmlEl.classList.toggle(Runner.classes.NIGHT, false)
      this.invertTimer = 0
      this.inverted = false
    } else {
      /** @variation (@erikyo83) remove the "invert" class and applies a custom "night" class */
      this.inverted = htmlEl.classList.toggle(Runner.classes.NIGHT, this.invertTrigger)
    }
  }
}

/**
 * Updates the canvas size taking into
 * account the backing store pixel ratio and
 * the device pixel ratio.
 *
 * See article by Paul Lewis:
 * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number=} optWidth
 * @param {number=} optHeight
 * @return {boolean} Whether the canvas was scaled.
 */
Runner.updateCanvasScaling = function (canvas, optWidth, optHeight) {
  const context =
    /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'))

  // Query the various pixel ratios
  const devicePixelRatio = Math.floor(window.devicePixelRatio) || 1
  /** @suppress {missingProperties} */
  const backingStoreRatio =
    Math.floor(context.webkitBackingStorePixelRatio) || 1
  const ratio = devicePixelRatio / backingStoreRatio

  // Upscale the canvas if the two ratios don't match
  if (devicePixelRatio !== backingStoreRatio) {
    const oldWidth = optWidth || canvas.width
    const oldHeight = optHeight || canvas.height

    canvas.width = oldWidth * ratio
    canvas.height = oldHeight * ratio

    canvas.style.width = oldWidth + 'px'
    canvas.style.height = oldHeight + 'px'

    // Scale the context to counter the fact that we've manually scaled
    // our canvas element.
    context.scale(ratio, ratio)
    return true
  } else if (devicePixelRatio === 1) {
    // Reset the canvas width / height. Fixes scaling bug when the page is
    // zoomed and the devicePixelRatio changes accordingly.
    canvas.style.width = canvas.width + 'px'
    canvas.style.height = canvas.height + 'px'
  }
  return false
}

/**
 * Whether events are enabled.
 * @return {boolean}
 */
Runner.isAltGameModeEnabled = function () {
  return loadTimeData && loadTimeData.valueExists('enableAltGameMode')
}

/**
 * Create canvas element.
 * @param {Element} container Element to append canvas to.
 * @param {number} width
 * @param {number} height
 * @param {string=} optClassname
 * @return {HTMLCanvasElement}
 */
export function createCanvas (container, width, height, optClassname) {
  const canvas =
    /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'))
  canvas.className = optClassname
    ? Runner.classes.CANVAS + ' ' +
    optClassname
    : Runner.classes.CANVAS
  canvas.width = width
  canvas.height = height
  container.appendChild(canvas)

  return canvas
}

/**
 * Check for a collision.
 * @param {!Obstacle} obstacle
 * @param {!Trex} tRex T-rex object.
 * @param {CanvasRenderingContext2D=} optCanvasCtx Optional canvas context for
 *    drawing collision boxes.
 * @return {Array<CollisionBox>|undefined}
 */
export function checkForCollision (obstacle, tRex, optCanvasCtx) {
  // const obstacleBoxXPos = Runner.defaultDimensions.WIDTH + obstacle.xPos

  // Adjustments are made to the bounding box as there is a 1 pixel white
  // border around the t-rex and obstacles.
  const tRexBox = new CollisionBox(
    tRex.xPos + 1,
    tRex.yPos + 1,
    tRex.config.WIDTH - 2,
    tRex.config.HEIGHT - 2)

  const obstacleBox = new CollisionBox(
    obstacle.xPos + 1,
    obstacle.yPos + 1,
    obstacle.typeConfig.width * obstacle.size - 2,
    obstacle.typeConfig.height - 2)

  // Debug outer box
  if (optCanvasCtx) {
    drawCollisionBoxes(optCanvasCtx, tRexBox, obstacleBox)
  }

  // Simple outer bounds check.
  if (boxCompare(tRexBox, obstacleBox)) {
    const collisionBoxes = obstacle.collisionBoxes
    let tRexCollisionBoxes = []

    if (Runner.isAltGameModeEnabled()) {
      tRexCollisionBoxes = Runner.spriteDefinition.TREX.COLLISION_BOXES
    } else {
      tRexCollisionBoxes = tRex.ducking
        ? Trex.collisionBoxes.DUCKING
        : Trex.collisionBoxes.RUNNING
    }

    // Detailed axis aligned box check.
    for (let t = 0; t < tRexCollisionBoxes.length; t++) {
      for (let i = 0; i < collisionBoxes.length; i++) {
        // Adjust the box to actual positions.
        const adjTrexBox =
          createAdjustedCollisionBox(tRexCollisionBoxes[t], tRexBox)
        const adjObstacleBox =
          createAdjustedCollisionBox(collisionBoxes[i], obstacleBox)
        const crashed = boxCompare(adjTrexBox, adjObstacleBox)

        // Draw boxes for debug.
        if (optCanvasCtx) {
          drawCollisionBoxes(optCanvasCtx, adjTrexBox, adjObstacleBox)
        }

        if (crashed) {
          return [adjTrexBox, adjObstacleBox]
        }
      }
    }
  }
}

/**
 * Adjust the collision box.
 * @param {!CollisionBox} box The original box.
 * @param {!CollisionBox} adjustment Adjustment box.
 * @return {CollisionBox} The adjusted collision box object.
 */
export function createAdjustedCollisionBox (box, adjustment) {
  return new CollisionBox(
    box.x + adjustment.x,
    box.y + adjustment.y,
    box.width,
    box.height)
}

/**
 * Draw the collision boxes for debug.
 */
export function drawCollisionBoxes (canvasCtx, tRexBox, obstacleBox) {
  canvasCtx.save()
  canvasCtx.strokeStyle = '#f00'
  canvasCtx.strokeRect(tRexBox.x, tRexBox.y, tRexBox.width, tRexBox.height)

  canvasCtx.strokeStyle = '#0f0'
  canvasCtx.strokeRect(obstacleBox.x, obstacleBox.y,
    obstacleBox.width, obstacleBox.height)
  canvasCtx.restore()
}

/**
 * Compare two collision boxes for a collision.
 * @param {CollisionBox} tRexBox
 * @param {CollisionBox} obstacleBox
 * @return {boolean} Whether the boxes intersected.
 */
function boxCompare (tRexBox, obstacleBox) {
  let crashed = false
  // Axis-Aligned Bounding Box method.
  if (tRexBox.x < obstacleBox.x + obstacleBox.width &&
    tRexBox.x + tRexBox.width > obstacleBox.x &&
    tRexBox.y < obstacleBox.y + obstacleBox.height &&
    tRexBox.height + tRexBox.y > obstacleBox.y) {
    crashed = true
  }

  return crashed
}

/**
 * Collision box object.
 * @param {number} x X position.
 * @param {number} y Y Position.
 * @param {number} w Width.
 * @param {number} h Height.
 * @constructor
 */
export function CollisionBox (x, y, w, h) {
  this.x = x
  this.y = y
  this.width = w
  this.height = h
}
