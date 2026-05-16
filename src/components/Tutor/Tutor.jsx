import { motion } from "framer-motion";

// Le Tuteur — engraving-style line drawing of the user's French tutor.
//
// One figure, two personas (Henri / Simone), sixteen emotional states,
// seven hand-held accessories, three crops. Pure stroke at 1.6 px so the
// figure reads as an engraving rather than an icon — finer than the rest
// of the icon set on purpose.
//
// Key character beats (from the question round):
//   - timeless age, melancholic Camus-philosopher mood
//   - half-moon reader glasses LOW on the nose; eyes look OVER them
//   - tweed jacket with subtle hatching
//   - clean-shaven, thick swept hair (Henri) / high chignon (Simone)
//   - floats — no surface plate, no glow ring
//
// crop:
//   'face' — head only, viewBox 100x100, used inline / in chat heads
//   'bust' — head + shoulders + jacket, 100x140, the default placement
//   'full' — full standing figure, 100x240, hero / onboarding / profile

const EMOTIONS = [
  'idle', 'happy', 'speaking', 'listening', 'thinking', 'reading',
  'correct', 'wrong', 'proud', 'curious', 'waving', 'sleeping',
  'amused', 'melancholic', 'encouraging', 'dignified',
];

const ACCESSORIES = ['pipe', 'espresso', 'book', 'pen', 'cigarette', 'baguette'];

const PERSONAS = {
  henri:  { label: 'Henri',  gender: 'm', tagline: 'din lærer' },
  simone: { label: 'Simone', gender: 'f', tagline: 'din lærer' },
};

// Per-emotion mapping. Subtle is the goal — most states differ only in
// brows + mouth + eye position. "look" is where the eyes point: over the
// glasses (default), down (reading), up (thinking), or closed.
const EXPR = {
  idle:         { mouth: 'thin',   brows: 'flat',   look: 'over' },
  happy:        { mouth: 'smile',  brows: 'soft',   look: 'over' },
  speaking:     { mouth: 'open',   brows: 'flat',   look: 'over', cue: 'speech' },
  listening:    { mouth: 'thin',   brows: 'soft',   look: 'over', cue: 'ear' },
  thinking:     { mouth: 'pursed', brows: 'asym',   look: 'up' },
  reading:      { mouth: 'thin',   brows: 'flat',   look: 'down' },
  correct:      { mouth: 'half',   brows: 'soft',   look: 'over' },
  wrong:        { mouth: 'frown',  brows: 'concern',look: 'over' },
  proud:        { mouth: 'smile',  brows: 'lift',   look: 'over' },
  curious:      { mouth: 'oh',     brows: 'asym',   look: 'over' },
  waving:       { mouth: 'half',   brows: 'soft',   look: 'over', cue: 'wave' },
  sleeping:     { mouth: 'asleep', brows: 'flat',   look: 'closed', cue: 'sleep' },
  amused:       { mouth: 'wry',    brows: 'asym',   look: 'over' },
  melancholic:  { mouth: 'thin',   brows: 'flat',   look: 'down' },
  encouraging:  { mouth: 'half',   brows: 'soft',   look: 'over', cue: 'nod' },
  dignified:    { mouth: 'thin',   brows: 'lift',   look: 'over' },
};

// ── Anatomy pieces (all stroke-only, currentColor) ───────────────────────

// Head — slightly elongated, narrower jaw than v1. Centered at (50, 46)
// inside a 100×100 face viewBox.
const HeadPath = () => (
  <path d="M28 46 C28 32 36 22 50 22 C64 22 72 32 72 46 C72 54 70 60 66 64
           L66 70 C66 73 63 75 60 75 L40 75 C37 75 34 73 34 70 L34 64
           C30 60 28 54 28 46 Z" />
);

// Ear — small notch on each side
const Ears = () => (
  <>
    <path d="M28 47 C25 47 24 49 25 52" />
    <path d="M72 47 C75 47 76 49 75 52" />
  </>
);

// Half-moon reader glasses sitting LOW. The bridge is a small arch that
// rises OVER the nose, so the nose ridge can continue uninterrupted.
const Glasses = () => (
  <>
    {/* left lens: flat top + bottom arc */}
    <path d="M30 54 L43 54" />
    <path d="M30 54 Q36.5 62 43 54" />
    {/* right lens */}
    <path d="M57 54 L70 54" />
    <path d="M57 54 Q63.5 62 70 54" />
    {/* bridge — arches up over the nose */}
    <path d="M43 54 Q50 49 57 54" />
    {/* temple tips */}
    <path d="M30 54 L26 52" />
    <path d="M70 54 L74 52" />
  </>
);

