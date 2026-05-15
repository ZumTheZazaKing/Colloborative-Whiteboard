# **App Name**: WhiteBoard

## Core Features:

- Collaborative Canvas Workspace: An expansive HTML5 drawing area with high-fidelity input tracking and immediate local rendering for zero-latency feel.
- Firebase Identity Access: Unified authentication system supporting Google and Email providers, dynamically elevating logged-in users to Administrative roles.
- Cloud-Synced Stroke Engine: Persists individual pen strokes as discrete Firestore documents to ensure cross-client persistence and historical recovery.
- AI Path Refiner Tool: A feature that utilizes a generative AI tool to analyze hand-drawn strokes and suggests geometrically optimized or aesthetically smoothed vector paths.
- Real-time Live Sync: Uses low-latency subscription hooks to broadcast changes to all active users, with automatic redraw buffering for deleted assets.
- Floating Administrative Panel: An interactive overlay for authenticated users to manage individual strokes, toggle board states, and execute global wipe commands.
- Dynamic Tooling Palette: User interface for real-time adjustments of brush color and stroke weight via CSS-driven floating components.

## Style Guidelines:

- Primary Color: #8B77FF (A vibrant Electric Indigo to symbolize connection and creative energy).
- Background Color: #131217 (A deep, desaturated dark charcoal with subtle purple undertones to provide a high-contrast foundation for drawing).
- Accent Color: #5978F5 (A luminous technical blue used for tool states and admin-only controls, providing strong contrast against the primary violet).
- Font Pairing: 'Space Grotesk' for technical, bold headlines and 'Inter' for neutral, highly legible UI labels and data lists.
- Minimalist canvas focus with a sleek, translucent floating sidebar for administrative controls and drawing settings, ensuring maximum creative space.
- Subtle path-morphing transitions for AI optimizations and spring-loaded animations for floating UI toggles.
- Thin-weight vector line icons following the 'Inter' stylistic rhythm, optimized for clarity in technical drawing tools.