/**
 * Generate professional PDF templates using @react-pdf/renderer.
 *
 * Produces 6 templates: 2 CVs + 4 letters, styled with Google Fonts,
 * SVG icons, Flexbox layout, and brand colors.
 *
 * Usage:  node scripts/generate-templates.mjs
 */

import React from 'react';
import {
  renderToFile,
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Svg,
  Circle,
  Path,
  Link,
} from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';

const e = React.createElement;

const OUT_DIR = path.resolve('public/assets/templates');
fs.mkdirSync(OUT_DIR, { recursive: true });

const FONT_DIR = path.resolve('scripts/fonts');

// ── Register Fonts (local TTF files) ─────────────────────────

Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(FONT_DIR, 'Inter-400.ttf'), fontWeight: 400 },
    { src: path.join(FONT_DIR, 'Inter-600.ttf'), fontWeight: 600 },
    { src: path.join(FONT_DIR, 'Inter-700.ttf'), fontWeight: 700 },
  ],
});

Font.register({
  family: 'Playfair',
  fonts: [
    { src: path.join(FONT_DIR, 'Playfair-400.ttf'), fontWeight: 400 },
    { src: path.join(FONT_DIR, 'Playfair-700.ttf'), fontWeight: 700 },
  ],
});

// ── Color Palettes ───────────────────────────────────────────

const GOLD = '#b8956a';
const GOLD_LIGHT = '#f5efe8';
const TEAL = '#2d7370';
const TEAL_LIGHT = '#e5f0ef';
const PURPLE = '#614085';
const PURPLE_LIGHT = '#f0eaf5';
const WARM = '#a6592a';
const WARM_LIGHT = '#faf0e8';
const DARK = '#2c2c2c';
const MUTED = '#6b7280';
const LIGHT_BG = '#f8f9fc';
const WHITE = '#ffffff';
const LINE = '#d1d5db';

// ── SVG Icons (Lucide-style) ─────────────────────────────────

function PhoneIcon({ color = WHITE, size = 13 }) {
  return e(Svg, { width: size, height: size, viewBox: '0 0 24 24' },
    e(Path, {
      d: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
      fill: color,
    })
  );
}

function EmailIcon({ color = WHITE, size = 13 }) {
  return e(Svg, { width: size, height: size, viewBox: '0 0 24 24' },
    e(Path, {
      d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z',
      fill: 'none', stroke: color, strokeWidth: 2,
    }),
    e(Path, { d: 'M22 6l-10 7L2 6', fill: 'none', stroke: color, strokeWidth: 2 })
  );
}

function MapPinIcon({ color = WHITE, size = 13 }) {
  return e(Svg, { width: size, height: size, viewBox: '0 0 24 24' },
    e(Path, {
      d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z',
      fill: color,
    }),
    e(Circle, { cx: '12', cy: '10', r: '3', fill: color === WHITE ? DARK : WHITE })
  );
}

// ── Shared Components ────────────────────────────────────────

function ContactBar({ accent }) {
  const items = [
    { icon: e(PhoneIcon, { size: 11 }), label: 'Telefon', placeholder: 'Ditt telefonnummer' },
    { icon: e(EmailIcon, { size: 11 }), label: 'E-post', placeholder: 'Din e-postadress' },
    { icon: e(MapPinIcon, { size: 11 }), label: 'Adress / Ort', placeholder: 'Din ort' },
  ];
  return e(View, { style: { flexDirection: 'row', justifyContent: 'center', gap: 28, paddingVertical: 12, backgroundColor: LIGHT_BG, borderBottomWidth: 0.5, borderBottomColor: LINE } },
    ...items.map((it, i) =>
      e(View, { key: String(i), style: { alignItems: 'center', gap: 3, width: 140 } },
        e(View, { style: { width: 26, height: 26, borderRadius: 13, backgroundColor: accent, justifyContent: 'center', alignItems: 'center' } }, it.icon),
        e(Text, { style: { fontSize: 7, color: MUTED, fontFamily: 'Inter', fontWeight: 600, marginTop: 2 } }, it.label),
        e(Text, { style: { fontSize: 8, color: DARK, fontFamily: 'Inter' } }, it.placeholder),
      )
    )
  );
}

