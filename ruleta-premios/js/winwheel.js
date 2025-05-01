/*
    Winwheel.js, by Douglas McKechie @ www.dougtesting.net
    See website for tutorials and other documentation.

    The MIT License (MIT)

    Copyright (c) 2012-2019 Douglas McKechie

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

// ====================================================================================================================
// The constructor for the WinWheel object, a JSON-like array of options can be passed in.
// By default the wheel is drawn if canvas object exists on the page, but can pass false as second parameter if don't want this to happen.
// ====================================================================================================================
function Winwheel(options, drawWheel) {
  const defaultOptions = {
    canvasId: "canvas", // Id of the canvas which the wheel is to draw on to.
    centerX: null, // X position of the center of the wheel. The default of these are null which means will be placed in center of the canvas.
    centerY: null, // Y position of the wheel center. If null will be placed in the center of the canvas.
    outerRadius: null, // The radius of the outside of the wheel. If set the width and height of the canvas will be used as a guide.
    innerRadius: 0, // Normally 0. Allows the creation of rings / doughnuts if set to value > 0. Should not exceed outer radius.
    numSegments: 8, // The number of segments. Need at least one to draw.
    drawMode: "code", // The draw mode. Possible values are 'code', 'image', 'segmentImage'. Default is code which means segments are drawn using canvas arc() function.
    rotationAngle: 0, // The angle of rotation of the wheel - 0 is 12 o'clock position.
    textFontFamily: "Arial", // Segment text font, you should use web safe fonts.
    textFontSize: 20, // Size of the segment text.
    textFontWeight: "bold", // Font weight.
    textOrientation: "horizontal", // Either horizontal, vertical, or curved.
    textAlignment: "center", // Either center, inner, or outer.
    textDirection: "normal", // Either normal or reversed. In normal mode for horizontal text in segment at 3 o'clock is correct way up, in reversed text at 9 o'clock segment is correct way up.
    textMargin: null, // Margin between the inner or outer of the wheel (depends on textAlignment).
    textFillStyle: "black", // This is basically the text colour.
    textStrokeStyle: null, // Basically the line colour for segment text, only looks good for large text so off by default.
    textLineWidth: 1, // Width of the lines around the text. Even though this defaults to 1, a line is only drawn if textStrokeStyle specified.
    fillStyle: "silver", // The segment background colour.
    strokeStyle: "black", // Segment line colour. Again segment lines only drawn if this is specified.
    lineWidth: 1, // Width of lines around segments.
    clearTheCanvas: true, // When set to true the canvas will be cleared before the wheel is drawn.
    imageOverlay: false, // If set to true in image drawing mode the outline of the segments will be displayed over the image. Does nothing in code drawMode.
    drawText: true, // By default the text of the segments is rendered in code drawMode and not in image drawMode.
    pointerAngle: 0, // Location of the pointer that indicates the prize when wheel has stopped. Default is 0 so the (corrected) 12 o'clock position.
    wheelImage: null, // Must be set to image data in order to use image to draw the wheel - drawMode must also be 'image'.
    imageDirection: "N", // Used when drawMode is segmentImage. Default is north, can also be (E)ast, (S)outh, (W)est.
    responsive: false, // If set to true the wheel will resize when the window first loads and also onResize.
    scaleFactor: 1, // Set by the responsive function. Used in many calculations to scale the wheel.
  }

  // -----------------------------------------
  // Loop through the default options and create properties of this class set to the value for the option passed in
  // or if not passed in then set to the default.
  for (const key in defaultOptions) {
    if (options != null && typeof options[key] !== "undefined") {
      this[key] = options[key]
    } else {
      this[key] = defaultOptions[key]
    }
  }

  // Also loop through the passed in options and add anything specified not part of the class in to it as a property.
  if (options != null) {
    for (const key in options) {
      if (typeof this[key] === "undefined") {
        this[key] = options[key]
      }
    }
  }

  // ------------------------------------------
  // If the id of the canvas is set, try to get the canvas as we need it for drawing.
  if (this.canvasId) {
    this.canvas = document.getElementById(this.canvasId)

    if (this.canvas) {
      // If the centerX and centerY have not been specified in the options then default to center of the canvas
      // and make the outerRadius half of the canvas width - this means the wheel will fill the canvas.
      if (this.centerX == null) {
        this.centerX = this.canvas.width / 2
      }

      if (this.centerY == null) {
        this.centerY = this.canvas.height / 2
      }

      if (this.outerRadius == null) {
        // Need to set to half the width of the shortest dimension of the canvas as the canvas may not be square.
        if (this.canvas.width < this.canvas.height) {
          this.outerRadius = (this.canvas.width - this.lineWidth) / 2
        } else {
          this.outerRadius = (this.canvas.height - this.lineWidth) / 2
        }
      }

      // Also get a 2D context to the canvas as we need this to draw with.
      this.ctx = this.canvas.getContext("2d")
    } else {
      this.canvas = null
      this.ctx = null
    }
  } else {
    this.canvas = null
    this.ctx = null
  }

  // ------------------------------------------
  // Add array of segments to the wheel, then populate with segments if number of segments is specified for this object.
  this.segments = []

  for (let x = 1; x <= this.numSegments; x++) {
    // If options for the segments have been specified then create a segment sending these options so
    // the specified values are used instead of the defaults.
    if (options != null && options["segments"] && typeof options["segments"][x - 1] !== "undefined") {
      this.segments[x] = new Segment(options["segments"][x - 1])
    } else {
      this.segments[x] = new Segment()
    }
  }

  // ------------------------------------------
  // Call function to update the segment sizes setting the starting and ending angles.
  this.updateSegmentSizes()

  // If the text margin is null then set to same as font size as we want some by default.
  if (this.textMargin === null) {
    this.textMargin = this.textFontSize / 1.7
  }

  // ------------------------------------------
  // If the animation options have been passed in then create animation object as a property of this class
  // and pass the options to it so the animation is set. Otherwise create default animation object.
  if (options != null && options["animation"] && typeof options["animation"] !== "undefined") {
    this.animation = new Animation(options["animation"])
  } else {
    this.animation = new Animation()
  }

  // ------------------------------------------
  // If some pin options then create create a pin object and then pass them in.
  if (options != null && options["pins"] && typeof options["pins"] !== "undefined") {
    this.pins = new Pin(options["pins"])
  }

  // ------------------------------------------
  // On that note, if the drawMode is image change some defaults provided a value has not been specified.
  if (this.drawMode == "image" || this.drawMode == "segmentImage") {
    // Remove grey fillStyle.
    if (typeof options["fillStyle"] === "undefined") {
      this.fillStyle = null
    }

    // Set strokeStyle to red.
    if (typeof options["strokeStyle"] === "undefined") {
      this.strokeStyle = "red"
    }

    // Set drawText to false as we will assume any text is part of the image.
    if (typeof options["drawText"] === "undefined") {
      this.drawText = false
    }

    // Also set the lineWidth to 1 so that segment overlay will look correct.
    if (typeof options["lineWidth"] === "undefined") {
      this.lineWidth = 1
    }

    // Set drawWheel to false as normally the image needs to be loaded first.
    if (typeof drawWheel === "undefined") {
      drawWheel = false
    }
  } else {
    // When in code drawMode the default is to draw the wheel, so set to true.
    if (typeof drawWheel === "undefined") {
      drawWheel = true
    }
  }

  // Create pointer guide.
  if (options != null && options["pointerGuide"] && typeof options["pointerGuide"] !== "undefined") {
    this.pointerGuide = new PointerGuide(options["pointerGuide"])
  } else {
    this.pointerGuide = new PointerGuide()
  }

  // Check if the wheel is to be responsive, if so then need to save the original size of the canvas
  // and also check for data- attributes on the canvas which help control the scaling.
  if (this.responsive) {
    winwheelToDrawDuringAnimation = this

    // Save the original defined width and height of the canvas, this is needed later to work out the scaling.
    this._originalCanvasWidth = this.canvas.width
    this._originalCanvasHeight = this.canvas.height

    // Get data-attributes on the canvas.
    this._responsiveScaleHeight = this.canvas.dataset.responsivescaleheight
    this._responsiveMinWidth = this.canvas.dataset.responsiveminwidth
    this._responsiveMinHeight = this.canvas.dataset.responsiveminheight
    this._responsiveMargin = this.canvas.dataset.responsivemargin

    // Add event listeners for onload and onresize and call a function defined at the bottom
    // of this script which will handle that and work out the scale factor.
    window.addEventListener("load", winwheelResize)
    window.addEventListener("resize", winwheelResize)
  }

  // Finally if drawWheel is true then call function to render the wheel, segment text, overlay etc.
  if (drawWheel == true) {
    this.draw(this.clearTheCanvas)
  } else if (this.drawMode == "segmentImage") {
    // If segment image then loop though all the segments and load the images for them setting a callback
    // which will call the draw function of the wheel once all the images have been loaded.
    winwheelToDrawDuringAnimation = this
    winhweelAlreadyDrawn = false

    for (let y = 1; y <= this.numSegments; y++) {
      if (this.segments[y].image !== null) {
        this.segments[y].imgData = new Image()
        this.segments[y].imgData.onload = winwheelLoadedImage
        this.segments[y].imgData.src = this.segments[y].image
      }
    }
  }
}

// ====================================================================================================================
// This function sorts out the segment sizes. Some segments may have set sizes, for the others what is left out of
// 360 degrees is shared evenly. What this function actually does is set the start and end angle of the arcs.
// ====================================================================================================================
Winwheel.prototype.updateSegmentSizes = function () {
  // If this object actually contains some segments
  if (this.segments) {
    // First add up the arc used for the segments where the size has been set.
    let arcUsed = 0
    let numSet = 0

    // Remember, to make it easy to access segments, the position of the segments in the array starts from 1 (not 0).
    for (let x = 1; x <= this.numSegments; x++) {
      if (this.segments[x].size !== null) {
        arcUsed += this.segments[x].size
        numSet++
      }
    }

    const arcLeft = 360 - arcUsed

    // Create variable to hold how much each segment with non-set size will get in terms of degrees.
    let degreesEach = 0

    if (arcLeft > 0) {
      degreesEach = arcLeft / (this.numSegments - numSet)
    }

    // ------------------------------------------
    // Now loop though and set the start and end angle of each segment.
    let currentDegree = 0

    for (let x = 1; x <= this.numSegments; x++) {
      // Set start angle.
      this.segments[x].startAngle = currentDegree

      // If the size is set then add this to the current degree to get the end, else add the degreesEach to it.
      if (this.segments[x].size) {
        currentDegree += this.segments[x].size
      } else {
        currentDegree += degreesEach
      }

      // Set end angle.
      this.segments[x].endAngle = currentDegree
    }
  }
}

// ====================================================================================================================
// This function clears the canvas. Will wipe anything else which happens to be drawn on it.
// ====================================================================================================================
Winwheel.prototype.clearCanvas = function () {
  if (this.ctx) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}

// ====================================================================================================================
// This function draws / re-draws the wheel on the canvas therefore rendering any changes.
// ====================================================================================================================
Winwheel.prototype.draw = function (clearTheCanvas) {
  // If have the canvas context.
  if (this.ctx) {
    // Clear the canvas, unless told not to.
    if (typeof clearTheCanvas !== "undefined") {
      if (clearTheCanvas == true) {
        this.clearCanvas()
      }
    } else {
      this.clearCanvas()
    }

    // Call functions to draw the segments and then segment text.
    if (this.drawMode == "image") {
      // Draw the wheel by loading and drawing an image such as a png on the canvas.
      this.drawWheelImage()

      // If we are to draw the text, do so before the overlay is drawn
      // as this allows the overlay to be transparent over the text.
      if (this.drawText == true) {
        this.drawSegmentText()
      }

      // If image overlay is true then call function to draw the segments over the top of the image.
      // This is useful during development to check alignment between where the code thinks the segments are and where they appear on the image.
      if (this.imageOverlay == true) {
        this.drawSegments()
      }
    } else if (this.drawMode == "segmentImage") {
      // Draw the wheel by rendering the image for each segment.
      this.drawSegmentImages()

      // If we are to draw the text, do so before the overlay is drawn
      // as this allows the overlay to be transparent over the text.
      if (this.drawText == true) {
        this.drawSegmentText()
      }

      // If image overlay is true then call function to draw the segments over the top of the image.
      // This is useful during development to check alignment between where the code thinks the segments are and where they appear on the image.
      if (this.imageOverlay == true) {
        this.drawSegments()
      }
    } else {
      // The default operation is to draw the segments using code via the canvas arc() method.
      this.drawSegments()

      // The text is drawn on top.
      if (this.drawText == true) {
        this.drawSegmentText()
      }
    }

    // If this class has pins.
    if (typeof this.pins !== "undefined") {
      // If they are to be visible then draw them.
      if (this.pins.visible == true) {
        this.drawPins()
      }
    }

    // If pointer guide is display property is set to true then call function to draw the pointer guide.
    if (this.pointerGuide.display == true) {
      this.drawPointerGuide()
    }
  }
}

// ====================================================================================================================
// Draws the pins around the outside of the wheel.
// ====================================================================================================================
Winwheel.prototype.drawPins = function () {
  if (this.pins && this.pins.number) {
    // Work out the angle to draw each pin at. The starting angle is the first pin location which is half way between the
    // 2 segments (i.e. the line between them) so need to add half the segment arc angle to the rotation angle of the wheel.
    const pinSpacing = 360 / this.pins.number
    const pinRadius = this.outerRadius - this.pins.outerRadius
    const pinOuterRadius = this.outerRadius - this.pins.outerRadius
    const pinInnerRadius = this.outerRadius - this.pins.innerRadius

    // Loop though and draw the pins.
    for (let i = 1; i <= this.pins.number; i++) {
      this.ctx.save()

      // Set the stroke style and line width.
      this.ctx.strokeStyle = this.pins.strokeStyle
      this.ctx.lineWidth = this.pins.lineWidth
      this.ctx.fillStyle = this.pins.fillStyle

      // Move to the center.
      this.ctx.translate(this.centerX, this.centerY)

      // Rotate to to the pin location which is i * the pinSpacing plus the half segment angle.
      this.ctx.rotate(this.degToRad(i * pinSpacing + this.rotationAngle))

      // Move back out.
      this.ctx.translate(-this.centerX, -this.centerY)

      // Create a path for the pin circle.
      this.ctx.beginPath()
      // x, y, radius, startAngle, endAngle.
      this.ctx.arc(this.centerX, this.centerY - pinOuterRadius, this.pins.outerRadius, 0, 2 * Math.PI)

      if (this.pins.fillStyle) {
        this.ctx.fill()
      }

      if (this.pins.strokeStyle) {
        this.ctx.stroke()
      }

      this.ctx.restore()
    }
  }
}

// ====================================================================================================================
// Draws a line from the center of the wheel to the outside at the angle where the code thinks the pointer is.
// ====================================================================================================================
Winwheel.prototype.drawPointerGuide = function () {
  // If have canvas context.
  if (this.ctx) {
    this.ctx.save()

    // Rotate the canvas to the line goes towards the location of the pointer.
    this.ctx.translate(this.centerX, this.centerY)
    this.ctx.rotate(this.degToRad(this.pointerAngle))
    this.ctx.translate(-this.centerX, -this.centerY)

    // Set line colour and width.
    this.ctx.strokeStyle = this.pointerGuide.strokeStyle
    this.ctx.lineWidth = this.pointerGuide.lineWidth

    // Draw from the center of the wheel outwards past the wheel outer radius.
    this.ctx.beginPath()
    this.ctx.moveTo(this.centerX, this.centerY)
    this.ctx.lineTo(this.centerX, -(this.outerRadius / 4))

    this.ctx.stroke()
    this.ctx.restore()
  }
}

// ====================================================================================================================
// This function takes an image such as PNG and draws it on the canvas making its center at the centerX and center for the wheel.
// ====================================================================================================================
Winwheel.prototype.drawWheelImage = function () {
  // Double check the wheelImage property of this class is not null. This does not actually detect that an image
  // source was set and actually loaded so might get error if this is not the case. This is why the initial call
  // to draw() should be done from a wheelImage.onload callback as detailed in example documentation.
  if (this.wheelImage != null) {
    // Work out the correct X and Y to draw the image at. We need to get the center point of the image
    // aligned over the center point of the wheel, we can't just place it at 0, 0.
    const imageLeft = this.centerX - this.wheelImage.width / 2
    const imageTop = this.centerY - this.wheelImage.height / 2

    // Rotate and then draw the wheel.
    // We must rotate by the rotationAngle before drawing to ensure that image wheels will spin.
    this.ctx.save()
    this.ctx.translate(this.centerX, this.centerY)
    this.ctx.rotate(this.degToRad(this.rotationAngle))
    this.ctx.translate(-this.centerX, -this.centerY)

    this.ctx.drawImage(this.wheelImage, imageLeft, imageTop)

    this.ctx.restore()
  }
}

// ====================================================================================================================
// This function draws the wheel on the canvas by rendering the image for each segment.
// ====================================================================================================================
Winwheel.prototype.drawSegmentImages = function () {
  // Again check have context in case this function was called directly and not via draw function.
  if (this.ctx) {
    // Draw the segments if there is at least one in the segments array.
    if (this.segments) {
      // Loop though and draw the segments.
      for (let x = 1; x <= this.numSegments; x++) {
        // Get the segment object as we need it to read options from.
        const seg = this.segments[x]

        // Check image has loaded so a new wheel can be loaded with segment images that are still loading without crashing.
        if (seg.imgData.complete) {
          // Work out the correct X and Y to draw the image at which depends on the direction of the image.
          // Images can be created in 4 directions. North, South, East, West.
          // North: Outside at top, inside at bottom. Sits evenly over the 0 degrees angle.
          // South: Outside at bottom, inside at top. Sits evenly over the 180 degrees angle.
          // East: Outside at right, inside at left. Sits evenly over the 90 degrees angle.
          // West: Outside at left, inside at right. Sits evenly over the 270 degrees angle.
          let imageLeft = 0
          let imageTop = 0
          let imageAngle = 0
          let imageDirection = ""

          if (seg.imageDirection !== null) {
            imageDirection = seg.imageDirection
          } else {
            imageDirection = this.imageDirection
          }

          if (imageDirection == "S") {
            // Left set so image sits half/half over the 180 degrees point.
            imageLeft = this.centerX - seg.imgData.width / 2

            // Top so image starts at the centerY.
            imageTop = this.centerY

            // Angle to draw the image is its starting angle + half its size.
            // Here we add 180 to the angle to the segment starts at.
            imageAngle = seg.startAngle + 180 + (seg.endAngle - seg.startAngle) / 2
          } else if (imageDirection == "E") {
            // Left set so image starts and the center point.
            imageLeft = this.centerX

            // Top is so that it sits half/half over the 90 degree point.
            imageTop = this.centerY - seg.imgData.height / 2

            // Again get the angle in the center of the segment and add it to the rotation angle.
            // this time we need to add 270 to that to the segment starts at.
            imageAngle = seg.startAngle + 270 + (seg.endAngle - seg.startAngle) / 2
          } else if (imageDirection == "W") {
            // Left is the centerX minus the width of the image.
            imageLeft = this.centerX - seg.imgData.width

            // Top is so that it sits half/half over the 270 degree point.
            imageTop = this.centerY - seg.imgData.height / 2

            // Again get the angle in the center of the segment and add it to the rotation angle.
            // this time we need to add 90 to that to the segment starts at.
            imageAngle = seg.startAngle + 90 + (seg.endAngle - seg.startAngle) / 2
          } else {
            // North is the default.
            // Left set so image sits half/half over the 0 degrees point.
            imageLeft = this.centerX - seg.imgData.width / 2

            // Top so image is its height out (above) the center point.
            imageTop = this.centerY - seg.imgData.height

            // Angle to draw the image is its starting angle + half its size.
            // this sits it half/half over the center angle of the segment.
            imageAngle = seg.startAngle + (seg.endAngle - seg.startAngle) / 2
          }

          // --------------------------------------------------
          // Rotate to the position of the segment and then draw the image.
          this.ctx.save()
          this.ctx.translate(this.centerX, this.centerY)

          // So math here is the rotation angle of the wheel plus half way between the start and end angle of the segment.
          this.ctx.rotate(this.degToRad(this.rotationAngle + imageAngle))
          this.ctx.translate(-this.centerX, -this.centerY)

          // Draw the image passing the transformed context.
          this.ctx.drawImage(seg.imgData, imageLeft, imageTop)

          this.ctx.restore()
        } else {
          console.log("Segment " + x + " imgData is not loaded")
        }
      }
    }
  }
}

// ====================================================================================================================
// This function draws the wheel on the page by rendering the segments on the canvas.
// ====================================================================================================================
Winwheel.prototype.drawSegments = function () {
  // Again check have context in case this function was called directly and not via draw function.
  if (this.ctx) {
    // Draw the segments if there is at least one in the segments array.
    if (this.segments) {
      // Get scaled centerX and centerY and also scaled inner and outer radius.
      const scaledInnerRadius = this.innerRadius * this.scaleFactor
      const scaledOuterRadius = this.outerRadius * this.scaleFactor
      const scaledCenterX = this.centerX * this.scaleFactor
      const scaledCenterY = this.centerY * this.scaleFactor

      // Loop though and draw the segments.
      for (let x = 1; x <= this.numSegments; x++) {
        // Get the segment object as we need it to read options from.
        const seg = this.segments[x]

        let fillStyle
        let lineWidth
        let strokeStyle

        // Set the variables that defined in the segment, or use the default options.
        if (seg.fillStyle !== null) {
          fillStyle = seg.fillStyle
        } else {
          fillStyle = this.fillStyle
        }

        this.ctx.fillStyle = fillStyle

        if (seg.lineWidth !== null) {
          lineWidth = seg.lineWidth
        } else {
          lineWidth = this.lineWidth
        }

        this.ctx.lineWidth = lineWidth

        if (seg.strokeStyle !== null) {
          strokeStyle = seg.strokeStyle
        } else {
          strokeStyle = this.strokeStyle
        }

        this.ctx.strokeStyle = strokeStyle

        // Check there is a strokeStyle or fillStyle, if not the segment is invisible so should not try to draw it.
        if (strokeStyle || fillStyle) {
          // ----------------------------------
          // Begin a path as the segment consists of an arc and 2 lines.
          this.ctx.beginPath()

          // If don't have an inner radius then move to the center of the wheel as we want a line out from the center
          // to the start of the arc for the outside of the wheel when we arc. Canvas will draw the connecting line for us.
          if (!this.innerRadius) {
            this.ctx.moveTo(scaledCenterX, scaledCenterY)
          } else {
            // Work out the x and y values for the starting point of the segment which is at its starting angle
            // but out from the center point of the wheel by the value of the innerRadius. Some correction for line width is needed.
            const iX =
              Math.cos(this.degToRad(seg.startAngle + this.rotationAngle - 90)) * (scaledInnerRadius - lineWidth / 2)
            const iY =
              Math.sin(this.degToRad(seg.startAngle + this.rotationAngle - 90)) * (scaledInnerRadius - lineWidth / 2)

            // Now move here relative to the center point of the wheel.
            this.ctx.moveTo(scaledCenterX + iX, scaledCenterY + iY)
          }

          // Draw the outer arc of the segment clockwise in direction -->
          this.ctx.arc(
            scaledCenterX,
            scaledCenterY,
            scaledOuterRadius,
            this.degToRad(seg.startAngle + this.rotationAngle - 90),
            this.degToRad(seg.endAngle + this.rotationAngle - 90),
            false,
          )

          if (this.innerRadius) {
            // Draw another arc, this time anticlockwise <-- at the innerRadius between the end angle and the start angle.
            // Canvas will draw a connecting line from the end of the outer arc to the beginning of the inner arc completing the shape.
            this.ctx.arc(
              scaledCenterX,
              scaledCenterY,
              scaledInnerRadius,
              this.degToRad(seg.endAngle + this.rotationAngle - 90),
              this.degToRad(seg.startAngle + this.rotationAngle - 90),
              true,
            )
          } else {
            // If no inner radius then we draw a line back to the center of the wheel.
            this.ctx.lineTo(scaledCenterX, scaledCenterY)
          }

          // Fill and stroke the segment. Only do either if a style was specified, if the style is null then
          // we assume the developer did not want that particular thing.
          // For example no stroke style so no lines to be drawn.
          if (fillStyle) {
            this.ctx.fill()
          }

          if (strokeStyle) {
            this.ctx.stroke()
          }
        }
      }
    }
  }
}

// ====================================================================================================================
// This draws the text on the segments using the specified text options.
// ====================================================================================================================
Winwheel.prototype.drawSegmentText = function () {
  // Again only draw the text if have a canvas context.
  if (this.ctx) {
    // Declare variables to hold the values. These are populated either with the value for the specific segment,
    // or if not specified then the global default value.
    let fontFamily
    let fontSize
    let fontWeight
    let orientation
    let alignment
    let direction
    let margin
    let fillStyle
    let strokeStyle
    let lineWidth
    let fontSetting

    // Get the centerX and centerY scaled with the scale factor, also the same for outer and inner radius.
    const scaledCenterX = this.centerX * this.scaleFactor
    const scaledCenterY = this.centerY * this.scaleFactor
    const scaledOuterRadius = this.outerRadius * this.scaleFactor
    const scaledInnerRadius = this.innerRadius * this.scaleFactor

    // Loop though all the segments.
    for (let x = 1; x <= this.numSegments; x++) {
      // Save the context so it is certain that each segment text option will not affect the other.
      this.ctx.save()

      // Get the segment object as we need it to read options from.
      const seg = this.segments[x]

      // Check is text as no point trying to draw if there is no text to render.
      if (seg.text) {
        // Set values to those for the specific segment or use global default if null.
        if (seg.textFontFamily !== null) fontFamily = seg.textFontFamily
        else fontFamily = this.textFontFamily
        if (seg.textFontSize !== null) fontSize = seg.textFontSize
        else fontSize = this.textFontSize
        if (seg.textFontWeight !== null) fontWeight = seg.textFontWeight
        else fontWeight = this.textFontWeight
        if (seg.textOrientation !== null) orientation = seg.textOrientation
        else orientation = this.textOrientation
        if (seg.textAlignment !== null) alignment = seg.textAlignment
        else alignment = this.textAlignment
        if (seg.textDirection !== null) direction = seg.textDirection
        else direction = this.textDirection
        if (seg.textMargin !== null) margin = seg.textMargin
        else margin = this.textMargin
        if (seg.textFillStyle !== null) fillStyle = seg.textFillStyle
        else fillStyle = this.textFillStyle
        if (seg.textStrokeStyle !== null) strokeStyle = seg.textStrokeStyle
        else strokeStyle = this.textStrokeStyle
        if (seg.textLineWidth !== null) lineWidth = seg.textLineWidth
        else lineWidth = this.textLineWidth

        // Scale the font size and the margin by the scale factor so the text can be responsive.
        fontSize = fontSize * this.scaleFactor
        margin = margin * this.scaleFactor

        // ------------------------------
        // We need to put the font bits together in to one string.
        let fontSetting = ""

        if (fontWeight != null) {
          fontSetting += fontWeight + " "
        }

        if (fontSize != null) {
          fontSetting += fontSize + "px " // Fonts on canvas are always a px value.
        }

        if (fontFamily != null) {
          fontSetting += fontFamily
        }

        // Now set the canvas context to the decided values.
        this.ctx.font = fontSetting
        this.ctx.fillStyle = fillStyle
        this.ctx.strokeStyle = strokeStyle
        this.ctx.lineWidth = lineWidth

        // Split the text in to multiple lines on the \n character.
        const lines = seg.text.split("\n")

        // Figure out the starting offset for the lines as when there are multiple lines need to center the text
        // vertically in the segment (when thinking of normal horozontal text).
        let lineOffset = 0 - fontSize * (lines.length / 2) + fontSize / 2

        // The offset works great for horozontal and vertial text, also centered curved. But when the text is curved
        // and the alignment is outer then the multiline text won't show correctly unless the lineOffset is adjusted.
        if (orientation == "curved" && alignment == "outer") {
          lineOffset = 0
        }

        for (let i = 0; i < lines.length; i++) {
          // ---------------------------------
          // If direction is reversed then do things differently than if normal (which is clockwise).
          if (direction == "reversed") {
            // When drawing reversed or 'counterclock' we need to change the alignment.
            // If alignment is inner change to outer and vice versa. This is because the way the text is drawn.
            if (alignment == "inner") {
              alignment = "outer"
            } else if (alignment == "outer") {
              alignment = "inner"
            }

            // When reversed need to draw the text at the angle where the segment ends.
            this.ctx.textAlign = "right"

            // If normal direction then draw the text at the starting angle of the segment.
            // Here we add the angle to the rotation angle of the wheel, then take away 90 degrees from that.
            // The 90 subtraction is because the draw function adds in 90 degrees to the angle to make the text
            // sit upright on the wheel.
            const textAngle = this.degToRad(seg.endAngle + this.rotationAngle - 90 - i * lineOffset)

            this.ctx.save()
            this.ctx.translate(scaledCenterX, scaledCenterY)
            this.ctx.rotate(textAngle)
            this.ctx.translate(-scaledCenterX, -scaledCenterY)

            if (alignment == "inner") {
              // In reversed mode inner means that the text is aligned with the inner of the wheel which is the same
              // as the outer of the wheel normally.
              this.ctx.textBaseline = "top"
              this.ctx.textAlign = "right"

              // Work out the position to draw the text at based on the alignment.
              // Here we use the fact that the stroke style of the segment is checked in the drawSegments()
              // function so if a stroke style is not specified then we don't draw it.
              if (fillStyle) {
                this.ctx.fillText(lines[i], scaledOuterRadius - margin, -fontSize - margin)
              }

              if (strokeStyle) {
                this.ctx.strokeText(lines[i], scaledOuterRadius - margin, -fontSize - margin)
              }
            } else if (alignment == "outer") {
              // In reversed mode outer means that the text is aligned with the outer of the wheel which is the same
              // as the inner of the wheel normally.
              this.ctx.textBaseline = "bottom"
              this.ctx.textAlign = "right"

              // Work out the position to draw the text at based on the alignment.
              if (fillStyle) {
                this.ctx.fillText(lines[i], scaledInnerRadius + margin, fontSize + margin)
              }

              if (strokeStyle) {
                this.ctx.strokeText(lines[i], scaledInnerRadius + margin, fontSize + margin)
              }
            } else if (alignment == "center") {
              // In reversed mode center means the text is drawn in the center of the segment.
              this.ctx.textBaseline = "middle"
              this.ctx.textAlign = "right"

              // Work out the position to draw the text at based on the alignment.
              const textRadius = scaledInnerRadius + (scaledOuterRadius - scaledInnerRadius) / 2

              if (fillStyle) {
                this.ctx.fillText(lines[i], textRadius, 0)
              }

              if (strokeStyle) {
                this.ctx.strokeText(lines[i], textRadius, 0)
              }
            }

            this.ctx.restore()
          } else {
            // Normal direction so do things normally.
            // Check the alignment of the text.
            if (alignment == "inner") {
              // Inner means that the text is aligned with the inner of the wheel.
              this.ctx.textBaseline = "top"
              this.ctx.textAlign = "left"

              // Work out the position to draw the text at based on the alignment.
              // If there is a stroke style then the line width needs to be included in the calculation.
              // If no stroke style then we can ignore this.
              let textRadius = scaledInnerRadius + margin

              // Only adjust the radius if outer radius is not 0.
              if (scaledOuterRadius > 0) {
                textRadius = (scaledOuterRadius - scaledInnerRadius) / 2
              }

              const textAngle = this.degToRad(seg.startAngle + this.rotationAngle - 90 + i * lineOffset)

              this.ctx.save()
              this.ctx.translate(scaledCenterX, scaledCenterY)
              this.ctx.rotate(textAngle)
              this.ctx.translate(-scaledCenterX, -scaledCenterY)

              if (fillStyle) {
                this.ctx.fillText(lines[i], scaledInnerRadius + margin, -fontSize - margin)
              }

              if (strokeStyle) {
                this.ctx.strokeText(lines[i], scaledInnerRadius + margin, -fontSize - margin)
              }

              this.ctx.restore()
            } else if (alignment == "outer") {
              // Outer means the text is aligned with the outside of the wheel.
              // This can be seen by the fact that we place the text at the end of the wheel radius.
              this.ctx.textBaseline = "bottom"
              this.ctx.textAlign = "left"

              const textAngle = this.degToRad(seg.startAngle + this.rotationAngle - 90 - i * lineOffset)

              this.ctx.save()
              this.ctx.translate(scaledCenterX, scaledCenterY)
              this.ctx.rotate(textAngle)
              this.ctx.translate(-scaledCenterX, -scaledCenterY)

              if (fillStyle) {
                this.ctx.fillText(lines[i], scaledOuterRadius - margin, fontSize + margin)
              }

              if (strokeStyle) {
                this.ctx.strokeText(lines[i], scaledOuterRadius - margin, fontSize + margin)
              }

              this.ctx.restore()
            } else if (alignment == "center") {
              // Center means the text is placed in the center of the segment.
              this.ctx.textBaseline = "middle"
              this.ctx.textAlign = "center"

              const textRadius = scaledInnerRadius + (scaledOuterRadius - scaledInnerRadius) / 2
              const textAngle = this.degToRad(
                seg.startAngle + (seg.endAngle - seg.startAngle) / 2 + this.rotationAngle - 90,
              )

              this.ctx.save()
              this.ctx.translate(scaledCenterX, scaledCenterY)
              this.ctx.rotate(textAngle)
              this.ctx.translate(-scaledCenterX, -scaledCenterY)

              if (fillStyle) {
                this.ctx.fillText(lines[i], scaledCenterX, textRadius - fontSize / 2 - margin)
              }

              if (strokeStyle) {
                this.ctx.strokeText(lines[i], scaledCenterX, textRadius - fontSize / 2 - margin)
              }

              this.ctx.restore()
            }
          }
        }
      }

      // Restore so all text options are reset ready for the next text.
      this.ctx.restore()
    }
  }
}

// ====================================================================================================================
// Converts degrees to radians which is what is used when specifying the angles on HTML5 canvas arcs.
// ====================================================================================================================
Winwheel.prototype.degToRad = (d) => d * 0.0174532925199432957

// ====================================================================================================================
// This function sets the center location of the wheel, saves a function call to set x then y.
// ====================================================================================================================
Winwheel.prototype.setCenter = function (x, y) {
  this.centerX = x
  this.centerY = y
}

// ====================================================================================================================
// This function allows a segment to be added to the wheel. The position of the segment is optional,
// if not specified the new segment will be added to the end of the wheel.
// ====================================================================================================================
Winwheel.prototype.addSegment = function (options, position) {
  // Create a new segment object passing the options in.
  const newSegment = new Segment(options)

  // Increment the numSegments property of the class since new segment being added.
  this.numSegments++
  let segmentPos

  // Work out where to place the segment, the default is simply as a new segment at the end of the wheel.
  if (typeof position !== "undefined") {
    // Because we need to insert the segment at this position, not overwrite it, we need to move all segments after this
    // location along one in the segments array, before finally adding this new segment at the specified location.
    for (let x = this.numSegments; x > position; x--) {
      this.segments[x] = this.segments[x - 1]
    }

    this.segments[position] = newSegment
    segmentPos = position
  } else {
    this.segments[this.numSegments] = newSegment
    segmentPos = this.numSegments
  }

  // Since a segment has been added the segment sizes need to be re-computed so call function to do this.
  this.updateSegmentSizes()

  // Return the segment object just created in the wheel (JavaScript will return it by reference), so that
  // further things can be done with it by the calling code if desired.
  return this.segments[segmentPos]
}

// ====================================================================================================================
// This function must be used if the canvasId is changed as we also need to get the context of the new canvas.
// ====================================================================================================================
Winwheel.prototype.setCanvasId = function (canvasId) {
  if (canvasId) {
    this.canvasId = canvasId
    this.canvas = document.getElementById(this.canvasId)

    if (this.canvas) {
      this.ctx = this.canvas.getContext("2d")
    }
  }
}

// ====================================================================================================================
// This function deletes the specified segment from the wheel by removing it from the segments array.
// It then sorts out the other bits such as update of the numSegments.
// ====================================================================================================================
Winwheel.prototype.deleteSegment = function (position) {
  // There needs to be at least one segment in order for the wheel to draw, so only allow delete if there
  // is more than one segment currently.
  if (this.numSegments > 1) {
    // If the position of the segment to remove has been specified.
    if (typeof position !== "undefined") {
      // The array is to be shortened so we need to move all segments after the one
      // to be removed down one so there is no gap.
      for (let x = position; x < this.numSegments; x++) {
        this.segments[x] = this.segments[x + 1]
      }
    }

    // Unset the last item in the segments array since there is now one less.
    this.segments[this.numSegments] = undefined

    // Decrement the number of segments,
    // then call function to update the segment sizes.
    this.numSegments--
    this.updateSegmentSizes()
  }
}

// ====================================================================================================================
// This function takes the x an the y of a mouse event, such as click or move, and converts the x and the y in to
// co-ordinates on the canvas as the raw values are the x and the y from the top and left of the user's browser.
// ====================================================================================================================
Winwheel.prototype.windowToCanvas = function (x, y) {
  const bbox = this.canvas.getBoundingClientRect()

  return {
    x: Math.floor(x - bbox.left * (this.canvas.width / bbox.width)),
    y: Math.floor(y - bbox.top * (this.canvas.height / bbox.height)),
  }
}

// ====================================================================================================================
// This function returns the segment object located at the specified x and y coordinates on the canvas.
// It is used to allow things to be done with a segment clicked by the user, such as highlight, display or change some values, etc.
// ====================================================================================================================
Winwheel.prototype.getSegmentAt = function (x, y) {
  let foundSegment = null

  // Call function to return segment number.
  const segmentNumber = this.getSegmentNumberAt(x, y)

  // If found one then set found segment to pointer to the segment object.
  if (segmentNumber !== null) {
    foundSegment = this.segments[segmentNumber]
  }

  return foundSegment
}

// ====================================================================================================================
// Returns the number of the segment clicked instead of the segment object.
// This function is for compatibility with the old code where things were detected in segments by segment number.
// ====================================================================================================================
Winwheel.prototype.getSegmentNumberAt = function (x, y) {
  // Call function above to convert the raw x and y from the user's browser to canvas coordinates
  // i.e. top and left is top and left of canvas, not top and left of the user's browser.
  const loc = this.windowToCanvas(x, y)

  // ------------------------------------------
  // Now start the process of working out the segment clicked.
  // First we need to figure out the angle of an imaginary line between the centerX and centerY of the wheel and
  // the X and Y of the location (for example a mouse click).
  let topBottom
  let leftRight
  let adjacentSideLength
  let oppositeSideLength
  let hypotenuseSideLength

  // Get the centerX and centerY scaled with the scale factor, also the same for outer and inner radius.
  const centerX = this.centerX * this.scaleFactor
  const centerY = this.centerY * this.scaleFactor
  const outerRadius = this.outerRadius * this.scaleFactor
  const innerRadius = this.innerRadius * this.scaleFactor

  // We will use right triangle maths with the TAN function.
  // The start of the triangle is the wheel center, the adjacent side is along the x axis, and the opposite side is along the y axis.

  // We only ever use positive numbers to work out the triangle and the center of the wheel needs to be considered as 0,0 so
  // we need to subtract the values from the clicked point.
  if (loc.x > centerX) {
    adjacentSideLength = loc.x - centerX
    leftRight = "R" // Clicked in the right half of the wheel.
  } else {
    adjacentSideLength = centerX - loc.x
    leftRight = "L" // Clicked in the left half of the wheel.
  }

  if (loc.y > centerY) {
    oppositeSideLength = loc.y - centerY
    topBottom = "B" // Clicked in the bottom half of the wheel.
  } else {
    oppositeSideLength = centerY - loc.y
    topBottom = "T" // Clicked in the top half of the wheel.
  }

  // Now divide opposite by adjacent to get tan value.
  const tanVal = oppositeSideLength / adjacentSideLength

  // Use the tan function and convert results to degrees since that is what we work with.
  const result = (Math.atan(tanVal) * 180) / Math.PI
  let locationAngle = 0

  // We also need the length of the hypotenuse as later we need to compare this to the outerRadius of the segment / circle.
  hypotenuseSideLength = Math.sqrt(oppositeSideLength * oppositeSideLength + adjacentSideLength * adjacentSideLength)

  // ------------------------------------------
  // Now to make sense of where the location is because we need to take in to account
  // the position of the wheel on the screen and the direction of the spin.
  if (topBottom == "T" && leftRight == "R") {
    locationAngle = Math.round(90 - result)
  } else if (topBottom == "B" && leftRight == "R") {
    locationAngle = Math.round(result + 90)
  } else if (topBottom == "B" && leftRight == "L") {
    locationAngle = Math.round(90 - result + 180)
  } else if (topBottom == "T" && leftRight == "L") {
    locationAngle = Math.round(result + 270)
  }

  // ------------------------------------------
  // And now we have to adjust to take in to account the rotationAngle of the wheel.
  let adjustedAngle = Math.round(locationAngle - this.rotationAngle)

  if (adjustedAngle >= 360) {
    adjustedAngle = adjustedAngle - 360
  }

  if (adjustedAngle < 0) {
    adjustedAngle = 360 - Math.abs(adjustedAngle)
  }

  // ------------------------------------------
  // Finally we can work out the segment of the wheel which is at the location clicked.
  let segmentNumber = null

  // Now loop though all the segments looking for the one which spans the locationAngle.
  for (let x = 1; x <= this.numSegments; x++) {
    // Due to segments sharing start and end angles, if line is clicked will pick earlier segment.
    if (adjustedAngle >= this.segments[x].startAngle && adjustedAngle <= this.segments[x].endAngle) {
      // To ensure that a click anywhere on the canvas in the segment direction will not cause a
      // segment to be matched, as well as the angles, we need to ensure the click was within the radius
      // of the segment (or circle if no segment radius).

      // If the hypotenuseSideLength (length of location from the center of the wheel) is with the radius
      // then we can assign the segment to the found segment and break out the loop.

      // If the location is within the inner radius then it is not part of a segment.
      if (hypotenuseSideLength >= innerRadius && hypotenuseSideLength <= outerRadius) {
        segmentNumber = x
        break
      }
    }
  }

  return segmentNumber
}

// ====================================================================================================================
// Returns a reference to the segment that is at the location of the pointer on the wheel.
// ====================================================================================================================
Winwheel.prototype.getIndicatedSegment = function () {
  // Call function below to work this out and return the prizeNumber.
  const prizeNumber = this.getIndicatedSegmentNumber()

  // Then simply return the segment in the segments array at that position.
  return this.segments[prizeNumber]
}

// ====================================================================================================================
// Works out the segment currently pointed to by the pointer of the wheel. Normally called when the spinning has stopped
// to work out the prize the user has won. Returns the number of the segment in the segments array.
// ====================================================================================================================
Winwheel.prototype.getIndicatedSegmentNumber = function()
{
    const indicatedPrize = 0;
    const rawAngle = this.getRotationPosition();

    // Now we have the angle of the wheel we can work out the prize won by seeing what prize segment this angle is in
    // between the start and end angle of the prize segment. The rotationAngle is the angle where the wheel stopped.
    let relativeAngle = Math.floor(this.pointerAngle - rawAngle);

    if (relativeAngle < 0) {
        relativeAngle = 360 - Math.abs(relativeAngle);
    }

    // Now we can work out the prize won by seeing what prize segment this angle is in between the start and end angle
    // of the prize segment. We can use the getSegmentAt function.
    const segmentNumber = this.getSegmentNumberAt(relativeAngle, 1);

// If the segment is defined then set indicatedPrize property.
