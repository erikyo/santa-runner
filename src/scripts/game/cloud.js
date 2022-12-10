import { Runner, IS_HIDPI, spriteDefinitionByType } from '../offline'
import { getRandomNum } from './utils'

/**
 * Cloud background item.
 * Similar to an obstacle object but without collision boxes.
 * @param {HTMLCanvasElement} canvas Canvas element.
 * @param {Object} spritePos Position of image in sprite.
 * @param {number} containerWidth
 * @constructor
 */
export function Cloud (canvas, spritePos, containerWidth) {
  /**
   * Cloud object config.
   * @enum {number}
   */
  this.config = spriteDefinitionByType.original.BACKGROUND_EL.CLOUD
  this.canvas = canvas
  this.canvasCtx =
    /** @type {CanvasRenderingContext2D} */ (this.canvas.getContext('2d'))
  this.spritePos = spritePos
  this.containerWidth = containerWidth
  this.xPos = containerWidth
  this.yPos = 0
  this.remove = false
  this.gap =
    getRandomNum(this.config.MIN_CLOUD_GAP, this.config.MAX_CLOUD_GAP)

  this.init()
}

Cloud.prototype = {
  /**
   * Initialise the cloud. Sets the Cloud height.
   */
  init () {
    this.yPos = getRandomNum(this.config.MAX_SKY_LEVEL,
      this.config.MIN_SKY_LEVEL)
    this.draw()
  },

  /**
   * Draw the cloud.
   */
  draw () {
    this.canvasCtx.save()
    let sourceWidth = this.config.WIDTH
    let sourceHeight = this.config.HEIGHT
    const outputWidth = sourceWidth
    const outputHeight = sourceHeight
    if (IS_HIDPI) {
      sourceWidth = sourceWidth * 2
      sourceHeight = sourceHeight * 2
    }

    this.canvasCtx.drawImage(Runner.imageSprite, this.spritePos.x,
      this.spritePos.y,
      sourceWidth, sourceHeight,
      this.xPos, this.yPos,
      outputWidth, outputHeight)

    this.canvasCtx.restore()
  },

  /**
   * Update the cloud position.
   * @param {number} speed
   */
  update (speed) {
    if (!this.remove) {
      this.xPos -= Math.ceil(speed)
      this.draw()

      // Mark as removeable if no longer in the canvas.
      if (!this.isVisible()) {
        this.remove = true
      }
    }
  },

  /**
   * Check if the cloud is visible on the stage.
   * @return {boolean}
   */
  isVisible () {
    return this.xPos + this.config.WIDTH > 0
  }
}