// Nose — long Romanesque ridge that goes BEHIND the bridge arch. Ends in
// a small hook at the base, terminating just above the mouth.
const Nose = () => <path d="M50 47 L50 61 L48.5 62.5" />;

// Mouth library — every mouth is drawn at (50, 67). Differences are
// exaggerated relative to v1 so they read at small sizes.
const Mouth = ({ kind }) => {
  switch (kind) {
    case 'thin':   return <path d="M45 67 L55 67" />;
    case 'smile':  return <path d="M43 65.5 Q50 71 57 65.5" />;
    case 'half':   return <path d="M44 67 Q48 70 52 68.5 L57 66.5" />;
    case 'open':   return <ellipse cx="50" cy="67" rx="2.4" ry="2.2" />;
    case 'oh':     return <ellipse cx="50" cy="67.5" rx="1.6" ry="2.6" />;
    case 'pursed': return <ellipse cx="50" cy="67" rx="1.6" ry="1.2" />;
    case 'wry':    return <path d="M43 68.5 Q47 67.5 51 68.5 Q54 69.5 57 65.5" />;
    case 'asleep': return <path d="M45 68 Q50 66 55 68" />;
    case 'frown':  return <path d="M44 68 Q50 65 56 68" />;
    default:       return <path d="M45 67 L55 67" />;
  }
};

// Brows
const Brows = ({ kind }) => {
  const L = {
    flat:    'M34 40 L42 39',
    soft:    'M34 40 Q38 38 42 40',
    lift:    'M34 38 Q38 36 42 38',
    asym:    'M34 40 L42 39',
    concern: 'M34 38 Q38 42 42 40',
  }[kind];
  const R = {
    flat:    'M58 39 L66 40',
    soft:    'M58 40 Q62 38 66 40',
    lift:    'M58 38 Q62 36 66 38',
    asym:    'M58 38 Q62 35 66 37',   // one brow higher
    concern: 'M58 40 Q62 42 66 38',
  }[kind];
  return (<><path d={L} /><path d={R} /></>);
};

// Eyes — placed ABOVE the half-moon glasses. They look over the rim by
// default; "down" tucks them behind the rim for reading.
const Eyes = ({ look }) => {
  if (look === 'closed') {
    return (<>
      <path d="M34 48 Q38 50 42 48" />
      <path d="M58 48 Q62 50 66 48" />
    </>);
  }
  // pupil coordinates per look
  const pos = {
    over: [[38, 47], [62, 47]],
    down: [[38, 50], [62, 50]],
    up:   [[37, 45], [61, 45]],
  }[look] || [[38, 47], [62, 47]];
  return (<>
    <circle cx={pos[0][0]} cy={pos[0][1]} r="1.05" fill="currentColor" stroke="none" />
    <circle cx={pos[1][0]} cy={pos[1][1]} r="1.05" fill="currentColor" stroke="none" />
  </>);
};

// Hair: Henri — thick, swept back. A single closed band shape sitting on
// top of the skull, with one inner part-line for texture. No stray
// strokes below the hairline.
const HairHenri = () => (
  <>
    <path d="M28 38 C29 25 38 18 50 18 C62 18 71 25 72 38
             C70 30 62 26 50 26 C38 26 30 30 28 38 Z" />
    {/* a single internal sweep line */}
    <path d="M36 28 Q48 22 60 26" opacity="0.6" />
  </>
);

// Hair: Simone — tightly pulled back into a high chignon. The front is a
// smooth band that hugs the skull; the bun sits high.
const HairSimone = () => (
  <>
    <path d="M28 40 C28 28 38 22 50 22 C62 22 72 28 72 40
             C70 32 62 30 50 30 C38 30 30 32 28 40 Z" />
    {/* high chignon */}
    <ellipse cx="55" cy="17" rx="8" ry="9" />
    <path d="M52 17 Q57 14 60 19" opacity="0.55" />
    {/* tiny earring dot */}
    <circle cx="27" cy="52" r="0.9" fill="currentColor" stroke="none" />
  </>
);

// Chin / soft line
const Chin = () => <path d="M42 73 Q50 76 58 73" />;

