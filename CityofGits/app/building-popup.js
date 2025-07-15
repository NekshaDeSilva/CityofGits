class BuildingPopupSystem {
    constructor() {
        this.popup = null;
        this.overlay = null;
        this.isInitialized = false;
        this.currentBuilding = null;
        this.detectionRadius = 100; // MUCH LARGER detection radius for ALL ANGLES
        this.interactionHint = null;
        this.navigationOverlay = null;
        this.isNavigationOpen = false;
        this.debugMode = false; // Enable for enhanced debugging
        
        // Building database with social media and personal information (includes underground areas)
        this.buildingData = {
            'building_1': {
                name: 'Lotus Tower',
                type: 'Telecommunications Tower',
                owner: 'Government of Sri Lanka',
                bio: 'The tallest self-supported structure in South Asia, serving as a telecommunications hub and iconic landmark for Sri Lanka. A symbol of modern engineering and national pride.',
                description: 'Standing at 356 meters, Lotus Tower is a telecommunications facility and tourist attraction offering panoramic views of Colombo and beyond.',
                height: '356m',
                floors: 17,
                year: 2019,
                verified: 1,
                taxId: 'LK-TAX-2019-LT001',
                github: '',
                twitter: 'lotustowerlk',
                linkedin: 'company/lotus-tower-sri-lanka',
                instagram: 'lotustowerlk',
                website: 'https://lotustower.lk',
                coordinates: { x: 0, z: 0 }
            },
            'building_2': {
                name: 'Google India Office',
                type: 'Technology Campus',
                owner: 'Sundar Pichai',
                bio: 'CEO of Google and Alphabet Inc. Leading one of the world\'s most influential technology companies, driving innovation in AI, cloud computing, and digital transformation globally.',
                description: 'Google\'s state-of-the-art technology campus in India, featuring modern workspaces, innovation labs, and facilities supporting thousands of engineers and developers.',
                height: '85m',
                floors: 22,
                year: 2004,
                verified: 1,
                taxId: 'IN-TAX-2004-GGL001',
                github: 'google',
                twitter: 'googleindia',
                linkedin: 'company/google',
                instagram: 'google',
                website: 'https://google.co.in',
                coordinates: { x: 100, z: 100 }
            },
            'building_3': {
                name: 'Cinnamon Grand Colombo',
                type: 'Luxury Hotel',
                owner: 'John Keells Holdings',
                bio: 'Premier hospitality group in Sri Lanka offering world-class luxury accommodations and dining experiences. Setting the standard for exceptional service and Sri Lankan hospitality.',
                description: 'Iconic 5-star luxury hotel in the heart of Colombo, featuring elegant accommodations, fine dining restaurants, and premium business facilities.',
                height: '120m',
                floors: 27,
                year: 1984,
                verified: 1,
                taxId: 'LK-TAX-1984-CIN001',
                github: '',
                twitter: 'cinnamongrand',
                linkedin: 'company/cinnamon-hotels-resorts',
                instagram: 'cinnamongrandcolombo',
                website: 'https://cinnamonhotels.com',
                coordinates: { x: 200, z: 200 }
            },
            'building_4': {
                name: 'Hilton Colombo',
                type: 'International Hotel',
                owner: 'Hilton Hotels Corporation',
                bio: 'Global hospitality leader providing exceptional guest experiences across luxury hotels and resorts worldwide. Known for innovative service and commitment to excellence.',
                description: 'Prestigious international hotel offering luxury accommodations with stunning ocean views, premium amenities, and world-class conference facilities.',
                height: '140m',
                floors: 28,
                year: 1967,
                verified: 1,
                taxId: 'LK-TAX-1967-HIL001',
                github: '',
                twitter: 'hiltoncolombo',
                linkedin: 'company/hilton',
                instagram: 'hiltoncolombo',
                website: 'https://hilton.com',
                coordinates: { x: 300, z: 300 }
            },
            'building_5': {
                name: 'Infosys Bangalore Campus',
                type: 'IT Services Campus',
                owner: 'N. R. Narayana Murthy',
                bio: 'Co-founder and Chairman Emeritus of Infosys. Pioneering leader in India\'s IT revolution, building one of the world\'s leading technology consulting companies.',
                description: 'World-class IT campus and training facility, home to thousands of software engineers developing cutting-edge solutions for global Fortune 500 clients.',
                height: '65m',
                floors: 15,
                year: 1981,
                verified: 1,
                taxId: 'IN-TAX-1981-INF001',
                github: 'infosys',
                twitter: 'infosys',
                linkedin: 'company/infosys',
                instagram: 'infosys',
                website: 'https://infosys.com',
                coordinates: { x: 400, z: 400 }
            },
            'underground_1': {
                name: 'Central Metro Station',
                type: 'Underground Transit Hub',
                owner: 'Metro Transit Authority',
                bio: 'Advanced underground transportation network connecting major districts across the city. Features modern facilities, digital displays, and high-speed rail connections.',
                description: 'State-of-the-art underground metro station with multiple platforms, automated ticketing systems, and seamless connections to surface transportation.',
                depth: '25m underground',
                platforms: 4,
                year: 2018,
                verified: 1,
                taxId: 'METRO-2018-CS001',
                github: '',
                twitter: 'citymetrosystem',
                linkedin: 'company/metro-transit-authority',
                instagram: 'centralmetrostation',
                website: 'https://metrotransit.city',
                coordinates: { x: 50, z: 50 },
                isUnderground: true
            },
            'underground_2': {
                name: 'Shopping Underground Plaza',
                type: 'Underground Commercial Center',
                owner: 'Plaza Development Corp',
                bio: 'Expansive underground shopping complex featuring international brands, dining courts, and entertainment facilities. A modern urban retail destination.',
                description: 'Multi-level underground shopping center with over 200 stores, restaurants, cafes, and entertainment venues connected to the metro system.',
                depth: '15m underground',
                stores: 200,
                year: 2020,
                verified: 1,
                taxId: 'UG-TAX-2020-SP001',
                github: '',
                twitter: 'undergroundplaza',
                linkedin: 'company/plaza-development',
                instagram: 'shoppingplaza_ug',
                website: 'https://undergroundplaza.com',
                coordinates: { x: -100, z: -100 },
                isUnderground: true
            },
            'underground_3': {
                name: 'Tech Data Center',
                type: 'Underground Server Facility',
                owner: 'TechCore Solutions',
                bio: 'Critical infrastructure facility housing servers and data centers for major tech companies. Ensures 99.9% uptime with advanced cooling and security systems.',
                description: 'High-security underground data center with redundant power systems, climate control, and 24/7 monitoring for enterprise clients.',
                depth: '30m underground',
                servers: 10000,
                year: 2019,
                verified: 1,
                taxId: 'TECH-2019-DC001',
                github: 'techcore-solutions',
                twitter: 'techcoredatacenter',
                linkedin: 'company/techcore-solutions',
                instagram: 'techcore_datacenter',
                website: 'https://techcore.solutions',
                coordinates: { x: 150, z: -150 },
                isUnderground: true
            }
        };
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
        
        // Add some debugging for testing
        console.log('🏗️ BuildingPopupSystem initialized with buildings:', Object.keys(this.buildingData));
        
        // Create underground entrances when world is ready
        this.waitForWorldAndCreateEntrances();
        
        this.isInitialized = true;
    }

    setupElements() {
        this.popup = document.getElementById('building-info-popup');
        this.overlay = document.getElementById('popup-overlay');
        
        if (!this.popup || !this.overlay) {
            console.warn('Building popup elements not found in DOM');
            return;
        }

        // Setup event listeners
        this.setupEventListeners();
        
        // Create interaction hint
        this.createInteractionHint();
        
        // Create navigation overlay
        this.createNavigationOverlay();
    }

    setupEventListeners() {
        // Close popup when clicking overlay
        this.overlay.addEventListener('click', () => this.hidePopup());
        
        // Close popup when clicking close button
        const closeBtn = document.getElementById('popup-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hidePopup());
        }
        
        // Close popup with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.popup.classList.contains('show')) {
                this.hidePopup();
            }
        });

        // Create interaction hint element
        this.createInteractionHint();
        
        // Create navigation overlay
        this.createNavigationOverlay();
        
        // T key for navigation overlay
        document.addEventListener('keydown', (e) => {
            if (e.key === 'T' || e.key === 't') {
                e.preventDefault();
                console.log('T key pressed - opening navigation overlay');
                this.toggleNavigationOverlay();
            }
        });
    }

    createInteractionHint() {
        this.interactionHint = document.createElement('div');
        this.interactionHint.id = 'building-interaction-hint';
        this.interactionHint.innerHTML = `
            <div class="hint-content">
                <i class="bi bi-info-circle"></i>
                <span>Press E to view Details</span>
            </div>
        `;
        this.interactionHint.style.cssText = `
            position: fixed;
            bottom: 120px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 15px 25px;
            border-radius: 30px;
            font-family: 'CityofGitsFont', Arial, sans-serif;
            font-size: 16px;
            font-weight: 700;
            z-index: 5000;
            opacity: 0;
            transition: all 0.4s ease;
            pointer-events: none;
            border: 3px solid rgba(0, 212, 255, 0.8);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7);
            text-align: center;
            white-space: nowrap;
        `;
        
        document.body.appendChild(this.interactionHint);
    }

    createNavigationOverlay() {
        // Create navigation overlay
        this.navigationOverlay = document.createElement('div');
        this.navigationOverlay.id = 'building-navigation-overlay';
        this.navigationOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
            z-index: 9999;
            display: none;
            overflow-y: auto;
            font-family: 'CityofGitsFont', Arial, sans-serif;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            position: sticky;
            top: 0;
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            text-align: center;
            border-bottom: 2px solid rgba(0, 212, 255, 0.5);
            z-index: 10000;
        `;
        header.innerHTML = `
            <h2 style="color: #00d4ff; margin: 0; font-size: 28px; font-weight: 700;">
                Building Navigation
            </h2>
            <p style="color: #fff; margin: 10px 0 0 0; font-size: 16px;">
                Press ENTER on any building to teleport instantly • Press T or ESC to close
            </p>
        `;
        
        // Create buildings grid
        this.navigationGrid = document.createElement('div');
        this.navigationGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            padding: 30px;
            max-width: 1400px;
            margin: 0 auto;
        `;
        
        this.navigationOverlay.appendChild(header);
        this.navigationOverlay.appendChild(this.navigationGrid);
        document.body.appendChild(this.navigationOverlay);
        
        // Close on escape or T key
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Escape' || e.key === 'T' || e.key === 't') && this.isNavigationOpen) {
                if (e.key !== 'T' && e.key !== 't') {
                    this.hideNavigationOverlay();
                }
            }
        });
        
        // Close on overlay click
        this.navigationOverlay.addEventListener('click', (e) => {
            if (e.target === this.navigationOverlay) {
                this.hideNavigationOverlay();
            }
        });
    }

    // Legacy test method - now replaced by navigation overlay
    testPopup() {
        console.log('Test popup triggered - opening navigation overlay instead');
        this.showNavigationOverlay();
    }

    checkBuildingProximity(playerPosition) {
        // Always log player position for debugging
        if (this.updateCounter % 30 === 0) { // Log every 30 checks to avoid spam
            console.log('🔍 Player position:', {
                x: playerPosition.x?.toFixed(2) || 'N/A',
                y: playerPosition.y?.toFixed(2) || 'N/A', 
                z: playerPosition.z?.toFixed(2) || 'N/A'
            });
        }
        
        let closestBuilding = null;
        let closestDistance = Infinity;
        
        for (const [buildingId, building] of Object.entries(this.buildingData)) {
            // SIMPLE DISTANCE CALCULATION - NO COMPLEX CHECKS
            const horizontalDistance = Math.sqrt(
                Math.pow(playerPosition.x - building.coordinates.x, 2) + 
                Math.pow(playerPosition.z - building.coordinates.z, 2)
            );
            
            // ALWAYS IN RANGE if within radius - NO HEIGHT OR ANGLE RESTRICTIONS
            let isInRange = horizontalDistance <= this.detectionRadius;
            
            console.log(`Checking ${building.name}: ${horizontalDistance.toFixed(1)}m away, InRange: ${isInRange}`);
            
            // Track closest building for better debugging
            if (horizontalDistance < closestDistance) {
                closestDistance = horizontalDistance;
                closestBuilding = { id: buildingId, data: building, distance: horizontalDistance };
            }
            
            if (isInRange) {
                console.log(`FOUND BUILDING: ${building.name} at ${horizontalDistance.toFixed(1)}m`);
                return { id: buildingId, data: building, distance: horizontalDistance };
            }
        }
                }
            }
            
            // Track closest building for better debugging
            if (horizontalDistance < closestDistance) {
                closestDistance = horizontalDistance;
                closestBuilding = { id: buildingId, data: building, distance: horizontalDistance };
            }
            
            if (isInRange) {
                console.log(`✅ FOUND BUILDING: ${building.name} at ${horizontalDistance.toFixed(1)}m`);
                return { id: buildingId, data: building, distance: horizontalDistance };
            }
        }
        
        // Log closest building occasionally for debugging
        if (closestBuilding && this.updateCounter % 60 === 0) {
            console.log(`📍 Closest: ${closestBuilding.data.name} at ${closestBuilding.distance.toFixed(2)}m (need ${this.detectionRadius}m)`);
        }
        
        // Check for subway entrances if no building detected
        const subwayEntrance = this.checkSubwayProximity(playerPosition);
        if (subwayEntrance) {
            return subwayEntrance;
        }
        
        return null;
    }

    showBuildingInfo(buildingId, buildingData) {
        if (!this.popup || !this.overlay) {
            console.warn('Popup elements not available');
            return;
        }

        this.currentBuilding = { id: buildingId, data: buildingData };
        this.populatePopupContent(buildingData);
        
        // Show popup with animation
        this.overlay.classList.add('show');
        this.popup.classList.add('show');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    populatePopupContent(building) {
        // Update header information
        document.getElementById('building-title').textContent = building.name;
        document.getElementById('building-subtitle').textContent = building.type;
        
        // Handle verification badge
        const verifiedBadgeContainer = document.getElementById('verified-badge-container');
        const taxTooltip = document.getElementById('tax-tooltip');
        
        if (building.verified === 1) {
            verifiedBadgeContainer.style.display = 'inline-block';
            if (building.taxId) {
                taxTooltip.textContent = `Tax ID: ${building.taxId}`;
            } else {
                taxTooltip.textContent = 'Verified Taxpayer';
            }
        } else {
            verifiedBadgeContainer.style.display = 'none';
        }
        
        // Update bio
        document.getElementById('building-bio').textContent = building.bio;
        
        // Update stats - handle both surface and underground buildings
        if (building.isUnderground) {
            // Underground building stats
            document.getElementById('building-height').textContent = building.depth || 'Unknown depth';
            document.getElementById('building-floors').textContent = building.platforms || building.stores || building.servers || 'Multiple levels';
        } else {
            // Surface building stats
            document.getElementById('building-height').textContent = building.height;
            document.getElementById('building-floors').textContent = building.floors;
        }
        document.getElementById('building-year').textContent = building.year;
        
        // Update description
        document.getElementById('building-description').textContent = building.description;
        
        // Update social links
        this.populateSocialLinks(building);
    }

    populateSocialLinks(building) {
        const socialContainer = document.getElementById('social-links');
        if (!socialContainer) return;
        
        socialContainer.innerHTML = '';
        
        // Social media platforms configuration
        const socialPlatforms = [
            {
                key: 'github',
                icon: 'bi-github',
                label: 'GitHub',
                class: 'github',
                baseUrl: 'https://github.com/'
            },
            {
                key: 'twitter',
                icon: 'bi-twitter-x',
                label: 'X (Twitter)',
                class: 'twitter',
                baseUrl: 'https://twitter.com/'
            },
            {
                key: 'linkedin',
                icon: 'bi-linkedin',
                label: 'LinkedIn',
                class: 'linkedin',
                baseUrl: 'https://linkedin.com/in/'
            },
            {
                key: 'instagram',
                icon: 'bi-instagram',
                label: 'Instagram',
                class: 'instagram',
                baseUrl: 'https://instagram.com/'
            },
            {
                key: 'website',
                icon: 'bi-globe',
                label: 'Website',
                class: 'website',
                baseUrl: ''
            }
        ];

        socialPlatforms.forEach(platform => {
            if (building[platform.key]) {
                const link = document.createElement('a');
                link.className = `social-link ${platform.class}`;
                link.href = platform.key === 'website' ? building[platform.key] : platform.baseUrl + building[platform.key];
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                
                link.innerHTML = `
                    <i class="${platform.icon}"></i>
                    <span>${platform.label}</span>
                `;
                
                socialContainer.appendChild(link);
            }
        });
    }

    hidePopup() {
        if (!this.popup || !this.overlay) return;
        
        this.overlay.classList.remove('show');
        this.popup.classList.remove('show');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        this.currentBuilding = null;
    }

    // Method to be called from the main game loop (optimized for performance)
    update(playerPosition) {
        // Skip update if navigation overlay is open to save performance
        if (this.isNavigationOpen) return;
        
        // Throttle proximity checking for performance (check every 5 frames instead of 10)
        if (!this.updateCounter) this.updateCounter = 0;
        this.updateCounter++;
        
        if (this.updateCounter % 5 !== 0) return; // Check every 5th frame for better responsiveness
        
        const nearbyBuilding = this.checkBuildingProximity(playerPosition);
        
        if (nearbyBuilding && !this.popup.classList.contains('show')) {
            this.showInteractionHint(nearbyBuilding);
        } else if (!nearbyBuilding) {
            this.hideInteractionHint();
        }
    }

    showInteractionHint(buildingInfo) {
        if (this.interactionHint) {
            this.interactionHint.style.opacity = '1';
            this.interactionHint.style.transform = 'translateX(-50%) translateY(-10px)';
            
            // Update hint text with building name and type
            const hintText = this.interactionHint.querySelector('span');
            if (hintText) {
                if (buildingInfo.data.isSubway) {
                    hintText.textContent = `Press E to enter Subway`;
                } else {
                    hintText.textContent = `Press E to view Details`;
                }
            }
        }
        
        const interactionType = buildingInfo.data.isSubway ? ' (Subway Entrance)' : 
                               buildingInfo.data.isUnderground ? ' (Underground)' : '';
        console.log(`Near ${buildingInfo.data.name}${interactionType} - Press E to interact`);
    }

    hideInteractionHint() {
        if (this.interactionHint) {
            this.interactionHint.style.opacity = '0';
            this.interactionHint.style.transform = 'translateX(-50%) translateY(0px)';
        }
    }

    // Method to handle building click interaction
    handleBuildingClick(buildingId) {
        const building = this.buildingData[buildingId];
        if (building) {
            this.showBuildingInfo(buildingId, building);
        }
    }

    // Get building data for external use
    getBuildingData(buildingId) {
        return this.buildingData[buildingId] || null;
    }

    // Add new building data dynamically
    addBuilding(buildingId, buildingData) {
        this.buildingData[buildingId] = buildingData;
    }

    // Update existing building data
    updateBuilding(buildingId, updatedData) {
        if (this.buildingData[buildingId]) {
            this.buildingData[buildingId] = { ...this.buildingData[buildingId], ...updatedData };
        }
    }

    toggleNavigationOverlay() {
        if (this.isNavigationOpen) {
            this.hideNavigationOverlay();
        } else {
            this.showNavigationOverlay();
        }
    }
    
    showNavigationOverlay() {
        if (!this.navigationOverlay) return;
        
        this.isNavigationOpen = true;
        this.populateNavigationGrid();
        this.navigationOverlay.style.display = 'block';
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Animate in
        requestAnimationFrame(() => {
            this.navigationOverlay.style.opacity = '1';
        });
    }
    
    hideNavigationOverlay() {
        if (!this.navigationOverlay) return;
        
        this.isNavigationOpen = false;
        this.navigationOverlay.style.display = 'none';
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
    
    populateNavigationGrid() {
        if (!this.navigationGrid) return;
        
        this.navigationGrid.innerHTML = '';
        
        // Add regular buildings
        Object.entries(this.buildingData).forEach(([buildingId, building], index) => {
            this.createNavigationCard(buildingId, building, false);
        });
        
        // Add dynamically generated subway entrances from world.js
        if (window.world && window.world.subwayStations) {
            window.world.subwayStations.forEach(stationMesh => {
                if (!stationMesh.position || !stationMesh.userData) return;
                
                const stationName = stationMesh.userData.name || 'Subway Station';
                const subwayData = {
                    name: stationName,
                    type: 'Underground Transit',
                    bio: `Enter the subway system to access the underground city. This station connects to the vast underground network beneath the surface city. Located at coordinates (${Math.round(stationMesh.position.x)}, ${Math.round(stationMesh.position.z)}).`,
                    coordinates: { x: stationMesh.position.x, z: stationMesh.position.z },
                    isSubway: true,
                    entranceLocation: {
                        x: stationMesh.position.x,
                        z: stationMesh.position.z,
                        name: stationName
                    }
                };
                this.createNavigationCard('subway_' + stationName.toLowerCase().replace(/\s+/g, '_'), subwayData, true);
            });
        } else {
            console.log('No subway stations found in world for navigation overlay');
        }
    }
    
    createNavigationCard(buildingId, building, isSubway) {
        const buildingCard = document.createElement('div');
        buildingCard.className = 'navigation-building-card';
        buildingCard.tabIndex = 0; // Make focusable
        buildingCard.style.cssText = `
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 150, 200, 0.1));
            border: 2px solid rgba(0, 212, 255, 0.3);
            border-radius: 15px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(5px);
            position: relative;
            overflow: hidden;
        `;
        
        // Type indicator
        let typeIndicator, locationColor;
        if (isSubway) {
            typeIndicator = 'Subway Entrance';
            locationColor = '#00ff88';
        } else {
            typeIndicator = building.isUnderground ? 'Underground' : 'Surface';
            locationColor = building.isUnderground ? '#ff9500' : '#00d4ff';
        }
        
        buildingCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <h3 style="color: #fff; margin: 0; font-size: 20px; font-weight: 700; flex: 1;">
                    ${building.name}
                </h3>
                ${(building.verified === 1 && !isSubway) ? '<div style="color: #00ff88; font-size: 18px;">✓</div>' : ''}
            </div>
            
            <div style="color: ${locationColor}; font-size: 14px; font-weight: 600; margin-bottom: 10px;">
                ${typeIndicator} • ${building.type}
            </div>
            
            <p style="color: #ccc; margin: 10px 0; font-size: 14px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                ${building.bio}
            </p>
            
            ${!isSubway ? `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 15px 0; font-size: 12px; color: #aaa;">
                <div><strong style="color: #00d4ff;">${building.isUnderground ? 'Depth:' : 'Height:'}</strong><br>${building.isUnderground ? building.depth : building.height}</div>
                <div><strong style="color: #00d4ff;">${building.isUnderground ? 'Levels:' : 'Floors:'}</strong><br>${building.isUnderground ? (building.platforms || building.stores || building.servers) : building.floors}</div>
                <div><strong style="color: #00d4ff;">Year:</strong><br>${building.year}</div>
            </div>
            ` : ''}
            
            <div style="background: rgba(0, 212, 255, 0.2); border-radius: 10px; padding: 12px; margin-top: 15px; text-align: center;">
                <div style="color: #00d4ff; font-weight: 700; font-size: 14px;">
                    📍 Coordinates: (${building.coordinates.x}, ${building.coordinates.z})
                </div>
                <div style="color: #fff; font-size: 13px; margin-top: 5px;">
                    Press ENTER to ${isSubway ? 'enter subway' : 'teleport instantly'}
                </div>
            </div>
        `;
        
        // Hover effects
        buildingCard.addEventListener('mouseenter', () => {
            buildingCard.style.transform = 'translateY(-5px) scale(1.02)';
            buildingCard.style.borderColor = locationColor;
            buildingCard.style.boxShadow = `0 10px 30px ${locationColor}40`;
        });
        
        buildingCard.addEventListener('mouseleave', () => {
            buildingCard.style.transform = 'translateY(0) scale(1)';
            buildingCard.style.borderColor = 'rgba(0, 212, 255, 0.3)';
            buildingCard.style.boxShadow = 'none';
        });
        
        // Click and keyboard events
        const handleInteraction = () => {
            if (isSubway) {
                this.hideNavigationOverlay();
                // Use the teleportToUnderground method from app.js
                if (window.cityOfGitsApp && window.cityOfGitsApp.teleportToUnderground) {
                    window.cityOfGitsApp.teleportToUnderground(building.entranceLocation);
                }
            } else {
                this.teleportToBuilding(buildingId, building);
            }
        };
        
        buildingCard.addEventListener('click', handleInteraction);
        buildingCard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleInteraction();
            }
        });
        
        this.navigationGrid.appendChild(buildingCard);
    }
    
    teleportToBuilding(buildingId, building) {
        console.log(`Teleporting to ${building.name}...`);
        
        // Hide navigation overlay first
        this.hideNavigationOverlay();
        
        // Create eye-blink transition
        const blinkOverlay = document.createElement('div');
        blinkOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            z-index: 99999;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        document.body.appendChild(blinkOverlay);
        
        // Start blink animation
        requestAnimationFrame(() => {
            blinkOverlay.style.opacity = '1';
        });
        
        // Wait for blink, then teleport
        setTimeout(() => {
            // Perform teleportation
            if (window.cityOfGitsApp && window.cityOfGitsApp.playerController) {
                const camera = window.cityOfGitsApp.playerController.camera;
                const coords = building.coordinates;
                
                // Set position based on building type
                if (building.isUnderground) {
                    // Underground: place player at ground level above the entrance
                    camera.position.set(coords.x, 2, coords.z);
                } else {
                    // Surface: place player slightly away from building at safe height
                    camera.position.set(coords.x + 15, 5, coords.z + 15);
                }
                
                // Reset player velocity if available
                const playerController = window.cityOfGitsApp.playerController;
                if (playerController.velocity) {
                    playerController.velocity.set(0, 0, 0);
                }
                
                console.log(`Teleported to ${building.name} at (${coords.x}, ${coords.z})`);
            }
            
            // Start eye-opening animation
            setTimeout(() => {
                blinkOverlay.style.opacity = '0';
                
                // Remove overlay after animation
                setTimeout(() => {
                    if (blinkOverlay.parentNode) {
                        blinkOverlay.parentNode.removeChild(blinkOverlay);
                    }
                }, 300);
            }, 100);
            
        }, 300);
    }

    // Force proximity check for debugging (can be called from console)
    forceProximityCheck() {
        if (window.cityOfGitsApp && window.cityOfGitsApp.playerController) {
            const playerPos = window.cityOfGitsApp.playerController.camera.position;
            console.log('FORCE PROXIMITY CHECK:');
            console.log('Player position:', {
                x: playerPos.x.toFixed(2),
                y: playerPos.y.toFixed(2),
                z: playerPos.z.toFixed(2)
            });
            
            const result = this.checkBuildingProximity({
                x: playerPos.x,
                y: playerPos.y,
                z: playerPos.z
            });
            
            if (result) {
                console.log('Found nearby building:', result.data.name);
                this.showInteractionHint(result);
            } else {
                console.log('No buildings in range');
            }
            
            return result;
        }
        return null;
    }

    // Enable/disable debug mode
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`Debug mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
        if (enabled) {
            console.log('🐛 Use buildingPopupSystem.forceProximityCheck() to test detection');
        }
    }

    waitForWorldAndCreateEntrances() {
        let attempts = 0;
        const maxAttempts = 20; // Wait up to 10 seconds
        
        // Wait for world to be ready, then create underground entrances
        const checkWorld = () => {
            attempts++;
            console.log(`⏳ Attempt ${attempts}/${maxAttempts} - Checking world readiness...`);
            
            if (window.cityOfGitsApp && window.cityOfGitsApp.world && window.cityOfGitsApp.world.scene) {
                console.log('🌍 World ready - creating building markers');
                this.createUndergroundEntrances();

                setTimeout(() => {
                    this.debugWorldState();
                    const markerCount = (window.cityOfGitsApp.world.undergroundEntrances?.length || 0) + 
                                      (window.cityOfGitsApp.world.surfaceMarkers?.length || 0);
                    if (markerCount === 0) {
                        console.warn('⚠️ No markers created! Retrying...');
                        this.forceCreateMarkers();
                    }
                }, 1000);
            } else {
                if (attempts < maxAttempts) {
                    setTimeout(checkWorld, 500);
                } else {
                    console.error('❌ World failed to initialize after 10 seconds!');
                    console.log('Available objects:', {
                        cityOfGitsApp: !!window.cityOfGitsApp,
                        world: !!window.cityOfGitsApp?.world,
                        scene: !!window.cityOfGitsApp?.world?.scene
                    });
                }
            }
        };
        checkWorld();
    }

    createUndergroundEntrances() {
        if (!window.cityOfGitsApp || !window.cityOfGitsApp.world || !window.cityOfGitsApp.world.scene) {
            console.warn('❌ World not ready for underground entrances');
            return;
        }

        const world = window.cityOfGitsApp.world;
        let entranceCount = 0;

        Object.entries(this.buildingData).forEach(([id, building]) => {
            if (building.isUnderground && building.coordinates) {
                console.log(`🔽 Creating underground entrance for ${building.name} at (${building.coordinates.x}, ${building.coordinates.z})`);
                
                // Create entrance marker - bright glowing cylinder
                const entranceGeometry = new THREE.CylinderGeometry(12, 12, 6, 16);
                const entranceMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0xff6600,
                    emissive: 0x331100
                });
                const entranceMesh = new THREE.Mesh(entranceGeometry, entranceMaterial);
                entranceMesh.position.set(building.coordinates.x, 3, building.coordinates.z);
                entranceMesh.userData = { buildingId: id, isUnderground: true, buildingData: building };
                world.scene.add(entranceMesh);

                // Create label above entrance
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 128;
                const ctx = canvas.getContext('2d');
                
                // Background
                ctx.fillStyle = 'rgba(0,0,0,0.8)';
                ctx.fillRect(0, 0, 512, 128);
                
                // Border
                ctx.strokeStyle = '#ff6600';
                ctx.lineWidth = 4;
                ctx.strokeRect(2, 2, 508, 124);
                
                // Text
                ctx.font = 'bold 36px Arial';
                ctx.fillStyle = '#ff6600';
                ctx.textAlign = 'center';
                ctx.fillText('🔽 ' + building.name, 256, 50);
                
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = '#ffaa66';
                ctx.fillText('Underground Entrance', 256, 85);
                
                const texture = new THREE.CanvasTexture(canvas);
                const labelMaterial = new THREE.MeshBasicMaterial({ 
                    map: texture, 
                    transparent: true,
                    alphaTest: 0.1
                });
                const labelGeometry = new THREE.PlaneGeometry(64, 16);
                const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
                labelMesh.position.set(building.coordinates.x, 15, building.coordinates.z);
                labelMesh.userData = { buildingId: id, isUnderground: true };
                world.scene.add(labelMesh);

                // Store references
                if (!world.undergroundEntrances) world.undergroundEntrances = [];
                world.undergroundEntrances.push(entranceMesh);
                
                entranceCount++;
            }
        });

        // Also create markers for surface buildings for better visibility
        Object.entries(this.buildingData).forEach(([id, building]) => {
            if (!building.isUnderground && building.coordinates) {
                console.log(`🏢 Creating surface building marker for ${building.name} at (${building.coordinates.x}, ${building.coordinates.z})`);
                
                // Create surface marker - blue glowing cube
                const markerGeometry = new THREE.BoxGeometry(8, 20, 8);
                const markerMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x0099ff,
                    emissive: 0x001133
                });
                const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
                markerMesh.position.set(building.coordinates.x, 10, building.coordinates.z);
                markerMesh.userData = { buildingId: id, isUnderground: false, buildingData: building };
                world.scene.add(markerMesh);

                // Create label above marker
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 128;
                const ctx = canvas.getContext('2d');
                
                // Background
                ctx.fillStyle = 'rgba(0,0,0,0.8)';
                ctx.fillRect(0, 0, 512, 128);
                
                // Border
                ctx.strokeStyle = '#0099ff';
                ctx.lineWidth = 4;
                ctx.strokeRect(2, 2, 508, 124);
                
                // Text
                ctx.font = 'bold 36px Arial';
                ctx.fillStyle = '#0099ff';
                ctx.textAlign = 'center';
                ctx.fillText('🏢 ' + building.name, 256, 50);
                
                ctx.font = 'bold 24px Arial';
                ctx.fillStyle = '#66ccff';
                ctx.fillText('Surface Building', 256, 85);
                
                const texture = new THREE.CanvasTexture(canvas);
                const labelMaterial = new THREE.MeshBasicMaterial({ 
                    map: texture, 
                    transparent: true,
                    alphaTest: 0.1
                });
                const labelGeometry = new THREE.PlaneGeometry(64, 16);
                const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
                labelMesh.position.set(building.coordinates.x, 25, building.coordinates.z);
                labelMesh.userData = { buildingId: id, isUnderground: false };
                world.scene.add(labelMesh);

                // Store references for surface buildings too
                if (!world.surfaceMarkers) world.surfaceMarkers = [];
                world.surfaceMarkers.push(markerMesh);
                
                entranceCount++;
            }
        });

        console.log(`✅ Created ${entranceCount} building markers (underground + surface)`);
        
        // Setup click handler for all building markers
        this.setupBuildingClickHandler();
    }

    setupBuildingClickHandler() {
        if (this.buildingClickHandlerSetup) return;
        this.buildingClickHandlerSetup = true;

        console.log('🎯 Setting up building marker click handler');
        
        document.addEventListener('click', (event) => {
            if (!window.cityOfGitsApp || !window.cityOfGitsApp.world) return;
            
            const world = window.cityOfGitsApp.world;
            const allMarkers = [
                ...(world.undergroundEntrances || []),
                ...(world.surfaceMarkers || [])
            ];
            
            if (allMarkers.length === 0) return;

            // Calculate mouse position
            const rect = world.renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // Raycast
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, world.camera);
            
            const intersects = raycaster.intersectObjects(allMarkers, false);
            
            if (intersects.length > 0) {
                const clickedMesh = intersects[0].object;
                const buildingId = clickedMesh.userData.buildingId;
                const buildingData = clickedMesh.userData.buildingData;
                
                if (buildingId && buildingData) {
                    console.log(`🎯 Clicked building marker: ${buildingData.name}`);
                    this.showBuildingInfo(buildingId, buildingData);
                }
            }
        });
    }

    // Debug method to test proximity with current player position
    testProximityNow() {
        if (!window.cityOfGitsApp || !window.cityOfGitsApp.playerController) {
            console.log('❌ Player controller not available');
            return;
        }
        
        const playerPos = window.cityOfGitsApp.playerController.camera.position;
        console.log('🧪 TESTING PROXIMITY NOW');
        console.log('📍 Player position:', {
            x: playerPos.x.toFixed(2),
            y: playerPos.y.toFixed(2),
            z: playerPos.z.toFixed(2)
        });
        
        // Force check all buildings
        const result = this.checkBuildingProximity({
            x: playerPos.x,
            y: playerPos.y,
            z: playerPos.z
        });
        
        if (result) {
            console.log('✅ Found building in range:', result.data.name);
            this.showInteractionHint(result);
        } else {
            console.log('❌ No buildings in detection range');
            
            // Show distances to all buildings
            Object.entries(this.buildingData).forEach(([id, building]) => {
                const dist = Math.sqrt(
                    Math.pow(playerPos.x - building.coordinates.x, 2) + 
                    Math.pow(playerPos.z - building.coordinates.z, 2)
                );
                console.log(`📏 ${building.name}: ${dist.toFixed(2)}m away`);
            });
        }
        
        return result;
    }

    // Force show hint for testing
    forceShowTestHint() {
        const testBuilding = {
            id: 'test',
            data: {
                name: 'Test Building',
                isUnderground: false
            }
        };
        this.showInteractionHint(testBuilding);
        console.log('🧪 Test hint should be visible now');
    }

    // Force create markers - can be called from console if markers aren't showing
    forceCreateMarkers() {
        console.log('🔧 FORCE CREATING BUILDING MARKERS');
        
        if (!window.cityOfGitsApp || !window.cityOfGitsApp.world || !window.cityOfGitsApp.world.scene) {
            console.error('❌ World not available! Cannot create markers.');
            return false;
        }

        // Clear existing markers first
        this.clearExistingMarkers();
        
        // Create new markers
        this.createUndergroundEntrances();
        
        console.log('✅ Force creation complete!');
        return true;
    }

    // Clear existing markers to prevent duplicates
    clearExistingMarkers() {
        if (!window.cityOfGitsApp || !window.cityOfGitsApp.world) return;
        
        const world = window.cityOfGitsApp.world;
        
        // Remove underground entrances
        if (world.undergroundEntrances) {
            world.undergroundEntrances.forEach(marker => {
                world.scene.remove(marker);
            });
            world.undergroundEntrances = [];
        }
        
        // Remove surface markers
        if (world.surfaceMarkers) {
            world.surfaceMarkers.forEach(marker => {
                world.scene.remove(marker);
            });
            world.surfaceMarkers = [];
        }
        
        console.log('🧹 Cleared existing markers');
    }

    // Debug method to check world state
    debugWorldState() {
        console.log('🔍 DEBUGGING WORLD STATE:');
        console.log('cityOfGitsApp exists:', !!window.cityOfGitsApp);
        
        if (window.cityOfGitsApp) {
            console.log('world exists:', !!window.cityOfGitsApp.world);
            
            if (window.cityOfGitsApp.world) {
                console.log('scene exists:', !!window.cityOfGitsApp.world.scene);
                console.log('scene children count:', window.cityOfGitsApp.world.scene.children.length);
                console.log('underground entrances:', window.cityOfGitsApp.world.undergroundEntrances?.length || 0);
                console.log('surface markers:', window.cityOfGitsApp.world.surfaceMarkers?.length || 0);
                
                // List all building markers in scene
                const buildingMarkers = window.cityOfGitsApp.world.scene.children.filter(child => 
                    child.userData && (child.userData.buildingId || child.userData.isUnderground !== undefined)
                );
                console.log('Building markers in scene:', buildingMarkers.length);
                buildingMarkers.forEach(marker => {
                    console.log('  -', marker.userData.buildingData?.name || 'Unknown', 
                               'at', marker.position.x, marker.position.y, marker.position.z);
                });
            }
        }
        
        console.log('Building data entries:', Object.keys(this.buildingData).length);
        console.log('Underground buildings:', Object.values(this.buildingData).filter(b => b.isUnderground).length);
        console.log('Surface buildings:', Object.values(this.buildingData).filter(b => !b.isUnderground).length);
    }

    checkSubwayProximity(playerPosition) {
        // Check dynamically generated subway stations from world.js
        if (!window.world || !window.world.subwayStations) {
            console.log('No subway stations found in world');
            return null;
        }
        
        const detectionRadius = 50; // Detection radius for subway entrances
        
        for (const stationMesh of window.world.subwayStations) {
            if (!stationMesh.position || !stationMesh.userData) continue;
            
            const distance = Math.sqrt(
                Math.pow(playerPosition.x - stationMesh.position.x, 2) + 
                Math.pow(playerPosition.z - stationMesh.position.z, 2)
            );
            
            if (distance <= detectionRadius) {
                const stationName = stationMesh.userData.name || 'Subway Station';
                return {
                    id: 'subway_' + stationName.toLowerCase().replace(/\s+/g, '_'),
                    data: {
                        name: stationName,
                        type: 'Underground Transit',
                        description: `Enter the subway system to access the underground city. This station connects to the vast underground network beneath the surface city. Station coordinates: (${Math.round(stationMesh.position.x)}, ${Math.round(stationMesh.position.z)})`,
                        isSubway: true,
                        entranceLocation: {
                            x: stationMesh.position.x,
                            z: stationMesh.position.z,
                            name: stationName
                        }
                    },
                    distance: distance
                };
            }
        }
        
        return null;
    }
}

// Create global instance
window.buildingPopupSystem = new BuildingPopupSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuildingPopupSystem;
}
