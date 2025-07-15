# 🏙️ CityofGits - Installation & Setup Instructions

## Quick Start (Windows)

1. **Open PowerShell or Command Prompt** in the project directory:
   ```
   cd "C:\Users\PCPAL.lk\Desktop\cityofgits"
   ```

2. **Start the server** using one of these methods:

   **Method A - Using npm:**
   ```
   npm start
   ```

   **Method B - Direct node command:**
   ```
   node server.js
   ```

   **Method C - Using the batch file:**
   Double-click `start.bat` in the project folder

3. **Open your browser** and go to:
   ```
   http://localhost:8080
   ```

4. **Start exploring!** 
   - Click anywhere to enable controls
   - Use WASD to move (smooth acceleration/deceleration)
   - Mouse to look around (smooth camera movement)
   - Space to jump, Shift to run
   - Click on houses to see developer info
   - **NEW**: Watch for aircraft flying around in the sky!
   - **NEW**: Infinite world - terrain loads as you explore!

## 🏠 Adding Your Own House

Edit `world.json` and add your house like this:

```json
"your_house_id": {
  "position": { "x": 400, "y": 0, "z": 200 },
  "colour": "#FF0000",
  "stairs": "yes",
  "building-length": "300",
  "building-width": "250",
  "building-height": "200",
  "roof-type": "pyramid",
  "roof-color": "#8B4513",
  "door-color": "#654321",
  "window-color": "#87CEEB",
  "windows": 8,
  "developer": "YourUsername",
  "style": "modern"
}
```

## 🔧 Troubleshooting

- **Port 8080 in use?** Change the PORT in `server.js`
- **WebGL errors?** Use Chrome, Firefox, or Edge browser
- **Can't see changes?** Refresh the browser page
- **Console errors?** Check the browser developer tools (F12)

## 🎮 Controls

- **WASD**: Move forward/backward/left/right (smooth momentum-based movement)
- **Mouse**: Look around (smooth camera rotation)
- **Space**: Jump
- **Shift**: Run/sprint
- **Click**: Enable mouse controls or interact with houses
- **F12**: Open browser developer tools for debugging

## ✨ New Features

- **🛩️ Dynamic Aircraft**: Watch colorful aircraft fly randomly across the sky
- **🌍 Infinite Terrain**: World expands automatically as you explore
- **🏠 Smart House Placement**: Houses maintain minimum 10-meter distance
- **🎯 Smooth Navigation**: Enhanced movement with acceleration and momentum
- **📱 Optimized Performance**: Terrain chunks load/unload based on your position

Enjoy building your virtual city! 🏗️✨
