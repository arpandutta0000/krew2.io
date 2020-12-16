/**
 * @author Christian Cesar Robledo Lopez aka Masquerade circus (christian@masquerade-circus.net)
 */
(function () {
    var CanvasMap = function (element, width, height, contextMode) {
        var canvas = {};
        canvas.element = element;
        canvas.contextMode = contextMode || '2d';
        canvas.context = canvas.element.getContext(canvas.contextMode);
        canvas.useRadians = false;
        canvas.zoom = 1;
        canvas.world = {
            width: width,
            height: height,
            rotation: 0,
        };
        canvas.scale = {
            width: 0,
            height: 0,
        };
        canvas.elements = {};

        canvas.randomId = function () {
            var id = (0 | Math.random() * 9e6).toString(36);
            if (canvas.elements[id] !== undefined) {
                id = canvas.randomId();
            }

            return id;
        };

        canvas.add = function (object) {
            if (object) {
                object.id = object.id || canvas.randomId();
                if (canvas.elements[object.id] === undefined) {
                    canvas.elements[object.id] = object;
                }
            }

            return canvas;
        };

        canvas.remove = function (object) {
            if (object && object.id && canvas.elements[object.id]) {
                delete canvas.elements[object.id];
            }

            return canvas;
        };

        canvas.draw = function () {
            var i;
            var newWidth = (canvas.context.canvas.width * canvas.zoom);
            var newHeight = (canvas.context.canvas.height * canvas.zoom);

            canvas.scale.width = 1 / canvas.world.width * canvas.context.canvas.width;
            canvas.scale.height = 1 / canvas.world.height * canvas.context.canvas.height;

            canvas.context.resetTransform();

            canvas.context.clearRect(0, 0, canvas.context.canvas.width, canvas.context.canvas.height);

            if (canvas.world.rotation) {
                canvas.context.translate(canvas.context.canvas.width / 2, canvas.context.canvas.height / 2);

                canvas.context.rotate(
                    canvas.useRadians ?
                        canvas.world.rotation :
                        Math.PI / 180 * canvas.world.rotation
                );

                canvas.context.translate(-canvas.context.canvas.width / 2, -canvas.context.canvas.height / 2);
            }

            canvas.context.translate(
                -((newWidth - canvas.context.canvas.width) / 2),
                -((newHeight - canvas.context.canvas.height) / 2)
            );
            canvas.context.scale(canvas.zoom, canvas.zoom);

            for (i in canvas.elements) {
                if (canvas.elements[i].draw) {
                    canvas.elements[i].draw();
                }
            }

            return canvas;
        };

        canvas.toWorld = function (obj) {
            var result = Object.assign({}, obj);
            if (obj.x && obj.x !== 0) {
                result.x = obj.x * canvas.scale.width;
            }

            if (obj.y && obj.y !== 0) {
                result.y = obj.y * canvas.scale.height;
            }

            if (obj.r && obj.r !== 0) {
                result.r = obj.r * canvas.scale.width;
            }

            if (obj.width && obj.width !== 0) {
                result.width = obj.width * canvas.scale.width;
            }

            if (obj.height && obj.height !== 0) {
                result.height = obj.height * canvas.scale.height;
            }

            if (obj.size && obj.size !== 0) {
                result.size = obj.size * canvas.scale.width;
            }

            if (obj.rotation && obj.rotation !== 0) {
                result.rotation =
                    canvas.useRadians ?
                        obj.rotation :
                        Math.PI / 180 * obj.rotation;
            }

            delete result.draw;
            delete result.id;
            delete result.toWorld;

            return result;
        };

        canvas.point = function (options) {
            var el = Object.assign(
                {
                    id: undefined,
                    x: 0,
                    y: 0,
                    r: 1,
                    fill: undefined,
                    stroke: options.stroke ? {
                        color: options.stroke.color || 'black',
                        width: options.stroke.width || 1,
                    } : undefined,
                },
                options
            );

            el.toWorld = function () {
                return canvas.toWorld(el);
            };

            el.draw = function () {
                var worldPosition = el.toWorld();
                if (el.fill) {
                    canvas.context.fillStyle = el.fill;
                    canvas.context.beginPath();
                    canvas.context.arc(
                      worldPosition.x,
                      worldPosition.y,
                      worldPosition.r,
                      0,
                      Math.PI * 2,
                      true
                    );
                    canvas.context.fill();
                }

                if (el.stroke) {
                    canvas.context.strokeStyle = el.stroke.color;
                    canvas.context.lineWidth = el.stroke.width * canvas.scale.width;
                    canvas.context.beginPath();
                    canvas.context.arc(
                      worldPosition.x,
                      worldPosition.y,
                      worldPosition.r,
                      0,
                      Math.PI * 2,
                      true
                    );
                    canvas.context.stroke();
                }
            };

            return el;
        };

        canvas.rect = function (options) {
            var el = Object.assign(
                {
                    id: undefined,
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1,
                    fill: undefined,
                    stroke: options.stroke ? {
                        color: options.stroke.color || 'black',
                        width: options.stroke.width || 1,
                    } : undefined,
                },
                options
            );

            el.toWorld = function () {
                return canvas.toWorld(el);
            };

            el.draw = function () {
                var worldPosition = el.toWorld();

                if (el.fill) {
                    canvas.context.fillStyle = el.fill;
                    canvas.context.fillRect(worldPosition.x, worldPosition.y, worldPosition.width, worldPosition.height);
                }

                if (el.stroke) {
                    canvas.context.strokeStyle = el.stroke.color;
                    canvas.context.lineWidth = el.stroke.width * canvas.scale.width;
                    canvas.context.strokeRect(worldPosition.x, worldPosition.y, worldPosition.width, worldPosition.height);
                }
            };

            return el;
        };

        canvas.triangle = function (options) {
            var el = Object.assign(
                {
                    id: undefined,
                    x: 0,
                    y: 0,
                    size: 1,
                    rotation: 0,
                    fill: undefined,
                    stroke: options.stroke ? {
                        color: options.stroke.color || 'black',
                        width: options.stroke.width || 1,
                    } : undefined,
                },
                options
            );

            el.toWorld = function () {
                return canvas.toWorld(el);
            };

            el.draw = function () {
                var worldPosition = el.toWorld();
                var s = worldPosition.size / 2;
                canvas.context.save();
                canvas.context.translate(worldPosition.x, worldPosition.y);
                canvas.context.rotate(worldPosition.rotation);
                canvas.context.translate(-(worldPosition.x), -(worldPosition.y));

                if (el.fill) {
                    canvas.context.fillStyle = el.fill;
                    canvas.context.beginPath();
                    canvas.context.moveTo(worldPosition.x - s, worldPosition.y + s);
                    canvas.context.lineTo(worldPosition.x, worldPosition.y - s);
                    canvas.context.lineTo(worldPosition.x + s, worldPosition.y + s);
                    canvas.context.lineTo(worldPosition.x - s, worldPosition.y + s);
                    canvas.context.fill();
                }

                if (el.stroke) {
                    canvas.context.strokeStyle = el.stroke.color;
                    canvas.context.lineWidth = el.stroke.width * canvas.scale.width;
                    canvas.context.beginPath();
                    canvas.context.moveTo(worldPosition.x - s, worldPosition.y + s);
                    canvas.context.lineTo(worldPosition.x, worldPosition.y - worldPosition.size);
                    canvas.context.lineTo(worldPosition.x + s, worldPosition.y + s);
                    canvas.context.lineTo(worldPosition.x - s, worldPosition.y + s);
                    canvas.context.stroke();
                }

                canvas.context.restore();
            };

            return el;
        };

        canvas.text = function (options) {
            var el = Object.assign(
                {
                    id: undefined,
                    x: 0,
                    y: 0,
                    text: '',
                    width: undefined,
                    font: 'serif',
                    size: 48,
                    align: 'center',
                    baseline: 'alphabetic',
                    fill: undefined,
                    stroke: options.stroke ? {
                        color: options.stroke.color || 'black',
                        width: options.stroke.width || 1,
                    } : undefined,
                },
                options
            );

            el.toWorld = function () {
                return canvas.toWorld(el);
            };

            el.draw = function () {
                var worldPosition = el.toWorld();
                canvas.context.textAlign = el.align;
                canvas.context.textBaseline = el.baseline;
                canvas.context.font = worldPosition.size + 'px ' + el.font;

                if (el.fill) {
                    canvas.context.fillStyle = el.fill;
                    canvas.context.fillText(el.text, worldPosition.x, worldPosition.y, worldPosition.width);
                }

                if (el.stroke) {
                    canvas.context.strokeStyle = el.stroke.color;
                    canvas.context.lineWidth = el.stroke.width * canvas.scale.width;
                    canvas.context.strokeText(el.text, worldPosition.x, worldPosition.y, worldPosition.width);
                }
            };

            return el;
        };

        return canvas;
    };

    window.CanvasMap = CanvasMap;
})(window);
