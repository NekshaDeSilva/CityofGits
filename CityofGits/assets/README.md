# Welcome to CityOfGits! 🏙️
### Created by @NekshaDeSilva

A highly customizable open-source 3D world built with Three.js where developers can create and showcase their virtual houses!

## 🌟 Features

- **🏠 Customizable Houses**: Create houses using JSON configuration with extensive customization options
- **🎮 Minecraft-like Navigation**: Free movement with WASD controls, mouse look, jumping, and running
- **🏷️ Developer Nameplates**: Each house displays the developer's name with fancy animated nameplates
- **🌍 Immersive World**: Sky, clouds, ground, grass patches, roads, and atmospheric lighting
- **🎨 Visual Variety**: Different house colors, styles, roof types, windows, doors, and stairs
- **🔍 Interactive Elements**: Click on houses to view detailed information
- **⚡ Real-time Rendering**: Smooth 60fps experience with shadows and lighting effects

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open your browser** and navigate to `http://localhost:8080`

4. **Start exploring**! Click anywhere to enable mouse controls, then use:
   - **WASD**: Move around
   - **Mouse**: Look around
   - **Space**: Jump
   - **Shift**: Run
   - **Click on houses**: View information

## 🏗️ Creating Custom Houses

Edit the `world.json` file to add your own houses. Here's the structure:

```json
{
  "world": {
    "name": "CityofGits",
    "skyColor": "#87CEEB",
    "groundColor": "#8B7355",
    "worldSize": 1000
  },
  "houses": {
    "your_house_id": {
      "position": {
        "x": 100,
        "y": 0,
        "z": 100
      },
      "colour": "#FF6B6B",
      "stairs": "yes",
      "building-length": "320",
      "building-width": "250", 
      "building-height": "180",
      "roof-type": "pyramid",
      "roof-color": "#8B4513",
      "door-color": "#654321",
      "window-color": "#87CEEB",
      "windows": 6,
      "developer": "YourUsername",
      "style": "modern"
    }
  }
}
```

### 🎨 Customization Options

- **Position**: `x`, `y`, `z` coordinates in the world
- **Colors**: `colour` (main building), `roof-color`, `door-color`, `window-color`
- **Dimensions**: `building-length`, `building-width`, `building-height` (in pixels/units)
- **Features**: `stairs` ("yes"/"no"), `windows` (number), `roof-type` ("pyramid"/"gable"/"flat")
- **Style**: `style` (affects nameplate appearance)
- **Developer**: `developer` (your username for the nameplate)

### 🎭 Roof Types
- **pyramid**: Four-sided pyramid roof
- **gable**: Traditional triangular roof
- **flat**: Modern flat roof design

### 🏠 House Styles
- **modern**: Clean, contemporary design
- **industrial**: Urban, minimalist look
- **creative**: Colorful and artistic
- **fantasy**: Whimsical and magical
- **minimalist**: Simple and elegant

## 🛠️ Development

### Adding Houses Programmatically

You can add houses dynamically using the browser console:

```javascript
// Add a new house
addHouse("house12345", {
  position: { x: 200, y: 0, z: 300 },
  colour: "#00FF00",
  stairs: "yes",
  "building-length": "400",
  "building-width": "300",
  "building-height": "200",
  "roof-type": "gable",
  "roof-color": "#8B4513",
  "door-color": "#654321", 
  "window-color": "#87CEEB",
  windows: 8,
  developer: "YourName",
  style: "creative"
});

// Get current player position
getPlayerPosition();

// Teleport player
teleportPlayer(100, 50, 200);

// Get world data
getWorldData();
```

### 🗂️ Project Structure

```
cityofgits/
├── CityofGits/
│   ├── index.html          # Main HTML file
│   ├── app/
│   │   ├── index.js        # Application entry point
│   │   ├── app.js          # Player controls & game logic
│   │   └── world.js        # 3D world generation
│   └── styles/
│       └── styles.css      # UI styling
├── world.json              # World and house data
├── package.json            # Project configuration
└── server.js              # Local development server
```

## 🎉 MAJOR ENHANCEMENTS - Version 3.0

### ✅ Visual Improvements
- **REMOVED ALL BLUE GROUND** - Replaced with stunning natural terrain
- **Beautiful varied landscape** with grass, dirt, sand patches for realism
- **Enhanced color palettes** with 10+ colors per building type
- **Thousands of unique building combinations** eliminating mono-look completely

### 🏢 Advanced Building System
**Corporate Buildings (NYC/Silicon Valley Style):**
- Corporate Glass (glass curtain walls, tech company style)
- Corporate Cement (modern concrete architecture)
- Corporate Blocks (stepped/terraced buildings)
- Corporate Legacy (classic stone buildings)
- Corporate Creative (mixed creative headquarters)
- Tech Modern (Apple/Google/Microsoft HQ style)
- Tech Startup (loft-style startup offices)

**Creative & Artistic Buildings:**
- Creative Modern (white/minimalist design)
- Creative Legacy (brick historical buildings)
- Creative Eclectic (purple/artistic mixed styles)
- Creative Artistic (vibrant gallery spaces)
- Creative Bohemian (earthy artistic lofts)
- Art Gallery (dedicated gallery spaces with 🎨 signage)
- Design Studio (modern creative workspaces with ✏️ signage)

**Residential Buildings:**
- Residential Luxury (high-end apartment buildings)
- Residential Modern (contemporary housing)
- Residential Vibrant (colorful mixed housing)
- Apartment Luxury (luxury high-rise apartments)
- Apartment Modern (standard modern apartments)
- Condo Tower (high-rise condominiums)

