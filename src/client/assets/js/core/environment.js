let environment = {}

let setUpEnvironment = () => {
    // Add fog.
    scene.fog = new THREE.FogExp2(0xd5e1e3, 0.007);
    renderer.setClearColor(0x00c5ff);

    // Add light.
    ambientLight = new THREE.AmbientLight(0xC4CEE2);
    scene.add(ambientLight);

    // Environment cube.
    environment.sphere = new THREE.Mesh(new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry(4e3)), materials.sky);
    scene.add(environment.sphere);
    environment.sphere.scale.y = 0.05;

    THREE.Water = (geometry, options) => {
        THREE.Mesh.call(this, geometry);

        let scope = this;
        options = options || {};

        let textureWidth = options.textureWidth != undefined ? options.textureWidth: 512;
        let textureHeight = options.textureHeight != undefined ? options.textureHeight: 512;

        let alpha = options.alpha != undefined ? options.alpha: 1.0;
        let time = options.time != undefined ? options.time: 0.0;

        let normalSampler = options.waterNormals != undefined ? options.waterNormals: null;
        let sunDirection = options.sunDirection != undefined ? options.sunDirection: new THREE.Vector3(0.70707, 0.70707, 0.0);

        let sunColor = new THREE.Color(options.sunColor != undefined ? options.sunColor: 0xffffff);
        let waterColor = new THREE.Color(options.waterColor != undefined ? options.waterColor: 0x7f7f7f);

        let distortionScale = options.distortionScale != undefined ? options.distortionScale: 20.0;

        let eye = options.eye != undefined ? options.eye: new THREE.Vector3(0, 0, 0);
        let side = options.side != undefined ? options.side: THREE.FrontSide;
        let fog = options.fog != undefined ? options.fog: false;

        let normal = new THREE.Vector3();
        let target = new THREE.Vector3();
        let textureMatrix = new THREE.Matrix4();

        let parameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBFormat,
            stencilBuffer: false
        }

        let renderTarget = new THREE.WebGLRenderTarget(textureWidth, textureHeight, parameters);
        if(!THREE.Math.isPowerOfTwo(textureWidth) || !THREE.Math.isPowerOfTwo(textureHeight)) renderTarget.texture.generatedMipmaps = false;

        let mirrorShader = {
            uniforms: THREE.UniformsUtils.merge([
                THREE.UniformsLib.fog,
                THREE.UniformsLib.lights,
                {
                    normalSampler: { value: null },
                    mirrorSampler: { value: null },
                    alpha: { value: 1.0 },
                    time: { value: 0.0 },
                    size: { value: 10.0 },
                    distortionScale: { value: 0.0 },
                    textureMatrix: { value: new THREE.Matrix4() },
                    sunColor: { value: new THREE.Color(0x7f7f7f) },
                    sunDirection: { value: new THREE.Vector3(0, 0.70707, 0) },
                    eye: { value: new THREE.Vector3() },
                    waterColor: { value: new THREE.Color(0x555555) }
                }
            ]),
            vertexShader: [
                `uniform mat4 textureMatrix;`,
                `uniform float time;`,
                
                `varying vec4 mirrorCoord;`,
                `varying vec4 worldPosition;`,

                THREE.ShaderChunk.fog_vertex,
                THREE.ShaderChunk.shadowmap_vertex,
                `}`
            ].join(`\n`),
            fragmentShader: [
                `uniform sampler2D mirrorSampler;`,
                `uniform float alpha;`,
                `uniform float time;`,
                `uniform float size;`,
                `uniform float distortionScale;`,
                `uniform sampler2D normalSampler;`,
                `uniform vec3 sunColor;`,
                `uniform vec3 sunDirection;`,
                `uniform vec3 eye;`,
                `uniform vec3 waterColor;`,
    
                `varying vec4 mirrorCoord;`,
                `varying vec4 worldPosition;`,
    
                `vec4 getNoise( vec2 uv ) {`,
                `	vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);`,
                `	vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );`,
                `	vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );`,
                `	vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );`,
                `	vec4 noise = texture2D( normalSampler, uv0 ) +`,
                `		texture2D( normalSampler, uv1 ) +`,
                `		texture2D( normalSampler, uv2 ) +`,
                `		texture2D( normalSampler, uv3 );`,
                `	return noise * 0.5 - 1.0;`,
                `}`,
    
                `void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {`,
                `	vec3 reflection = normalize( reflect( sunDirection, surfaceNormal ) );`,
                `	float direction = max( 0.0, dot( eyeDirection, reflection ) );`,
                `	specularColor -= pow( direction, shiny ) * sunColor * spec;`,
                `	diffuseColor -= max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;`,
                `}`,

                THREE.ShaderChunk.common,
                THREE.ShaderChunk.packing,
                THREE.ShaderChunk.bsdfs,
                THREE.ShaderChunk.fog_pars_fragment,
                THREE.ShaderChunk.lights_pars_begin,
                THREE.ShaderChunk.shadowmap_pars_fragment,
                THREE.ShaderChunk.shadowmask_pars_fragment,

                `void main() {`,
                `	vec4 noise = getNoise( worldPosition.xz * size );`,
                `	vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );`,
    
                `	vec3 diffuseLight = vec3(0.0);`,
                `	vec3 specularLight = vec3(0.0);`,
    
                `	vec3 worldToEye = eye-worldPosition.xyz;`,
                `	vec3 eyeDirection = vec3( 0.7, 0.5, 0.9 );`,
                `	sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );`,
    
                `	float distance = length(worldToEye);`,
    
                `	vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;`,
                `	vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );`,
    
                `	float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );`,
                `	float rf0 = 0.3;`,
                `	float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );`,
                `	vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;`,
                `	vec3 albedo = mix( ( sunColor * diffuseLight * 0.001 + scatter ) * getShadowMask(), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);`,
                `	vec3 outgoingLight = albedo;`,
                `	gl_FragColor = vec4( outgoingLight, alpha );`,

                THREE.ShaderChunk.tonemapping_fragment,
                THREE.ShaderChunk.fog_fragment,

                `}`
            ].join(`\n`)
        }
        let material = new THREE.ShaderMaterial({
            fragmentShader: mirrorShader.fragmentShader,
            vertexShader: mirrorShader.vertexShader,
            uniforms: THREE.UniformsUtils.clone(mirrorShader.uniforms),
            transparent: false,
            lights: true,
            side,
            fog
        });

        material.uniforms.mirrorSampler.value = renderTarget.texture;
        material.uniforms.textureMatrix.value = textureMatrix;
        material.uniforms.alpha.value = alpha;
        material.uniforms.time.value = time;
        material.uniforms.normalSampler.value = normalSampler;
        material.uniforms.sunColor.value = sunColor;
        material.uniforms.waterColor.value = waterColor;
        material.uniforms.sunDirection.value = sunDirection;
        material.uniforms.distortionScale.value = distortionScale;
        material.uniforms.eye.value = eye;

        scope.material = material;
        
        scope.onBeforeRender = (renderer, scene, camera) => {
            let currentRenderTarget = renderer.getRenderTarget();

            renderer.setRenderTarget(renderTarget);
            renderer.clear();
            renderer.setRenderTarget(currentRenderTarget);
        }
    }

    THREE.Water.prototype = Object.create(THREE.Mesh.prototype);
    THREE.Water.prototype.constructor = THREE.Water;


    const initWater = () => {
        light = new THREE.DirectionalLight(0xf9f6da, 0.5);
        light.position.set(0, 100, 0);
        scene.add(light);
        
        let waterGeometry = new THREE.PlaneBufferGeometry(6000, 6000);
        water = new THREE.Water(
            waterGeometry,
            {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: textures.water,
                alpha: 1.0,
                sunDirection: light.position.clone().normalize(),
                sunColor: 0xffffff,
                waterColor: 0x8fc3f2,
                distortionScale: 10,
                fog: scene.fog != undefined
            }
        );
        water.rotation.x = (-1 * Math.PI)  / 2;
        scene.add(water);
    }
    initWater();

    // Draw water boundaries.

    // West
    environment.boundaryLeft = new THREE.Mesh(base_geometries.box, materials.boundary);
    environment.boundaryLeft.position.set(worldsize * 0.5, 1.5, 0);
    environment.boundaryLeft.scale.set(worldsize, 0.1, 3);

    // East
    environment.boundaryRight = new THREE.Mesh(base_geometries.box, materials.boundary);
    environment.boundaryRight.position.set(worldsize * 0.5, 1.5, worldsize);
    environment.boundaryRight.scale.set(worldsize, 0.1, 3);

    // North
    environment.boundaryUp = new THREE.Mesh(base_geometries.box, materials.boundary);
    environment.boundaryUp.position.set(0, 1.5, worldsize * 0.5);
    environment.boundaryUp.scale.set(worldsize, 0.1, worldsize);

    // South
    environment.boundaryDown = new THREE.Mesh(base_geometries.box, materials.boundary);
    environment.boundaryDown.position.set(worldsize, 1.5, worldsize * 0.5);
    environment.boundaryDown.scale.set(worldsize, 0.1, worldsize);

    // Add boundaries to scene.
    scene.add(environment.boundaryLeft);
    scene.add(environment.boundaryRight);
    scene.add(environment.boundaryUp);
    scene.add(environment.boundaryDown);

    // Daylight cycle.
    window.currentTime = 0;
    doDaylightCycle = time => {
        if(water && window.currentTime == time) return;
        let light = water.parent.children.find(f => f instanceof THREE.Light);
        window.currentTime = time;

        if(time == 1) {
            let i = 0;
            let anim = setInterval(() => {
                i++;
                light.intensity -= 0.01;

                water.material.uniforms.waterColor.value.r -= 0.004;
                water.material.uniforms.waterColor.value.g -= 0.006;
                water.material.uniforms.waterColor.value.b -= 0.008;

                water.parent.fog.color.r -= 0.008;
                water.parent.fog.color.g -= 0.008;
                water.parent.fog.color.b -= 0.008;

                if(i == 100) clearInterval(anim);
            }, 20);
        }
        else {
            let i = 0;
            let anim = setInterval(() => {
                i++;
                light.intensity += 0.01;

                water.material.uniforms.waterColor.value.r += 0.004;
                water.material.uniforms.waterColor.value.g += 0.006;
                water.material.uniforms.waterColor.value.b += 0.008;

                water.parent.fog.color.r += 0.008;
                water.parent.fog.color.g += 0.008;
                water.parent.fog.color.b += 0.008;

                if (i == 100) clearInterval(anim);
            }, 20);
        }
    }

    // Do daylight cycle.
    setInterval(() => {
        let date = new Date();
        if(date.getUTCMinutes() > 35 && date.getUTCMinutes() < 55) doDaylightCycle(1);
        else if(date.getUTCMinutes() < 35 || date.getUTCMinutes() > 55) doDaylightCycle(0);
    }, 200);
}
