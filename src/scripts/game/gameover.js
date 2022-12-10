import { IS_HIDPI, IS_RTL, Runner } from '../offline'
import { getTimeStamp } from './utils'

/**
 * Game over panel.
 * @param {!HTMLCanvasElement} canvas
 * @param {Object} textImgPos
 * @param {Object} restartImgPos
 * @param {!Object} dimensions Canvas dimensions.
 * @param {Object=} optAltGameEndImgPos
 * @param {boolean=} optAltGameActive
 * @constructor
 */
export function GameOverPanel (canvas,
  textImgPos,
  restartImgPos,
  dimensions,
  optAltGameEndImgPos,
  optAltGameActive) {
  this.canvas = canvas
  this.canvasCtx =
    /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'))
  this.canvasDimensions = dimensions
  this.textImgPos = textImgPos
  this.restartImgPos = restartImgPos
  this.altGameEndImgPos = optAltGameEndImgPos
  this.altGameModeActive = optAltGameActive

  // Retry animation.
  this.frameTimeStamp = 0
  this.animTimer = 0
  this.currentFrame = 0

  this.gameOverRafId = null

  this.flashTimer = 0
  this.flashCounter = 0
  this.originalText = true
}

GameOverPanel.RESTART_ANIM_DURATION = 875
GameOverPanel.LOGO_PAUSE_DURATION = 875
GameOverPanel.FLASH_ITERATIONS = 5

/**
 * Animation frames spec.
 */
GameOverPanel.animConfig = {
  frames: [0, 36, 72, 108, 144, 180, 216, 252],
  msPerFrame: GameOverPanel.RESTART_ANIM_DURATION / 8
}

/**
 * Dimensions used in the panel.
 * @enum {number}
 */
GameOverPanel.dimensions = {
  TEXT_X: 0,
  TEXT_Y: 13,
  TEXT_WIDTH: 191,
  TEXT_HEIGHT: 11,
  RESTART_WIDTH: 36,
  RESTART_HEIGHT: 32
}