function SectionTitle({ children, accent = GOLD }) {
  return e(View, { style: { marginTop: 12, marginBottom: 5 } },
    e(Text, {
      style: {
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'Inter',
        color: DARK,
        textTransform: 'uppercase',
        letterSpacing: 1,
      },
    }, children),
    e(View, { style: { width: 36, height: 2, backgroundColor: accent, marginTop: 3 } })
  );
}

function Field({ text, height = 28 }) {
  return e(View, {
    style: {
      minHeight: height,
      backgroundColor: LIGHT_BG,
      borderWidth: 0.5,
      borderColor: LINE,
      borderRadius: 3,
      padding: 6,
      marginBottom: 4,
    },
  },
    e(Text, { style: { fontSize: 8, color: MUTED, fontFamily: 'Inter' } }, text)
  );
}

function Label({ children, bold: isBold = false, color = MUTED }) {
  return e(Text, {
    style: { fontSize: 8, color, fontFamily: 'Inter', fontWeight: isBold ? 600 : 400, marginBottom: 2 },
  }, children);
}

function Divider() {
  return e(View, { style: { height: 0.5, backgroundColor: LINE, marginVertical: 8 } });
}

function TwoCol({ left, right }) {
  return e(View, { style: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 } },
    e(View, { style: { width: '48%' } }, ...left),
    e(View, { style: { width: '48%' } }, ...right),
  );
}

function Footer({ text }) {
  return e(View, {
    style: {
      position: 'absolute',
      bottom: 18,
      left: 36,
      right: 36,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 0.5,
      borderTopColor: LINE,
      paddingTop: 5,
    },
  },
    e(Text, { style: { fontSize: 7, color: MUTED, fontFamily: 'Inter' } }, text),
    e(Link, { src: 'https://prakto.se', style: { fontSize: 7, color: GOLD, fontFamily: 'Inter', textDecoration: 'none' } }, 'prakto.se'),
  );
}

// ═════════════════════════════════════════════════════════════
// PDF #1 — KLASSISKT CV
// ═════════════════════════════════════════════════════════════

function KlassisktCV() {
  return e(Document, null,
    e(Page, { size: 'A4', style: { fontFamily: 'Inter' } },

      // Header
      e(View, { style: { backgroundColor: GOLD, paddingVertical: 26, alignItems: 'center' } },
        e(Text, { style: { fontSize: 26, fontWeight: 700, color: WHITE, fontFamily: 'Playfair', letterSpacing: 3 } }, 'DITT NAMN'),
        e(Text, { style: { fontSize: 9, color: GOLD_LIGHT, marginTop: 4 } }, 'Titel / Yrkesroll'),
      ),

      e(ContactBar, { accent: GOLD }),

      // Two-column body
      e(View, { style: { flexDirection: 'row', flex: 1, paddingTop: 8 } },

        // Left sidebar
        e(View, { style: { width: '33%', paddingLeft: 28, paddingRight: 14, borderRightWidth: 0.5, borderRightColor: LINE } },
          e(SectionTitle, { accent: GOLD }, 'Sprak'),
          e(Label, null, 'Lista dina sprak och nivaer'),
          e(Field, { text: 'Svenska \u2014 Modersmal\nEngelska \u2014 Flytande', height: 45 }),

          e(SectionTitle, { accent: GOLD }, 'Datorkunskap'),
          e(Label, null, 'Program och verktyg du kan'),
          e(Field, { text: 'Microsoft Office, Google Workspace...', height: 40 }),

          e(SectionTitle, { accent: GOLD }, '\u00d6vrigt'),
          e(Label, null, 'K\u00f6rkort, intressen etc.'),
          e(Field, { text: 'K\u00f6rkort B, Idrott, Musik...', height: 40 }),

          e(SectionTitle, { accent: GOLD }, 'Referenser'),
          e(Label, null, 'Namn, titel, telefon'),
          e(Field, { text: 'F\u00f6rnamn Efternamn\nBefattning, F\u00f6retag\n070-XXX XX XX', height: 50 }),
        ),

        // Right main column
        e(View, { style: { width: '67%', paddingLeft: 14, paddingRight: 28 } },
          e(SectionTitle, { accent: GOLD }, 'Profil'),
          e(Label, null, 'Kort om dig, din erfarenhet och vad du s\u00f6ker'),
          e(Field, { text: 'Skriv en kort sammanfattning om dig sj\u00e4lv...', height: 55 }),

          e(SectionTitle, { accent: GOLD }, 'Arbetserfarenhet'),
          e(Label, { bold: true, color: DARK }, 'Roll / Titel'),
          e(Label, null, 'Arbetsgivare, period, beskrivning'),
          e(Field, { text: 'Beskriv dina arbetsuppgifter...', height: 48 }),
          e(Label, null, 'Ytterligare erfarenhet'),
          e(Field, { text: 'Annan relevant erfarenhet...', height: 48 }),

          e(SectionTitle, { accent: GOLD }, 'Utbildning'),
          e(Label, null, 'Program, skola, period'),
          e(Field, { text: 'Gymnasieprogram \u2014 Skola\nStart \u2014 Slut', height: 40 }),
          e(Field, { text: 'Annan utbildning eller certifiering', height: 36 }),
        ),
      ),

      e(Footer, { text: 'Prakto  |  Klassiskt CV' }),
    )
  );
}

