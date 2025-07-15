// Gaming UI Controller - Handles the game interface and navigation display
class GamingUIController {
    constructor(playerController) {
        this.player = playerController;
        this.isMobile = playerController.isMobile;
        
        // UI elements
        this.heightDisplay = document.getElementById('height-display');
        this.speedDisplay = document.getElementById('speed-display');
        this.movementMode = document.getElementById('movement-mode');
        
        // Navigation elements
        this.navKeys = {
            w: document.getElementById('nav-w'),
            a: document.getElementById('nav-a'),
            s: document.getElementById('nav-s'),
            d: document.getElementById('nav-d'),
            shift: document.getElementById('nav-shift'),
            space: document.getElementById('nav-space'),
            f: document.getElementById('nav-f')
        };
        
        // Mobile navigation elements
        this.mobileNavKeys = {
            w: document.getElementById('mobile-w'),
            a: document.getElementById('mobile-a'),
            s: document.getElementById('mobile-s'),
            d: document.getElementById('mobile-d'),
            jump: document.getElementById('mobile-jump'),
            run: document.getElementById('mobile-run'),
            fly: document.getElementById('mobile-fly')
        };
        
        this.setupEventListeners();
        this.startUpdateLoop();
    }
      setupEventListeners() {
        // Desktop key listeners
        document.addEventListener('keydown', (event) => {
            this.handleKeyPress(event.key.toLowerCase(), true);
        });
        
        document.addEventListener('keyup', (event) => {
            this.handleKeyPress(event.key.toLowerCase(), false);
        });
        
        // Mobile touch listeners
        if (this.isMobile) {
            this.setupMobileTouchControls();
        }
    }
    
    handleKeyPress(key, isPressed) {
        // Map keys to navigation display
        const keyMap = {
            'w': 'w',
            'a': 'a', 
            's': 's',
            'd': 'd',
            'shift': 'shift',
            ' ': 'space', // Space key
            'f': 'f'
        };
        
        const mappedKey = keyMap[key];
        if (mappedKey && this.navKeys[mappedKey]) {
            if (isPressed) {
                this.navKeys[mappedKey].classList.add('active');
                this.navKeys[mappedKey].classList.add('pressed');
                
                // Remove pressed animation after animation completes
                setTimeout(() => {
                    this.navKeys[mappedKey].classList.remove('pressed');
                }, 200);
            } else {
                this.navKeys[mappedKey].classList.remove('active');
            }
        }
    }
    
    setupMobileTouchControls() {
        // Setup mobile D-pad controls with enhanced feedback
        Object.entries(this.mobileNavKeys).forEach(([key, element]) => {
            if (!element) return;
            
            // Add better touch event handling for mobile
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleMobilePress(key, true);
                // Add haptic feedback if supported
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, { passive: false });
            
            element.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleMobilePress(key, false);
            }, { passive: false });
            
            element.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleMobilePress(key, false);
            }, { passive: false });
            
            // Add mouse events for desktop testing
            element.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleMobilePress(key, true);
            });
            
            element.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.handleMobilePress(key, false);
            });
            
            element.addEventListener('mouseleave', (e) => {
                this.handleMobilePress(key, false);
            });
        });
        
        // Prevent scrolling when touching controls
        const mobileNavigator = document.getElementById('mobile-navigator');
        if (mobileNavigator) {
            mobileNavigator.addEventListener('touchmove', (e) => {
                e.preventDefault();
            }, { passive: false });
        }
    }
    
    handleMobilePress(key, isPressed) {
        this.wasFlying = false;
        const element = this.mobileNavKeys[key];
        if (!element) return;
        
        if (isPressed) {
            element.classList.add('active');
            element.classList.add('pressed');
            
            // Trigger corresponding player action
            switch(key) {
                case 'w':
                    this.player.keys['w'] = true;
                    break;
                case 'a':
                    this.player.keys['a'] = true;
                    break;
                case 's':
                    this.player.keys['s'] = true;
                    break;
                case 'd':
                    this.player.keys['d'] = true;
                    break;
                case 'jump':
                    this.player.keys[' '] = true;
                    break;
                case 'run':
                    this.player.keys['shift'] = true;
                    break;
                case 'fly':
                    this.player.keys['f'] = true;
                    break;
            }
            
            setTimeout(() => {
                element.classList.remove('pressed');
            }, 200);
        } else {
            element.classList.remove('active');
            
            // Release corresponding player action
            switch(key) {
                case 'w':
                    this.player.keys['w'] = false;
                    break;
                case 'a':
                    this.player.keys['a'] = false;
                    break;
                case 's':
                    this.player.keys['s'] = false;
                    break;
                case 'd':
                    this.player.keys['d'] = false;
                    break;
                case 'jump':
                    this.player.keys[' '] = false;
                    break;
                case 'run':
                    this.player.keys['shift'] = false;
                    break;
                case 'fly':
                    this.player.keys['f'] = false;
                    break;
            }
        }
    }
    
    startUpdateLoop() {
        this.updateUI();
        requestAnimationFrame(() => this.startUpdateLoop());
    }
    
   updateUI() {
    if (!this.player || !this.player.camera) return;

    // Update height display
    const height = Math.max(0, this.player.camera.position.y - 5);
    this.heightDisplay.textContent = `${Math.round(height)}m`;

    // Add special styling for high altitude
    if (height > 200) {
        this.heightDisplay.classList.add('high-altitude');
    } else {
        this.heightDisplay.classList.remove('high-altitude');
    }

    // Update movement mode
    let mode = 'WALK';
    let modeClass = 'walking';

    // Update flying button only when flying state changes
    const flyBtn = document.getElementById('fly-button');
    if (flyBtn) {
        flyBtn.className = 'flying-button';
        flyBtn.style.width = '300px';
        flyBtn.style.height = '80px';
        flyBtn.style.border = '2px solid #00d4ff';
        flyBtn.style.overflow = 'hidden';

        // Only update DOM if flying state changed
        if (this.player.isFlying !== this.wasFlying) {
            if (this.player.isFlying) {
                flyBtn.innerHTML = `
                <button class="airplane-button">
                    <div class="sky">
                        <div class="clouds"></div>
                        <div class="airplane">
                            <img src="https://cdn.pixabay.com/photo/2014/04/03/11/53/rocket-312455_640.png" />
                            <div class="flame"></div>
                            <div class="flame flame2"></div>
                        </div>
                        <div class="mountains"></div>
                    </div>
                </button>`;
            } else {
                flyBtn.innerHTML = `<span style="font-family: 'CityofGitsFont', Arial, sans-serif; font-weight: bold; font-size: 1em; letter-spacing: 1px;">FLY (F)</span>`;
            }

            // Store the current flying state
            this.wasFlying = this.player.isFlying;
        }
    }
}

}
