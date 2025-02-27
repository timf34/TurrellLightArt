// Controls for the Turrell light art app
const createControls = (scene, renderer, camera) => {
    // Create configuration objects for our shapes
    const circleConfig = {
      centerColor: '#3060FF',
      midColor: '#40C0D0',
      outerColor: '#80E0E0',
      backgroundColor: '#C0C0C0',
      shape: 'circle',
      animationSpeed: 0.0005,
      useGaussian: true,
      dithering: 1.5
    };
  
    const rectangleConfig = {
      centerColor: '#3040FF',
      edgeColor: '#E0E080',
      backgroundColor: '#C0C0C0',
      width: 0.6,
      height: 0.9,
      shape: 'rectangle',
      animationSpeed: 0.0003,
      centerGlow: true,
      dithering: 1.5
    };
  
    // Currently active configuration
    let activeConfig = circleConfig;
    let activeMesh = null;
    let animateFunction = null;
  
    // Set up dat.GUI controls
    const gui = new dat.GUI();
  
    // Shape selector
    const shapeFolder = gui.addFolder('Shape');
    shapeFolder.add({ shape: 'circle' }, 'shape', ['circle', 'rectangle'])
      .onChange(value => {
        if (value === 'circle') {
          activeConfig = circleConfig;
        } else {
          activeConfig = rectangleConfig;
        }
        updateGUI();
        updateScene();
      });
  
    // Color and dimension controls
    const colorFolder = gui.addFolder('Colors');
    const dimensionFolder = gui.addFolder('Dimensions');
    const effectsFolder = gui.addFolder('Effects');
  
    // Arrays to store controller references
    let colorControllers = [];
    let dimensionControllers = [];
    let effectControllers = [];
  
    // Function to update the scene with the current configuration
    const updateScene = () => {
      // Remove current mesh if exists
      if (activeMesh) {
        scene.remove(activeMesh);
      }
      
      // Create new mesh based on selected shape
      if (activeConfig.shape === 'circle') {
        activeMesh = createTurrellCircle(activeConfig);
      } else {
        activeMesh = createTurrellRectangle(activeConfig);
      }
      
      scene.add(activeMesh);
      
      // Define animation function
      animateFunction = () => {
        requestAnimationFrame(animateFunction);
        if (activeMesh && activeMesh.material.uniforms.time) {
          activeMesh.material.uniforms.time.value += activeConfig.animationSpeed;
        }
        renderer.render(scene, camera);
      };
      
      // Start animation
      if (animateFunction) animateFunction();
    };
  
    // Function to update GUI controls based on active configuration
    const updateGUI = () => {
      // Remove existing controllers
      colorControllers.forEach(controller => {
        colorFolder.remove(controller);
      });
      
      dimensionControllers.forEach(controller => {
        dimensionFolder.remove(controller);
      });
      
      effectControllers.forEach(controller => {
        effectsFolder.remove(controller);
      });
      
      // Clear controller arrays
      colorControllers = [];
      dimensionControllers = [];
      effectControllers = [];
      
      // Add new controllers based on active shape
      if (activeConfig.shape === 'circle') {
        colorControllers.push(colorFolder.addColor(activeConfig, 'centerColor').onChange(updateColors));
        colorControllers.push(colorFolder.addColor(activeConfig, 'midColor').onChange(updateColors));
        colorControllers.push(colorFolder.addColor(activeConfig, 'outerColor').onChange(updateColors));
        colorControllers.push(colorFolder.addColor(activeConfig, 'backgroundColor').onChange(updateColors));
        
        effectControllers.push(effectsFolder.add(activeConfig, 'useGaussian').name('Gaussian Light').onChange(updateEffects));
        effectControllers.push(effectsFolder.add(activeConfig, 'animationSpeed', 0.0001, 0.005).name('Transition Speed').onChange(updateEffects));
        effectControllers.push(effectsFolder.add(activeConfig, 'dithering', 0, 3).name('Dithering Strength').onChange(updateEffects));
        
        // Add Ganzfeld effect option
        effectControllers.push(effectsFolder.add({ ganzfeld: false }, 'ganzfeld').name('Ganzfeld Mode').onChange(value => {
          if (value) {
            document.body.style.transition = 'background-color 2s';
            document.body.style.backgroundColor = activeConfig.centerColor;
            scene.background = new THREE.Color(activeConfig.centerColor);
            activeMesh.visible = false;
          } else {
            document.body.style.backgroundColor = '';
            scene.background = null;
            activeMesh.visible = true;
          }
        }));
      } else {
        colorControllers.push(colorFolder.addColor(activeConfig, 'centerColor').onChange(updateColors));
        colorControllers.push(colorFolder.addColor(activeConfig, 'edgeColor').onChange(updateColors));
        colorControllers.push(colorFolder.addColor(activeConfig, 'backgroundColor').onChange(updateColors));
        
        dimensionControllers.push(dimensionFolder.add(activeConfig, 'width', 0.1, 1).onChange(updateDimensions));
        dimensionControllers.push(dimensionFolder.add(activeConfig, 'height', 0.1, 1).onChange(updateDimensions));
        
        effectControllers.push(effectsFolder.add(activeConfig, 'centerGlow').name('Center Glow').onChange(updateEffects));
        effectControllers.push(effectsFolder.add(activeConfig, 'animationSpeed', 0.0001, 0.005).name('Transition Speed').onChange(updateEffects));
        effectControllers.push(effectsFolder.add(activeConfig, 'dithering', 0, 3).name('Dithering Strength').onChange(updateEffects));
      }
      
      // Open folders
      colorFolder.open();
      effectsFolder.open();
      if (activeConfig.shape === 'rectangle') {
        dimensionFolder.open();
      }
    };
  
    // Functions to update shader uniforms
    const updateColors = () => {
      if (!activeMesh) return;
      
      if (activeConfig.shape === 'circle') {
        activeMesh.material.uniforms.centerColor.value.set(activeConfig.centerColor);
        activeMesh.material.uniforms.midColor.value.set(activeConfig.midColor);
        activeMesh.material.uniforms.outerColor.value.set(activeConfig.outerColor);
        activeMesh.material.uniforms.backgroundColor.value.set(activeConfig.backgroundColor);
      } else {
        activeMesh.material.uniforms.centerColor.value.set(activeConfig.centerColor);
        activeMesh.material.uniforms.edgeColor.value.set(activeConfig.edgeColor);
        activeMesh.material.uniforms.backgroundColor.value.set(activeConfig.backgroundColor);
      }
    };
  
    const updateDimensions = () => {
      if (!activeMesh || activeConfig.shape !== 'rectangle') return;
      activeMesh.material.uniforms.rectDimensions.value.set(activeConfig.width, activeConfig.height);
    };
  
    const updateEffects = () => {
      if (!activeMesh) return;
      
      if (activeConfig.shape === 'circle') {
        if (activeMesh.material.uniforms.useGaussian) {
          activeMesh.material.uniforms.useGaussian.value = activeConfig.useGaussian;
        }
        if (activeMesh.material.uniforms.noiseAmount) {
          activeMesh.material.uniforms.noiseAmount.value = activeConfig.dithering;
        }
      } else {
        if (activeMesh.material.uniforms.centerGlow) {
          activeMesh.material.uniforms.centerGlow.value = activeConfig.centerGlow;
        }
        if (activeMesh.material.uniforms.noiseAmount) {
          activeMesh.material.uniforms.noiseAmount.value = activeConfig.dithering;
        }
      }
    };
  
    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      
      // Update aspect ratio in shader
      if (activeMesh && activeMesh.material.uniforms.aspectRatio) {
        activeMesh.material.uniforms.aspectRatio.value = window.innerWidth / window.innerHeight;
      }
    });
  
    // Initialize GUI
    updateGUI();
  
    return {
      updateGUI,
      updateScene,
      getAnimateFunction: () => animateFunction
    };
  };