// Tweed jacket — lapels + collar + shoulders + hatching. Drawn into the
// area below the head (y=75 onwards), so used in 'bust' and 'full' crops.
// Hatching opacity is 0.55 so the texture doesn't compete with face lines.
const TweedJacket = ({ neck = 'shirt' }) => (
  <>
    {/* neck inset */}
    {neck === 'shirt' ? (
      <path d="M42 75 L42 84 M58 75 L58 84" />
    ) : (
      <>
        {/* turtleneck: rounded fold */}
        <path d="M40 76 C42 82 58 82 60 76" />
        <path d="M40 80 C44 84 56 84 60 80" />
      </>
    )}
    {/* lapels — V opening */}
    <path d="M34 84 L42 88 L50 92" />
    <path d="M66 84 L58 88 L50 92" />
    {/* shoulders + jacket edges */}
    <path d="M34 84 C24 88 18 96 18 110 L18 130" />
    <path d="M66 84 C76 88 82 96 82 110 L82 130" />
    {/* placket / center seam */}
    <path d="M50 92 L50 130" />
    {/* pocket flap hint */}
    <path d="M62 108 L72 108 L72 114 L62 114 Z" />
    {/* tweed hatching */}
    <g opacity="0.55" strokeWidth="0.8">
      <path d="M24 96 L28 92" />
      <path d="M22 102 L26 98" />
      <path d="M26 108 L30 104" />
      <path d="M22 116 L26 112" />
      <path d="M30 122 L34 118" />
      <path d="M70 96 L74 92" />
      <path d="M68 102 L72 98" />
      <path d="M72 108 L76 104" />
      <path d="M70 116 L74 112" />
      <path d="M66 122 L70 118" />
      <path d="M40 100 L44 96" opacity="0.5" />
      <path d="M54 104 L58 100" opacity="0.5" />
    </g>
  </>
);

// ── Accessories (drawn in the bust crop; positioned around y=85–115) ─────

const Accessory = ({ kind, persona }) => {
  // hand position varies slightly so each accessory looks held
  switch (kind) {
    case 'pipe':
      return (
        <g>
          {/* stem from near mouth, bowl to the right */}
          <path d="M55 68 L72 68" />
          <path d="M72 66 L78 64 L78 72 L72 72 Z" />
          {/* faint smoke */}
          <g opacity="0.45" strokeDasharray="0 0">
            <path d="M76 60 Q78 56 75 53 Q72 50 75 47" />
            <path d="M81 58 Q83 54 80 51" />
          </g>
        </g>
      );
    case 'espresso':
      return (
        <g>
          {/* small cup with saucer raised near chin */}
          <path d="M60 80 L72 80 L70 86 L62 86 Z" />
          <path d="M58 87 L74 87" />
          <path d="M72 81 Q76 83 72 85" />
          {/* steam */}
          <g opacity="0.4">
            <path d="M64 78 Q66 75 64 72" />
            <path d="M68 78 Q70 75 68 72" />
          </g>
        </g>
      );
    case 'book':
      return (
        <g>
          {/* open book, held at chest height */}
          <path d="M30 100 L50 96 L70 100 L70 118 L50 114 L30 118 Z" />
          <path d="M50 96 L50 114" />
          <path d="M34 104 L46 102 M34 108 L46 106 M34 112 L46 110" opacity="0.55" strokeWidth="0.8" />
          <path d="M54 102 L66 104 M54 106 L66 108 M54 110 L66 112" opacity="0.55" strokeWidth="0.8" />
        </g>
      );
    case 'pen':
      return (
        <g>
          {/* fountain pen, held vertically near chin */}
          <path d="M62 70 L66 86" />
          <path d="M62 70 L64 68 L66 72 Z" />
          {/* hand */}
          <circle cx="64" cy="86" r="2" />
        </g>
      );
    case 'cigarette':
      return (
        <g>
          {/* held between fingers, near temple */}
          <path d="M72 64 L82 60" />
          <path d="M82 60 L84 59" opacity="0.6" />  {/* ember */}
          {/* smoke */}
          <g opacity="0.35">
            <path d="M84 58 Q86 54 84 50 Q82 46 84 42" />
          </g>
          {/* fingers */}
          <path d="M70 66 Q74 66 76 64" />
        </g>
      );
    case 'baguette':
      return (
        <g>
          {/* baguette tucked under right arm, diagonal */}
          <path d="M62 90 L96 78" />
          <path d="M62 90 L96 86" />
          {/* tip slashes */}
          <path d="M68 87 L72 85 M75 86 L79 84 M82 84 L86 82" opacity="0.6" strokeWidth="0.8" />
        </g>
      );
    default: return null;
  }
};

// Speech / listening / thinking / wave / nod cues drawn beside the head
const Cue = ({ kind }) => {
  switch (kind) {
    case 'speech':
      return (
        <g opacity="0.85">
          <path d="M78 64 Q82 67 78 70" />
          <path d="M82 60 Q88 67 82 74" />
        </g>
      );
    case 'ear':
      return (
        <g opacity="0.85">
          <path d="M78 46 Q82 50 78 54" />
          <path d="M82 42 Q88 50 82 58" />
        </g>
      );
    case 'sleep':
      return (
        <g opacity="0.7" stroke="none" fill="currentColor">
          <text x="76" y="32" fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic" fontSize="11">z</text>
          <text x="84" y="22" fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic" fontSize="8">z</text>
        </g>
      );
    case 'wave':
      return (
        <g>
          {/* raised hand to the right of head */}
          <path d="M76 48 C80 46 84 42 86 36" />
          <circle cx="76" cy="48" r="1.8" />
          <path d="M88 28 Q90 26 91 24" opacity="0.5" />
          <path d="M92 32 Q94 30 95 28" opacity="0.5" />
        </g>
      );
    case 'nod':
      return null; // nod is a motion thing, no static cue
    default: return null;
  }
};

