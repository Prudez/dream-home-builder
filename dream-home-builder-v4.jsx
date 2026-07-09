import { useState, useRef, useEffect, useMemo, useCallback } from "react";

// ================= Blue Falcon tokens =================
const T = {
  navy: "#0A1E3C", navyMid: "#13315C", ink: "#0B0B0D", white: "#FFFFFF",
  paper: "#F5F6F8", gold: "#C9A14A", goldDeep: "#A97F2C",
  green: "#4E7A57", slate: "#8B97A8", danger: "#B4453A", wall: "#26303B",
};

const COLS = 14;
const ROWS = 10;
const PREMIUM_THRESHOLD = 18000000;

// ================= Style packs =================
const PACKS = {
  minimalist: { name: "Modern Minimalist", tag: "Flat roofs, glass, clean grey", canvas: "#FBFBFC", defFloor: ["porcelain", 0], swatch: ["#F2F0EC", "#B9BEC6", "#1D4477", "#4E7A57"] },
  coastal: { name: "Swahili Coastal", tag: "Arches, carved wood, warm tones", canvas: "#FDF8F1", defFloor: ["laminate", 1], swatch: ["#A8743F", "#C89B7B", "#8A4B2D", "#5B8A5E"] },
  stone: { name: "Classic Stone", tag: "Pitched roofs, natural stone — the Karen look", canvas: "#F7F7F3", defFloor: ["parquet", 1], swatch: ["#8C8478", "#5C6167", "#41503F", "#4E7A57"] },
  compact: { name: "Smart Compact", tag: "Optimized starter home", canvas: "#FBFBFC", defFloor: ["ceramic", 0], swatch: ["#E8E2D4", "#CDD3D8", "#33415C", "#4E7A57"] },
};

const FLOOR_OPTIONS = [
  { key: 1, name: "Bungalow", desc: "Single level, full plot living", shell: 3500000, icon: "🏠" },
  { key: 2, name: "Maisonette", desc: "2 storeys — the family classic", shell: 5800000, icon: "🏡" },
  { key: 3, name: "Townhouse", desc: "3 storeys, maximum build", shell: 8400000, icon: "🏢" },
];
const FLOOR_NAMES = ["Ground floor", "First floor", "Second floor"];

// ================= Rooms =================
const ROOM_TYPES = {
  living:  { name: "Living Room", group: "floor", perCell: 260000, w: 3, h: 3, min: [2,2], max: [6,5], icon: "🛋", indoor: true },
  kitchen: { name: "Kitchen", group: "kitchen", perCell: 480000, w: 2, h: 2, min: [1,2], max: [4,3], icon: "🍳", indoor: true },
  master:  { name: "Master En-suite", group: "floor", perCell: 340000, w: 3, h: 2, min: [2,2], max: [4,4], icon: "🛏", indoor: true },
  bedroom: { name: "Bedroom", group: "floor", perCell: 330000, w: 2, h: 2, min: [1,2], max: [4,3], icon: "🛌", indoor: true },
  bath:    { name: "Bathroom", group: "bath", perCell: 500000, w: 1, h: 2, min: [1,1], max: [2,2], icon: "🛁", indoor: true },
  office:  { name: "Home Office", group: "floor", perCell: 300000, w: 2, h: 2, min: [1,1], max: [3,3], icon: "💻", indoor: true },
  veranda: { name: "Veranda", group: "floor", perCell: 150000, w: 3, h: 1, min: [2,1], max: [6,2], icon: "☀️" },
  dsq:     { name: "DSQ", group: "floor", perCell: 350000, w: 2, h: 2, min: [2,2], max: [3,3], icon: "🏠", groundOnly: true, indoor: true },
  garage:  { name: "Garage", group: null, perCell: 180000, w: 3, h: 2, min: [2,2], max: [4,3], icon: "🚗", groundOnly: true },
  pool:    { name: "Swimming Pool", group: "pool", perCell: 270000, w: 3, h: 4, min: [2,3], max: [5,6], icon: "🏊", groundOnly: true },
  garden:  { name: "Garden / Lawn", group: "garden", perCell: 45000, w: 3, h: 3, min: [2,2], max: [7,6], icon: "🌿", groundOnly: true },
  gate:    { name: "Electric Gate", group: null, perCell: 650000, w: 2, h: 1, min: [2,1], max: [2,1], icon: "🚧", groundOnly: true },
  borehole:{ name: "Borehole", group: null, perCell: 1500000, w: 1, h: 1, min: [1,1], max: [1,1], icon: "💧", groundOnly: true },
};

// ================= Finishes: options × colorways =================
const FINISHES = {
  floor: [
    { key: "ceramic",  name: "Ceramic Tile",       mult: 1.0,  tex: "tile",    colors: [["Cream","#E8E2D4"],["Ash Grey","#CDD3D8"],["Terracotta","#C98F6E"]] },
    { key: "laminate", name: "Wood Laminate",      mult: 1.15, tex: "plank",   colors: [["Light Oak","#C89F6B"],["Mahogany","#8E5B33"],["Dark Walnut","#6B4226"]] },
    { key: "parquet",  name: "Hardwood Parquet",   mult: 1.3,  tex: "parquet", colors: [["Honey","#B98A55"],["Teak","#8E5B33"],["Ebony","#513222"]] },
    { key: "porcelain",name: "Polished Porcelain", mult: 1.35, tex: "gloss",   colors: [["Arctic White","#F2F0EC"],["Silver","#B9BEC6"],["Charcoal","#5C6167"]] },
    { key: "carpet",   name: "Carpet",             mult: 1.1,  tex: "carpet",  colors: [["Sand","#C4B8A5"],["Slate Blue","#8FA0B5"],["Plum","#9E8FA8"]] },
  ],
  kitchen: [
    { key: "standard", name: "Standard Fitted",    mult: 1.0,  tex: "tile",    colors: [["Cream","#E8E2D4"],["Cool Grey","#D8DDE2"]] },
    { key: "granite",  name: "Granite Counters",   mult: 1.2,  tex: "granite", colors: [["Grey Granite","#6E747B"],["Black Galaxy","#3E3A36"],["Sahara","#8A7C66"]] },
    { key: "island",   name: "Modern + Island",    mult: 1.45, tex: "gloss",   colors: [["Gloss White","#F2F0EC"],["Navy Matte","#2E3A46"],["Sage","#8B9A8B"]] },
    { key: "chef",     name: "Chef's Luxury",      mult: 1.65, tex: "granite", colors: [["Onyx","#2A2E33"],["Walnut & Stone","#5A4A3A"]] },
  ],
  bath: [
    { key: "standard", name: "Standard Tile",      mult: 1.0,  tex: "tile",    colors: [["Sky","#DDE6EA"],["Cream","#E8E2D4"]] },
    { key: "fulltile", name: "Full-Tile + Heated Shower", mult: 1.25, tex: "tile", colors: [["Ocean","#AFC6CE"],["Mint","#C9D6D2"],["Desert","#D9C9B8"]] },
    { key: "stone",    name: "Stone Luxury",       mult: 1.55, tex: "granite", colors: [["Mazeras","#8C8478"],["Slate","#5C6167"]] },
  ],
  garden: [
    { key: "lawn",     name: "Open Lawn",          mult: 1.0,  tex: "grass",   colors: [["Kikuyu Green","#5E8C4A"],["Deep Green","#4A7245"],["Bright","#74A052"]] },
    { key: "trees",    name: "Lawn + Trees",       mult: 1.35, tex: "grass",   colors: [["Kikuyu Green","#5E8C4A"],["Deep Green","#4A7245"]] },
    { key: "landscaped", name: "Landscaped + Paths", mult: 1.9, tex: "grass",  colors: [["Kikuyu Green","#5E8C4A"],["Bright","#74A052"]] },
  ],
  pool: [
    { key: "classic",  name: "Classic Pool",       mult: 1.0,  tex: "water",   colors: [["Aqua","#3FA9C9"],["Deep Blue","#2E7FB8"],["Lagoon","#35B8AE"]] },
    { key: "deck",     name: "Tiled Deck Pool",    mult: 1.3,  tex: "water",   colors: [["Aqua","#3FA9C9"],["Deep Blue","#2E7FB8"]] },
    { key: "infinity", name: "Infinity Edge",      mult: 1.7,  tex: "water",   colors: [["Deep Blue","#2E7FB8"],["Lagoon","#35B8AE"]] },
  ],
};

