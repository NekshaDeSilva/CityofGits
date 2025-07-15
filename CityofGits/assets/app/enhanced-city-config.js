// Enhanced city configuration for more vibrant, detailed buildings
const ENHANCED_CITY_CONFIG = {
    buildingColors: {
        residential: [
            0xFF6B6B, // Bright red
            0x4ECDC4, // Turquoise
            0x45B7D1, // Blue
            0x96CEB4, // Mint green
            0xFFA726, // Orange
            0x9C27B0, // Purple
            0x66BB6A, // Green
            0xEF5350  // Coral
        ],
        corporate: [
            0x263238, // Dark blue-gray
            0x37474F, // Medium gray
            0x455A64, // Light gray
            0x00BCD4, // Cyan
            0x2196F3, // Blue
            0x4CAF50  // Green
        ],
        creative: [
            0xE91E63, // Pink
            0x9C27B0, // Purple
            0xFF5722, // Deep orange
            0x00BCD4, // Cyan
            0x8BC34A, // Light green
            0xFF9800  // Orange
        ]
    },
    
    rooftopGardenColors: [
        0x4CAF50, // Green
        0x2E7D32, // Dark green
        0x388E3C, // Medium green
        0x43A047, // Light green
        0x66BB6A  // Bright green
    ],
    
    flowerColors: [
        0xFF5722, // Red-orange
        0xE91E63, // Pink
        0x9C27B0, // Purple
        0x3F51B5, // Indigo
        0xFF9800, // Orange
        0xFFEB3B  // Yellow
    ],
    
    windowColors: [
        0x87CEEB, // Sky blue
        0x4169E1, // Royal blue
        0x00BFFF, // Deep sky blue
        0xF0F8FF, // Alice blue
        0xE6F3FF  // Light blue
    ]
};

// Export for use in world_optimized.js
if (typeof window !== 'undefined') {
    window.ENHANCED_CITY_CONFIG = ENHANCED_CITY_CONFIG;
}