// ═════════════════════════════════════════════════════════════
// PDF #2 — KREATIVT CV
// ═════════════════════════════════════════════════════════════

function KreativtCV() {
  return e(Document, null,
    e(Page, { size: 'A4', style: { fontFamily: 'Inter' } },

      // Teal header
      e(View, { style: { backgroundColor: TEAL, paddingVertical: 24, alignItems: 'center' } },
        e(Text, { style: { fontSize: 24, fontWeight: 700, color: WHITE, fontFamily: 'Playfair', letterSpacing: 2 } }, 'DITT NAMN'),
        e(Text, { style: { fontSize: 9, color: TEAL_LIGHT, marginTop: 4 } }, 'Kreativ profil \u2014 Din tagline'),
      ),
      e(View, { style: { height: 3, backgroundColor: '#d96c5a' } }),

      e(ContactBar, { accent: TEAL }),

      // Two-column
      e(View, { style: { flexDirection: 'row', flex: 1, paddingTop: 6 } },

        // Colored sidebar
        e(View, { style: { width: '33%', backgroundColor: TEAL_LIGHT, paddingHorizontal: 16, paddingTop: 8 } },
          e(SectionTitle, { accent: TEAL }, 'Om mig'),
          e(Field, { text: 'Kort personlig beskrivning...', height: 55 }),

          e(SectionTitle, { accent: TEAL }, 'Kompetenser'),
          e(Field, { text: 'Design, Kommunikation, Teamwork...', height: 50 }),

          e(SectionTitle, { accent: TEAL }, 'Sprak'),
          e(Field, { text: 'Svenska, Engelska...', height: 36 }),

          e(SectionTitle, { accent: TEAL }, 'Intressen'),
          e(Field, { text: 'Kreativa hobbies, projekt...', height: 36 }),
        ),

        // Main content
        e(View, { style: { width: '67%', paddingHorizontal: 18, paddingTop: 4 } },
          e(SectionTitle, { accent: TEAL }, 'Erfarenhet'),
          e(Label, { bold: true, color: DARK }, 'Roll / Titel'),
          e(Label, null, 'Arbetsgivare \u2014 Period'),
          e(Field, { text: 'Beskriv ditt uppdrag och vad du bidrog med...', height: 50 }),
          e(Label, null, 'Ytterligare erfarenhet'),
          e(Field, { text: 'Praktik, volont\u00e4rarbete, projekt...', height: 46 }),

          e(SectionTitle, { accent: TEAL }, 'Utbildning'),
          e(Label, null, 'Program, skola, period'),
          e(Field, { text: 'Program \u2014 Skola\nStart \u2014 Slut', height: 40 }),

          e(SectionTitle, { accent: TEAL }, 'Projekt & Portfolio'),
          e(Field, { text: 'L\u00e4nk till portfolio, GitHub, Behance...', height: 32 }),

          e(SectionTitle, { accent: TEAL }, 'Referenser'),
          e(Field, { text: 'L\u00e4mnas p\u00e5 beg\u00e4ran', height: 22 }),
        ),
      ),

      e(Footer, { text: 'Prakto  |  Kreativt CV' }),
    )
  );
}

// ═════════════════════════════════════════════════════════════
// PDF #3 — FORMELLT PERSONLIGT BREV
// ═════════════════════════════════════════════════════════════

