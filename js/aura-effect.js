// Implementation of Turrell's "aura" color transition effect
const createTurrellAura = () => {
    // Vertex shader remains the same
    const vertexShader = `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    // Fragment shader with expanding/contracting color transition
    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      
      uniform vec3 prevColor;   // Previous center color
      uniform vec3 nextColor;   // Next center color
      uniform vec3 edgeColor;   // Edge color
      uniform float transition; // 0-1 transition value
      uniform float aspectRatio;
      uniform float noiseAmount;
      
      // Simple noise function for dithering
      float rand(vec2 co) {
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        // Center and correct aspect ratio
        vec2 center = vec2(0.5, 0.5);
        vec2 adjustedUV = vUv;
        adjustedUV.x = (vUv.x - 0.5) * aspectRatio + 0.5;
        
        // Calculate distance from center
        float dist = distance(adjustedUV, center) * 2.0;
        
        // The expanding/contracting aura effect
        // Based on research description of color "flooding" and then "imploding"
        float radius = transition * 1.5; // As transition increases, radius grows beyond screen
        
        // Create soft edge for the transition boundary
        float edgeWidth = 0.1 + 0.1 * sin(transition * 3.14159); // Edge varies slightly
        float colorMix = smoothstep(radius - edgeWidth, radius + edgeWidth, dist);
        
        // Choose colors based on transition and distance
        vec3 centerColor = mix(prevColor, nextColor, smoothstep(0.0, 0.4, transition));
        
        // Create the final color blend
        vec3 color;
        if (transition < 0.5) {
          // First half: color expands from center
          color = mix(centerColor, edgeColor, colorMix);
        } else {
          // Second half: new color contracts from outside
          color = mix(nextColor, mix(prevColor, edgeColor, colorMix), 
                    smoothstep(0.5, 1.0, transition));
        }
        
        // Apply Gaussian "glow" effect for more realistic light diffusion
        float glow = exp(-(dist * dist) / 0.5);
        color = mix(color, centerColor, 0.2 * glow);
        
        // Apply dithering to reduce banding
        color += (noiseAmount/255.0) * rand(gl_FragCoord.xy) - (noiseAmount/510.0);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    
    // Create a material with the shader
    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        prevColor: { value: new THREE.Color(0x3060FF) },  // Initial color
        nextColor: { value: new THREE.Color(0xFF6030) },  // Target color
        edgeColor: { value: new THREE.Color(0xF0F0F0) },  // Edge color
        transition: { value: 0.0 },                       // Starts at 0
        aspectRatio: { value: window.innerWidth / window.innerHeight },
        noiseAmount: { value: 1.5 }                       // Dithering strength
      }
    });
    
    // Create a simple plane to display the shader
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    
    // Define the color sequence for transitions
    const colorSequence = [
      { color: new THREE.Color(0x3060FF), holdTime: 10000 }, // Blue, hold 10s
      { color: new THREE.Color(0xFF6030), holdTime: 8000 },  // Orange, hold 8s
      { color: new THREE.Color(0x50D080), holdTime: 10000 }, // Green, hold 10s
      { color: new THREE.Color(0xD050A0), holdTime: 8000 }   // Pink, hold 8s
    ];
    
    let currentIndex = 0;
    let nextIndex = 1;
    let transitionActive = false;
    let transitionStart = 0;
    let transitionDuration = 6000; // 6-second transition
    
    // Animation function
    const animate = (time) => {
      time = time || 0;
      
      if (!transitionActive) {
        // Start a new transition after hold time
        if (time - transitionStart > colorSequence[currentIndex].holdTime) {
          transitionActive = true;
          transitionStart = time;
          material.uniforms.prevColor.value.copy(colorSequence[currentIndex].color);
          material.uniforms.nextColor.value.copy(colorSequence[nextIndex].color);
          material.uniforms.transition.value = 0;
        }
      } else {
        // Handle active transition
        const progress = Math.min(1.0, (time - transitionStart) / transitionDuration);
        material.uniforms.transition.value = progress;
        
        // Transition complete
        if (progress >= 1.0) {
          transitionActive = false;
          transitionStart = time;
          currentIndex = nextIndex;
          nextIndex = (nextIndex + 1) % colorSequence.length;
        }
      }
    };
    
    // Handle window resize
    const onResize = () => {
      material.uniforms.aspectRatio.value = window.innerWidth / window.innerHeight;
    };
    
    window.addEventListener('resize', onResize);
    
    return {
      mesh,
      animate,
      uniforms: material.uniforms
    };
  };