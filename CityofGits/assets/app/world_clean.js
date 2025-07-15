class World {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.houses = [];
        this.nameplates = [];
        this.worldData = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.terrainChunks = new Map();
        this.loadedChunks = new Set();
        this.cityChunks = new Map();
        this.chunkSize = 2000;
        this.renderDistance = 3;
        this.maxLoadedChunks = 49;
        this.lastPlayerChunk = { x: null, z: null };
        this.megaCityEnabled = true;
        this.cityBounds = {
            min: { x: -60000, z: -60000 },
            max: { x: 60000, z: 60000 }
        };
        this.loadedCityChunks = new Set();
        this.chunkLoadQueue = [];
        this.maxConcurrentLoads = 2;
        this.isLowMemory = this.detectLowMemoryDevice();
        this.ultraLowEnd = false;
        this.performanceMode = this.ultraLowEnd ? 'ultra-lite' : (this.isLowMemory ? 'lite' : 'normal');
        if (this.ultraLowEnd) {
            this.chunkSize = 1500;
            this.renderDistance = 2;
            this.maxLoadedChunks = 25;
            this.maxConcurrentLoads = 1;
        }
        this.sharedGeometries = new Map();
        this.sharedMaterials = new Map();
        this.initSharedResources();
        this.pools = {
            buildings: [],
            windows: [],
            decorations: []
        };
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();
        this.visibleObjects = new Set();
        this.aircraft = [];
        this.maxAircraft = this.isLowMemory ? 0 : 1; // No aircraft on 4GB systems
        this.frameCount = 0;
        this.lastMemoryCleanup = 0;
        this.memoryCleanupInterval = 180; // Clean every 3 seconds
        this.initPromise = this.init();
    }
    detectLowMemoryDevice() {
        if (navigator.deviceMemory && navigator.deviceMemory <= 2) {
            this.ultraLowEnd = true;
            return true;
        }
        if (navigator.deviceMemory && navigator.deviceMemory <= 4) return true;
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
        const isOldDevice = /Android [1-6]/.test(navigator.userAgent) || 
                           /iPhone OS [1-9]_/.test(navigator.userAgent);
        if (isOldDevice) {
            this.ultraLowEnd = true;
            return true;
        }
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    initSharedResources() {
        this.sharedGeometries.set('house', new THREE.BoxGeometry(1, 1, 1));
        this.sharedGeometries.set('window', new THREE.PlaneGeometry(1, 1));
        this.sharedGeometries.set('door', new THREE.PlaneGeometry(1, 1));
        this.sharedGeometries.set('ground', new THREE.PlaneGeometry(this.chunkSize, this.chunkSize));
        this.sharedGeometries.set('pool', new THREE.CylinderGeometry(50, 50, 5, 8));
        this.sharedGeometries.set('billboard', new THREE.PlaneGeometry(100, 60));
        this.sharedGeometries.set('tree', new THREE.ConeGeometry(15, 40, 8));
        this.sharedGeometries.set('car', new THREE.BoxGeometry(40, 15, 20));
        const corporateGlass = [0x87CEEB, 0xB0E0E6, 0xADD8E6, 0x87CEFA, 0x6495ED, 0x4169E1, 0x0000CD, 0x191970, 0x00CED1, 0x20B2AA];
        const corporateCement = [0xF5F5DC, 0xDDD8C4, 0xC8C3A6, 0xBEB9A0, 0xB8B08A, 0xD2B48C, 0xBC8F8F, 0xF4A460, 0xDAA520, 0xB8860B];
        const corporateBlocks = [0xD3D3D3, 0xC0C0C0, 0xA9A9A9, 0x808080, 0x696969, 0x2F4F4F, 0x708090, 0x778899, 0x4682B4, 0x5F9EA0];
        const corporateLegacy = [0x8B4513, 0xA0522D, 0xCD853F, 0xDEB887, 0xF4A460, 0xD2691E, 0xB22222, 0xA52A2A, 0x800000, 0x654321];
        const corporateCreative = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFFC93C, 0xFF6347, 0x32CD32, 0x7B68EE, 0xFF1493, 0x00FF7F];
        const techModern = [0xF5F5F5, 0xFFFFFF, 0xE0E0E0, 0xC0C0C0, 0x1E90FF, 0x0066CC, 0x4285F4, 0x34A853, 0xFF6D01, 0x7C3AED];
        const techStartup = [0xFF3366, 0x00D4AA, 0x5865F2, 0xFF6B35, 0x7289DA, 0x747F8D, 0x99AAB5, 0x2C2F33, 0x23272A, 0x40444B];
        const creativeModern = [0xFFFFFF, 0xF8F8FF, 0xF0F8FF, 0xF5F5F5, 0xFAFAFA, 0xE6E6FA, 0xFFF8DC, 0xFFFAF0, 0xF0FFF0, 0xF5FFFA];
        const creativeLegacy = [0xB22222, 0xDC143C, 0xFF4500, 0xFF6347, 0xCD5C5C, 0x8B0000, 0x800000, 0xA0522D, 0xD2691E, 0xCD853F];
        const creativeEclectic = [0x9370DB, 0x8A2BE2, 0x7B68EE, 0x6A5ACD, 0x483D8B, 0x9932CC, 0xBA55D3, 0xDA70D6, 0xEE82EE, 0xDDA0DD];
        const creativeArtistic = [0xFF69B4, 0xFF1493, 0xDC143C, 0xB22222, 0xFF6347, 0xFF4500, 0xFFA500, 0xFFD700, 0xADFF2F, 0x7FFF00];
        const creativeBohemian = [0x8B4513, 0xA0522D, 0xCD853F, 0xD2691E, 0xDAA520, 0xB8860B, 0x9ACD32, 0x32CD32, 0x228B22, 0x006400];
        const residentialLuxury = [0xF5F5DC, 0xFFF8DC, 0xFFEBCD, 0xFFE4E1, 0xFDF5E6, 0xFAF0E6, 0xFFF5EE, 0xFFF0F5, 0xF8F8FF, 0xF0F8FF];
        const residentialModern = [0xD3D3D3, 0xC0C0C0, 0xA9A9A9, 0x808080, 0x696969, 0x778899, 0x708090, 0x2F4F4F, 0x4682B4, 0x5F9EA0];
        const residentialVibrant = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFFC93C, 0xFF9FF3, 0x54A0FF, 0x5F27CD, 0x00D2D3, 0xFF9500];
        const entertainmentNeon = [0xFF0080, 0x00FF80, 0x8000FF, 0xFF8000, 0x0080FF, 0xFF4080, 0x40FF80, 0x8040FF, 0xFF8040, 0x4080FF];
        const shoppingLuxury = [0xFFD700, 0xFFA500, 0xFF8C00, 0xDAA520, 0xB8860B, 0xF0E68C, 0xEEE8AA, 0xBDB76B, 0x9ACD32, 0x556B2F];
        const specialBuildings = {
            hospital: [0xFFFFFF, 0xF0FFFF, 0xF5FFFA, 0xF0F8FF, 0xE0FFFF, 0xAFEEEE, 0x87CEEB, 0x87CEFA, 0xB0E0E6, 0xADD8E6],
            school: [0xFFF8DC, 0xFFE4B5, 0xDEB887, 0xD2B48C, 0xBC8F8F, 0xF4A460, 0xDAA520, 0xB8860B, 0xCD853F, 0xA0522D],
            restaurant: [0xFF69B4, 0xFF1493, 0xDC143C, 0xB22222, 0xFF6347, 0xFF4500, 0xFFA500, 0xFFD700, 0xF0E68C, 0xEEE8AA],
            hotel: [0xFFD700, 0xFFA500, 0xFF8C00, 0xDAA520, 0xB8860B, 0xF0E68C, 0xEEE8AA, 0xBDB76B, 0x9ACD32, 0x556B2F],
            bank: [0x2F4F4F, 0x708090, 0x778899, 0x4682B4, 0x5F9EA0, 0x6495ED, 0x4169E1, 0x0000CD, 0x191970, 0x000080],
            mall: [0xFFB6C1, 0xFFC0CB, 0xFFE4E1, 0xFFF0F5, 0xF8F8FF, 0xE6E6FA, 0xDDA0DD, 0xEE82EE, 0xDA70D6, 0xBA55D3],
            gym: [0xFF4500, 0xFF6347, 0xDC143C, 0xB22222, 0x8B0000, 0x800000, 0xA52A2A, 0xCD5C5C, 0xF08080, 0xFA8072],
            cafe: [0x8B4513, 0xA0522D, 0xCD853F, 0xD2691E, 0xDAA520, 0xB8860B, 0x9ACD32, 0x32CD32, 0x228B22, 0x006400],
            library: [0x2F4F4F, 0x696969, 0x708090, 0x778899, 0x4682B4, 0x5F9EA0, 0x6495ED, 0x4169E1, 0x0000CD, 0x191970],
            cinema: [0x800080, 0x8B008B, 0x9400D3, 0x9932CC, 0x8A2BE2, 0x7B68EE, 0x6A5ACD, 0x483D8B, 0x4B0082, 0x663399],
            office: [0x1E90FF, 0x0066CC, 0x4285F4, 0x34A853, 0xFF6D01, 0x7C3AED, 0x5865F2, 0xFF3366, 0x00D4AA, 0xFF6B35],
            apartment: [0xFFE4E1, 0xFFF0F5, 0xF8F8FF, 0xF0F8FF, 0xE0FFFF, 0xF0FFFF, 0xF5FFFA, 0xFFFAF0, 0xFFF8DC, 0xFFFACD],
            warehouse: [0x2F4F4F, 0x696969, 0x708090, 0x778899, 0x4682B4, 0x5F9EA0, 0x6495ED, 0x4169E1, 0x0000CD, 0x191970],
            factory: [0x8B4513, 0xA0522D, 0xCD853F, 0xD2691E, 0xDAA520, 0xB8860B, 0x9ACD32, 0x32CD32, 0x228B22, 0x006400]
        };
        this.sharedMaterials.set('ground-base', new THREE.MeshBasicMaterial({ color: 0x228B22 })); // Base forest green
        this.sharedMaterials.set('grass', new THREE.MeshBasicMaterial({ color: 0x228B22 })); // Natural grass
        this.sharedMaterials.set('grass-dark', new THREE.MeshBasicMaterial({ color: 0x006400 })); // Dark green grass
        this.sharedMaterials.set('grass-light', new THREE.MeshBasicMaterial({ color: 0x9ACD32 })); // Light grass
        this.sharedMaterials.set('grass-emerald', new THREE.MeshBasicMaterial({ color: 0x50C878 })); // Emerald grass
        this.sharedMaterials.set('carpet-red', new THREE.MeshBasicMaterial({ color: 0x8B0000 })); // Luxury red carpet
        this.sharedMaterials.set('carpet-blue', new THREE.MeshBasicMaterial({ color: 0x000080 })); // Royal blue carpet
        this.sharedMaterials.set('carpet-purple', new THREE.MeshBasicMaterial({ color: 0x4B0082 })); // Purple carpet
        this.sharedMaterials.set('carpet-gold', new THREE.MeshBasicMaterial({ color: 0xDAA520 })); // Gold carpet
        this.sharedMaterials.set('soil-rich', new THREE.MeshBasicMaterial({ color: 0x3C1810 })); // Rich dark soil
        this.sharedMaterials.set('soil-light', new THREE.MeshBasicMaterial({ color: 0x8B4513 })); // Light brown soil
        this.sharedMaterials.set('soil-clay', new THREE.MeshBasicMaterial({ color: 0xA0522D })); // Clay soil
        this.sharedMaterials.set('glass-clear', new THREE.MeshBasicMaterial({ 
            color: 0xF0F8FF, transparent: true, opacity: 0.3 
        })); // Glass floor
        this.sharedMaterials.set('marble-white', new THREE.MeshBasicMaterial({ color: 0xF8F8FF })); // White marble
        this.sharedMaterials.set('marble-black', new THREE.MeshBasicMaterial({ color: 0x2F2F2F })); // Black marble
        this.sharedMaterials.set('marble-gray', new THREE.MeshBasicMaterial({ color: 0x708090 })); // Gray marble
        this.sharedMaterials.set('wood-deck', new THREE.MeshBasicMaterial({ color: 0xD2691E })); // Wood deck
        this.sharedMaterials.set('wood-light', new THREE.MeshBasicMaterial({ color: 0xDEB887 })); // Light wood
        this.sharedMaterials.set('wood-dark', new THREE.MeshBasicMaterial({ color: 0x8B4513 })); // Dark wood
        this.sharedMaterials.set('concrete-light', new THREE.MeshBasicMaterial({ color: 0xD3D3D3 })); // Light concrete
        this.sharedMaterials.set('concrete-dark', new THREE.MeshBasicMaterial({ color: 0x696969 })); // Dark concrete
        this.sharedMaterials.set('blockstones-gray', new THREE.MeshBasicMaterial({ color: 0x778899 })); // Gray stone blocks
        this.sharedMaterials.set('blockstones-white', new THREE.MeshBasicMaterial({ color: 0xF5F5F5 })); // White stone blocks
        this.sharedMaterials.set('tile-red', new THREE.MeshBasicMaterial({ color: 0xDC143C })); // Red tiles
        this.sharedMaterials.set('tile-blue', new THREE.MeshBasicMaterial({ color: 0x4169E1 })); // Blue tiles
        this.sharedMaterials.set('tile-green', new THREE.MeshBasicMaterial({ color: 0x32CD32 })); // Green tiles
        this.sharedMaterials.set('tile-yellow', new THREE.MeshBasicMaterial({ color: 0xFFD700 })); // Yellow tiles
        this.sharedMaterials.set('tile-orange', new THREE.MeshBasicMaterial({ color: 0xFF8C00 })); // Orange tiles
        this.sharedMaterials.set('tile-purple', new THREE.MeshBasicMaterial({ color: 0x8A2BE2 })); // Purple tiles
        this.sharedMaterials.set('sand', new THREE.MeshBasicMaterial({ color: 0xF4A460 })); // Sandy ground
        this.sharedMaterials.set('gravel', new THREE.MeshBasicMaterial({ color: 0x808080 })); // Gravel
        this.sharedMaterials.set('water-surface', new THREE.MeshBasicMaterial({ 
            color: 0x006994, transparent: true, opacity: 0.7 
        })); // Water surface
        this.sharedMaterials.set('glass-tinted', new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, transparent: true, opacity: 0.4 
        })); // Tinted glass
        this.sharedMaterials.set('blockstones-gray', new THREE.MeshBasicMaterial({ color: 0x708090 })); // Gray stones
        this.sharedMaterials.set('blockstones-white', new THREE.MeshBasicMaterial({ color: 0xF5F5F5 })); // White stones
        this.sharedMaterials.set('blockstones-dark', new THREE.MeshBasicMaterial({ color: 0x2F4F4F })); // Dark stones
        this.sharedMaterials.set('concrete-light', new THREE.MeshBasicMaterial({ color: 0xD3D3D3 })); // Light concrete
        this.sharedMaterials.set('concrete-dark', new THREE.MeshBasicMaterial({ color: 0x696969 })); // Dark concrete
        this.sharedMaterials.set('water-clear', new THREE.MeshBasicMaterial({ 
            color: 0x006994, transparent: true, opacity: 0.7 
        })); // Clear water
        this.sharedMaterials.set('water-deep', new THREE.MeshBasicMaterial({ 
            color: 0x003366, transparent: true, opacity: 0.8 
        })); // Deep water
        this.sharedMaterials.set('marble-white', new THREE.MeshBasicMaterial({ color: 0xFFFACD })); // White marble
        this.sharedMaterials.set('marble-black', new THREE.MeshBasicMaterial({ color: 0x36454F })); // Black marble
        this.sharedMaterials.set('wood-deck', new THREE.MeshBasicMaterial({ color: 0xD2691E })); // Wood decking
        this.sharedMaterials.set('road', new THREE.MeshBasicMaterial({ color: 0x2F2F2F }));
        this.sharedMaterials.set('sidewalk', new THREE.MeshBasicMaterial({ color: 0xC0C0C0 }));
        this.sharedMaterials.set('parking-lot', new THREE.MeshBasicMaterial({ color: 0x404040 }));
        this.sharedMaterials.set('water', new THREE.MeshBasicMaterial({ 
            color: 0x006994, transparent: true, opacity: 0.8 
        }));
        this.sharedMaterials.set('poolTile', new THREE.MeshBasicMaterial({ color: 0x87CEEB }));
        this.sharedMaterials.set('billboard', new THREE.MeshBasicMaterial({ color: 0xFF4444 }));
        this.sharedMaterials.set('tree', new THREE.MeshBasicMaterial({ color: 0x228B22 }));
        this.sharedMaterials.set('treeTrunk', new THREE.MeshBasicMaterial({ color: 0x8B4513 }));
        this.sharedMaterials.set('car', new THREE.MeshBasicMaterial({ color: 0xF44336 }));
        this.sharedMaterials.set('glassBlue', new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, transparent: true, opacity: 0.6 
        }));
        this.sharedMaterials.set('glassGreen', new THREE.MeshBasicMaterial({ 
            color: 0x90EE90, transparent: true, opacity: 0.6 
        }));
        this.sharedMaterials.set('glassGray', new THREE.MeshBasicMaterial({ 
            color: 0xD3D3D3, transparent: true, opacity: 0.7 
        }));
        this.buildingPalettes = {
            'corporate-glass': corporateGlass,
            'corporate-cement': corporateCement,
            'corporate-blocks': corporateBlocks,
            'corporate-legacy': corporateLegacy,
            'corporate-creative': corporateCreative,
            'tech-modern': techModern,
            'tech-startup': techStartup,
            'office-tower': corporateGlass,
            'office-modern': techModern,
            'creative-modern': creativeModern,
            'creative-legacy': creativeLegacy,
            'creative-eclectic': creativeEclectic,
            'creative-artistic': creativeArtistic,
            'creative-bohemian': creativeBohemian,
            'art-gallery': creativeArtistic,
            'design-studio': creativeEclectic,
            'residential-luxury': residentialLuxury,
            'residential-modern': residentialModern,
            'residential-vibrant': residentialVibrant,
            'apartment-luxury': residentialLuxury,
            'apartment-modern': residentialModern,
            'condo-tower': residentialVibrant,
            'entertainment-venue': entertainmentNeon,
            'shopping-center': shoppingLuxury,
            'nightclub': entertainmentNeon,
            'bar-restaurant': creativeArtistic,
            'hospital': specialBuildings.hospital,
            'school': specialBuildings.school,
            'restaurant': specialBuildings.restaurant,
            'hotel': specialBuildings.hotel,
            'bank': specialBuildings.bank,
            'mall': specialBuildings.mall,
            'gym': specialBuildings.gym,
            'cafe': specialBuildings.cafe,
            'library': specialBuildings.library,
            'cinema': specialBuildings.cinema,
            'office': specialBuildings.office,
            'apartment': specialBuildings.apartment,
            'warehouse': specialBuildings.warehouse,
            'factory': specialBuildings.factory
        };
        Object.entries(this.buildingPalettes).forEach(([type, colors]) => {
            colors.forEach((color, i) => {
                this.sharedMaterials.set(`${type}-${i}`, new THREE.MeshBasicMaterial({ color }));
            });
        });
        this.sharedMaterials.set('roofRed', new THREE.MeshBasicMaterial({ color: 0x8B0000 }));
        this.sharedMaterials.set('roofBrown', new THREE.MeshBasicMaterial({ color: 0x8B4513 }));
        this.sharedMaterials.set('roofGray', new THREE.MeshBasicMaterial({ color: 0x696969 }));
        this.sharedMaterials.set('roofGreen', new THREE.MeshBasicMaterial({ color: 0x006400 }));
        this.sharedMaterials.set('roofModern', new THREE.MeshBasicMaterial({ color: 0x2F4F4F })); // Dark slate gray
        this.sharedMaterials.set('roofMetal', new THREE.MeshBasicMaterial({ color: 0xC0C0C0 })); // Silver
        this.sharedMaterials.set('roofCopper', new THREE.MeshBasicMaterial({ color: 0xB87333 })); // Copper
        this.sharedMaterials.set('roofModern', new THREE.MeshBasicMaterial({ color: 0x2F4F4F }));
        console.log('✅ NYC-style building system initialized for', this.performanceMode, 'mode');
    }
    async init() {
        console.log(`🎮 Initializing CityofGits in ${this.performanceMode} mode for ${this.isLowMemory ? '≤4GB' : '>4GB'} system`);
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found! Make sure gameCanvas exists in the HTML.');
        }
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            this.isLowMemory ? 60 : 75, // Better FOV for city viewing
            window.innerWidth / window.innerHeight, 
            0.1, 
            this.isLowMemory ? 3000 : 5000 // Longer view distance to see mega city
        );
        this.camera.position.set(0, 50, 100);
        this.camera.lookAt(0, 0, 0);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: false,
            powerPreference: "low-power",
            alpha: false,
            stencil: false,
            preserveDrawingBuffer: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(this.isLowMemory ? 0.5 : 0.75); // Very low resolution on 4GB
        this.renderer.shadowMap.enabled = false; // No shadows
        this.renderer.physicallyCorrectLights = false;
        this.renderer.outputEncoding = THREE.LinearEncoding;
        this.renderer.sortObjects = false;
        await this.loadWorldData();
        this.createSky();
        this.createMinimalTerrain();
        this.createBasicLighting();
        this.initializeDynamicLoading();
        this.loadInitialArea();
        if (!this.isLowMemory) {
            this.createAircraft();
        }
        this.setupEventListeners();
        console.log('🎮 World with DYNAMIC MEGA CITY initialized successfully!');
        this.showPerformanceModeIndicator();
    }
    showPerformanceModeIndicator() {
        // Indicator removed as requested
        
        if (this.ultraLowEnd) {
            this.showAccessibilityTips();
        }
    }
    showAccessibilityTips() {
        const tips = document.createElement('div');
        tips.style.cssText = `
            position: fixed; top: 60px; left: 10px; max-width: 300px;
            background: rgba(0, 100, 200, 0.9); color: white; padding: 10px;
            font-family: Arial, sans-serif; font-size: 11px; border-radius: 5px;
            z-index: 2000; pointer-events: none; border: 1px solid #64B5F6;
        `;
        tips.innerHTML = `
            🌟 <strong>Ultra-Lite Mode Active!</strong><br>
            ✅ Optimized for 1-2GB devices<br>
            ✅ Reduced chunk size for smooth performance<br>
            ✅ Essential city features preserved<br>
            💡 Tip: Move slowly to enjoy all details!
        `;
        document.body.appendChild(tips);
        setTimeout(() => tips.remove(), 12000);
    }
    async loadWorldData() {
        try {
            const response = await fetch('./world.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.worldData = await response.json();
            if (this.isLowMemory && this.worldData.houses) {
                const houseEntries = Object.entries(this.worldData.houses);
                const limitedHouses = houseEntries.slice(0, 5); // Only 5 houses max
                this.worldData.houses = Object.fromEntries(limitedHouses);
            }
            console.log('✅ World data loaded successfully:', Object.keys(this.worldData.houses || {}).length, 'houses');
        } catch (error) {
            console.error('❌ Failed to load world.json:', error);
            console.log('📁 Creating default world data...');
            this.worldData = { 
                houses: {
                    'house1': { x: 100, y: 0, z: 100, buildingType: 'office' },
                    'house2': { x: 200, y: 0, z: 100, buildingType: 'apartment' },
                    'house3': { x: 300, y: 0, z: 100, buildingType: 'creative' },
                    'house4': { x: 100, y: 0, z: 200, buildingType: 'warehouse' },
                    'house5': { x: 200, y: 0, z: 200, buildingType: 'hospital' }
                }
            };
            console.log('✅ Default world data created successfully');
        }
    }
    createSky() {
        this.renderer.setClearColor(0x87CEEB); // Beautiful sky blue background
        if (!this.ultraLowEnd) {
            this.createSkyDome();
            this.createClouds();
            this.createSun();
            this.createFlyingRockets();
        }
        console.log('✅ Beautiful sky created with clouds, sun and rockets!');
    }
    createSkyDome() {
        const skyGeometry = new THREE.SphereGeometry(8000, 32, 16);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB, // Beautiful clear sky blue
            side: THREE.BackSide,
            fog: false // NO FOG for crystal clear sky
        });
        const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(skyDome);
        this.scene.fog = null;
    }
    createClouds() {
        const cloudCount = this.ultraLowEnd ? 20 : (this.isLowMemory ? 35 : 60);
        for (let i = 0; i < cloudCount; i++) {
            const cloud = this.createSingleCloud();
            cloud.position.set(
                (Math.random() - 0.5) * 12000, // Wider spread
                400 + Math.random() * 800, // Height range 400-1200 (below rockets)
                (Math.random() - 0.5) * 12000  // Wider spread
            );
            const scale = 0.4 + Math.random() * 1.2;
            cloud.scale.set(scale, scale, scale);
            cloud.userData.rotationSpeed = (Math.random() - 0.5) * 0.0008;
            this.scene.add(cloud);
        }
    }
    createSingleCloud() {
        const cloudGroup = new THREE.Group();
        const cloudMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.85 // Slightly more visible
        });
        const puffCount = this.ultraLowEnd ? 2 : (this.isLowMemory ? 4 : 7);
        for (let i = 0; i < puffCount; i++) {
            const puffGeometry = this.ultraLowEnd ? 
                new THREE.SphereGeometry(15 + Math.random() * 20, 6, 4) : // Very low detail
                new THREE.SphereGeometry(18 + Math.random() * 25, 8, 6);  // Normal detail
            const puff = new THREE.Mesh(puffGeometry, cloudMaterial);
            puff.position.set(
                (Math.random() - 0.5) * 70,
                (Math.random() - 0.5) * 15,
                (Math.random() - 0.5) * 50
            );
            cloudGroup.add(puff);
        }
        return cloudGroup;
    }
    createSun() {
        const sunGeometry = new THREE.SphereGeometry(200, 20, 20);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFF00,
            emissive: 0xFFFF00,
            emissiveIntensity: 1.5 // Super bright
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(3000, 1500, 2000); // Closer and more visible position
        if (!this.isLowMemory) {
            const glowGeometry = new THREE.SphereGeometry(350, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFF88,
                transparent: true,
                opacity: 0.8 // More visible glow
            });
            const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
            sun.add(sunGlow);
            const outerGlowGeometry = new THREE.SphereGeometry(500, 12, 12);
            const outerGlowMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFAA,
                transparent: true,
                opacity: 0.4 // Very visible
            });
            const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
            sun.add(outerGlow);
            const raysGeometry = new THREE.SphereGeometry(800, 8, 8);
            const raysMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.1,
                wireframe: true
            });
            const sunRays = new THREE.Mesh(raysGeometry, raysMaterial);
            sun.add(sunRays);
        }
        this.scene.add(sun);
        console.log('✅ SUPER VISIBLE sun created!');
    }
    createFlyingRockets() {
        const rocketCount = this.isLowMemory ? 5 : 12;
        this.rockets = [];
        for (let i = 0; i < rocketCount; i++) {
            const rocket = this.createSingleRocket();
            rocket.position.set(
                (Math.random() - 0.5) * 8000,
                800 + Math.random() * 600, // Much higher - 800-1400 height (buildings are max 300-400)
                (Math.random() - 0.5) * 8000
            );
            rocket.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 1,
                (Math.random() - 0.5) * 3
            );
            rocket.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            this.rockets.push(rocket);
            this.scene.add(rocket);
        }
    }
    createSingleRocket() {
        const rocketGroup = new THREE.Group();
        const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const grayMaterial = new THREE.MeshBasicMaterial({ color: 0x555555 });
        const redMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
        const bodyGeometry = new THREE.CylinderGeometry(2.5, 2.5, 50, 16);
        const body = new THREE.Mesh(bodyGeometry, blackMaterial);
        rocketGroup.add(body);
        const noseGeometry = new THREE.ConeGeometry(2.5, 8, 12);
        const nose = new THREE.Mesh(noseGeometry, blackMaterial);
        nose.position.y = 29;
        rocketGroup.add(nose);
        const commandGeometry = new THREE.CylinderGeometry(2, 2, 8, 12);
        const command = new THREE.Mesh(commandGeometry, grayMaterial);
        command.position.y = 17;
        rocketGroup.add(command);
        for (let i = 0; i < 4; i++) {
            const finGeometry = new THREE.BoxGeometry(1, 12, 6);
            const fin = new THREE.Mesh(finGeometry, blackMaterial);
            fin.position.y = -19;
            fin.rotation.y = (i * Math.PI * 2) / 4;
            fin.position.x = 3.5;
            rocketGroup.add(fin);
        }
        const windowGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        for (let i = 0; i < 3; i++) {
            const window = new THREE.Mesh(windowGeometry, whiteMaterial);
            window.position.set(0, 15 - i * 4, 2.6);
            rocketGroup.add(window);
        }
        for (let i = 0; i < 4; i++) {
            const window = new THREE.Mesh(windowGeometry, whiteMaterial);
            window.position.set(2.6, 8 - i * 5, 0);
            rocketGroup.add(window);
            const window2 = new THREE.Mesh(windowGeometry, whiteMaterial);
            window2.position.set(-2.6, 8 - i * 5, 0);
            rocketGroup.add(window2);
        }
        for (let i = 0; i < 3; i++) {
            const stripeGeometry = new THREE.RingGeometry(2.4, 2.6, 16);
            const stripe = new THREE.Mesh(stripeGeometry, redMaterial);
            stripe.position.y = 5 - i * 10;
            stripe.rotation.x = Math.PI / 2;
            rocketGroup.add(stripe);
        }
        if (!this.isLowMemory) {
            const exhaustGeometry = new THREE.ConeGeometry(3, 15, 8);
            const exhaustMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFF4500,
                transparent: true,
                opacity: 0.9
            });
            const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
            exhaust.position.y = -32;
            exhaust.rotation.x = Math.PI;
            rocketGroup.add(exhaust);
            for (let i = 0; i < 4; i++) {
                const thrusterGeometry = new THREE.ConeGeometry(0.8, 6, 6);
                const thruster = new THREE.Mesh(thrusterGeometry, exhaustMaterial);
                thruster.position.y = -28;
                thruster.rotation.x = Math.PI;
                thruster.rotation.y = (i * Math.PI * 2) / 4;
                thruster.position.x = 1.5;
                rocketGroup.add(thruster);
            }
        }
        return rocketGroup;
    }
    createMinimalTerrain() {
        const groundGeometry = this.sharedGeometries.get('ground');
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Forest green
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        if (!this.isLowMemory) {
            ground.receiveShadow = true;
        }
        this.scene.add(ground);
        for (let layer = 0; layer < 3; layer++) {
            const additionalGround = new THREE.Mesh(
                new THREE.PlaneGeometry(this.chunkSize * 2, this.chunkSize * 2),
                new THREE.MeshLambertMaterial({ color: 0x228B22 })
            );
            additionalGround.rotation.x = -Math.PI / 2;
            additionalGround.position.set(0, 0.01 + layer * 0.01, 0);
            this.scene.add(additionalGround);
        }
        if (!this.ultraLowEnd) {
            const gridSize = 500; // Size of each ground patch
            const halfChunk = this.chunkSize / 2;
            for (let x = -halfChunk; x < halfChunk; x += gridSize) {
                for (let z = -halfChunk; z < halfChunk; z += gridSize) {
                    const groundTypes = [
                        'grass', 'grass-dark', 'grass-light', 'grass-emerald',
                        'concrete-light', 'concrete-dark', 'tile-green', 'tile-blue',
                        'soil-rich', 'soil-light', 'sand', 'gravel'
                    ];
                    const groundType = groundTypes[Math.floor(Math.random() * groundTypes.length)];
                    const patchMaterial = this.sharedMaterials.get(groundType);
                    const patch = new THREE.Mesh(
                        new THREE.PlaneGeometry(gridSize + 50, gridSize + 50), // Overlap to prevent gaps
                        patchMaterial
                    );
                    patch.rotation.x = -Math.PI / 2;
                    patch.position.set(
                        x + (Math.random() - 0.5) * 100,
                        0.1 + Math.random() * 0.3,
                        z + (Math.random() - 0.5) * 100
                    );
                    if (!this.isLowMemory) {
                        patch.receiveShadow = true;
                    }
                    this.scene.add(patch);
                }
            }
        }
        console.log('✅ Complete ground coverage created - no blue areas!');
    }
    createBasicLighting() {
        if (this.ultraLowEnd) {
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
            this.scene.add(ambientLight);
            console.log('✅ Ultra-basic lighting created (ultra-low-end mode)');
            return;
        }
        if (this.isLowMemory) {
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Softer ambient
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(50, 100, 50);
            this.scene.add(ambientLight);
            this.scene.add(directionalLight);
            console.log('✅ Performance-optimized lighting created (low-end mode)');
            return;
        }
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4); // Realistic ambient
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(100, 200, 100);
        directionalLight.castShadow = true; // Enable shadows on high-end
        directionalLight.shadow.mapSize.width = 2048; // Medium quality shadows
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        const fillLight = new THREE.DirectionalLight(0xffaa88, 0.3);
        fillLight.position.set(-50, 50, -50);
        this.scene.add(ambientLight);
        this.scene.add(directionalLight);
        this.scene.add(fillLight);
        if (this.renderer) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
        }
        console.log('✅ Realistic lighting with smart shadows created (high-end mode)');
    }
    generateSimpleHouses() {
        if (!this.worldData.houses) return;
        const houseEntries = Object.entries(this.worldData.houses);
        const maxHouses = this.isLowMemory ? 3 : 5; // Very few houses
        houseEntries.slice(0, maxHouses).forEach(([houseId, houseData]) => {
            const house = this.createSimpleHouse(houseData, houseId);
            this.houses.push(house);
            this.scene.add(house);
        });
        console.log(`✅ Generated ${this.houses.length} simple houses`);
    }
    createSimpleHouse(houseData, houseId) {
        const houseGroup = new THREE.Group();
        houseGroup.userData = { houseId, houseData };
        let buildingType = houseData.buildingType || this.determineBuildingType(houseData);
        if (typeof buildingType !== 'string') {
            console.warn(`Invalid buildingType for ${houseId}:`, buildingType, 'defaulting to office');
            buildingType = 'office';
        }
        const floors = houseData.floors || 1;
        const building = this.createAdvancedBuilding(buildingType, floors);
        building.position.set(
            houseData.position?.x || 0,
            houseData.position?.y || 0,
            houseData.position?.z || 0
        );
        building.userData = { houseId, houseData, buildingType };
        return building;
    }
    determineBuildingType(houseData) {
        const style = houseData.style || 'modern';
        const random = Math.random();
        switch (style) {
            case 'modern':
                if (random < 0.3) return 'creative-modern';
                if (random < 0.5) return 'residential-modern';
                if (random < 0.7) return 'tech-modern';
                return 'office-modern';
            case 'industrial':
                if (random < 0.4) return 'corporate-blocks';
                if (random < 0.6) return 'warehouse';
                if (random < 0.8) return 'factory';
                return 'corporate-cement';
            case 'creative':
                if (random < 0.2) return 'creative-eclectic';
                if (random < 0.4) return 'creative-artistic';
                if (random < 0.6) return 'creative-bohemian';
                if (random < 0.8) return 'art-gallery';
                return 'design-studio';
            case 'fantasy':
                if (random < 0.5) return 'creative-legacy';
                return 'creative-eclectic';
            case 'minimalist':
                if (random < 0.4) return 'corporate-glass';
                if (random < 0.7) return 'tech-modern';
                return 'residential-modern';
            case 'corporate':
                if (random < 0.2) return 'corporate-cement';
                if (random < 0.4) return 'corporate-glass';
                if (random < 0.6) return 'corporate-legacy';
                if (random < 0.8) return 'office-tower';
                return 'tech-startup';
            case 'luxury':
                if (random < 0.3) return 'residential-luxury';
                if (random < 0.6) return 'hotel';
                if (random < 0.8) return 'apartment-luxury';
                return 'corporate-creative';
            case 'entertainment':
                if (random < 0.3) return 'entertainment-venue';
                if (random < 0.6) return 'cinema';
                if (random < 0.8) return 'nightclub';
                return 'bar-restaurant';
            default:
                const allTypes = [
                    'creative-modern', 'residential-modern', 'corporate-glass', 'tech-startup',
                    'creative-artistic', 'apartment-modern', 'office-modern', 'residential-vibrant',
                    'corporate-creative', 'creative-bohemian', 'design-studio', 'cafe'
                ];
                return allTypes[Math.floor(Math.random() * allTypes.length)];
        }
    }
    createAdvancedBuilding(buildingType, floors = 1) {
        const buildingGroup = new THREE.Group();
        const specs = this.getBuildingSpecs(buildingType);
        const width = specs.width + (Math.random() - 0.5) * specs.widthVariation;
        const depth = specs.depth + (Math.random() - 0.5) * specs.depthVariation;
        const totalHeight = floors * specs.floorHeight;
        this.addRealisticBuildingGround(buildingGroup, buildingType, width, depth);
        const materialKey = this.getBuildingMaterial(buildingType);
        const buildingMaterial = this.getEnhancedMaterial(materialKey, buildingType);
        this.createBuildingArchitecture(buildingGroup, specs.style, width, totalHeight, depth, buildingMaterial);
        if (!this.ultraLowEnd) {
            this.addRealisticBuildingDetails(buildingGroup, buildingType, width, totalHeight, depth, floors);
        }
        this.addBuildingWindows(buildingGroup, buildingType, width, totalHeight, depth, floors);
        this.addBuildingRoof(buildingGroup, buildingType, width, totalHeight, depth);
        this.addBuildingSignage(buildingGroup, buildingType, width, totalHeight);
        if (!this.isLowMemory && Math.random() > 0.6) {
            this.addEnhancedRooftopFeatures(buildingGroup, buildingType, width, totalHeight, depth);
        }
        if (!this.isLowMemory) {
            this.enableBuildingShadows(buildingGroup);
        }
        return buildingGroup;
    }
    getEnhancedMaterial(materialKey, buildingType) {
        const baseMaterial = this.sharedMaterials.get(materialKey);
        if (typeof buildingType !== 'string') {
            console.warn('Invalid buildingType in getEnhancedMaterial:', buildingType, 'using default');
            buildingType = 'office';
        }
        if (this.ultraLowEnd) {
            return baseMaterial;
        }
        if (this.isLowMemory) {
            return baseMaterial;
        }
        const materialColor = baseMaterial.color.getHex();
        if (buildingType.includes('glass') || buildingType.includes('tech')) {
            return new THREE.MeshLambertMaterial({
                color: materialColor,
                transparent: Math.random() > 0.7,
                opacity: Math.random() > 0.7 ? 0.8 : 1.0
            });
        } else if (buildingType.includes('metal') || buildingType.includes('corporate')) {
            return new THREE.MeshLambertMaterial({
                color: materialColor,
                emissive: new THREE.Color(materialColor).multiplyScalar(0.05)
            });
        } else {
            return new THREE.MeshLambertMaterial({
                color: materialColor
            });
        }
    }
    enableBuildingShadows(buildingGroup) {
        buildingGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }
    addRealisticBuildingDetails(buildingGroup, buildingType, width, height, depth, floors) {
        if (this.ultraLowEnd) return; // Skip entirely on ultra-low-end
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        if (Math.random() > 0.7) {
            this.addBuildingEntrance(buildingGroup, buildingType, width, depth);
        }
        if (buildingType.includes('residential') && (!this.isLowMemory || Math.random() > 0.8)) {
            this.addBuildingBalconies(buildingGroup, width, height, depth, floors);
        }
        if (!this.isLowMemory && Math.random() > 0.6) {
            this.addArchitecturalDetails(buildingGroup, buildingType, width, height, depth);
        }
    }
    addBuildingEntrance(buildingGroup, buildingType, width, depth) {
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        const doorWidth = Math.min(width * 0.15, 8);
        const doorHeight = 12;
        let doorColor = 0x8B4513; // Default brown
        if (buildingType.includes('corporate')) doorColor = 0x2F2F2F; // Dark gray
        if (buildingType.includes('creative')) doorColor = 0xFF6B35; // Orange
        if (buildingType.includes('tech')) doorColor = 0x4285F4; // Blue
        const door = new THREE.Mesh(
            new THREE.BoxGeometry(doorWidth, doorHeight, 2),
            new THREE.MeshLambertMaterial({ color: doorColor })
        );
        door.position.set(0, doorHeight / 2, depth / 2 + 1);
        if (!this.isLowMemory) {
            door.castShadow = true;
            door.receiveShadow = true;
        }
        buildingGroup.add(door);
    }
    addBuildingBalconies(buildingGroup, width, height, depth, floors) {
        const balconyCount = Math.min(floors - 1, 3); // Max 3 balconies
        for (let i = 0; i < balconyCount; i++) {
            const floor = i + 2; // Start from 2nd floor
            const balconyY = (height / floors) * floor - (height / floors) * 0.3;
            const balcony = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.8, 2, 6),
                new THREE.MeshLambertMaterial({ color: 0xCCCCCC })
            );
            balcony.position.set(0, balconyY, depth / 2 + 3);
            if (!this.isLowMemory) {
                balcony.castShadow = true;
                balcony.receiveShadow = true;
            }
            buildingGroup.add(balcony);
        }
    }
    addArchitecturalDetails(buildingGroup, buildingType, width, height, depth) {
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        if (buildingType.includes('corporate')) {
            const pillarCount = Math.min(Math.floor(width / 20), 3); // Max 3 pillars for performance
            for (let i = 0; i < pillarCount; i++) {
                const pillar = new THREE.Mesh(
                    new THREE.BoxGeometry(3, height, 3),
                    new THREE.MeshLambertMaterial({ color: 0xF5F5F5 })
                );
                pillar.position.set(
                    (i - pillarCount / 2) * (width / pillarCount),
                    height / 2,
                    depth / 2 + 2
                );
                if (!this.isLowMemory) {
                    pillar.castShadow = true;
                    pillar.receiveShadow = true;
                }
                buildingGroup.add(pillar);
            }
        } else if (buildingType.includes('creative')) {
            const accent = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.2, height * 0.6, 4),
                new THREE.MeshLambertMaterial({ color: 0xFF6B35 })
            );
            accent.position.set(width * 0.4, height * 0.3, depth / 2 + 1);
            if (!this.isLowMemory) {
                accent.castShadow = true;
            }
            buildingGroup.add(accent);
        }
    }
    addRealisticBuildingGround(buildingGroup, buildingType, width, depth) {
        if (this.ultraLowEnd) return; // Skip on ultra-low-end
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        let groundType = 'grass';
        if (buildingType.includes('corporate') || buildingType.includes('office')) {
            const corporateGrounds = ['concrete-light', 'blockstones-gray', 'marble-white', 'tile-blue', 'marble-gray'];
            groundType = corporateGrounds[Math.floor(Math.random() * corporateGrounds.length)];
        } else if (buildingType.includes('creative') || buildingType.includes('art')) {
            const creativeGrounds = ['wood-deck', 'carpet-purple', 'grass-emerald', 'tile-orange', 'tile-yellow'];
            groundType = creativeGrounds[Math.floor(Math.random() * creativeGrounds.length)];
        } else if (buildingType.includes('tech')) {
            const techGrounds = ['glass-clear', 'marble-white', 'concrete-light', 'tile-blue', 'blockstones-white'];
            groundType = techGrounds[Math.floor(Math.random() * techGrounds.length)];
        } else if (buildingType.includes('hospital')) {
            const hospitalGrounds = ['marble-white', 'tile-blue', 'concrete-light'];
            groundType = hospitalGrounds[Math.floor(Math.random() * hospitalGrounds.length)];
        } else if (buildingType.includes('restaurant') || buildingType.includes('cafe')) {
            const restaurantGrounds = ['wood-deck', 'wood-light', 'tile-red', 'carpet-red'];
            groundType = restaurantGrounds[Math.floor(Math.random() * restaurantGrounds.length)];
        } else if (buildingType.includes('bank')) {
            const bankGrounds = ['marble-black', 'marble-gray', 'concrete-dark'];
            groundType = bankGrounds[Math.floor(Math.random() * bankGrounds.length)];
        } else if (buildingType.includes('hotel')) {
            const hotelGrounds = ['carpet-gold', 'marble-white', 'wood-deck', 'tile-purple'];
            groundType = hotelGrounds[Math.floor(Math.random() * hotelGrounds.length)];
        } else if (buildingType.includes('school')) {
            const schoolGrounds = ['grass', 'concrete-light', 'tile-green', 'sand'];
            groundType = schoolGrounds[Math.floor(Math.random() * schoolGrounds.length)];
        } else if (buildingType.includes('residential')) {
            const residentialGrounds = ['grass', 'grass-light', 'wood-deck', 'tile-green', 'gravel'];
            groundType = residentialGrounds[Math.floor(Math.random() * residentialGrounds.length)];
        } else {
            const allGrounds = ['grass', 'grass-light', 'tile-red', 'tile-blue', 'tile-green', 'wood-deck', 'concrete-light', 'sand', 'gravel'];
            groundType = allGrounds[Math.floor(Math.random() * allGrounds.length)];
        }
        const groundMaterial = this.sharedMaterials.get(groundType) || this.sharedMaterials.get('grass');
        const groundSize = Math.max(width, depth) * 1.5;
        const groundPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(groundSize, groundSize),
            groundMaterial
        );
        groundPlane.rotation.x = -Math.PI / 2;
        groundPlane.position.y = 2.5; // Elevated above terrain to prevent z-fighting
        buildingGroup.add(groundPlane);
        if (Math.random() > 0.5) {
            const accentGrounds = ['tile-yellow', 'tile-orange', 'carpet-purple', 'wood-light'];
            const accentType = accentGrounds[Math.floor(Math.random() * accentGrounds.length)];
            const accentMaterial = this.sharedMaterials.get(accentType);
            const accentPatch = new THREE.Mesh(
                new THREE.PlaneGeometry(groundSize * 0.3, groundSize * 0.3),
                accentMaterial
            );
            accentPatch.rotation.x = -Math.PI / 2;
            accentPatch.position.set(
                (Math.random() - 0.5) * groundSize * 0.8,
                2.6, // Slightly above main building ground
                (Math.random() - 0.5) * groundSize * 0.8
            );
            buildingGroup.add(accentPatch);
        }
    }
    getBuildingGroundType(buildingType) {
        const groundMapping = {
            'corporate-glass': ['glass-clear', 'marble-white', 'concrete-light'],
            'corporate-cement': ['concrete-light', 'blockstones-gray', 'marble-white'],
            'corporate-blocks': ['blockstones-gray', 'blockstones-white', 'concrete-dark'],
            'corporate-legacy': ['blockstones-dark', 'marble-black', 'wood-deck'],
            'corporate-creative': ['carpet-purple', 'glass-tinted', 'marble-white'],
            'tech-modern': ['glass-clear', 'marble-white', 'concrete-light'],
            'tech-startup': ['wood-deck', 'concrete-light', 'carpet-blue'],
            'office-tower': ['marble-white', 'glass-clear', 'blockstones-white'],
            'office-modern': ['concrete-light', 'marble-white', 'glass-tinted'],
            'creative-modern': ['carpet-purple', 'wood-deck', 'concrete-light'],
            'creative-legacy': ['wood-deck', 'blockstones-dark', 'carpet-red'],
            'creative-eclectic': ['carpet-purple', 'glass-tinted', 'wood-deck'],
            'creative-artistic': ['carpet-red', 'carpet-purple', 'marble-black'],
            'creative-bohemian': ['wood-deck', 'soil-rich', 'grass-emerald'],
            'art-gallery': ['marble-white', 'carpet-red', 'glass-clear'],
            'design-studio': ['wood-deck', 'carpet-blue', 'concrete-light'],
            'residential-luxury': ['marble-white', 'carpet-gold', 'grass-emerald'],
            'residential-modern': ['concrete-light', 'grass', 'wood-deck'],
            'residential-vibrant': ['grass-light', 'carpet-blue', 'wood-deck'],
            'apartment-luxury': ['marble-white', 'carpet-gold', 'glass-clear'],
            'apartment-modern': ['concrete-light', 'grass', 'blockstones-gray'],
            'hospital': ['marble-white', 'glass-clear', 'concrete-light'],
            'school': ['concrete-light', 'grass', 'blockstones-gray'],
            'restaurant': ['wood-deck', 'carpet-red', 'marble-white'],
            'hotel': ['carpet-gold', 'marble-white', 'glass-clear'],
            'bank': ['marble-black', 'blockstones-dark', 'carpet-blue'],
            'mall': ['marble-white', 'glass-clear', 'carpet-blue'],
            'gym': ['concrete-dark', 'blockstones-gray', 'wood-deck'],
            'cafe': ['wood-deck', 'carpet-red', 'grass'],
            'cinema': ['carpet-red', 'marble-black', 'blockstones-dark'],
            'warehouse': ['concrete-dark', 'blockstones-gray', 'soil-light'],
            'factory': ['concrete-dark', 'soil-clay', 'blockstones-gray']
        };
        const availableTypes = groundMapping[buildingType] || ['grass', 'concrete-light', 'blockstones-gray'];
        return availableTypes[Math.floor(Math.random() * availableTypes.length)];
    }
    getAccentGroundType(buildingType) {
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        if (buildingType.includes('creative') || buildingType.includes('art')) {
            return ['carpet-purple', 'wood-deck', 'grass-emerald'][Math.floor(Math.random() * 3)];
        } else if (buildingType.includes('corporate') || buildingType.includes('office')) {
            return ['marble-white', 'glass-clear', 'blockstones-white'][Math.floor(Math.random() * 3)];
        } else if (buildingType.includes('residential')) {
            return ['grass-light', 'wood-deck', 'grass-emerald'][Math.floor(Math.random() * 3)];
        } else {
            return ['grass', 'concrete-light', 'wood-deck'][Math.floor(Math.random() * 3)];
        }
    }
    createBuildingArchitecture(buildingGroup, style, width, height, depth, material) {
        const mainGeometry = new THREE.BoxGeometry(width, height, depth);
        const mainBuilding = new THREE.Mesh(mainGeometry, material);
        mainBuilding.position.y = height / 2;
        buildingGroup.add(mainBuilding);
        if (!this.ultraLowEnd) {
            this.addArchitecturalFeatures(buildingGroup, style, width, height, depth, material);
        }
    }
    addArchitecturalFeatures(buildingGroup, style, width, height, depth, material) {
        if (height > 60 && Math.random() > 0.4) {
            this.addModernBalconies(buildingGroup, width, height, depth);
        }
        if (Math.random() > 0.5) {
            this.addRooftopFeatures(buildingGroup, width, height, depth);
        }
        this.addBuildingEntrance(buildingGroup, width, depth);
        if (Math.random() > 0.6 && !this.isLowMemory) {
            this.addParkingArea(buildingGroup, width, depth);
        }
        if (Math.random() > 0.8 && height > 80) {
            this.addConnectingBridge(buildingGroup, width, height, depth);
        }
    }
    addModernBalconies(buildingGroup, width, height, depth) {
        const balconyMaterial = this.sharedMaterials.get('concrete-light');
        const glassMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, 
            transparent: true, 
            opacity: 0.4 
        });
        const floors = Math.floor(height / 40);
        for (let floor = 2; floor <= floors; floor++) {
            const floorY = (floor * height) / floors;
            if (Math.random() > 0.4) {
                const balconyGeometry = new THREE.BoxGeometry(width * 0.7, 2, 10);
                const balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
                balcony.position.set(0, floorY, depth / 2 + 5);
                buildingGroup.add(balcony);
                const railingGeometry = new THREE.BoxGeometry(width * 0.7, 8, 1);
                const railing = new THREE.Mesh(railingGeometry, glassMaterial);
                railing.position.set(0, floorY + 5, depth / 2 + 9);
                buildingGroup.add(railing);
            }
        }
    }
    addRooftopFeatures(buildingGroup, width, height, depth) {
        const rooftopMaterial = this.sharedMaterials.get('concrete-dark');
        for (let i = 0; i < 3; i++) {
            const acGeometry = new THREE.BoxGeometry(6, 3, 4);
            const acUnit = new THREE.Mesh(acGeometry, rooftopMaterial);
            acUnit.position.set(
                (Math.random() - 0.5) * width * 0.5,
                height + 1.5,
                (Math.random() - 0.5) * depth * 0.5
            );
            buildingGroup.add(acUnit);
        }
        if (Math.random() > 0.6) {
            const gardenGeometry = new THREE.BoxGeometry(width * 0.3, 2, depth * 0.3);
            const gardenMaterial = this.sharedMaterials.get('grass');
            const garden = new THREE.Mesh(gardenGeometry, gardenMaterial);
            garden.position.set(0, height + 1, 0);
            buildingGroup.add(garden);
        }
        if (Math.random() > 0.7) {
            const antennaGeometry = new THREE.CylinderGeometry(0.5, 0.5, 12);
            const antenna = new THREE.Mesh(antennaGeometry, rooftopMaterial);
            antenna.position.set(
                (Math.random() - 0.5) * width * 0.2,
                height + 6,
                (Math.random() - 0.5) * depth * 0.2
            );
            buildingGroup.add(antenna);
        }
    }
    addParkingArea(buildingGroup, width, depth) {
        const parkingMaterial = this.sharedMaterials.get('concrete-dark');
        const lotGeometry = new THREE.BoxGeometry(width * 1.1, 1, depth * 0.7);
        const parkingLot = new THREE.Mesh(lotGeometry, parkingMaterial);
        parkingLot.position.set(width * 0.7, 0.5, 0);
        buildingGroup.add(parkingLot);
        const lineMaterial = this.sharedMaterials.get('tile-yellow');
        for (let i = 0; i < 3; i++) {
            const lineGeometry = new THREE.BoxGeometry(1.5, 0.1, depth * 0.5);
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(width * 0.6 + i * 6, 1.1, 0);
            buildingGroup.add(line);
        }
        if (Math.random() > 0.6) {
            for (let i = 0; i < 2; i++) {
                const carGeometry = new THREE.BoxGeometry(10, 4, 5);
                const carColors = ['tile-red', 'tile-blue', 'concrete-dark'];
                const carMaterial = this.sharedMaterials.get(carColors[Math.floor(Math.random() * carColors.length)]);
                const car = new THREE.Mesh(carGeometry, carMaterial);
                car.position.set(width * 0.6 + i * 12, 3, (Math.random() - 0.5) * depth * 0.3);
                buildingGroup.add(car);
            }
        }
    }
    addConnectingBridge(buildingGroup, width, height, depth) {
        const bridgeMaterial = this.sharedMaterials.get('concrete-light');
        const bridgeGeometry = new THREE.BoxGeometry(6, 5, 30);
        const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridge.position.set(width / 2 + 15, height * 0.6, 0);
        buildingGroup.add(bridge);
        const supportGeometry = new THREE.CylinderGeometry(1, 1, height * 0.6);
        const support = new THREE.Mesh(supportGeometry, bridgeMaterial);
        support.position.set(width / 2 + 15, height * 0.3, 0);
        buildingGroup.add(support);
        const windowMaterial = this.sharedMaterials.get('glass-clear');
        for (let i = -1; i <= 1; i++) {
            const windowGeometry = new THREE.PlaneGeometry(4, 3);
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(width / 2 + 18, height * 0.6, i * 8);
            window.rotation.y = Math.PI / 2;
            buildingGroup.add(window);
        }
    }
    addStepGarden(buildingGroup, stepWidth, stepDepth, stepHeight) {
        const gardenSize = Math.min(stepWidth, stepDepth) * 0.6;
        const garden = new THREE.Mesh(
            new THREE.PlaneGeometry(gardenSize, gardenSize),
            new THREE.MeshBasicMaterial({ color: 0x4CAF50 })
        );
        garden.rotation.x = -Math.PI / 2;
        garden.position.set(0, stepHeight + 1, 0);
        buildingGroup.add(garden);
        const plantColors = [0x2E7D32, 0x388E3C, 0x43A047, 0x66BB6A];
        for (let i = 0; i < 3; i++) {
            const tree = new THREE.Mesh(
                new THREE.CylinderGeometry(2, 2, 8),
                new THREE.MeshBasicMaterial({ 
                    color: plantColors[Math.floor(Math.random() * plantColors.length)]
                })
            );
            tree.position.set(
                (Math.random() - 0.5) * gardenSize * 0.8,
                stepHeight + 5,
                (Math.random() - 0.5) * gardenSize * 0.8
            );
            buildingGroup.add(tree);
        }
        const flowerColors = [0xFF5722, 0xE91E63, 0x9C27B0, 0xFF9800, 0xFFEB3B];
        for (let i = 0; i < 2; i++) {
            const flower = new THREE.Mesh(
                new THREE.BoxGeometry(3, 1, 3),
                new THREE.MeshBasicMaterial({ 
                    color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
                })
            );
            flower.position.set(
                (Math.random() - 0.5) * gardenSize * 0.6,
                stepHeight + 1.5,
                (Math.random() - 0.5) * gardenSize * 0.6
            );
            buildingGroup.add(flower);
        }
    }
    getBuildingSpecs(buildingType) {
        const specs = {
            'corporate-glass': { width: 300, depth: 200, floorHeight: 40, widthVariation: 200, depthVariation: 100, style: 'glass-curtain' },
            'corporate-cement': { width: 250, depth: 180, floorHeight: 35, widthVariation: 150, depthVariation: 80, style: 'concrete-modern' },
            'corporate-blocks': { width: 200, depth: 200, floorHeight: 30, widthVariation: 100, depthVariation: 100, style: 'stepped-blocks' },
            'corporate-legacy': { width: 180, depth: 150, floorHeight: 45, widthVariation: 80, depthVariation: 60, style: 'classic-stone' },
            'corporate-creative': { width: 220, depth: 160, floorHeight: 38, widthVariation: 120, depthVariation: 80, style: 'creative-mixed' },
            'tech-modern': { width: 400, depth: 300, floorHeight: 45, widthVariation: 150, depthVariation: 100, style: 'tech-campus', signage: 'TECH HQ' },
            'tech-startup': { width: 150, depth: 120, floorHeight: 32, widthVariation: 80, depthVariation: 60, style: 'startup-loft', signage: 'STARTUP' },
            'office-tower': { width: 350, depth: 250, floorHeight: 42, widthVariation: 100, depthVariation: 80, style: 'office-tower' },
            'office-modern': { width: 280, depth: 200, floorHeight: 38, widthVariation: 120, depthVariation: 90, style: 'modern-office' },
            'creative-modern': { width: 160, depth: 140, floorHeight: 35, widthVariation: 60, depthVariation: 40, style: 'modern-creative' },
            'creative-legacy': { width: 140, depth: 120, floorHeight: 30, widthVariation: 40, depthVariation: 30, style: 'brick-legacy' },
            'creative-eclectic': { width: 180, depth: 150, floorHeight: 32, widthVariation: 80, depthVariation: 60, style: 'eclectic-mix' },
            'creative-artistic': { width: 200, depth: 180, floorHeight: 40, widthVariation: 100, depthVariation: 80, style: 'artistic-facade' },
            'creative-bohemian': { width: 120, depth: 100, floorHeight: 28, widthVariation: 60, depthVariation: 40, style: 'bohemian-loft' },
            'art-gallery': { width: 250, depth: 200, floorHeight: 50, widthVariation: 80, depthVariation: 60, style: 'gallery-space', signage: '🎨 ART GALLERY' },
            'design-studio': { width: 180, depth: 160, floorHeight: 35, widthVariation: 70, depthVariation: 50, style: 'design-loft', signage: '✏️ DESIGN STUDIO' },
            'residential-luxury': { width: 250, depth: 200, floorHeight: 40, widthVariation: 100, depthVariation: 80, style: 'luxury-facade' },
            'residential-modern': { width: 180, depth: 150, floorHeight: 32, widthVariation: 80, depthVariation: 60, style: 'modern-residential' },
            'residential-vibrant': { width: 160, depth: 140, floorHeight: 30, widthVariation: 70, depthVariation: 50, style: 'colorful-residential' },
            'apartment-luxury': { width: 300, depth: 250, floorHeight: 35, widthVariation: 120, depthVariation: 100, style: 'luxury-apartment' },
            'apartment-modern': { width: 220, depth: 180, floorHeight: 32, widthVariation: 90, depthVariation: 70, style: 'modern-apartment' },
            'condo-tower': { width: 200, depth: 200, floorHeight: 38, widthVariation: 80, depthVariation: 80, style: 'condo-high-rise' },
            'entertainment-venue': { width: 300, depth: 250, floorHeight: 45, widthVariation: 100, depthVariation: 80, style: 'entertainment-complex', signage: '🎪 ENTERTAINMENT' },
            'shopping-center': { width: 400, depth: 300, floorHeight: 35, widthVariation: 150, depthVariation: 100, style: 'shopping-mall', signage: '🛍️ SHOPPING CENTER' },
            'nightclub': { width: 180, depth: 150, floorHeight: 25, widthVariation: 80, depthVariation: 60, style: 'nightclub-neon', signage: '🌃 NIGHTCLUB' },
            'bar-restaurant': { width: 140, depth: 120, floorHeight: 28, widthVariation: 60, depthVariation: 50, style: 'bar-casual', signage: '🍻 BAR & GRILL' },
            'hospital': { width: 400, depth: 300, floorHeight: 40, widthVariation: 100, depthVariation: 50, style: 'medical-modern', signage: '🏥 HOSPITAL' },
            'school': { width: 350, depth: 250, floorHeight: 35, widthVariation: 80, depthVariation: 50, style: 'educational-campus', signage: '🏫 SCHOOL' },
            'restaurant': { width: 120, depth: 100, floorHeight: 25, widthVariation: 40, depthVariation: 30, style: 'restaurant-cozy', signage: '🍽️ RESTAURANT' },
            'hotel': { width: 250, depth: 200, floorHeight: 35, widthVariation: 100, depthVariation: 80, style: 'hotel-elegant', signage: '🏨 HOTEL' },
            'bank': { width: 200, depth: 180, floorHeight: 50, widthVariation: 60, depthVariation: 40, style: 'bank-prestigious', signage: '🏦 BANK' },
            'mall': { width: 500, depth: 400, floorHeight: 45, widthVariation: 200, depthVariation: 150, style: 'shopping-complex', signage: '🏬 MALL' },
            'gym': { width: 200, depth: 180, floorHeight: 30, widthVariation: 80, depthVariation: 60, style: 'fitness-modern', signage: '💪 FITNESS CENTER' },
            'cafe': { width: 100, depth: 80, floorHeight: 25, widthVariation: 40, depthVariation: 30, style: 'cafe-cozy', signage: '☕ CAFE' },
            'library': { width: 300, depth: 250, floorHeight: 40, widthVariation: 100, depthVariation: 80, style: 'library-classic', signage: '📚 LIBRARY' },
            'cinema': { width: 250, depth: 200, floorHeight: 35, widthVariation: 100, depthVariation: 80, style: 'cinema-modern', signage: '🎬 CINEMA' },
            'office': { width: 220, depth: 180, floorHeight: 38, widthVariation: 90, depthVariation: 70, style: 'office-standard' },
            'apartment': { width: 180, depth: 150, floorHeight: 32, widthVariation: 80, depthVariation: 60, style: 'apartment-standard' },
            'warehouse': { width: 300, depth: 400, floorHeight: 60, widthVariation: 150, depthVariation: 200, style: 'industrial-warehouse', signage: '📦 WAREHOUSE' },
            'factory': { width: 400, depth: 500, floorHeight: 50, widthVariation: 200, depthVariation: 250, style: 'industrial-factory', signage: '🏭 FACTORY' }
        };
        return specs[buildingType] || specs['creative-modern'];
    }
    getBuildingMaterial(buildingType) {
        const palette = this.buildingPalettes[buildingType];
        if (!palette || palette.length === 0) {
            const vibrantColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFFA726, 0x9C27B0, 0x66BB6A, 0xEF5350];
            const color = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
            return new THREE.MeshBasicMaterial({ color: color });
        }
        const color = palette[Math.floor(Math.random() * palette.length)];
        return new THREE.MeshBasicMaterial({ color: color });
    }
    addBuildingWindows(buildingGroup, buildingType, width, height, depth, floors) {
        if (this.ultraLowEnd) return; // Skip windows on ultra-low-end
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        let glassMaterial;
        switch (buildingType.split('-')[0]) {
            case 'corporate':
            case 'tech':
            case 'office':
                glassMaterial = this.sharedMaterials.get('glassBlue');
                break;
            case 'creative':
            case 'art':
            case 'design':
                glassMaterial = this.sharedMaterials.get('glassGreen');
                break;
            case 'residential':
            case 'apartment':
            case 'condo':
                glassMaterial = this.sharedMaterials.get('glassGray');
                break;
            default:
                glassMaterial = this.sharedMaterials.get('glassGray');
        }
        if (buildingType.includes('glass') || buildingType.includes('tech')) {
            const frontGlass = new THREE.Mesh(
                new THREE.PlaneGeometry(width * 0.95, height * 0.9),
                glassMaterial
            );
            frontGlass.position.set(0, height * 0.1, depth / 2 + 1);
            buildingGroup.add(frontGlass);
            if (buildingType.includes('tech')) {
                const sideGlass = new THREE.Mesh(
                    new THREE.PlaneGeometry(depth * 0.95, height * 0.9),
                    glassMaterial
                );
                sideGlass.position.set(width / 2 + 1, height * 0.1, 0);
                sideGlass.rotation.y = Math.PI / 2;
                buildingGroup.add(sideGlass);
            }
        } else {
            const maxFloors = this.isLowMemory ? 3 : Math.min(8, floors);
            const floorsToShow = Math.min(floors, maxFloors);
            for (let floor = 0; floor < floorsToShow; floor++) {
                const floorY = (floor + 0.5) * (height / floors);
                const windowCount = Math.min(6, Math.floor(width / 70));
                for (let i = 0; i < windowCount; i++) {
                    const window = new THREE.Mesh(
                        this.sharedGeometries.get('window'),
                        glassMaterial
                    );
                    const windowWidth = 18 + Math.random() * 20;
                    const windowHeight = 22 + Math.random() * 18;
                    window.scale.set(windowWidth, windowHeight, 1);
                    if (!this.isLowMemory && Math.random() > 0.7) {
                        const frame = new THREE.Mesh(
                            this.sharedGeometries.get('window'),
                            new THREE.MeshBasicMaterial({ color: 0x2F4F4F })
                        );
                        frame.scale.set(windowWidth + 2, windowHeight + 2, 0.5);
                        frame.position.set(
                            -width/2 + (i + 1) * width/(windowCount + 1),
                            floorY,
                            depth/2 + 0.5
                        );
                        buildingGroup.add(frame);
                    }
                    window.position.set(
                        -width/2 + (i + 1) * width/(windowCount + 1),
                        floorY,
                        depth/2 + 1
                    );
                    buildingGroup.add(window);
                }
            }
        }
    }
    addBuildingRoof(buildingGroup, buildingType, width, height, depth) {
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        let roofMaterial, roofHeight, roofStyle;
        if (buildingType.includes('legacy') || buildingType.includes('creative-')) {
            roofMaterial = this.sharedMaterials.get('roofRed');
            roofHeight = 40; // Sloped roof
            roofStyle = 'sloped';
        } else if (buildingType.includes('creative') || buildingType.includes('artistic')) {
            roofMaterial = this.sharedMaterials.get('roofGreen');
            roofHeight = 25;
            roofStyle = 'creative';
        } else if (buildingType.includes('tech') || buildingType.includes('modern')) {
            roofMaterial = this.sharedMaterials.get('roofModern');
            roofHeight = 15; // Flat modern roof
            roofStyle = 'flat-modern';
        } else if (buildingType.includes('residential') || buildingType.includes('apartment')) {
            const roofTypes = ['roofRed', 'roofBrown', 'roofGray'];
            roofMaterial = this.sharedMaterials.get(roofTypes[Math.floor(Math.random() * roofTypes.length)]);
            roofHeight = 30 + Math.random() * 20;
            roofStyle = 'residential';
        } else {
            roofMaterial = this.sharedMaterials.get('roofModern');
            roofHeight = 15; // Flat roof
            roofStyle = 'flat';
        }
        const roof = new THREE.Mesh(
            this.sharedGeometries.get('house'),
            roofMaterial
        );
        if (roofStyle === 'creative') {
            roof.scale.set(width + 10, roofHeight, depth + 10);
            roof.rotation.z = (Math.random() - 0.5) * 0.2; // Slight angle for creativity
        } else if (roofStyle === 'sloped') {
            roof.scale.set(width + 8, roofHeight, depth + 8);
        } else {
            roof.scale.set(width + 5, roofHeight, depth + 5);
        }
        roof.position.y = height + roofHeight/2;
        buildingGroup.add(roof);
        this.addRooftopElements(buildingGroup, buildingType, width, height, depth);
    }
    addRooftopElements(buildingGroup, buildingType, width, height, depth) {
        if (this.ultraLowEnd) return; // Skip on ultra-low-end
        if (Math.random() > 0.5) {
            const antenna = new THREE.Mesh(
                new THREE.CylinderGeometry(2, 2, 30 + Math.random() * 40, 8),
                new THREE.MeshBasicMaterial({ color: 0x757575 })
            );
            antenna.position.set(0, height + 35, 0);
            buildingGroup.add(antenna);
        }
        if (Math.random() > 0.6 && !buildingType.includes('residential')) {
            const equipment = new THREE.Mesh(
                this.sharedGeometries.get('house'),
                new THREE.MeshBasicMaterial({ color: 0x9E9E9E })
            );
            equipment.scale.set(width * 0.2, 20, depth * 0.2);
            equipment.position.set(
                (Math.random() - 0.5) * width * 0.5,
                height + 10,
                (Math.random() - 0.5) * depth * 0.5
            );
            buildingGroup.add(equipment);
        }
    }
    addEnhancedRooftopFeatures(buildingGroup, buildingType, width, height, depth) {
        if (!this.ultraLowEnd && Math.random() > 0.3) {
            this.addVibrantRooftopGarden(buildingGroup, width, height, depth, buildingType);
        }
        if (Math.random() > 0.6) {
            this.addColorfulRooftopEquipment(buildingGroup, width, height, depth);
        }
        if (!this.isLowMemory && Math.random() > 0.7) {
            this.addRooftopDecorations(buildingGroup, width, height, depth, buildingType);
        }
    }
    addVibrantRooftopGarden(buildingGroup, width, height, depth, buildingType) {
        const gardenWidth = width * 0.8;
        const gardenDepth = depth * 0.8;
        const gardenColors = [0x4CAF50, 0x66BB6A, 0x81C784, 0x2E7D32];
        const gardenColor = gardenColors[Math.floor(Math.random() * gardenColors.length)];
        const gardenGeometry = new THREE.BoxGeometry(gardenWidth, 4, gardenDepth);
        const gardenMaterial = new THREE.MeshBasicMaterial({ color: gardenColor });
        const garden = new THREE.Mesh(gardenGeometry, gardenMaterial);
        garden.position.set(0, height + 2, 0);
        buildingGroup.add(garden);
        const plantCount = this.ultraLowEnd ? 3 : Math.floor(Math.random() * 12) + 6;
        const plantColors = [0x2E7D32, 0x388E3C, 0x43A047, 0x4CAF50, 0x66BB6A, 0x81C784];
        for (let i = 0; i < plantCount; i++) {
            const plantHeight = Math.random() * 20 + 8;
            const plantGeometry = new THREE.CylinderGeometry(3, 3, plantHeight);
            const plantMaterial = new THREE.MeshBasicMaterial({ 
                color: plantColors[Math.floor(Math.random() * plantColors.length)]
            });
            const plant = new THREE.Mesh(plantGeometry, plantMaterial);
            plant.position.set(
                (Math.random() - 0.5) * gardenWidth * 0.7,
                height + 4 + plantHeight/2,
                (Math.random() - 0.5) * gardenDepth * 0.7
            );
            buildingGroup.add(plant);
        }
        const flowerColors = [0xFF5722, 0xE91E63, 0x9C27B0, 0x3F51B5, 0xFF9800, 0xFFEB3B, 0x00BCD4, 0x4CAF50];
        const flowerCount = this.ultraLowEnd ? 4 : Math.floor(Math.random() * 8) + 6;
        for (let i = 0; i < flowerCount; i++) {
            const flowerGeometry = new THREE.BoxGeometry(8, 3, 8);
            const flowerMaterial = new THREE.MeshBasicMaterial({ 
                color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
            });
            const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
            flower.position.set(
                (Math.random() - 0.5) * gardenWidth * 0.5,
                height + 5.5,
                (Math.random() - 0.5) * gardenDepth * 0.5
            );
            buildingGroup.add(flower);
        }
        if (!this.isLowMemory) {
            const pathGeometry = new THREE.BoxGeometry(gardenWidth * 0.2, 1, gardenDepth);
            const pathMaterial = new THREE.MeshBasicMaterial({ color: 0xD2B48C });
            const path = new THREE.Mesh(pathGeometry, pathMaterial);
            path.position.set(0, height + 4.5, 0);
            buildingGroup.add(path);
        }
    }
    addColorfulRooftopEquipment(buildingGroup, width, height, depth) {
        const equipmentColors = [0x666666, 0x808080, 0x5F9EA0, 0x4682B4, 0x2F4F4F];
        const equipmentColor = equipmentColors[Math.floor(Math.random() * equipmentColors.length)];
        const hvacGeometry = new THREE.BoxGeometry(18, 10, 25);
        const hvacMaterial = new THREE.MeshBasicMaterial({ color: equipmentColor });
        const hvac = new THREE.Mesh(hvacGeometry, hvacMaterial);
        hvac.position.set(
            (Math.random() - 0.5) * width * 0.5,
            height + 5,
            (Math.random() - 0.5) * depth * 0.5
        );
        buildingGroup.add(hvac);
        if (Math.random() > 0.6) {
            const dishGeometry = new THREE.CylinderGeometry(10, 10, 3);
            const dishColors = [0xFFFFFF, 0xF0F0F0, 0xE0E0E0, 0x87CEEB];
            const dishMaterial = new THREE.MeshBasicMaterial({ 
                color: dishColors[Math.floor(Math.random() * dishColors.length)]
            });
            const dish = new THREE.Mesh(dishGeometry, dishMaterial);
            dish.position.set(
                (Math.random() - 0.5) * width * 0.3,
                height + 8,
                (Math.random() - 0.5) * depth * 0.3
            );
            buildingGroup.add(dish);
        }
    }
    addRooftopDecorations(buildingGroup, width, height, depth, buildingType) {
        if (buildingType.includes('creative') || buildingType.includes('art')) {
            const artColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFFA726, 0x9C27B0];
            for (let i = 0; i < 3; i++) {
                const artGeometry = new THREE.BoxGeometry(6, 15, 6);
                const artMaterial = new THREE.MeshBasicMaterial({ 
                    color: artColors[Math.floor(Math.random() * artColors.length)]
                });
                const artPiece = new THREE.Mesh(artGeometry, artMaterial);
                artPiece.position.set(
                    (Math.random() - 0.5) * width * 0.6,
                    height + 7.5,
                    (Math.random() - 0.5) * depth * 0.6
                );
                buildingGroup.add(artPiece);
            }
        } else if (buildingType.includes('tech')) {
            const techColors = [0x00E676, 0x00B0FF, 0xFF6D00, 0x7C3AED];
            const techGeometry = new THREE.BoxGeometry(12, 8, 12);
            const techMaterial = new THREE.MeshBasicMaterial({ 
                color: techColors[Math.floor(Math.random() * techColors.length)]
            });
            const techElement = new THREE.Mesh(techGeometry, techMaterial);
            techElement.position.set(0, height + 4, 0);
            buildingGroup.add(techElement);
        }
    }
    addBuildingSignage(buildingGroup, buildingType, width, height) {
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        const specs = this.getBuildingSpecs(buildingType);
        let signageColor, signageText, signageStyle;
        switch (buildingType) {
            case 'hospital':
                signageColor = 0xFF0000; signageText = '🏥 HOSPITAL'; signageStyle = 'medical';
                break;
            case 'school':
                signageColor = 0xFFA500; signageText = '🏫 SCHOOL'; signageStyle = 'educational';
                break;
            case 'restaurant':
                signageColor = 0xFF69B4; signageText = '🍽️ RESTAURANT'; signageStyle = 'casual';
                break;
            case 'hotel':
                signageColor = 0xFFD700; signageText = '🏨 HOTEL'; signageStyle = 'luxury';
                break;
            case 'bank':
                signageColor = 0x006400; signageText = '🏦 BANK'; signageStyle = 'professional';
                break;
            case 'mall':
                signageColor = 0xFF1493; signageText = '🏬 SHOPPING CENTER'; signageStyle = 'retail';
                break;
            case 'gym':
                signageColor = 0xFF4500; signageText = '💪 FITNESS CENTER'; signageStyle = 'fitness';
                break;
            case 'cafe':
                signageColor = 0x8B4513; signageText = '☕ CAFE'; signageStyle = 'cozy';
                break;
            case 'library':
                signageColor = 0x2F4F4F; signageText = '📚 LIBRARY'; signageStyle = 'academic';
                break;
            case 'cinema':
                signageColor = 0x800080; signageText = '🎬 CINEMA'; signageStyle = 'entertainment';
                break;
            case 'tech-modern':
            case 'tech-startup':
                signageColor = 0x1E90FF; signageText = '💻 TECH HQ'; signageStyle = 'tech';
                break;
            case 'art-gallery':
                signageColor = 0x9370DB; signageText = '🎨 ART GALLERY'; signageStyle = 'artistic';
                break;
            case 'design-studio':
                signageColor = 0x4ECDC4; signageText = '✏️ DESIGN STUDIO'; signageStyle = 'creative';
                break;
            case 'warehouse':
                signageColor = 0x696969; signageText = '📦 WAREHOUSE'; signageStyle = 'industrial';
                break;
            case 'factory':
                signageColor = 0x8B4513; signageText = '🏭 FACTORY'; signageStyle = 'industrial';
                break;
            default:
                const colors = [0x2196F3, 0x4CAF50, 0xFF9800, 0x9C27B0, 0xF44336, 0x00BCD4];
                signageColor = colors[Math.floor(Math.random() * colors.length)];
                signageText = buildingType.toUpperCase().replace('-', ' ');
                signageStyle = 'standard';
        }
        const nameplateWidth = Math.min(width * 0.8, 300);
        const nameplateHeight = signageStyle === 'luxury' ? 30 : 20;
        const nameplateGeometry = new THREE.PlaneGeometry(nameplateWidth, nameplateHeight);
        const nameplateMaterial = new THREE.MeshBasicMaterial({ 
            color: signageColor,
            transparent: true,
            opacity: signageStyle === 'luxury' ? 0.95 : 0.9
        });
        const nameplate = new THREE.Mesh(nameplateGeometry, nameplateMaterial);
        nameplate.position.set(0, height + (signageStyle === 'luxury' ? 35 : 25), 0);
        nameplate.lookAt(0, height + 25, 100);
        buildingGroup.add(nameplate);
        if (signageStyle === 'luxury' || signageStyle === 'tech' || signageStyle === 'entertainment') {
            const frame = new THREE.Mesh(
                new THREE.PlaneGeometry(nameplateWidth + 10, nameplateHeight + 5),
                new THREE.MeshBasicMaterial({ 
                    color: 0xFFFFFF,
                    transparent: true,
                    opacity: 0.3
                })
            );
            frame.position.set(0, height + (signageStyle === 'luxury' ? 35 : 25), -1);
            frame.lookAt(0, height + 25, 100);
            buildingGroup.add(frame);
        }
        nameplate.userData = {
            buildingType: buildingType,
            signageText: signageText,
            signageStyle: signageStyle
        };
        this.nameplates.push(nameplate);
    }
    createAircraft() {
        if (this.isLowMemory) return;
        for (let i = 0; i < this.maxAircraft; i++) {
            this.spawnAircraft();
        }
    }
    spawnAircraft() {
        const aircraftGroup = new THREE.Group();
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(50, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        aircraftGroup.add(body);
        aircraftGroup.position.set(
            (Math.random() - 0.5) * 1000,
            200 + Math.random() * 100,
            (Math.random() - 0.5) * 1000
        );
        const aircraft = {
            group: aircraftGroup,
            direction: new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2).normalize(),
            speed: 20
        };
        this.aircraft.push(aircraft);
        this.scene.add(aircraftGroup);
    }
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
        window.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
        window.addEventListener('click', (event) => this.onMouseClick(event), false);
    }
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    onMouseClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.houses, true);
        if (intersects.length > 0) {
            const clickedHouse = intersects[0].object.parent;
            if (clickedHouse.userData && clickedHouse.userData.houseData) {
                this.showHouseInfo(clickedHouse.userData.houseData);
            }
        }
    }
    showHouseInfo(houseData) {
        const infoDiv = document.getElementById('developer-info');
        infoDiv.innerHTML = `
            <h3>🏠 House Information</h3>
            <p><strong>Developer:</strong> ${houseData.developer}</p>
            <p><strong>GitHub:</strong> @${houseData.github || 'Unknown'}</p>
            <p><strong>Size:</strong> ${houseData['building-length']}×${houseData['building-width']}×${houseData['building-height']}</p>
        `;
        infoDiv.style.display = 'block';
        setTimeout(() => {
            infoDiv.style.display = 'none';
        }, 5000);
    }
    update() {
        this.frameCount++;
        const playerX = this.camera.position.x;
        const playerZ = this.camera.position.z;
        this.updateDynamicLoading(playerX, playerZ);
        if (this.frameCount % this.memoryCleanupInterval === 0) {
            this.performMemoryCleanup();
        }
        if (this.aircraft.length > 0) {
            this.updateAircraft(0.016); // Assume 60fps
        }
        this.updateSkyElements(0.016);
    }
    updateSkyElements(deltaTime) {
        if (this.rockets && this.rockets.length > 0) {
            this.updateRockets(deltaTime);
        }
        this.updateClouds(deltaTime);
    }
    updateRockets(deltaTime) {
        for (let rocket of this.rockets) {
            if (!rocket.userData.velocity) continue;
            rocket.position.add(rocket.userData.velocity.clone().multiplyScalar(deltaTime * 60));
            rocket.rotation.x += 0.008;
            rocket.rotation.z += 0.004;
            if (rocket.position.x > 5000) rocket.position.x = -5000;
            if (rocket.position.x < -5000) rocket.position.x = 5000;
            if (rocket.position.z > 5000) rocket.position.z = -5000;
            if (rocket.position.z < -5000) rocket.position.z = 5000;
            if (rocket.position.y > 1500) rocket.position.y = 800;
            if (rocket.position.y < 700) rocket.position.y = 1400;
        }
    }
    updateClouds(deltaTime) {
        this.scene.traverse((child) => {
            if (child.userData && child.userData.rotationSpeed !== undefined) {
                child.position.x += 0.08 * deltaTime * 60; // Slightly slower for realism
                child.rotation.y += child.userData.rotationSpeed;
                if (child.position.x > 7000) child.position.x = -7000;
            }
        });
    }
    updateAircraft(deltaTime) {
        for (let i = this.aircraft.length - 1; i >= 0; i--) {
            const aircraft = this.aircraft[i];
            aircraft.group.position.add(
                aircraft.direction.clone().multiplyScalar(aircraft.speed * deltaTime)
            );
            if (aircraft.group.position.length() > 1000) {
                this.scene.remove(aircraft.group);
                this.aircraft.splice(i, 1);
                if (this.aircraft.length < this.maxAircraft) {
                    this.spawnAircraft();
                }
            }
        }
    }
    performMemoryCleanup() {
        if (window.gc) {
            window.gc();
        }
        this.renderer.info.memory.geometries = 0;
        this.renderer.info.memory.textures = 0;
        console.log('🧹 Memory cleanup performed');
    }
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    getPerformanceInfo() {
        const info = this.renderer.info;
        return {
            drawCalls: info.render.calls,
            triangles: info.render.triangles,
            geometries: info.memory.geometries,
            textures: info.memory.textures,
            performanceMode: this.performanceMode,
            memoryUsage: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'Unknown'
        };
    }
    initializeDynamicLoading() {
        console.log('🏗️ Initializing dynamic mega city loading system...');
        this.cityDistricts = {
            downtown: { center: { x: 0, z: 0 }, radius: 5000, type: 'skyscrapers' },
            techDistrict: { center: { x: -15000, z: 0 }, radius: 3000, type: 'tech_hqs' },
            financial: { center: { x: 15000, z: 0 }, radius: 3000, type: 'skyscrapers' },
            residential1: { center: { x: -30000, z: -30000 }, radius: 15000, type: 'residential' },
            residential2: { center: { x: 30000, z: -30000 }, radius: 15000, type: 'residential' },
            residential3: { center: { x: -30000, z: 30000 }, radius: 15000, type: 'residential' },
            residential4: { center: { x: 30000, z: 30000 }, radius: 15000, type: 'residential' },
            commercial1: { center: { x: -20000, z: -10000 }, radius: 5000, type: 'commercial' },
            commercial2: { center: { x: 20000, z: -10000 }, radius: 5000, type: 'commercial' },
            airport: { center: { x: 0, z: -40000 }, radius: 8000, type: 'airport' },
            parks: { center: { x: 5000, z: 5000 }, radius: 3000, type: 'park' },
            stadium: { center: { x: -10000, z: -5000 }, radius: 2000, type: 'stadium' }
        };
        this.loadingQueue = [];
        this.loadingInProgress = new Set();
        this.maxConcurrentLoads = this.isLowMemory ? 1 : 2;
        console.log('✅ Dynamic loading system ready!');
    }
    loadInitialArea() {
        const playerX = this.camera.position.x;
        const playerZ = this.camera.position.z;
        this.updateDynamicLoading(playerX, playerZ);
        this.generateSimpleHouses();
    }
    updateDynamicLoading(playerX, playerZ) {
        const currentChunkX = Math.floor(playerX / this.chunkSize);
        const currentChunkZ = Math.floor(playerZ / this.chunkSize);
        if (this.lastPlayerChunk.x !== currentChunkX || this.lastPlayerChunk.z !== currentChunkZ) {
            this.lastPlayerChunk = { x: currentChunkX, z: currentChunkZ };
            for (let x = currentChunkX - this.renderDistance; x <= currentChunkX + this.renderDistance; x++) {
                for (let z = currentChunkZ - this.renderDistance; z <= currentChunkZ + this.renderDistance; z++) {
                    const chunkKey = `${x},${z}`;
                    if (!this.loadedCityChunks.has(chunkKey) && !this.loadingInProgress.has(chunkKey)) {
                        this.queueChunkForLoading(x, z);
                    }
                }
            }
            this.unloadDistantChunks(currentChunkX, currentChunkZ);
        }
        this.processLoadingQueue();
    }
    queueChunkForLoading(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        if (this.loadingInProgress.has(chunkKey) || this.loadedCityChunks.has(chunkKey)) {
            return;
        }
        this.loadingQueue.push({ x: chunkX, z: chunkZ, key: chunkKey });
    }
    processLoadingQueue() {
        while (this.loadingQueue.length > 0 && this.loadingInProgress.size < this.maxConcurrentLoads) {
            const chunk = this.loadingQueue.shift();
            this.loadCityChunk(chunk.x, chunk.z);
        }
    }
    loadCityChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        this.loadingInProgress.add(chunkKey);
        const worldX = chunkX * this.chunkSize;
        const worldZ = chunkZ * this.chunkSize;
        const district = this.getDistrictForPosition(worldX, worldZ);
        if (district) {
            console.log(`🏗️ Loading ${district.type} chunk at (${chunkX}, ${chunkZ})`);
            const chunkContent = this.createCityChunkContent(worldX, worldZ, district);
            if (chunkContent && chunkContent.children.length > 0) {
                this.scene.add(chunkContent);
                this.cityChunks.set(chunkKey, chunkContent);
            }
        } else {
            const basicContent = this.createBasicChunkContent(worldX, worldZ);
            if (basicContent) {
                this.scene.add(basicContent);
                this.cityChunks.set(chunkKey, basicContent);
            }
        }
        this.loadedCityChunks.add(chunkKey);
        this.loadingInProgress.delete(chunkKey);
    }
    getDistrictForPosition(x, z) {
        for (const [name, district] of Object.entries(this.cityDistricts)) {
            const dx = x - district.center.x;
            const dz = z - district.center.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            if (distance <= district.radius) {
                return district;
            }
        }
        return null;
    }
    createCityChunkContent(x, z, district) {
        const chunkGroup = new THREE.Group();
        chunkGroup.position.set(x, 0, z);
        switch (district.type) {
            case 'skyscrapers':
                this.addSkyscrapersToChunk(chunkGroup, district);
                break;
            case 'tech_hqs':
                this.addTechHQsToChunk(chunkGroup, district);
                break;
            case 'residential':
                this.addResidentialToChunk(chunkGroup, district);
                break;
            case 'commercial':
                this.addCommercialToChunk(chunkGroup, district);
                break;
            case 'airport':
                this.addAirportToChunk(chunkGroup, district);
                break;
            case 'park':
                this.addParkToChunk(chunkGroup, district);
                break;
            case 'stadium':
                this.addStadiumToChunk(chunkGroup, district);
                break;
        }
        this.addRoadsToChunk(chunkGroup);
        return chunkGroup;
    }
    addSkyscrapersToChunk(chunkGroup, district) {
        const buildingCount = this.isLowMemory ? 2 : 4;
        for (let i = 0; i < buildingCount; i++) {
            const building = this.createSkyscraper();
            building.position.set(
                (Math.random() - 0.5) * this.chunkSize * 0.8,
                0,
                (Math.random() - 0.5) * this.chunkSize * 0.8
            );
            chunkGroup.add(building);
        }
        this.addUrbanFurniture(chunkGroup);
        this.addStreetLights(chunkGroup);
        this.addTrees(chunkGroup, 3, 6);
        if (Math.random() > 0.5) {
            this.addBillboard(chunkGroup, this.chunkSize * 0.4, this.chunkSize * 0.4);
        }
    }
    addUrbanFurniture(chunkGroup) {
        for (let i = 0; i < 2; i++) {
            const busStop = new THREE.Group();
            const shelter = new THREE.Mesh(
                this.sharedGeometries.get('house'),
                new THREE.MeshBasicMaterial({ color: 0xE0E0E0, transparent: true, opacity: 0.8 })
            );
            shelter.scale.set(30, 25, 80);
            shelter.position.y = 12;
            busStop.add(shelter);
            const bench = new THREE.Mesh(
                this.sharedGeometries.get('house'),
                new THREE.MeshBasicMaterial({ color: 0x8D6E63 })
            );
            bench.scale.set(60, 5, 15);
            bench.position.y = 2;
            busStop.add(bench);
            busStop.position.set(
                (Math.random() - 0.5) * this.chunkSize * 0.9,
                0,
                (Math.random() - 0.5) * this.chunkSize * 0.9
            );
            chunkGroup.add(busStop);
        }
        this.addStreetObjects(chunkGroup);
    }
    addStreetObjects(chunkGroup) {
        for (let i = 0; i < 3; i++) {
            const mailbox = new THREE.Mesh(
                new THREE.CylinderGeometry(5, 5, 15, 8),
                new THREE.MeshBasicMaterial({ color: 0x2196F3 })
            );
            mailbox.position.set(
                (Math.random() - 0.5) * this.chunkSize * 0.8,
                7,
                (Math.random() - 0.5) * this.chunkSize * 0.8
            );
            chunkGroup.add(mailbox);
        }
        for (let i = 0; i < 2; i++) {
            const hydrant = new THREE.Mesh(
                new THREE.CylinderGeometry(4, 4, 12, 8),
                new THREE.MeshBasicMaterial({ color: 0xF44336 })
            );
            hydrant.position.set(
                (Math.random() - 0.5) * this.chunkSize * 0.8,
                6,
                (Math.random() - 0.5) * this.chunkSize * 0.8
            );
            chunkGroup.add(hydrant);
        }
        for (let i = 0; i < 4; i++) {
            const trashCan = new THREE.Mesh(
                new THREE.CylinderGeometry(6, 6, 20, 8),
                new THREE.MeshBasicMaterial({ color: 0x424242 })
            );
            trashCan.position.set(
                (Math.random() - 0.5) * this.chunkSize * 0.8,
                10,
                (Math.random() - 0.5) * this.chunkSize * 0.8
            );
            chunkGroup.add(trashCan);
        }
    }
    createSkyscraper() {
        const corporateTypes = [
            'corporate-glass', 'corporate-cement', 'corporate-blocks', 'corporate-legacy', 'corporate-creative',
            'tech-modern', 'office-tower', 'office-modern', 'residential-luxury', 'apartment-luxury'
        ];
        const buildingType = corporateTypes[Math.floor(Math.random() * corporateTypes.length)];
        const floors = this.isLowMemory ? 
            10 + Math.floor(Math.random() * 25) :  // 10-35 floors for low-end
            15 + Math.floor(Math.random() * 45);   // 15-60 floors for high-end
        return this.createAdvancedBuilding(buildingType, floors);
    }
    addSkyscraperWindows(buildingGroup, width, height, depth) {
        const glassMaterial = this.sharedMaterials.get('glass');
        const floors = Math.floor(height / 100);
        for (let floor = 1; floor < floors; floor++) {
            const frontWindow = new THREE.Mesh(
                new THREE.PlaneGeometry(width * 0.9, 60),
                glassMaterial
            );
            frontWindow.position.set(0, floor * 100, depth / 2 + 1);
            buildingGroup.add(frontWindow);
            if (Math.random() > 0.5) {
                const sideWindow = new THREE.Mesh(
                    new THREE.PlaneGeometry(depth * 0.9, 60),
                    glassMaterial
                );
                sideWindow.position.set(width / 2 + 1, floor * 100, 0);
                sideWindow.rotation.y = Math.PI / 2;
                buildingGroup.add(sideWindow);
            }
        }
    }
    addRooftopElements(buildingGroup, width, height, depth) {
        const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 50, 8),
            new THREE.MeshBasicMaterial({ color: 0x757575 })
        );
        antenna.position.set(0, height + 25, 0);
        buildingGroup.add(antenna);
        if (Math.random() > 0.6) {
            const rooftopBox = new THREE.Mesh(
                this.sharedGeometries.get('house'),
                new THREE.MeshBasicMaterial({ color: 0x9E9E9E })
            );
            rooftopBox.scale.set(width * 0.3, 30, depth * 0.3);
            rooftopBox.position.set(0, height + 15, 0);
            buildingGroup.add(rooftopBox);
        }
    }
    addSimpleWindows(buildingGroup, width, height, depth) {
        const windowCount = 8;
        const windowMaterial = this.sharedMaterials.get('window');
        for (let i = 0; i < windowCount; i++) {
            const window = new THREE.Mesh(
                new THREE.PlaneGeometry(width * 0.8, height * 0.1),
                windowMaterial
            );
            window.position.set(0, (i / windowCount) * height, depth / 2 + 1);
            buildingGroup.add(window);
        }
    }
    addTechHQsToChunk(chunkGroup, district) {
        const companies = ['Google', 'Microsoft', 'Meta', 'Amazon'];
        const colors = [0x4285F4, 0x00BCF2, 0x1877F2, 0xFF9900];
        companies.forEach((company, i) => {
            if (Math.random() > 0.7) { // 30% chance per chunk
                const hq = this.createTechHQ(company, colors[i]);
                hq.position.set(
                    (Math.random() - 0.5) * this.chunkSize * 0.6,
                    0,
                    (Math.random() - 0.5) * this.chunkSize * 0.6
                );
                chunkGroup.add(hq);
            }
        });
    }
    createTechHQ(company, color) {
        const hqGroup = new THREE.Group();
        const size = this.isLowMemory ? 800 : 1200;
        const height = this.isLowMemory ? 4000 : 6000;
        const building = new THREE.Mesh(
            this.sharedGeometries.get('house'),
            new THREE.MeshBasicMaterial({ color: color })
        );
        building.scale.set(size, height, size);
        building.position.y = height / 2;
        hqGroup.add(building);
        return hqGroup;
    }
    addResidentialToChunk(chunkGroup, district) {
        const houseCount = this.isLowMemory ? 3 : 6;
        for (let i = 0; i < houseCount; i++) {
            const house = this.createSuburbanHouse();
            house.position.set(
                (Math.random() - 0.5) * this.chunkSize * 0.9,
                0,
                (Math.random() - 0.5) * this.chunkSize * 0.9
            );
            chunkGroup.add(house);
        }
        if (Math.random() > 0.7) {
            const serviceTypes = [
                'hospital', 'school', 'library', 'gym', 'cafe', 'restaurant', 
                'bank', 'cinema', 'mall', 'hotel', 'art-gallery', 'design-studio'
            ];
            const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
            const serviceBuilding = this.createAdvancedBuilding(serviceType, 2 + Math.floor(Math.random() * 3));
            serviceBuilding.position.set(
                (Math.random() - 0.5) * this.chunkSize * 0.5,
                0,
                (Math.random() - 0.5) * this.chunkSize * 0.5
            );
            chunkGroup.add(serviceBuilding);
        }
        if (Math.random() > 0.7) {
            this.addSwimmingPool(chunkGroup);
        }
        this.addTrees(chunkGroup, 8, 12);
        this.addCars(chunkGroup, 3, 5);
    }
    addSwimmingPool(chunkGroup) {
        const poolGroup = new THREE.Group();
        const pool = new THREE.Mesh(
            this.sharedGeometries.get('pool'),
            this.sharedMaterials.get('water')
        );
        pool.position.y = 2;
        poolGroup.add(pool);
        const deck = new THREE.Mesh(
            new THREE.CylinderGeometry(70, 70, 2, 8),
            this.sharedMaterials.get('poolTile')
        );
        deck.position.y = 1;
        poolGroup.add(deck);
        this.addBillboard(poolGroup, 80, 30);
        poolGroup.position.set(
            (Math.random() - 0.5) * this.chunkSize * 0.8,
            0,
            (Math.random() - 0.5) * this.chunkSize * 0.8
        );
        chunkGroup.add(poolGroup);
    }
    addBillboard(parentGroup, x = 0, z = 0) {
        const billboardGroup = new THREE.Group();
        const billboard = new THREE.Mesh(
            this.sharedGeometries.get('billboard'),
            this.sharedMaterials.get('billboard')
        );
        billboard.position.set(x, 40, z);
        billboardGroup.add(billboard);
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 80, 8),
            new THREE.MeshBasicMaterial({ color: 0x795548 })
        );
        post.position.set(x, 40, z);
        billboardGroup.add(post);
        parentGroup.add(billboardGroup);
    }
    addTrees(chunkGroup, minTrees, maxTrees) {
        if (this.ultraLowEnd) {
            minTrees = Math.max(1, Math.floor(minTrees / 3));
            maxTrees = Math.max(2, Math.floor(maxTrees / 3));
        } else if (this.isLowMemory) {
            minTrees = Math.max(1, Math.floor(minTrees / 2));
            maxTrees = Math.max(2, Math.floor(maxTrees / 2));
        }
        const treeCount = minTrees + Math.floor(Math.random() * (maxTrees - minTrees));
        for (let i = 0; i < treeCount; i++) {
            const treeGroup = new THREE.Group();
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(5, 8, 30, 8),
                this.sharedMaterials.get('treeTrunk')
            );
            trunk.position.y = 15;
            treeGroup.add(trunk);
            const crown = new THREE.Mesh(
                this.sharedGeometries.get('tree'),
                this.sharedMaterials.get('tree')
            );
            crown.position.y = 40;
            treeGroup.add(crown);
            treeGroup.position.set(
                (Math.random() - 0.5) * this.chunkSize * 0.9,
                0,
                (Math.random() - 0.5) * this.chunkSize * 0.9
            );
            chunkGroup.add(treeGroup);
        }
    }
    addCars(chunkGroup, minCars, maxCars) {
        if (this.ultraLowEnd) {
            minCars = Math.max(0, Math.floor(minCars / 4));
            maxCars = Math.max(1, Math.floor(maxCars / 4));
        } else if (this.isLowMemory) {
            minCars = Math.max(1, Math.floor(minCars / 2));
            maxCars = Math.max(2, Math.floor(maxCars / 2));
        }
        const carCount = minCars + Math.floor(Math.random() * (maxCars - minCars));
        const carColors = [0xF44336, 0x2196F3, 0x4CAF50, 0xFFEB3B, 0x9C27B0, 0xFF5722];
        for (let i = 0; i < carCount; i++) {
            const color = carColors[Math.floor(Math.random() * carColors.length)];
            const carMaterial = new THREE.MeshBasicMaterial({ color });
            const car = new THREE.Mesh(
                this.sharedGeometries.get('car'),
                carMaterial
            );
            car.position.set(
                (Math.random() - 0.5) * this.chunkSize * 0.8,
                7,
                (Math.random() - 0.5) * this.chunkSize * 0.8
            );
            car.rotation.y = Math.random() * Math.PI * 2;
            chunkGroup.add(car);
        }
    }
    createSuburbanHouse() {
        const creativeTypes = ['creative-modern', 'creative-legacy', 'creative-eclectic'];
        const buildingType = creativeTypes[Math.floor(Math.random() * creativeTypes.length)];
        const floors = 1 + Math.floor(Math.random() * 3);
        return this.createAdvancedBuilding(buildingType, floors);
    }
    addSuburbanWindows(houseGroup) {
        const glassMaterial = this.sharedMaterials.get('glass');
        for (let i = 0; i < 2; i++) {
            const window = new THREE.Mesh(
                this.sharedGeometries.get('window'),
                glassMaterial
            );
            window.scale.set(25, 30, 1);
            window.position.set(
                -40 + (i * 80),
                60,
                76
            );
            houseGroup.add(window);
        }
    }
    addSuburbanDoor(houseGroup) {
        const door = new THREE.Mesh(
            this.sharedGeometries.get('door'),
            new THREE.MeshBasicMaterial({ color: 0x8D6E63 })
        );
        door.scale.set(20, 50, 1);
        door.position.set(0, 25, 76);
        houseGroup.add(door);
    }
    addGarage(houseGroup) {
        const garage = new THREE.Mesh(
            this.sharedGeometries.get('house'),
            this.sharedMaterials.get('building0')
        );
        garage.scale.set(120, 80, 100);
        garage.position.set(150, 40, 0);
        houseGroup.add(garage);
    }
    addCommercialToChunk(chunkGroup, district) {
        const mallType = ['mall', 'shopping-center', 'entertainment-venue'][Math.floor(Math.random() * 3)];
        const mall = this.createAdvancedBuilding(mallType, 2);
        mall.position.set(0, 0, 0);
        chunkGroup.add(mall);
        const commercialTypes = [
            'restaurant', 'hotel', 'bank', 'cafe', 'cinema', 'gym', 'nightclub', 
            'bar-restaurant', 'art-gallery', 'design-studio', 'office-modern',
            'tech-startup', 'creative-modern', 'entertainment-venue'
        ];
        const buildingCount = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < buildingCount; i++) {
            if (Math.random() > 0.2) { // 80% chance to spawn
                const type = commercialTypes[Math.floor(Math.random() * commercialTypes.length)];
                const building = this.createAdvancedBuilding(type, 1 + Math.floor(Math.random() * 4));
                building.position.set(
                    (Math.random() - 0.5) * this.chunkSize * 0.7,
                    0,
                    (Math.random() - 0.5) * this.chunkSize * 0.7
                );
                chunkGroup.add(building);
            }
        }
        this.addBillboard(chunkGroup, this.chunkSize * 0.3, this.chunkSize * 0.3);
        this.addBillboard(chunkGroup, -this.chunkSize * 0.3, this.chunkSize * 0.3);
        this.addBillboard(chunkGroup, 0, -this.chunkSize * 0.3);
        this.addCars(chunkGroup, 15, 25);
        this.addTrees(chunkGroup, 5, 8);
        this.addStreetLights(chunkGroup);
    }
    addParkToChunk(chunkGroup, district) {
        const park = new THREE.Mesh(
            this.sharedGeometries.get('ground'),
            new THREE.MeshBasicMaterial({ color: 0x4CAF50 })
        );
        park.rotation.x = -Math.PI / 2;
        park.position.y = 1;
        chunkGroup.add(park);
        this.addTrees(chunkGroup, 20, 30);
        this.addParkBenches(chunkGroup);
        this.addFountain(chunkGroup);
        this.addParkPaths(chunkGroup);
    }
    addStreetLights(chunkGroup) {
        const lightCount = this.isLowMemory ? 4 : 8;
        for (let i = 0; i < lightCount; i++) {
            const lightGroup = new THREE.Group();
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(2, 2, 60, 8),
                new THREE.MeshBasicMaterial({ color: 0x424242 })
            );
            pole.position.y = 30;
            lightGroup.add(pole);
            const light = new THREE.Mesh(
                new THREE.SphereGeometry(5, 8, 6),
                new THREE.MeshBasicMaterial({ color: 0xFFF59D })
            );
            light.position.y = 55;
            lightGroup.add(light);
            lightGroup.position.set(
                (Math.random() - 0.5) * this.chunkSize * 0.9,
                0,
                (Math.random() - 0.5) * this.chunkSize * 0.9
            );
            chunkGroup.add(lightGroup);
        }
    }
    addParkBenches(chunkGroup) {
        for (let i = 0; i < 6; i++) {
            const bench = new THREE.Mesh(
                this.sharedGeometries.get('house'),
                new THREE.MeshBasicMaterial({ color: 0x8D6E63 })
            );
            bench.scale.set(40, 5, 15);
            bench.position.set(
                (Math.random() - 0.5) * this.chunkSize * 0.6,
                2,
                (Math.random() - 0.5) * this.chunkSize * 0.6
            );
            chunkGroup.add(bench);
        }
    }
    addFountain(chunkGroup) {
        const fountainGroup = new THREE.Group();
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(40, 45, 10, 16),
            new THREE.MeshBasicMaterial({ color: 0xBDBDBD })
        );
        base.position.y = 5;
        fountainGroup.add(base);
        const water = new THREE.Mesh(
            new THREE.CylinderGeometry(35, 35, 2, 16),
            this.sharedMaterials.get('water')
        );
        water.position.y = 9;
        fountainGroup.add(water);
        const spire = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 20, 8),
            new THREE.MeshBasicMaterial({ color: 0x9E9E9E })
        );
        spire.position.y = 20;
        fountainGroup.add(spire);
        fountainGroup.position.set(0, 0, 0);
        chunkGroup.add(fountainGroup);
    }
    addParkPaths(chunkGroup) {
        const pathMaterial = new THREE.MeshBasicMaterial({ color: 0xA1887F });
        const hPath = new THREE.Mesh(
            new THREE.PlaneGeometry(this.chunkSize * 0.8, 30),
            pathMaterial
        );
        hPath.rotation.x = -Math.PI / 2;
        hPath.position.y = 2;
        chunkGroup.add(hPath);
        const vPath = new THREE.Mesh(
            new THREE.PlaneGeometry(30, this.chunkSize * 0.8),
            pathMaterial
        );
        vPath.rotation.x = -Math.PI / 2;
        vPath.position.y = 2;
        chunkGroup.add(vPath);
    }
    addStadiumToChunk(chunkGroup, district) {
        const stadium = new THREE.Mesh(
            new THREE.CylinderGeometry(400, 450, 100, 16),
            new THREE.MeshBasicMaterial({ color: 0xF5F5F5 })
        );
        stadium.position.y = 50;
        chunkGroup.add(stadium);
        const roof = new THREE.Mesh(
            new THREE.CylinderGeometry(380, 420, 20, 16),
            new THREE.MeshBasicMaterial({ color: 0x2196F3 })
        );
        roof.position.y = 110;
        chunkGroup.add(roof);
        const field = new THREE.Mesh(
            new THREE.CylinderGeometry(200, 200, 5, 16),
            new THREE.MeshBasicMaterial({ color: 0x4CAF50 })
        );
        field.position.y = 5;
        chunkGroup.add(field);
        this.addCars(chunkGroup, 20, 30);
        this.addStadiumLights(chunkGroup);
    }
    addStadiumLights(chunkGroup) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * 500;
            const z = Math.sin(angle) * 500;
            const lightGroup = new THREE.Group();
            const tower = new THREE.Mesh(
                new THREE.CylinderGeometry(5, 8, 80, 8),
                new THREE.MeshBasicMaterial({ color: 0x757575 })
            );
            tower.position.y = 40;
            lightGroup.add(tower);
            const light = new THREE.Mesh(
                new THREE.BoxGeometry(20, 10, 15),
                new THREE.MeshBasicMaterial({ color: 0xFFEB3B })
            );
            light.position.y = 75;
            lightGroup.add(light);
            lightGroup.position.set(x, 0, z);
            chunkGroup.add(lightGroup);
        }
    }
    addRoadsToChunk(chunkGroup) {
        const roadMaterial = this.sharedMaterials.get('road');
        const sidewalkMaterial = this.sharedMaterials.get('sidewalk');
        const hRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(this.chunkSize, 120),
            roadMaterial
        );
        hRoad.rotation.x = -Math.PI / 2;
        hRoad.position.y = 3.0; // Well above terrain to prevent z-fighting
        chunkGroup.add(hRoad);
        const hSidewalk1 = new THREE.Mesh(
            new THREE.PlaneGeometry(this.chunkSize, 30),
            sidewalkMaterial
        );
        hSidewalk1.rotation.x = -Math.PI / 2;
        hSidewalk1.position.set(0, 3.1, 75); // Slightly above roads
        chunkGroup.add(hSidewalk1);
        const hSidewalk2 = new THREE.Mesh(
            new THREE.PlaneGeometry(this.chunkSize, 30),
            sidewalkMaterial
        );
        hSidewalk2.rotation.x = -Math.PI / 2;
        hSidewalk2.position.set(0, 3.1, -75); // Slightly above roads
        chunkGroup.add(hSidewalk2);
        const vRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(120, this.chunkSize),
            roadMaterial
        );
        vRoad.rotation.x = -Math.PI / 2;
        vRoad.position.y = 3.0; // Well above terrain to prevent z-fighting
        chunkGroup.add(vRoad);
        const vSidewalk1 = new THREE.Mesh(
            new THREE.PlaneGeometry(30, this.chunkSize),
            sidewalkMaterial
        );
        vSidewalk1.rotation.x = -Math.PI / 2;
        vSidewalk1.position.set(75, 3.1, 0); // Slightly above roads
        chunkGroup.add(vSidewalk1);
        const vSidewalk2 = new THREE.Mesh(
            new THREE.PlaneGeometry(30, this.chunkSize),
            sidewalkMaterial
        );
        vSidewalk2.rotation.x = -Math.PI / 2;
        vSidewalk2.position.set(-75, 3.1, 0); // Slightly above roads
        chunkGroup.add(vSidewalk2);
        this.addRoadMarkings(chunkGroup);
        this.addCrosswalks(chunkGroup);
    }
    addRoadMarkings(chunkGroup) {
        const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        for (let i = 0; i < 10; i++) {
            const marking = new THREE.Mesh(
                new THREE.PlaneGeometry(80, 3),
                markingMaterial
            );
            marking.rotation.x = -Math.PI / 2;
            marking.position.set(
                -this.chunkSize * 0.4 + (i * this.chunkSize * 0.08),
                2,
                0
            );
            chunkGroup.add(marking);
        }
        for (let i = 0; i < 10; i++) {
            const marking = new THREE.Mesh(
                new THREE.PlaneGeometry(3, 80),
                markingMaterial
            );
            marking.rotation.x = -Math.PI / 2;
            marking.position.set(
                0,
                2,
                -this.chunkSize * 0.4 + (i * this.chunkSize * 0.08)
            );
            chunkGroup.add(marking);
        }
    }
    addCrosswalks(chunkGroup) {
        const crosswalkMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        for (let i = 0; i < 6; i++) {
            const stripe = new THREE.Mesh(
                new THREE.PlaneGeometry(10, 120),
                crosswalkMaterial
            );
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(-25 + (i * 10), 2, 0);
            chunkGroup.add(stripe);
        }
        for (let i = 0; i < 6; i++) {
            const stripe = new THREE.Mesh(
                new THREE.PlaneGeometry(120, 10),
                crosswalkMaterial
            );
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(0, 2, -25 + (i * 10));
            chunkGroup.add(stripe);
        }
    }
    createBasicChunkContent(x, z) {
        const chunkGroup = new THREE.Group();
        chunkGroup.position.set(x, 0, z);
        this.addRoadsToChunk(chunkGroup);
        return chunkGroup;
    }
    unloadDistantChunks(currentChunkX, currentChunkZ) {
        const chunksToUnload = [];
        for (const chunkKey of this.loadedCityChunks) {
            const [x, z] = chunkKey.split(',').map(Number);
            const distance = Math.max(Math.abs(x - currentChunkX), Math.abs(z - currentChunkZ));
            if (distance > this.renderDistance + 1) {
                chunksToUnload.push(chunkKey);
            }
        }
        chunksToUnload.forEach(chunkKey => {
            const chunk = this.cityChunks.get(chunkKey);
            if (chunk) {
                this.scene.remove(chunk);
                this.cityChunks.delete(chunkKey);
                this.loadedCityChunks.delete(chunkKey);
            }
        });
        if (chunksToUnload.length > 0) {
            console.log(`🗑️ Unloaded ${chunksToUnload.length} distant chunks`);
        }
    }
}