function FormelltBrev() {
  return e(Document, null,
    e(Page, { size: 'A4', style: { fontFamily: 'Inter', padding: 40, paddingTop: 0 } },

      e(View, { style: { backgroundColor: GOLD, marginHorizontal: -40, paddingVertical: 22, alignItems: 'center' } },
        e(Text, { style: { fontSize: 22, fontWeight: 700, color: WHITE, fontFamily: 'Playfair', letterSpacing: 1.5 } }, 'DITT NAMN'),
      ),
      e(View, { style: { marginHorizontal: -40 } }, e(ContactBar, { accent: GOLD })),

      e(View, { style: { marginTop: 16 } },
        e(TwoCol, {
          left: [e(Label, { bold: true, color: DARK, key: '1' }, 'Roll du s\u00f6ker'), e(Field, { text: 'Ange titel / roll', height: 20, key: '2' })],
          right: [e(Label, { bold: true, color: DARK, key: '1' }, 'F\u00f6retag'), e(Field, { text: 'F\u00f6retagsnamn', height: 20, key: '2' })],
        }),
        e(TwoCol, {
          left: [e(Label, { bold: true, color: DARK, key: '1' }, 'Program / Utbildning'), e(Field, { text: 'Ditt gymnasieprogram', height: 20, key: '2' })],
          right: [e(Label, { bold: true, color: DARK, key: '1' }, 'Datum'), e(Field, { text: 'Ort, datum', height: 20, key: '2' })],
        }),

        e(Divider),

        e(SectionTitle, { accent: GOLD }, 'Inledning'),
        e(Label, null, 'Skriv en formell h\u00e4lsning och presentera dig'),
        e(Field, { text: 'B\u00e4ste/B\u00e4sta [Namn],\n\nJag skriver till er ang\u00e5ende...', height: 65 }),

        e(SectionTitle, { accent: GOLD }, 'Varf\u00f6r detta f\u00f6retag'),
        e(Label, null, 'Vad attraherar dig med f\u00f6retaget'),
        e(Field, { text: 'Beskriv varf\u00f6r just detta f\u00f6retag intresserar dig...', height: 58 }),

        e(SectionTitle, { accent: GOLD }, 'Din kompetens'),
        e(Label, null, 'Vad du kan bidra med'),
        e(Field, { text: 'Beskriv relevanta kunskaper och erfarenheter...', height: 58 }),

        e(SectionTitle, { accent: GOLD }, 'Avslutning'),
        e(Field, { text: 'Jag ser fram emot att h\u00f6ra fr\u00e5n er.\n\nMed v\u00e4nliga h\u00e4lsningar,\n[Ditt namn]', height: 55 }),
      ),

      e(Footer, { text: 'Prakto  |  Formellt personligt brev' }),
    )
  );
}

// ═════════════════════════════════════════════════════════════
// PDF #4 — PERSONLIGT & ENGAGERAT BREV
// ═════════════════════════════════════════════════════════════

