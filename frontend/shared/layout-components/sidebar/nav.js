import React from "react";

const SignalViewerIcon = <svg xmlns="http://www.w3.org/2000/svg" className="side-menu__icon" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M48,128V72a8,8,0,0,1,8-8h96l56,56V200a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V128" opacity="0.2"/><polyline points="48 144 96 112 144 144 208 80" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/><path d="M48,128V72a8,8,0,0,1,8-8h96l56,56" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/></svg>;

export const MENUITEMS = [
  {
    icon: SignalViewerIcon, title: 'Signal Viewer', type: "sub", active: false, children: [
      { path: "/", type: "link", active: false, selected: false, title: "Overview" },
      {
        title: "Medical Signals", type: "sub", menusub: true, active: false, children: [
          { path: "/signal-viewer/medical/ecg", type: "link", active: false, selected: false, title: "ECG Viewer" },
          { path: "/signal-viewer/medical/eeg", type: "link", active: false, selected: false, title: "EEG Viewer" },
        ]
      },
      {
        title: "Acoustic Signals", type: "sub", menusub: true, active: false, children: [
          { path: "/signal-viewer/acoustic/doppler", type: "link", active: false, selected: false, title: "Vehicle Doppler" },
          { path: "/signal-viewer/acoustic/drones", type: "link", active: false, selected: false, title: "Drones/Submarine" },
        ]
      },
      {
        title: "Trading Signals", type: "sub", menusub: true, active: false, children: [
          { path: "/signal-viewer/trading/stocks", type: "link", active: false, selected: false, title: "Stock Market" },
          { path: "/signal-viewer/trading/currencies", type: "link", active: false, selected: false, title: "Currencies" },
          { path: "/signal-viewer/trading/minerals", type: "link", active: false, selected: false, title: "Minerals" },
        ]
      },
      { path: "/signal-viewer/microbiome", type: "link", active: false, selected: false, title: "Microbiome" },
    ]
  },
];

export default MENUITEMS;
