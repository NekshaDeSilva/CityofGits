// World.js - ULTRA-OPTIMIZED for 4GB RAM using Minecraft techniques

class World {
    // Subway hint popup logic
showSubwayHint() {
    if (!this.subwayHintDiv) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.bottom = '10%';
        div.style.left = '50%';
        div.style.transform = 'translateX(-50%)';
        div.style.background = 'rgba(0,0,0,0.8)';
        div.style.color = '#fff';
        div.style.padding = '18px 32px';
        div.style.fontSize = '1.5em';
        div.style.borderRadius = '12px';
        div.style.fontFamily = 'Arial, sans-serif';
        div.style.zIndex = '1001';
        div.style.boxShadow = '0 4px 24px #000a';
        div.id = 'subway-hint';
        div.innerHTML = 'Press <b>U</b> to enter the underworld';
        document.body.appendChild(div);
        this.subwayHintDiv = div;
    }
    this.subwayHintDiv.style.display = 'block';
}
hideSubwayHint() {
    if (this.subwayHintDiv) {
        this.subwayHintDiv.style.display = 'none';
    }
}
// Listen for U key to enter underworld
_setupSubwayKeyListener() {
    if (this._subwayKeyListenerSet) return;
    this._subwayKeyListenerSet = true;
    window.addEventListener('keydown', (e) => {
        if (e.key === 'u' || e.key === 'U') {
            if (this._subwayWellToEnter && !this.isUnderground) {
                // Store current position for return teleport
                this.lastSurfacePosition = {
                    x: this.camera.position.x,
                    y: this.camera.position.y,
                    z: this.camera.position.z
                };
                this.teleportToUnderground(this._subwayWellToEnter.x, this._subwayWellToEnter.z);
                this.hideSubwayHint();
            }
        }
    });
}
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.houses = [];
        this.nameplates = [];
        this.worldData = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // MINECRAFT-STYLE CHUNK SYSTEM for 4GB RAM
        this.terrainChunks = new Map();
        this.loadedChunks = new Set();
        this.cityChunks = new Map(); // NEW: City chunks for mega city
        this.chunkSize = 2000; // Larger chunks for city content
        this.renderDistance = 3; // 3 chunk radius (7x7 grid)
        this.maxLoadedChunks = 49; // Maximum chunks in 7x7 grid
        this.lastPlayerChunk = { x: null, z: null };
        
        // MEGA CITY DYNAMIC LOADING
        this.megaCityEnabled = true;
        this.cityBounds = {
            min: { x: -60000, z: -60000 },
            max: { x: 60000, z: 60000 }
        };
        this.loadedCityChunks = new Set();
        this.chunkLoadQueue = [];
        
        // UNLIMITED CAVE SYSTEM PROPERTIES
        this.isUnderground = false;
        this.caveSections = [];
        this.currentCaveSection = 0;
        this.lastPlayerPosUnderground = { x: 0, z: 0 };
        this.torchLights = [];
        this.maxConcurrentLoads = 2; // Load max 2 chunks per frame
        
        // PERFORMANCE DETECTION
        this.isLowMemory = this.detectLowMemoryDevice();
        this.ultraLowEnd = false; // Set by detectLowMemoryDevice if ultra-low-end
        this.performanceMode = this.ultraLowEnd ? 'ultra-lite' : (this.isLowMemory ? 'lite' : 'normal');
        
        // Adjust settings for ultra-low-end devices
        if (this.ultraLowEnd) {
            this.chunkSize = 1500; // Smaller chunks
            this.renderDistance = 2; // Only 5x5 grid
            this.maxLoadedChunks = 25;
            this.maxConcurrentLoads = 1;
        }
        
        // SHARED RESOURCES (Critical for 4GB systems)
        this.sharedGeometries = new Map();
        this.sharedMaterials = new Map();
        this.initSharedResources();
        
        // OBJECT POOLING
        this.pools = {
            buildings: [],
            windows: [],
            decorations: []
        };
        
        // CULLING SYSTEM
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();
        this.visibleObjects = new Set();
        
        // MINIMAL AIRCRAFT
        this.aircraft = [];
        this.maxAircraft = this.isLowMemory ? 0 : 1; // No aircraft on 4GB systems
        
        // MEMORY MANAGEMENT
        this.frameCount = 0;
        this.lastMemoryCleanup = 0;
        this.memoryCleanupInterval = 180; // Clean every 3 seconds
        
        // Promise to track initialization completion
        this.initPromise = this.init();
    }

    detectLowMemoryDevice() {
        // Detect ultra-low-end systems (1-2GB RAM)
        if (navigator.deviceMemory && navigator.deviceMemory <= 2) {
            this.ultraLowEnd = true;
            return true;
        }
        
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
        
        // Check for very old devices
        const isOldDevice = /Android [1-6]/.test(navigator.userAgent) || 
                           /iPhone OS [1-9]_/.test(navigator.userAgent);
        
        if (isOldDevice) {
            this.ultraLowEnd = true;
            return true;
        }
        
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    initSharedResources() {
        // Pre-create shared geometries (Minecraft approach)
        this.sharedGeometries.set('house', new THREE.BoxGeometry(1, 1, 1));
        this.sharedGeometries.set('window', new THREE.PlaneGeometry(1, 1));
        this.sharedGeometries.set('door', new THREE.PlaneGeometry(1, 1));
        this.sharedGeometries.set('ground', new THREE.PlaneGeometry(this.chunkSize, this.chunkSize));
        this.sharedGeometries.set('pool', new THREE.CylinderGeometry(50, 50, 5, 8));
        this.sharedGeometries.set('billboard', new THREE.PlaneGeometry(100, 60));
        this.sharedGeometries.set('tree', new THREE.ConeGeometry(15, 40, 8));
        this.sharedGeometries.set('car', new THREE.BoxGeometry(40, 15, 20));
        
        // MASSIVE NYC-style building palette with thousands of unique designs - ENHANCED COLORS
        const corporateGlass = [0x87CEEB, 0xB0E0E6, 0xADD8E6, 0x87CEFA, 0x6495ED, 0x4169E1, 0x0000CD, 0x191970, 0x00CED1, 0x20B2AA, 0x40E0D0, 0x48D1CC];
        const corporateCement = [0xF5F5DC, 0xDDD8C4, 0xC8C3A6, 0xBEB9A0, 0xB8B08A, 0xD2B48C, 0xBC8F8F, 0xF4A460, 0xDAA520, 0xB8860B, 0xCD853F, 0xA0522D];
        const corporateBlocks = [0xD3D3D3, 0xC0C0C0, 0xA9A9A9, 0x808080, 0x696969, 0x2F4F4F, 0x708090, 0x778899, 0x4682B4, 0x5F9EA0, 0x6495ED, 0x4169E1];
        const corporateLegacy = [0x8B4513, 0xA0522D, 0xCD853F, 0xDEB887, 0xF4A460, 0xD2691E, 0xB22222, 0xA52A2A, 0x800000, 0x654321, 0x8B0000, 0xDC143C];
        const corporateCreative = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFFC93C, 0xFF6347, 0x32CD32, 0x7B68EE, 0xFF1493, 0x00FF7F, 0xFF4500, 0x9932CC];
        
        // Tech company HQ colors (Apple, Google, Microsoft style) - ENHANCED
        const techModern = [0xF5F5F5, 0xE0E0E0, 0x1E90FF, 0x0066CC, 0x4285F4, 0x34A853, 0xFF6D01, 0x7C3AED, 0x00D4AA, 0xFF3366, 0x5865F2, 0x40E0D0];
        const techStartup = [0xFF3366, 0x00D4AA, 0x5865F2, 0xFF6B35, 0x7289DA, 0x747F8D, 0x99AAB5, 0x2C2F33, 0x23272A, 0x40444B, 0xFF4500, 0x32CD32];
        
        // Stunning creative buildings with vibrant colors - SUPER ENHANCED
        const creativeModern = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFFC93C, 0xFF1493, 0x00FF7F, 0x7B68EE, 0xFF4500, 0x32CD32, 0x9932CC, 0x00CED1];
        const creativeLegacy = [0xB22222, 0xDC143C, 0xFF4500, 0xFF6347, 0xCD5C5C, 0x8B0000, 0x800000, 0xA0522D, 0xD2691E, 0xCD853F, 0xFF8C00, 0xFFA500];
        const creativeEclectic = [0x9370DB, 0x8A2BE2, 0x7B68EE, 0x6A5ACD, 0x483D8B, 0x9932CC, 0xBA55D3, 0xDA70D6, 0xEE82EE, 0xDDA0DD, 0xFF1493, 0xFF69B4];
        const creativeArtistic = [0xFF69B4, 0xFF1493, 0xDC143C, 0xB22222, 0xFF6347, 0xFF4500, 0xFFA500, 0xFFD700, 0xADFF2F, 0x7FFF00, 0x32CD32, 0x00FF00];
        const creativeBohemian = [0x8B4513, 0xA0522D, 0xCD853F, 0xD2691E, 0xDAA520, 0xB8860B, 0x9ACD32, 0x32CD32, 0x228B22, 0x006400, 0xFF8C00, 0xFFA500];
        
        // Mixed-use and residential varieties - MORE COLORFUL
        const residentialLuxury = [0xFFD700, 0xFFA500, 0xFF8C00, 0xDAA520, 0xB8860B, 0xF0E68C, 0xEEE8AA, 0xBDB76B, 0x9ACD32, 0x556B2F, 0xFFE4B5, 0xDEB887];
        const residentialModern = [0x4169E1, 0x6495ED, 0x87CEEB, 0xB0E0E6, 0x778899, 0x708090, 0x2F4F4F, 0x4682B4, 0x5F9EA0, 0x20B2AA, 0x48D1CC, 0x00CED1];
        const residentialVibrant = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFFC93C, 0xFF9FF3, 0x54A0FF, 0x5F27CD, 0x00D2D3, 0xFF9500, 0xFF4500, 0x32CD32];
        
        // Entertainment and lifestyle buildings - NEON ENHANCED
        const entertainmentNeon = [0xFF0080, 0x00FF80, 0x8000FF, 0xFF8000, 0x0080FF, 0xFF4080, 0x40FF80, 0x8040FF, 0xFF8040, 0x4080FF, 0xFF0040, 0x00FF40];
        const shoppingLuxury = [0xFFD700, 0xFFA500, 0xFF8C00, 0xDAA520, 0xB8860B, 0xF0E68C, 0xEEE8AA, 0xBDB76B, 0x9ACD32, 0x556B2F, 0xFFE4B5, 0xDEB887];
        
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
        
        // REALISTIC GROUND SYSTEM - No blue ground, varied terrain for each building type
        this.sharedMaterials.set('ground-base', new THREE.MeshBasicMaterial({ color: 0x228B22 })); // Base forest green
        
        // Natural ground types
        this.sharedMaterials.set('grass', new THREE.MeshBasicMaterial({ color: 0x228B22 })); // Natural grass
        this.sharedMaterials.set('grass-dark', new THREE.MeshBasicMaterial({ color: 0x006400 })); // Dark green grass
        this.sharedMaterials.set('grass-light', new THREE.MeshBasicMaterial({ color: 0x9ACD32 })); // Light grass
        this.sharedMaterials.set('grass-emerald', new THREE.MeshBasicMaterial({ color: 0x50C878 })); // Emerald grass
        
        // Elegant ground types
        this.sharedMaterials.set('carpet-red', new THREE.MeshBasicMaterial({ color: 0x8B0000 })); // Luxury red carpet
        this.sharedMaterials.set('carpet-blue', new THREE.MeshBasicMaterial({ color: 0x000080 })); // Royal blue carpet
        this.sharedMaterials.set('carpet-purple', new THREE.MeshBasicMaterial({ color: 0x4B0082 })); // Purple carpet
        this.sharedMaterials.set('carpet-gold', new THREE.MeshBasicMaterial({ color: 0xDAA520 })); // Gold carpet
        
        // Natural earth types
        this.sharedMaterials.set('soil-rich', new THREE.MeshBasicMaterial({ color: 0x3C1810 })); // Rich dark soil
        this.sharedMaterials.set('soil-light', new THREE.MeshBasicMaterial({ color: 0x8B4513 })); // Light brown soil
        this.sharedMaterials.set('soil-clay', new THREE.MeshBasicMaterial({ color: 0xA0522D })); // Clay soil
        
        // Modern surfaces
        this.sharedMaterials.set('glass-clear', new THREE.MeshBasicMaterial({ 
            color: 0xF0F8FF, transparent: true, opacity: 0.3 
        })); // Glass floor
        this.sharedMaterials.set('marble-white', new THREE.MeshBasicMaterial({ color: 0xF8F8FF })); // White marble
        this.sharedMaterials.set('marble-black', new THREE.MeshBasicMaterial({ color: 0x2F2F2F })); // Black marble
        this.sharedMaterials.set('marble-gray', new THREE.MeshBasicMaterial({ color: 0x708090 })); // Gray marble
        
        // Wood and natural surfaces
        this.sharedMaterials.set('wood-deck', new THREE.MeshBasicMaterial({ color: 0xD2691E })); // Wood deck
        this.sharedMaterials.set('wood-light', new THREE.MeshBasicMaterial({ color: 0xDEB887 })); // Light wood
        this.sharedMaterials.set('wood-dark', new THREE.MeshBasicMaterial({ color: 0x8B4513 })); // Dark wood
        
        // Stone and concrete
        this.sharedMaterials.set('concrete-light', new THREE.MeshBasicMaterial({ color: 0xD3D3D3 })); // Light concrete
        this.sharedMaterials.set('concrete-dark', new THREE.MeshBasicMaterial({ color: 0x696969 })); // Dark concrete
        this.sharedMaterials.set('blockstones-gray', new THREE.MeshBasicMaterial({ color: 0x778899 })); // Gray stone blocks
        this.sharedMaterials.set('blockstones-white', new THREE.MeshBasicMaterial({ color: 0xF5F5F5 })); // White stone blocks
        
        // Colorful tiles and patterns
        this.sharedMaterials.set('tile-red', new THREE.MeshBasicMaterial({ color: 0xDC143C })); // Red tiles
        this.sharedMaterials.set('tile-blue', new THREE.MeshBasicMaterial({ color: 0x4169E1 })); // Blue tiles
        this.sharedMaterials.set('tile-green', new THREE.MeshBasicMaterial({ color: 0x32CD32 })); // Green tiles
        this.sharedMaterials.set('tile-yellow', new THREE.MeshBasicMaterial({ color: 0xFFD700 })); // Yellow tiles
        this.sharedMaterials.set('tile-orange', new THREE.MeshBasicMaterial({ color: 0xFF8C00 })); // Orange tiles
        this.sharedMaterials.set('tile-purple', new THREE.MeshBasicMaterial({ color: 0x8A2BE2 })); // Purple tiles
        
        // Special surfaces
        this.sharedMaterials.set('sand', new THREE.MeshBasicMaterial({ color: 0xF4A460 })); // Sandy ground
        this.sharedMaterials.set('gravel', new THREE.MeshBasicMaterial({ color: 0x808080 })); // Gravel
        this.sharedMaterials.set('water-surface', new THREE.MeshBasicMaterial({ 
            color: 0x006994, transparent: true, opacity: 0.7 
        })); // Water surface
        this.sharedMaterials.set('glass-tinted', new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, transparent: true, opacity: 0.4 
        })); // Tinted glass
        
        // Stone and concrete
        this.sharedMaterials.set('blockstones-gray', new THREE.MeshBasicMaterial({ color: 0x708090 })); // Gray stones
        this.sharedMaterials.set('blockstones-white', new THREE.MeshBasicMaterial({ color: 0xF5F5F5 })); // White stones
        this.sharedMaterials.set('blockstones-dark', new THREE.MeshBasicMaterial({ color: 0x2F4F4F })); // Dark stones
        this.sharedMaterials.set('concrete-light', new THREE.MeshBasicMaterial({ color: 0xD3D3D3 })); // Light concrete
        this.sharedMaterials.set('concrete-dark', new THREE.MeshBasicMaterial({ color: 0x696969 })); // Dark concrete
        
        // Water surfaces
        this.sharedMaterials.set('water-clear', new THREE.MeshBasicMaterial({ 
            color: 0x006994, transparent: true, opacity: 0.7 
        })); // Clear water
        this.sharedMaterials.set('water-deep', new THREE.MeshBasicMaterial({ 
            color: 0x003366, transparent: true, opacity: 0.8 
        })); // Deep water
        
        // Specialized surfaces
        this.sharedMaterials.set('marble-white', new THREE.MeshBasicMaterial({ color: 0xFFFACD })); // White marble
        this.sharedMaterials.set('marble-black', new THREE.MeshBasicMaterial({ color: 0x36454F })); // Black marble
        this.sharedMaterials.set('wood-deck', new THREE.MeshBasicMaterial({ color: 0xD2691E })); // Wood decking
        
        // Urban surfaces
        this.sharedMaterials.set('road', new THREE.MeshBasicMaterial({ color: 0x2F2F2F }));
        this.sharedMaterials.set('sidewalk', new THREE.MeshBasicMaterial({ color: 0xC0C0C0 }));
        this.sharedMaterials.set('parking-lot', new THREE.MeshBasicMaterial({ color: 0x404040 }));
        
        // Water and pool materials
        this.sharedMaterials.set('water', new THREE.MeshBasicMaterial({ 
            color: 0x006994, transparent: true, opacity: 0.8 
        }));
        this.sharedMaterials.set('poolTile', new THREE.MeshBasicMaterial({ color: 0x87CEEB }));
        
        // Urban elements
        this.sharedMaterials.set('billboard', new THREE.MeshBasicMaterial({ color: 0xFF4444 }));
        this.sharedMaterials.set('tree', new THREE.MeshBasicMaterial({ color: 0x228B22 }));
        this.sharedMaterials.set('treeTrunk', new THREE.MeshBasicMaterial({ color: 0x8B4513 }));
        this.sharedMaterials.set('car', new THREE.MeshBasicMaterial({ color: 0xF44336 }));
        
        // Glass materials for different building types
        this.sharedMaterials.set('glassBlue', new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, transparent: true, opacity: 0.6 
        }));
        this.sharedMaterials.set('glassGreen', new THREE.MeshBasicMaterial({ 
            color: 0x90EE90, transparent: true, opacity: 0.6 
        }));
        this.sharedMaterials.set('glassGray', new THREE.MeshBasicMaterial({ 
            color: 0xD3D3D3, transparent: true, opacity: 0.7 
        }));
        
        // Store MASSIVE building palette system with thousands of unique designs
        this.buildingPalettes = {
            // Corporate/Office Buildings
            'corporate-glass': corporateGlass,
            'corporate-cement': corporateCement,
            'corporate-blocks': corporateBlocks,
            'corporate-legacy': corporateLegacy,
            'corporate-creative': corporateCreative,
            'tech-modern': techModern,
            'tech-startup': techStartup,
            'office-tower': corporateGlass,
            'office-modern': techModern,
            
            // Creative & Artistic Buildings
            'creative-modern': creativeModern,
            'creative-legacy': creativeLegacy,
            'creative-eclectic': creativeEclectic,
            'creative-artistic': creativeArtistic,
            'creative-bohemian': creativeBohemian,
            'art-gallery': creativeArtistic,
            'design-studio': creativeEclectic,
            
            // Residential Buildings
            'residential-luxury': residentialLuxury,
            'residential-modern': residentialModern,
            'residential-vibrant': residentialVibrant,
            'apartment-luxury': residentialLuxury,
            'apartment-modern': residentialModern,
            'condo-tower': residentialVibrant,
            
            // Entertainment & Lifestyle
            'entertainment-venue': entertainmentNeon,
            'shopping-center': shoppingLuxury,
            'nightclub': entertainmentNeon,
            'bar-restaurant': creativeArtistic,
            
            // Special Buildings (expanded)
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
        
        // Create materials for each building type and color
        Object.entries(this.buildingPalettes).forEach(([type, colors]) => {
            colors.forEach((color, i) => {
                this.sharedMaterials.set(`${type}-${i}`, new THREE.MeshBasicMaterial({ color }));
            });
        });
        
        // Enhanced roof materials with stunning variety
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
        console.log(`🎮 Initializing CityofGits...`);
        
        // Check if canvas exists
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found! Make sure gameCanvas exists in the HTML.');
        }
        
        // Create scene 
        this.scene = new THREE.Scene();
        // Note: Fog will be cleared in createSkyDome for crystal clear visibility
        
        // Camera setup with improved precision for movement stability
        this.camera = new THREE.PerspectiveCamera(
            this.isLowMemory ? 60 : 75, // Better FOV for city viewing
            window.innerWidth / window.innerHeight, 
            1, // Increased near plane for better precision
            this.isLowMemory ? 8000 : 15000 // Extended view distance for massive elements
        );
        this.camera.position.set(800, 300, 1800); // Positioned to view tower and logo in open area
        this.camera.lookAt(800, 400, 800); // Look towards the tower and logo area
        this.camera.matrixAutoUpdate = true; // Ensure matrix updates for smooth movement
        
        // ULTRA-OPTIMIZED RENDERER with edge noise reduction and movement stability
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: !this.isLowMemory, // Enable antialiasing on higher-end devices for smooth edges
            powerPreference: "low-power",
            alpha: false,
            stencil: false,
            preserveDrawingBuffer: false,
            precision: this.isLowMemory ? "mediump" : "highp", // Better precision for movement stability
            logarithmicDepthBuffer: true // Improved depth precision to reduce glitching
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isLowMemory ? 1 : 1.5)); // Reduced for stability
        this.renderer.shadowMap.enabled = false; // No shadows for performance
        this.renderer.physicallyCorrectLights = false;
        this.renderer.outputEncoding = THREE.LinearEncoding;
        this.renderer.sortObjects = true; // Enable for better depth sorting
        this.renderer.autoClear = true;
        this.renderer.autoClearColor = true;
        this.renderer.autoClearDepth = true;
        this.renderer.autoClearStencil = true;
        
        // Load minimal world data
        await this.loadWorldData();
        
        // Create minimal world base
        this.createSky();
        this.createMinimalTerrain();
        
        // Create massive mountain range around city borders
        this.createMountainRange();
        
        // Fill any remaining empty ground areas
        if (!this.ultraLowEnd) {
            this.fillEmptyGroundAreas();
        }
        
        // Add CityofGits logo watermarks on ground
        this.createLogoWatermarks();
        
        // Load and display ground memes and building names
        this.loadGroundTextsAndBuildingNames();
        
        this.createBasicLighting();
        
        // Create the iconic Lotus Tower in the center of the city
        this.createLotusTag();
        
        // Add spectacular statues and varied towers throughout the city
        this.createCityLandmarks();
        
        // DO NOT create the underground city until needed
        // Only create subway entrances - they will teleport to underground when needed
        this.createSubwayEntranceGrid();
        
        // DYNAMIC LOADING SYSTEM - Load content as player explores
        this.initializeDynamicLoading();
        
        // Load initial area around player
        this.loadInitialArea();
        
        // Only add aircraft on higher-end systems
        if (!this.isLowMemory) {
            this.createAircraft();
        }
        
        this.setupEventListeners();
        this._setupSubwayKeyListener();
        
        // Force garbage collection to free memory after initialization
        if (window.gc) {
            window.gc();
        } else if (window.collectGarbage) {
            window.collectGarbage();
        }
        
        console.log('🎮 World with DYNAMIC MEGA CITY initialized successfully! UNDERGROUND WILL BE CREATED ONLY WHEN NEEDED.');
        
        // Show performance mode indicator
        this.showPerformanceModeIndicator();
    }
    
    showPerformanceModeIndicator() {
        // Indicator removed as requested
        
        // Show accessibility tips for ultra-low-end users
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
            
            // Limit houses on low-memory systems
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
        // Beautiful blue sky with clouds, sun, and rockets!
        this.renderer.setClearColor(0x87CEEB); // Beautiful sky blue background
        
        // Create sky dome for better visual effect
        if (!this.ultraLowEnd) {
            this.createSkyDome();
            this.createClouds();
            this.createSun();
            this.createFlyingRockets();
        }
        
        console.log('✅ Beautiful sky created with clouds, sun and rockets!');
    }

    createSkyDome() {
        // Create CRYSTAL CLEAR gradient sky dome - no fog!
        const skyGeometry = new THREE.SphereGeometry(8000, 32, 16);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB, // Beautiful clear sky blue
            side: THREE.BackSide,
            fog: false // NO FOG for crystal clear sky
        });
        
        const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(skyDome);
        
        // Disable any fog in the scene for crystal clear visibility
        this.scene.fog = null;
    }

    createClouds() {
        // Create MANY fluffy white clouds optimized for low-end devices
        const cloudCount = this.ultraLowEnd ? 20 : (this.isLowMemory ? 35 : 60);
        
        for (let i = 0; i < cloudCount; i++) {
            const cloud = this.createSingleCloud();
            
            // Position clouds randomly across the CLEAR sky
            cloud.position.set(
                (Math.random() - 0.5) * 12000, // Wider spread
                400 + Math.random() * 800, // Height range 400-1200 (below rockets)
                (Math.random() - 0.5) * 12000  // Wider spread
            );
            
            // Random scale for variety
            const scale = 0.4 + Math.random() * 1.2;
            cloud.scale.set(scale, scale, scale);
            
            // Slow rotation for natural movement
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
        
        // Create optimized clouds using fewer but better positioned spheres
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
        // Create VERY VISIBLE bright sun in clear position
        const sunGeometry = new THREE.SphereGeometry(200, 20, 20);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFF00,
            emissive: 0xFFFF00,
            emissiveIntensity: 1.5 // Super bright
        });
        
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(3000, 2500, 2000); // Raised from 1500 to 2500
        
        // Add VERY INTENSE sun glow effect for maximum visibility
        if (!this.isLowMemory) {
            const glowGeometry = new THREE.SphereGeometry(350, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFF88,
                transparent: true,
                opacity: 0.8 // More visible glow
            });
            const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
            sun.add(sunGlow);
            
            // Additional MASSIVE outer glow
            const outerGlowGeometry = new THREE.SphereGeometry(500, 12, 12);
            const outerGlowMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFAA,
                transparent: true,
                opacity: 0.4 // Very visible
            });
            const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
            sun.add(outerGlow);
            
            // Sun rays effect
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
        // Create awesome MASSIVE black rockets flying high above buildings!
        const rocketCount = this.isLowMemory ? 5 : 12;
        this.rockets = [];
        
        for (let i = 0; i < rocketCount; i++) {
            const rocket = this.createSingleRocket();
            
            // Random starting position HIGH in sky - SUN LEVEL!
            rocket.position.set(
                (Math.random() - 0.5) * 8000,
                8000 + Math.random() * 2000, // SUN LEVEL - 8000-10000 height (extremely high like sun)
                (Math.random() - 0.5) * 8000
            );
            
            // Consistent flight direction and speed - all rockets fly in same direction
            rocket.userData.velocity = new THREE.Vector3(
                2, // Consistent eastward movement
                0, // No vertical movement
                1  // Slight northward movement
            );
            
            // Consistent rocket orientation - pointing in flight direction
            rocket.rotation.set(
                0, // Level flight
                Math.atan2(1, 2), // Point in direction of travel
                0  // No roll
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
        
        // MASSIVE rocket body (5000m long x 500m wide) - 100x bigger main cylinder
        const bodyGeometry = new THREE.CylinderGeometry(250, 250, 5000, 16);
        const body = new THREE.Mesh(bodyGeometry, blackMaterial);
        rocketGroup.add(body);
        
        // Large rocket nose cone (pointed) - 100x bigger
        const noseGeometry = new THREE.ConeGeometry(250, 800, 12);
        const nose = new THREE.Mesh(noseGeometry, blackMaterial);
        nose.position.y = 2900; // 100x bigger positioning
        rocketGroup.add(nose);
        
        // Rocket command module (top section) - 100x bigger
        const commandGeometry = new THREE.CylinderGeometry(200, 200, 800, 12);
        const command = new THREE.Mesh(commandGeometry, grayMaterial);
        command.position.y = 1700; // 100x bigger positioning
        rocketGroup.add(command);
        
        // Larger rocket fins (4 fins for stability) - 100x bigger
        for (let i = 0; i < 4; i++) {
            const finGeometry = new THREE.BoxGeometry(100, 1200, 600);
            const fin = new THREE.Mesh(finGeometry, blackMaterial);
            fin.position.y = -1900; // 100x bigger positioning
            fin.rotation.y = (i * Math.PI * 2) / 4;
            fin.position.x = 350; // 100x bigger positioning
            rocketGroup.add(fin);
        }
        
        // Multiple rocket windows/details along the body - 100x bigger
        const windowGeometry = new THREE.SphereGeometry(40, 8, 8); // 100x bigger windows
        
        // Top windows - 100x bigger positioning
        for (let i = 0; i < 3; i++) {
            const window = new THREE.Mesh(windowGeometry, whiteMaterial);
            window.position.set(0, 1500 - i * 400, 260); // 100x bigger positioning
            rocketGroup.add(window);
        }
        
        // Side windows - 100x bigger positioning
        for (let i = 0; i < 4; i++) {
            const window = new THREE.Mesh(windowGeometry, whiteMaterial);
            window.position.set(260, 800 - i * 500, 0); // 100x bigger positioning
            rocketGroup.add(window);
            
            const window2 = new THREE.Mesh(windowGeometry, whiteMaterial);
            window2.position.set(-260, 800 - i * 500, 0); // 100x bigger positioning
            rocketGroup.add(window2);
        }
        
        // Rocket stripes for style - 100x bigger
        for (let i = 0; i < 3; i++) {
            const stripeGeometry = new THREE.RingGeometry(240, 260, 16); // 100x bigger stripes
            const stripe = new THREE.Mesh(stripeGeometry, redMaterial);
            stripe.position.y = 500 - i * 1000; // 100x bigger positioning
            stripe.rotation.x = Math.PI / 2;
            rocketGroup.add(stripe);
        }
        
        // MASSIVE rocket exhaust trail with multiple nozzles - 100x bigger
        if (!this.isLowMemory) {
            // Main exhaust - 100x bigger
            const exhaustGeometry = new THREE.ConeGeometry(300, 1500, 8);
            const exhaustMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xFF4500,
                transparent: true,
                opacity: 0.9
            });
            const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
            exhaust.position.y = -3200; // 100x bigger positioning
            exhaust.rotation.x = Math.PI;
            rocketGroup.add(exhaust);
            
            // Side thrusters - 100x bigger
            for (let i = 0; i < 4; i++) {
                const thrusterGeometry = new THREE.ConeGeometry(80, 600, 6);
                const thruster = new THREE.Mesh(thrusterGeometry, exhaustMaterial);
                thruster.position.y = -2800; // 100x bigger positioning
                thruster.rotation.x = Math.PI;
                thruster.rotation.y = (i * Math.PI * 2) / 4;
                thruster.position.x = 150; // 100x bigger positioning
                rocketGroup.add(thruster);
            }
        }
        
        return rocketGroup;
    }

    createMinimalTerrain() {
        // Create COMPLETE ground coverage - NO BLUE AREAS AT ALL!
        const groundGeometry = this.sharedGeometries.get('ground');
        
        // MASSIVE base terrain - covers everything
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Forest green
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        
        if (!this.isLowMemory) {
            ground.receiveShadow = true;
        }
        this.scene.add(ground);
        
        // ADDITIONAL MASSIVE GROUND PLANES to ensure no blue shows through - EXPANDED COVERAGE
        for (let layer = 0; layer < 5; layer++) {
            const size = this.chunkSize * 4; // Much larger coverage
            const additionalGround = new THREE.Mesh(
                new THREE.PlaneGeometry(size, size),
                new THREE.MeshLambertMaterial({ color: 0x228B22 })
            );
            additionalGround.rotation.x = -Math.PI / 2;
            additionalGround.position.set(0, 0.01 + layer * 0.01, 0);
            this.scene.add(additionalGround);
        }
        
        // MEGA COVERAGE - Create massive ground base to eliminate ALL blue areas
        const megaGround = new THREE.Mesh(
            new THREE.PlaneGeometry(50000, 50000), // Massive coverage
            new THREE.MeshLambertMaterial({ color: 0x228B22 })
        );
        megaGround.rotation.x = -Math.PI / 2;
        megaGround.position.set(0, -0.1, 0); // Slightly below other ground
        this.scene.add(megaGround);
        
        // Fill entire area with varied ground types in main area, green grass for far areas - NO GAPS!
        if (!this.ultraLowEnd) {
            // Create grid-based ground coverage with performance optimization
            const gridSize = 500; // Size of each ground patch
            const halfChunk = this.chunkSize / 2;
            const mainAreaRadius = 1500; // Radius for varied ground types
            
            for (let x = -halfChunk; x < halfChunk; x += gridSize) {
                for (let z = -halfChunk; z < halfChunk; z += gridSize) {
                    // Calculate distance from origin to determine ground type
                    const distanceFromOrigin = Math.sqrt(x * x + z * z);
                    
                    let groundType;
                    let patchMaterial;
                    
                    if (distanceFromOrigin <= mainAreaRadius) {
                        // Main area - use varied ground types for visual interest
                        const groundTypes = [
                            'grass', 'grass-dark', 'grass-light', 'grass-emerald',
                            'concrete-light', 'concrete-dark', 'tile-green', 'tile-blue',
                            'soil-rich', 'soil-light', 'sand', 'gravel'
                        ];
                        groundType = groundTypes[Math.floor(Math.random() * groundTypes.length)];
                        patchMaterial = this.sharedMaterials.get(groundType);
                    } else {
                        // Far areas - default to green grass for consistent natural look
                        patchMaterial = this.sharedMaterials.get('grass'); // Natural green grass
                    }
                    
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
        
        console.log('✅ Complete ground coverage created - varied grounds in main area, green grass for far areas!');
    }

    createMountainRange() {
        // Create massive mountain range around city borders like Mountain View, CA
        // Performance optimized - only on higher-end devices
        if (this.ultraLowEnd) {
            console.log('⚡ Mountain range skipped for ultra-low-end performance');
            return;
        }

        console.log('🏔️ Creating massive mountain range around city borders...');

        // Mountain ring configuration - positioned at city borders
        const mountainDistance = 12000; // Distance from city center
        const mountainConfigs = [
            // North mountains
            {x: 0, z: -mountainDistance, width: 8000, height: 3000, depth: 2000},
            {x: -4000, z: -mountainDistance, width: 6000, height: 2500, depth: 1800},
            {x: 4000, z: -mountainDistance, width: 6000, height: 2800, depth: 1800},
            
            // South mountains  
            {x: 0, z: mountainDistance, width: 8000, height: 3200, depth: 2000},
            {x: -4000, z: mountainDistance, width: 6000, height: 2700, depth: 1800},
            {x: 4000, z: mountainDistance, width: 6000, height: 2900, depth: 1800},
            
            // East mountains
            {x: mountainDistance, z: 0, width: 2000, height: 3500, depth: 8000},
            {x: mountainDistance, z: -4000, width: 1800, height: 2800, depth: 6000},
            {x: mountainDistance, z: 4000, width: 1800, height: 3000, depth: 6000},
            
            // West mountains
            {x: -mountainDistance, z: 0, width: 2000, height: 3300, depth: 8000},
            {x: -mountainDistance, z: -4000, width: 1800, height: 2600, depth: 6000},
            {x: -mountainDistance, z: 4000, width: 1800, height: 2900, depth: 6000},
            
            // Corner mountains for complete coverage
            {x: -mountainDistance*0.7, z: -mountainDistance*0.7, width: 4000, height: 2200, depth: 4000},
            {x: mountainDistance*0.7, z: -mountainDistance*0.7, width: 4000, height: 2400, depth: 4000},
            {x: -mountainDistance*0.7, z: mountainDistance*0.7, width: 4000, height: 2300, depth: 4000},
            {x: mountainDistance*0.7, z: mountainDistance*0.7, width: 4000, height: 2500, depth: 4000}
        ];

        mountainConfigs.forEach((config, index) => {
            this.createSingleMountain(config.x, config.z, config.width, config.height, config.depth, index);
        });

        console.log('✅ Massive mountain range created around city borders!');
    }

    createSingleMountain(x, z, width, height, depth, index) {
        // Create a single mountain with optimized geometry
        const mountainGroup = new THREE.Group();
        
        // Mountain colors - realistic earthy tones
        const mountainColors = [
            0x8B7355, // Brown
            0x696969, // Dark gray
            0x556B2F, // Dark olive green
            0x2F4F4F, // Dark slate gray
            0x8B4513, // Saddle brown
            0x6B8E23  // Olive drab
        ];
        
        const color = mountainColors[index % mountainColors.length];
        const mountainMaterial = new THREE.MeshBasicMaterial({ color: color });
        
        // Create main mountain body - optimized geometry
        const segments = this.isLowMemory ? 6 : 12; // Fewer segments on low-end
        const mountainGeometry = new THREE.ConeGeometry(
            width / 2,    // Base radius
            height,       // Height
            segments,     // Radial segments
            1            // Height segments - minimal for performance
        );
        
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        mountain.position.set(x, height / 2, z);
        mountain.scale.z = depth / width; // Stretch for depth variation
        
        // Add subtle rotation for natural look
        mountain.rotation.y = Math.random() * Math.PI * 2;
        
        mountainGroup.add(mountain);
        
        // Add smaller peaks only on higher-end devices
        if (!this.isLowMemory && Math.random() > 0.5) {
            const peakHeight = height * 0.3;
            const peakGeometry = new THREE.ConeGeometry(width * 0.2, peakHeight, 6, 1);
            const peak = new THREE.Mesh(peakGeometry, mountainMaterial);
            peak.position.set(
                x + (Math.random() - 0.5) * width * 0.5,
                height * 0.7 + peakHeight / 2,
                z + (Math.random() - 0.5) * depth * 0.5
            );
            mountainGroup.add(peak);
        }
        
        this.scene.add(mountainGroup);
    }

    fillEmptyGroundAreas() {
        // Fill any remaining empty/blue areas with ground coverage
        // Create additional ground patches to eliminate all blue gaps
        const patchSize = 1000;
        const coverage = 25000; // Large coverage area
        
        for (let x = -coverage; x < coverage; x += patchSize) {
            for (let z = -coverage; z < coverage; z += patchSize) {
                // Skip if too close to existing buildings/city center
                const distanceFromCenter = Math.sqrt(x * x + z * z);
                if (distanceFromCenter < 2000) continue; // Skip main city area
                
                // Create ground patch
                const groundPatch = new THREE.Mesh(
                    new THREE.PlaneGeometry(patchSize * 1.2, patchSize * 1.2), // Overlap for no gaps
                    this.sharedMaterials.get('grass') // Default to grass
                );
                groundPatch.rotation.x = -Math.PI / 2;
                groundPatch.position.set(
                    x + Math.random() * 100,
                    0.01,
                    z + Math.random() * 100
                );
                
                this.scene.add(groundPatch);
            }
        }
    }

    createLogoWatermarks() {
        // Add CityofGits logo watermarks on ground in different areas with 40% opacity
        // Only create on higher-end devices to preserve performance
        if (this.isLowMemory) {
            console.log('⚡ Logo watermarks skipped for performance on low-end device');
            return;
        }

        console.log('🎨 Creating CityofGits logo watermarks...');

        // Define logo watermark positions across the city
        const watermarkPositions = [
            {x: 0, z: 0, logo: 'cityofgits-lg-4000x1010.png', size: 400},
            {x: -800, z: -800, logo: 'cityofgits-white-lg-4000x1010.png', size: 300},
            {x: 800, z: -800, logo: 'cityofgits-summercap-lg-4000x1010.png', size: 350},
            {x: -800, z: 800, logo: 'cityofgits-summercap-dark-lg-4000x1010.png', size: 320},
            {x: 1200, z: 1200, logo: 'cityofgits-lg-4000x1010.png', size: 250},
            {x: -1200, z: 1200, logo: 'cityofgits-white-lg-4000x1010.png', size: 280},
            {x: 600, z: -1400, logo: 'cityofgits-summercap-lg-4000x1010.png', size: 200},
            {x: -600, z: 1400, logo: 'cityofgits-summercap-dark-lg-4000x1010.png', size: 220}
        ];

        console.log(`📍 Creating ${watermarkPositions.length} logo watermarks...`);

        watermarkPositions.forEach((pos, index) => {
            console.log(`Creating watermark ${index + 1}: ${pos.logo} at (${pos.x}, ${pos.z})`);
            this.createSingleLogoWatermark(pos.x, pos.z, pos.logo, pos.size);
        });

        console.log('✅ CityofGits logo watermarks creation initiated!');
    }

    createSingleLogoWatermark(x, z, logoFile, size) {
        // Create a textured plane with the logo
        const loader = new THREE.TextureLoader();
        
        loader.load(`./assets/static/${logoFile}`, (texture) => {
            console.log(`✅ Logo loaded successfully: ${logoFile}`);
            
            // Configure texture for optimal appearance
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            // Create material with 40% opacity - more visible
            const logoMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 0.4,
                alphaTest: 0.05, // Lower threshold for better transparency
                side: THREE.DoubleSide,
                depthWrite: false // Prevent depth conflicts
            });
            
            // Create plane geometry for the watermark (logo aspect ratio 4000x1010)
            const logoGeometry = new THREE.PlaneGeometry(size, size * 0.25);
            const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
            
            // Position higher above ground to ensure visibility
            logoMesh.rotation.x = -Math.PI / 2;
            logoMesh.position.set(x, 2.0, z); // Raised from 0.5 to 2.0
            
            // Add subtle random rotation for variety
            logoMesh.rotation.z = (Math.random() - 0.5) * 0.3;
            
            this.scene.add(logoMesh);
            console.log(`✅ Logo watermark created at (${x}, 2.0, ${z}) with size ${size}`);
            
        }, undefined, (error) => {
            console.warn(`❌ Logo ${logoFile} failed to load:`, error);
            this.createTextFallbackWatermark(x, z, size);
        });
    }

    createTextFallbackWatermark(x, z, size) {
        // Fallback: Create simple "CityofGits" text watermark
        console.log(`Creating text fallback watermark at (${x}, ${z})`);
        
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // Clear canvas with transparent background
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Create text with better visibility
        context.fillStyle = '#ffffff';
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        
        // Draw text with outline for better visibility
        context.strokeText('CityofGits', canvas.width / 2, canvas.height / 2 + 16);
        context.fillText('CityofGits', canvas.width / 2, canvas.height / 2 + 16);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.4,
            alphaTest: 0.05,
            depthWrite: false
        });
        
        const geometry = new THREE.PlaneGeometry(size * 0.8, size * 0.2);
        const mesh = new THREE.Mesh(geometry, material);
        
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 2.0, z); // Same height as logo watermarks
        mesh.rotation.z = (Math.random() - 0.5) * 0.3;
        
        this.scene.add(mesh);
        console.log(`✅ Text fallback watermark created at (${x}, 2.0, ${z})`);
    }

    async loadGroundTextsAndBuildingNames() {
        // Load memes and create ground texts + building names
        // Performance optimized - only on higher-end devices
        if (this.ultraLowEnd) {
            console.log('⚡ Ground texts and building names skipped for ultra-low-end performance');
            return;
        }

        try {
            // Load memes
            const memesResponse = await fetch('./groundtexts/memes.json');
            const memesData = await memesResponse.json();
            this.memes = memesData.memes;

            // Create ground meme texts
            this.createGroundMemeTexts();

            // Create building names using world data
            this.createBuildingNames();

            console.log('✅ Ground texts and building names loaded successfully!');
        } catch (error) {
            console.warn('❌ Failed to load ground texts:', error);
        }
    }

    createGroundMemeTexts() {
        // Create random meme texts scattered across the ground
        const textColors = [
            '#FF6B6B', // Red
            '#4ECDC4', // Teal
            '#45B7D1', // Blue
            '#96CEB4', // Green
            '#FFEAA7', // Yellow
            '#DDA0DD'  // Plum
        ];

        // Create 20 random meme texts scattered around the city
        const memePositions = [];
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = 1000 + Math.random() * 2000;
            const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 500;
            const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 500;
            
            // Avoid placing too close to Lotus Tower area
            if (Math.abs(x - 800) < 300 && Math.abs(z - 800) < 300) continue;
            
            memePositions.push({x, z});
        }

        // Create memes on building walls instead of ground
        this.createMemesOnBuildingWalls(textColors);

        // Set up random meme rotation every 10 seconds
        if (!this.isLowMemory) {
            this.memeRotationInterval = setInterval(() => {
                this.updateRandomMemeTexts(textColors);
            }, 10000);
        }
    }

    createBuildingNames() {
        // Create building names and creator names for each building in world data
        if (!this.worldData || !this.worldData.houses) return;

        Object.entries(this.worldData.houses).forEach(([houseId, houseData]) => {
            const buildingName = houseData.developer || houseData.github || 'Unknown Building';
            const creatorName = houseData.github || houseData.developer || 'Anonymous';
            
            // Get building dimensions and position
            const buildingX = houseData.position.x;
            const buildingZ = houseData.position.z;
            const buildingLength = parseFloat(houseData['building-length'] || 300);
            const buildingWidth = parseFloat(houseData['building-width'] || 250);
            const buildingHeight = parseFloat(houseData['building-height'] || 180);
            
            // Position text on the front wall of the building
            const wallX = buildingX;
            const wallY = buildingHeight * 0.7; // Upper part of the building
            const wallZ = buildingZ + (buildingLength / 2) + 2; // Just in front of the wall
            
            // Create building name (larger, attached to wall)
            this.createBuildingWallText(wallX, wallY, wallZ, buildingName, '#000000', 35, 0); // No rotation for front wall
            
            // Create creator name (smaller, below building name on the wall)
            this.createBuildingWallText(wallX, wallY - 40, wallZ, creatorName, '#555555', 20, 0); // Darker gray, smaller
        });
    }

    createMemesOnBuildingWalls(textColors) {
        // Create memes on building walls
        if (!this.worldData || !this.worldData.houses) return;

        const buildingEntries = Object.entries(this.worldData.houses);
        
        // Create 3-5 memes per building on different walls
        buildingEntries.forEach(([houseId, houseData]) => {
            const buildingX = houseData.position.x;
            const buildingZ = houseData.position.z;
            const buildingLength = parseFloat(houseData['building-length'] || 300);
            const buildingWidth = parseFloat(houseData['building-width'] || 250);
            const buildingHeight = parseFloat(houseData['building-height'] || 180);
            
            // Create 3-5 memes per building on different walls
            const memesPerBuilding = 3 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < memesPerBuilding; i++) {
                const randomMeme = this.memes[Math.floor(Math.random() * this.memes.length)];
                const randomColor = textColors[Math.floor(Math.random() * textColors.length)];
                
                // Choose random wall (front, back, left, right)
                const wallType = Math.floor(Math.random() * 4);
                let wallX, wallY, wallZ, rotation;
                
                switch (wallType) {
                    case 0: // Front wall
                        wallX = buildingX + (Math.random() - 0.5) * buildingWidth * 0.8;
                        wallY = buildingHeight * 0.3 + Math.random() * buildingHeight * 0.4;
                        wallZ = buildingZ + (buildingLength / 2) + 2;
                        rotation = 0;
                        break;
                    case 1: // Back wall
                        wallX = buildingX + (Math.random() - 0.5) * buildingWidth * 0.8;
                        wallY = buildingHeight * 0.3 + Math.random() * buildingHeight * 0.4;
                        wallZ = buildingZ - (buildingLength / 2) - 2;
                        rotation = Math.PI;
                        break;
                    case 2: // Left wall
                        wallX = buildingX - (buildingWidth / 2) - 2;
                        wallY = buildingHeight * 0.3 + Math.random() * buildingHeight * 0.4;
                        wallZ = buildingZ + (Math.random() - 0.5) * buildingLength * 0.8;
                        rotation = Math.PI / 2;
                        break;
                    case 3: // Right wall
                        wallX = buildingX + (buildingWidth / 2) + 2;
                        wallY = buildingHeight * 0.3 + Math.random() * buildingHeight * 0.4;
                        wallZ = buildingZ + (Math.random() - 0.5) * buildingLength * 0.8;
                        rotation = -Math.PI / 2;
                        break;
                }
                
                // Create wall meme
                this.createWallMeme(wallX, wallY, wallZ, randomMeme, randomColor, 40, rotation);
            }
        });

        // Set up random meme rotation every 10 seconds
        if (!this.isLowMemory) {
            this.memeRotationInterval = setInterval(() => {
                this.updateRandomWallMemes(textColors);
            }, 10000);
        }
    }

    createWallMeme(x, y, z, text, color, fontSize, rotation) {
        // Create meme text on building wall
        const canvas = document.createElement('canvas');
        const textLength = text.length;
        canvas.width = Math.max(600, textLength * 20);
        canvas.height = 120;
        const context = canvas.getContext('2d');
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up text styling
        context.fillStyle = color;
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = `bold ${fontSize}px 'CityOfGitsFont', 'Arial Black', Arial, sans-serif`;
        
        // Draw text with black outline for better visibility on walls
        context.strokeText(text, canvas.width / 2, canvas.height / 2);
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide
        });
        
        // Create geometry and mesh
        const geometry = new THREE.PlaneGeometry(canvas.width / 4, canvas.height / 4);
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position and rotate for wall placement
        mesh.position.set(x, y, z);
        mesh.rotation.y = rotation;
        
        mesh.userData = { isWallMeme: true };
        this.scene.add(mesh);
    }

    updateRandomWallMemes(textColors) {
        // Update random wall memes every 10 seconds
        const wallMemes = this.scene.children.filter(child => 
            child.userData && child.userData.isWallMeme
        );
        
        // Update 5-10 random memes
        const updateCount = Math.min(wallMemes.length, 5 + Math.floor(Math.random() * 6));
        const indicesToUpdate = [];
        
        while (indicesToUpdate.length < updateCount) {
            const randomIndex = Math.floor(Math.random() * wallMemes.length);
            if (!indicesToUpdate.includes(randomIndex)) {
                indicesToUpdate.push(randomIndex);
            }
        }
        
        indicesToUpdate.forEach(index => {
            const mesh = wallMemes[index];
            const newMeme = this.memes[Math.floor(Math.random() * this.memes.length)];
            const newColor = textColors[Math.floor(Math.random() * textColors.length)];
            
            // Update the text texture
            this.updateWallMemeText(mesh, newMeme, newColor, 40);
        });
    }

    updateWallMemeText(mesh, newText, newColor, fontSize) {
        // Update wall meme texture with new text
        const canvas = document.createElement('canvas');
        const textLength = newText.length;
        canvas.width = Math.max(600, textLength * 20);
        canvas.height = 120;
        const context = canvas.getContext('2d');
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up text styling
        context.fillStyle = newColor;
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = `bold ${fontSize}px 'CityOfGitsFont', 'Arial Black', Arial, sans-serif`;
        
        // Draw text with black outline
        context.strokeText(newText, canvas.width / 2, canvas.height / 2);
        context.fillText(newText, canvas.width / 2, canvas.height / 2);
        
        // Update texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        // Update mesh material
        mesh.material.map.dispose();
        mesh.material.map = texture;
        mesh.material.needsUpdate = true;
        
        // Update geometry size if needed
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(canvas.width / 4, canvas.height / 4);
    }

    createGroundText(x, z, text, color, fontSize) {
        // Create text on ground with custom font
        const canvas = document.createElement('canvas');
        const textLength = text.length;
        canvas.width = Math.max(1024, textLength * 30);
        canvas.height = 200;
        const context = canvas.getContext('2d');
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up text styling
        context.fillStyle = color;
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = `bold ${fontSize}px 'CityOfGitsFont', 'Arial Black', Arial, sans-serif`;
        
        // Draw text
        context.strokeText(text, canvas.width / 2, canvas.height / 2);
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        // Create geometry and mesh
        const geometry = new THREE.PlaneGeometry(canvas.width / 2, canvas.height / 2);
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position on ground
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x, 1, z);
        mesh.rotation.z = (Math.random() - 0.5) * 0.5; // Slight random rotation
        
        mesh.userData = { isGroundMeme: true, originalText: text, color: color };
        this.scene.add(mesh);
    }

    createBuildingWallText(x, z, text, color, fontSize, height) {
        // Create text for building walls (vertical)
        const canvas = document.createElement('canvas');
        const textLength = text.length;
        canvas.width = Math.max(800, textLength * 25);
        canvas.height = 150;
        const context = canvas.getContext('2d');
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up text styling - always black for building names
        context.fillStyle = color;
        context.strokeStyle = '#FFFFFF';
        context.lineWidth = 1;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = `bold ${fontSize}px 'CityOfGitsFont', 'Arial Black', Arial, sans-serif`;
        
        // Draw text
        context.strokeText(text, canvas.width / 2, canvas.height / 2);
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide
        });
        
        // Create geometry and mesh
        const geometry = new THREE.PlaneGeometry(canvas.width / 3, canvas.height / 3);
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position as vertical sign in front of building
        mesh.position.set(x, height, z);
        
        mesh.userData = { isBuildingName: true };
        this.scene.add(mesh);
    }

    updateRandomMemeTexts(textColors) {
        // Update random wall memes every 10 seconds (delegate to wall meme method)
        this.updateRandomWallMemes(textColors);
    }

    updateMeshText(mesh, newText, newColor, fontSize) {
        // Update mesh texture with new text
        const canvas = document.createElement('canvas');
        const textLength = newText.length;
        canvas.width = Math.max(1024, textLength * 30);
        canvas.height = 200;
        const context = canvas.getContext('2d');
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = newColor;
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = `bold ${fontSize}px 'CityOfGitsFont', 'Arial Black', Arial, sans-serif`;
        
        context.strokeText(newText, canvas.width / 2, canvas.height / 2);
        context.fillText(newText, canvas.width / 2, canvas.height / 2);
        
        // Update texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        mesh.material.map = texture;
        mesh.material.needsUpdate = true;
        mesh.userData.originalText = newText;
        mesh.userData.color = newColor;
        
        // Update geometry if text length changed significantly
        const newGeometry = new THREE.PlaneGeometry(canvas.width / 2, canvas.height / 2);
        mesh.geometry.dispose();
        mesh.geometry = newGeometry;
    }

    createBasicLighting() {
        // SMART PERFORMANCE-AWARE LIGHTING SYSTEM
        
        if (this.ultraLowEnd) {
            // Ultra-low-end: Single ambient light only (maximum performance)
            const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
            this.scene.add(ambientLight);
            console.log('✅ Ultra-basic lighting created (ultra-low-end mode)');
            return;
        }
        
        if (this.isLowMemory) {
            // Low-end: Ambient + single directional light (good performance + some realism)
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Softer ambient
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(50, 100, 50);
            
            // NO SHADOWS on low-end to preserve performance
            this.scene.add(ambientLight);
            this.scene.add(directionalLight);
            console.log('✅ Performance-optimized lighting created (low-end mode)');
            return;
        }
        
        // HIGH-END: Full realistic lighting with smart shadows
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4); // Realistic ambient
        
        // Main sun light - RAISED TO HIGHER POSITION
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(100, 500, 100); // Raised from 200 to 500
        directionalLight.castShadow = true; // Enable shadows on high-end
        
        // SMART SHADOW OPTIMIZATION for performance
        directionalLight.shadow.mapSize.width = 2048; // Medium quality shadows
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        
        // Warm fill light for realism
        const fillLight = new THREE.DirectionalLight(0xffaa88, 0.3);
        fillLight.position.set(-50, 50, -50);
        
        this.scene.add(ambientLight);
        this.scene.add(directionalLight);
        this.scene.add(fillLight);
        
        // Enable shadows in renderer (only for high-end)
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

        // Determine building type from data or default - ensure it's always a string
        let buildingType = houseData.buildingType || this.determineBuildingType(houseData);
        
        // Safety check: ensure buildingType is a string
        if (typeof buildingType !== 'string') {
            console.warn(`Invalid buildingType for ${houseId}:`, buildingType, 'defaulting to office');
            buildingType = 'office';
        }
        
        const floors = houseData.floors || 1;
        
        // Use advanced building system
        const building = this.createAdvancedBuilding(buildingType, floors);
        
        // Position the building
        building.position.set(
            houseData.position?.x || 0,
            houseData.position?.y || 0,
            houseData.position?.z || 0
        );
        
        // Store metadata
        building.userData = { houseId, houseData, buildingType };
        
        return building;
    }

    determineBuildingType(houseData) {
        // Enhanced building type determination with thousands of possibilities
        const style = houseData.style || 'modern';
        const random = Math.random();
        
        switch (style) {
            case 'modern':
                // Mix of modern styles
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
                // Random selection for maximum variety
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
        
        // Get building specifications with enhanced variety
        const specs = this.getBuildingSpecs(buildingType);
        const width = specs.width + (Math.random() - 0.5) * specs.widthVariation;
        const depth = specs.depth + (Math.random() - 0.5) * specs.depthVariation;
        const totalHeight = floors * specs.floorHeight;
        
        // Add realistic ground for this building type
        this.addRealisticBuildingGround(buildingGroup, buildingType, width, depth);
        
        // Get appropriate material with performance-aware enhancements
        const materialKey = this.getBuildingMaterial(buildingType);
        const buildingMaterial = this.getEnhancedMaterial(materialKey, buildingType);
        
        // Create advanced building architecture based on style
        this.createBuildingArchitecture(buildingGroup, specs.style, width, totalHeight, depth, buildingMaterial);
        
        // Add realistic building details based on performance level
        if (!this.ultraLowEnd) {
            this.addRealisticBuildingDetails(buildingGroup, buildingType, width, totalHeight, depth, floors);
        }
        
        // Add windows with architectural style
        this.addBuildingWindows(buildingGroup, buildingType, width, totalHeight, depth, floors);
        
        // Add varied roofs based on building type
        this.addBuildingRoof(buildingGroup, buildingType, width, totalHeight, depth);
        
        // Add enhanced signage/nameplate with beautiful typography
        this.addBuildingSignage(buildingGroup, buildingType, width, totalHeight);
        
        // Add enhanced rooftop features for vibrant city look (performance-aware)
        if (!this.isLowMemory && Math.random() > 0.6) {
            this.addEnhancedRooftopFeatures(buildingGroup, buildingType, width, totalHeight, depth);
        }
        
        // Enable shadows for building meshes (only on high-end devices)
        if (!this.isLowMemory) {
            this.enableBuildingShadows(buildingGroup);
        }
        
        return buildingGroup;
    }

    getEnhancedMaterial(materialKey, buildingType) {
        // Performance-aware material enhancement
        const baseMaterial = this.sharedMaterials.get(materialKey);
        
        // Safety check: ensure buildingType is a string
        if (typeof buildingType !== 'string') {
            console.warn('Invalid buildingType in getEnhancedMaterial:', buildingType, 'using default');
            buildingType = 'office';
        }
        
        if (this.ultraLowEnd) {
            // Ultra-low-end: Use basic materials as-is
            return baseMaterial;
        }
        
        if (this.isLowMemory) {
            // Low-end: Use basic materials but with better colors
            return baseMaterial;
        }
        
        // High-end: Create enhanced materials with realistic properties
        const materialColor = baseMaterial.color.getHex();
        
        // Create enhanced material based on building type
        if (buildingType.includes('glass') || buildingType.includes('tech')) {
            // Glass buildings get reflection-like properties
            return new THREE.MeshLambertMaterial({
                color: materialColor,
                transparent: Math.random() > 0.7,
                opacity: Math.random() > 0.7 ? 0.8 : 1.0
            });
        } else if (buildingType.includes('metal') || buildingType.includes('corporate')) {
            // Metal/corporate buildings get slight metallic look
            return new THREE.MeshLambertMaterial({
                color: materialColor,
                emissive: new THREE.Color(materialColor).multiplyScalar(0.05)
            });
        } else {
            // Standard buildings get Lambert shading for better shadows
            return new THREE.MeshLambertMaterial({
                color: materialColor
            });
        }
    }

    enableBuildingShadows(buildingGroup) {
        // Enable shadow casting and receiving for building meshes (high-end only)
        buildingGroup.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    addRealisticBuildingDetails(buildingGroup, buildingType, width, height, depth, floors) {
        // Add performance-aware realistic details
        
        if (this.ultraLowEnd) return; // Skip entirely on ultra-low-end
        
        // Safety check: ensure buildingType is a string
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        
        // Add entrance details
        if (Math.random() > 0.7) {
            this.addBuildingEntrance(buildingGroup, buildingType, width, depth);
        }
        
        // Add balconies for residential buildings (limited on low-end)
        if (buildingType.includes('residential') && (!this.isLowMemory || Math.random() > 0.8)) {
            this.addBuildingBalconies(buildingGroup, width, height, depth, floors);
        }
        
        // Add architectural details (very limited on low-end)
        if (!this.isLowMemory && Math.random() > 0.6) {
            this.addArchitecturalDetails(buildingGroup, buildingType, width, height, depth);
        }
    }

    addBuildingEntrance(buildingGroup, buildingType, width, depth) {
        // Safety check: ensure buildingType is a string
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        
        // Simple entrance with door
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
        // Add simple balconies to residential buildings
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
        
        // Add architectural details based on building type
        
        if (buildingType.includes('corporate')) {
            // Add pillars for corporate buildings
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
            // Add artistic elements for creative buildings
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
        
        // Enhanced ground system with much more variety
        let groundType = 'grass';
        
        // Select appropriate ground based on building type
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
            // Default diverse selection for any other building type
            const allGrounds = ['grass', 'grass-light', 'tile-red', 'tile-blue', 'tile-green', 'wood-deck', 'concrete-light', 'sand', 'gravel'];
            groundType = allGrounds[Math.floor(Math.random() * allGrounds.length)];
        }
        
        const groundMaterial = this.sharedMaterials.get(groundType) || this.sharedMaterials.get('grass');
        
        // Create main ground area around building with PROPER HEIGHT to prevent z-fighting
        const groundSize = Math.max(width, depth) * 1.5;
        const groundPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(groundSize, groundSize),
            groundMaterial
        );
        groundPlane.rotation.x = -Math.PI / 2;
        groundPlane.position.y = 2.5; // Elevated above terrain to prevent z-fighting
        buildingGroup.add(groundPlane);
        
        // Add accent ground patches with proper spacing
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
        // Assign appropriate ground type based on building type for realistic look
        const groundMapping = {
            // Corporate buildings get professional surfaces
            'corporate-glass': ['glass-clear', 'marble-white', 'concrete-light'],
            'corporate-cement': ['concrete-light', 'blockstones-gray', 'marble-white'],
            'corporate-blocks': ['blockstones-gray', 'blockstones-white', 'concrete-dark'],
            'corporate-legacy': ['blockstones-dark', 'marble-black', 'wood-deck'],
            'corporate-creative': ['carpet-purple', 'glass-tinted', 'marble-white'],
            
            // Tech buildings get modern surfaces
            'tech-modern': ['glass-clear', 'marble-white', 'concrete-light'],
            'tech-startup': ['wood-deck', 'concrete-light', 'carpet-blue'],
            'office-tower': ['marble-white', 'glass-clear', 'blockstones-white'],
            'office-modern': ['concrete-light', 'marble-white', 'glass-tinted'],
            
            // Creative buildings get artistic surfaces
            'creative-modern': ['carpet-purple', 'wood-deck', 'concrete-light'],
            'creative-legacy': ['wood-deck', 'blockstones-dark', 'carpet-red'],
            'creative-eclectic': ['carpet-purple', 'glass-tinted', 'wood-deck'],
            'creative-artistic': ['carpet-red', 'carpet-purple', 'marble-black'],
            'creative-bohemian': ['wood-deck', 'soil-rich', 'grass-emerald'],
            'art-gallery': ['marble-white', 'carpet-red', 'glass-clear'],
            'design-studio': ['wood-deck', 'carpet-blue', 'concrete-light'],
            
            // Residential buildings get comfortable surfaces
            'residential-luxury': ['marble-white', 'carpet-gold', 'grass-emerald'],
            'residential-modern': ['concrete-light', 'grass', 'wood-deck'],
            'residential-vibrant': ['grass-light', 'carpet-blue', 'wood-deck'],
            'apartment-luxury': ['marble-white', 'carpet-gold', 'glass-clear'],
            'apartment-modern': ['concrete-light', 'grass', 'blockstones-gray'],
            
            // Special buildings get appropriate surfaces
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
        // Safety check: ensure buildingType is a string
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        
        // Get accent ground type for visual variety
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
        // Create varied building shapes based on style
        let mainBuilding;
        
        if (style === 'stepped-blocks' || Math.random() < 0.3) {
            // Create stepped/terraced building for more variety
            this.createSteppedBuilding(buildingGroup, width, height, depth, material);
        } else if (style === 'tech-campus' || Math.random() < 0.2) {
            // Create L-shaped or complex building
            this.createComplexBuilding(buildingGroup, width, height, depth, material);
        } else if (style === 'creative-mixed' || Math.random() < 0.25) {
            // Create cylindrical tower
            const cylinderGeometry = new THREE.CylinderGeometry(width * 0.4, width * 0.6, height, 16);
            mainBuilding = new THREE.Mesh(cylinderGeometry, material);
            mainBuilding.position.y = height / 2;
            buildingGroup.add(mainBuilding);
        } else {
            // Standard rectangular building with variations
            const mainGeometry = new THREE.BoxGeometry(width, height, depth);
            mainBuilding = new THREE.Mesh(mainGeometry, material);
            mainBuilding.position.y = height / 2;
            buildingGroup.add(mainBuilding);
            
            // Add random architectural wings/extensions
            if (Math.random() < 0.4) {
                this.addBuildingWings(buildingGroup, width, height, depth, material);
            }
        }
        
        // Add advanced architectural features
        if (!this.ultraLowEnd) {
            this.addArchitecturalFeatures(buildingGroup, style, width, height, depth, material);
        }
    }
    
    createSteppedBuilding(buildingGroup, width, height, depth, material) {
        // Create terraced/stepped building design
        const steps = Math.floor(height / 60) + 2; // Number of steps
        
        for (let i = 0; i < steps; i++) {
            const stepHeight = height / steps;
            const stepWidth = width * (1 - i * 0.15); // Each step gets smaller
            const stepDepth = depth * (1 - i * 0.15);
            
            const stepGeometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
            const step = new THREE.Mesh(stepGeometry, material);
            step.position.y = (i * stepHeight) + (stepHeight / 2);
            buildingGroup.add(step);
        }
    }
    
    createComplexBuilding(buildingGroup, width, height, depth, material) {
        // Create L-shaped or T-shaped building
        const shapes = ['L', 'T', 'U'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        if (shape === 'L') {
            // Main section
            const main = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.6, height, depth * 0.6),
                material
            );
            main.position.set(-width * 0.2, height / 2, -depth * 0.2);
            buildingGroup.add(main);
            
            // Wing section
            const wing = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.8, height * 0.7, depth * 0.4),
                material
            );
            wing.position.set(width * 0.1, height * 0.35, depth * 0.3);
            buildingGroup.add(wing);
        } else if (shape === 'T') {
            // Horizontal bar
            const bar = new THREE.Mesh(
                new THREE.BoxGeometry(width, height * 0.6, depth * 0.4),
                material
            );
            bar.position.set(0, height * 0.3, depth * 0.3);
            buildingGroup.add(bar);
            
            // Vertical section
            const vertical = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.4, height, depth * 0.6),
                material
            );
            vertical.position.set(0, height / 2, -depth * 0.2);
            buildingGroup.add(vertical);
        } else { // U shape
            // Left wing
            const leftWing = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.3, height, depth),
                material
            );
            leftWing.position.set(-width * 0.35, height / 2, 0);
            buildingGroup.add(leftWing);
            
            // Right wing
            const rightWing = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.3, height, depth),
                material
            );
            rightWing.position.set(width * 0.35, height / 2, 0);
            buildingGroup.add(rightWing);
            
            // Connecting section
            const connector = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.7, height * 0.8, depth * 0.3),
                material
            );
            connector.position.set(0, height * 0.4, depth * 0.35);
            buildingGroup.add(connector);
        }
    }
    
    addBuildingWings(buildingGroup, width, height, depth, material) {
        // Add architectural wings/extensions to standard buildings
        const wingCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < wingCount; i++) {
            const wingWidth = width * (0.3 + Math.random() * 0.4);
            const wingHeight = height * (0.4 + Math.random() * 0.4);
            const wingDepth = depth * (0.2 + Math.random() * 0.3);
            
            const wingGeometry = new THREE.BoxGeometry(wingWidth, wingHeight, wingDepth);
            const wing = new THREE.Mesh(wingGeometry, material);
            
            // Random wing position
            const side = Math.floor(Math.random() * 4);
            switch (side) {
                case 0: // Front
                    wing.position.set(
                        (Math.random() - 0.5) * width * 0.6,
                        wingHeight / 2,
                        depth / 2 + wingDepth / 2
                    );
                    break;
                case 1: // Back
                    wing.position.set(
                        (Math.random() - 0.5) * width * 0.6,
                        wingHeight / 2,
                        -depth / 2 - wingDepth / 2
                    );
                    break;
                case 2: // Left
                    wing.position.set(
                        -width / 2 - wingWidth / 2,
                        wingHeight / 2,
                        (Math.random() - 0.5) * depth * 0.6
                    );
                    break;
                case 3: // Right
                    wing.position.set(
                        width / 2 + wingWidth / 2,
                        wingHeight / 2,
                        (Math.random() - 0.5) * depth * 0.6
                    );
                    break;
            }
            
            buildingGroup.add(wing);
        }
    }

    addArchitecturalFeatures(buildingGroup, style, width, height, depth, material) {
        // Add balconies for tall buildings
        if (height > 60 && Math.random() > 0.4) {
            this.addModernBalconies(buildingGroup, width, height, depth);
        }
        
        // Add rooftop structures
        if (Math.random() > 0.5) {
            this.addRooftopFeatures(buildingGroup, width, height, depth);
        }
        
        // Add styled entrance
        this.addBuildingEntrance(buildingGroup, width, depth);
        
        // Add car parking area
        if (Math.random() > 0.6 && !this.isLowMemory) {
            this.addParkingArea(buildingGroup, width, depth);
        }
        
        // Add connecting bridges for tall buildings
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
                // Balcony platform
                const balconyGeometry = new THREE.BoxGeometry(width * 0.7, 2, 10);
                const balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
                balcony.position.set(0, floorY, depth / 2 + 5);
                buildingGroup.add(balcony);
                
                // Glass railing
                const railingGeometry = new THREE.BoxGeometry(width * 0.7, 8, 1);
                const railing = new THREE.Mesh(railingGeometry, glassMaterial);
                railing.position.set(0, floorY + 5, depth / 2 + 9);
                buildingGroup.add(railing);
            }
        }
    }

    addRooftopFeatures(buildingGroup, width, height, depth) {
        const rooftopMaterial = this.sharedMaterials.get('concrete-dark');
        
        // AC units
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
        
        // Rooftop garden
        if (Math.random() > 0.6) {
            const gardenGeometry = new THREE.BoxGeometry(width * 0.3, 2, depth * 0.3);
            const gardenMaterial = this.sharedMaterials.get('grass');
            const garden = new THREE.Mesh(gardenGeometry, gardenMaterial);
            garden.position.set(0, height + 1, 0);
            buildingGroup.add(garden);
        }
        
        // Antenna
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
        
        // Parking lot
        const lotGeometry = new THREE.BoxGeometry(width * 1.1, 1, depth * 0.7);
        const parkingLot = new THREE.Mesh(lotGeometry, parkingMaterial);
        parkingLot.position.set(width * 0.7, 0.5, 0);
        buildingGroup.add(parkingLot);
        
        // Parking lines
        const lineMaterial = this.sharedMaterials.get('tile-yellow');
        for (let i = 0; i < 3; i++) {
            const lineGeometry = new THREE.BoxGeometry(1.5, 0.1, depth * 0.5);
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            line.position.set(width * 0.6 + i * 6, 1.1, 0);
            buildingGroup.add(line);
        }
        
        // Add cars
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
        
        // Bridge structure
        const bridgeGeometry = new THREE.BoxGeometry(6, 5, 30);
        const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridge.position.set(width / 2 + 15, height * 0.6, 0);
        buildingGroup.add(bridge);
        
        // Bridge support
        const supportGeometry = new THREE.CylinderGeometry(1, 1, height * 0.6);
        const support = new THREE.Mesh(supportGeometry, bridgeMaterial);
        support.position.set(width / 2 + 15, height * 0.3, 0);
        buildingGroup.add(support);
        
        // Bridge windows
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
        // Green garden area on building steps like in reference image
        const gardenSize = Math.min(stepWidth, stepDepth) * 0.6;
        const garden = new THREE.Mesh(
            new THREE.PlaneGeometry(gardenSize, gardenSize),
            new THREE.MeshBasicMaterial({ color: 0x4CAF50 })
        );
        garden.rotation.x = -Math.PI / 2;
        garden.position.set(0, stepHeight + 1, 0);
        buildingGroup.add(garden);
        
        // Add small colorful trees and plants
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
        
        // Add colorful flower patches
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
            // Corporate & Office Buildings - NYC/Silicon Valley style
            'corporate-glass': { width: 300, depth: 200, floorHeight: 40, widthVariation: 200, depthVariation: 100, style: 'glass-curtain' },
            'corporate-cement': { width: 250, depth: 180, floorHeight: 35, widthVariation: 150, depthVariation: 80, style: 'concrete-modern' },
            'corporate-blocks': { width: 200, depth: 200, floorHeight: 30, widthVariation: 100, depthVariation: 100, style: 'stepped-blocks' },
            'corporate-legacy': { width: 180, depth: 150, floorHeight: 45, widthVariation: 80, depthVariation: 60, style: 'classic-stone' },
            'corporate-creative': { width: 220, depth: 160, floorHeight: 38, widthVariation: 120, depthVariation: 80, style: 'creative-mixed' },
            'tech-modern': { width: 400, depth: 300, floorHeight: 45, widthVariation: 150, depthVariation: 100, style: 'tech-campus', signage: 'TECH HQ' },
            'tech-startup': { width: 150, depth: 120, floorHeight: 32, widthVariation: 80, depthVariation: 60, style: 'startup-loft', signage: 'STARTUP' },
            'office-tower': { width: 350, depth: 250, floorHeight: 42, widthVariation: 100, depthVariation: 80, style: 'office-tower' },
            'office-modern': { width: 280, depth: 200, floorHeight: 38, widthVariation: 120, depthVariation: 90, style: 'modern-office' },
            
            // Creative & Artistic Buildings  
            'creative-modern': { width: 160, depth: 140, floorHeight: 35, widthVariation: 60, depthVariation: 40, style: 'modern-creative' },
            'creative-legacy': { width: 140, depth: 120, floorHeight: 30, widthVariation: 40, depthVariation: 30, style: 'brick-legacy' },
            'creative-eclectic': { width: 180, depth: 150, floorHeight: 32, widthVariation: 80, depthVariation: 60, style: 'eclectic-mix' },
            'creative-artistic': { width: 200, depth: 180, floorHeight: 40, widthVariation: 100, depthVariation: 80, style: 'artistic-facade' },
            'creative-bohemian': { width: 120, depth: 100, floorHeight: 28, widthVariation: 60, depthVariation: 40, style: 'bohemian-loft' },
            'art-gallery': { width: 250, depth: 200, floorHeight: 50, widthVariation: 80, depthVariation: 60, style: 'gallery-space', signage: '🎨 ART GALLERY' },
            'design-studio': { width: 180, depth: 160, floorHeight: 35, widthVariation: 70, depthVariation: 50, style: 'design-loft', signage: '✏️ DESIGN STUDIO' },
            
            // Residential Buildings
            'residential-luxury': { width: 250, depth: 200, floorHeight: 40, widthVariation: 100, depthVariation: 80, style: 'luxury-facade' },
            'residential-modern': { width: 180, depth: 150, floorHeight: 32, widthVariation: 80, depthVariation: 60, style: 'modern-residential' },
            'residential-vibrant': { width: 160, depth: 140, floorHeight: 30, widthVariation: 70, depthVariation: 50, style: 'colorful-residential' },
            'apartment-luxury': { width: 300, depth: 250, floorHeight: 35, widthVariation: 120, depthVariation: 100, style: 'luxury-apartment' },
            'apartment-modern': { width: 220, depth: 180, floorHeight: 32, widthVariation: 90, depthVariation: 70, style: 'modern-apartment' },
            'condo-tower': { width: 200, depth: 200, floorHeight: 38, widthVariation: 80, depthVariation: 80, style: 'condo-high-rise' },
            
            // Entertainment & Lifestyle
            'entertainment-venue': { width: 300, depth: 250, floorHeight: 45, widthVariation: 100, depthVariation: 80, style: 'entertainment-complex', signage: '🎪 ENTERTAINMENT' },
            'shopping-center': { width: 400, depth: 300, floorHeight: 35, widthVariation: 150, depthVariation: 100, style: 'shopping-mall', signage: '🛍️ SHOPPING CENTER' },
            'nightclub': { width: 180, depth: 150, floorHeight: 25, widthVariation: 80, depthVariation: 60, style: 'nightclub-neon', signage: '🌃 NIGHTCLUB' },
            'bar-restaurant': { width: 140, depth: 120, floorHeight: 28, widthVariation: 60, depthVariation: 50, style: 'bar-casual', signage: '🍻 BAR & GRILL' },
            
            // Special Buildings (expanded with more variety)
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
            // Use SUPER vibrant default colors for maximum visual appeal - NO WHITE BUILDINGS!
            const vibrantColors = [
                0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFFA726, 0x9C27B0, 0x66BB6A, 0xEF5350,
                0xFF5722, 0xE91E63, 0x9C27B0, 0x673AB7, 0x3F51B5, 0x2196F3, 0x03A9F4, 0x00BCD4,
                0x009688, 0x4CAF50, 0x8BC34A, 0xCDDC39, 0xFFEB3B, 0xFFC107, 0xFF9800, 0xFF5722,
                0x795548, 0x607D8B, 0xFF1744, 0xF50057, 0xE040FB, 0x7C4DFF, 0x536DFE, 0x448AFF,
                0x40C4FF, 0x18FFFF, 0x64FFDA, 0x69F0AE, 0xB2FF59, 0xEEFF41, 0xFFFF00, 0xFFD600,
                0xFFAB00, 0xFF6D00, 0xDD2C00, 0x3E2723, 0x263238, 0x37474F, 0x455A64, 0x546E7A
            ];
            const color = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
            return new THREE.MeshBasicMaterial({ color: color });
        }
        
        // Always use colorful materials from the palette - avoid white/gray selections
        let selectedColors = palette.filter(color => 
            color !== 0xFFFFFF && color !== 0xF8F8FF && color !== 0xF0F8FF && 
            color !== 0xF5F5F5 && color !== 0xFAFAFA && color !== 0xE6E6FA &&
            color !== 0xFFF8DC && color !== 0xFFFAF0 && color !== 0xF0FFF0 && color !== 0xF5FFFA
        );
        
        // If all colors were white/gray, use the vibrant defaults
        if (selectedColors.length === 0) {
            const vibrantColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFFA726, 0x9C27B0, 0x66BB6A, 0xEF5350];
            const color = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
            return new THREE.MeshBasicMaterial({ color: color });
        }
        
        const color = selectedColors[Math.floor(Math.random() * selectedColors.length)];
        return new THREE.MeshBasicMaterial({ color: color });
    }

    addBuildingWindows(buildingGroup, buildingType, width, height, depth, floors) {
        if (this.ultraLowEnd) return; // Skip windows on ultra-low-end
        
        // Safety check: ensure buildingType is a string
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        
        // Choose advanced glass type based on building type with more variety
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
        
        // Enhanced window patterns based on building type
        if (buildingType.includes('glass') || buildingType.includes('tech')) {
            // Full glass curtain wall system
            const frontGlass = new THREE.Mesh(
                new THREE.PlaneGeometry(width * 0.95, height * 0.9),
                glassMaterial
            );
            frontGlass.position.set(0, height * 0.1, depth / 2 + 1);
            buildingGroup.add(frontGlass);
            
            // Side glass walls for tech buildings
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
            // Enhanced standard windows per floor with variety
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
                    
                    // Varied window sizes and positions for realistic look
                    const windowWidth = 18 + Math.random() * 20;
                    const windowHeight = 22 + Math.random() * 18;
                    
                    window.scale.set(windowWidth, windowHeight, 1);
                    
                    // Add window frames for realism
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
        // Safety check: ensure buildingType is a string
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        
        // Enhanced roof system with much more variety
        let roofMaterial, roofHeight, roofStyle;
        
        // Determine roof based on building type and style
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
            // Varied residential roofs
            const roofTypes = ['roofRed', 'roofBrown', 'roofGray'];
            roofMaterial = this.sharedMaterials.get(roofTypes[Math.floor(Math.random() * roofTypes.length)]);
            roofHeight = 30 + Math.random() * 20;
            roofStyle = 'residential';
        } else {
            roofMaterial = this.sharedMaterials.get('roofModern');
            roofHeight = 15; // Flat roof
            roofStyle = 'flat';
        }
        
        // Create roof based on style
        const roof = new THREE.Mesh(
            this.sharedGeometries.get('house'),
            roofMaterial
        );
        
        if (roofStyle === 'creative') {
            // Creative angled roof
            roof.scale.set(width + 10, roofHeight, depth + 10);
            roof.rotation.z = (Math.random() - 0.5) * 0.2; // Slight angle for creativity
        } else if (roofStyle === 'sloped') {
            // Traditional sloped roof
            roof.scale.set(width + 8, roofHeight, depth + 8);
        } else {
            // Standard flat roof
            roof.scale.set(width + 5, roofHeight, depth + 5);
        }
        
        roof.position.y = height + roofHeight/2;
        buildingGroup.add(roof);
        
        // Add rooftop elements for variety
        this.addRooftopElements(buildingGroup, buildingType, width, height, depth);
    }

    addRooftopElements(buildingGroup, buildingType, width, height, depth) {
        if (this.ultraLowEnd) return; // Skip on ultra-low-end
        
        // Add antennas, air conditioning, or other rooftop structures
        if (Math.random() > 0.5) {
            // Antenna or spire
            const antenna = new THREE.Mesh(
                new THREE.CylinderGeometry(2, 2, 30 + Math.random() * 40, 8),
                new THREE.MeshBasicMaterial({ color: 0x757575 })
            );
            antenna.position.set(0, height + 35, 0);
            buildingGroup.add(antenna);
        }
        
        // Add rooftop equipment for realistic look
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
        // Add vibrant rooftop gardens like in the reference image
        if (!this.ultraLowEnd && Math.random() > 0.3) {
            this.addVibrantRooftopGarden(buildingGroup, width, height, depth, buildingType);
        }
        
        // Add colorful rooftop equipment and features
        if (Math.random() > 0.6) {
            this.addColorfulRooftopEquipment(buildingGroup, width, height, depth);
        }
        
        // Add decorative elements for modern look
        if (!this.isLowMemory && Math.random() > 0.7) {
            this.addRooftopDecorations(buildingGroup, width, height, depth, buildingType);
        }
    }

    addVibrantRooftopGarden(buildingGroup, width, height, depth, buildingType) {
        const gardenWidth = width * 0.8;
        const gardenDepth = depth * 0.8;
        
        // Create garden base with varied colors
        const gardenColors = [0x4CAF50, 0x66BB6A, 0x81C784, 0x2E7D32];
        const gardenColor = gardenColors[Math.floor(Math.random() * gardenColors.length)];
        
        const gardenGeometry = new THREE.BoxGeometry(gardenWidth, 4, gardenDepth);
        const gardenMaterial = new THREE.MeshBasicMaterial({ color: gardenColor });
        const garden = new THREE.Mesh(gardenGeometry, gardenMaterial);
        
        garden.position.set(0, height + 2, 0);
        buildingGroup.add(garden);
        
        // Add colorful trees and plants
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
        
        // Add vibrant flower patches like in the reference image
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
        
        // Add small garden paths
        if (!this.isLowMemory) {
            const pathGeometry = new THREE.BoxGeometry(gardenWidth * 0.2, 1, gardenDepth);
            const pathMaterial = new THREE.MeshBasicMaterial({ color: 0xD2B48C });
            const path = new THREE.Mesh(pathGeometry, pathMaterial);
            
            path.position.set(0, height + 4.5, 0);
            buildingGroup.add(path);
        }
    }

    addColorfulRooftopEquipment(buildingGroup, width, height, depth) {
        // Colorful HVAC units and equipment
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
        
        // Add colorful satellite dishes
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
        // Add decorative elements based on building type
        if (buildingType.includes('creative') || buildingType.includes('art')) {
            // Add colorful artistic elements
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
            // Add modern tech elements
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
        // Safety check: ensure buildingType is a string
        if (typeof buildingType !== 'string') {
            buildingType = 'office';
        }
        
        // Enhanced signage system with beautiful variety
        const specs = this.getBuildingSpecs(buildingType);
        let signageColor, signageText, signageStyle;
        
        // Determine signage based on building type with more variety
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
                // Generate varied signage for other buildings
                const colors = [0x2196F3, 0x4CAF50, 0xFF9800, 0x9C27B0, 0xF44336, 0x00BCD4];
                signageColor = colors[Math.floor(Math.random() * colors.length)];
                signageText = buildingType.toUpperCase().replace('-', ' ');
                signageStyle = 'standard';
        }
        
        // Create beautiful 3D nameplate with enhanced design
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
        
        // Add accent lighting or frames for special buildings
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
        
        // Store enhanced info for UI
        nameplate.userData = {
            buildingType: buildingType,
            signageText: signageText,
            signageStyle: signageStyle
        };
        
        this.nameplates.push(nameplate);
    }

    createAircraft() {
        // Minimal aircraft system for higher-end systems only
        if (this.isLowMemory) return;
        
        for (let i = 0; i < this.maxAircraft; i++) {
            this.spawnAircraft();
        }
    }

    spawnAircraft() {
        const aircraftGroup = new THREE.Group();
        
        // Very simple aircraft
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(50, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        aircraftGroup.add(body);

        // Position randomly but close
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
            <h3><i class="bi bi-house-fill"></i> House Information</h3>
            <p><strong><i class="bi bi-person-badge"></i> Developer:</strong> ${houseData.developer}</p>
            <p><strong><i class="bi bi-github"></i> GitHub:</strong> @${houseData.github || 'Unknown'}</p>
            <p><strong><i class="bi bi-rulers"></i> Size:</strong> ${houseData['building-length']}×${houseData['building-width']}×${houseData['building-height']}</p>
        `;
        infoDiv.style.display = 'block';

        setTimeout(() => {
            infoDiv.style.display = 'none';
        }, 5000);
    }

    update() {
        this.frameCount++;
        
        // Update dynamic loading based on player position
        const playerX = this.camera.position.x;
        const playerZ = this.camera.position.z;
        this.updateDynamicLoading(playerX, playerZ);
        
        // Memory cleanup every 3 seconds
        if (this.frameCount % this.memoryCleanupInterval === 0) {
            this.performMemoryCleanup();
        }
        
        // Update aircraft (if any)
        if (this.aircraft.length > 0) {
            this.updateAircraft(0.016); // Assume 60fps
        }
        
        // Subway well proximity check for hint and teleport
        if (!this.isUnderground && this.subwayWells && this.subwayWells.length > 0) {
            let onWell = false;
            let currentWell = null;
            for (const well of this.subwayWells) {
                const distance = Math.sqrt(
                    Math.pow(playerX - well.x, 2) + 
                    Math.pow(playerZ - well.z, 2)
                );
                if (distance < well.radius) {
                    onWell = true;
                    currentWell = well;
                    break;
                }
            }
            if (onWell) {
                if (typeof this.showSubwayHint === 'function') this.showSubwayHint();
                this._subwayWellToEnter = currentWell;
            } else {
                if (typeof this.hideSubwayHint === 'function') this.hideSubwayHint();
                this._subwayWellToEnter = null;
            }
        } else {
            if (typeof this.hideSubwayHint === 'function') this.hideSubwayHint();
            this._subwayWellToEnter = null;
        }
        
        // Check if we need to generate more cave sections when underground
        if (this.isUnderground && this.camera) {
            this.checkCaveGeneration(this.camera.position);
        }
        
        // Update sky elements
        this.updateSkyElements(0.016);
    }

    updateSkyElements(deltaTime) {
        // Update flying rockets
        if (this.rockets && this.rockets.length > 0) {
            this.updateRockets(deltaTime);
        }
        
        // Update clouds (slow drift)
        this.updateClouds(deltaTime);
    }

    updateRockets(deltaTime) {
        for (let rocket of this.rockets) {
            if (!rocket.userData.velocity) continue;
            
            // Move rocket
            rocket.position.add(rocket.userData.velocity.clone().multiplyScalar(deltaTime * 60));
            
            // Add slight rotation for dynamic movement
            rocket.rotation.x += 0.008;
            rocket.rotation.z += 0.004;
            
            // Wrap around world boundaries
            if (rocket.position.x > 5000) rocket.position.x = -5000;
            if (rocket.position.x < -5000) rocket.position.x = 5000;
            if (rocket.position.z > 5000) rocket.position.z = -5000;
            if (rocket.position.z < -5000) rocket.position.z = 5000;
            
            // Keep rockets HIGH above all buildings (buildings are max 300-400 height)
            if (rocket.position.y > 1500) rocket.position.y = 800;
            if (rocket.position.y < 700) rocket.position.y = 1400;
        }
    }

    updateClouds(deltaTime) {
        // Slowly drift all clouds for natural movement in CLEAR sky
        this.scene.traverse((child) => {
            if (child.userData && child.userData.rotationSpeed !== undefined) {
                // Slow cloud drift
                child.position.x += 0.08 * deltaTime * 60; // Slightly slower for realism
                child.rotation.y += child.userData.rotationSpeed;
                
                // Wrap clouds around wider area
                if (child.position.x > 7000) child.position.x = -7000;
            }
        });
    }

    updateAircraft(deltaTime) {
        for (let i = this.aircraft.length - 1; i >= 0; i--) {
            const aircraft = this.aircraft[i];
            
            // Move aircraft
            aircraft.group.position.add(
                aircraft.direction.clone().multiplyScalar(aircraft.speed * deltaTime)
            );
            
            // Remove if too far
            if (aircraft.group.position.length() > 1000) {
                this.scene.remove(aircraft.group);
                this.aircraft.splice(i, 1);
                
                // Spawn new one
                if (this.aircraft.length < this.maxAircraft) {
                    this.spawnAircraft();
                }
            }
        }
    }

    performMemoryCleanup() {
        // Force garbage collection hints
        if (window.gc) {
            window.gc();
        }
        
        // Clean up any unused resources
        this.renderer.info.memory.geometries = 0;
        this.renderer.info.memory.textures = 0;
        
        console.log('🧹 Memory cleanup performed');
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    // Performance monitoring for 4GB systems
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

    // DYNAMIC MEGA CITY LOADING SYSTEM
    initializeDynamicLoading() {
        console.log('🏗️ Initializing dynamic mega city loading system...');
        
        // Define city districts that will be loaded dynamically
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
        
        // Chunk loading system
        this.loadingQueue = [];
        this.loadingInProgress = new Set();
        this.maxConcurrentLoads = this.isLowMemory ? 1 : 2;
        
        console.log('✅ Dynamic loading system ready!');
    }

    loadInitialArea() {
        // Load the area around the player's starting position
        const playerX = this.camera.position.x;
        const playerZ = this.camera.position.z;
        
        this.updateDynamicLoading(playerX, playerZ);
        
        // Also load basic houses from world.json
        this.generateSimpleHouses();
    }

    updateDynamicLoading(playerX, playerZ) {
        const currentChunkX = Math.floor(playerX / this.chunkSize);
        const currentChunkZ = Math.floor(playerZ / this.chunkSize);
        
        // Check if player moved to a new chunk
        if (this.lastPlayerChunk.x !== currentChunkX || this.lastPlayerChunk.z !== currentChunkZ) {
            this.lastPlayerChunk = { x: currentChunkX, z: currentChunkZ };
            
            // Queue chunks for loading around player
            for (let x = currentChunkX - this.renderDistance; x <= currentChunkX + this.renderDistance; x++) {
                for (let z = currentChunkZ - this.renderDistance; z <= currentChunkZ + this.renderDistance; z++) {
                    const chunkKey = `${x},${z}`;
                    
                    if (!this.loadedCityChunks.has(chunkKey) && !this.loadingInProgress.has(chunkKey)) {
                        this.queueChunkForLoading(x, z);
                    }
                }
            }
            
            // Unload distant chunks to save memory
            this.unloadDistantChunks(currentChunkX, currentChunkZ);
        }
        
        // Process loading queue
        this.processLoadingQueue();
    }

    queueChunkForLoading(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Don't load if already queued or loaded
        if (this.loadingInProgress.has(chunkKey) || this.loadedCityChunks.has(chunkKey)) {
            return;
        }
        
        this.loadingQueue.push({ x: chunkX, z: chunkZ, key: chunkKey });
    }

    processLoadingQueue() {
        // Process loading queue with concurrency limit
        while (this.loadingQueue.length > 0 && this.loadingInProgress.size < this.maxConcurrentLoads) {
            const chunk = this.loadingQueue.shift();
            this.loadCityChunk(chunk.x, chunk.z);
        }
    }

    loadCityChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        this.loadingInProgress.add(chunkKey);
        
        // Calculate world position of chunk center
        const worldX = chunkX * this.chunkSize;
        const worldZ = chunkZ * this.chunkSize;
        
        // Check which district this chunk belongs to
        const district = this.getDistrictForPosition(worldX, worldZ);
        
        if (district) {
            console.log(`🏗️ Loading ${district.type} chunk at (${chunkX}, ${chunkZ})`);
            
            // Create city content based on district type
            const chunkContent = this.createCityChunkContent(worldX, worldZ, district);
            
            if (chunkContent && chunkContent.children.length > 0) {
                this.scene.add(chunkContent);
                this.cityChunks.set(chunkKey, chunkContent);
            }
        } else {
            // Create basic terrain/roads for empty areas
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
        
        // Add roads to all chunks
        this.addRoadsToChunk(chunkGroup);
        
        return chunkGroup;
    }

    addSkyscrapersToChunk(chunkGroup, district) {
        // Add 3-5 skyscrapers per chunk
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
        
        // Add urban elements
        this.addUrbanFurniture(chunkGroup);
        
        // Add street lights
        this.addStreetLights(chunkGroup);
        
        // Add some trees for aesthetics
        this.addTrees(chunkGroup, 3, 6);
        
        // Add billboards
        if (Math.random() > 0.5) {
            this.addBillboard(chunkGroup, this.chunkSize * 0.4, this.chunkSize * 0.4);
        }
    }

    addUrbanFurniture(chunkGroup) {
        // Add bus stops
        for (let i = 0; i < 2; i++) {
            const busStop = new THREE.Group();
            
            // Bus stop shelter
            const shelter = new THREE.Mesh(
                this.sharedGeometries.get('house'),
                new THREE.MeshBasicMaterial({ color: 0xE0E0E0, transparent: true, opacity: 0.8 })
            );
            shelter.scale.set(30, 25, 80);
            shelter.position.y = 12;
            busStop.add(shelter);
            
            // Bench
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
        
        // Add mailboxes and fire hydrants
        this.addStreetObjects(chunkGroup);
    }

    addStreetObjects(chunkGroup) {
        // Add mailboxes
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
        
        // Add fire hydrants
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
        
        // Add trash cans
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
        // Enhanced variety of skyscraper types for stunning NYC-style skyline
        const corporateTypes = [
            'corporate-glass', 'corporate-cement', 'corporate-blocks', 'corporate-legacy', 'corporate-creative',
            'tech-modern', 'office-tower', 'office-modern', 'residential-luxury', 'apartment-luxury'
        ];
        const buildingType = corporateTypes[Math.floor(Math.random() * corporateTypes.length)];
        
        // Enhanced tall buildings with more realistic variety
        const floors = this.isLowMemory ? 
            10 + Math.floor(Math.random() * 25) :  // 10-35 floors for low-end
            15 + Math.floor(Math.random() * 45);   // 15-60 floors for high-end
            
        return this.createAdvancedBuilding(buildingType, floors);
    }

    addSkyscraperWindows(buildingGroup, width, height, depth) {
        const glassMaterial = this.sharedMaterials.get('glass');
        
        // Add window strips
        const floors = Math.floor(height / 100);
        for (let floor = 1; floor < floors; floor++) {
            // Front face windows
            const frontWindow = new THREE.Mesh(
                new THREE.PlaneGeometry(width * 0.9, 60),
                glassMaterial
            );
            frontWindow.position.set(0, floor * 100, depth / 2 + 1);
            buildingGroup.add(frontWindow);
            
            // Side windows (50% chance for performance)
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
        // Add antenna/spire
        const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 50, 8),
            new THREE.MeshBasicMaterial({ color: 0x757575 })
        );
        antenna.position.set(0, height + 25, 0);
        buildingGroup.add(antenna);
        
        // Add rooftop structures (air conditioning, etc.)
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
        // Add a few window planes for detail
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
        // Add major tech company buildings
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
        
        // Massive tech building
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
        // Add suburban houses
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
        
        // Add essential services (hospital, school) occasionally
        if (Math.random() > 0.7) {
            // Enhanced service buildings with much more variety
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
        
        // Add swimming pools to residential areas
        if (Math.random() > 0.7) {
            this.addSwimmingPool(chunkGroup);
        }
        
        // Add trees and gardens
        this.addTrees(chunkGroup, 8, 12);
        
        // Add parked cars
        this.addCars(chunkGroup, 3, 5);
    }

    addSwimmingPool(chunkGroup) {
        const poolGroup = new THREE.Group();
        
        // Pool water
        const pool = new THREE.Mesh(
            this.sharedGeometries.get('pool'),
            this.sharedMaterials.get('water')
        );
        pool.position.y = 2;
        poolGroup.add(pool);
        
        // Pool deck/tiles around pool
        const deck = new THREE.Mesh(
            new THREE.CylinderGeometry(70, 70, 2, 8),
            this.sharedMaterials.get('poolTile')
        );
        deck.position.y = 1;
        poolGroup.add(deck);
        
        // Billboard next to pool
        this.addBillboard(poolGroup, 80, 30);
        
        // Position randomly in chunk
        poolGroup.position.set(
            (Math.random() - 0.5) * this.chunkSize * 0.8,
            0,
            (Math.random() - 0.5) * this.chunkSize * 0.8
        );
        
        chunkGroup.add(poolGroup);
    }

    addBillboard(parentGroup, x = 0, z = 0) {
        const billboardGroup = new THREE.Group();
        
        // Billboard sign
        const billboard = new THREE.Mesh(
            this.sharedGeometries.get('billboard'),
            this.sharedMaterials.get('billboard')
        );
        billboard.position.set(x, 40, z);
        billboardGroup.add(billboard);
        
        // Billboard post
        const post = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 80, 8),
            new THREE.MeshBasicMaterial({ color: 0x795548 })
        );
        post.position.set(x, 40, z);
        billboardGroup.add(post);
        
        parentGroup.add(billboardGroup);
    }

    addTrees(chunkGroup, minTrees, maxTrees) {
        // Reduce tree count for ultra-low-end devices
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
            
            // Tree trunk
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(5, 8, 30, 8),
                this.sharedMaterials.get('treeTrunk')
            );
            trunk.position.y = 15;
            treeGroup.add(trunk);
            
            // Tree crown
            const crown = new THREE.Mesh(
                this.sharedGeometries.get('tree'),
                this.sharedMaterials.get('tree')
            );
            crown.position.y = 40;
            treeGroup.add(crown);
            
            // Position randomly
            treeGroup.position.set(
                (Math.random() - 0.5) * this.chunkSize * 0.9,
                0,
                (Math.random() - 0.5) * this.chunkSize * 0.9
            );
            
            chunkGroup.add(treeGroup);
        }
    }

    addCars(chunkGroup, minCars, maxCars) {
        // Reduce car count for low-end devices
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
        // Choose random creative building type for residential variety
        const creativeTypes = ['creative-modern', 'creative-legacy', 'creative-eclectic'];
        const buildingType = creativeTypes[Math.floor(Math.random() * creativeTypes.length)];
        
        // 1-3 story residential buildings
        const floors = 1 + Math.floor(Math.random() * 3);
        
        return this.createAdvancedBuilding(buildingType, floors);
    }

    addSuburbanWindows(houseGroup) {
        const glassMaterial = this.sharedMaterials.get('glass');
        
        // Front windows
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
        // Add main shopping complex with enhanced variety
        const mallType = ['mall', 'shopping-center', 'entertainment-venue'][Math.floor(Math.random() * 3)];
        const mall = this.createAdvancedBuilding(mallType, 2);
        mall.position.set(0, 0, 0);
        chunkGroup.add(mall);
        
        // Add extremely diverse commercial buildings for stunning variety
        const commercialTypes = [
            'restaurant', 'hotel', 'bank', 'cafe', 'cinema', 'gym', 'nightclub', 
            'bar-restaurant', 'art-gallery', 'design-studio', 'office-modern',
            'tech-startup', 'creative-modern', 'entertainment-venue'
        ];
        
        // Spawn 3-6 varied commercial buildings per chunk
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
        
        // Add multiple billboards around commercial area
        this.addBillboard(chunkGroup, this.chunkSize * 0.3, this.chunkSize * 0.3);
        this.addBillboard(chunkGroup, -this.chunkSize * 0.3, this.chunkSize * 0.3);
        this.addBillboard(chunkGroup, 0, -this.chunkSize * 0.3);
        
        // Add parking lot with cars
        this.addCars(chunkGroup, 15, 25);
        
        // Add some trees for aesthetics
        this.addTrees(chunkGroup, 5, 8);
        
        // Add street lights
        this.addStreetLights(chunkGroup);
    }

    addParkToChunk(chunkGroup, district) {
        // Add beautiful green space
        const park = new THREE.Mesh(
            this.sharedGeometries.get('ground'),
            new THREE.MeshBasicMaterial({ color: 0x4CAF50 })
        );
        park.rotation.x = -Math.PI / 2;
        park.position.y = 1;
        chunkGroup.add(park);
        
        // Add lots of trees in park
        this.addTrees(chunkGroup, 20, 30);
        
        // Add park benches
        this.addParkBenches(chunkGroup);
        
        // Add central fountain
        this.addFountain(chunkGroup);
        
        // Add walking paths
        this.addParkPaths(chunkGroup);
    }

    addStreetLights(chunkGroup) {
        const lightCount = this.isLowMemory ? 4 : 8;
        
        for (let i = 0; i < lightCount; i++) {
            const lightGroup = new THREE.Group();
            
            // Light pole
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(2, 2, 60, 8),
                new THREE.MeshBasicMaterial({ color: 0x424242 })
            );
            pole.position.y = 30;
            lightGroup.add(pole);
            
            // Light head
            const light = new THREE.Mesh(
                new THREE.SphereGeometry(5, 8, 6),
                new THREE.MeshBasicMaterial({ color: 0xFFF59D })
            );
            light.position.y = 55;
            lightGroup.add(light);
            
            // Position along roads
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
        
        // Fountain base
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(40, 45, 10, 16),
            new THREE.MeshBasicMaterial({ color: 0xBDBDBD })
        );
        base.position.y = 5;
        fountainGroup.add(base);
        
        // Water
        const water = new THREE.Mesh(
            new THREE.CylinderGeometry(35, 35, 2, 16),
            this.sharedMaterials.get('water')
        );
        water.position.y = 9;
        fountainGroup.add(water);
        
        // Central spire
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
        // Add crossing paths
        const pathMaterial = new THREE.MeshBasicMaterial({ color: 0xA1887F });
        
        // Horizontal path
        const hPath = new THREE.Mesh(
            new THREE.PlaneGeometry(this.chunkSize * 0.8, 30),
            pathMaterial
        );
        hPath.rotation.x = -Math.PI / 2;
        hPath.position.y = 2;
        chunkGroup.add(hPath);
        
        // Vertical path
        const vPath = new THREE.Mesh(
            new THREE.PlaneGeometry(30, this.chunkSize * 0.8),
            pathMaterial
        );
        vPath.rotation.x = -Math.PI / 2;
        vPath.position.y = 2;
        chunkGroup.add(vPath);
    }

    addStadiumToChunk(chunkGroup, district) {
        // Add beautiful stadium
        const stadium = new THREE.Mesh(
            new THREE.CylinderGeometry(400, 450, 100, 16),
            new THREE.MeshBasicMaterial({ color: 0xF5F5F5 })
        );
        stadium.position.y = 50;
        chunkGroup.add(stadium);
        
        // Add stadium roof
        const roof = new THREE.Mesh(
            new THREE.CylinderGeometry(380, 420, 20, 16),
            new THREE.MeshBasicMaterial({ color: 0x2196F3 })
        );
        roof.position.y = 110;
        chunkGroup.add(roof);
        
        // Add field
        const field = new THREE.Mesh(
            new THREE.CylinderGeometry(200, 200, 5, 16),
            new THREE.MeshBasicMaterial({ color: 0x4CAF50 })
        );
        field.position.y = 5;
        chunkGroup.add(field);
        
        // Add parking areas with cars
        this.addCars(chunkGroup, 20, 30);
        
        // Add stadium lights
        this.addStadiumLights(chunkGroup);
    }

    addStadiumLights(chunkGroup) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * 500;
            const z = Math.sin(angle) * 500;
            
            const lightGroup = new THREE.Group();
            
            // Light tower
            const tower = new THREE.Mesh(
                new THREE.CylinderGeometry(5, 8, 80, 8),
                new THREE.MeshBasicMaterial({ color: 0x757575 })
            );
            tower.position.y = 40;
            lightGroup.add(tower);
            
            // Light fixture
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
        // Add beautiful roads with sidewalks - PROPER HEIGHT to prevent z-fighting
        const roadMaterial = this.sharedMaterials.get('road');
        const sidewalkMaterial = this.sharedMaterials.get('sidewalk');
        
        // Main horizontal road - ELEVATED above terrain
        const hRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(this.chunkSize, 120),
            roadMaterial
        );
        hRoad.rotation.x = -Math.PI / 2;
        hRoad.position.y = 3.0; // Well above terrain to prevent z-fighting
        chunkGroup.add(hRoad);
        
        // Horizontal sidewalks - ABOVE roads
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
        
        // Main vertical road - ELEVATED above terrain
        const vRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(120, this.chunkSize),
            roadMaterial
        );
        vRoad.rotation.x = -Math.PI / 2;
        vRoad.position.y = 3.0; // Well above terrain to prevent z-fighting
        chunkGroup.add(vRoad);
        
        // Vertical sidewalks - ABOVE roads
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
        
        // Add road markings
        this.addRoadMarkings(chunkGroup);
        
        // Add crosswalks
        this.addCrosswalks(chunkGroup);
    }

    addRoadMarkings(chunkGroup) {
        const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        
        // Center line for horizontal road
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
        
        // Center line for vertical road
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
        
        // Horizontal crosswalks
        for (let i = 0; i < 6; i++) {
            const stripe = new THREE.Mesh(
                new THREE.PlaneGeometry(10, 120),
                crosswalkMaterial
            );
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(-25 + (i * 10), 2, 0);
            chunkGroup.add(stripe);
        }
        
        // Vertical crosswalks
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
        
        // Just add roads for empty areas
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
    
    createLotusTag() {
        // Create the MASSIVE iconic 1500m tall Lotus Tower in the center of the city
        const lotusGroup = new THREE.Group();
        
        // Tower dimensions (1500m = 1500 units tall - MASSIVE SCALE!)
        const towerHeight = 1500;
        const baseRadius = 140; // Scaled proportionally
        const topRadius = 75;   // Scaled proportionally
        
        // Create tower base (massive lotus petal base)
        const baseGeometry = new THREE.CylinderGeometry(baseRadius * 1.5, baseRadius * 2, 180, 16); // Scaled up
        const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x2E8B57 }); // Sea green
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 90; // Scaled up
        lotusGroup.add(base);
        
        // Create main tower shaft (elegant tapering) - MASSIVE SCALE
        const shaftGeometry = new THREE.CylinderGeometry(topRadius, baseRadius, towerHeight * 0.8, 16);
        const shaftMaterial = new THREE.MeshBasicMaterial({ color: 0xFF69B4 }); // Hot pink (lotus color)
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.y = towerHeight * 0.4 + 180; // Scaled up
        lotusGroup.add(shaft);
        
        // Create lotus bud at the top - MASSIVE SCALE
        const budGeometry = new THREE.SphereGeometry(topRadius + 30, 16, 8); // Scaled up
        const budMaterial = new THREE.MeshBasicMaterial({ color: 0xFF1493 }); // Deep pink
        const bud = new THREE.Mesh(budGeometry, budMaterial);
        bud.position.y = towerHeight * 0.8 + 180 + topRadius + 30; // Scaled up
        lotusGroup.add(bud);
        
        // Create massive lotus petals around the bud
        const petalCount = 8;
        for (let i = 0; i < petalCount; i++) {
            const petalGeometry = new THREE.BoxGeometry(55, 110, 18); // Scaled up massively
            const petalMaterial = new THREE.MeshBasicMaterial({ color: 0xFFB6C1 }); // Light pink
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            
            const angle = (i / petalCount) * Math.PI * 2;
            const petalRadius = topRadius + 75; // Scaled up
            petal.position.set(
                Math.cos(angle) * petalRadius,
                towerHeight * 0.8 + 180 + topRadius,
                Math.sin(angle) * petalRadius
            );
            petal.rotation.y = angle;
            petal.rotation.z = Math.PI / 6; // Slight outward tilt
            lotusGroup.add(petal);
        }
        
        // Create massive decorative rings along the tower shaft
        const ringCount = 6;
        for (let i = 0; i < ringCount; i++) {
            const ringHeight = 270 + (i * (towerHeight * 0.8 - 540) / (ringCount - 1)); // Scaled up
            const ringRadius = baseRadius - (i * (baseRadius - topRadius) / (ringCount - 1));
            
            const ringGeometry = new THREE.TorusGeometry(ringRadius + 18, 9, 8, 16); // Scaled up
            const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x32CD32 }); // Lime green
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.y = ringHeight;
            ring.rotation.x = Math.PI / 2;
            lotusGroup.add(ring);
        }
        
        // Create massive observation deck
        const deckGeometry = new THREE.CylinderGeometry(topRadius + 45, topRadius + 45, 54, 16); // Scaled up
        const deckMaterial = new THREE.MeshBasicMaterial({ color: 0x4169E1 }); // Royal blue
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.y = towerHeight * 0.75 + 180; // Scaled up
        lotusGroup.add(deck);
        
        // Create MASSIVE rotating antenna at the very top
        const antennaGeometry = new THREE.CylinderGeometry(4.5, 4.5, 225, 8); // Scaled up
        const antennaMaterial = new THREE.MeshBasicMaterial({ color: 0x708090 }); // Slate gray
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.y = towerHeight * 0.8 + 180 + topRadius + 60 + 112.5; // Scaled up
        
        // Store reference for rotation animation
        lotusGroup.userData.antenna = antenna;
        
        // Add antenna crossbars for realistic look
        const crossbarGeometry = new THREE.BoxGeometry(45, 4, 4); // Scaled up
        const crossbarMaterial = new THREE.MeshBasicMaterial({ color: 0x708090 });
        
        // Top crossbar
        const crossbar1 = new THREE.Mesh(crossbarGeometry, crossbarMaterial);
        crossbar1.position.y = 90; // Relative to antenna
        antenna.add(crossbar1);
        
        // Bottom crossbar
        const crossbar2 = new THREE.Mesh(crossbarGeometry, crossbarMaterial);
        crossbar2.position.y = -90; // Relative to antenna
        antenna.add(crossbar2);
        
        lotusGroup.add(antenna);
        
        // Create massive base platform/foundation
        const platformGeometry = new THREE.CylinderGeometry(baseRadius * 2.5, baseRadius * 2.5, 27, 16); // Scaled up
        const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x2F4F4F }); // Dark slate gray
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = 13.5; // Scaled up
        lotusGroup.add(platform);
        
        // Position the MASSIVE tower in a clear open area away from buildings
        lotusGroup.position.set(800, 0, 800); // Moved to open area with no building conflicts
        
        // Store reference for animation
        this.lotusGroup = lotusGroup;
        
        // Add shadow support for higher-end devices
        if (!this.isLowMemory) {
            lotusGroup.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }
        
        this.scene.add(lotusGroup);
        
        // Add "nekshavs.tech/cityofgits" text logo on the ground in front of the tower
        this.createWebsiteLogo(800, 800); // Position in front of the tower
        
        console.log('✅ MASSIVE 1500m Lotus Tower with rotating antenna created with website logo!');
    }
    
    createWebsiteLogo(towerX, towerZ) {
        // Create "nekshavs.tech/cityofgits" text logo using custom font - independent text on ground
        const logoGroup = new THREE.Group();
        
        // Position logo in front of the tower (closer to camera)
        const logoX = towerX;
        const logoZ = towerZ + 800; // Much further in front for better visibility
        
        // Load custom font first, then create text
        this.loadCustomFontAndCreateText(logoX, logoZ, logoGroup);
        
        this.scene.add(logoGroup);
        console.log('✅ Enhanced nekshavs.tech/cityofgits logo with custom font loading initiated!');
    }

    loadCustomFontAndCreateText(logoX, logoZ, logoGroup) {
        // Create a style element to load the custom font
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: 'CityOfGitsFont';
                src: url('./assets/static/font.otf') format('opentype');
                font-display: swap;
            }
        `;
        document.head.appendChild(style);

        // Wait for font to load, then create the text
        document.fonts.ready.then(() => {
            this.createTextWithCustomFont(logoX, logoZ, logoGroup);
        }).catch(() => {
            // Fallback to default font if custom font fails
            console.warn('Custom font failed to load, using fallback');
            this.createTextWithFallbackFont(logoX, logoZ, logoGroup);
        });

        // Also create fallback immediately in case font loading takes too long
        setTimeout(() => {
            if (logoGroup.children.length === 0) {
                this.createTextWithCustomFont(logoX, logoZ, logoGroup);
            }
        }, 2000);
    }

    createTextWithCustomFont(logoX, logoZ, logoGroup) {
        // Create larger canvas for bigger text
        const canvas = document.createElement('canvas');
        canvas.width = 3072; // Larger canvas for bigger text
        canvas.height = 768;  // Increased height
        const context = canvas.getContext('2d');
        
        // Clear canvas with transparent background
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // No background - independent text only
        
        // Set up text styling with custom font
        context.fillStyle = '#FFFFFF'; // White text
        context.strokeStyle = '#000000'; // Black outline for visibility
        context.lineWidth = 6; // Thicker outline for bigger text
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Try custom font first, fallback to system fonts
        const fontSize = 120; // Much larger font size
        context.font = `bold ${fontSize}px 'CityOfGitsFont', 'Arial Black', Arial, sans-serif`;
        
        // First line: "nekshavs.tech"
        const line1Y = canvas.height * 0.35;
        context.strokeText('CityOfGits', canvas.width / 5, line1Y);
        context.fillText('CityOfGits', canvas.width / 5, line1Y);
        
        // Second line: "cityofgits"
        const line2Y = canvas.height * 0.65;
        context.strokeText('Bored of contributing code? Why not trying some buildings, cement, islands or rockets!?', canvas.width / 5, line2Y);
        context.fillText('Bored of contributing code? Why not trying some buildings, cement, islands or rockets!?', canvas.width / 5, line2Y);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        // Create material for independent text (no background)
        const logoMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        // Create larger plane geometry for bigger text
        const logoGeometry = new THREE.PlaneGeometry(1200, 300); // Much larger size
        const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
        
        // Position the logo
        logoMesh.rotation.x = -Math.PI / 2; // Lay flat on ground
        logoMesh.position.set(logoX, 3, logoZ); // Higher above ground for visibility
        
        // Clear any existing children and add the new text
        logoGroup.clear();
        logoGroup.add(logoMesh);
        
        console.log('✅ Custom font text logo created successfully!');
    }

    createTextWithFallbackFont(logoX, logoZ, logoGroup) {
        // Fallback version with system fonts
        const canvas = document.createElement('canvas');
        canvas.width = 3072;
        canvas.height = 768;
        const context = canvas.getContext('2d');
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set up text styling with fallback fonts
        context.fillStyle = '#FFFFFF';
        context.strokeStyle = '#000000';
        context.lineWidth = 6;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Use high-quality system fonts as fallback
        context.font = 'bold 120px "Arial Black", Arial, sans-serif';
        
        // First line: "nekshavs.tech"
        const line1Y = canvas.height * 0.35;
        context.strokeText('nekshavs.tech', canvas.width / 2, line1Y);
        context.fillText('nekshavs.tech', canvas.width / 2, line1Y);
        
        // Second line: "cityofgits"
        const line2Y = canvas.height * 0.65;
        context.strokeText('cityofgits', canvas.width / 2, line2Y);
        context.fillText('cityofgits', canvas.width / 2, line2Y);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const logoMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        const logoGeometry = new THREE.PlaneGeometry(1200, 300);
        const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
        
        logoMesh.rotation.x = -Math.PI / 2;
        logoMesh.position.set(logoX, 3, logoZ);
        
        if (logoGroup.children.length === 0) {
            logoGroup.add(logoMesh);
            console.log('✅ Fallback font text logo created successfully!');
        }
    }
    
    createCityLandmarks() {
        // Create spectacular statues and varied towers throughout the city for visual appeal
        const landmarkPositions = [
            {x: -400, z: -400, type: 'pyramid'},
            {x: 400, z: -400, type: 'obelisk'},
            {x: -400, z: 400, type: 'statue'},
            {x: 0, z: -600, type: 'crystal'},
            {x: -600, z: 0, type: 'spire'},
            {x: 600, z: 0, type: 'arch'},
            {x: 0, z: 600, type: 'monument'},
            {x: -200, z: -200, type: 'fountain'}
        ];
        
        landmarkPositions.forEach(pos => {
            this.createLandmark(pos.x, pos.z, pos.type);
        });
        
        console.log('✅ Spectacular city landmarks created!');
    }
    
    createLandmark(x, z, type) {
        const landmarkGroup = new THREE.Group();
        
        switch (type) {
            case 'pyramid':
                this.createPyramidLandmark(landmarkGroup);
                break;
            case 'obelisk':
                this.createObeliskLandmark(landmarkGroup);
                break;
            case 'statue':
                this.createStatueLandmark(landmarkGroup);
                break;
            case 'crystal':
                this.createCrystalLandmark(landmarkGroup);
                break;
            case 'spire':
                this.createSpireLandmark(landmarkGroup);
                break;
            case 'arch':
                this.createArchLandmark(landmarkGroup);
                break;
            case 'monument':
                this.createMonumentLandmark(landmarkGroup);
                break;
            case 'fountain':
                this.createFountainLandmark(landmarkGroup);
                break;
        }
        
        landmarkGroup.position.set(x, 0, z);
        
        // Performance: Only add shadows on high-end devices
        if (!this.isLowMemory) {
            landmarkGroup.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }
        
        this.scene.add(landmarkGroup);
    }
    
    createPyramidLandmark(group) {
        // Colorful stepped pyramid
        const colors = [0xFFD700, 0xFF6347, 0x4169E1, 0x32CD32];
        
        for (let i = 0; i < 4; i++) {
            const size = 80 - (i * 15);
            const height = 25;
            const geometry = new THREE.BoxGeometry(size, height, size);
            const material = new THREE.MeshBasicMaterial({ color: colors[i] });
            const level = new THREE.Mesh(geometry, material);
            level.position.y = (i * height) + (height / 2);
            group.add(level);
        }
        
        // Golden capstone
        const capGeometry = new THREE.ConeGeometry(10, 20, 8);
        const capMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.y = 110;
        group.add(cap);
    }
    
    createObeliskLandmark(group) {
        // Tall colorful obelisk
        const shaftGeometry = new THREE.BoxGeometry(20, 200, 20);
        const shaftMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.y = 100;
        group.add(shaft);
        
        // Pyramid top
        const topGeometry = new THREE.ConeGeometry(15, 30, 4);
        const topMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 215;
        group.add(top);
        
        // Colorful bands
        const bandColors = [0xFF6347, 0x4169E1, 0x32CD32];
        bandColors.forEach((color, i) => {
            const bandGeometry = new THREE.BoxGeometry(22, 15, 22);
            const bandMaterial = new THREE.MeshBasicMaterial({ color: color });
            const band = new THREE.Mesh(bandGeometry, bandMaterial);
            band.position.y = 50 + (i * 50);
            group.add(band);
        });
    }
    
    createStatueLandmark(group) {
        // Humanoid statue
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x708090 });
        const accentMaterial = new THREE.MeshBasicMaterial({ color: 0xFF6347 });
        
        // Base
        const baseGeometry = new THREE.CylinderGeometry(30, 30, 10, 16);
        const base = new THREE.Mesh(baseGeometry, accentMaterial);
        base.position.y = 5;
        group.add(base);
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(25, 60, 15);
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 40;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(15, 16, 16);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 85;
        group.add(head);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(40, 12, 12);
        const arms = new THREE.Mesh(armGeometry, bodyMaterial);
        arms.position.y = 55;
        group.add(arms);
    }
    
    createCrystalLandmark(group) {
        // Multi-colored crystal formation
        const crystalColors = [0x9400D3, 0x4B0082, 0x0000FF, 0x00FF00, 0xFFFF00, 0xFF7F00, 0xFF0000];
        
        crystalColors.forEach((color, i) => {
            const height = 60 + Math.random() * 80;
            const radius = 8 + Math.random() * 12;
            const geometry = new THREE.ConeGeometry(radius, height, 6);
            const material = new THREE.MeshBasicMaterial({ color: color });
            const crystal = new THREE.Mesh(geometry, material);
            
            const angle = (i / crystalColors.length) * Math.PI * 2;
            crystal.position.set(
                Math.cos(angle) * 25,
                height / 2,
                Math.sin(angle) * 25
            );
            crystal.rotation.z = (Math.random() - 0.5) * 0.3;
            group.add(crystal);
        });
    }
    
    createSpireLandmark(group) {
        // Twisted colorful spire
        const segments = 10;
        const colors = [0xFF1493, 0x00CED1, 0xFFD700, 0x32CD32];
        
        for (let i = 0; i < segments; i++) {
            const radius = 15 - (i * 1.2);
            const height = 20;
            const geometry = new THREE.CylinderGeometry(radius, radius + 2, height, 8);
            const material = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
            const segment = new THREE.Mesh(geometry, material);
            
            segment.position.y = i * 18 + height / 2;
            segment.rotation.y = i * 0.3; // Twist effect
            group.add(segment);
        }
        
        // Glowing top
        const topGeometry = new THREE.SphereGeometry(8, 16, 16);
        const topMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFFFFFF,
            emissive: 0xFFFFFF,
            emissiveIntensity: 0.3
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = segments * 18 + 10;
        group.add(top);
    }
    
    createArchLandmark(group) {
        // Colorful triumphal arch
        const archMaterial = new THREE.MeshBasicMaterial({ color: 0xDC143C });
        const accentMaterial = new THREE.MeshBasicMaterial({ color: 0xFFD700 });
        
        // Left pillar
        const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(20, 120, 30), archMaterial);
        leftPillar.position.set(-40, 60, 0);
        group.add(leftPillar);
        
        // Right pillar
        const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(20, 120, 30), archMaterial);
        rightPillar.position.set(40, 60, 0);
        group.add(rightPillar);
        
        // Top beam
        const beam = new THREE.Mesh(new THREE.BoxGeometry(100, 20, 30), archMaterial);
        beam.position.y = 130;
        group.add(beam);
        
        // Decorative elements
        const decorGeometry = new THREE.BoxGeometry(15, 15, 35);
        for (let i = 0; i < 6; i++) {
            const decor = new THREE.Mesh(decorGeometry, accentMaterial);
            decor.position.set(-75 + (i * 30), 130, 0);
            group.add(decor);
        }
    }
    
    createMonumentLandmark(group) {
        // Abstract modern monument
        const materials = [
            new THREE.MeshBasicMaterial({ color: 0x4169E1 }),
            new THREE.MeshBasicMaterial({ color: 0xFF6347 }),
            new THREE.MeshBasicMaterial({ color: 0x32CD32 }),
            new THREE.MeshBasicMaterial({ color: 0xFFD700 })
        ];
        
        // Create abstract geometric shapes
        const shapes = [
            { geo: new THREE.BoxGeometry(30, 80, 30), pos: {x: 0, y: 40, z: 0} },
            { geo: new THREE.CylinderGeometry(20, 20, 60, 8), pos: {x: 35, y: 30, z: 0} },
            { geo: new THREE.ConeGeometry(15, 70, 6), pos: {x: -35, y: 35, z: 0} },
            { geo: new THREE.SphereGeometry(18, 16, 16), pos: {x: 0, y: 100, z: 0} }
        ];
        
        shapes.forEach((shape, i) => {
            const mesh = new THREE.Mesh(shape.geo, materials[i]);
            mesh.position.set(shape.pos.x, shape.pos.y, shape.pos.z);
            group.add(mesh);
        });
    }
    
    createFountainLandmark(group) {
        // Multi-tier colorful fountain
        const waterMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB, 
            transparent: true, 
            opacity: 0.8 
        });
        const stoneMaterial = new THREE.MeshBasicMaterial({ color: 0x708090 });
        
        // Base pool
        const baseGeometry = new THREE.CylinderGeometry(50, 50, 8, 16);
        const base = new THREE.Mesh(baseGeometry, stoneMaterial);
        base.position.y = 4;
        group.add(base);
        
        // Water in base
        const waterBase = new THREE.Mesh(new THREE.CylinderGeometry(45, 45, 2, 16), waterMaterial);
        waterBase.position.y = 9;
        group.add(waterBase);
        
        // Middle tier
        const middleGeometry = new THREE.CylinderGeometry(30, 30, 6, 16);
        const middle = new THREE.Mesh(middleGeometry, stoneMaterial);
        middle.position.y = 15;
        group.add(middle);
        
        // Water in middle
        const waterMiddle = new THREE.Mesh(new THREE.CylinderGeometry(25, 25, 2, 16), waterMaterial);
        waterMiddle.position.y = 19;
        group.add(waterMiddle);
        
        // Top tier
        const topGeometry = new THREE.CylinderGeometry(15, 15, 4, 16);
        const top = new THREE.Mesh(topGeometry, stoneMaterial);
        top.position.y = 24;
        group.add(top);
        
        // Central spout
        const spoutGeometry = new THREE.CylinderGeometry(3, 3, 15, 8);
        const spout = new THREE.Mesh(spoutGeometry, stoneMaterial);
        spout.position.y = 33;
        group.add(spout);
    }
    
    update() {
        // Rotate the Lotus Tower antenna
        if (this.lotusGroup && this.lotusGroup.userData.antenna) {
            this.lotusGroup.userData.antenna.rotation.y += 0.01; // Smooth rotation
        }
        
        // Update flying rockets animation - adjusted for massive size and sun level
        if (this.rockets) {
            this.rockets.forEach(rocket => {
                // Move rockets in consistent direction
                rocket.position.add(rocket.userData.velocity);
                
                // Wrap around larger world bounds for massive rockets
                if (rocket.position.x > 20000) rocket.position.x = -20000;
                if (rocket.position.x < -20000) rocket.position.x = 20000;
                if (rocket.position.z > 20000) rocket.position.z = -20000;
                if (rocket.position.z < -20000) rocket.position.z = 20000;
                
                // Keep them at sun level (don't let them fall too low)
                if (rocket.position.y < 7000) rocket.position.y = 10000;
                if (rocket.position.y > 12000) rocket.position.y = 8000;
                
                // NO random rotation - rockets maintain consistent flight orientation
                // Only subtle stabilizing movement
                rocket.rotation.y += 0.0005; // Very slight yaw adjustment for realism
            });
        }
        
        // Update clouds rotation for dynamic sky
        if (this.scene && !this.ultraLowEnd) {
            this.scene.traverse((child) => {
                if (child.userData && child.userData.rotationSpeed) {
                    child.rotation.y += child.userData.rotationSpeed;
                }
            });
        }
    }
    
    render() {
        if (this.renderer && this.scene && this.camera) {
            // Update camera matrix for smooth movement
            this.camera.updateMatrixWorld();
            
            // Ensure proper depth buffer clearing to prevent glitching
            this.renderer.clear(true, true, true);
            
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // Add frame rate optimization for smoother movement
    optimizeFrameRate() {
        // Throttle updates on low-end devices to prevent glitching
        if (this.isLowMemory) {
            this.frameSkip = (this.frameSkip || 0) + 1;
            if (this.frameSkip % 2 === 0) {
                return false; // Skip this frame
            }
        }
        return true;
    }

    // Cleanup method for proper resource management
    
    // ===== UNDERGROUND MINECRAFT-STYLE CAVE SYSTEM =====
    
    createUndergroundCity() {
        console.log('🏗️ Creating minecraft-style underground cave system...');
        
        this.undergroundGroup = new THREE.Group();
        this.undergroundGroup.position.y = -100; // 100 units below surface
        this.undergroundGroup.visible = false; // Hidden by default until player goes underground
        this.scene.add(this.undergroundGroup);
        
        // Initialize cave system
        this.caveSections = [];
        this.currentCaveSection = 0;
        
        // Create initial cave section
        this.createCaveSection(0, 0, 0);
        
        // Create underground lighting system
        this.createUndergroundLighting();
        
        // Setup cave generation tracker
        this.lastPlayerPosUnderground = { x: 0, z: 0 };
        
        console.log('✅ Underground cave system created successfully!');
    }
    
    createCaveSection(x, y, z) {
        console.log(`🏗️ Creating cave section at (${x}, ${y}, ${z})...`);
        
        // Create a new cave section group
        const sectionGroup = new THREE.Group();
        sectionGroup.position.set(x, y, z);
        this.undergroundGroup.add(sectionGroup);
        
        // Track this section
        this.caveSections.push({
            position: { x, y, z },
            group: sectionGroup,
            id: this.caveSections.length
        });
        
        // Create cave floor with stone texture
        const floorGeometry = new THREE.PlaneGeometry(300, 400, 20, 20);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x808080, // Gray stone like minecraft
            side: THREE.DoubleSide
        });
        
        // Add some variation to floor
        const floorVertices = floorGeometry.attributes.position.array;
        for (let i = 0; i < floorVertices.length; i += 3) {
            floorVertices[i + 1] = Math.random() * 2 - 1; // Small height variations
        }
        
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -5;
        floor.receiveShadow = true;
        sectionGroup.add(floor);
        
        // Create a water pool (blue like in the screenshot)
        const waterGeometry = new THREE.PlaneGeometry(100, 300);
        const waterMaterial = new THREE.MeshLambertMaterial({
            color: 0x3399ff,
            transparent: true,
            opacity: 0.8
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.y = -3;
        sectionGroup.add(water);
        
        // Create cave walls
        // Left wall
        const wallHeight = 60;
        const wallLength = 400;
        
        const leftWallGeometry = new THREE.BoxGeometry(10, wallHeight, wallLength);
        const wallMaterial = new THREE.MeshLambertMaterial({
            color: 0xaaaaaa // Light gray stone
        });
        const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.position.set(-150, wallHeight/2 - 5, 0);
        sectionGroup.add(leftWall);
        
        // Right wall
        const rightWall = leftWall.clone();
        rightWall.position.set(150, wallHeight/2 - 5, 0);
        sectionGroup.add(rightWall);
        
        // Create ceiling
        const ceilingGeometry = new THREE.PlaneGeometry(300, 400, 20, 20);
        const ceilingMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x666666, // Dark ceiling
            side: THREE.DoubleSide
        });
        
        // Make it uneven like a cave
        const ceilingVertices = ceilingGeometry.attributes.position.array;
        for (let i = 0; i < ceilingVertices.length; i += 3) {
            ceilingVertices[i + 1] = Math.random() * 10 - 5; // Height variations
        }
        
        const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.rotation.x = -Math.PI / 2;
        ceiling.position.y = 50;
        sectionGroup.add(ceiling);
        
        // Add cave decorations - mossy blocks, vines, plants
        this.addCaveDecorations(sectionGroup);
        
        // Add cave lighting
        this.addCaveLighting(sectionGroup);
        
        return sectionGroup;
    }
    
    addCaveDecorations(sectionGroup) {
        // Add mossy stone blocks to walls
        for (let i = 0; i < 30; i++) {
            const blockSize = 15 + Math.random() * 5;
            const mossyBlockGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
            const mossyBlockMaterial = new THREE.MeshLambertMaterial({
                color: 0x7d8c7c // Mossy green-gray
            });
            const mossyBlock = new THREE.Mesh(mossyBlockGeometry, mossyBlockMaterial);
            
            // Random position along the walls
            const isLeftWall = Math.random() > 0.5;
            const x = isLeftWall ? -145 : 145;
            const y = Math.random() * 40;
            const z = (Math.random() - 0.5) * 380;
            
            mossyBlock.position.set(x, y, z);
            sectionGroup.add(mossyBlock);
        }
        
        // Create hanging vines like in the screenshot
        for (let i = 0; i < 40; i++) {
            const vineHeight = 10 + Math.random() * 30;
            const vineGeometry = new THREE.BoxGeometry(5, vineHeight, 5);
            const vineMaterial = new THREE.MeshLambertMaterial({
                color: 0x7cfc00, // Bright green
                transparent: true,
                opacity: 0.9
            });
            
            const vine = new THREE.Mesh(vineGeometry, vineMaterial);
            
            // Position hanging from ceiling
            const x = (Math.random() - 0.5) * 280;
            const z = (Math.random() - 0.5) * 380;
            vine.position.set(x, 45 - vineHeight/2, z);
            
            sectionGroup.add(vine);
        }
        
        // Add some glowing plants on the walls
        for (let i = 0; i < 20; i++) {
            const plantSize = 10;
            const plantGeometry = new THREE.BoxGeometry(plantSize, plantSize, plantSize);
            const plantMaterial = new THREE.MeshLambertMaterial({
                color: 0xadff2f, // Yellow-green
                emissive: 0x32cd32,
                emissiveIntensity: 0.5
            });
            
            const plant = new THREE.Mesh(plantGeometry, plantMaterial);
            
            // Position on walls
            const isLeftWall = Math.random() > 0.5;
            const x = isLeftWall ? -145 : 145;
            const y = 5 + Math.random() * 40;
            const z = (Math.random() - 0.5) * 380;
            
            plant.position.set(x, y, z);
            sectionGroup.add(plant);
        }
    }
    
    addCaveLighting(sectionGroup) {
        // Add torch lights
        const torchPositions = [
            { x: -140, y: 30, z: -150 },
            { x: -140, y: 30, z: 0 },
            { x: -140, y: 30, z: 150 },
            { x: 140, y: 30, z: -150 },
            { x: 140, y: 30, z: 0 },
            { x: 140, y: 30, z: 150 }
        ];
        
        torchPositions.forEach((pos) => {
            // Create torch light
            const torchLight = new THREE.PointLight(0xff9933, 2, 100);
            torchLight.position.set(pos.x, pos.y, pos.z);
            sectionGroup.add(torchLight);
            
            // Create torch object
            const torchGeometry = new THREE.BoxGeometry(5, 10, 5);
            const torchMaterial = new THREE.MeshLambertMaterial({
                color: 0x8b4513, // Brown
                emissive: 0xff4500,
                emissiveIntensity: 0.8
            });
            
            const torch = new THREE.Mesh(torchGeometry, torchMaterial);
            torch.position.copy(torchLight.position);
            sectionGroup.add(torch);
        });
        
        // Blue light from water
        const waterLight = new THREE.PointLight(0x3399ff, 2, 150);
        waterLight.position.set(0, 10, 0);
        sectionGroup.add(waterLight);
        
        // Green glow from plants
        const greenLight = new THREE.PointLight(0x00ff00, 1, 100);
        greenLight.position.set(0, 30, 0);
        sectionGroup.add(greenLight);
    }
    
    createUndergroundLighting() {
        console.log('💡 Setting up minecraft-style cave lighting...');
        
        // Very dim ambient light to simulate cave darkness
        const ambientLight = new THREE.AmbientLight(0x333333, 0.2);
        this.undergroundGroup.add(ambientLight);
        
        // Add blue hue from water
        const waterLight = new THREE.HemisphereLight(0x0044ff, 0x000033, 0.3);
        this.undergroundGroup.add(waterLight);
        
        // Add flickering torches system
        this.torchLights = [];
        
        // Main navigation lighting to guide the player through the cave system
        const pathLights = [
            { x: 0, y: 20, z: -150 },
            { x: 0, y: 20, z: 0 },
            { x: 0, y: 20, z: 150 }
        ];
        
        pathLights.forEach(pos => {
            const pathLight = new THREE.PointLight(0xffaa44, 1.5, 70, 2);
            pathLight.position.set(pos.x, pos.y, pos.z);
            this.undergroundGroup.add(pathLight);
            this.torchLights.push(pathLight);
        });
        
        // Setup torch flicker animation
        this.setupTorchFlicker();
        
        console.log('✅ Cave lighting system complete!');
    }
    
    setupTorchFlicker() {
        // Animate torch flicker effect - simulates minecraft torch lighting
        const flickerIntensity = () => {
            this.torchLights.forEach(light => {
                // Random flicker between 80-120% of original intensity
                const flickerAmount = 0.8 + Math.random() * 0.4;
                light.intensity = light.userData.baseIntensity || 1.5 * flickerAmount;
            });
            
            // Ambient flicker for glowing plants
            if (this.undergroundGroup) {
                this.undergroundGroup.traverse(child => {
                    if (child.material && child.material.emissive) {
                        // Slight random flicker for emissive materials
                        const flickerAmount = 0.9 + Math.random() * 0.2;
                        if (!child.userData.baseEmissiveIntensity) {
                            child.userData.baseEmissiveIntensity = child.material.emissiveIntensity;
                        }
                        child.material.emissiveIntensity = child.userData.baseEmissiveIntensity * flickerAmount;
                    }
                });
            }
        };
        
        // Store the interval ID so we can clear it if needed
        this.torchFlickerInterval = setInterval(flickerIntensity, 120);
    }
    
    // Check if player needs a new cave section
    checkCaveGeneration(playerPosition) {
        if (!this.isUnderground) return;
        
        // Check distance from last position where we checked
        const dx = playerPosition.x - this.lastPlayerPosUnderground.x;
        const dz = playerPosition.z - this.lastPlayerPosUnderground.z;
        const distanceMoved = Math.sqrt(dx*dx + dz*dz);
        
        // Only check if player moved significantly
        if (distanceMoved < 100) return;
        
        // Update last position
        this.lastPlayerPosUnderground = {
            x: playerPosition.x,
            z: playerPosition.z
        };
        
        // Check if player is near cave edge
        const currentSection = this.caveSections[this.currentCaveSection];
        const relativePosX = playerPosition.x - this.undergroundGroup.position.x - currentSection.position.x;
        const relativePosZ = playerPosition.z - this.undergroundGroup.position.z - currentSection.position.z;
        
        // Check if we need to generate a new section
        if (Math.abs(relativePosZ) > 180) {
            // Generate in Z direction
            const newZ = currentSection.position.z + (relativePosZ > 0 ? 400 : -400);
            this.createCaveSection(currentSection.position.x, 0, newZ);
            this.currentCaveSection = this.caveSections.length - 1;
            console.log(`🏗️ Generated new cave section in Z direction: ${newZ}`);
        } 
        else if (Math.abs(relativePosX) > 130) {
            // Generate in X direction
            const newX = currentSection.position.x + (relativePosX > 0 ? 300 : -300);
            this.createCaveSection(newX, 0, currentSection.position.z);
            this.currentCaveSection = this.caveSections.length - 1;
            console.log(`🏗️ Generated new cave section in X direction: ${newX}`);
        }
    }
    
    // Performance optimization: Hide surface city when underground
    hideSurfaceCity() {
        console.log('🔄 Hiding surface city to optimize performance...');
        
        // Hide surface terrain
        if (this.terrain) {
            this.terrain.visible = false;
        }
        
        // Hide all buildings, roads, and surface objects
        if (this.buildingsGroup) {
            this.buildingsGroup.visible = false;
        }
        
        // Hide skybox
        if (this.skybox) {
            this.skybox.visible = false;
        }
        
        // Hide other surface groups
        if (this.roadsGroup) this.roadsGroup.visible = false;
        if (this.treesGroup) this.treesGroup.visible = false;
        if (this.decorationsGroup) this.decorationsGroup.visible = false;
        
        // Show underground
        if (this.undergroundGroup) {
            this.undergroundGroup.visible = true;
        }
        
        console.log('✅ Surface city hidden, underground city visible');
        this.isUnderground = true;
    }
    
    // Performance optimization: Show surface city when returning from underground
    showSurfaceCity() {
        console.log('🔄 Showing surface city...');
        
        // Show surface terrain
        if (this.terrain) {
            this.terrain.visible = true;
        }
        
        // Show all buildings, roads, and surface objects
        if (this.buildingsGroup) {
            this.buildingsGroup.visible = true;
        }
        
        // Show skybox
        if (this.skybox) {
            this.skybox.visible = true;
        }
        
        // Show other surface groups
        if (this.roadsGroup) this.roadsGroup.visible = true;
        if (this.treesGroup) this.treesGroup.visible = true;
        if (this.decorationsGroup) this.decorationsGroup.visible = true;
        
        // Hide underground
        if (this.undergroundGroup) {
            this.undergroundGroup.visible = false;
        }
        
        console.log('✅ Surface city visible, underground city hidden');
        this.isUnderground = false;
    }
    dispose() {
        // Clear meme rotation interval
        if (this.memeRotationInterval) {
            clearInterval(this.memeRotationInterval);
            this.memeRotationInterval = null;
        }
        
        // Additional cleanup can be added here
        console.log('✅ World resources cleaned up');
    }
    
    createSubwayEntrance(x, z, stationName) {
        const entranceGroup = new THREE.Group();
        
        // CREATE SIMPLIFIED BUT VISIBLE WELL ENTRANCE
        
        // BRIGHT COLORED PLATFORM - SIMPLIFIED GEOMETRY
        const platformGeometry = new THREE.CylinderGeometry(80, 90, 10, 8);
        const platformMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000  // BRIGHT RED - Using MeshBasicMaterial for performance
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = 5;
        entranceGroup.add(platform);
        
        // WELL HOLE - SIMPLIFIED
        const holeGeometry = new THREE.CylinderGeometry(70, 70, 100, 8);
        const holeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000  // Black hole - no transparency for performance
        });
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.position.y = -45;
        entranceGroup.add(hole);
        
        // SIMPLE GLOWING RING
        const ringGeometry = new THREE.TorusGeometry(75, 5, 8, 8);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00  // BRIGHT GREEN - no emissive for performance
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.y = 12;
        ring.rotation.x = -Math.PI / 2;
        entranceGroup.add(ring);
        
        // SIMPLE BEACON - ONE OBJECT INSTEAD OF MANY
        const beaconGeometry = new THREE.CylinderGeometry(20, 15, 60, 8);
        const beaconMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000ff  // BRIGHT BLUE - no emissive for performance
        });
        const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beacon.position.y = 35;
        entranceGroup.add(beacon);
        
        // JUST ONE LIGHT INSTEAD OF MANY
        const light = new THREE.PointLight(0xffffff, 2.0, 200);
        light.position.set(0, 30, 0);
        entranceGroup.add(light);
        
        // Position the entrance group
        entranceGroup.position.set(x, 0, z);
        entranceGroup.userData = { 
            type: 'subway_well', 
            stationName: stationName,
            name: stationName,
            coordinates: { x: x, z: z },
            wellRadius: 70  // Collision radius
        };
        this.scene.add(entranceGroup);
        
        // Store this well for collision checking
        if (!this.subwayWells) {
            this.subwayWells = [];
        }
        this.subwayWells.push({
            x: x,
            z: z,
            radius: 70,
            name: stationName
        });
        
        // SIMPLIFIED ANIMATION - ONE FUNCTION FOR ALL WELLS
        if (!this.wellAnimationStarted) {
            this.wellAnimationStarted = true;
            
            // Only one animation function for all wells
            const animateAllWells = () => {
                const time = Date.now() * 0.003; // Slower animation for performance
                
                // Slightly pulse the beacon color between blue and purple
                const beaconColor = new THREE.Color(0.1 + Math.sin(time) * 0.1, 0, 0.8 + Math.sin(time) * 0.2);
                
                // Only update color every few frames for performance
                if (Math.floor(time * 10) % 3 === 0) {
                    this.scene.traverse(child => {
                        if (child.userData && child.userData.type === 'subway_well') {
                            child.children.forEach(part => {
                                if (part.geometry && part.geometry.type === 'CylinderGeometry' && 
                                    part.material.color.getHex() === 0x0000ff) {
                                    part.material.color = beaconColor;
                                }
                            });
                        }
                    });
                }
                
                requestAnimationFrame(animateAllWells);
            };
            
            animateAllWells();
        }
        
        console.log(`🕳️ CREATED SUBWAY WELL: ${stationName} at (${x}, 0, ${z})`);
        return entranceGroup;
    }

    createSubwayEntranceGrid() {
        console.log('🕳️ Creating subway entrance grid...');
        
        // Initialize subway wells array
        this.subwayWells = [];
        
        // Create wells closer together and nearer to spawn point
        const gridSpacing = 200; // Closer spacing - every 200 meters
        const citySize = 800; // Smaller area around spawn
        const startPos = -citySize / 2;
        const endPos = citySize / 2;
        
        let stationCounter = 1;
        
        for (let x = startPos; x <= endPos; x += gridSpacing) {
            for (let z = startPos; z <= endPos; z += gridSpacing) {
                // Less random offset so they're more predictable
                const offsetX = (Math.random() - 0.5) * 50;
                const offsetZ = (Math.random() - 0.5) * 50;
                
                const finalX = x + offsetX;
                const finalZ = z + offsetZ;
                
                const stationName = `Well ${stationCounter}`;
                this.createSubwayEntrance(finalX, finalZ, stationName);
                
                stationCounter++;
            }
        }
        
        console.log(`🕳️ Created ${stationCounter - 1} MASSIVE subway wells! They should be IMPOSSIBLE to miss!`);
    }
    
    teleportToUnderground(x, z) {
        console.log('🕳️ Starting underground teleportation sequence...');
        
        // Save current position for return trip
        if (!this.lastSurfacePosition) {
            this.lastSurfacePosition = {
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z
            };
        }
        
        // Show loading message
        this.showLoadingMessage("Creating underground...");
        
        // Use setTimeout to give browser a chance to render loading message
        setTimeout(() => {
            // Start measuring memory usage
            const memoryStart = window.performance && window.performance.memory ? 
                window.performance.memory.usedJSHeapSize : 0;
                
            console.log('🧠 Memory before underground creation:', 
                memoryStart ? (memoryStart / 1048576).toFixed(2) + " MB" : "Unknown");
            
            // Create underground cave system if it doesn't exist yet
            if (!this.undergroundGroup) {
                console.log('🏗️ Creating underground for the first time...');
                this.createUndergroundCity();
                
                // Force garbage collection after creation
                if (window.gc) {
                    window.gc();
                } else if (window.collectGarbage) {
                    window.collectGarbage();
                }
            }
            
            // Hide surface city FIRST for performance
            this.hideSurfaceCity();
            
            // Log memory after switching
            const memoryAfter = window.performance && window.performance.memory ? 
                window.performance.memory.usedJSHeapSize : 0;
            console.log('🧠 Memory after underground creation:', 
                memoryAfter ? (memoryAfter / 1048576).toFixed(2) + " MB" : "Unknown");
            
            // Teleport camera to underground position
            this.camera.position.set(x, -500, z); // Deep below surface
            
            // Set underground flag
            this.isUnderground = true;
            
            // Set current cave section
            this.lastPlayerPosUnderground = { x, z };
            
            // Generate only ONE additional cave section if needed
            this.checkCaveGeneration(this.camera.position);
            
            // Hide loading message
            this.hideLoadingMessage();
            
            console.log('✅ Teleported player underground!');
        }, 50); // Small delay to let UI update
    }
    
    // Helper method to show loading message
    showLoadingMessage(message) {
        // Create or update loading message
        if (!this.loadingMessage) {
            const loadingDiv = document.createElement('div');
            loadingDiv.style.position = 'absolute';
            loadingDiv.style.top = '50%';
            loadingDiv.style.left = '50%';
            loadingDiv.style.transform = 'translate(-50%, -50%)';
            loadingDiv.style.background = 'rgba(0,0,0,0.7)';
            loadingDiv.style.color = '#fff';
            loadingDiv.style.padding = '20px';
            loadingDiv.style.borderRadius = '10px';
            loadingDiv.style.fontFamily = 'Arial, sans-serif';
            loadingDiv.style.zIndex = '1000';
            loadingDiv.id = 'loading-message';
            document.body.appendChild(loadingDiv);
            this.loadingMessage = loadingDiv;
        }
        
        this.loadingMessage.innerHTML = message + '<br>Please wait...';
        this.loadingMessage.style.display = 'block';
    }
    
    // Helper method to hide loading message
    hideLoadingMessage() {
        if (this.loadingMessage) {
            this.loadingMessage.style.display = 'none';
        }
    }
    
    teleportToSurface() {
        // Make sure we have a valid surface position
        if (!this.lastSurfacePosition) {
            this.lastSurfacePosition = {
                x: 0,
                y: 200,
                z: 0
            };
        }
        
        // Hide underground for performance
        this.showSurfaceCity();
        
        // Teleport camera back to surface
        this.camera.position.set(
            this.lastSurfacePosition.x,
            this.lastSurfacePosition.y + 20, // Slightly above ground to prevent collision
            this.lastSurfacePosition.z
        );
        
        // Reset underground flag
        this.isUnderground = false;
        
        console.log('☀️ Teleported player back to surface!');
    }
}