function PersonligtBrev() {
  return e(Document, null,
    e(Page, { size: 'A4', style: { fontFamily: 'Inter', padding: 40, paddingTop: 0 } },

      e(View, { style: { backgroundColor: PURPLE, marginHorizontal: -40, paddingVertical: 22, alignItems: 'center' } },
        e(Text, { style: { fontSize: 22, fontWeight: 700, color: WHITE, fontFamily: 'Playfair', letterSpacing: 1.5 } }, 'DITT NAMN'),
        e(Text, { style: { fontSize: 9, color: PURPLE_LIGHT, marginTop: 3 } }, 'Personligt & engagerat'),
      ),
      e(View, { style: { height: 3, backgroundColor: '#9e7cba', marginHorizontal: -40 } }),
      e(View, { style: { marginHorizontal: -40 } }, e(ContactBar, { accent: PURPLE })),

      e(View, { style: { marginTop: 14 } },
        e(TwoCol, {
          left: [e(Label, { bold: true, color: DARK, key: '1' }, 'Program / Utbildning'), e(Field, { text: 'Ditt gymnasieprogram', height: 20, key: '2' })],
          right: [e(Label, { bold: true, color: DARK, key: '1' }, 'F\u00f6retag du s\u00f6ker hos'), e(Field, { text: 'F\u00f6retagsnamn', height: 20, key: '2' })],
        }),

        e(Divider),

        e(SectionTitle, { accent: PURPLE }, 'Den personliga \u00f6ppningen'),
        e(Label, null, 'B\u00f6rja med en personlig anekdot eller erfarenhet'),
        e(Field, { text: 'Ber\u00e4tta en kort historia om varf\u00f6r du brinner f\u00f6r detta yrke...', height: 65 }),

        e(SectionTitle, { accent: PURPLE }, 'Varf\u00f6r just er'),
        e(Label, null, 'Visa att du gjort research om f\u00f6retaget'),
        e(Field, { text: 'Beskriv vad du vet om f\u00f6retaget och varf\u00f6r det lockar dig...', height: 55 }),

        e(SectionTitle, { accent: PURPLE }, 'Vad jag kan bidra med'),
        e(Label, null, 'Koppla dina styrkor till praktikplatsen'),
        e(Field, { text: 'Beskriv konkreta exempel p\u00e5 situationer d\u00e4r du visat dessa egenskaper...', height: 55 }),

        e(SectionTitle, { accent: PURPLE }, 'Engagerad avslutning'),
        e(Field, { text: 'Avsluta med energi och entusiasm.\n\nVarma h\u00e4lsningar,\n[Ditt namn]', height: 50 }),
      ),

      e(Footer, { text: 'Prakto  |  Personligt & engagerat brev' }),
    )
  );
}

// ═════════════════════════════════════════════════════════════
// PDF #5 — TACKBREV EFTER INTERVJU
// ═════════════════════════════════════════════════════════════

function TackbrevIntervju() {
  return e(Document, null,
    e(Page, { size: 'A4', style: { fontFamily: 'Inter', padding: 40, paddingTop: 0 } },

      e(View, { style: { backgroundColor: GOLD, marginHorizontal: -40, paddingVertical: 20, alignItems: 'center' } },
        e(Text, { style: { fontSize: 19, fontWeight: 700, color: WHITE, fontFamily: 'Playfair', letterSpacing: 1.5 } }, 'TACKBREV EFTER INTERVJU'),
      ),
      e(View, { style: { marginHorizontal: -40 } }, e(ContactBar, { accent: GOLD })),

      e(View, { style: { marginTop: 14 } },
        e(TwoCol, {
          left: [e(Label, { bold: true, color: DARK, key: '1' }, 'Ditt namn'), e(Field, { text: 'F\u00f6rnamn Efternamn', height: 20, key: '2' })],
          right: [e(Label, { bold: true, color: DARK, key: '1' }, 'F\u00f6retag / Kontaktperson'), e(Field, { text: 'Namn p\u00e5 den du tr\u00e4ffade', height: 20, key: '2' })],
        }),
        e(TwoCol, {
          left: [e(Label, { bold: true, color: DARK, key: '1' }, 'Roll du s\u00f6kte'), e(Field, { text: 'Praktikroll / Titel', height: 20, key: '2' })],
          right: [e(Label, { bold: true, color: DARK, key: '1' }, 'Datum f\u00f6r intervjun'), e(Field, { text: 'DD/MM/\u00c5\u00c5\u00c5\u00c5', height: 20, key: '2' })],
        }),

        e(Divider),

        e(SectionTitle, { accent: GOLD }, 'Tack och uppskattning'),
        e(Label, null, 'Tacka f\u00f6r intervjun och n\u00e4mn n\u00e5got specifikt'),
        e(Field, { text: 'Tack s\u00e5 mycket f\u00f6r att ni tog er tid att tr\u00e4ffa mig...\nJag uppskattade s\u00e4rskilt att f\u00e5 h\u00f6ra om...', height: 65 }),

        e(SectionTitle, { accent: GOLD }, 'Varf\u00f6r du passar'),
        e(Label, null, 'Referera till samtalet och f\u00f6rst\u00e4rk din kandidatur'),
        e(Field, { text: 'Under v\u00e5r intervju diskuterade vi... och jag vill f\u00f6rtydliga att jag...', height: 60 }),

        e(SectionTitle, { accent: GOLD }, 'N\u00e4sta steg'),
        e(Label, null, 'Avsluta positivt och fram\u00e5tblickande'),
        e(Field, { text: 'Jag ser mycket fram emot m\u00f6jligheten att...\n\nMed v\u00e4nliga h\u00e4lsningar,\n[Ditt namn]', height: 55 }),
      ),

      e(Footer, { text: 'Prakto  |  Tackbrev efter intervju' }),
    )
  );
}