**Special Buildings with Unique Signage:**
- 🏥 Hospital (white medical facilities)
- 🏫 School (educational buildings)
- 🍽️ Restaurant (cozy dining establishments)
- 🏨 Hotel (luxury hospitality buildings)
- 🏦 Bank (prestigious financial buildings)
- 🏬 Mall (large shopping complexes)
- 💪 Gym (fitness centers)
- ☕ Cafe (small coffee shops)
- 📚 Library (classic academic buildings)
- 🎬 Cinema (entertainment venues)
- 📦 Warehouse (industrial storage)
- 🏭 Factory (manufacturing facilities)

### 🏗️ Advanced Architecture Features
- **Glass curtain wall systems** for modern corporate buildings
- **Stepped/terraced architecture** for creative designs
- **Tech campus layouts** with connecting structures
- **Varied window patterns** (horizontal bands, individual windows, full glass walls)
- **Enhanced roofing system** (sloped, flat, creative angled, metal, copper)
- **Beautiful signage system** with emoji icons and varied colors
- **Architectural details** (antennas, rooftop equipment, accent lighting)

### 🎨 Stunning Visual Variety
- **Over 40 different building types** with unique characteristics
- **Thousands of color combinations** (10+ colors per type)
- **Random architectural variations** (width, depth, height, style)
- **Enhanced material system** (glass, concrete, metal, brick, stone)
- **Realistic urban elements** (street lights, cars, trees, billboards)

### ⚡ Performance Optimized
- **Automatic device detection** (ultra-low, low-memory, high-end)
- **Dynamic chunk loading** preserves all new building variety
- **Shared geometries and materials** for memory efficiency
- **Intelligent LOD system** maintains performance with beauty
- **Optimized for 4GB RAM systems** without sacrificing visual appeal

### 🎯 All Original Features Preserved
- ✅ Billboards and nameboards with emoji signage
- ✅ 2-3 story buildings with multi-floor customization
- ✅ Swimming pools with transparent water
- ✅ Smooth WASD navigation and camera controls
- ✅ Mobile/touch support with virtual joystick
- ✅ Dynamic city districts (residential, commercial, tech, parks)
- ✅ Minecraft-style chunk loading (7x7 grid, 2000x2000 units)
- ✅ Full 120km² explorable mega city

### 🌟 Result
CityofGits is now a **visually stunning, massively diverse 3D mega city** with:
- **NO blue ground** - beautiful natural terrain
- **NO mono-look** - thousands of unique building designs
- **Corporate headquarters** rivaling NYC/Silicon Valley
- **Creative districts** with artistic buildings
- **Special facilities** (hospitals, schools, etc.) with proper signage
- **Exceptional performance** on all device types
- **Endless exploration** with constantly varied architecture

**Every building is unique. Every district tells a story. Every exploration reveals new architectural beauty.**

## 🎨 **LATEST ENHANCEMENTS - Ultra-Realistic Ground & Buildings**

### 🌍 **Revolutionary Ground System - NO MORE BLUE GROUND!**
**COMPLETELY ELIMINATED** all blue ground and replaced with contextually intelligent surfaces:

**🏢 Corporate Buildings:**
- Glass floors (clear and tinted) 
- Professional marble (white/black)
- Modern concrete (light/dark)
- Elegant block stones

**🎨 Creative Buildings:**
- Artistic carpets (red, purple, blue, gold)
- Natural wood decking
- Rich soil and emerald grass
- Glass accent surfaces

**🏠 Residential Buildings:**
- Natural grass varieties (4 types)
- Luxury marble for high-end
- Comfortable wood decking  
- Earth-tone soil patches

**🏥 Special Buildings:**
- 🏥 Hospital: Pristine white marble
- 🏫 School: Educational concrete + grass
- 🍽️ Restaurant: Warm wood + red carpet
- 🏨 Hotel: Gold carpet + marble
- 🏦 Bank: Black marble + dark stones
- 🎬 Cinema: Red carpet + black marble

### 🏗️ **Enhanced Building Realism**
**Performance-optimized architectural details:**

- **Custom Entrances:** Building-type specific doors and lobbies
- **Realistic Windows:** Varied sizes, frames, proper materials
- **Balconies:** Residential buildings get proper balconies with railings  
- **Classical Pillars:** Corporate buildings feature professional columns
- **Exterior Lighting:** Realistic fixtures and accent elements
- **Creative Elements:** Artistic buildings get sculptural features

### ⚡ **Smart Performance System**
- **Ultra-low-end:** Essential features only
- **4GB Systems:** Moderate details, optimized
- **High-end:** Full realism and details
- **Automatic Detection:** Scales appropriately

### 🎯 **Results**
✅ **ZERO blue ground** anywhere  
✅ **20+ realistic surface types**  
✅ **Building-specific ground matching**  
✅ **Enhanced architectural realism**  
✅ **Thousands of unique combinations**  
✅ **Excellent performance maintained**  

**CityofGits now features the most realistic and diverse 3D city system available, with every surface thoughtfully designed and contextually appropriate!**

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Add your house to `world.json`
4. Test your changes
5. Submit a pull request

## 📜 License

MIT License - feel free to use, modify, and distribute!

## 🙏 Credits

- **Three.js**: 3D graphics library
- **OpenRockets Team**: Development team
- **@NekshaDeSilva**: Original creator
- **Community**: All the amazing house builders!

## 🐛 Issues & Support

If you encounter any issues or have suggestions:
1. Check the browser console for error messages
2. Ensure WebGL is supported and enabled
3. Try refreshing the page
4. Create an issue on the repository

---

**Happy Building! 🏗️✨**

*Create your dream house and share it with the CityofGits community!*