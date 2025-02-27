document.addEventListener('DOMContentLoaded', () => {
    // Set up the Three.js environment
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    // Configure renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    document.body.appendChild(renderer.domElement);
    
    // Position camera
    camera.position.z = 0.5;
    
    // Initialize controls
    const controls = createControls(scene, renderer, camera);
    
    // Set initial scene
    controls.updateScene();
    
    // Start animation
    const animate = controls.getAnimateFunction();
    if (animate) animate();
  });