GameOverPanel.prototype = {
  /**
   * Update the panel dimensions.
   * @param {number} width New canvas width.
   * @param {number} optHeight Optional new canvas height.
   */
  updateDimensions (width, optHeight) {
    this.canvasDimensions.WIDTH = width
    if (optHeight) {
      this.canvasDimensions.HEIGHT = optHeight
    }
    this.currentFrame = GameOverPanel.animConfig.frames.length - 1
  },

  drawGameOverText (dimensions, optUseAltText) {
    const centerX = this.canvasDimensions.WIDTH / 2
    let textSourceX = dimensions.TEXT_X
    let textSourceY = dimensions.TEXT_Y
    let textSourceWidth = dimensions.TEXT_WIDTH
    let textSourceHeight = dimensions.TEXT_HEIGHT

    const textTargetX = Math.round(centerX - (dimensions.TEXT_WIDTH / 2))
    const textTargetY = Math.round((this.canvasDimensions.HEIGHT - 25) / 3)
    const textTargetWidth = dimensions.TEXT_WIDTH
    const textTargetHeight = dimensions.TEXT_HEIGHT

    if (IS_HIDPI) {
      textSourceY *= 2
      textSourceX *= 2
      textSourceWidth *= 2
      textSourceHeight *= 2
    }

    if (!optUseAltText) {
      textSourceX += this.textImgPos.x
      textSourceY += this.textImgPos.y
    }

    const spriteSource =
      optUseAltText ? Runner.altCommonImageSprite : Runner.origImageSprite

    this.canvasCtx.save()

    if (IS_RTL) {
      this.canvasCtx.translate(this.canvasDimensions.WIDTH, 0)
      this.canvasCtx.scale(-1, 1)
    }

    // Game over text from sprite.
    this.canvasCtx.drawImage(
      spriteSource, textSourceX, textSourceY, textSourceWidth,
      textSourceHeight, textTargetX, textTargetY, textTargetWidth,
      textTargetHeight)

    this.canvasCtx.restore()
  },

  /**
   * Draw additional adornments for alternative game types.
   */
  drawAltGameElements (tRex) {
    // Additional adornments.
    if (this.altGameModeActive && Runner.spriteDefinition.ALT_GAME_END_CONFIG) {
      const altGameEndConfig = Runner.spriteDefinition.ALT_GAME_END_CONFIG

      let altGameEndSourceWidth = altGameEndConfig.WIDTH
      let altGameEndSourceHeight = altGameEndConfig.HEIGHT
      const altGameEndTargetX = tRex.xPos + altGameEndConfig.X_OFFSET
      const altGameEndTargetY = tRex.yPos + altGameEndConfig.Y_OFFSET

      if (IS_HIDPI) {
        altGameEndSourceWidth *= 2
        altGameEndSourceHeight *= 2
      }

      this.canvasCtx.drawImage(
        Runner.altCommonImageSprite, this.altGameEndImgPos.x,
        this.altGameEndImgPos.y, altGameEndSourceWidth,
        altGameEndSourceHeight, altGameEndTargetX, altGameEndTargetY,
        altGameEndConfig.WIDTH, altGameEndConfig.HEIGHT)
    }
  },

  /**
   * Draw restart button.
   */
  drawRestartButton () {
    const dimensions = GameOverPanel.dimensions
    let framePosX = GameOverPanel.animConfig.frames[this.currentFrame]
    let restartSourceWidth = dimensions.RESTART_WIDTH
    let restartSourceHeight = dimensions.RESTART_HEIGHT
    const restartTargetX =
      (this.canvasDimensions.WIDTH / 2) - (dimensions.RESTART_WIDTH / 2)
    const restartTargetY = this.canvasDimensions.HEIGHT / 2

    if (IS_HIDPI) {
      restartSourceWidth *= 2
      restartSourceHeight *= 2
      framePosX *= 2
    }

    this.canvasCtx.save()

    if (IS_RTL) {
      this.canvasCtx.translate(this.canvasDimensions.WIDTH, 0)
      this.canvasCtx.scale(-1, 1)
    }

    this.canvasCtx.drawImage(
      Runner.origImageSprite, this.restartImgPos.x + framePosX,
      this.restartImgPos.y, restartSourceWidth, restartSourceHeight,
      restartTargetX, restartTargetY, dimensions.RESTART_WIDTH,
      dimensions.RESTART_HEIGHT)
    this.canvasCtx.restore()
  },

  /**
   * Draw the panel.
   * @param {boolean} optAltGameModeActive
   * @param {!Trex} optTRex
   */
  draw (optAltGameModeActive, optTRex) {
    if (optAltGameModeActive) {
      this.altGameModeActive = optAltGameModeActive
    }

    this.drawGameOverText(GameOverPanel.dimensions, false)
    this.drawRestartButton()
    this.drawAltGameElements(optTRex)
    this.update()
  },

  /**
   * Update animation frames.
   */
  update () {
    const now = getTimeStamp()
    const deltaTime = now - (this.frameTimeStamp || now)

    this.frameTimeStamp = now
    this.animTimer += deltaTime
    this.flashTimer += deltaTime

    // Restart Button
    if (this.currentFrame === 0 &&
      this.animTimer > GameOverPanel.LOGO_PAUSE_DURATION) {
      this.animTimer = 0
      this.currentFrame++
      this.drawRestartButton()
    } else if (
      this.currentFrame > 0 &&
      this.currentFrame < GameOverPanel.animConfig.frames.length) {
      if (this.animTimer >= GameOverPanel.animConfig.msPerFrame) {
        this.currentFrame++
        this.drawRestartButton()
      }
    } else if (
      !this.altGameModeActive &&
      this.currentFrame === GameOverPanel.animConfig.frames.length) {
      this.reset()
      return
    }

    // Game over text
    if (this.altGameModeActive &&
      Runner.spriteDefinitionByType.original.ALT_GAME_OVER_TEXT_CONFIG) {
      const altTextConfig =
        Runner.spriteDefinitionByType.original.ALT_GAME_OVER_TEXT_CONFIG

      if (this.flashCounter < GameOverPanel.FLASH_ITERATIONS &&
        this.flashTimer > altTextConfig.FLASH_DURATION) {
        this.flashTimer = 0
        this.originalText = !this.originalText

        this.clearGameOverTextBounds()
        if (this.originalText) {
          this.drawGameOverText(GameOverPanel.dimensions, false)
          this.flashCounter++
        } else {
          this.drawGameOverText(altTextConfig, true)
        }
      } else if (this.flashCounter >= GameOverPanel.FLASH_ITERATIONS) {
        this.reset()
        return
      }
    }

    this.gameOverRafId = requestAnimationFrame(this.update.bind(this))
  },

  /**
   * Clear game over text.
   */
  clearGameOverTextBounds () {
    this.canvasCtx.save()

    this.canvasCtx.clearRect(
      Math.round(
        this.canvasDimensions.WIDTH / 2 -
        (GameOverPanel.dimensions.TEXT_WIDTH / 2)),
      Math.round((this.canvasDimensions.HEIGHT - 25) / 3),
      GameOverPanel.dimensions.TEXT_WIDTH,
      GameOverPanel.dimensions.TEXT_HEIGHT + 4)
    this.canvasCtx.restore()
  },

  reset () {
    if (this.gameOverRafId) {
      cancelAnimationFrame(this.gameOverRafId)
      this.gameOverRafId = null
    }
    this.animTimer = 0
    this.frameTimeStamp = 0
    this.currentFrame = 0
    this.flashTimer = 0
    this.flashCounter = 0
    this.originalText = true
  }
}