// ================= Furniture sets: player-chosen layouts per room =================
const FURNITURE = {
  living: [
    { name: "Essentials", cost: 0, desc: "Sofa & coffee table" },
    { name: "Family Lounge", cost: 450000, desc: "Rug, TV wall, armchairs" },
    { name: "Entertainer's Suite", cost: 900000, desc: "L-sofa, dining set, bar" },
  ],
  bedroom: [
    { name: "Essentials", cost: 0, desc: "Bed" },
    { name: "Comfort Set", cost: 250000, desc: "Wardrobe & side tables" },
  ],
  master: [
    { name: "Essentials", cost: 0, desc: "Bed & wardrobe" },
    { name: "Master Suite", cost: 400000, desc: "King bed, vanity, chair" },
    { name: "Luxury Suite", cost: 750000, desc: "Walk-in rail & bench" },
  ],
  office: [
    { name: "Desk Setup", cost: 0, desc: "Desk & chair" },
    { name: "Executive Study", cost: 350000, desc: "Bookshelves & guest seat" },
  ],
  kitchen: [
    { name: "Standard", cost: 0, desc: "Fitted counters" },
    { name: "Breakfast Nook", cost: 200000, desc: "Table & stools" },
  ],
  bath: [
    { name: "Shower", cost: 0, desc: "Shower & WC" },
    { name: "Bathtub", cost: 300000, desc: "Tub upgrade" },
  ],
  veranda: [
    { name: "Open", cost: 0, desc: "Clear veranda" },
    { name: "Seating", cost: 120000, desc: "Chairs & plants" },
  ],
  garden: [
    { name: "Open Garden", cost: 0, desc: "Just the greenery" },
    { name: "Alfresco Set", cost: 180000, desc: "Outdoor dining" },
    { name: "Boma Fire Pit", cost: 350000, desc: "Fire pit & benches" },
  ],
  pool: [
    { name: "Just the Pool", cost: 0, desc: "Clean deck" },
    { name: "Loungers", cost: 150000, desc: "Sun loungers & umbrella" },
  ],
  dsq: [
    { name: "Unfurnished", cost: 0, desc: "Empty unit" },
    { name: "Furnished", cost: 280000, desc: "Bed & kitchenette" },
  ],
};

// Renders the chosen furniture set for a room as SVG elements
function drawFurniture(room, W, H, finKey) {
  const set = room.furn || 0;
  const F = "rgba(255,255,255,0.85)", FD = "rgba(30,38,48,0.55)", FD2 = "rgba(30,38,48,0.7)";
  const els = [];
  const t = room.type;

  if (t === "living" && W > 60 && H > 55) {
    if (set >= 1) els.push(<rect key="rug" x={W*0.18} y={H*0.28} width={W*0.55} height={H*0.48} rx={6} fill="rgba(255,255,255,0.25)" />);
    // sofa
    els.push(<rect key="sofa" x={W*0.22} y={H*0.32} width={W*0.42} height={H*0.14} rx={5} fill={FD} />);
    els.push(<rect key="sofab" x={W*0.22} y={H*0.29} width={W*0.42} height={H*0.05} rx={3} fill={FD2} />);
    if (set >= 2) { // L-sofa arm
      els.push(<rect key="sofaL" x={W*0.22} y={H*0.32} width={W*0.1} height={H*0.34} rx={5} fill={FD} />);
    }
    els.push(<circle key="tbl" cx={W*0.45} cy={H*0.6} r={Math.min(W,H)*0.075} fill={F} stroke={FD} strokeWidth={1.5} />);
    if (set >= 1) {
      els.push(<rect key="tv" x={W*0.24} y={H*0.9} width={W*0.38} height={4} rx={2} fill={FD2} />);
      els.push(<circle key="arm1" cx={W*0.72} cy={H*0.36} r={Math.min(W,H)*0.06} fill={FD} />);
      els.push(<circle key="arm2" cx={W*0.72} cy={H*0.55} r={Math.min(W,H)*0.06} fill={FD} />);
    }
    if (set >= 2 && W > 100) {
      els.push(<rect key="dt" x={W*0.78} y={H*0.14} width={W*0.15} height={H*0.3} rx={4} fill={F} stroke={FD} strokeWidth={1.5} />);
      for (let i = 0; i < 4; i++) els.push(<circle key={"ch"+i} cx={W*0.78 + (i%2)*W*0.15 + (i%2 ? 5 : -5)} cy={H*0.19 + Math.floor(i/2)*H*0.18} r={3.2} fill={FD} />);
      els.push(<rect key="bar" x={W*0.68} y={H*0.82} width={W*0.26} height={H*0.09} rx={3} fill={FD2} />);
      els.push(<circle key="st1" cx={W*0.74} cy={H*0.77} r={2.8} fill={FD} />);
      els.push(<circle key="st2" cx={W*0.85} cy={H*0.77} r={2.8} fill={FD} />);
    }
  }

  if ((t === "bedroom" || t === "master") && W > 50 && H > 50) {
    const bw = t === "master" ? 0.44 : 0.4;
    els.push(<rect key="bed" x={W*0.3} y={H*0.15} width={W*bw} height={H*0.55} rx={5} fill={F} stroke={FD} strokeWidth={1.5} />);
    els.push(<rect key="pil" x={W*0.33} y={H*0.18} width={W*(bw-0.06)} height={H*0.12} rx={3} fill={FD} opacity={0.5} />);
    els.push(<line key="cov" x1={W*0.3} y1={H*0.42} x2={W*(0.3+bw)} y2={H*0.42} stroke={FD} strokeWidth={1.5} />);
    if ((t === "bedroom" && set >= 1) || (t === "master" && set >= 0 && W > 80)) {
      els.push(<rect key="ward" x={W*0.05} y={H*0.15} width={W*0.12} height={H*0.5} rx={3} fill={FD} opacity={0.55} />);
      els.push(<line key="wd" x1={W*0.11} y1={H*0.17} x2={W*0.11} y2={H*0.63} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />);
    }
    if (set >= 1) {
      els.push(<rect key="sd1" x={W*0.3 - 9} y={H*0.16} width={7} height={7} rx={2} fill={FD} />);
      els.push(<rect key="sd2" x={W*(0.3+bw) + 2} y={H*0.16} width={7} height={7} rx={2} fill={FD} />);
    }
    if (t === "master" && set >= 1) {
      els.push(<rect key="van" x={W*0.05} y={H*0.75} width={W*0.22} height={H*0.1} rx={3} fill={F} stroke={FD} strokeWidth={1.2} />);
      els.push(<circle key="mir" cx={W*0.16} cy={H*0.72} r={4} fill="rgba(180,200,215,0.9)" stroke={FD} strokeWidth={1} />);
      els.push(<circle key="rch" cx={W*0.85} cy={H*0.82} r={Math.min(W,H)*0.06} fill={FD} />);
    }
    if (t === "master" && set >= 2) {
      els.push(<line key="rail" x1={W*0.55} y1={H*0.88} x2={W*0.95} y2={H*0.88} stroke={FD2} strokeWidth={2.5} />);
      for (let i = 0; i < 5; i++) els.push(<line key={"hg"+i} x1={W*(0.58+i*0.08)} y1={H*0.88} x2={W*(0.58+i*0.08)} y2={H*0.95} stroke={FD} strokeWidth={1.5} />);
      els.push(<rect key="bench" x={W*0.35} y={H*0.86} width={W*0.14} height={H*0.07} rx={3} fill={FD} />);
    }
  }

  if (t === "kitchen" && W > 50) {
    els.push(<rect key="ctr" x={4} y={4} width={W - 8} height={H*0.2} rx={3} fill="rgba(255,255,255,0.5)" stroke={FD} strokeWidth={1} />);
    for (let i = 0; i < 4; i++) els.push(<circle key={"hob"+i} cx={W*0.2 + (i%2)*12} cy={H*0.1 + Math.floor(i/2)*9} r={3.5} fill="none" stroke={FD} strokeWidth={1.5} />);
    els.push(<rect key="sink" x={W*0.65} y={H*0.07} width={W*0.18} height={H*0.1} rx={3} fill="rgba(180,200,215,0.9)" stroke={FD} strokeWidth={1} />);
    if (finKey === "island" || finKey === "chef") {
      els.push(<rect key="isl" x={W*0.3} y={H*0.45} width={W*0.4} height={H*0.2} rx={4} fill="rgba(255,255,255,0.6)" stroke={FD} strokeWidth={1.5} />);
    }
    if (set >= 1 && H > 60) {
      els.push(<circle key="bt" cx={W*0.25} cy={H*0.8} r={Math.min(W,H)*0.09} fill={F} stroke={FD} strokeWidth={1.5} />);
      els.push(<circle key="bs1" cx={W*0.14} cy={H*0.74} r={3} fill={FD} />);
      els.push(<circle key="bs2" cx={W*0.36} cy={H*0.86} r={3} fill={FD} />);
    }
  }

  if (t === "bath" && H > 40) {
    els.push(<ellipse key="wc" cx={W*0.3} cy={H*0.78} rx={Math.min(W,H)*0.12} ry={Math.min(W,H)*0.15} fill={F} stroke={FD} strokeWidth={1.5} />);
    if (set === 0) {
      els.push(<rect key="shw" x={W*0.55} y={6} width={W*0.38} height={W*0.38} rx={4} fill="rgba(180,200,215,0.5)" stroke={FD} strokeWidth={1} />);
      els.push(<circle key="drain" cx={W*0.74} cy={6 + W*0.19} r={2} fill={FD} />);
    } else {
      els.push(<rect key="tub" x={W*0.5} y={6} width={W*0.42} height={H*0.55} rx={10} fill="rgba(180,200,215,0.6)" stroke={FD} strokeWidth={1.5} />);
      els.push(<rect key="tubi" x={W*0.5 + 5} y={11} width={W*0.42 - 10} height={H*0.55 - 10} rx={7} fill="rgba(220,235,242,0.8)" />);
      els.push(<circle key="tap" cx={W*0.71} cy={10} r={2.5} fill={FD2} />);
    }
  }

  if (t === "office" && W > 45) {
    els.push(<rect key="desk" x={W*0.15} y={H*0.12} width={W*0.7} height={H*0.18} rx={3} fill={F} stroke={FD} strokeWidth={1.5} />);
    els.push(<circle key="chair" cx={W*0.5} cy={H*0.45} r={Math.min(W,H)*0.1} fill={FD} opacity={0.6} />);
    if (set >= 1) {
      els.push(<rect key="bk1" x={4} y={H*0.45} width={W*0.1} height={H*0.45} rx={2} fill={FD2} />);
      for (let i = 0; i < 3; i++) els.push(<line key={"sh"+i} x1={5} y1={H*(0.55 + i*0.11)} x2={4 + W*0.1 - 1} y2={H*(0.55 + i*0.11)} stroke="rgba(255,255,255,0.45)" strokeWidth={1} />);
      els.push(<circle key="guest" cx={W*0.8} cy={H*0.7} r={Math.min(W,H)*0.08} fill={FD} opacity={0.5} />);
    }
  }

  if (t === "veranda" && set >= 1 && W > 60) {
    els.push(<circle key="vc1" cx={W*0.3} cy={H*0.5} r={Math.min(W,H)*0.16} fill={FD} opacity={0.55} />);
    els.push(<circle key="vc2" cx={W*0.5} cy={H*0.5} r={Math.min(W,H)*0.16} fill={FD} opacity={0.55} />);
    els.push(<circle key="pl" cx={W*0.82} cy={H*0.5} r={Math.min(W,H)*0.14} fill="#4E7A57" />);
    els.push(<circle key="pl2" cx={W*0.82} cy={H*0.5} r={Math.min(W,H)*0.08} fill="#3A5F44" />);
  }

  if (t === "garden" && W > 70 && H > 60) {
    if (set === 1) {
      els.push(<circle key="gt" cx={W*0.5} cy={H*0.55} r={Math.min(W,H)*0.11} fill="rgba(250,248,240,0.9)" stroke={FD} strokeWidth={1.5} />);
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + 0.5;
        els.push(<circle key={"gc"+i} cx={W*0.5 + Math.cos(a) * Math.min(W,H)*0.18} cy={H*0.55 + Math.sin(a) * Math.min(W,H)*0.18} r={4} fill={FD2} />);
      }
    }
    if (set === 2) {
      const cx = W*0.5, cy = H*0.55, R = Math.min(W,H)*0.09;
      els.push(<circle key="pit" cx={cx} cy={cy} r={R} fill="#4A4038" stroke="#2E2822" strokeWidth={2.5} />);
      els.push(<circle key="fire" cx={cx} cy={cy} r={R*0.55} fill="#E08A2E" />);
      els.push(<circle key="fire2" cx={cx} cy={cy - 1.5} r={R*0.28} fill="#F5C04A" />);
      els.push(<path key="bn1" d={`M ${cx - R*2.6} ${cy - R*0.8} A ${R*2.6} ${R*2.6} 0 0 1 ${cx - R*0.8} ${cy - R*2.6}`} fill="none" stroke="#8A6E4E" strokeWidth={6} strokeLinecap="round" />);
      els.push(<path key="bn2" d={`M ${cx + R*2.6} ${cy + R*0.8} A ${R*2.6} ${R*2.6} 0 0 1 ${cx + R*0.8} ${cy + R*2.6}`} fill="none" stroke="#8A6E4E" strokeWidth={6} strokeLinecap="round" />);
    }
  }

  if (t === "pool" && set >= 1 && W > 60) {
    for (let i = 0; i < 2; i++) {
      els.push(<rect key={"lg"+i} x={10 + i*20} y={H - 16} width={16} height={8} rx={3} fill="rgba(250,248,240,0.95)" stroke={FD} strokeWidth={1} transform={`rotate(-8 ${18 + i*20} ${H - 12})`} />);
    }
    els.push(<circle key="umb" cx={52} cy={H - 14} r={9} fill="#C9A14A" opacity={0.9} />);
    els.push(<circle key="umb2" cx={52} cy={H - 14} r={2} fill="#8A6E2E" />);
  }

  if (t === "dsq" && set >= 1 && W > 50) {
    els.push(<rect key="db" x={W*0.55} y={H*0.15} width={W*0.32} height={H*0.4} rx={4} fill={F} stroke={FD} strokeWidth={1.2} />);
    els.push(<rect key="dk" x={4} y={4} width={W*0.4} height={H*0.14} rx={3} fill="rgba(255,255,255,0.5)" stroke={FD} strokeWidth={1} />);
  }

  return els;
}

