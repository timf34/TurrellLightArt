// Create a Turrell-inspired rectangular light artwork
const createTurrellRectangle = (config) => {
    // Vertex shader
    const vertexShader = `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    
    // Fragment shader for rectangular gradient
    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      
      uniform vec3 centerColor;
      uniform vec3 edgeColor;
      uniform vec3 backgroundColor;
      uniform vec2 rectDimensions; // Width and height of visible rectangle (0.0-1.0)
      uniform float time;
      uniform bool centerGlow;
      uniform float noiseAmount;
      
      // Function to calculate distance from point to rectangle edge
      float rectDistance(vec2 p, vec2 dimensions) {
        vec2 halfSize = dimensions * 0.5;
        vec2 center = vec2(0.5, 0.5);
        vec2 d = abs(p - center) - halfSize;
        return length(max(d, 0.0));
      }
      
      // Simple hash-based random noise for dithering
      float rand(vec2 co) {
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        // Calculate distance to rectangle edge
        float dist = rectDistance(vUv, rectDimensions);
        
        // Animate colors over time (very slow)
        float t = 0.5 + 0.5 * sin(time);
        vec3 animCenterColor = mix(centerColor, edgeColor, t * 0.5);
        vec3 animEdgeColor = mix(edgeColor, backgroundColor, t * 0.3);
        
        // Create color gradient
        vec3 color;
        
        if (dist <= 0.0) {
          // Inside rectangle: transition from center to edge
          vec2 center = vec2(0.5, 0.5);
          float centerDist = length((vUv - center) / (rectDimensions * 0.5));
          
          if (centerGlow) {
            // Add center glow effect for more Turrell-like appearance
            float glow = exp(-(centerDist * centerDist) / 0.5);
            centerDist = mix(centerDist, smoothstep(0.0, 1.0, centerDist), 0.7);
            color = mix(animCenterColor, animEdgeColor, centerDist);
            color = mix(color, animCenterColor, 0.3 * glow);
          } else {
            // Standard blend
            centerDist = smoothstep(0.0, 1.0, centerDist);
            color = mix(animCenterColor, animEdgeColor, centerDist);
          }
        } else {
          // Outside rectangle: transition from edge to background
          float t = smoothstep(0.0, 0.2, dist);
          color = mix(animEdgeColor, backgroundColor, t);
        }
        
        // Apply dithering to reduce banding
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
        edgeColor: { value: new THREE.Color(config.edgeColor) },
        backgroundColor: { value: new THREE.Color(config.backgroundColor) },
        rectDimensions: { value: new THREE.Vector2(config.width, config.height) },
        time: { value: 0 },
        centerGlow: { value: config.centerGlow || false },
        noiseAmount: { value: config.dithering || 1.5 }
      }
    });
    
    // Create a simple plane to display our shader
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    
    return mesh;
  };