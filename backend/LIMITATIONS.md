# Web-Based Proctoring Capabilities & Security Limitations

This document plainly describes what the current web-based proctoring system **can** and **cannot** guarantee for exam integrity.

---

## What This Web System CAN Do

1. **Tab & Window Focus Detection (Proxy for Alt+Tab)**:
   - Uses the HTML5 Page Visibility API to detect when the exam tab loses focus or when the browser window is minimized.
   - Logs `TAB_SWITCH` violations and alerts the proctor live via WebRTC/WebSockets.

2. **Fullscreen Enforcement**:
   - Requires candidates to enter Fullscreen mode.
   - Detects when the candidate exits Fullscreen mode (`FULLSCREEN_EXIT`) and displays a persistent warning overlay until restored.

3. **In-Page Keyboard & Mouse Lockdown**:
   - Blocks right-click context menus (`contextmenu`).
   - Prevents Clipboard operations (`copy`, `cut`, `paste`).
   - Intercepts common shortcuts (`Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+A`, `Ctrl+S`, `Ctrl+P`, `F12`, `Ctrl+Shift+I`).
   - Logs `DEVTOOLS_OPEN` and `PRINT_ATTEMPT` violations when suspicious keys are pressed.

4. **Automated Violation Thresholds**:
   - Tracks total violation counts per attempt with weighted severity levels (`HIGH`, `MEDIUM`, `LOW`).
   - Automatically auto-submits the exam (`AUTO_SUBMITTED_VIOLATIONS`) if the candidate exceeds the exam's configured maximum violation threshold.

5. **Live Peer-to-Peer Video Streaming & Periodic Snapshots**:
   - Streams local webcam video directly to proctor dashboards using WebRTC.
   - Periodically captures and stores compressed webcam frames (every 20s) with timestamped database references for post-exam review.

---

## What This Web System CANNOT Guarantee

> [!WARNING]
> Web browser sandboxes operate under fundamental OS-level limitations. Web applications cannot inspect or control processes outside the browser viewport.

1. **DevTools & Browser Extensions**:
   - While F12 and Ctrl+Shift+I shortcuts are intercepted, candidates can open Developer Tools prior to starting the exam or via secondary browser menus (e.g. Chrome 3-dots menu -> More Tools -> Developer Tools).

2. **Dual Monitors & External Display Blind Spots**:
   - Page Visibility API only triggers when focus leaves the browser tab. A candidate looking at a secondary monitor without shifting window focus will not trigger a tab switch.

3. **OS-Level Screen Capture & Hardware Recording**:
   - Web applications cannot prevent OS-level screen capture tools (e.g., Windows Snipping Tool, OBS Studio, macOS Screenshot, external HDMI capture cards, or smartphone cameras pointing at the monitor).

4. **Virtual Machines & External Devices**:
   - Operating inside a Virtual Machine (VM) or using hardware KVM switches cannot be reliably detected from inside a browser standard sandbox.

---

## Resolution: Phase 8 Native Desktop Application

For high-stakes examinations requiring absolute security guarantees, the platform roadmap includes a **Phase 8 Native Desktop Client** (Electron/Tauri or C++ container). A native app provides:
- Low-level OS hook interception (blocking all global hotkeys and Win+Tab/Alt+Tab).
- Process enumeration (killing unauthorized background software like Discord, TeamViewer, or OBS).
- Multi-display disabling (locking rendering to a single primary display).
- Virtual Machine environment detection.
