 # CityofGits

**Version 1.0**

CityofGits is a fully open-source, extensible 3D world platform where you can build anything—from skyscrapers to rockets. Create your own city, play freely, and share your world with friends. This project is designed for developers, creators, and enthusiasts who want to explore, customize, and contribute to a collaborative virtual city. More updates and features are coming soon.

---
#### Capture and share your unforgettable moments from CityofGits! Whether it's on Instagram, X, or YouTube, don’t forget to tag your adventures with **#cityofgits**. Let’s celebrate the experiences together! 

#### Road to sun(2025) Demostration



https://github.com/user-attachments/assets/d30d9a21-d885-4578-a16b-1a69b89422ba





## Overview

CityofGits is built with Three.js and modern JavaScript, providing a robust environment for constructing, customizing, and exploring a virtual city. The platform supports real-time navigation, interactive buildings, and a flexible architecture for adding new features and content.

**Key Features:**

- Customizable buildings and environments using JSON configuration
- Real-time 3D rendering and smooth navigation (WASD, mouse look, jump, run)
- Interactive UI for building information and player stats
- Developer nameplates and dynamic signage
- Modern, responsive design with mobile support
- Open API for chat and real-time collaboration
- Modular codebase for easy extension and contribution

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm (Node Package Manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/openrockets/cityofgits.git
   cd cityofgits
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment variables in a `.env` file (see `.env.example` if available).

### Running the Project

Start the development server:

```bash
npm start
```

Open your browser and navigate to [http://localhost:8080](http://localhost:8080) to explore your city.

## Usage

- Use **WASD** keys to move, mouse to look around, **Space** to jump, and **Shift** to run.
- Click on buildings to view detailed information and interact with the environment.
- Edit `world.json` to add or customize buildings, or use the browser console for dynamic changes.

### Example: Adding a Custom Building

Edit `world.json` and add a new entry under `houses`:

```json
{
  "houses": {
    "unique_id": {
      "position": { "x": 100, "y": 0, "z": 100 },
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

## Project Structure

```
CityofGits/
├── api/
│   ├── latest.js
│   └── send.js
├── CityofGits/
│   ├── index.html
│   ├── app/
│   │   ├── app.js
│   │   ├── building-popup.js
│   │   ├── enhanced-city-config.js
│   │   ├── gaming-ui.js
│   │   ├── index.js
│   │   ├── landscape-overlay.js
│   │   ├── promo-sticker-glow.js
│   │   ├── subway-system.js
│   │   ├── world_clean.js
│   │   ├── world_optimized.js
│   │   └── world.js
│   ├── assets/
│   │   ├── billboard_pool.png
│   │   ├── dynamic_content/
│   │   │   └── uploads/
│   │   └── static/
│   │       ├── cityofgits_stickets-summer-long.png
│   │       ├── cityofgits-lg-4000x1010.png
│   │       ├── cityofgits-summercap-dark-lg-4000x1010.png
│   │       ├── cityofgits-summercap-lg-4000x1010.png
│   │       ├── cityofgits-white-lg-4000x1010.png
│   │       ├── font.otf
│   │       ├── glow.png
│   │       ├── openrockets-logo.png
│   │       └── verified_badge.png
│   └── groundtexts/
│       └── memes.json
├── libs/
├── license/
├── styles/
│   ├── landscape-overlay.css
│   └── styles.css
├── data.json
├── debug-world.html
├── INSTRUCTIONS.md
├── LICENSE
├── package.json
├── README.md
├── server.js
├── start.bat
├── start.js
├── test-enhancements.html
├── vercel.json
├── world.json
└── worlds/
```

## Contributing

CityofGits is a community-driven project. Contributions are welcome and encouraged. To contribute:

1. Fork the repository
2. Create a feature branch
3. Add or improve features, or add your own buildings to `world.json`
4. Test your changes
5. Submit a pull request

## License

This project is licensed under the MIT License. You are free to use, modify, and distribute the code.

## Roadmap

- Ongoing improvements to building systems and world variety
- Enhanced multiplayer and collaboration features
- More interactive elements and UI enhancements
- Performance optimizations for all device types
- Additional documentation and tutorials

Stay tuned for more updates. CityofGits is just getting started.

---

CityofGits – Build anything. From skyscrapers to rockets. Create your own world, play freely, and share it with friends.

### Designed, developed, created and whole creatives by @NekshaDeSilva.
#### Copyrights (c) 2025 OpenRockets Software Foundation. (Not-for-profit) Organisation. Free to use, copy, edit, attribue and publish.
### [OpenRockets.me/i/neksha](http://OpenRockets.me/i/neksha)
