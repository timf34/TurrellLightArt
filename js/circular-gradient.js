// Create a Turrell-inspired circular light artwork
const createTurrellCircle = (config) => {
    // Vertex shader - positions the geometry
    const vertexShader = `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    // Fragment shader - creates the color gradient effect
    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      
      uniform vec3 centerColor;
      uniform vec3 midColor;
      uniform vec3 outerColor;
      uniform vec3 backgroundColor;
      uniform float aspectRatio;
      uniform float time;
      uniform bool useGaussian;
      uniform float noiseAmount;
      
      // Simple hash-based random noise
      float rand(vec2 co) {
        return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
      }
      
      void main() {
        // Adjust UV coordinates to account for aspect ratio
        vec2 center = vec2(0.5, 0.5);
        vec2 adjustedUV = vUv;
        adjustedUV.x = (vUv.x - 0.5) * aspectRatio + 0.5;
        
        // Calculate distance from center (0 to ~0.7)
        float dist = distance(adjustedUV, center) * 2.0;
        
        // Create smooth transitions between colors
        vec3 color;
        
        // Animate colors: oscillate between color sets over time
        float t = 0.5 + 0.5 * sin(time);
        vec3 innerCol = mix(centerColor, midColor, t);
        vec3 middleCol = mix(midColor, outerColor, t);
        vec3 outCol = mix(outerColor, backgroundColor, t);
        
        if (useGaussian) {
          // Apply Gaussian falloff for more realistic light diffusion
          float falloff = exp(-(dist * dist) / 0.25);
          
          // Using smoothstep for more natural gradient transition
          float blendFactor = smoothstep(0.0, 0.7, dist);
          color = mix(innerCol, middleCol, blendFactor);
          
          if (dist > 0.5) {
            float outerBlend = smoothstep(0.5, 1.0, dist);
            color = mix(color, outCol, outerBlend);
          }
        } else {
          // Simpler three-color gradient
          if (dist < 0.3) {
            float t = smoothstep(0.0, 0.3, dist);
            color = mix(innerCol, middleCol, t);
          } else if (dist < 0.7) {
            float t = smoothstep(0.3, 0.7, dist);
            color = mix(middleCol, outCol, t);
          } else {
            color = outCol;
          }
        }
        
        // Dither to reduce banding
        color += (noiseAmount/255.0) * rand(gl_FragCoord.xy) - (noiseAmount/510.0);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    
    // Create shader material
    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        centerColor: { value: new THREE.Color(config.centerColor) },
        midColor: { value: new THREE.Color(config.midColor) },
        outerColor: { value: new THREE.Color(config.outerColor) },
        backgroundColor: { value: new THREE.Color(config.backgroundColor) },
        aspectRatio: { value: window.innerWidth / window.innerHeight },
        time: { value: 0 },
        useGaussian: { value: config.useGaussian || false },
        noiseAmount: { value: config.dithering || 1.5 }
      }
    });
    
    // Create a simple plane to display our shader
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    
    return mesh;
  };