const fmtKES = (n) => n >= 1000000 ? `KES ${(n / 1000000).toFixed(1)}M` : `KES ${Math.round(n / 1000)}K`;
const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, v + amt));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};
const rand = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };

let _id = 0;
const nextId = () => ++_id;

// ================= Room artwork (textures + furniture) =================
function RoomArt({ room, cell }) {
  const rt = ROOM_TYPES[room.type];
  const W = room.w * cell, H = room.h * cell;
  const fin = rt.group ? FINISHES[rt.group][room.finish || 0] : null;
  const color = fin ? fin.colors[room.color || 0][1] : "#8B97A8";
  const r = rand(room.id * 7919 + 13);
  const els = [];

  // ---- floor texture ----
  if (!fin) {
    els.push(<rect key="bg" width={W} height={H} fill={room.type === "garage" ? "#9AA3AD" : "#B9C1CB"} />);
    if (room.type === "garage") {
      els.push(<line key="g1" x1={W/2} y1={6} x2={W/2} y2={H-6} stroke="#FFF" strokeWidth={2} strokeDasharray="8 6" opacity={0.6} />);
    }
    if (room.type === "gate") els.push(<g key="gt">{[...Array(6)].map((_,i)=><rect key={i} x={4+i*(W-8)/6} y={H*0.25} width={3} height={H*0.5} fill="#3A424C"/>)}</g>);
    if (room.type === "borehole") els.push(<circle key="bh" cx={W/2} cy={H/2} r={Math.min(W,H)*0.28} fill="#4E75A8" stroke="#26303B" strokeWidth={3}/>);
  } else if (rt.group === "pool") {
    // ---- POOL: coping deck, water gradient, ripples, ladder ----
    const gid = `pw${room.id}`;
    const coping = fin.key !== "infinity" ? 7 : 7;
    els.push(
      <defs key="d">
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={shade(color, 35)} />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor={shade(color, -35)} />
        </linearGradient>
      </defs>
    );
    // deck / coping
    els.push(<rect key="deck" width={W} height={H} rx={10} fill={fin.key === "deck" ? "#D9CFB8" : "#DAD5CB"} />);
    if (fin.key === "deck") {
      for (let x = 0; x < W; x += 14) els.push(<line key={"dk"+x} x1={x} y1={0} x2={x} y2={H} stroke="rgba(0,0,0,0.06)" strokeWidth={1}/>);
    }
    // water
    const infEdge = fin.key === "infinity";
    els.push(<rect key="water" x={coping} y={coping} width={W - coping * 2} height={H - coping * (infEdge ? 1 : 2)} rx={8} fill={`url(#${gid})`} stroke={shade(color,-60)} strokeWidth={1.5} />);
    if (infEdge) {
      els.push(<rect key="inf" x={coping} y={H-10} width={W - coping*2} height={8} fill={shade(color, 60)} opacity={0.7} rx={4}/>);
    }
    // ripples
    for (let i = 0; i < 3; i++) {
      const cx = W * (0.3 + r() * 0.4), cy = H * (0.25 + r() * 0.4);
      els.push(<ellipse key={"rp"+i} cx={cx} cy={cy} rx={W*0.14} ry={W*0.05} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />);
      els.push(<ellipse key={"rp2"+i} cx={cx} cy={cy} rx={W*0.07} ry={W*0.025} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />);
    }
    // lane shimmer + ladder
    els.push(<path key="sh" d={`M ${coping+6} ${H*0.7} Q ${W*0.4} ${H*0.6} ${W-coping-6} ${H*0.72}`} stroke="rgba(255,255,255,0.25)" strokeWidth={2} fill="none"/>);
    els.push(<g key="lad" stroke="#EFEFEF" strokeWidth={2.5} strokeLinecap="round">
      <line x1={W - coping - 14} y1={coping + 2} x2={W - coping - 14} y2={coping + 16} />
      <line x1={W - coping - 6} y1={coping + 2} x2={W - coping - 6} y2={coping + 16} />
      <line x1={W - coping - 14} y1={coping + 7} x2={W - coping - 6} y2={coping + 7} />
      <line x1={W - coping - 14} y1={coping + 13} x2={W - coping - 6} y2={coping + 13} />
    </g>);
  } else if (rt.group === "garden") {
    // ---- GARDEN: grass texture, trees, paths, shrubs ----
    els.push(<rect key="bg" width={W} height={H} fill={color} rx={14} />);
    // mowing stripes
    for (let x = 0; x < W; x += 18) els.push(<rect key={"st"+x} x={x} y={0} width={9} height={H} fill="rgba(255,255,255,0.05)" />);
    // grass blades
    for (let i = 0; i < Math.min(90, (W * H) / 90); i++) {
      const x = r() * W, y = r() * H;
      els.push(<path key={"b"+i} d={`M ${x} ${y} q 1.5 -4 3 -5`} stroke={shade(color, -30)} strokeWidth={1} fill="none" opacity={0.6} />);
    }
    // landscaped path
    if (fin.key === "landscaped") {
      els.push(<path key="path" d={`M ${W*0.1} ${H*0.85} Q ${W*0.5} ${H*0.45} ${W*0.9} ${H*0.6}`} stroke="#D9CFBB" strokeWidth={Math.max(8, W*0.09)} fill="none" strokeLinecap="round" />);
      els.push(<path key="path2" d={`M ${W*0.1} ${H*0.85} Q ${W*0.5} ${H*0.45} ${W*0.9} ${H*0.6}`} stroke="rgba(0,0,0,0.08)" strokeWidth={1.5} fill="none" strokeDasharray="3 5" />);
      // shrubs along path
      for (let i = 0; i < 4; i++) {
        const t = 0.18 + i * 0.2;
        const px = W * (0.1 + t * 0.8), py = H * (0.85 - Math.sin(t * Math.PI) * 0.32) - 12;
        els.push(<circle key={"sh"+i} cx={px} cy={py} r={5 + r()*3} fill={shade(color, -45)} />);
      }
    }
    // trees
    if (fin.key === "trees" || fin.key === "landscaped") {
      const trees = fin.key === "landscaped" ? 1 : 2;
      for (let t = 0; t < trees; t++) {
        const tx = W * (0.25 + t * 0.45), ty = H * (0.3 + t * 0.25);
        const tr = Math.min(W, H) * 0.16;
        els.push(<ellipse key={"tsh"+t} cx={tx + tr*0.3} cy={ty + tr*0.4} rx={tr*1.1} ry={tr*0.5} fill="rgba(0,0,0,0.15)" />);
        els.push(<circle key={"t1"+t} cx={tx} cy={ty} r={tr} fill={shade(color, -55)} />);
        els.push(<circle key={"t2"+t} cx={tx - tr*0.45} cy={ty + tr*0.25} r={tr*0.65} fill={shade(color, -40)} />);
        els.push(<circle key={"t3"+t} cx={tx + tr*0.5} cy={ty + tr*0.2} r={tr*0.6} fill={shade(color, -68)} />);
        els.push(<circle key={"t4"+t} cx={tx + tr*0.1} cy={ty - tr*0.4} r={tr*0.5} fill={shade(color, -30)} />);
      }
    }
    // flowers on open lawn
    if (fin.key === "lawn") {
      for (let i = 0; i < 5; i++) {
        els.push(<circle key={"f"+i} cx={r()*W} cy={r()*H} r={1.8} fill={["#E8D26E","#E8A0A0","#FFF"][i % 3]} opacity={0.8}/>);
      }
    }
  } else {
    // ---- INDOOR FLOORS ----
    els.push(<rect key="bg" width={W} height={H} fill={color} />);
    if (fin.tex === "tile") {
      const s = Math.max(12, cell / 2.4);
      for (let x = s; x < W; x += s) els.push(<line key={"tx"+x} x1={x} y1={0} x2={x} y2={H} stroke="rgba(0,0,0,0.09)" strokeWidth={1} />);
      for (let y = s; y < H; y += s) els.push(<line key={"ty"+y} x1={0} y1={y} x2={W} y2={y} stroke="rgba(0,0,0,0.09)" strokeWidth={1} />);
    } else if (fin.tex === "plank") {
      const ph = Math.max(8, cell / 4);
      for (let y = 0; y < H; y += ph) {
        els.push(<line key={"pl"+y} x1={0} y1={y} x2={W} y2={y} stroke="rgba(0,0,0,0.14)" strokeWidth={1} />);
        const off = (Math.floor(y / ph) % 2) * W * 0.3 + W * 0.2;
        els.push(<line key={"pj"+y} x1={off % W} y1={y} x2={off % W} y2={y + ph} stroke="rgba(0,0,0,0.1)" strokeWidth={1} />);
      }
      els.push(<rect key="grain" width={W} height={H} fill="url(#none)" opacity={0} />);
    } else if (fin.tex === "parquet") {
      const s = Math.max(10, cell / 3);
      for (let i = -H; i < W; i += s) {
        els.push(<line key={"d1"+i} x1={i} y1={0} x2={i + H} y2={H} stroke="rgba(0,0,0,0.10)" strokeWidth={1} />);
        els.push(<line key={"d2"+i} x1={i + H} y1={0} x2={i} y2={H} stroke="rgba(0,0,0,0.07)" strokeWidth={1} />);
      }
    } else if (fin.tex === "gloss") {
      const s = Math.max(20, cell);
      for (let x = s; x < W; x += s) els.push(<line key={"gx"+x} x1={x} y1={0} x2={x} y2={H} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />);
      for (let y = s; y < H; y += s) els.push(<line key={"gy"+y} x1={0} y1={y} x2={W} y2={y} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />);
      els.push(<polygon key="sheen" points={`0,${H*0.2} ${W*0.35},0 ${W*0.55},0 0,${H*0.55}`} fill="rgba(255,255,255,0.22)" />);
    } else if (fin.tex === "carpet") {
      for (let i = 0; i < (W * H) / 60; i++) els.push(<circle key={"c"+i} cx={r()*W} cy={r()*H} r={0.9} fill="rgba(0,0,0,0.10)" />);
    } else if (fin.tex === "granite") {
      for (let i = 0; i < (W * H) / 40; i++) {
        els.push(<circle key={"gr"+i} cx={r()*W} cy={r()*H} r={0.8 + r()*1.4} fill={r() > 0.5 ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.2)"} />);
      }
    }

  }

  // ---- player-chosen furniture set ----
  if (!["gate", "borehole", "garage"].includes(room.type)) {
    els.push(<g key="furniture">{drawFurniture(room, W, H, fin ? fin.key : null)}</g>);
  }

  // ---- walls for indoor rooms ----
  if (rt.indoor) {
    els.push(<rect key="wall" x={2} y={2} width={W-4} height={H-4} fill="none" stroke={T.wall} strokeWidth={4} rx={2} />);
    // window gaps on the top wall
    const wins = W > 100 ? 2 : 1;
    for (let i = 0; i < wins; i++) {
      const wx = W * ((i + 1) / (wins + 1)) - 10;
      els.push(<rect key={"win"+i} x={wx} y={0} width={20} height={5} fill="#FFF" stroke={T.wall} strokeWidth={0.8} />);
    }
    // door arc bottom-left
    if (W > 40 && H > 40) {
      els.push(<path key="door" d={`M 8 ${H-3} A 16 16 0 0 1 24 ${H-19}`} fill="none" stroke={T.wall} strokeWidth={1} opacity={0.5} />);
      els.push(<rect key="doorgap" x={7} y={H-5} width={17} height={5} fill={color} />);
    }
  }

  return (
    <svg width={W - 3} height={H - 3} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", borderRadius: rt.group === "garden" ? 14 : 6, pointerEvents: "none" }}>
      {els}
    </svg>
  );
}

// ================= Main app =================
export default function DreamHomeBuilderV3() {
  const [step, setStep] = useState(0);
  const [floors, setFloors] = useState(null);
  const [pack, setPack] = useState(null);

  const [placed, setPlaced] = useState([]);
  const [floor, setFloor] = useState(0);
  const [selected, setSelected] = useState(null);
  const [pickerTab, setPickerTab] = useState("finish");
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  const canvasRef = useRef(null);
  const [cell, setCell] = useState(40);
  const [displayCost, setDisplayCost] = useState(0);
  const [financing, setFinancing] = useState(null);
  const [showFinancing, setShowFinancing] = useState(false);
  const financingAsked = useRef(false);
  const [events, setEvents] = useState([]);
  const [peakCost, setPeakCost] = useState(0);
  const [removals, setRemovals] = useState(0);
  const [grows, setGrows] = useState(0);
  const [shrinks, setShrinks] = useState(0);
  const [upgrades, setUpgrades] = useState(0);
  const [showInsights, setShowInsights] = useState(false);
  const [finished, setFinished] = useState(false);
  const startTime = useRef(Date.now());
  const pickerRef = useRef(null);

  // bring the finish/furniture panel into view when a room is selected
  useEffect(() => {
    if (selected && pickerRef.current) {
      const t = setTimeout(() => pickerRef.current && pickerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
      return () => clearTimeout(t);
    }
  }, [selected]);

  const shellCost = floors ? FLOOR_OPTIONS.find((f) => f.key === floors).shell : 0;
  const roomCost = (r) => {
    const rt = ROOM_TYPES[r.type];
    const mult = rt.group ? FINISHES[rt.group][r.finish || 0].mult : 1;
    const furn = FURNITURE[r.type] ? FURNITURE[r.type][r.furn || 0].cost : 0;
    return Math.round(rt.perCell * r.w * r.h * mult) + furn;
  };
  const total = useMemo(() => shellCost + placed.reduce((s, r) => s + roomCost(r), 0), [placed, shellCost]);
  const P = pack ? PACKS[pack] : PACKS.minimalist;

  const log = useCallback((msg) => {
    const t = Math.round((Date.now() - startTime.current) / 1000);
    setEvents((e) => [...e.slice(-40), `${t}s — ${msg}`]);
  }, []);

  useEffect(() => {
    const measure = () => {
      if (canvasRef.current) {
        const w = canvasRef.current.parentElement.clientWidth;
        setCell(Math.max(24, Math.floor(Math.min(w, 680) / COLS)));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step]);

  useEffect(() => {
    let raf;
    const stepFn = () => {
      setDisplayCost((d) => {
        const diff = total - d;
        if (Math.abs(diff) < 5000) return total;
        raf = requestAnimationFrame(stepFn);
        return d + diff * 0.15;
      });
    };
    raf = requestAnimationFrame(stepFn);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  useEffect(() => {
    if (total > peakCost) setPeakCost(total);
    if (total >= PREMIUM_THRESHOLD && !financingAsked.current && step === 1) {
      financingAsked.current = true;
      setShowFinancing(true);
      log(`crossed ${fmtKES(PREMIUM_THRESHOLD)} — financing prompt`);
    }
  }, [total, peakCost, step, log]);

  const collides = (gx, gy, w, h, fl, ignoreId) =>
    placed.some((r) => {
      if (r.id === ignoreId || r.floor !== fl) return false;
      return gx < r.x + r.w && gx + w > r.x && gy < r.y + r.h && gy + h > r.y;
    });

  const defaultFinish = (typeKey) => {
    const rt = ROOM_TYPES[typeKey];
    if (!rt.group) return { finish: 0, color: 0 };
    if (rt.group === "floor" && pack) {
      const [fk, ci] = PACKS[pack].defFloor;
      const fi = FINISHES.floor.findIndex((f) => f.key === fk);
      return { finish: Math.max(0, fi), color: ci };
    }
    return { finish: 0, color: 0 };
  };

  const beginMove = (e, typeKey, roomId = null) => {
    e.preventDefault();
    e.stopPropagation();
    const room = roomId ? placed.find((r) => r.id === roomId) : null;
    const rt = ROOM_TYPES[typeKey];
    if (!roomId && rt.groundOnly && floor !== 0) return;
    const d = {
      mode: "move", typeKey, roomId,
      w: room ? room.w : rt.w, h: room ? room.h : rt.h,
      px: e.clientX, py: e.clientY,
      over: !!roomId, valid: !!roomId,
      gx: room ? room.x : 0, gy: room ? room.y : 0,
      startX: e.clientX, startY: e.clientY, moved: false,
    };
    dragRef.current = d;
    setDrag({ ...d });
    if (roomId) setSelected(roomId);
  };

  const beginResize = (e, roomId) => {
    e.preventDefault();
    e.stopPropagation();
    const room = placed.find((r) => r.id === roomId);
    dragRef.current = { mode: "resize", roomId, typeKey: room.type, startW: room.w, startH: room.h, px: e.clientX, py: e.clientY };
    setDrag({ ...dragRef.current });
  };

  useEffect(() => {
    const move = (e) => {
      const d = dragRef.current;
      if (!d || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      if (d.mode === "move") {
        const moved = d.moved || Math.abs(e.clientX - d.startX) + Math.abs(e.clientY - d.startY) > 6;
        const over = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
        let gx = Math.round((e.clientX - rect.left) / cell - d.w / 2);
        let gy = Math.round((e.clientY - rect.top) / cell - d.h / 2);
        gx = Math.max(0, Math.min(COLS - d.w, gx));
        gy = Math.max(0, Math.min(ROWS - d.h, gy));
        const valid = over && !collides(gx, gy, d.w, d.h, floor, d.roomId);
        const nd = { ...d, px: e.clientX, py: e.clientY, gx, gy, over, valid, moved };
        dragRef.current = nd;
        setDrag(nd);
      } else {
        const room = placed.find((r) => r.id === d.roomId);
        if (!room) return;
        const rt = ROOM_TYPES[room.type];
        let w = Math.round((e.clientX - rect.left) / cell) - room.x;
        let h = Math.round((e.clientY - rect.top) / cell) - room.y;
        w = Math.max(rt.min[0], Math.min(rt.max[0], Math.min(w, COLS - room.x)));
        h = Math.max(rt.min[1], Math.min(rt.max[1], Math.min(h, ROWS - room.y)));
        if ((w !== room.w || h !== room.h) && !collides(room.x, room.y, w, h, room.floor, room.id)) {
          setPlaced((p) => p.map((r) => (r.id === room.id ? { ...r, w, h } : r)));
        }
        setDrag({ ...d, px: e.clientX, py: e.clientY });
      }
    };

    const up = () => {
      const d = dragRef.current;
      if (!d) return;
      if (d.mode === "move") {
        const rt = ROOM_TYPES[d.typeKey];
        if (d.roomId && !d.moved) {
          // simple tap — selection already set in beginMove; do nothing destructive
        } else if (d.over && d.valid) {
          if (d.roomId) {
            setPlaced((p) => p.map((r) => (r.id === d.roomId ? { ...r, x: d.gx, y: d.gy } : r)));
            log(`moved ${rt.name}`);
          } else {
            const id = nextId();
            setPlaced((p) => [...p, { id, type: d.typeKey, x: d.gx, y: d.gy, w: d.w, h: d.h, floor, ...defaultFinish(d.typeKey) }]);
            setSelected(id);
            log(`added ${rt.name} ${d.w * 2}m×${d.h * 2}m`);
          }
        } else if (d.roomId && !d.over) {
          setPlaced((p) => p.filter((r) => r.id !== d.roomId));
          setRemovals((n) => n + 1);
          setSelected(null);
          log(`removed ${rt.name}`);
        }
      } else {
        const room = placed.find((r) => r.id === d.roomId);
        if (room && (room.w !== d.startW || room.h !== d.startH)) {
          const grew = room.w * room.h > d.startW * d.startH;
          grew ? setGrows((n) => n + 1) : setShrinks((n) => n + 1);
          log(`resized ${ROOM_TYPES[room.type].name} → ${room.w * 2}m×${room.h * 2}m`);
        }
      }
      dragRef.current = null;
      setDrag(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [cell, placed, floor, log, pack]);

  const setFinish = (roomId, finishIdx) => {
    setPlaced((p) => p.map((r) => {
      if (r.id !== roomId) return r;
      const rt = ROOM_TYPES[r.type];
      const oldMult = FINISHES[rt.group][r.finish || 0].mult;
      const newFin = FINISHES[rt.group][finishIdx];
      if (newFin.mult > oldMult) setUpgrades((n) => n + 1);
      log(`${rt.name} finish → ${newFin.name} (${newFin.colors[0][0]})`);
      return { ...r, finish: finishIdx, color: 0 };
    }));
  };
  const setColor = (roomId, colorIdx) => {
    setPlaced((p) => p.map((r) => {
      if (r.id !== roomId) return r;
      const rt = ROOM_TYPES[r.type];
      const fin = FINISHES[rt.group][r.finish || 0];
      log(`${rt.name} colour → ${fin.colors[colorIdx][0]}`);
      return { ...r, color: colorIdx };
    }));
  };
  const setFurn = (roomId, furnIdx) => {
    setPlaced((p) => p.map((r) => {
      if (r.id !== roomId) return r;
      const rt = ROOM_TYPES[r.type];
      const opt = FURNITURE[r.type][furnIdx];
      if (opt.cost > (FURNITURE[r.type][r.furn || 0].cost || 0)) setUpgrades((n) => n + 1);
      log(`${rt.name} furniture → ${opt.name}`);
      return { ...r, furn: furnIdx };
    }));
  };

  // ---------- insights ----------
  const insights = useMemo(() => {
    const of = (k) => placed.filter((r) => r.type === k);
    const beds = of("bedroom").length + of("master").length;
    const out = [];
    if (pack) out.push({ k: "Style segment", v: `${PACKS[pack].name} → creative direction for retargeting` });
    if (floors) out.push({ k: "Build ambition", v: `${FLOOR_OPTIONS.find((f) => f.key === floors).name}` });
    out.push({ k: "Budget band (peak)", v: peakCost < 12000000 ? "Under 12M — entry" : peakCost < 20000000 ? "12–20M — mid market" : "20M+ — premium" });
    // finish expectation: area-weighted multiplier
    const finished = placed.filter((r) => ROOM_TYPES[r.type].group);
    if (finished.length) {
      const area = finished.reduce((s, r) => s + r.w * r.h, 0);
      const wMult = finished.reduce((s, r) => s + FINISHES[ROOM_TYPES[r.type].group][r.finish || 0].mult * r.w * r.h, 0) / area;
      out.push({ k: "Finish expectation", v: wMult < 1.1 ? "Standard spec" : wMult < 1.3 ? "Upgraded spec" : "Luxury spec — show premium units" });
      const splurge = finished.filter((r) => FINISHES[ROOM_TYPES[r.type].group][r.finish || 0].mult >= 1.45);
      if (splurge.length) out.push({ k: "Splurge rooms", v: splurge.map((r) => ROOM_TYPES[r.type].name).join(", ") + " → their real priorities" });
      const darks = finished.filter((r) => {
        const c = FINISHES[ROOM_TYPES[r.type].group][r.finish || 0].colors[r.color || 0][1];
        return parseInt(c.slice(1), 16) < 0x808080;
      });
      if (darks.length >= 2) out.push({ k: "Palette taste", v: "Dark/rich tones → show moody-lux listings imagery" });
    }
    if (beds) out.push({ k: "Household signal", v: `${beds} bedroom${beds > 1 ? "s" : ""} → ${beds >= 3 ? "family buyer" : "small household"}` });
    if (of("pool").length) out.push({ k: "Premium flag", v: `Swimming pool (${FINISHES.pool[of("pool")[0].finish || 0].name})` });
    if (of("office").length) out.push({ k: "Lifestyle", v: `Home office${of("office").some((r) => (r.furn || 0) >= 1) ? " with executive study" : ""} → works from home` });
    // furniture-derived lifestyle signals
    const furnPick = (type, idx) => placed.some((r) => r.type === type && (r.furn || 0) >= idx);
    if (furnPick("living", 2) || furnPick("garden", 1)) out.push({ k: "Entertainer signal", v: [furnPick("living", 2) && "entertainer's lounge", placed.some((r) => r.type === "garden" && (r.furn || 0) === 2) ? "boma fire pit" : furnPick("garden", 1) && "alfresco dining"].filter(Boolean).join(" + ") + " → hosts guests, sell the compound" });
    if (furnPick("pool", 1)) out.push({ k: "Lifestyle", v: "Pool loungers → leisure-first, resort-style living" });
    if (furnPick("bath", 1)) out.push({ k: "Comfort signal", v: "Bathtub upgrade → comfort-oriented buyer" });
    if (furnPick("dsq", 1)) out.push({ k: "Practical signal", v: "Furnished DSQ → live-in staff or rental income plan" });
    const furnSpend = placed.reduce((s, r) => s + (FURNITURE[r.type] ? FURNITURE[r.type][r.furn || 0].cost : 0), 0);
    if (furnSpend >= 800000) out.push({ k: "Furnishing budget", v: `${fmtKES(furnSpend)} on furniture sets → turnkey buyer, show furnished units` });
    if (upgrades >= 2) out.push({ k: "Aspiration signal", v: `${upgrades} finish upgrades → aspirational, upsell-receptive` });
    if (grows > shrinks && grows >= 2) out.push({ k: "Space priority", v: `${grows} enlargements → space-first buyer` });
    if (shrinks + removals >= 2) out.push({ k: "Price sensitivity", v: `${shrinks} shrinks, ${removals} removals → budget-conscious` });
    if (financing) out.push({ k: "Financing readiness", v: financing });
    return out;
  }, [placed, peakCost, removals, grows, shrinks, upgrades, financing, pack, floors]);

  const profileLabel = useMemo(() => {
    const has = (k) => placed.some((r) => r.type === k);
    const beds = placed.filter((r) => r.type === "bedroom" || r.type === "master").length;
    if (placed.some((r) => r.type === "living" && (r.furn || 0) === 2) || placed.some((r) => r.type === "garden" && (r.furn || 0) === 2)) return "The Host";
    if (has("pool") && floors >= 2) return "The Statement Builder";
    if (has("office") && (has("dsq") || has("garage"))) return "The Executive";
    if (beds >= 3) return "The Family Nester";
    if (pack === "compact") return "The Smart Starter";
    return "The Modern Minimalist";
  }, [placed, floors, pack]);

  const premium = total >= PREMIUM_THRESHOLD;
  const selRoom = placed.find((r) => r.id === selected);
  const selGroup = selRoom ? ROOM_TYPES[selRoom.type].group : null;

  const S = {
    app: { fontFamily: "'Helvetica Neue', Arial, sans-serif", background: T.paper, minHeight: "100vh", color: T.ink },
    eyebrow: { fontSize: 11, letterSpacing: "0.22em", color: T.gold, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 },
    btn: (v = "gold") => ({
      background: v === "gold" ? T.gold : "transparent",
      color: v === "gold" ? T.ink : T.navy,
      border: v === "gold" ? "none" : "1px solid #C9D2DE",
      fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
      fontSize: 12, padding: "12px 20px", borderRadius: 6, cursor: "pointer",
    }),
    card: (active) => ({
      background: T.white, border: `2px solid ${active ? T.gold : "#DDE2E9"}`,
      borderRadius: 10, padding: "16px 16px 14px", cursor: "pointer", flex: "1 1 150px",
      boxShadow: active ? "0 4px 14px rgba(201,161,74,0.25)" : "0 1px 3px rgba(10,30,60,0.06)",
      minWidth: 150, transition: "border-color 0.15s",
    }),
  };

  // ================= STEP 0: SHELL =================
  if (step === 0) {
    return (
      <div style={S.app}>
        <div style={{ background: T.navy, color: T.white, padding: "22px 24px 20px" }}>
          <div style={S.eyebrow}>Blue Falcon Real Estate · Step 1 of 3</div>
          <h1 style={{ margin: 0, fontSize: "clamp(22px,4vw,34px)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em" }}>Shape Your House</h1>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#B9C4D4", maxWidth: 540 }}>
            Big decisions first — how tall, and in what style? Your style sets the default finishes; you can customise every room later.
          </p>
        </div>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
          <p style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 800, color: T.navy }}>How many floors?</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {FLOOR_OPTIONS.map((f) => (
              <div key={f.key} style={S.card(floors === f.key)} onClick={() => { setFloors(f.key); }}>
                <div style={{ fontSize: 26, marginBottom: 4 }}>{f.icon}</div>
                <div style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 14, color: T.navy }}>{f.name}</div>
                <div style={{ fontSize: 12, color: "#5A6472", margin: "4px 0 8px" }}>{f.desc}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.goldDeep }}>shell from {fmtKES(f.shell)}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 800, color: T.navy, marginTop: 28 }}>Pick your style</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {Object.entries(PACKS).map(([key, p]) => (
              <div key={key} style={S.card(pack === key)} onClick={() => setPack(key)}>
                <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                  {p.swatch.map((c, i) => <div key={i} style={{ width: 22, height: 22, borderRadius: 5, background: c }} />)}
                </div>
                <div style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 13, color: T.navy }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#5A6472", marginTop: 4 }}>{p.tag}</div>
              </div>
            ))}
          </div>
          <button
            style={{ ...S.btn("gold"), marginTop: 28, opacity: floors && pack ? 1 : 0.4 }}
            onClick={() => { if (floors && pack) setStep(1); }}
          >
            Start building →
          </button>
        </div>
      </div>
    );
  }

  // ================= STEP 1: BUILD =================
  const visibleRooms = placed.filter((r) => r.floor === floor);

  return (
    <div style={S.app}>
      <div style={{ background: T.navy, color: T.white, padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ ...S.eyebrow, marginBottom: 2 }}>Step 2 of 3 · {P.name}</div>
          <div style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 17 }}>Build, Resize & Finish</div>
        </div>
        <button style={{ ...S.btn("ghost"), color: T.white, borderColor: "#3A5378", padding: "8px 14px" }} onClick={() => setStep(0)}>← Shell</button>
      </div>

      <div style={{ position: "sticky", top: 0, zIndex: 40, background: T.ink, color: T.white, display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "10px 24px", borderBottom: `3px solid ${premium ? T.gold : T.navyMid}` }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: T.slate }}>Estimated build cost</div>
          <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 900, fontSize: "clamp(20px,4vw,30px)", color: premium ? T.gold : T.white, transition: "color 0.4s" }}>{fmtKES(displayCost)}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: T.slate }}>
          <div>{placed.length} room{placed.length !== 1 ? "s" : ""} · shell {fmtKES(shellCost)}</div>
          <div style={{ color: premium ? T.gold : T.slate, fontWeight: premium ? 800 : 400 }}>{premium ? "★ Premium build" : "no wrong answers"}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, padding: "18px 24px", maxWidth: 1140, margin: "0 auto" }}>
        {/* palette */}
        <div style={{ flex: "1 1 225px", minWidth: 225 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 800, color: T.navy, margin: "0 0 10px" }}>Drag onto the plot</p>
          {Object.entries(ROOM_TYPES).map(([key, rt]) => {
            const disabled = rt.groundOnly && floor !== 0;
            return (
              <div key={key}
                style={{ display: "flex", alignItems: "center", gap: 8, background: T.white, border: "1.5px solid #DDE2E9", borderRadius: 8, padding: "8px 12px", marginBottom: 7, cursor: disabled ? "not-allowed" : "grab", userSelect: "none", touchAction: "none", opacity: disabled ? 0.35 : 1 }}
                onPointerDown={(e) => !disabled && beginMove(e, key)}
                title={disabled ? "Ground floor only" : ""}
              >
                <span style={{ fontSize: 15 }}>{rt.icon}</span>
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: T.navy }}>{rt.name}</span>
                <span style={{ fontSize: 10.5, color: T.slate }}>{fmtKES(rt.perCell)}/sq</span>
              </div>
            );
          })}
          <p style={{ fontSize: 11, color: T.slate, marginTop: 8, lineHeight: 1.5 }}>
            Select a room → resize with the gold corner, then pick its finishes, colours and furniture below the plot.
          </p>
          <button style={{ ...S.btn("gold"), width: "100%", marginTop: 6 }} onClick={() => { setFinished(true); log("finished design"); }}>Finish my design →</button>
          <button style={{ ...S.btn("ghost"), width: "100%", marginTop: 8 }} onClick={() => setShowInsights((v) => !v)}>{showInsights ? "Hide" : "Show"} sales-team view</button>
        </div>

        {/* canvas column */}
        <div style={{ flex: "3 1 450px", minWidth: 300 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {Array.from({ length: floors }).map((_, i) => (
              <button key={i} style={{ ...S.btn(floor === i ? "gold" : "ghost"), padding: "8px 14px", fontSize: 11 }} onClick={() => { setFloor(i); setSelected(null); }}>
                {FLOOR_NAMES[i]}
              </button>
            ))}
          </div>

          <div
            ref={canvasRef}
            onPointerDown={() => setSelected(null)}
            style={{
              position: "relative", width: COLS * cell, height: ROWS * cell, maxWidth: "100%",
              background: P.canvas, borderRadius: 10,
              border: `2px solid ${drag && drag.mode === "move" ? (drag.valid ? T.green : drag.over ? T.danger : T.navyMid) : "#D5DBE4"}`,
              backgroundImage: `linear-gradient(to right, rgba(10,30,60,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,30,60,0.045) 1px, transparent 1px)`,
              backgroundSize: `${cell}px ${cell}px`,
              boxShadow: "0 4px 16px rgba(10,30,60,0.08)", overflow: "hidden",
            }}
          >
            {/* compass */}
            <svg width={34} height={34} viewBox="0 0 34 34" style={{ position: "absolute", top: 8, right: 8, opacity: 0.55, pointerEvents: "none" }}>
              <circle cx={17} cy={17} r={15} fill="none" stroke={T.navy} strokeWidth={1.5} />
              <polygon points="17,4 20,17 17,14 14,17" fill={T.danger} />
              <polygon points="17,30 20,17 17,20 14,17" fill={T.navy} />
              <text x={17} y={3} textAnchor="middle" fontSize={6} fontWeight={800} fill={T.navy}>N</text>
            </svg>

            {visibleRooms.length === 0 && !drag && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: T.slate, fontSize: 13, textAlign: "center", padding: 20 }}>
                {floor === 0 ? "Your plot awaits — rooms, garden and pool go here." : `${FLOOR_NAMES[floor]} is empty. Bedrooms up here?`}
              </div>
            )}

            {visibleRooms.map((r) => {
              const rt = ROOM_TYPES[r.type];
              const isSel = selected === r.id;
              const isDragging = drag && drag.mode === "move" && drag.roomId === r.id;
              return (
                <div key={r.id}
                  style={{
                    position: "absolute", left: r.x * cell, top: r.y * cell,
                    width: r.w * cell - 3, height: r.h * cell - 3, margin: 1.5,
                    borderRadius: rt.group === "garden" ? 14 : 6,
                    cursor: "grab", userSelect: "none", touchAction: "none",
                    opacity: isDragging ? 0.35 : 1,
                    boxShadow: isSel ? `0 0 0 2.5px ${T.gold}, 0 4px 10px rgba(10,30,60,0.2)` : "0 2px 6px rgba(10,30,60,0.12)",
                  }}
                  onPointerDown={(e) => beginMove(e, r.type, r.id)}
                >
                  <RoomArt room={r} cell={cell} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 3, textAlign: "center", pointerEvents: "none" }}>
                    <span style={{ background: "rgba(10,30,60,0.75)", color: "#FFF", fontSize: Math.max(8, cell * 0.19), fontWeight: 700, padding: "1.5px 6px", borderRadius: 4 }}>
                      {rt.name} · {r.w * 2}×{r.h * 2}m · {fmtKES(roomCost(r))}
                    </span>
                  </div>
                  {isSel && (
                    <div
                      onPointerDown={(e) => beginResize(e, r.id)}
                      style={{ position: "absolute", right: -7, bottom: -7, width: 18, height: 18, background: T.gold, border: `2px solid ${T.white}`, borderRadius: 5, cursor: "nwse-resize", touchAction: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
                    />
                  )}
                </div>
              );
            })}

            {drag && drag.mode === "move" && drag.over && (
              <div style={{ position: "absolute", left: drag.gx * cell, top: drag.gy * cell, width: drag.w * cell, height: drag.h * cell, background: drag.valid ? "rgba(78,122,87,0.25)" : "rgba(180,69,58,0.2)", border: `2px dashed ${drag.valid ? T.green : T.danger}`, borderRadius: 6, pointerEvents: "none" }} />
            )}
          </div>
          <p style={{ fontSize: 11, color: T.slate, marginTop: 8 }}>Plot: {COLS * 2}m × {ROWS * 2}m · each square = 2m × 2m</p>

          {/* ======= FINISH & FURNITURE PICKER ======= */}
          {selRoom && (selGroup || FURNITURE[selRoom.type]) && (
            <div ref={pickerRef} style={{ marginTop: 12, background: T.white, border: "1.5px solid #DDE2E9", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 800, color: T.navy }}>
                  {ROOM_TYPES[selRoom.type].name}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  {selGroup && (
                    <button onClick={() => setPickerTab("finish")}
                      style={{ background: pickerTab === "finish" ? T.navy : "transparent", color: pickerTab === "finish" ? T.white : T.navy, border: `1.5px solid ${pickerTab === "finish" ? T.navy : "#DDE2E9"}`, borderRadius: 6, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 12px", cursor: "pointer" }}>
                      Finishes
                    </button>
                  )}
                  {FURNITURE[selRoom.type] && (
                    <button onClick={() => setPickerTab("furniture")}
                      style={{ background: pickerTab === "furniture" ? T.navy : "transparent", color: pickerTab === "furniture" ? T.white : T.navy, border: `1.5px solid ${pickerTab === "furniture" ? T.navy : "#DDE2E9"}`, borderRadius: 6, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 12px", cursor: "pointer" }}>
                      Furniture
                    </button>
                  )}
                </div>
              </div>

              {/* ---- Furniture tab ---- */}
              {pickerTab === "furniture" && FURNITURE[selRoom.type] && (
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                  {FURNITURE[selRoom.type].map((f, fi) => {
                    const active = (selRoom.furn || 0) === fi;
                    return (
                      <div key={f.name} onClick={() => setFurn(selRoom.id, fi)}
                        style={{ flex: "0 0 auto", width: 128, border: `2px solid ${active ? T.gold : "#E4E8EE"}`, borderRadius: 8, padding: 10, cursor: "pointer", background: active ? "#FDF9F0" : T.white }}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: T.navy, lineHeight: 1.2 }}>{f.name}</div>
                        <div style={{ fontSize: 10.5, color: "#5A6472", margin: "3px 0 6px", lineHeight: 1.3 }}>{f.desc}</div>
                        <div style={{ fontSize: 10.5, color: f.cost > 0 ? T.goldDeep : T.slate, fontWeight: 700 }}>
                          {f.cost > 0 ? `+${fmtKES(f.cost)}` : "included"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ---- Finishes tab ---- */}
              {pickerTab === "finish" && selGroup && (<>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                {FINISHES[selGroup].map((f, fi) => {
                  const active = (selRoom.finish || 0) === fi;
                  return (
                    <div key={f.key}
                      onClick={() => setFinish(selRoom.id, fi)}
                      style={{
                        flex: "0 0 auto", width: 118, border: `2px solid ${active ? T.gold : "#E4E8EE"}`,
                        borderRadius: 8, padding: 8, cursor: "pointer", background: active ? "#FDF9F0" : T.white,
                      }}
                    >
                      <div style={{ height: 34, borderRadius: 5, background: f.colors[0][1], position: "relative", overflow: "hidden", marginBottom: 6 }}>
                        {f.tex === "plank" && [...Array(4)].map((_, i) => <div key={i} style={{ position: "absolute", top: i * 9, left: 0, right: 0, height: 1, background: "rgba(0,0,0,0.15)" }} />)}
                        {f.tex === "tile" && <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)", backgroundSize: "11px 11px" }} />}
                        {f.tex === "gloss" && <div style={{ position: "absolute", top: 0, left: 8, width: 16, height: 40, background: "rgba(255,255,255,0.35)", transform: "skewX(-20deg)" }} />}
                        {(f.tex === "granite" || f.tex === "carpet") && [...Array(10)].map((_, i) => <div key={i} style={{ position: "absolute", top: (i * 13) % 30 + 2, left: (i * 23) % 106 + 4, width: 2, height: 2, borderRadius: 2, background: i % 2 ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)" }} />)}
                        {f.tex === "water" && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, rgba(255,255,255,0.35), transparent 60%)` }} />}
                        {f.tex === "grass" && [...Array(8)].map((_, i) => <div key={i} style={{ position: "absolute", top: (i * 11) % 28 + 3, left: (i * 17) % 108 + 4, width: 1.5, height: 5, background: "rgba(0,0,0,0.25)", borderRadius: 2, transform: "rotate(8deg)" }} />)}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: T.navy, lineHeight: 1.2 }}>{f.name}</div>
                      <div style={{ fontSize: 10.5, color: f.mult > 1 ? T.goldDeep : T.slate, fontWeight: 700, marginTop: 2 }}>
                        {f.mult > 1 ? `+${Math.round((f.mult - 1) * 100)}%` : "standard"}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* colorways */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 800, color: T.slate }}>Colour</span>
                {FINISHES[selGroup][selRoom.finish || 0].colors.map(([name, hex], ci) => (
                  <div key={hex} onClick={() => setColor(selRoom.id, ci)} title={name}
                    style={{
                      width: 26, height: 26, borderRadius: 7, background: hex, cursor: "pointer",
                      border: `2.5px solid ${(selRoom.color || 0) === ci ? T.gold : "#E4E8EE"}`,
                      boxShadow: (selRoom.color || 0) === ci ? "0 2px 6px rgba(201,161,74,0.4)" : "none",
                    }}
                  />
                ))}
                <span style={{ fontSize: 11, color: T.navy, fontWeight: 600, marginLeft: 4 }}>
                  {FINISHES[selGroup][selRoom.finish || 0].colors[selRoom.color || 0][0]}
                </span>
              </div>
              </>)}
            </div>
          )}

          {showInsights && (
            <div style={{ marginTop: 14, background: T.navy, color: T.white, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ ...S.eyebrow, marginBottom: 10 }}>What the game is quietly learning</div>
              {insights.map((i) => (
                <div key={i.k + i.v} style={{ display: "flex", gap: 10, fontSize: 12.5, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ color: T.gold, fontWeight: 700, minWidth: 155 }}>{i.k}</span>
                  <span style={{ color: "#DEE6F0" }}>{i.v}</span>
                </div>
              ))}
              <details style={{ marginTop: 10 }}>
                <summary style={{ fontSize: 11, color: T.slate, cursor: "pointer" }}>Raw event log ({events.length})</summary>
                <div style={{ fontSize: 11, color: "#9FB0C6", fontFamily: "monospace", marginTop: 6, maxHeight: 130, overflowY: "auto" }}>
                  {events.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>

      {drag && drag.mode === "move" && !drag.over && (
        <div style={{ position: "fixed", left: drag.px + 12, top: drag.py + 12, background: T.navy, color: T.white, fontSize: 12, fontWeight: 700, padding: "6px 10px", borderRadius: 6, pointerEvents: "none", zIndex: 100, opacity: 0.9 }}>
          {drag.roomId ? "Release to remove" : ROOM_TYPES[drag.typeKey].name}
        </div>
      )}

      {showFinancing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,30,60,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: T.white, borderRadius: 12, padding: "26px 26px 22px", maxWidth: 400, width: "100%" }}>
            <div style={{ ...S.eyebrow, color: T.goldDeep }}>Going premium ★</div>
            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, textTransform: "uppercase", color: T.navy }}>This build just passed {fmtKES(PREMIUM_THRESHOLD)}</h2>
            <p style={{ fontSize: 13, color: "#5A6472", margin: "0 0 16px" }}>Love the ambition. If you were building this for real, how would you fund it?</p>
            {["Mortgage / bank financing", "Savings — cash buyer", "Build in phases over time", "Just dreaming for now 😄"].map((opt) => (
              <button key={opt}
                style={{ display: "block", width: "100%", textAlign: "left", background: T.paper, border: "1.5px solid #DDE2E9", borderRadius: 8, padding: "11px 14px", fontSize: 13.5, fontWeight: 600, color: T.navy, marginBottom: 8, cursor: "pointer" }}
                onClick={() => { setFinancing(opt); setShowFinancing(false); log(`financing: ${opt}`); }}
              >{opt}</button>
            ))}
          </div>
        </div>
      )}

      {finished && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,30,60,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: T.white, borderRadius: 12, maxWidth: 440, width: "100%", overflow: "hidden" }}>
            <div style={{ background: T.navy, color: T.white, padding: "22px 24px" }}>
              <div style={S.eyebrow}>Step 3 of 3 · Your dream home profile</div>
              <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, textTransform: "uppercase" }}>{profileLabel}</h2>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#B9C4D4" }}>
                {FLOOR_OPTIONS.find((f) => f.key === floors)?.name} · {P.name} · {placed.length} rooms · {fmtKES(total)}
              </p>
            </div>
            <div style={{ padding: "18px 24px 22px" }}>
              <p style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 800, color: T.goldDeep, margin: "0 0 10px" }}>Properties that match your build</p>
              {["Plainsview Estate, Kitengela — Phase 2 bungalows", "Emayian Residences, Laiser Hill", "Serviced plots, Nairobi–Namanga Highway"].map((l) => (
                <div key={l} style={{ fontSize: 13.5, color: T.navy, fontWeight: 600, padding: "8px 0", borderBottom: "1px solid #EEF1F5" }}>{l}</div>
              ))}
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <input placeholder="WhatsApp number for your matches" style={{ flex: 1, border: "1.5px solid #DDE2E9", borderRadius: 6, padding: "10px 12px", fontSize: 13 }} />
                <button style={S.btn("gold")}>Send</button>
              </div>
              <p style={{ fontSize: 10.5, color: T.slate, marginTop: 8 }}>Prototype — nothing is sent or stored. In production this writes to Supabase.</p>
              <button style={{ ...S.btn("ghost"), width: "100%", marginTop: 10 }} onClick={() => setFinished(false)}>← Keep building</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
