var textAlign = {

    center: new THREE.Vector2(0, 0),
    left: new THREE.Vector2(1, 0),
    topLeft: new THREE.Vector2(1, -1),
    topRight: new THREE.Vector2(-1, -1),
    right: new THREE.Vector2(-1, 0),
    bottomLeft: new THREE.Vector2(1, 1),
    bottomRight: new THREE.Vector2(-1, 1)

};

const fontHeightCache = {};

function getFontHeight (fontStyle) {
    let result = fontHeightCache[fontStyle];

    if (!result) {
        var body = document.getElementsByTagName('body')[0];
        var dummy = document.createElement('div');
        var dummyText = document.createTextNode('MÉq');
        dummy.appendChild(dummyText);
        dummy.setAttribute('style', "font:" + fontStyle + ";position:absolute;top:0;left:0");
        body.appendChild(dummy);
        result = dummy.offsetHeight;
        fontHeightCache[fontStyle] = result;
        body.removeChild(dummy);
    }

    return result;
}

// -------------------------------- canvas text
function CanvasText () {
    this.textWidth = null
    this.textHeight = null
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    return this;
}
CanvasText.prototype.width = function () {
    return this.canvas.width;
}
CanvasText.prototype.height = function () {
    return this.canvas.height;
}
CanvasText.prototype.drawText = function (text, ctxOptions) {

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.font = ctxOptions.font

    this.textWidth = Math.max(1, Math.ceil(this.ctx.measureText(text).width))
    this.textHeight = getFontHeight(this.ctx.font)

    this.canvas.width = THREE.Math.nextPowerOfTwo(this.textWidth)
    this.canvas.height = THREE.Math.nextPowerOfTwo(this.textHeight)

    this.ctx.font = ctxOptions.font
    this.ctx.fillStyle = ctxOptions.fillStyle
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // stroke
    this.ctx.strokeStyle = ctxOptions.outlineStyle;
    this.ctx.miterLimit = 2;
    this.ctx.lineJoin = 'circle';

    if (ctxOptions.outlineSize > 0) {
        this.ctx.lineWidth = ctxOptions.outlineSize;
        this.ctx.strokeText(text, this.canvas.width * 0.5, this.canvas.height * 0.5);
    }
    this.ctx.lineWidth = 1;

    this.ctx.fillText(text, this.canvas.width * 0.5, this.canvas.height * 0.5);

    return this.canvas
}

// -------------------------------- SpriteText2d
SpriteText2D.prototype = new THREE.Object3D();
SpriteText2D.prototype.constructor = SpriteText2D;

function SpriteText2D (text, options) {
    THREE.Object3D.call(this);
    this._font = options.font || '30px Arial';
    this._fillStyle = options.fillStyle || '#FFFFFF';
    this._outlineSize = options.outlineSize || 0;
    this._outlineStyle = options.outlineStyle || 'black';
    this.canvas = new CanvasText()

    this.align = options.align || textAlign.center

    this.antialias = typeof (options.antialias === "undefined") ? true : options.antialias
    this.setText(text);
}

SpriteText2D.prototype.width = function () {
    return this.canvas.textWidth
}

SpriteText2D.prototype.height = function () {
    return this.canvas.textHeight
}

SpriteText2D.prototype.getText = function () {
    return this._text;
}

SpriteText2D.prototype.setText = function (value) {
    if (this._text !== value) {
        this._text = value;
        this.updateText();
    }
}

SpriteText2D.prototype.getFont = function () {
    return this._font;
}

SpriteText2D.prototype.setFont = function (value) {
    if (this._font !== value) {
        this._font = value;
        this.updateText();
    }
}

SpriteText2D.prototype.getFillStyle = function () {
    return this._fillStyle;
}

SpriteText2D.prototype.setFillStyle = function (value) {
    if (this._fillStyle !== value) {
        this._fillStyle = value;
        this.updateText();
    }
}

SpriteText2D.prototype.updateText = function () {
    this.canvas.drawText(this._text, {
        font: this._font,
        fillStyle: this._fillStyle,
        outlineStyle: this._outlineStyle,
        outlineSize: this._outlineSize
    })

    // cleanup previous texture
    this.cleanUp()

    this.texture = new THREE.Texture(this.canvas.canvas);
    this.texture.needsUpdate = true;
    this.applyAntiAlias()

    if (!this.material) {
        this.material = new THREE.SpriteMaterial({
            map: this.texture
        });
    } else {
        this.material.map = this.texture
    }

    if (!this.sprite) {
        this.sprite = new THREE.Sprite(this.material)
        this.add(this.sprite)
    }
    this.sprite.scale.set(this.canvas.width(), this.canvas.height(), 1)
}

SpriteText2D.prototype.cleanUp = function () {
    if (this.texture) {
        this.texture.dispose()
    }
}
SpriteText2D.prototype.finalCleanUp = function () {
    this.cleanUp()
    if (this.material) {
        this.material.dispose();
    }
    if (this.sprite) {
        this.remove(this.sprite);
        this.sprite = undefined;
    }
}
SpriteText2D.prototype.applyAntiAlias = function () {
    if (this.antialias === false) {
        this.texture.magFilter = THREE.NearestFilter
        this.texture.minFilter = THREE.LinearMipMapLinearFilter
    }
}