// ── The figure ───────────────────────────────────────────────────────────

const Tutor = ({
  persona = 'henri',
  emotion = 'idle',
  accessory = null,
  crop = 'bust',
  size = 100,
  color,
  title,
  style,
}) => {
  const e = EXPR[emotion] || EXPR.idle;
  const isF = (PERSONAS[persona] || PERSONAS.henri).gender === 'f';
  const neck = isF ? 'turtle' : 'shirt';

  // viewBox + height by crop
  const vb = crop === 'face' ? '0 0 100 100'
           : crop === 'full' ? '0 0 100 240'
           : '0 0 100 140';
  const h = crop === 'face' ? size
          : crop === 'full' ? size * 2.4
          : size * 1.4;

  return (
    <svg viewBox={vb} width={size} height={h}
         fill="none" stroke={color || 'currentColor'}
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
         role="img" aria-label={title || `${persona}, ${emotion}`}
         style={style}>
      {/* head */}
      <HeadPath />
      <Ears />
      {isF ? <HairSimone /> : <HairHenri />}
      <Glasses />
      <Brows kind={e.brows} />
      <Eyes look={e.look} />
      <Nose />
      <Mouth kind={e.mouth} />
      <Chin />

      {/* bust + full add jacket */}
      {crop !== 'face' && <TweedJacket neck={neck} />}

      {/* full body extends below jacket — legs + ground line */}
      {crop === 'full' && (
        <g>
          {/* jacket hem */}
          <path d="M18 130 L82 130" />
          {/* shirt/turtleneck extends */}
          <path d="M30 130 L30 170" />
          <path d="M70 130 L70 170" />
          <path d="M30 170 Q50 174 70 170" />
          {/* trousers */}
          <path d="M34 170 L32 220" />
          <path d="M48 170 L46 220" />
          <path d="M52 170 L54 220" />
          <path d="M66 170 L68 220" />
          {/* shoes */}
          <path d="M28 220 L40 220 L40 226 L28 226 Z" />
          <path d="M60 220 L72 220 L72 226 L60 226 Z" />
          {/* slight asymmetry — hand in pocket on right */}
          <path d="M70 130 C76 138 76 148 72 152" />
        </g>
      )}

      {/* accessory + cue layered on top */}
      {accessory && crop !== 'face' && <Accessory kind={accessory} persona={persona} />}
      <Cue kind={e.cue} />
    </svg>
  );
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// heroMode: proud/mestret spring entrance
// nodOnMount: one-shot head-nod for encouraging
export function TutorAnimated({ persona, emotion, accessory, crop, size, color, title, style, heroMode, nodOnMount }) {
  const reduced = prefersReducedMotion();
  const showIdle = !reduced && ["idle", "listening", "reading", "dignified", "sleeping"].includes(emotion);
  const showNod = !reduced && nodOnMount && emotion === "encouraging";
  const showSmoke = !reduced && (accessory === "pipe" || accessory === "espresso") && size >= 92;

  const enterAnim = heroMode && !reduced
    ? { opacity: [0, 1], scale: [0.85, 1.04, 1] }
    : { opacity: 1, y: 0 };
  const enterTransition = heroMode && !reduced
    ? { duration: 0.5, ease: [0.16, 1, 0.3, 1], times: [0, 0.6, 1], type: "spring", stiffness: 240, damping: 20 }
    : { duration: 0.25, ease: [0.16, 1, 0.3, 1] };

  return (
    <motion.div
      initial={heroMode && !reduced ? { opacity: 0, scale: 0.85 } : { opacity: 0, y: 6 }}
      animate={enterAnim}
      transition={enterTransition}
      style={style}
    >
      <motion.div
        animate={
          showNod ? { rotate: [0, 5, -2, 0] } :
          showIdle ? { scale: [1, 1.012, 1] } : {}
        }
        transition={
          showNod ? { duration: 0.35, ease: "easeInOut" } :
          showIdle ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : {}
        }
      >
        <Tutor persona={persona} emotion={emotion} accessory={accessory} crop={crop} size={size} color={color} title={title} />
      </motion.div>
      {showSmoke && (
        <motion.div
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}

export { Tutor, EMOTIONS, ACCESSORIES, PERSONAS, EXPR };
export default Tutor;
