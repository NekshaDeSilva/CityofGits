// World.js - Handles 3D world generation and management

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
        
        // MINECRAFT-STYLE CHUNK SYSTEM for 4GB RAM
        this.terrainChunks = new Map();
        this.loadedChunks = new Set();
        this.chunkSize = 800; // Small chunks like Minecraft (16x16 blocks = ~800 units)
        this.renderDistance = 2; // Only 2x2 chunks around player (ultra-low for 4GB)
        this.maxLoadedChunks = 4; // Maximum 4 chunks in memory
        this.lastPlayerChunk = { x: null, z: null };
        
        // AGGRESSIVE LOD SYSTEM (3 levels only)
        this.lodDistances = {
            high: 400,   // Ultra close - full detail
            medium: 1200, // Medium distance - simplified
            far: 2000    // Far distance - basic shapes only
        };
        
        // SHARED RESOURCES (Minecraft technique)
        this.sharedGeometries = new Map();
        this.sharedMaterials = new Map();
        this.instancedMeshes = new Map();
        
        // OBJECT POOLING (reuse everything)
        this.pools = {
            buildings: { available: [], inUse: [] },
            windows: { available: [], inUse: [] },
            decorations: { available: [], inUse: [] },
            aircraft: { available: [], inUse: [] }
        };
        
        // PERFORMANCE DETECTION
        // SMART MEMORY DETECTION - Enable for actual device capabilities
        this.isLowMemory = this.detectLowMemoryDevice();
        this.performanceMode = this.isLowMemory ? 'potato' : 'normal';
        
        // CULLING SYSTEM
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();
        this.visibleObjects = new Set();
        this.cullingInterval = this.isLowMemory ? 10 : 5; // Update culling less frequently on low-end
        
        // AIRCRAFT - MINIMAL
        this.aircraft = [];
        this.maxAircraft = this.isLowMemory ? 1 : 2; // 1 aircraft max for 4GB systems
        
        // MEMORY MANAGEMENT
        this.frameCount = 0;
        this.lastMemoryCleanup = 0;
        this.memoryCleanupInterval = 300; // Clean up every 5 seconds on low-end
        
        // BATCHING SYSTEM
        this.batchedGeometries = new Map();
        this.maxBatchSize = this.isLowMemory ? 50 : 100;
        
        this.init();
    }

    detectLowMemoryDevice() {
        // Smart detection for optimal performance
        const memory = navigator.deviceMemory || 4;
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Use memory detection but optimize for both cases
        if (memory <= 4 || isMobile) {
            console.log('🔧 Low-end device detected - Using optimized mega city');
            return true;
        } else {
            console.log('🚀 High-end device detected - Using full mega city');
            return false;
        }
    }

    async init() {
        console.log(`🎮 Initializing CityofGits in ${this.performanceMode} mode for ${this.isLowMemory ? '4GB' : '8GB+'} system`);
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 1000, this.isLowMemory ? 1500 : 3000); // Sky blue fog for green world
        
        // Setup camera with limited far plane
        this.camera = new THREE.PerspectiveCamera(
            this.isLowMemory ? 60 : 75, // Narrower FOV for performance
            window.innerWidth / window.innerHeight, 
            0.1, 
            this.isLowMemory ? 1500 : 3000 // Much shorter view distance
        );
        this.camera.position.set(0, 50, 200); // Start closer to reduce initial load
        this.camera.lookAt(0, 0, 0);
        
        // ULTRA-OPTIMIZED RENDERER for 4GB systems
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('gameCanvas'),
            antialias: false, // Always off for low-memory
            powerPreference: "low-power", // Force low-power GPU
            alpha: false,
            stencil: false,
            depth: true,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false,
            logarithmicDepthBuffer: false
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // AGGRESSIVE PERFORMANCE SETTINGS
        this.renderer.setPixelRatio(this.isLowMemory ? 0.75 : 1); // Lower resolution on low-end
        this.renderer.shadowMap.enabled = false; // No shadows for 4GB systems
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.renderer.physicallyCorrectLights = false;
        this.renderer.outputEncoding = THREE.LinearEncoding; // Faster than sRGB
        this.renderer.toneMapping = THREE.NoToneMapping; // Disable for performance
        
        // Renderer optimizations
        this.renderer.sortObjects = false; // Disable sorting for performance
        this.renderer.autoClear = true;
        this.renderer.autoClearColor = true;
        this.renderer.autoClearDepth = true;
        this.renderer.autoClearStencil = false;
        
        console.log(`✅ Renderer optimized for ${this.performanceMode} mode`);
        
        // Initialize shared materials for memory efficiency
        this.initSharedMaterials();
        
        // Initialize object pools
        this.initObjectPools();

        // Load world data
        await this.loadWorldData();
        
        // Create world elements optimized for performance
        this.createSky();
        this.createMinimalTerrain(); // Create minimal terrain instead of infinite
        this.createOptimizedLighting();
        this.generateOptimizedHouses();
        
        // Create mega city for ALL devices (with appropriate optimization)
        this.createMegaCity();
        console.log('🏙️ CREATING MEGA CITY for', this.isLowMemory ? 'LOW-END' : 'HIGH-END', 'device');
        
        this.createAircraft();
        
        // Create underground city system
        this.createUndergroundCity();
        this.createSubwayEntrances();
        
        // Debug log to verify subway creation
        console.log(`🚇 SUBWAY DEBUG: Created ${this.subwayEntrances?.length || 0} subway entrances`);
        if (this.subwayEntrances && this.subwayEntrances.length > 0) {
            console.log('🚇 First subway location:', this.subwayEntrances[0].position);
            console.log('🚇 All subway locations:', this.subwayEntrances.map(s => `${s.name} at (${s.position.x}, ${s.position.z})`));
            
            // Make subway entrances EXTREMELY visible with debug markers
            this.subwayEntrances.forEach((entrance, index) => {
                // Add a massive red debug cube at each subway location
                const debugGeometry = new THREE.BoxGeometry(100, 200, 100);
                const debugMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xff0000, 
                    wireframe: true,
                    transparent: true,
                    opacity: 0.5 
                });
                const debugCube = new THREE.Mesh(debugGeometry, debugMaterial);
                debugCube.position.set(entrance.position.x, 100, entrance.position.z);
                this.scene.add(debugCube);
                console.log(`🔴 Added debug cube ${index + 1} at (${entrance.position.x}, 100, ${entrance.position.z})`);
            });
        } else {
            console.error('❌ NO SUBWAY ENTRANCES WERE CREATED!');
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('🎮 World initialized successfully in', this.performanceMode, 'mode!');
    }

    async loadWorldData() {
        try {
            const response = await fetch('./world.json');
            this.worldData = await response.json();
            console.log('World data loaded:', this.worldData);
        } catch (error) {
            console.error('Error loading world data:', error);
            // Fallback world data
            this.worldData = {
                world: { skyColor: "#87CEEB", groundColor: "#8B7355" },
                houses: {}
            };
        }
    }

    // Initialize shared materials for memory efficiency  
    initSharedMaterials() {
        this.sharedMaterials = {
            building: {
                basic: new THREE.MeshLambertMaterial({ color: 0xcccccc }),
                glass: new THREE.MeshLambertMaterial({ color: 0x4a90e2, transparent: true, opacity: 0.7 }),
                concrete: new THREE.MeshLambertMaterial({ color: 0x999999 }),
                brick: new THREE.MeshLambertMaterial({ color: 0xaa6644 })
            },
            road: {
                asphalt: new THREE.MeshLambertMaterial({ color: 0x333333 }),
                line: new THREE.MeshLambertMaterial({ color: 0xffffff })
            },
            ground: {
                grass: new THREE.MeshLambertMaterial({ color: 0x4a7c2a }),
                water: new THREE.MeshLambertMaterial({ color: 0x006994, transparent: true, opacity: 0.8 })
            }
        };
        console.log('Shared materials initialized');
    }

    // Initialize object pools
    initObjectPools() {
        this.geometryPool = {
            box: {
                small: new THREE.BoxGeometry(20, 40, 20),
                medium: new THREE.BoxGeometry(40, 60, 40),
                large: new THREE.BoxGeometry(60, 80, 60)
            },
            ground: {
                chunk: (() => {
                    const geo = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize);
                    geo.rotateX(-Math.PI / 2);
                    return geo;
                })()
            }
        };
        console.log('Object pools initialized');
    }

    createSky() {
        // PERFORMANCE OPTIMIZED: Simpler sky for low-end devices
        const skyGeometry = new THREE.SphereGeometry(50000, 16, 8); // Large but with fewer segments
        
        // Match sky color with world data or use a light blue that complements earth tones
        const skyColor = this.worldData?.world?.skyColor || 0x87CEEB; // Light blue sky
        
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: skyColor,
            side: THREE.BackSide,
            fog: false
        });
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);

        // Add clouds only if not in low memory mode
        if (!this.isLowMemory) {
            this.createClouds();
        }
        
        console.log('✅ Performance-optimized sky created');
    }

    createClouds() {
        const cloudGroup = new THREE.Group();
        
        for (let i = 0; i < 20; i++) {
            const cloud = this.createSingleCloud();
            cloud.position.set(
                (Math.random() - 0.5) * 2000,
                200 + Math.random() * 200,
                (Math.random() - 0.5) * 2000
            );
            cloud.rotation.y = Math.random() * Math.PI * 2;
            cloudGroup.add(cloud);
        }
        
        this.scene.add(cloudGroup);
    }

    createSingleCloud() {
        const cloudGroup = new THREE.Group();
        const cloudMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7
        });

        for (let i = 0; i < 5; i++) {
            const cloudGeometry = new THREE.SphereGeometry(
                20 + Math.random() * 15,
                8,
                8
            );
            const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloudMesh.position.set(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 60
            );
            cloudGroup.add(cloudMesh);
        }

        return cloudGroup;
    }

    createInfiniteTerrain() {
        // Create initial terrain chunks around origin
        this.updateTerrain(0, 0);
        
        // ULTRA PERFORMANCE OPTIMIZED APPROACH FOR LOW-END DEVICES
        // Single massive ground plane that covers everything and renders efficiently
        // Use a very large size to ensure it extends beyond the view distance
        const mainGroundGeometry = new THREE.PlaneGeometry(1000000, 1000000);
        const mainGroundMaterial = new THREE.MeshBasicMaterial({ // Basic material for performance
            color: 0x8B7355, // Earth brown color - not blue!
            side: THREE.DoubleSide
        });
        const mainGround = new THREE.Mesh(mainGroundGeometry, mainGroundMaterial);
        mainGround.rotation.x = -Math.PI / 2;
        mainGround.position.set(0, -1, 0); // Positioned just below the origin
        this.scene.add(mainGround);
        
        // Add a second backup ground plane with a different material type to handle rendering differences
        const backupGroundGeometry = new THREE.PlaneGeometry(1000000, 1000000);
        const backupGroundMaterial = new THREE.MeshLambertMaterial({
            color: 0x8B7355, // Same earth brown color
            side: THREE.DoubleSide
        });
        const backupGround = new THREE.Mesh(backupGroundGeometry, backupGroundMaterial);
        backupGround.rotation.x = -Math.PI / 2;
        backupGround.position.set(0, -1.1, 0); // Slightly below main ground
        this.scene.add(backupGround);
        
        // Add a smaller, closer ground for better texture near the player
        const closeGroundGeometry = new THREE.PlaneGeometry(10000, 10000);
        const closeGroundMaterial = new THREE.MeshBasicMaterial({ // Basic for performance
            color: 0x8B7355 // Earth brown
        });
        const closeGround = new THREE.Mesh(closeGroundGeometry, closeGroundMaterial);
        closeGround.rotation.x = -Math.PI / 2;
        closeGround.position.set(0, -0.9, 0);
        this.scene.add(closeGround);
        
        console.log('✅ Optimized ground system created - ultra performance with complete coverage');
    }

    updateTerrain(playerX, playerZ) {
        const currentChunk = {
            x: Math.floor(playerX / this.chunkSize),
            z: Math.floor(playerZ / this.chunkSize)
        };

        // Only update if player moved to a different chunk
        if (currentChunk.x === this.lastPlayerChunk.x && currentChunk.z === this.lastPlayerChunk.z) {
            return;
        }

        this.lastPlayerChunk = currentChunk;

        // Generate chunks in a 3x3 grid around player
        const chunkRadius = 1;
        for (let x = currentChunk.x - chunkRadius; x <= currentChunk.x + chunkRadius; x++) {
            for (let z = currentChunk.z - chunkRadius; z <= currentChunk.z + chunkRadius; z++) {
                const chunkKey = `${x},${z}`;
                
                if (!this.terrainChunks.has(chunkKey)) {
                    this.createTerrainChunk(x, z);
                }
            }
        }

        // Remove distant chunks to maintain performance
        for (const [key, chunk] of this.terrainChunks.entries()) {
            const [chunkX, chunkZ] = key.split(',').map(Number);
            const distance = Math.max(Math.abs(chunkX - currentChunk.x), Math.abs(chunkZ - currentChunk.z));
            
            if (distance > chunkRadius + 1) {
                this.scene.remove(chunk.ground);
                if (chunk.grass) {
                    chunk.grass.forEach(grass => this.scene.remove(grass));
                }
                if (chunk.roads) {
                    chunk.roads.forEach(road => this.scene.remove(road));
                }
                this.terrainChunks.delete(key);
            }
        }
    }

    createTerrainChunk(chunkX, chunkZ) {
        const worldX = chunkX * this.chunkSize;
        const worldZ = chunkZ * this.chunkSize;
        
        // ULTRA-OPTIMIZED FOR LOW-END DEVICES
        // Single ground mesh with basic material for best performance
        const groundGeometry = new THREE.PlaneGeometry(this.chunkSize + 10, this.chunkSize + 10); // Small overlap
        const groundMaterial = new THREE.MeshBasicMaterial({ // MeshBasicMaterial for performance
            color: 0x4a7c59  // Green color for grass instead of brown
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(worldX, 0, worldZ);
        
        // Skip receiveShadow for performance on low-end devices
        if (!this.isLowMemory) {
            ground.receiveShadow = true;
        }
        
        this.scene.add(ground);
        
        // Always add grass patches for visual interest
        let grassPatches = [];
        // Add grass patches for visual interest
        const grassMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 }); // Green grass
        const patchCount = 15; // More patches for better appearance
        
        for (let i = 0; i < patchCount; i++) {
            const patchSize = 20 + Math.random() * 30;
            const grassGeometry = new THREE.PlaneGeometry(patchSize, patchSize);
            const grassPatch = new THREE.Mesh(grassGeometry, grassMaterial);
            
            grassPatch.rotation.x = -Math.PI / 2;
            grassPatch.position.set(
                worldX + (Math.random() - 0.5) * this.chunkSize * 0.8,
                0.1,
                worldZ + (Math.random() - 0.5) * this.chunkSize * 0.8
            );
            
            this.scene.add(grassPatch);
            grassPatches.push(grassPatch);
        }

        // Add roads if this is a central chunk
        const roads = [];
        if (Math.abs(chunkX) <= 2 && Math.abs(chunkZ) <= 2) {
            const pathMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
            
            // Main road (horizontal)
            if (chunkZ === 0) {
                const mainRoadGeometry = new THREE.PlaneGeometry(this.chunkSize, 20);
                const mainRoad = new THREE.Mesh(mainRoadGeometry, pathMaterial);
                mainRoad.rotation.x = -Math.PI / 2;
                mainRoad.position.set(worldX, 0.2, worldZ);
                this.scene.add(mainRoad);
                roads.push(mainRoad);
            }

            // Cross road (vertical)
            if (chunkX === 0) {
                const crossRoadGeometry = new THREE.PlaneGeometry(20, this.chunkSize);
                const crossRoad = new THREE.Mesh(crossRoadGeometry, pathMaterial);
                crossRoad.rotation.x = -Math.PI / 2;
                crossRoad.position.set(worldX, 0.2, worldZ);
                this.scene.add(crossRoad);
                roads.push(crossRoad);
            }
        }

        // Store chunk data
        this.terrainChunks.set(`${chunkX},${chunkZ}`, {
            ground: ground,
            grass: grassPatches,
            roads: roads,
            x: chunkX,
            z: chunkZ
        });
    }

    createLighting() {
        // Optimized lighting for performance
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);

        // Single directional light instead of multiple
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(1000, 1200, 500);
        this.scene.add(sunLight);

        console.log('Optimized lighting created');
    }

    createAircraft() {
        for (let i = 0; i < this.maxAircraft; i++) {
            setTimeout(() => {
                this.spawnAircraft();
            }, i * 2000); // Stagger spawning
        }
    }

    spawnAircraft() {
        const aircraft = this.createSingleAircraft();
        this.aircraft.push(aircraft);
        this.scene.add(aircraft.group);
    }

    createSingleAircraft() {
        const aircraftGroup = new THREE.Group();
        
        // Create Boeing-style aircraft body (747/777 style)
        const bodyGeometry = new THREE.CylinderGeometry(8, 12, 120, 16);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: this.getRandomAircraftColor() 
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.z = Math.PI / 2;
        aircraftGroup.add(body);

        // Large wings (Boeing style)
        const wingGeometry = new THREE.BoxGeometry(200, 4, 40);
        const wingMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xE0E0E0 
        });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.y = -5;
        aircraftGroup.add(wings);

        // Tail
        const tailGeometry = new THREE.BoxGeometry(8, 40, 30);
        const tail = new THREE.Mesh(tailGeometry, wingMaterial);
        tail.position.set(-50, 15, 0);
        aircraftGroup.add(tail);

        // 4 Jet engines (Boeing 747 style)
        for (let i = 0; i < 4; i++) {
            const engineGeometry = new THREE.CylinderGeometry(6, 8, 25, 12);
            const engineMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
            const engine = new THREE.Mesh(engineGeometry, engineMaterial);
            engine.rotation.z = Math.PI / 2;
            
            engine.position.set(
                -10,
                -15,
                i % 2 === 0 ? -60 : 60
            );
            aircraftGroup.add(engine);
        }

        // Cockpit windows
        const windowGeometry = new THREE.BoxGeometry(15, 8, 8);
        const windowMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4A90E2, 
            transparent: true, 
            opacity: 0.7 
        });
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(55, 2, 0);
        aircraftGroup.add(window);

        // Position aircraft randomly in mega city sky
        const spawnRadius = 60000; // Much larger for mega city
        const angle = Math.random() * Math.PI * 2;
        const distance = 10000 + Math.random() * spawnRadius;
        
        aircraftGroup.position.set(
            Math.cos(angle) * distance,
            800 + Math.random() * 400, // Higher altitude
            Math.sin(angle) * distance
        );

        // Random direction and speed
        const direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 2
        ).normalize();

        const speed = 30 + Math.random() * 40;

        // Make aircraft face movement direction
        aircraftGroup.lookAt(
            aircraftGroup.position.x + direction.x,
            aircraftGroup.position.y + direction.y,
            aircraftGroup.position.z + direction.z
        );

        return {
            group: aircraftGroup,
            direction: direction,
            speed: speed,
            propeller: prop,
            spawnTime: Date.now()
        };
    }

    getRandomAircraftColor() {
        // Real airline color schemes for mega city
        const airlineColors = [
            0xFF0000, // Red (Virgin, Delta)
            0x0066CC, // Blue (United, KLM)
            0x00AA00, // Green (Aer Lingus)
            0xFFD700, // Gold (Lufthansa)
            0xFF6600, // Orange (EasyJet)
            0x800080, // Purple (Virgin)
            0xFFFFFF, // White (Emirates)
            0x000080, // Navy Blue (British Airways)
            0xFF1493, // Pink (Wizz Air)
            0x008080  // Teal (Air Canada)
        ];
        return airlineColors[Math.floor(Math.random() * airlineColors.length)];
    }

    updateAircraft(deltaTime) {
        for (let i = this.aircraft.length - 1; i >= 0; i--) {
            const aircraft = this.aircraft[i];
            
            // Move aircraft
            const movement = aircraft.direction.clone().multiplyScalar(aircraft.speed * deltaTime);
            aircraft.group.position.add(movement);
            
            // Rotate propeller
            if (aircraft.propeller) {
                aircraft.propeller.rotation.x += deltaTime * 30;
            }

            // Add slight bobbing motion
            const time = (Date.now() - aircraft.spawnTime) * 0.001;
            aircraft.group.position.y += Math.sin(time * 2) * 0.5;

            // Remove aircraft if too far from origin or too old
            const distanceFromOrigin = aircraft.group.position.length();
            const age = Date.now() - aircraft.spawnTime;
            
            if (distanceFromOrigin > 8000 || age > 300000) { // 5 minutes max age
                this.scene.remove(aircraft.group);
                this.aircraft.splice(i, 1);
                
                // Spawn a new one
                setTimeout(() => {
                    this.spawnAircraft();
                }, 5000 + Math.random() * 10000);
            }
        }
    }

    generateHouses() {
        if (!this.worldData.houses) {
            console.log('No houses data found in world.json');
            return;
        }

        console.log('Generating houses...', Object.keys(this.worldData.houses));

        // Apply minimum distance constraint - 10 meters = 400 units (40 units per meter)
        const minDistance = 400; // 10 meter minimum distance
        const housePositions = [];

        Object.entries(this.worldData.houses).forEach(([houseId, houseData]) => {
            // Get building dimensions for spacing calculation
            const length = parseInt(houseData['building-length']) || 200;
            const width = parseInt(houseData['building-width']) || 200;
            const buildingRadius = Math.sqrt(length * length + width * width) / 2;
            
            let newPos = { x: houseData.position.x, z: houseData.position.z };
            let attempts = 0;
            const maxAttempts = 10;

            // Keep trying to find a valid position
            while (attempts < maxAttempts) {
                let positionValid = true;

                for (const existingPos of housePositions) {
                    const distance = Math.sqrt(
                        Math.pow(newPos.x - existingPos.x, 2) + 
                        Math.pow(newPos.z - existingPos.z, 2)
                    );
                    
                    // Consider building sizes + minimum distance
                    const requiredDistance = minDistance + buildingRadius + existingPos.radius;
                    
                    if (distance < requiredDistance) {
                        // Position too close, adjust it
                        const angle = Math.atan2(newPos.z - existingPos.z, newPos.x - existingPos.x);
                        newPos.x = existingPos.x + Math.cos(angle) * requiredDistance;
                        newPos.z = existingPos.z + Math.sin(angle) * requiredDistance;
                        positionValid = false;
                        break;
                    }
                }

                if (positionValid) {
                    break;
                }
                attempts++;
            }

            // Store position with radius for future calculations
            housePositions.push({
                x: newPos.x,
                z: newPos.z,
                radius: buildingRadius
            });
            
            // Update house data with adjusted position
            const adjustedHouseData = { ...houseData };
            adjustedHouseData.position = { ...adjustedHouseData.position, x: newPos.x, z: newPos.z };

            console.log(`Creating house: ${houseId} at adjusted position (${newPos.x}, ${newPos.z}), original: (${houseData.position.x}, ${houseData.position.z})`);
            const house = this.createHouse(adjustedHouseData, houseId);
            this.houses.push(house);
            this.scene.add(house);

            // Create nameplate for the house
            this.createNameplate(adjustedHouseData, house);
        });

        console.log(`Generated ${this.houses.length} houses total`);
        console.log('Scene children count after adding houses:', this.scene.children.length);
        
        // Add swimming pool with billboard
        this.createSwimmingPool();
    }

    createHouse(houseData, houseId) {
        const houseGroup = new THREE.Group();
        houseGroup.userData = { houseId, houseData };

        // Use proper dimensions (no scaling down)
        const length = parseInt(houseData['building-length']) || 200;
        const width = parseInt(houseData['building-width']) || 200;
        const baseHeight = parseInt(houseData['building-height']) || 150;
        const floors = parseInt(houseData.floors) || 1;
        
        // Calculate floor height
        const floorHeight = baseHeight / floors;

        // Create multi-story building
        this.createMultiStoryBuilding(houseGroup, houseData, length, width, floorHeight, floors);

        // Roof (only on top floor)
        this.createRoof(houseGroup, houseData, length, width, baseHeight);

        // Door (only on ground floor)
        this.createDoor(houseGroup, houseData, length, width, floorHeight);

        // Stairs (if specified)
        if (houseData.stairs === "yes") {
            this.createStairs(houseGroup, houseData, length, width);
        }

        // Add nameboards/flags/displays based on number of floors
        this.createNameDisplay(houseGroup, houseData, length, width, baseHeight, floors);

        // Add moderate decorative elements and ornaments
        this.createDecorations(houseGroup, houseData, length, width, baseHeight);

        // Position the house (use original positions)
        houseGroup.position.set(
            houseData.position.x || 0,
            houseData.position.y || 0,
            houseData.position.z || 0
        );

        console.log(`Created house ${houseId} at position:`, houseGroup.position, 'with dimensions:', length, width, baseHeight);

        return houseGroup;
    }

    createRoof(houseGroup, houseData, length, width, height) {
        const roofColor = houseData['roof-color'] || 0x8B4513;
        const roofType = houseData['roof-type'] || 'pyramid';

        let roofGeometry, roofMesh;

        switch (roofType) {
            case 'pyramid':
                roofGeometry = new THREE.ConeGeometry(
                    Math.max(length, width) * 0.8, 
                    height * 0.6, 
                    4
                );
                roofMesh = new THREE.Mesh(
                    roofGeometry,
                    new THREE.MeshPhongMaterial({ 
                        color: roofColor,
                        shininess: 50
                    })
                );
                roofMesh.position.y = height + height * 0.3;
                roofMesh.rotation.y = Math.PI / 4;
                break;

            case 'gable':
                // Create a more realistic gable roof
                const roofShape = new THREE.Shape();
                roofShape.moveTo(-length/2, 0);
                roofShape.lineTo(length/2, 0);
                roofShape.lineTo(0, height * 0.5);
                roofShape.lineTo(-length/2, 0);
                
                const extrudeSettings = {
                    depth: width,
                    bevelEnabled: false
                };
                
                roofGeometry = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
                roofMesh = new THREE.Mesh(
                    roofGeometry,
                    new THREE.MeshPhongMaterial({ 
                        color: roofColor,
                        shininess: 50
                    })
                );
                roofMesh.position.y = height;
                roofMesh.position.z = -width/2;
                roofMesh.rotation.x = Math.PI / 2;
                break;

            case 'flat':
            default:
                roofGeometry = new THREE.BoxGeometry(length + 5, 3, width + 5);
                roofMesh = new THREE.Mesh(
                    roofGeometry,
                    new THREE.MeshPhongMaterial({ 
                        color: roofColor,
                        shininess: 20
                    })
                );
                roofMesh.position.y = height + 1.5;
                break;
        }

        roofMesh.castShadow = true;
        roofMesh.receiveShadow = true;
        houseGroup.add(roofMesh);
        
        // Add roof edges for better definition
        const roofEdges = new THREE.EdgesGeometry(roofGeometry);
        const roofLineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
        const roofWireframe = new THREE.LineSegments(roofEdges, roofLineMaterial);
        roofWireframe.position.copy(roofMesh.position);
        roofWireframe.rotation.copy(roofMesh.rotation);
        houseGroup.add(roofWireframe);
    }

    createWindows(houseGroup, houseData, length, width, height) {
        const windowColor = houseData['window-color'] || 0x87CEEB;
        const windowCount = parseInt(houseData.windows) || 4;
        
        // Create glass material with reflectivity
        const windowMaterial = new THREE.MeshPhongMaterial({
            color: windowColor,
            transparent: true,
            opacity: 0.7,
            shininess: 100,
            specular: 0x222222
        });

        const windowSize = Math.min(length, width) * 0.15;
        const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize * 0.8);
        
        // Window frame material
        const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const frameGeometry = new THREE.BoxGeometry(windowSize + 2, windowSize * 0.8 + 2, 1);

        // Front windows
        const frontWindowCount = Math.ceil(windowCount / 4);
        for (let i = 0; i < frontWindowCount; i++) {
            const xPos = -length / 3 + (i * (length * 0.8) / Math.max(1, frontWindowCount - 1));
            
            // Window frame
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.set(xPos, height * 0.6, width / 2 + 1);
            houseGroup.add(frame);
            
            // Window glass
            const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
            window1.position.set(xPos, height * 0.6, width / 2 + 1.5);
            houseGroup.add(window1);
        }

        // Side windows
        const sideWindowCount = Math.ceil(windowCount / 4);
        for (let i = 0; i < sideWindowCount; i++) {
            const zPos = -width / 3 + (i * (width * 0.8) / Math.max(1, sideWindowCount - 1));
            
            // Window frame
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.set(length / 2 + 1, height * 0.6, zPos);
            frame.rotation.y = Math.PI / 2;
            houseGroup.add(frame);
            
            // Window glass
            const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
            window2.position.set(length / 2 + 1.5, height * 0.6, zPos);
            window2.rotation.y = Math.PI / 2;
            houseGroup.add(window2);
        }
    }

    createDoor(houseGroup, houseData, length, width, height) {
        const doorColor = houseData['door-color'] || 0x654321;
        
        // Door frame
        const frameGeometry = new THREE.BoxGeometry(length * 0.3, height * 0.8, 2);
        const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const doorFrame = new THREE.Mesh(frameGeometry, frameMaterial);
        doorFrame.position.set(0, height * 0.4, width / 2 + 1);
        doorFrame.castShadow = true;
        houseGroup.add(doorFrame);
        
        // Door
        const doorGeometry = new THREE.BoxGeometry(length * 0.25, height * 0.7, 1);
        const doorMaterial = new THREE.MeshPhongMaterial({ 
            color: doorColor,
            shininess: 30
        });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, height * 0.35, width / 2 + 2);
        door.castShadow = true;
        houseGroup.add(door);

        // Door handle
        const handleGeometry = new THREE.SphereGeometry(1, 8, 8);
        const handleMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFD700,
            shininess: 100
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(length * 0.08, height * 0.35, width / 2 + 2.5);
        houseGroup.add(handle);
        
        // Door window (small)
        const doorWindowGeometry = new THREE.PlaneGeometry(length * 0.15, height * 0.2);
        const doorWindowMaterial = new THREE.MeshPhongMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.8
        });
        const doorWindow = new THREE.Mesh(doorWindowGeometry, doorWindowMaterial);
        doorWindow.position.set(0, height * 0.55, width / 2 + 2.1);
        houseGroup.add(doorWindow);
    }

    createStairs(houseGroup, houseData, length, width) {
        const stairMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        const stepCount = 5;
        const stepWidth = width * 0.3;
        const stepDepth = 20;
        const stepHeight = 5;

        for (let i = 0; i < stepCount; i++) {
            const stepGeometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
            const step = new THREE.Mesh(stepGeometry, stairMaterial);
            step.position.set(
                0,
                (i + 1) * stepHeight / 2,
                width / 2 + stepDepth * (i + 1)
            );
            step.castShadow = true;
            step.receiveShadow = true;
            houseGroup.add(step);
        }
    }

    createNameplate(houseData, house) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        // Create gradient background
        const gradient = context.createLinearGradient(0, 0, 256, 64);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 256, 64);

        // Add border
        context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        context.lineWidth = 2;
        context.strokeRect(2, 2, 252, 60);

        // Add text
        context.fillStyle = 'white';
        context.font = 'bold 18px Arial';
        context.textAlign = 'center';
        context.fillText(houseData.developer || 'Unknown', 128, 40);

        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        });

        // Create nameplate geometry
        const geometry = new THREE.PlaneGeometry(60, 15);
        const nameplate = new THREE.Mesh(geometry, material);

        // Position nameplate above the house
        const houseHeight = parseInt(houseData['building-height']) || 150;
        nameplate.position.set(0, houseHeight + 30, 0);
        nameplate.lookAt(this.camera.position);

        house.add(nameplate);
        this.nameplates.push(nameplate);
    }

    createMultiStoryBuilding(houseGroup, houseData, length, width, floorHeight, floors) {
        for (let floor = 0; floor < floors; floor++) {
            const floorData = houseData[`floor${floor + 1}`] || houseData.floor1 || {};
            
            // Create floor geometry
            const floorGeometry = new THREE.BoxGeometry(length, floorHeight, width);
            
            // Get floor-specific properties or fallback to defaults
            let floorColor = floorData.colour || houseData.colour || 0xffffff;
            
            // Convert color names to hex values
            if (typeof floorColor === 'string') {
                switch(floorColor.toLowerCase()) {
                    case 'white': floorColor = 0xffffff; break;
                    case 'red': floorColor = 0xff0000; break;
                    case 'blue': floorColor = 0x0000ff; break;
                    case 'green': floorColor = 0x00ff00; break;
                    case 'yellow': floorColor = 0xffff00; break;
                    case 'black': floorColor = 0x000000; break;
                    case 'gray': case 'grey': floorColor = 0x808080; break;
                    default: 
                        if (floorColor.startsWith('#')) {
                            floorColor = parseInt(floorColor.slice(1), 16);
                        } else {
                            floorColor = 0xff6b6b; // fallback to bright red for visibility
                        }
                }
            }
            
            console.log(`Floor ${floor + 1} color:`, floorColor);
            
            // Use MeshPhongMaterial for realistic lighting
            const floorMaterial = new THREE.MeshPhongMaterial({
                color: floorColor,
                shininess: 30,
                specular: 0x111111
            });
            
            const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
            floorMesh.position.y = (floor * floorHeight) + (floorHeight / 2);
            floorMesh.castShadow = true;
            floorMesh.receiveShadow = true;
            houseGroup.add(floorMesh);

            // Add subtle floor outline for definition
            const edges = new THREE.EdgesGeometry(floorGeometry);
            const lineMaterial = new THREE.LineBasicMaterial({ 
                color: 0x333333, 
                linewidth: 1,
                transparent: true,
                opacity: 0.3
            });
            const wireframe = new THREE.LineSegments(edges, lineMaterial);
            wireframe.position.y = (floor * floorHeight) + (floorHeight / 2);
            houseGroup.add(wireframe);

            // Create windows for this floor
            this.createFloorWindows(houseGroup, floorData, length, width, floorHeight, floor);
            
            // Add floor separator line (except for top floor)
            if (floor < floors - 1) {
                const separatorGeometry = new THREE.BoxGeometry(length + 2, 2, width + 2);
                const separatorMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
                const separator = new THREE.Mesh(separatorGeometry, separatorMaterial);
                separator.position.y = (floor + 1) * floorHeight;
                houseGroup.add(separator);
            }
        }
    }

    createFloorWindows(houseGroup, floorData, length, width, floorHeight, floorIndex) {
        const windows = floorData.windows || 4;
        const windowSize = Math.min(length, width) * 0.1;
        const windowDepth = 5;

        // Create windows on front and back faces
        for (let i = 0; i < Math.ceil(windows / 2); i++) {
            const spacing = length / (Math.ceil(windows / 2) + 1);
            const xPos = -length / 2 + spacing * (i + 1);
            const yPos = (floorIndex * floorHeight) + (floorHeight / 2);

            // Front windows
            const frontWindow = this.createWindow(windowSize, windowDepth);
            frontWindow.position.set(xPos, yPos, width / 2 + windowDepth / 2);
            houseGroup.add(frontWindow);

            // Back windows (if we have enough windows)
            if (i < Math.floor(windows / 2)) {
                const backWindow = this.createWindow(windowSize, windowDepth);
                backWindow.position.set(xPos, yPos, -width / 2 - windowDepth / 2);
                houseGroup.add(backWindow);
            }
        }
        
        // Add side windows for better lighting
        for (let i = 0; i < Math.ceil(windows / 2); i++) {
            const spacing = width / (Math.ceil(windows / 2) + 1);
            const zPos = -width / 2 + spacing * (i + 1);
            const yPos = (floorIndex * floorHeight) + (floorHeight / 2);

            // Left side windows
            const leftWindow = this.createWindow(windowSize, windowDepth);
            leftWindow.position.set(-length / 2 - windowDepth / 2, yPos, zPos);
            houseGroup.add(leftWindow);

            // Right side windows
            const rightWindow = this.createWindow(windowSize, windowDepth);
            rightWindow.position.set(length / 2 + windowDepth / 2, yPos, zPos);
            houseGroup.add(rightWindow);
        }
    }

    createWindow(size, depth) {
        const windowGroup = new THREE.Group();
        
        // Window frame
        const frameGeometry = new THREE.BoxGeometry(size, size, depth);
        const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        windowGroup.add(frame);

        // Window glass
        const glassGeometry = new THREE.BoxGeometry(size * 0.8, size * 0.8, depth * 0.5);
        const glassMaterial = new THREE.MeshPhongMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.3,
            shininess: 100
        });
        const glass = new THREE.Mesh(glassGeometry, glassMaterial);
        windowGroup.add(glass);

        return windowGroup;
    }

    createNameDisplay(houseGroup, houseData, length, width, totalHeight) {
        const floors = houseData.floors || 1;
        const github = houseData.github || 'Unknown';

        if (floors === 1) {
            this.createNameboard(houseGroup, github, length, width, totalHeight);
        } else if (floors === 2) {
            this.createFlag(houseGroup, github, length, width, totalHeight);
        } else {
            this.createDigitalDisplay(houseGroup, github, length, width, totalHeight);
        }
    }

    createNameboard(houseGroup, github, length, width, totalHeight) {
        // Small wooden nameplate for single-story houses
        const boardWidth = Math.min(length * 0.6, 80);
        const boardHeight = 20;
        const boardDepth = 5;

        const boardGeometry = new THREE.BoxGeometry(boardWidth, boardHeight, boardDepth);
        const boardMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const board = new THREE.Mesh(boardGeometry, boardMaterial);
        
        board.position.set(0, totalHeight * 0.7, width / 2 + boardDepth / 2);
        board.castShadow = true;
        houseGroup.add(board);

        // Add text texture
        this.addTextToNameboard(board, github, boardWidth, boardHeight);

        // Add mounting posts
        const postGeometry = new THREE.CylinderGeometry(2, 2, boardHeight + 10);
        const postMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
        
        const leftPost = new THREE.Mesh(postGeometry, postMaterial);
        leftPost.position.set(-boardWidth / 2 - 5, totalHeight * 0.7 - 5, width / 2 + boardDepth);
        houseGroup.add(leftPost);

        const rightPost = new THREE.Mesh(postGeometry, postMaterial);
        rightPost.position.set(boardWidth / 2 + 5, totalHeight * 0.7 - 5, width / 2 + boardDepth);
        houseGroup.add(rightPost);
    }

    createFlag(houseGroup, github, length, width, totalHeight) {
        // Flag for two-story houses
        const flagWidth = 60;
        const flagHeight = 40;
        const poleHeight = totalHeight + 50;

        // Flag pole
        const poleGeometry = new THREE.CylinderGeometry(2, 2, poleHeight);
        const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(length / 2 + 20, poleHeight / 2, 0);
        pole.castShadow = true;
        houseGroup.add(pole);

        // Flag
        const flagGeometry = new THREE.PlaneGeometry(flagWidth, flagHeight);
        const flagMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x0066cc,
            side: THREE.DoubleSide
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(length / 2 + 20 + flagWidth / 2, totalHeight - 20, 0);
        flag.castShadow = true;
        houseGroup.add(flag);

        // Add text to flag
        this.addTextToFlag(flag, github, flagWidth, flagHeight);

        // Add ropes
        const ropeGeometry = new THREE.CylinderGeometry(0.5, 0.5, flagHeight);
        const ropeMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
        rope.position.set(length / 2 + 20, totalHeight - 20, 0);
        houseGroup.add(rope);
    }

    createDigitalDisplay(houseGroup, github, length, width, totalHeight) {
        // Large digital screen for 3+ story buildings
        const screenWidth = Math.min(length * 0.8, 120);
        const screenHeight = 60;
        const screenDepth = 10;

        // Screen frame
        const frameGeometry = new THREE.BoxGeometry(screenWidth + 10, screenHeight + 10, screenDepth);
        const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(0, totalHeight - 30, width / 2 + screenDepth / 2);
        frame.castShadow = true;
        houseGroup.add(frame);

        // Screen
        const screenGeometry = new THREE.BoxGeometry(screenWidth, screenHeight, screenDepth / 2);
        const screenMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x001122,
            emissive: 0x001122,
            emissiveIntensity: 0.2
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, totalHeight - 30, width / 2 + screenDepth);
        houseGroup.add(screen);

        // Add glowing text effect
        this.addTextToDigitalDisplay(screen, github, screenWidth, screenHeight);

        // Add mounting bracket
        const bracketGeometry = new THREE.BoxGeometry(20, 20, 30);
        const bracketMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
        bracket.position.set(0, totalHeight - 50, width / 2 + 15);
        houseGroup.add(bracket);
    }

    addTextToNameboard(board, text, width, height) {
        // Create a canvas for the text
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // Fill background
        context.fillStyle = '#8B4513';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 20px Arial';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 7);
        
        // Create texture and apply to board
        const texture = new THREE.CanvasTexture(canvas);
        board.material.map = texture;
        board.material.needsUpdate = true;
    }

    addTextToFlag(flag, text, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // Fill background with flag colors
        context.fillStyle = '#0066cc';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 8);
        
        const texture = new THREE.CanvasTexture(canvas);
        flag.material.map = texture;
        flag.material.needsUpdate = true;
    }

    addTextToDigitalDisplay(screen, text, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Fill background with digital display colors
        context.fillStyle = '#001122';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add glowing text effect
        context.shadowColor = '#00ff88';
        context.shadowBlur = 10;
        context.fillStyle = '#00ff88';
        context.font = 'bold 32px monospace';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 10);
        
        // Add GitHub logo or additional decoration
        context.font = 'bold 20px monospace';
        context.fillText('GitHub:', canvas.width / 2, canvas.height / 2 - 30);
        
        const texture = new THREE.CanvasTexture(canvas);
        screen.material.map = texture;
        screen.material.emissiveMap = texture;
        screen.material.needsUpdate = true;
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
        const floors = houseData.floors || 1;
        const github = houseData.github || 'Not specified';
        
        let floorInfo = '';
        for (let i = 1; i <= floors; i++) {
            const floorData = houseData[`floor${i}`];
            if (floorData) {
                floorInfo += `<p><strong>Floor ${i}:</strong> ${floorData.colour || 'Default'} - ${floorData.windows || 0} windows</p>`;
            }
        }
        
        infoDiv.innerHTML = `
            <h3>🏠 House Information</h3>
            <p><strong>Developer:</strong> ${houseData.developer}</p>
            <p><strong>GitHub:</strong> @${github}</p>
            <p><strong>Floors:</strong> ${floors} ${floors > 1 ? 'stories' : 'story'}</p>
            <p><strong>Style:</strong> ${houseData.style || 'Standard'}</p>
            <p><strong>Size:</strong> ${houseData['building-length']}×${houseData['building-width']}×${houseData['building-height']}</p>
            <p><strong>Stairs:</strong> ${houseData.stairs}</p>
            ${floorInfo}
        `;
        infoDiv.style.display = 'block';

        // Hide after 8 seconds (more time for multi-floor info)
        setTimeout(() => {
            infoDiv.style.display = 'none';
        }, 8000);
    }

    createDecorations(houseGroup, houseData, length, width, height) {
        // Add foundation/base
        const foundationGeometry = new THREE.BoxGeometry(length + 20, 10, width + 20);
        const foundationMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B7355,
            shininess: 10
        });
        const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
        foundation.position.y = -5;
        foundation.receiveShadow = true;
        houseGroup.add(foundation);

        // Add chimney for some house styles
        if (houseData.style !== 'minimalist' && Math.random() > 0.5) {
            const chimneyGeometry = new THREE.BoxGeometry(15, height * 0.4, 15);
            const chimneyMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
            const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
            chimney.position.set(
                length * 0.3,
                height + (height * 0.2),
                width * 0.3
            );
            chimney.castShadow = true;
            houseGroup.add(chimney);
        }

        // Add garden/landscaping around the house
        this.addLandscaping(houseGroup, length, width);

        // Add some architectural details based on style
        this.addArchitecturalDetails(houseGroup, houseData, length, width, height);
    }

    addLandscaping(houseGroup, length, width) {
        // Add some bushes/plants around the house
        const bushCount = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < bushCount; i++) {
            const bushGeometry = new THREE.SphereGeometry(8 + Math.random() * 5, 8, 6);
            const bushMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const bush = new THREE.Mesh(bushGeometry, bushMaterial);
            
            const angle = (i / bushCount) * Math.PI * 2;
            const distance = Math.max(length, width) * 0.7 + Math.random() * 20;
            bush.position.set(
                Math.cos(angle) * distance,
                5,
                Math.sin(angle) * distance
            );
            bush.castShadow = true;
            houseGroup.add(bush);
        }

        // Add a small path
        const pathGeometry = new THREE.PlaneGeometry(width + 40, 15);
        const pathMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const path = new THREE.Mesh(pathGeometry, pathMaterial);
        path.rotation.x = -Math.PI / 2;
        path.position.set(0, 0.5, width * 0.7);
        path.receiveShadow = true;
        houseGroup.add(path);
    }

    addArchitecturalDetails(houseGroup, houseData, length, width, height) {
        const style = houseData.style || 'modern';

        switch (style) {
            case 'modern':
                // Add balcony
                this.addBalcony(houseGroup, length, width, height);
                break;
            case 'fantasy':
                // Add tower
                this.addTower(houseGroup, length, width, height);
                break;
            case 'industrial':
                // Add metal details
                this.addMetalDetails(houseGroup, length, width, height);
                break;
            case 'creative':
                // Add colorful elements
                this.addColorfulDetails(houseGroup, length, width, height);
                break;
        }
    }

    addBalcony(houseGroup, length, width, height) {
        const balconyGeometry = new THREE.BoxGeometry(length * 0.8, 5, 20);
        const balconyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xE0E0E0,
            transparent: true,
            opacity: 0.9
        });
        const balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
        balcony.position.set(0, height * 0.7, width * 0.6);
        balcony.castShadow = true;
        houseGroup.add(balcony);

        // Balcony railing
        const railingGeometry = new THREE.BoxGeometry(length * 0.8, 15, 2);
        const railingMaterial = new THREE.MeshPhongMaterial({ color: 0xC0C0C0 });
        const railing = new THREE.Mesh(railingGeometry, railingMaterial);
        railing.position.set(0, height * 0.7 + 10, width * 0.6 + 10);
        houseGroup.add(railing);
    }

    addTower(houseGroup, length, width, height) {
        const towerGeometry = new THREE.CylinderGeometry(25, 30, height * 1.5, 8);
        const towerMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(length * 0.4, height * 0.75, width * 0.4);
        tower.castShadow = true;
        houseGroup.add(tower);

        // Tower roof
        const towerRoofGeometry = new THREE.ConeGeometry(30, 40, 8);
        const towerRoofMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
        const towerRoof = new THREE.Mesh(towerRoofGeometry, towerRoofMaterial);
        towerRoof.position.set(length * 0.4, height * 1.5 + 20, width * 0.4);
        towerRoof.castShadow = true;
        houseGroup.add(towerRoof);
    }

    addMetalDetails(houseGroup, length, width, height) {
        // Add metal pipes
        for (let i = 0; i < 3; i++) {
            const pipeGeometry = new THREE.CylinderGeometry(3, 3, height * 0.8, 8);
            const pipeMaterial = new THREE.MeshPhongMaterial({ color: 0x708090 });
            const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
            pipe.position.set(
                length * 0.4 + i * 15,
                height * 0.4,
                -width * 0.6
            );
            pipe.castShadow = true;
            houseGroup.add(pipe);
        }
    }

    addColorfulDetails(houseGroup, length, width, height) {
        // Add colorful accent strips
        const colors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xFFA07A, 0x98D8C8];
        for (let i = 0; i < 3; i++) {
            const stripGeometry = new THREE.BoxGeometry(length, 8, 2);
            const stripMaterial = new THREE.MeshPhongMaterial({ 
                color: colors[i % colors.length]
            });
            const strip = new THREE.Mesh(stripGeometry, stripMaterial);
            strip.position.set(0, height * 0.3 + i * 20, width * 0.51);
            houseGroup.add(strip);
        }
    }

    createSwimmingPool() {
        const poolGroup = new THREE.Group();
        
        // Pool dimensions - more rectangular like the reference image
        const poolLength = 1000;
        const poolWidth = 500;
        const poolDepth = 60;
        
        // Simple transparent blue water
        const waterGeometry = new THREE.BoxGeometry(poolLength, poolDepth, poolWidth);
        const waterMaterial = new THREE.MeshBasicMaterial({
            color: 0x0099ff,
            transparent: true,
            opacity: 0.6
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.set(600, -poolDepth/2, 600);
        poolGroup.add(water);
        
        // Pool walls - white/light gray
        const wallThickness = 25;
        const wallHeight = poolDepth + 30;
        
        // Create pool walls
        const walls = [
            { pos: [600, wallHeight/2 - poolDepth, 600 + poolWidth/2 + wallThickness/2], size: [poolLength + wallThickness*2, wallHeight, wallThickness] },
            { pos: [600, wallHeight/2 - poolDepth, 600 - poolWidth/2 - wallThickness/2], size: [poolLength + wallThickness*2, wallHeight, wallThickness] },
            { pos: [600 + poolLength/2 + wallThickness/2, wallHeight/2 - poolDepth, 600], size: [wallThickness, wallHeight, poolWidth] },
            { pos: [600 - poolLength/2 - wallThickness/2, wallHeight/2 - poolDepth, 600], size: [wallThickness, wallHeight, poolWidth] }
        ];
        
        walls.forEach(wall => {
            const wallGeometry = new THREE.BoxGeometry(...wall.size);
            const wallMaterial = new THREE.MeshPhongMaterial({ color: 0xf0f0f0 });
            const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
            wallMesh.position.set(...wall.pos);
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            poolGroup.add(wallMesh);
        });
        
        // Pool deck - larger and more realistic
        const deckSize = 150;
        const deckGeometry = new THREE.BoxGeometry(poolLength + deckSize*2, 15, poolWidth + deckSize*2);
        const deckMaterial = new THREE.MeshPhongMaterial({ color: 0xe8e8e8 });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.set(600, -7.5, 600);
        deck.receiveShadow = true;
        poolGroup.add(deck);
        
        // Create larger billboard with image
        this.createPoolBillboard(poolGroup);
        
        // Position the pool in the world
        this.scene.add(poolGroup);
        console.log('Swimming pool created at position (600, 0, 600)');
    }

    createPoolBillboard(poolGroup) {
        // Billboard posts - two sturdy posts
        const postHeight = 300;
        const postWidth = 20;
        
        // Left post
        const leftPostGeometry = new THREE.BoxGeometry(postWidth, postHeight, postWidth);
        const postMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const leftPost = new THREE.Mesh(leftPostGeometry, postMaterial);
        leftPost.position.set(400, postHeight/2, 400);
        leftPost.castShadow = true;
        poolGroup.add(leftPost);
        
        // Right post
        const rightPost = new THREE.Mesh(leftPostGeometry, postMaterial);
        rightPost.position.set(1000, postHeight/2, 400);
        rightPost.castShadow = true;
        poolGroup.add(rightPost);
        
        // Large billboard background frame
        const billboardWidth = 600;
        const billboardHeight = 300;
        const frameThickness = 15;
        
        // Billboard frame
        const frameGeometry = new THREE.BoxGeometry(billboardWidth + frameThickness*2, billboardHeight + frameThickness*2, frameThickness);
        const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x2C3E50 });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(700, 200, 395);
        frame.castShadow = true;
        poolGroup.add(frame);
        
        // Billboard with image texture
        const billboardGeometry = new THREE.PlaneGeometry(billboardWidth, billboardHeight);
        
        // Load the billboard image texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.crossOrigin = 'anonymous';
        const billboardTexture = textureLoader.load(
            '/assets/billboard_pool.png',
            function(texture) {
                console.log('Billboard texture loaded successfully');
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
            },
            function(progress) {
                console.log('Billboard texture loading progress:', progress);
            },
            function(error) {
                console.error('Error loading billboard texture:', error);
                // Fallback to a colored material if image fails
                billboard.material = new THREE.MeshPhongMaterial({ color: 0x4CAF50 });
            }
        );
        
        const billboardMaterial = new THREE.MeshPhongMaterial({ 
            map: billboardTexture,
            transparent: true
        });
        
        const billboard = new THREE.Mesh(billboardGeometry, billboardMaterial);
        billboard.position.set(700, 200, 400);
        billboard.castShadow = true;
        poolGroup.add(billboard);
        
        // Add some decorative elements around the billboard
        const decorSize = 8;
        const decorGeometry = new THREE.SphereGeometry(decorSize, 8, 8);
        const decorMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
        
        // Corner decorations
        const corners = [
            [400 - decorSize, 350, 405],
            [1000 + decorSize, 350, 405],
            [400 - decorSize, 50, 405],
            [1000 + decorSize, 50, 405]
        ];
        
        corners.forEach(pos => {
            const decor = new THREE.Mesh(decorGeometry, decorMaterial);
            decor.position.set(...pos);
            poolGroup.add(decor);
        });
        
        console.log('Large billboard with image texture created');
    }

    createMegaCity() {
        console.log('Creating MASSIVE California-style mega city...');
        
        // CREATE SUBWAY WELLS FIRST - MOST IMPORTANT!
        console.log('🕳️ Creating subway wells...');
        this.createSubwayEntranceGrid();
        
        // Create the mega city road grid system
        this.createMegaCityRoads();
        
        // Create tech headquarters (Google, Microsoft, Meta, Amazon)
        this.createTechHeadquarters();
        
        // Create skyscraper districts
        this.createSkyscraperDistricts();
        
        // Create residential areas
        this.createMegaResidentialAreas();
        
        // Create commercial districts
        this.createMegaCommercialDistricts();
        
        // Create airports and aircraft
        this.createMegaCityAirports();
        
        // Create highway system
        this.createHighwaySystem();
        
        // Create parks and landmarks
        this.createParksAndLandmarks();
        
        console.log('MASSIVE mega city creation completed!');
    }

    createMegaCityRoads() {
        console.log('Creating massive road grid system...');
        
        // Create main avenue grid (like Los Angeles)
        const roadMaterial = this.sharedMaterials?.road?.asphalt || 
                           new THREE.MeshLambertMaterial({ color: 0x2C2C2C });
        
        // Major highways (10+ lanes)
        for (let x = -60000; x <= 60000; x += 10000) {
            const highway = new THREE.Mesh(
                new THREE.BoxGeometry(200, 2, 120000),
                roadMaterial
            );
            highway.position.set(x, 1, 0);
            this.scene.add(highway);
        }
        
        for (let z = -60000; z <= 60000; z += 10000) {
            const highway = new THREE.Mesh(
                new THREE.BoxGeometry(120000, 2, 200),
                roadMaterial
            );
            highway.position.set(0, 1, z);
            this.scene.add(highway);
        }
        
        // Secondary roads
        for (let x = -60000; x <= 60000; x += 2000) {
            const road = new THREE.Mesh(
                new THREE.BoxGeometry(100, 2, 120000),
                roadMaterial
            );
            road.position.set(x, 1, 0);
            this.scene.add(road);
        }
        
        for (let z = -60000; z <= 60000; z += 2000) {
            const road = new THREE.Mesh(
                new THREE.BoxGeometry(120000, 2, 100),
                roadMaterial
            );
            road.position.set(0, 1, z);
            this.scene.add(road);
        }
    }

    createSkyscraperDistricts() {
        console.log('Creating skyscraper districts...');
        
        // Downtown LA style - massive skyscrapers
        const districts = [
            { center: { x: 0, z: 0 }, radius: 5000, name: "Downtown Core" },
            { center: { x: 15000, z: 0 }, radius: 3000, name: "Financial District" },
            { center: { x: -15000, z: 0 }, radius: 3000, name: "Tech District" },
            { center: { x: 0, z: 15000 }, radius: 4000, name: "Business Center" },
            { center: { x: 0, z: -15000 }, radius: 4000, name: "Innovation Hub" }
        ];
        
        districts.forEach(district => {
            this.createSkyscraperDistrict(district.center.x, district.center.z, district.radius);
        });
    }

    createSkyscraperDistrict(centerX, centerZ, radius) {
        const buildingMaterial = this.sharedMaterials?.building?.basic || 
                               new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
        const glassMaterial = this.sharedMaterials?.building?.glass || 
                            new THREE.MeshLambertMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.7 });
        
        // Create 50-100 massive skyscrapers per district
        for (let i = 0; i < 80; i++) {
            const angle = (i / 80) * Math.PI * 2;
            const distance = Math.random() * radius;
            const x = centerX + Math.cos(angle) * distance;
            const z = centerZ + Math.sin(angle) * distance;
            
            // Massive building dimensions
            const width = 300 + Math.random() * 500;
            const depth = 300 + Math.random() * 500;
            const height = 1000 + Math.random() * 3000; // 1km to 4km tall!
            
            const building = new THREE.Mesh(
                new THREE.BoxGeometry(width, height, depth),
                Math.random() > 0.5 ? buildingMaterial : glassMaterial
            );
            
            building.position.set(x, height / 2, z);
            this.scene.add(building);
            
            // Add windows
            this.addMegaBuildingWindows(building, width, height, depth);
            
            // Add rooftop elements
            if (Math.random() > 0.7) {
                this.addRotopElements(building, width, height, depth);
            }
        }
    }

    addMegaBuildingWindows(building, width, height, depth) {
        const windowMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a90e2, 
            transparent: true, 
            opacity: 0.8 
        });
        
        // Add windows on all sides
        const windowSize = 20;
        const windowSpacing = 40;
        
        // Front and back faces
        for (let y = windowSpacing; y < height - windowSpacing; y += windowSpacing * 2) {
            for (let x = -width/2 + windowSpacing; x < width/2 - windowSpacing; x += windowSpacing) {
                // Front face
                const windowFront = new THREE.Mesh(
                    new THREE.BoxGeometry(windowSize, windowSize, 2),
                    windowMaterial
                );
                windowFront.position.set(x, y - height/2, depth/2 + 1);
                building.add(windowFront);
                
                // Back face
                const windowBack = new THREE.Mesh(
                    new THREE.BoxGeometry(windowSize, windowSize, 2),
                    windowMaterial
                );
                windowBack.position.set(x, y - height/2, -depth/2 - 1);
                building.add(windowBack);
            }
        }
        
        // Left and right faces
        for (let y = windowSpacing; y < height - windowSpacing; y += windowSpacing * 2) {
            for (let z = -depth/2 + windowSpacing; z < depth/2 - windowSpacing; z += windowSpacing) {
                // Left face
                const windowLeft = new THREE.Mesh(
                    new THREE.BoxGeometry(2, windowSize, windowSize),
                    windowMaterial
                );
                windowLeft.position.set(-width/2 - 1, y - height/2, z);
                building.add(windowLeft);
                
                // Right face
                const windowRight = new THREE.Mesh(
                    new THREE.BoxGeometry(2, windowSize, windowSize),
                    windowMaterial
                );
                windowRight.position.set(width/2 + 1, y - height/2, z);
                building.add(windowRight);
            }
        }
    }

    createNameDisplay(houseGroup, houseData, length, width, totalHeight) {
        const floors = houseData.floors || 1;
        const github = houseData.github || 'Unknown';

        if (floors === 1) {
            this.createNameboard(houseGroup, github, length, width, totalHeight);
        } else if (floors === 2) {
            this.createFlag(houseGroup, github, length, width, totalHeight);
        } else {
            this.createDigitalDisplay(houseGroup, github, length, width, totalHeight);
        }
    }

    createNameboard(houseGroup, github, length, width, totalHeight) {
        // Small wooden nameplate for single-story houses
        const boardWidth = Math.min(length * 0.6, 80);
        const boardHeight = 20;
        const boardDepth = 5;

        const boardGeometry = new THREE.BoxGeometry(boardWidth, boardHeight, boardDepth);
        const boardMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const board = new THREE.Mesh(boardGeometry, boardMaterial);
        
        board.position.set(0, totalHeight * 0.7, width / 2 + boardDepth / 2);
        board.castShadow = true;
        houseGroup.add(board);

        // Add text texture
        this.addTextToNameboard(board, github, boardWidth, boardHeight);

        // Add mounting posts
        const postGeometry = new THREE.CylinderGeometry(2, 2, boardHeight + 10);
        const postMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });
        
        const leftPost = new THREE.Mesh(postGeometry, postMaterial);
        leftPost.position.set(-boardWidth / 2 - 5, totalHeight * 0.7 - 5, width / 2 + boardDepth);
        houseGroup.add(leftPost);

        const rightPost = new THREE.Mesh(postGeometry, postMaterial);
        rightPost.position.set(boardWidth / 2 + 5, totalHeight * 0.7 - 5, width / 2 + boardDepth);
        houseGroup.add(rightPost);
    }

    createFlag(houseGroup, github, length, width, totalHeight) {
        // Flag for two-story houses
        const flagWidth = 60;
        const flagHeight = 40;
        const poleHeight = totalHeight + 50;

        // Flag pole
        const poleGeometry = new THREE.CylinderGeometry(2, 2, poleHeight);
        const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(length / 2 + 20, poleHeight / 2, 0);
        pole.castShadow = true;
        houseGroup.add(pole);

        // Flag
        const flagGeometry = new THREE.PlaneGeometry(flagWidth, flagHeight);
        const flagMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x0066cc,
            side: THREE.DoubleSide
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(length / 2 + 20 + flagWidth / 2, totalHeight - 20, 0);
        flag.castShadow = true;
        houseGroup.add(flag);

        // Add text to flag
        this.addTextToFlag(flag, github, flagWidth, flagHeight);

        // Add ropes
        const ropeGeometry = new THREE.CylinderGeometry(0.5, 0.5, flagHeight);
        const ropeMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
        rope.position.set(length / 2 + 20, totalHeight - 20, 0);
        houseGroup.add(rope);
    }

    createDigitalDisplay(houseGroup, github, length, width, totalHeight) {
        // Large digital screen for 3+ story buildings
        const screenWidth = Math.min(length * 0.8, 120);
        const screenHeight = 60;
        const screenDepth = 10;

        // Screen frame
        const frameGeometry = new THREE.BoxGeometry(screenWidth + 10, screenHeight + 10, screenDepth);
        const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(0, totalHeight - 30, width / 2 + screenDepth / 2);
        frame.castShadow = true;
        houseGroup.add(frame);

        // Screen
        const screenGeometry = new THREE.BoxGeometry(screenWidth, screenHeight, screenDepth / 2);
        const screenMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x001122,
            emissive: 0x001122,
            emissiveIntensity: 0.2
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, totalHeight - 30, width / 2 + screenDepth);
        houseGroup.add(screen);

        // Add glowing text effect
        this.addTextToDigitalDisplay(screen, github, screenWidth, screenHeight);

        // Add mounting bracket
        const bracketGeometry = new THREE.BoxGeometry(20, 20, 30);
        const bracketMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
        bracket.position.set(0, totalHeight - 50, width / 2 + 15);
        houseGroup.add(bracket);
    }

    addTextToNameboard(board, text, width, height) {
        // Create a canvas for the text
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // Fill background
        context.fillStyle = '#8B4513';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 20px Arial';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 7);
        
        // Create texture and apply to board
        const texture = new THREE.CanvasTexture(canvas);
        board.material.map = texture;
        board.material.needsUpdate = true;
    }

    addTextToFlag(flag, text, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // Fill background with flag colors
        context.fillStyle = '#0066cc';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 8);
        
        const texture = new THREE.CanvasTexture(canvas);
        flag.material.map = texture;
        flag.material.needsUpdate = true;
    }

    addTextToDigitalDisplay(screen, text, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Fill background with digital display colors
        context.fillStyle = '#001122';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add glowing text effect
        context.shadowColor = '#00ff88';
        context.shadowBlur = 10;
        context.fillStyle = '#00ff88';
        context.font = 'bold 32px monospace';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 10);
        
        // Add GitHub logo or additional decoration
        context.font = 'bold 20px monospace';
        context.fillText('GitHub:', canvas.width / 2, canvas.height / 2 - 30);
        
        const texture = new THREE.CanvasTexture(canvas);
        screen.material.map = texture;
        screen.material.emissiveMap = texture;
        screen.material.needsUpdate = true;
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
        const floors = houseData.floors || 1;
        const github = houseData.github || 'Not specified';
        
        let floorInfo = '';
        for (let i = 1; i <= floors; i++) {
            const floorData = houseData[`floor${i}`];
            if (floorData) {
                floorInfo += `<p><strong>Floor ${i}:</strong> ${floorData.colour || 'Default'} - ${floorData.windows || 0} windows</p>`;
            }
        }
        
        infoDiv.innerHTML = `
            <h3>🏠 House Information</h3>
            <p><strong>Developer:</strong> ${houseData.developer}</p>
            <p><strong>GitHub:</strong> @${github}</p>
            <p><strong>Floors:</strong> ${floors} ${floors > 1 ? 'stories' : 'story'}</p>
            <p><strong>Style:</strong> ${houseData.style || 'Standard'}</p>
            <p><strong>Size:</strong> ${houseData['building-length']}×${houseData['building-width']}×${houseData['building-height']}</p>
            <p><strong>Stairs:</strong> ${houseData.stairs}</p>
            ${floorInfo}
        `;
        infoDiv.style.display = 'block';

        // Hide after 8 seconds (more time for multi-floor info)
        setTimeout(() => {
            infoDiv.style.display = 'none';
        }, 8000);
    }

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
    
    createUndergroundTerrain() {
        // Create minecraft-style cave environment
        const caveSize = this.isLowMemory ? 5000 : 10000;
        
        // Create cave floor with stone texture
        const floorGeometry = new THREE.PlaneGeometry(caveSize, caveSize, 50, 50);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x808080, // Gray stone like minecraft
            side: THREE.DoubleSide
        });
        
        // Add some variation to floor
        const floorVertices = floorGeometry.attributes.position.array;
        for (let i = 0; i < floorVertices.length; i += 3) {
            floorVertices[i + 1] = Math.random() * 2; // Small height variations
        }
        
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -5;
        floor.receiveShadow = true;
        this.undergroundGroup.add(floor);
        
        // Create a water pool in the middle (blue like in the screenshot)
        const waterGeometry = new THREE.PlaneGeometry(100, 300);
        const waterMaterial = new THREE.MeshLambertMaterial({
            color: 0x3399ff,
            transparent: true,
            opacity: 0.8
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.y = -3;
        this.undergroundGroup.add(water);
        
        // Create cave walls with stone blocks texture
        this.createCaveWalls();
        
        // Create cave ceiling with hanging vines
        this.createCaveCeiling();
        
        // Create the cave greenery (vines and plants)
        this.createCaveGreenery();
    }
    
    createCaveWalls() {
        // Create minecraft-style stone walls
        const wallHeight = 60;
        const wallLength = 400;
        
        // Stone wall texture - left wall
        const leftWallGeometry = new THREE.BoxGeometry(10, wallHeight, wallLength);
        const wallMaterial = new THREE.MeshLambertMaterial({
            color: 0xaaaaaa // Light gray stone
        });
        const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.position.set(-150, wallHeight/2 - 5, 0);
        this.undergroundGroup.add(leftWall);
        
        // Right wall
        const rightWall = leftWall.clone();
        rightWall.position.set(150, wallHeight/2 - 5, 0);
        this.undergroundGroup.add(rightWall);
        
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
            const z = (Math.random() - 0.5) * wallLength;
            
            mossyBlock.position.set(x, y, z);
            this.undergroundGroup.add(mossyBlock);
        }
    }
    
    createCaveCeiling() {
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
        ceiling.position.y = 50; // 50 units high ceiling
        this.undergroundGroup.add(ceiling);
    }
    
    createCaveGreenery() {
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
            
            this.undergroundGroup.add(vine);
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
            this.undergroundGroup.add(plant);
            
            // Add light source at plant location
            const plantLight = new THREE.PointLight(0x90ee90, 1, 50);
            plantLight.position.copy(plant.position);
            this.undergroundGroup.add(plantLight);
        }
    }
    
    createUndergroundLighting() {
        // Dim ambient lighting for cave atmosphere
        const undergroundAmbient = new THREE.AmbientLight(0x666666, 0.4); // Dim gray ambient light
        this.undergroundGroup.add(undergroundAmbient);
        
        // Add minecraft-style cave lighting
        
        // Blue light from water
        const waterLight = new THREE.PointLight(0x3399ff, 2, 150);
        waterLight.position.set(0, 10, 0);
        this.undergroundGroup.add(waterLight);
        
        // Scattered torch lights around the cave
        const torchPositions = [
            { x: -140, y: 30, z: -150 },
            { x: -140, y: 30, z: 0 },
            { x: -140, y: 30, z: 150 },
            { x: 140, y: 30, z: -150 },
            { x: 140, y: 30, z: 0 },
            { x: 140, y: 30, z: 150 },
            { x: -70, y: 40, z: -180 },
            { x: 70, y: 40, z: 180 }
        ];
        
        torchPositions.forEach((pos, index) => {
            // Create torch light
            const torchLight = new THREE.PointLight(0xff9933, 2, 100); // Orange-yellow light
            torchLight.position.set(pos.x, pos.y, pos.z);
            this.undergroundGroup.add(torchLight);
            
            // Create torch object
            const torchGeometry = new THREE.BoxGeometry(5, 10, 5);
            const torchMaterial = new THREE.MeshLambertMaterial({
                color: 0x8b4513, // Brown
                emissive: 0xff4500,
                emissiveIntensity: 0.8
            });
            
            const torch = new THREE.Mesh(torchGeometry, torchMaterial);
            torch.position.copy(torchLight.position);
            this.undergroundGroup.add(torch);
            
            // Animate torch flicker
            const flickerSpeed = 0.05 + Math.random() * 0.1;
            const flickerIntensity = 0.5 + Math.random() * 1.5;
            
            const animateTorch = () => {
                const time = Date.now() * flickerSpeed;
                torchLight.intensity = flickerIntensity + Math.sin(time) * 0.5;
                requestAnimationFrame(animateTorch);
            };
            
            animateTorch();
        });
        
        // Add green glow from plants
        const greenGlow = new THREE.AmbientLight(0x004400, 0.2);
        this.undergroundGroup.add(greenGlow);
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
    
    generateUndergroundBuildings() {
        const buildingCount = this.isLowMemory ? 15 : 30;
        const cityRadius = this.isLowMemory ? 3000 : 6000;
        
        // Create main underground plaza/square
        this.createUndergroundPlaza();
        
        // Generate underground buildings in a grid pattern
        const gridSize = Math.sqrt(buildingCount);
        const spacing = (cityRadius * 2) / gridSize;
        
        for (let i = 0; i < buildingCount; i++) {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            
            const x = (col - gridSize/2) * spacing + (Math.random() - 0.5) * spacing * 0.3;
            const z = (row - gridSize/2) * spacing + (Math.random() - 0.5) * spacing * 0.3;
            
            // Skip center area for plaza
            if (Math.abs(x) < spacing && Math.abs(z) < spacing) continue;
            
            this.createUndergroundBuilding(x, z);
        }
    }
    
    createUndergroundPlaza() {
        // Central plaza with special lighting
        const plazaGeometry = new THREE.CircleGeometry(200, 32);
        const plazaMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4a4a4a // Lighter stone for plaza
        });
        
        const plaza = new THREE.Mesh(plazaGeometry, plazaMaterial);
        plaza.rotation.x = -Math.PI / 2;
        plaza.position.y = 1;
        this.undergroundGroup.add(plaza);
        
        // Central fountain/monument
        const monumentGeometry = new THREE.CylinderGeometry(20, 30, 40, 8);
        const monumentMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
        const monument = new THREE.Mesh(monumentGeometry, monumentMaterial);
        monument.position.set(0, 20, 0);
        this.undergroundGroup.add(monument);
        
        // Plaza torches
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const torchX = Math.cos(angle) * 150;
            const torchZ = Math.sin(angle) * 150;
            this.createTorch(torchX, 0, torchZ);
        }
    }
    
    createUndergroundBuilding(x, z) {
        const buildingGroup = new THREE.Group();
        
        // Building dimensions
        const width = 60 + Math.random() * 40;
        const depth = 60 + Math.random() * 40;
        const height = 30 + Math.random() * 30; // Lower than surface buildings
        
        // Main building structure
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color().setHSL(0.1, 0.1, 0.2 + Math.random() * 0.2) // Dark stone colors
        });
        
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, height/2, z);
        building.castShadow = !this.isLowMemory;
        building.receiveShadow = true;
        buildingGroup.add(building);
        
        // Add torch lighting to building
        this.createTorch(x + width/2 + 10, 0, z);
        this.createTorch(x - width/2 - 10, 0, z);
        
        // Add windows with warm glow
        this.createUndergroundWindows(buildingGroup, width, height, depth);
        
        buildingGroup.position.set(0, 0, 0);
        this.undergroundGroup.add(buildingGroup);
        
        return buildingGroup;
    }
    
    createUndergroundWindows(buildingGroup, width, height, depth) {
        const windowsPerSide = Math.floor(width / 20);
        const windowHeight = height * 0.6;
        
        // Front and back windows
        for (let i = 0; i < windowsPerSide; i++) {
            const windowX = (i - windowsPerSide/2) * 18;
            
            // Front windows
            const frontWindow = this.createGlowingWindow();
            frontWindow.position.set(windowX, windowHeight/2, depth/2 + 1);
            buildingGroup.add(frontWindow);
            
            // Back windows
            const backWindow = this.createGlowingWindow();
            backWindow.position.set(windowX, windowHeight/2, -depth/2 - 1);
            buildingGroup.add(backWindow);
        }
        
        // Side windows
        for (let i = 0; i < windowsPerSide; i++) {
            const windowZ = (i - windowsPerSide/2) * 18;
            
            // Left side windows
            const leftWindow = this.createGlowingWindow();
            leftWindow.position.set(-width/2 - 1, windowHeight/2, windowZ);
            buildingGroup.add(leftWindow);

            // Right side windows
            const rightWindow = this.createGlowingWindow();
            rightWindow.position.set(width/2 + 1, windowHeight/2, windowZ);
            buildingGroup.add(rightWindow);
        }
    }
    
    createGlowingWindow() {
        const windowGroup = new THREE.Group();
        
        // Window frame
        const frameGeometry = new THREE.PlaneGeometry(12, 8);
        const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        windowGroup.add(frame);
        
        // Glowing interior light
        const glowGeometry = new THREE.PlaneGeometry(10, 6);
        const glowMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffaa44,
            transparent: true,
            opacity: 0.8,
            emissive: 0xffaa44,
            emissiveIntensity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.5;
        windowGroup.add(glow);
        
        return windowGroup;
    }
    
    createTorchSystem() {
        const torchCount = this.isLowMemory ? 20 : 40;
        const cityRadius = this.isLowMemory ? 3000 : 6000;
        
        for (let i = 0; i < torchCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * cityRadius;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            this.createTorch(x, 0, z);
        }
    }
    
    createTorch(x, y, z) {
        const torchGroup = new THREE.Group();
        
        // Torch pole
        const poleGeometry = new THREE.CylinderGeometry(1, 1, 25);
        const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3426 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 12.5;
        torchGroup.add(pole);
        
        // Torch flame effect
        const flameGeometry = new THREE.SphereGeometry(3, 8, 6);
        const flameMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff6600,
            transparent: true,
            opacity: 0.7,
            emissive: 0xff4400,
            emissiveIntensity: 0.5
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.y = 27;
        flame.scale.y = 1.5; // Make flame taller
        torchGroup.add(flame);
        
        // Point light for torch
        if (!this.isLowMemory) {
            const torchLight = new THREE.PointLight(0xff6600, 1, 100);
            torchLight.position.set(0, 27, 0);
            torchLight.castShadow = false; // Keep performance reasonable
            torchGroup.add(torchLight);
        }
        
        torchGroup.position.set(x, y, z);
        this.undergroundGroup.add(torchGroup);
        
        // Animate flame
        const animate = () => {
            flame.rotation.y += 0.02;
            flame.scale.x = 1 + Math.sin(Date.now() * 0.01) * 0.1;
            flame.scale.z = 1 + Math.cos(Date.now() * 0.012) * 0.1;
            requestAnimationFrame(animate);
        };
        if (!this.isLowMemory) animate();
        
        return torchGroup;
    }
    
    createSubwayEntrances() {
        console.log('🚇 Creating subway entrance system...');
        
        // Generate subway entrances every 400 meters in a grid pattern
        const spacing = 400; // 400 meters apart
        const gridSize = this.isLowMemory ? 5 : 7; // 5x5 or 7x7 grid
        const totalArea = gridSize * spacing;
        const offset = totalArea / 2;
        
        this.subwayEntrances = [];
        let stationId = 1;
        
        // Generate grid of subway stations
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                // Skip center for main plaza
                if (i === Math.floor(gridSize/2) && j === Math.floor(gridSize/2)) continue;
                
                const x = (i * spacing) - offset;
                const z = (j * spacing) - offset;
                
                // Generate station names
                const directions = ['North', 'South', 'East', 'West', 'Central', 'Plaza', 'Terminal', 'Junction'];
                const types = ['Station', 'Metro', 'Transit', 'Hub', 'Gateway', 'Portal'];
                const stationName = `${directions[stationId % directions.length]} ${types[(stationId + 3) % types.length]} ${stationId}`;
                
                const entrance = this.createSubwayEntrance(x, z, stationName);
                this.subwayEntrances.push({
                    position: { x: x, z: z },
                    mesh: entrance,
                    name: stationName,
                    id: stationId
                });
                
                stationId++;
            }
        }
        
        console.log(`✅ Created ${this.subwayEntrances.length} subway entrances in ${gridSize}x${gridSize} grid`);
        
        // Make subway stations available to building popup system
        this.subwayStations = this.subwayEntrances.map(entrance => entrance.mesh);
        
        // Also expose in window for easy access
        if (typeof window !== 'undefined') {
            if (!window.world) window.world = {};
            window.world.subwayStations = this.subwayStations;
        }
    }
    
    createSubwayEntrance(x, z, stationName) {
        const entranceGroup = new THREE.Group();
        
        // CREATE MASSIVE VISIBLE WELL ENTRANCE - IMPOSSIBLE TO MISS!
        
        // HUGE BRIGHT COLORED PLATFORM - 100 UNIT RADIUS!
        const platformGeometry = new THREE.CylinderGeometry(100, 110, 15, 16);
        const platformMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xff0000,  // BRIGHT RED
            emissive: 0xff0000,
            emissiveIntensity: 1.0
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = 7.5;
        entranceGroup.add(platform);
        
        // ENORMOUS WELL HOLE - 80 UNIT RADIUS!
        const holeGeometry = new THREE.CylinderGeometry(80, 80, 200, 16);
        const holeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x000000,  // Black hole
            transparent: true,
            opacity: 0.9
        });
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        hole.position.y = -95; // Deep underground
        entranceGroup.add(hole);
        
        // MASSIVE GLOWING RING AT SURFACE
        const ringGeometry = new THREE.TorusGeometry(90, 10, 8, 16);
        const ringMaterial = new THREE.MeshLambertMaterial({
            color: 0x00ff00,  // BRIGHT GREEN
            emissive: 0x00ff00,
            emissiveIntensity: 1.5
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.y = 15;
        ring.rotation.x = -Math.PI / 2;
        entranceGroup.add(ring);
        
        // GIANT YELLOW WARNING MARKERS
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const markerX = Math.cos(angle) * 120;
            const markerZ = Math.sin(angle) * 120;
            
            const markerGeometry = new THREE.CylinderGeometry(15, 20, 50, 8);
            const markerMaterial = new THREE.MeshLambertMaterial({
                color: 0xffff00,  // BRIGHT YELLOW
                emissive: 0xffff00,
                emissiveIntensity: 1.2
            });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(markerX, 25, markerZ);
            entranceGroup.add(marker);
        }
        
        // MASSIVE BLUE LIGHT BEACON IN CENTER
        const beaconGeometry = new THREE.CylinderGeometry(25, 30, 100, 8);
        const beaconMaterial = new THREE.MeshLambertMaterial({
            color: 0x0000ff,  // BRIGHT BLUE
            emissive: 0x0000ff,
            emissiveIntensity: 2.0
        });
        const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beacon.position.y = 50;
        entranceGroup.add(beacon);
        
        // EXTREME LIGHTING SYSTEM
        const megaLight1 = new THREE.PointLight(0xff0000, 100.0, 1000);
        megaLight1.position.set(0, 50, 0);
        entranceGroup.add(megaLight1);
        
        const megaLight2 = new THREE.PointLight(0x00ff00, 80.0, 800);
        megaLight2.position.set(0, 30, 0);
        entranceGroup.add(megaLight2);
        
        const megaLight3 = new THREE.PointLight(0x0000ff, 60.0, 600);
        megaLight3.position.set(0, 100, 0);
        entranceGroup.add(megaLight3);
        
        // Position the entrance group
        entranceGroup.position.set(x, 0, z);
        entranceGroup.userData = { 
            type: 'subway_well', 
            stationName: stationName,
            name: stationName,
            coordinates: { x: x, z: z },
            wellRadius: 80  // Huge radius for collision
        };
        this.scene.add(entranceGroup);
        
        // Store this well for collision checking
        if (!this.subwayWells) {
            this.subwayWells = [];
        }
        this.subwayWells.push({
            x: x,
            z: z,
            radius: 80,  // Huge collision radius
            name: stationName
        });
        
        // CRAZY ANIMATION EFFECTS
        const animateWell = () => {
            const time = Date.now() * 0.008;
            
            // Flash all components
            ring.material.emissiveIntensity = 1.5 + Math.sin(time * 4) * 1.0;
            ring.rotation.z += 0.05;
            
            beacon.material.emissiveIntensity = 2.0 + Math.sin(time * 6) * 1.0;
            beacon.rotation.y += 0.08;
            
            platform.material.emissiveIntensity = 1.0 + Math.sin(time * 3) * 0.8;
            
            // Animate markers
            entranceGroup.children.forEach((child, index) => {
                if (child.geometry && child.geometry.type === 'CylinderGeometry' && child.material.color.getHex() === 0xffff00) {
                    child.material.emissiveIntensity = 1.2 + Math.sin(time + index) * 0.8;
                    child.rotation.y += 0.03 * (index + 1);
                }
            });
            
            requestAnimationFrame(animateWell);
        };
        animateWell();
        
        console.log(`🕳️ CREATED MASSIVE SUBWAY WELL: ${stationName} at (${x}, 0, ${z}) - Radius: 80 units!`);
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
}