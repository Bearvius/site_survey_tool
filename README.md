# Wireless Site Survey Tool

A full-stack TypeScript application for performing wireless site surveys for gas detection systems. It polls a wireless gateway over Modbus TCP to retrieve RSSI and PER for up to 10 devices, optionally reads GPS coordinates from an external GPS (UART/NMEA) or a mobile phone via the web client, and stores measurements into CSV files. A responsive React web UI is served over the local network (e.g., Raspberry Pi Wi‑Fi hotspot) for easy field use.

## Features
- New Measurement page: live 1s sampling chart (RSSI dBm, PER %), pause/stop/cancel, GPS status and live readout.
- Measurement List: browse CSVs, view stats and chart in a modal, delete with confirmation.
- Settings: Modbus TCP address and register base (default 1000), GPS mode (External/Mobile/Off), UART config, Simulation mode, per-device tags.
- Auto-detect mapped devices (non-zero PER and RSSI registers) up to 10 devices.
- CSV naming: `<location>_<timestamp>.csv` with sanitized filename.
- Runs on Raspberry Pi or similar; serves a React front-end.

## Quick Start (Windows PowerShell)
1. Install Node.js LTS (>=18)
2. In this folder, install dependencies:
```powershell
npm install
npm run install --workspace server; npm run install --workspace client; npm run install --workspace shared
```
3. Start development (server + client):
```powershell
npm run dev
```
Server defaults to http://localhost:4000, client at http://localhost:5173. The client is configured to call the server via proxy or env variable.

## Raspberry Pi notes
- Install Node.js 18+ (armv7/arm64). Ensure `serialport` compiles (build-essential, Python for node-gyp).
- Configure UART for the external GPS if used.
- Consider adding a systemd service to auto-start the server on boot and serve the built client.

## Folder Structure
- `server/` Express + TypeScript backend (Modbus, GPS, measurements, CSVs)
- `client/` React + Vite frontend
- `shared/` Shared TypeScript types and API contracts

See each package README for details.