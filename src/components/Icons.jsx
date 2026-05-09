export function Icon({ d, size = 20, stroke = "currentColor", sw = 1.5, fill = "none", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}>
      {d}
    </svg>
  );
}

export const IcoHome     = (p) => <Icon {...p} d={<><path d="M3 11l9-8 9 8"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></>}/>;
export const IcoPractice = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9"/><path d="M12 4v8l5 3"/></>}/>;
export const IcoChat     = (p) => <Icon {...p} d={<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>}/>;
export const IcoBank     = (p) => <Icon {...p} d={<><path d="M3 10l9-6 9 6"/><path d="M5 10v9M19 10v9M9 10v9M15 10v9"/><path d="M3 21h18"/></>}/>;
export const IcoSearch   = (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></>}/>;
export const IcoUser     = (p) => <Icon {...p} d={<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7"/></>}/>;
export const IcoMoon     = (p) => <Icon {...p} d={<path d="M21 13.5A8.5 8.5 0 0 1 10.5 3a7 7 0 1 0 10.5 10.5z"/>}/>;
export const IcoSun      = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19"/></>}/>;
export const IcoSpeak    = (p) => <Icon {...p} d={<><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a8 8 0 0 1 0 12"/></>}/>;
export const IcoPen      = (p) => <Icon {...p} d={<><path d="M14 4l6 6L8 22H2v-6z"/><path d="M13 5l6 6"/></>}/>;
export const IcoFlame    = (p) => <Icon {...p} d={<path d="M12 21c4 0 7-3 7-7 0-3-2-5-3-7 0 2-2 3-3 3 0-3-1-6-3-8-1 4-5 6-5 11 0 5 3 8 7 8z"/>}/>;
export const IcoCheck    = (p) => <Icon {...p} d={<path d="M5 12l4 4 10-10"/>}/>;
export const IcoArrow    = (p) => <Icon {...p} d={<><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>}/>;
export const IcoClose    = (p) => <Icon {...p} d={<><path d="M6 6l12 12M18 6L6 18"/></>}/>;
export const IcoMic      = (p) => <Icon {...p} d={<><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></>}/>;
export const IcoGrid     = (p) => <Icon {...p} d={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>}/>;
export const IcoSwap     = (p) => <Icon {...p} d={<><path d="M7 10h13M7 10l4-4M7 10l4 4"/><path d="M17 14H4M17 14l-4-4M17 14l-4 4"/></>}/>;
export const IcoList     = (p) => <Icon {...p} d={<><path d="M4 6h16M4 12h16M4 18h10"/></>}/>;
