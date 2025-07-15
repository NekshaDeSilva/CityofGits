

class PlayerController {
    constructor(camera, world) {
        this.camera = camera;
        this.world = world;
        
        // Much faster movement settings for better exploration
        this.moveSpeed = this.detectLowMemory() ? 35 : 60;  // Much faster base speed
        this.runSpeed = this.detectLowMemory() ? 70 : 120;  // Much faster run speed
        this.flySpeed = this.detectLowMemory() ? 50 : 90;   // Much faster flying speed
        this.jumpSpeed = 25;
        this.gravity = -1.2;
        this.mouseSensitivity = 0.002;
        
        // Advanced smooth movement system
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.friction = 0.88;
        this.airFriction = 0.96;
        this.maxSpeed = 80; // Much higher max speed for fast exploration
        
        // Player state
        this.isOnGround = true;
        this.isRunning = false;
        this.isJumping = false;
        this.isFlying = false; // New flying state
        
        // Smooth camera rotation
        this.pitch = 0;
        this.yaw = 0;
        this.targetPitch = 0;
        this.targetYaw = 0;
        this.rotationSmoothness = 0.25; // More responsive for mobile
        
        // Input state
        this.keys = {};
        this.mouseMovement = { x: 0, y: 0 };
        this.isPointerLocked = false;
        
        // Mobile touch controls
        this.isMobile = this.detectMobile();
        this.touchControls = {
            isMoving: false,
            isLooking: false,
            moveTouchId: null,
            lookTouchId: null,
            moveVector: { x: 0, y: 0 },
            lookVector: { x: 0, y: 0 },
            lastMoveTouch: { x: 0, y: 0 },
            lastLookTouch: { x: 0, y: 0 }
        };
        
        // Performance optimization
        this.updateCounter = 0;
        this.lastPosition = new THREE.Vector3();
        
        this.init();
        
        // Initialize Gaming UI after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.gamingUI = new GamingUIController(this);
        }, 100);
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }

    detectLowMemory() {
        // Detect 4GB or less systems
        if (navigator.deviceMemory && navigator.deviceMemory <= 4) return true;
        
        // Check for integrated/mobile GPUs
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                if (renderer.includes('Intel') || renderer.includes('Mali') || 
                    renderer.includes('Adreno') || renderer.includes('PowerVR')) {
                    return true;
                }
            }
        }
        
        return this.detectMobile();
    }

    init() {
        this.setupControls();
        this.setupPointerLock();
        
        // Setup mobile controls if on mobile device
        if (this.isMobile) {
            this.setupMobileControls();
            this.createMobileUI();
        } else {
            // Setup desktop UI
            this.createDesktopUI();
        }
        
        // Set initial camera position
        this.camera.position.set(0, 100, 500);
        
        console.log('Player controller initialized for', this.isMobile ? 'mobile' : 'desktop');
    }

    setupControls() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.keys[event.code.toLowerCase()] = true;
            
            // Handle specific keys
            if (event.code === 'Space') {
                event.preventDefault();
                this.jump();
            }
            
            // F key to toggle flying
            if (event.code === 'KeyF') {
                event.preventDefault();
                this.toggleFly();
            }
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code.toLowerCase()] = false;
        });

        // Mouse events
        document.addEventListener('mousemove', (event) => {
            if (this.isPointerLocked) {
                this.mouseMovement.x = event.movementX || 0;
                this.mouseMovement.y = event.movementY || 0;
            }
        });

        // Click to focus and lock pointer
        document.addEventListener('click', (event) => {
            if (!this.isPointerLocked) {
                this.requestPointerLock();
            } else {
                // Check for building clicks when pointer is locked
                this.handleBuildingClick(event);
            }
        });

        // Building interaction key (E key)
        document.addEventListener('keydown', (event) => {
            if (event.code === 'KeyE') {
                event.preventDefault();
                this.checkBuildingInteraction();
            }
        });

        // Navigation system now handled by BuildingPopupSystem
        // T key opens navigation overlay with all buildings

        // Touch events for mobile camera control
        let lastTouchX = 0;
        let lastTouchY = 0;
        let touchStarted = false;
        
        document.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                const touchElement = document.elementFromPoint(touch.clientX, touch.clientY);
                if (touchElement && (touchElement.closest('#mobile-navigator') || touchElement.closest('#gaming-ui-bar'))) {
                    return;
                }
                
                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;
                touchStarted = true;
                
                if (this.isMobile && !this.isPointerLocked) {
                    this.isPointerLocked = true;
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', (event) => {
            if (touchStarted && event.touches.length === 1) {
                const touch = event.touches[0];
                const touchElement = document.elementFromPoint(touch.clientX, touch.clientY);
                if (touchElement && (touchElement.closest('#mobile-navigator') || touchElement.closest('#gaming-ui-bar'))) {
                    return;
                }
                
                if (this.isPointerLocked) {
                    const deltaX = touch.clientX - lastTouchX;
                    const deltaY = touch.clientY - lastTouchY;
                    
                    this.mouseMovement.x = deltaX * 2;
                    this.mouseMovement.y = deltaY * 2;
                    
                    lastTouchX = touch.clientX;
                    lastTouchY = touch.clientY;
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', (event) => {
            if (event.touches.length === 0) {
                touchStarted = false;
            }
        }, { passive: true });
    }

    setupPointerLock() {
        const canvas = document.getElementById('gameCanvas');
        
        // Pointer lock change events
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === canvas;
        });

        document.addEventListener('pointerlockerror', () => {
            console.error('Pointer lock failed');
        });
    }

    requestPointerLock() {
        const canvas = document.getElementById('gameCanvas');
        canvas.requestPointerLock();
    }

    jump() {
        if (this.isOnGround) {
            this.velocity.y = this.jumpSpeed;
            this.isOnGround = false;
            this.isJumping = true;
        }
    }

    update(deltaTime) {
        this.handleMovement(deltaTime);
        this.handleMouseLook();
        this.applyGravity(deltaTime);
        this.checkGroundCollision();
        this.updateRunningState();
        this.updateBuildingProximity(); // Check for nearby buildings
        this.checkSubwayWellCollision(); // Check if player fell into a subway well
    }

    handleMovement(deltaTime) {
        const moveVector = new THREE.Vector3();
        const currentSpeed = this.isFlying ? this.flySpeed : (this.isRunning ? this.runSpeed : this.moveSpeed);

        // Handle keyboard input (desktop)
        if (this.keys['keyw']) moveVector.z -= 1;
        if (this.keys['keys']) moveVector.z += 1;
        if (this.keys['keya']) moveVector.x -= 1;
        if (this.keys['keyd']) moveVector.x += 1;
        
        // Handle vertical movement when flying
        if (this.isFlying) {
            if (this.keys['space']) moveVector.y += 1; // Space to go up
            if (this.keys['shiftleft'] || this.keys['shiftright']) {
                // Prevent going below surface level (y = 20) in fly mode
                const minFlightHeight = 25; // Slightly above ground level
                if (this.camera.position.y > minFlightHeight) {
                    moveVector.y -= 1; // Shift to go down
                }
            }
        }
        
        // Handle mobile touch input
        if (this.isMobile && this.touchControls.isMoving) {
            moveVector.x += this.touchControls.moveVector.x;
            moveVector.z += this.touchControls.moveVector.y; // Y becomes forward/backward
        }

        if (moveVector.length() > 0) {
            moveVector.normalize();
            
            // Apply camera rotation to movement
            const cameraDirection = new THREE.Vector3();
            this.camera.getWorldDirection(cameraDirection);
            
            const right = new THREE.Vector3();
            right.crossVectors(cameraDirection, this.camera.up).normalize();
            
            const forward = new THREE.Vector3();
            forward.copy(cameraDirection);
            if (!this.isFlying) {
                forward.y = 0; // Lock Y movement when not flying
            }
            forward.normalize();
            
            const finalMovement = new THREE.Vector3();
            finalMovement.addScaledVector(forward, -moveVector.z);
            finalMovement.addScaledVector(right, moveVector.x);
            
            // Add vertical movement when flying
            if (this.isFlying) {
                finalMovement.y += moveVector.y;
            }
            
            // Apply acceleration for smoother movement
            this.acceleration.copy(finalMovement);
            this.acceleration.multiplyScalar(currentSpeed * deltaTime * 60);
            
            // Add acceleration to velocity
            this.velocity.add(this.acceleration);
            
            // Clamp velocity to max speed
            if (this.velocity.length() > this.maxSpeed) {
                this.velocity.normalize().multiplyScalar(this.maxSpeed);
            }
        } else {
            // Apply friction when no input for smooth deceleration
            this.velocity.multiplyScalar(this.friction);
        }

        // Apply velocity to camera position
        if (this.velocity.length() > 0.1) {
            const movement = this.velocity.clone().multiplyScalar(deltaTime);
            this.camera.position.add(movement);
        }
        
        // Enforce surface level constraint in fly mode
        if (this.isFlying) {
            const minFlightHeight = 25; // Minimum height above ground
            if (this.camera.position.y < minFlightHeight) {
                this.camera.position.y = minFlightHeight;
                this.velocity.y = Math.max(0, this.velocity.y); // Stop downward velocity
            }
        }
        
        // Air friction when not on ground and not flying
        if (!this.isOnGround && !this.isFlying) {
            this.velocity.x *= this.airFriction;
            this.velocity.z *= this.airFriction;
        }
    }

    handleMouseLook() {
        if (!this.isPointerLocked && !this.isMobile) return;

        // Desktop mouse look
        if (this.isPointerLocked && !this.isMobile) {
            // Smooth mouse look with interpolation for better feel
            this.targetYaw -= this.mouseMovement.x * this.mouseSensitivity;
            this.targetPitch -= this.mouseMovement.y * this.mouseSensitivity;
            this.targetPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetPitch));

            // Reset mouse movement
            this.mouseMovement.x = 0;
            this.mouseMovement.y = 0;
        }

        // Mobile and desktop smooth interpolation
        this.yaw += (this.targetYaw - this.yaw) * this.rotationSmoothness;
        this.pitch += (this.targetPitch - this.pitch) * this.rotationSmoothness;

        // Apply rotations smoothly
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
    }

    applyGravity(deltaTime) {
        // No gravity when flying
        if (!this.isOnGround && !this.isFlying) {
            this.verticalVelocity += this.gravity * deltaTime * 60;
            this.camera.position.y += this.verticalVelocity * deltaTime * 60;
        }
    }

    checkGroundCollision() {
        // No ground collision when flying
        if (this.isFlying) {
            this.isOnGround = false;
            return;
        }
        
        const groundLevel = 20; // Height above ground
        
        if (this.camera.position.y <= groundLevel) {
            this.camera.position.y = groundLevel;
            this.verticalVelocity = 0;
            this.isOnGround = true;
            this.isJumping = false;
        }
        
        // Building collision with smoother handling
        this.checkBuildingCollisions();
    }

    checkBuildingCollisions() {
        if (!this.world.worldData || !this.world.worldData.houses) return;

        Object.values(this.world.worldData.houses).forEach(house => {
            const houseX = house.position.x;
            const houseZ = house.position.z;
            const houseLength = parseInt(house['building-length']) || 200;
            const houseWidth = parseInt(house['building-width']) || 200;
            const houseHeight = parseInt(house['building-height']) || 150;

            // Simple box collision with improved detection
            const playerX = this.camera.position.x;
            const playerZ = this.camera.position.z;
            const playerY = this.camera.position.y;

            const buffer = 50; // Collision buffer

            if (playerX > houseX - houseLength/2 - buffer &&
                playerX < houseX + houseLength/2 + buffer &&
                playerZ > houseZ - houseWidth/2 - buffer &&
                playerZ < houseZ + houseWidth/2 + buffer &&
                playerY < houseHeight + 30) {
                
                // Smooth push away from building
                const centerX = houseX;
                const centerZ = houseZ;
                const dirX = playerX - centerX;
                const dirZ = playerZ - centerZ;
                const distance = Math.sqrt(dirX * dirX + dirZ * dirZ);
                
                if (distance > 0) {
                    const pushDistance = Math.max(houseLength/2, houseWidth/2) + buffer + 10;
                    const pushStrength = 0.1; // Smooth pushing
                    const targetX = centerX + (dirX / distance) * pushDistance;
                    const targetZ = centerZ + (dirZ / distance) * pushDistance;
                    
                    // Smooth interpolation instead of immediate positioning
                    this.camera.position.x += (targetX - this.camera.position.x) * pushStrength;
                    this.camera.position.z += (targetZ - this.camera.position.z) * pushStrength;
                }
            }
        });
    }

    updateRunningState() {
        this.isRunning = this.keys['shiftleft'] || this.keys['shiftright'];
    }

    // Mobile Controls Implementation
    setupMobileControls() {
        // Touch events for mobile
        document.addEventListener('touchstart', (event) => this.handleTouchStart(event), { passive: false });
        document.addEventListener('touchmove', (event) => this.handleTouchMove(event), { passive: false });
        document.addEventListener('touchend', (event) => this.handleTouchEnd(event), { passive: false });
        
        // Prevent default touch behaviors
        document.addEventListener('touchmove', (event) => {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });
    }

    createMobileUI() {
        // Create mobile control container
        const mobileUI = document.createElement('div');
        mobileUI.id = 'mobile-ui';
        mobileUI.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 200px;
            pointer-events: none;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 20px;
        `;

        // Virtual joystick for movement
        const joystickContainer = document.createElement('div');
        joystickContainer.id = 'joystick-container';
        joystickContainer.style.cssText = `
            width: 120px;
            height: 120px;
            background: rgba(255, 255, 255, 0.2);
            border: 3px solid rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            position: relative;
            pointer-events: auto;
            touch-action: none;
        `;

        const joystickKnob = document.createElement('div');
        joystickKnob.id = 'joystick-knob';
        joystickKnob.style.cssText = `
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            transition: all 0.1s ease;
        `;

        joystickContainer.appendChild(joystickKnob);

        // Control buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: auto;
            position:fixed;
            visibility:hidden;
        `;

        // Jump button
        const jumpButton = document.createElement('button');
        jumpButton.id = 'jump-button';
        jumpButton.innerHTML = '↑';
        jumpButton.style.cssText = `
            width: 60px;
            height: 60px;
            background: rgba(0, 150, 255, 0.8);
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 24px;
            font-weight: bold;
            touch-action: manipulation;
        `;

        // Run button
        const runButton = document.createElement('button');
        runButton.id = 'run-button';
        runButton.innerHTML = '⚡';
        runButton.style.cssText = `
            width: 60px;
            height: 60px;
            background: rgba(255, 150, 0, 0.8);
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 24px;
            font-weight: bold;
            touch-action: manipulation;
        `;

        // Fly button
        const flyButton = document.createElement('button');
        flyButton.id = 'fly-button';
        flyButton.innerHTML = '✈️';
        flyButton.style.cssText = `
            width: 60px;
            height: 60px;
            background: rgba(150, 0, 255, 0.8);
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 20px;
            font-weight: bold;
            touch-action: manipulation;
            transition: background 0.3s ease;
        `;

        buttonContainer.appendChild(jumpButton);
        buttonContainer.appendChild(runButton);
        buttonContainer.appendChild(flyButton);

        mobileUI.appendChild(joystickContainer);
        mobileUI.appendChild(buttonContainer);
        document.body.appendChild(mobileUI);

        // Touch look area (top half of screen)
        const lookArea = document.createElement('div');
        lookArea.id = 'look-area';
        lookArea.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60%;
            pointer-events: auto;
            z-index: 999;
            touch-action: none;
        `;
        document.body.appendChild(lookArea);

        // Add button event listeners
        jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.jump();
        });

        runButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isRunning = true;
        });

        runButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isRunning = false;
        });

        flyButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleFly();
        });

        console.log('Mobile UI created successfully');
    }

    toggleFly() {
        this.isFlying = !this.isFlying;
        
        // Update fly button appearance
        const flyButton = document.getElementById('fly-button');
        if (flyButton) {
            if (this.isFlying) {
                if (this.isMobile) {
                    flyButton.style.background = 'linear-gradient(145deg, #e0e0e0 0%, #c0c0c0 100%)';
                    flyButton.innerHTML = '🚀'; // Rocket emoji when flying
                } else {
                    flyButton.style.background = 'linear-gradient(145deg, #e0e0e0 0%, #c0c0c0 100%)';
                    flyButton.style.borderBottom = '2px solid #999';
                }
            } else {
                if (this.isMobile) {
                    flyButton.style.background = 'linear-gradient(145deg, #f0f0f0 0%, #d0d0d0 100%)';
                    flyButton.innerHTML = '✈️'; // Plane emoji when not flying
                } else {
                    flyButton.style.background = 'linear-gradient(145deg, #f0f0f0 0%, #d0d0d0 100%)';
                    flyButton.style.borderBottom = '4px solid #999';
                }
            }
        }
        
        // Reset velocity when toggling fly mode
        this.velocity.y = 0;
        if (this.isFlying) {
            this.verticalVelocity = 0; // Stop falling when starting to fly
        }
        
        console.log('Flying mode:', this.isFlying ? 'ON' : 'OFF');
    }

    createDesktopUI() {
        // Create desktop control panel within the left column
        const leftColumn = document.getElementById('left-ui-column');
        if (!leftColumn) {
            console.error('Left UI column not found');
            return;
        }

        const desktopUI = document.createElement('div');
        desktopUI.id = 'desktop-ui';
        desktopUI.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: auto;
            width: 300px;
        `;

        // Flying toggle button
        const flyButton = document.createElement('button');
        flyButton.id = 'fly-button';
        flyButton.innerHTML = '<i class="bi bi-airplane-fill"></i> Fly Mode (F)';
        flyButton.style.cssText = `
            padding: 12px 16px;
            background: linear-gradient(145deg, #f0f0f0 0%, #d0d0d0 100%);
            border: 3px solid #fff;
            border-bottom: 4px solid #999;
            border-right: 2px solid #999;
            border-radius: 4px;
            color: #000;
            font-family: 'CityofGitsFont', 'Arial', sans-serif;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.1s ease;
            box-shadow: 
                0 2px 4px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.6);
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
        `;

        flyButton.addEventListener('mouseenter', () => {
            flyButton.style.background = 'linear-gradient(145deg, #ffffff 0%, #e0e0e0 100%)';
            flyButton.style.transform = 'translateY(-1px)';
            flyButton.style.boxShadow = `
                0 3px 6px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.8)
            `;
        });

        flyButton.addEventListener('mouseleave', () => {
            flyButton.style.background = 'linear-gradient(145deg, #f0f0f0 0%, #d0d0d0 100%)';
            flyButton.style.transform = 'translateY(0)';
            flyButton.style.boxShadow = `
                0 2px 4px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.6)
            `;
        });

        flyButton.addEventListener('mousedown', () => {
            flyButton.style.background = 'linear-gradient(145deg, #e0e0e0 0%, #c0c0c0 100%)';
            flyButton.style.borderBottom = '2px solid #999';
            flyButton.style.transform = 'translateY(1px)';
            flyButton.style.boxShadow = `
                0 1px 2px rgba(0, 0, 0, 0.3),
                inset 0 1px 2px rgba(0, 0, 0, 0.1)
            `;
        });

        flyButton.addEventListener('mouseup', () => {
            flyButton.style.background = 'linear-gradient(145deg, #f0f0f0 0%, #d0d0d0 100%)';
            flyButton.style.borderBottom = '4px solid #999';
            flyButton.style.transform = 'translateY(0)';
            flyButton.style.boxShadow = `
                0 2px 4px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.6)
            `;
        });

        flyButton.addEventListener('click', () => {
            this.toggleFly();
        });

        desktopUI.appendChild(flyButton);
        leftColumn.appendChild(desktopUI);

        // Initialize Gaming UI after desktop UI is created
        if (!this.gamingUI) {
            this.gamingUI = new GamingUIController(this);
        }

        console.log('Desktop UI created and added to left column');
    }

    handleTouchStart(event) {
        event.preventDefault();
        
        for (let touch of event.changedTouches) {
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            
            // Movement joystick
            if (element && (element.id === 'joystick-container' || element.id === 'joystick-knob')) {
                this.touchControls.moveTouchId = touch.identifier;
                this.touchControls.isMoving = true;
                this.touchControls.lastMoveTouch = { x: touch.clientX, y: touch.clientY };
                this.updateJoystick(touch);
            }
            // Look area (camera control)
            else if (element && element.id === 'look-area') {
                this.touchControls.lookTouchId = touch.identifier;
                this.touchControls.isLooking = true;
                this.touchControls.lastLookTouch = { x: touch.clientX, y: touch.clientY };
            }
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        
        for (let touch of event.changedTouches) {
            // Movement joystick
            if (touch.identifier === this.touchControls.moveTouchId) {
                this.updateJoystick(touch);
                this.updateMoveVector(touch);
            }
            // Look control
            else if (touch.identifier === this.touchControls.lookTouchId) {
                this.updateLookVector(touch);
            }
        }
    }

    handleTouchEnd(event) {
        event.preventDefault();
        
        for (let touch of event.changedTouches) {
            // Movement joystick
            if (touch.identifier === this.touchControls.moveTouchId) {
                this.touchControls.isMoving = false;
                this.touchControls.moveTouchId = null;
                this.touchControls.moveVector = { x: 0, y: 0 };
                this.resetJoystick();
            }
            // Look control
            else if (touch.identifier === this.touchControls.lookTouchId) {
                this.touchControls.isLooking = false;
                this.touchControls.lookTouchId = null;
                this.touchControls.lookVector = { x: 0, y: 0 };
            }
        }
    }

    updateJoystick(touch) {
        const joystickContainer = document.getElementById('joystick-container');
        const joystickKnob = document.getElementById('joystick-knob');
        
        if (!joystickContainer || !joystickKnob) return;
        
        const rect = joystickContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = rect.width / 2 - 20;
        
        if (distance <= maxDistance) {
            joystickKnob.style.left = `${50 + (deltaX / rect.width) * 100}%`;
            joystickKnob.style.top = `${50 + (deltaY / rect.height) * 100}%`;
        } else {
            const angle = Math.atan2(deltaY, deltaX);
            const x = Math.cos(angle) * maxDistance;
            const y = Math.sin(angle) * maxDistance;
            joystickKnob.style.left = `${50 + (x / rect.width) * 100}%`;
            joystickKnob.style.top = `${50 + (y / rect.height) * 100}%`;
        }
    }

    updateMoveVector(touch) {
        const joystickContainer = document.getElementById('joystick-container');
        if (!joystickContainer) return;
        
        const rect = joystickContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        const maxDistance = rect.width / 2;
        
        this.touchControls.moveVector.x = Math.max(-1, Math.min(1, deltaX / maxDistance));
        this.touchControls.moveVector.y = Math.max(-1, Math.min(1, deltaY / maxDistance));
    }

    updateLookVector(touch) {
        const deltaX = touch.clientX - this.touchControls.lastLookTouch.x;
        const deltaY = touch.clientY - this.touchControls.lastLookTouch.y;
        
        // Apply sensitivity for mobile
        const sensitivity = 0.005;
        this.targetYaw -= deltaX * sensitivity;
        this.targetPitch -= deltaY * sensitivity;
        this.targetPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetPitch));
        
        this.touchControls.lastLookTouch = { x: touch.clientX, y: touch.clientY };
    }

    resetJoystick() {
        const joystickKnob = document.getElementById('joystick-knob');
        if (joystickKnob) {
            joystickKnob.style.left = '50%';
            joystickKnob.style.top = '50%';
        }
    }

    // === BUILDING INTERACTION METHODS ===
    
    handleBuildingClick(event) {
        if (!window.buildingPopupSystem) return;
        
        // Create raycaster for click detection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, this.camera);
        
        // Calculate objects intersecting the picking ray
        if (this.world && this.world.buildings) {
            const intersects = raycaster.intersectObjects(this.world.buildings, true);
            
            if (intersects.length > 0) {
                const clickedBuilding = intersects[0].object;
                
                // Check if we're within interaction range
                const playerPos = this.camera.position;
                const buildingPos = clickedBuilding.position;
                const distance = playerPos.distanceTo(buildingPos);
                
                if (distance <= 50) { // 50 meter interaction range
                    // Try to find building ID from object name or user data
                    const buildingId = clickedBuilding.userData?.buildingId || 
                                     clickedBuilding.name || 
                                     this.findNearestBuildingId(playerPos);
                    
                    if (buildingId) {
                        window.buildingPopupSystem.handleBuildingClick(buildingId);
                    }
                }
            }
        }
    }
    
    checkBuildingInteraction() {
        if (!window.buildingPopupSystem) return;
        
        const playerPos = this.camera.position;
        const nearbyBuilding = window.buildingPopupSystem.checkBuildingProximity({
            x: playerPos.x,
            z: playerPos.z,
            y: playerPos.y  // Include Y coordinate for underground detection
        });
        
        if (nearbyBuilding) {
            // Handle subway entrance teleportation
            if (nearbyBuilding.data.isSubway) {
                this.teleportToUnderground(nearbyBuilding.data.entranceLocation);
            } else {
                // Show building info popup
                window.buildingPopupSystem.showBuildingInfo(nearbyBuilding.id, nearbyBuilding.data);
            }
        }
    }
    
    findNearestBuildingId(playerPos) {
        if (!window.buildingPopupSystem) return null;
        
        const nearbyBuilding = window.buildingPopupSystem.checkBuildingProximity({
            x: playerPos.x,
            z: playerPos.z,
            y: playerPos.y  // Include Y coordinate for underground detection
        });
        
        return nearbyBuilding ? nearbyBuilding.id : null;
    }
    
    // Update method to check building proximity continuously
    updateBuildingProximity() {
        if (!window.buildingPopupSystem) return;
        
        const playerPos = this.camera.position;
        window.buildingPopupSystem.update({
            x: playerPos.x,
            z: playerPos.z,
            y: playerPos.y  // Include Y coordinate for underground detection
        });
    }
    
    checkSubwayWellCollision() {
        // Only check when on surface (not already underground)
        if (this.world && this.world.isUnderground) return;
        
        // Check if we have subway wells to check against
        if (!this.world || !this.world.subwayWells) return;
        
        const playerPos = this.camera.position;
        
        // Check each subway well
        for (const well of this.world.subwayWells) {
            const distance = Math.sqrt(
                Math.pow(playerPos.x - well.x, 2) + 
                Math.pow(playerPos.z - well.z, 2)
            );
            
            // If player is within well radius and below surface level
            if (distance <= well.radius && playerPos.y < 15) {
                console.log(`🕳️ Player fell into subway well: ${well.name}`);
                
                // Automatically teleport to underground
                this.teleportToUnderground({
                    name: well.name,
                    x: well.x,
                    z: well.z
                });
                
                // Break out of loop since we found a collision
                break;
            }
        }
    }
    
    teleportToUnderground(entranceLocation) {
        console.log(`🚇 Entering subway at ${entranceLocation.name}...`);
        
        // Create transition effect
        const transitionOverlay = document.createElement('div');
        transitionOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(to bottom, #000 0%, #1a1a1a 50%, #2c2c2c 100%);
            z-index: 99999;
            opacity: 0;
            transition: opacity 0.5s ease;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'CityofGitsFont', Arial, sans-serif;
            font-size: 24px;
            font-weight: 700;
        `;
        transitionOverlay.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 36px; margin-bottom: 20px;">🚇</div>
                <div>Entering Underground City...</div>
                <div style="font-size: 18px; margin-top: 10px; opacity: 0.8;">${entranceLocation.name}</div>
            </div>
        `;
        document.body.appendChild(transitionOverlay);
        
        // Start transition animation
        requestAnimationFrame(() => {
            transitionOverlay.style.opacity = '1';
        });
        
        // Teleport to underground after transition
        setTimeout(() => {
            // MEMORY OPTIMIZATION: Hide/remove surface city when underground
            if (window.world) {
                console.log('🗑️ Hiding surface city to free memory...');
                window.world.hideSurfaceCity();
                window.world.isUnderground = true;
            }
            
            // Position player in underground city (below the entrance)
            this.camera.position.set(
                entranceLocation.x + (Math.random() - 0.5) * 100, // Small random offset
                -80, // Underground level
                entranceLocation.z + (Math.random() - 0.5) * 100
            );
            
            // Ensure player is not flying when entering underground
            this.isFlying = false;
            this.isOnGround = true;
            this.verticalVelocity = 0;
            
            console.log(`✅ Teleported to underground near ${entranceLocation.name}`);
            
            // Fade out transition
            setTimeout(() => {
                transitionOverlay.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(transitionOverlay);
                }, 500);
            }, 1000);
        }, 500);
    }
}