// ═════════════════════════════════════════════════════════════
// PDF #6 — TACK TILL HANDLEDARE
// ═════════════════════════════════════════════════════════════

function TackHandledare() {
  return e(Document, null,
    e(Page, { size: 'A4', style: { fontFamily: 'Inter', padding: 40, paddingTop: 0 } },

      e(View, { style: { backgroundColor: WARM, marginHorizontal: -40, paddingVertical: 20, alignItems: 'center' } },
        e(Text, { style: { fontSize: 19, fontWeight: 700, color: WHITE, fontFamily: 'Playfair', letterSpacing: 1.5 } }, 'TACK TILL HANDLEDARE'),
        e(Text, { style: { fontSize: 9, color: WARM_LIGHT, marginTop: 3 } }, 'Visa din uppskattning efter praktiken'),
      ),
      e(View, { style: { marginHorizontal: -40 } }, e(ContactBar, { accent: WARM })),

      e(View, { style: { marginTop: 14 } },
        e(TwoCol, {
          left: [e(Label, { bold: true, color: DARK, key: '1' }, 'Ditt namn'), e(Field, { text: 'F\u00f6rnamn Efternamn', height: 20, key: '2' })],
          right: [e(Label, { bold: true, color: DARK, key: '1' }, 'Handledarens namn'), e(Field, { text: 'F\u00f6rnamn Efternamn', height: 20, key: '2' })],
        }),
        e(TwoCol, {
          left: [e(Label, { bold: true, color: DARK, key: '1' }, 'F\u00f6retag / Organisation'), e(Field, { text: 'F\u00f6retagsnamn', height: 20, key: '2' })],
          right: [e(Label, { bold: true, color: DARK, key: '1' }, 'Praktikperiod'), e(Field, { text: 'Start \u2014 Slut', height: 20, key: '2' })],
        }),

        e(Divider),

        e(SectionTitle, { accent: WARM }, 'Tacksamhet'),
        e(Label, null, 'B\u00f6rja med ett varmt tack'),
        e(Field, { text: 'Jag vill tacka dig s\u00e5 mycket f\u00f6r en fantastisk praktikperiod...\nDin v\u00e4gledning har betytt mycket...', height: 65 }),

        e(SectionTitle, { accent: WARM }, 'Vad jag l\u00e4rt mig'),
        e(Label, null, 'Beskriv konkreta saker du l\u00e4rt dig'),
        e(Field, { text: 'Under min tid hos er har jag f\u00e5tt l\u00e4ra mig...\nS\u00e4rskilt uppskattar jag att ha f\u00e5tt...', height: 60 }),

        e(SectionTitle, { accent: WARM }, 'Uppskattning & framtid'),
        e(Label, null, 'N\u00e4mn vad du uppskattat och h\u00e5ll kontakten'),
        e(Field, { text: 'Jag har verkligen uppskattat...\nJag hoppas vi kan h\u00e5lla kontakten via LinkedIn.\n\nStort tack igen!\n[Ditt namn]', height: 65 }),
      ),

      e(Footer, { text: 'Prakto  |  Tackbrev till handledare' }),
    )
  );
}

// ── Generate all PDFs ────────────────────────────────────────

async function main() {
  console.log('\nGenerating professional PDF templates...\n');

  const templates = [
    { name: 'klassiskt-cv.pdf', component: KlassisktCV },
    { name: 'kreativt-cv.pdf', component: KreativtCV },
    { name: 'formellt-personligt-brev.pdf', component: FormelltBrev },
    { name: 'personligt-engagerat-brev.pdf', component: PersonligtBrev },
    { name: 'tackbrev-efter-intervju.pdf', component: TackbrevIntervju },
    { name: 'tackbrev-till-handledare.pdf', component: TackHandledare },
  ];

  for (const t of templates) {
    const filePath = path.join(OUT_DIR, t.name);
    await renderToFile(e(t.component), filePath);
    console.log(`  ${t.name}`);
  }

  console.log(`\nDone! ${templates.length} PDFs in ${OUT_DIR}\n`);
}

main().catch(console.error);
