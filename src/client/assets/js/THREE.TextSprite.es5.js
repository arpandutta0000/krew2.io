"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function (THREE) {

	var onBeforeRender = function onBeforeRender(renderer, a, camera) {
		var _this = this;

		if (Date.now() > this.lastRedraw + this.redrawInterval) {
			if (this.redrawInterval) {
				setTimeout(function () {
					_this.redraw(renderer, camera);
				});
			} else {
				this.redraw(renderer, camera);
			}
		} else {
			this.updateScale();
		}
	};

	THREE.TextSprite = function (_THREE$Sprite) {
		_inherits(_class, _THREE$Sprite);

		function _class() {
			var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
			    _ref$textSize = _ref.textSize,
			    textSize = _ref$textSize === undefined ? 1 : _ref$textSize,
			    _ref$redrawInterval = _ref.redrawInterval,
			    redrawInterval = _ref$redrawInterval === undefined ? 1 : _ref$redrawInterval,
			    _ref$roundFontSizeToN = _ref.roundFontSizeToNearestPowerOfTwo,
			    roundFontSizeToNearestPowerOfTwo = _ref$roundFontSizeToN === undefined ? true : _ref$roundFontSizeToN,
			    _ref$maxFontSize = _ref.maxFontSize,
			    maxFontSize = _ref$maxFontSize === undefined ? Infinity : _ref$maxFontSize,
			    _ref$material = _ref.material,
			    material = _ref$material === undefined ? {} : _ref$material,
			    _ref$texture = _ref.texture,
			    texture = _ref$texture === undefined ? {} : _ref$texture;

			_classCallCheck(this, _class);

			var _this2 = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, new THREE.SpriteMaterial(Object.assign({}, material, { map: new THREE.TextTexture(texture) }))));

			_this2._textSize = textSize;
			_this2.redrawInterval = redrawInterval;
			_this2.roundFontSizeToNearestPowerOfTwo = roundFontSizeToNearestPowerOfTwo;
			_this2.maxFontSize = maxFontSize;
			_this2.lastRedraw = 0;

			_this2._renderMesh = new THREE.Mesh();
			_this2._renderMesh.onBeforeRender = onBeforeRender.bind(_this2);
			_this2.add(_this2._renderMesh);
			return _this2;
		}

		_createClass(_class, [{
			key: "updateScale",
			value: function updateScale() {
				this.scale.set(this.material.map.aspect, 1, 1).multiplyScalar(this.textSize);
			}
		}, {
			key: "updateMatrix",
			value: function updateMatrix() {
				var _get2;

				this.updateScale();

				for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
					args[_key] = arguments[_key];
				}

				return (_get2 = _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), "updateMatrix", this)).call.apply(_get2, [this].concat(args));
			}
		}, {
			key: "computeOptimalFontSize",
			value: function computeOptimalFontSize(renderer, camera) {
				if (renderer.domElement.width && renderer.domElement.height && this.material.map.linesCount) {
					var distance = this.getWorldPosition().distanceTo(camera.getWorldPosition());
					if (distance) {
						var heightInPixels = this.getWorldScale().y * renderer.domElement.height / distance;
						if (heightInPixels) {
							return Math.round(heightInPixels / (this.material.map.linesCount + 2 * this.material.map.padding));
						}
					}
				}
				return 0;
			}
		}, {
			key: "redraw",
			value: function redraw(renderer, camera) {
				this.updateScale();
				var fontSize = this.computeOptimalFontSize(renderer, camera);
				if (this.roundFontSizeToNearestPowerOfTwo) {
					fontSize = THREE.Math.floorPowerOfTwo(fontSize);
				}
				fontSize = Math.min(fontSize, this.maxFontSize);
				this.material.map.fontSize = fontSize;
				this.lastRedraw = Date.now();
			}
		}, {
			key: "dispose",
			value: function dispose() {
				this.material.map.dispose();
				this.material.dispose();
			}
		}, {
			key: "textSize",
			get: function get() {
				return this._textSize;
			},
			set: function set(value) {
				if (this._textSize !== value) {
					this._textSize = value;
				}
			}
		}]);

		return _class;
	}(THREE.Sprite);

	Object.assign(THREE.TextSprite.prototype, {
		isTextSprite: true
	});
}).call(undefined, THREE);