// Game Application Class
class CityOfGitsApp {
    constructor() {
        this.world = null;
        this.playerController = null;
        this.clock = new THREE.Clock();
        this.isRunning = false;
        
        this.init();
    }

    async init() {
        // Show loading screen
        this.showLoadingScreen();
        
        try {
            console.log('🚀 Starting CityOfGits initialization...');
            
            // Initialize world and wait for it to complete
            console.log('📍 Creating World instance...');
            this.world = new World();
            
            console.log('⏳ Waiting for world initialization...');
            await this.world.initPromise; // Wait for async initialization
            console.log('✅ World initialized successfully!');
            
            // Initialize player controller
            console.log('🎮 Creating PlayerController...');
            this.playerController = new PlayerController(this.world.camera, this.world);
            console.log('✅ PlayerController created successfully!');
            
            // Initialize gaming UI controller with dynamic logo system
            console.log('🎨 Creating GamingUIController with dynamic logo...');
            this.gamingUI = new GamingUIController(this.playerController);
            console.log('✅ GamingUIController created successfully!');
            
            // Hide loading screen
            this.hideLoadingScreen();

            // Start game loop
            this.isRunning = true;
            this.gameLoop();
            
            console.log('🎉 CityOfGits application started successfully!');
            
        } catch (error) {
            console.error('💥 Failed to initialize application:', error);
            console.error('Stack trace:', error.stack);
            this.showError(`Failed to load the world: ${error.message}`);
        }
    }

    showLoadingScreen() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-screen';
        loadingDiv.className = 'loading-screen';
        loadingDiv.innerHTML = `
            <img class="dynamic-logo-loading" src="./assets/static/cityofgits-white-lg-4000x1010.png" loading="lazy" alt="CityofGits Logo" /> 

        <div class="loaderbar_">
            <div class="loaderbarProg">
                <div class="loaderbarInside"></div>
            </div>
        </div>
    
            `;
        document.body.appendChild(loadingDiv);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.remove();
        }
    }

    showError(message) {
        this.hideLoadingScreen();
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #ff4444; color: white; padding: 20px; border-radius: 10px;
            font-family: Arial, sans-serif; text-align: center; z-index: 10000;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }

    gameLoop() {
        if (!this.isRunning) return;

        const deltaTime = this.clock.getDelta();

        // Update player controller
        if (this.playerController) {
            this.playerController.update(deltaTime);
            
            // Update building proximity checking for popups
            this.playerController.updateBuildingProximity();
        }

        // Update world
        if (this.world) {
            this.world.update();
            this.world.render();
        }

        // Continue game loop
        requestAnimationFrame(() => this.gameLoop());
    }

    stop() {
        this.isRunning = false;
    }
}

// Global app instance
let cityOfGitsApp;





