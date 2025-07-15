
document.addEventListener('DOMContentLoaded', () => {
    console.log('CityofGits is starting...');
    

    if (!checkWebGLSupport()) {
        showWebGLError();
        return;
    }
    

    if (!checkBrowserSupport()) {
        showBrowserError();
        return;
    }
    

    initializeApp();
});

function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return gl !== null;
    } catch (e) {
        return false;
    }
}

function checkBrowserSupport() {

    if (!document.body.requestPointerLock && 
        !document.body.mozRequestPointerLock && 
        !document.body.webkitRequestPointerLock) {
        console.warn('Pointer Lock API not supported');
        return false;
    }
    

    if (!window.requestAnimationFrame) {
        console.warn('RequestAnimationFrame not supported');
        return false;
    }
    
    return true;
}

function showWebGLError() {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex; justify-content: center; align-items: center;
        font-family: Arial, sans-serif; color: white; text-align: center;
        z-index: 10000;
    `;
    errorDiv.innerHTML = `
        <div>
            <h1>WebGL Not Supported</h1>
            <p>Your browser doesn't support WebGL, which is required for CityofGits.</p>
            <p>Please try using a modern browser like Chrome, Firefox, or Edge.</p>
            <br>
            <p><small>If you're using a modern browser, try enabling hardware acceleration in your browser settings.</small></p>
        </div>
    `;
    document.body.appendChild(errorDiv);
}

function showBrowserError() {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex; justify-content: center; align-items: center;
        font-family: Arial, sans-serif; color: white; text-align: center;
        z-index: 10000;
    `;
    errorDiv.innerHTML = `
        <div>
            <h1>Browser Not Supported</h1>
            <p>Your browser doesn't support some features required for CityofGits.</p>
            <p>Please update to a newer version of your browser or try a different one.</p>
        </div>
    `;
    document.body.appendChild(errorDiv);
}

function initializeApp() {
    try {
        // Create global app instance
        window.cityOfGitsApp = new CityOfGitsApp();
        
        // Add some helpful global functions for debugging
        window.getPlayerPosition = () => {
            if (window.cityOfGitsApp && window.cityOfGitsApp.playerController) {
                const pos = window.cityOfGitsApp.playerController.camera.position;
                return { x: pos.x, y: pos.y, z: pos.z };
            }
            return null;
        };
        
        window.teleportPlayer = (x, y, z) => {
            if (window.cityOfGitsApp && window.cityOfGitsApp.playerController) {
                window.cityOfGitsApp.playerController.camera.position.set(x, y, z);
                console.log(`Teleported to: ${x}, ${y}, ${z}`);
            }
        };
        
        window.getWorldData = () => {
            if (window.cityOfGitsApp && window.cityOfGitsApp.world) {
                return window.cityOfGitsApp.world.worldData;
            }
            return null;
        };
        
        window.getLogoStatus = () => {
            if (window.cityOfGitsApp && window.cityOfGitsApp.gamingUI) {
                return window.cityOfGitsApp.gamingUI.getLogoSystemStatus();
            }
            return null;
        };
        
        window.changeLogoTo = (index) => {
            if (window.cityOfGitsApp && window.cityOfGitsApp.gamingUI) {
                window.cityOfGitsApp.gamingUI.changeLogoTo(index);
                console.log(`LOGO to index: ${index}`);
            }
        };
        
        window.testLogos = () => {
            if (window.cityOfGitsApp && window.cityOfGitsApp.gamingUI) {
                window.cityOfGitsApp.gamingUI.testLogoPaths();
            }
        };
        
        window.addHouse = (houseId, houseData) => {
            if (window.cityOfGitsApp && window.cityOfGitsApp.world) {
                const world = window.cityOfGitsApp.world;
                if (!world.worldData.houses) {
                    world.worldData.houses = {};
                }
                world.worldData.houses[houseId] = houseData;
                
                // Create and add the new house
                const house = world.createHouse(houseData, houseId);
                world.houses.push(house);
                world.scene.add(house);
                world.createNameplate(houseData, house);
                
                console.log(`HOUSES ADDED(all): ${houseId}`);
                return true;
            }
            return false;
        };
        
    } catch (error) {
        console.error('Failed to initialize CityofGits:', error);
        showGenericError(error.message);
    }
}

function showGenericError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: #000000ff; color: white; padding: 20px; border-radius: 1rem;
        text-align: center; z-index: 10000;
        max-width: 400px;
    `;
    errorDiv.innerHTML = `
    <img src="https://media.tenor.com/CvUVf5IfFS8AAAAM/dog-fail.gif" class="latend-later-image-preloading" style="width: 7rem; height: auto; border-radius: 10px;">
        <h2 class="dfjhgdfjfhdg">Aw snap :( </h2>
        <p>${message}</p>
        <p>We're open-source. Please create an issue for this error, On <a href="https://www.github.com/openrockets/cityofgits">GitHub</a>.</p>
        <button onclick="location.reload()" style="
            background: white; color: #ff4444; border: none; padding: 10px 20px;
            border-radius: 5px; cursor: pointer; margin-top: 10px; font-weight: bold;
        ">Reload Page</button>
    `;
    document.body.appendChild(errorDiv);
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.cityOfGitsApp) {
        if (document.hidden) {
            // Pause the game when tab is not visible
            window.cityOfGitsApp.stop();
        } else {
            // Resume the game when tab becomes visible
            if (!window.cityOfGitsApp.isRunning) {
                window.cityOfGitsApp.isRunning = true;
                window.cityOfGitsApp.gameLoop();
            }
        }
    }
});

// Handle window before unload
window.addEventListener('beforeunload', () => {
    if (window.cityOfGitsApp) {
        window.cityOfGitsApp.stop();
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeApp,
        checkWebGLSupport,
        checkBrowserSupport
    };
}

console.log('CityofGits index.js loaded successfully!');