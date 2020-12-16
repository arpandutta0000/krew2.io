'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function (THREE) {

	var measureText = function () {
		var ctx = document.createElement('canvas').getContext('2d');

		return function (font, text) {
			ctx.font = font;
			return ctx.measureText(text);
		};
	}();

	THREE.TextTexture = function (_THREE$Texture) {
		_inherits(_class, _THREE$Texture);

		function _class() {
			var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
			    _ref$autoRedraw = _ref.autoRedraw,
			    autoRedraw = _ref$autoRedraw === undefined ? true : _ref$autoRedraw,
			    _ref$text = _ref.text,
			    text = _ref$text === undefined ? '' : _ref$text,
			    _ref$fontStyle = _ref.fontStyle,
			    fontStyle = _ref$fontStyle === undefined ? 'normal' : _ref$fontStyle,
			    _ref$fontVariant = _ref.fontVariant,
			    fontVariant = _ref$fontVariant === undefined ? 'normal' : _ref$fontVariant,
			    _ref$fontWeight = _ref.fontWeight,
			    fontWeight = _ref$fontWeight === undefined ? 'normal' : _ref$fontWeight,
			    _ref$fontSize = _ref.fontSize,
			    fontSize = _ref$fontSize === undefined ? 16 : _ref$fontSize,
			    _ref$fontFamily = _ref.fontFamily,
			    fontFamily = _ref$fontFamily === undefined ? 'sans-serif' : _ref$fontFamily,
			    _ref$textAlign = _ref.textAlign,
			    textAlign = _ref$textAlign === undefined ? 'center' : _ref$textAlign,
			    _ref$lineHeight = _ref.lineHeight,
			    lineHeight = _ref$lineHeight === undefined ? 1 : _ref$lineHeight,
			    _ref$padding = _ref.padding,
			    padding = _ref$padding === undefined ? 1 / 4 : _ref$padding,
			    _ref$magFilter = _ref.magFilter,
			    magFilter = _ref$magFilter === undefined ? THREE.LinearFilter : _ref$magFilter,
			    _ref$minFilter = _ref.minFilter,
			    minFilter = _ref$minFilter === undefined ? THREE.LinearFilter : _ref$minFilter,
			    mapping = _ref.mapping,
			    wrapS = _ref.wrapS,
			    wrapT = _ref.wrapT,
			    format = _ref.format,
			    type = _ref.type,
			    anisotropy = _ref.anisotropy;

			_classCallCheck(this, _class);

			var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, document.createElement('canvas'), mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy));

			_this.autoRedraw = autoRedraw;
			_this._text = text;
			_this._fontStyle = fontStyle;
			_this._fontVariant = fontVariant;
			_this._fontWeight = fontWeight;
			_this._fontSize = fontSize;
			_this._fontFamily = fontFamily;
			_this._textAlign = textAlign;
			_this._lineHeight = lineHeight;
			_this._padding = padding;
			/*
   this._lines = undefined;
   this._font = undefined;
   this._textWidth = undefined;
   this._textHeight = undefined;
   */
			_this.redraw();
			return _this;
		}

		_createClass(_class, [{
			key: 'redraw',
			value: function redraw() {
				var _this2 = this;

				var ctx = this.image.getContext('2d');
				ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				if (this.textWidth && this.textHeight) {
					ctx.canvas.width = this.textWidth + this.paddingInPixels * 2;
					ctx.canvas.height = this.textHeight + this.paddingInPixels * 2;
					ctx.font = this.font;
					ctx.textAlign = this.textAlign;
					ctx.textBaseline = 'middle';
					ctx.fillStyle = 'white';
					var left = this.paddingInPixels + function () {
						switch (ctx.textAlign.toLowerCase()) {
							case 'left':
								return 0;
							case 'right':
								return _this2.textWidth;
							case 'center':
								return _this2.textWidth / 2;
						}
					}();
					var top = this.paddingInPixels + this.fontSize / 2;
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = this.lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var line = _step.value;

							ctx.fillText(line, left, top);
							top += this.lineHeightInPixels;
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator.return) {
								_iterator.return();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}
				} else {
					ctx.canvas.width = ctx.canvas.height = 1;
				}
				this.needsUpdate = true;
			}
		}, {
			key: '_redrawIfAuto',
			value: function _redrawIfAuto() {
				if (this.autoRedraw) {
					this.redraw();
				}
			}
		}, {
			key: '_computeLines',
			value: function _computeLines() {
				if (this.text) {
					return this.text.split('\n');
				}
				return [];
			}
		}, {
			key: '_computeFont',
			value: function _computeFont() {
				return [this.fontStyle, this.fontVariant, this.fontWeight, this.fontSize + 'px', this.fontFamily].join(' ');
			}
		}, {
			key: '_computeTextWidth',
			value: function _computeTextWidth() {
				var returns = 0;
				var _iteratorNormalCompletion2 = true;
				var _didIteratorError2 = false;
				var _iteratorError2 = undefined;

				try {
					for (var _iterator2 = this.lines[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
						var line = _step2.value;

						returns = Math.max(measureText(this.font, line).width, returns);
					}
				} catch (err) {
					_didIteratorError2 = true;
					_iteratorError2 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion2 && _iterator2.return) {
							_iterator2.return();
						}
					} finally {
						if (_didIteratorError2) {
							throw _iteratorError2;
						}
					}
				}

				return returns;
			}
		}, {
			key: '_computeTextHeight',
			value: function _computeTextHeight() {
				return this.fontSize * (this.lineHeight * (this.linesCount - 1) + 1);
			}
		}, {
			key: 'text',
			get: function get() {
				return this._text;
			},
			set: function set(value) {
				if (this._text !== value) {
					this._text = value;
					this._lines = undefined;
					this._textWidth = undefined;
					this._textHeight = undefined;
					this._redrawIfAuto();
				}
			}
		}, {
			key: 'lines',
			get: function get() {
				if (this._lines === undefined) {
					this._lines = this._computeLines();
				}
				return this._lines;
			}
		}, {
			key: 'linesCount',
			get: function get() {
				return this.lines.length;
			}
		}, {
			key: 'fontStyle',
			get: function get() {
				return this._fontStyle;
			},
			set: function set(value) {
				if (this._fontStyle !== value) {
					this._fontStyle = value;
					this._font = undefined;
					this._textWidth = undefined;
					this._redrawIfAuto();
				}
			}
		}, {
			key: 'fontVariant',
			get: function get() {
				return this._fontVariant;
			},
			set: function set(value) {
				if (this._fontVariant !== value) {
					this._fontVariant = value;
					this._font = undefined;
					this._textWidth = undefined;
					this._redrawIfAuto();
				}
			}
		}, {
			key: 'fontWeight',
			get: function get() {
				return this._fontWeight;
			},
			set: function set(value) {
				if (this._fontWeight !== value) {
					this._fontWeight = value;
					this._font = undefined;
					this._textWidth = undefined;
					this._redrawIfAuto();
				}
			}
		}, {
			key: 'fontSize',
			get: function get() {
				return this._fontSize;
			},
			set: function set(value) {
				if (this._fontSize !== value) {
					this._fontSize = value;
					this._font = undefined;
					this._textWidth = undefined;
					this._textHeight = undefined;
					this._redrawIfAuto();
				}
			}
		}, {
			key: 'fontFamily',
			get: function get() {
				return this._fontFamily;
			},
			set: function set(value) {
				if (this._fontFamily !== value) {
					this._fontFamily = value;
					this._font = undefined;
					this._textWidth = undefined;
					this._redrawIfAuto();
				}
			}
		}, {
			key: 'font',
			get: function get() {
				if (this._font === undefined) {
					this._font = this._computeFont();
				}
				return this._font;
			}
		}, {
			key: 'textAlign',
			get: function get() {
				return this._textAlign;
			},
			set: function set(value) {
				if (this._textAlign !== value) {
					this._textAlign = value;
					this._redrawIfAuto();
				}
			}
		}, {
			key: 'lineHeight',
			get: function get() {
				return this._lineHeight;
			},
			set: function set(value) {
				if (this._lineHeight !== value) {
					this._lineHeight = value;
					this._textHeight = undefined;
					this._redrawIfAuto();
				}
			}
		}, {
			key: 'lineHeightInPixels',
			get: function get() {
				return this.fontSize * this.lineHeight;
			}
		}, {
			key: 'textWidth',
			get: function get() {
				if (this._textWidth === undefined) {
					this._textWidth = this._computeTextWidth();
				}
				return this._textWidth;
			}
		}, {
			key: 'textHeight',
			get: function get() {
				if (this._textHeight === undefined) {
					this._textHeight = this._computeTextHeight();
				}
				return this._textHeight;
			}
		}, {
			key: 'padding',
			get: function get() {
				return this._padding;
			},
			set: function set(value) {
				if (this._padding !== value) {
					this._padding = value;
					this._redrawIfAuto();
				}
			}
		}, {
			key: 'paddingInPixels',
			get: function get() {
				return this.fontSize * this.padding;
			}
		}, {
			key: 'aspect',
			get: function get() {
				if (this.image.width && this.image.height) {
					return this.image.width / this.image.height;
				}
				return 1;
			}
		}]);

		return _class;
	}(THREE.Texture);
}).call(undefined, THREE);
