
const WEAPON_WARNING = 'Failure to comply with authorized weapon attachment standards will result in a verbal warning issued by the Company Commanding Officer or Faction Command.';

const IMG = {
  uniform: 'assets/placeholders/uniform.svg',
  worn: 'assets/placeholders/worn.svg',
  weapon: 'assets/placeholders/weapon.svg',
  equipment: 'assets/placeholders/equipment.svg',
  accessory: 'assets/placeholders/accessory.svg',
  general: 'assets/logo.png',
  src: 'assets/units/src-logo.png',
  lrr: 'assets/units/lrr-logo.png',
  kalasag: 'assets/units/kalasag-logo.png',
  haribon: 'assets/units/haribon-logo.png'
};

const RS_ARMORY = [
  {
    slug: 'general',
    name: 'General Armory',
    shortName: 'General',
    label: 'Faction-Wide Standard',
    description: 'Standard uniforms, baseline equipment, and common references for verified Red Squadron personnel.',
    cover: IMG.general,
    access: 'All verified Red Squadron personnel',
    uniforms: [
      uniform({
        name: 'Standard Philarpat Uniform',
        authorized: 'All verified Red Squadron personnel',
        headgear: 'AEGIS Ballistic High-Cut; Battery Power Supply; optional minimal Morale Patch; KM1-E Flashlight; COMMSET V; PROFILE NVG / 6B50 eyewear; AN/PVS-14 / C Night Vision. Helmet attachments must remain low-profile and functional. IR strobes and visible lights only when authorized. Ranger Green full-set.',
        facewear: 'Black Ski Mask. Mandatory for all active operations. No custom colors or altered versions permitted.',
        vest: 'MPC 2.0 Plate Carrier; Flex Mag Pouch rifle + pistol; Single M4 Mag Pouch; TMAR Pouch tall STANAG / 12-Gauge; NIR-Reflective Patch, country patch allowed; Raptor Push-to-Talk; U-94A/U; Pouch Zip-On Panel 2.0 Lightweight Backpack. Additional pouches allowed if suitable and visually consistent.',
        belt: 'CVS Low-Profile Belt / Task Force; M9 Holster / 6354DO standard requirement; Flex Mag pistol + single.',
        handwear: 'HOG (CTF) ALPHA, black or dark tone only.',
        wristwear: 'WILDTRAK 401',
        top: 'PHILARPAT BDU',
        bottom: 'PHILARPAT BDU',
        footwear: 'Black',
        note: 'Default faction standard uniform.'
      }),
      uniform({
        name: 'Black Standard Uniform',
        authorized: 'General Personnel / Operation Use',
        headgear: 'Gator Bump, NVG only when needed, Coyote Brown; Battery Power Supply; optional minimal Morale Patch; COMMSET V; PROFILE NVG / 6B50 eyewear; AN/PVS-14 / C Night Vision only when needed. Low-profile attachments only; IR strobes and visible lights only when authorized.',
        facewear: 'Black Ski Mask. Mandatory for all active operations. No custom colors or altered versions permitted.',
        vest: 'MPC 2.0 with Back Panel, Coyote Brown; Flex Mag Pouch rifle + pistol; Single M4 Mag Pouch; TMAR Pouch tall STANAG / 12-Gauge; NIR-Reflective Patch, country patch allowed; Raptor Push-to-Talk; U-94A/U; Pouch Zip-On Panel 2.0 Lightweight Backpack.',
        belt: 'Task Force Coyote Brown; Hardpoint with Lanyard, taped pull tab high; M9 Holster / 6354DO standard requirement; Flex Mag pistol + single.',
        handwear: 'HOG (CTF) ALPHA, VariCam Black.',
        wristwear: 'GA700UC, Tan',
        top: 'PACE RUGBY, VariCam Black',
        bottom: 'G2 AC Field Pants, Sand',
        footwear: 'Black',
        note: 'Used for selected operations or command-directed deployment.'
      }),
      uniform({
        name: 'Green Camo Standard',
        authorized: 'Authorized Red Squadron personnel',
        headgear: 'INTEL Rail 3.0 Ballistic, Ranger Green all; CommSet V Olive Drab Green; optional minimal Morale Patch; ACH/MICH Helmet Mount Assembly; AN/PVS-14; SI Ballistic J-Frame 3.0 Grey Lens; Battery Power Supply back. Low-profile attachments only; IR strobes and visible lights only when authorized.',
        facewear: 'Black Ski Mask.',
        vest: 'CVS Standard, Ranger Green all; Line.2 PALS mount + End-User device; MOLLE placard; 3x 5.56/7.62/MBITR Pouch; Front Right M18 pouch; Front Left M83 pouch; Left SOF Medical Pouch V.2; Back Right AN/PRC-148 pouch; Back Left Small Upright GP; SLA to LUCK MK3 POUCH; Pouch Zip-On Panel 2.0. Additional suitable pouches allowed.',
        belt: 'Task Force Multicam all; M9 Holster / 6354DO standard requirement; Flex Mag pistol + single.',
        handwear: 'HOG (CTF) ALPHA, Ranger Green or dark tone only.',
        wristwear: 'WILDTRAK 401',
        top: 'G3 Combat Shirt, Green',
        bottom: 'G3 Combat Pants',
        footwear: 'Black',
        note: 'Recommended for woodland or green environment deployments.'
      }),
      uniform({
        name: 'Tan Camo Standard',
        authorized: 'Authorized Red Squadron personnel',
        headgear: 'INTEL Rail 3.0 Ballistic, Coyote/Tan all; CommSet V Olive Drab Green; optional minimal Morale Patch; ACH/MICH Helmet Mount Assembly; AN/PVS-14; SI Ballistic J-Frame 3.0 Grey Lens; Battery Power Supply back. Low-profile attachments only; IR strobes and visible lights only when authorized.',
        facewear: 'Ski mask, high/low gaiter, or scarf in Tan/Coyote.',
        vest: 'CVS Standard Tan; Line.2 PALS mount + End-User device; MOLLE placard; 3x 5.56/7.62/MBITR Pouch; Front Right M18 pouch; Front Left M83 pouch; Left SOF Medical Pouch V.2; Back Right AN/PRC-148 pouch; Back Left Small Upright GP; SLA to LUCK MK3 POUCH; Pouch Zip-On Panel 2.0. Additional suitable pouches allowed.',
        belt: 'Task Force Multicam all; M9 Holster / 6354DO standard requirement; Flex Mag pistol + single.',
        handwear: 'HOG (CTF) ALPHA, Ranger Green or dark tone only.',
        wristwear: 'WILDTRAK 401',
        top: 'G3 Combat Shirt, Green',
        bottom: 'G3 Combat Pants',
        footwear: 'Black',
        note: 'Recommended for desert or tan environment deployments.'
      }),
      uniform({
        name: 'Off-Duty / Training Uniform',
        authorized: 'Training and non-combat formation use',
        headgear: 'Ball Cap, Ranger Green.',
        facewear: 'N/A',
        vest: 'N/A',
        belt: 'Task Force, Ranger Green; 6354DO standard requirement.',
        handwear: 'N/A',
        wristwear: 'WILDTRAK 401',
        top: 'PACE RUGBY, Gray',
        bottom: 'Specter AW Gen 2',
        footwear: 'Generic',
        note: 'Former Training Uniform. Used for training, administrative, and non-combat appearances.'
      })
    ],
    weapons: [
      weapon('M4A1', 'Primary Rifle', 'General Armory', 'Stock: CST; Grip: Ferwal Pistol Grip BGV-MK46; Magazine: USGI Magazine 30x with tape; Optic: HWS EXPS3; Iron sight optional; Barrel: Government 1.5 Carbine FSB; Handguard: M4 RAS; Bottom Rail: BGV-MK46; Left Rail: M600; Muzzle Device: FH556RC.', 'Standard general primary rifle. Updated weapon photo will be provided later.'),
      weapon('G17 Gen 3', 'Secondary Pistol', 'General Armory', 'Magazine: Wagram 9mm Gen 3 Magazine 17x; Optics: N/A; Barrel: OEM 49 Thread with suppressor if needed; Handguard: OEM accessory; Interface: RML-1 if needed.', 'Standard general sidearm. Updated weapon photo will be provided later.'),
      weapon('M9 Bayonet', 'Melee', 'General Armory', 'Standard melee bayonet configuration.', 'Updated weapon photo will be provided later.')
    ],
    utilities: utilities('general')
  },
  {
    slug: 'lrr',
    name: 'Light Reaction Regiment Armory',
    shortName: 'LRR',
    label: 'Branch Armory',
    description: 'Specialized rapid response and direct-action armory references for Light Reaction Regiment personnel.',
    cover: IMG.lrr,
    access: 'Light Reaction Regiment personnel',
    uniforms: [
      uniform({
        name: 'Standard Uniform',
        authorized: 'Light Reaction Regiment personnel',
        headgear: 'Gator Ballistic Helmet; Commset V Olive Drab Green; ACH/MICH Helmet Mount Assembly; AN/PVS-14; Battery Power Supply. Attachments must remain low-profile and functional. IR strobes and visible lights only when authorized. All Green.',
        eyewear: 'SI Ballistic J-Frame 3.0 Grey Lens.',
        facewear: 'High Gaiter, Black.',
        vest: 'CVS Standard Multicam all; Line.2 PALS mount + End-User device; MOLLE placard; 3x 5.56/7.62/MBITR Pouch; Front Right M18 pouch; Front Left M83 pouch; Right 100rd SAW Pouch; Left SOF Medical Pouch V.2; Back Right AN/PRC-148 pouch; Back Left Small Upright GP; SLA to LUCK MK3 POUCH. All Green.',
        belt: 'Task Force; Right 6353D0 Paddle and 2x FLEX Mag Pouch pistol/single; Back Dump Pouch, 9022B, ACE tourniquet + Strap Tourniquet Holder; Left 2x 40° canted TMAR pouch short/pistol.',
        handwear: 'HOG (CTF) ALPHA, Ranger Green / Dark Tone.',
        wristwear: 'GA700UC',
        top: 'All SPECTRE U except M04 and Camouflage Central Europe.',
        bottom: 'All SPECTRE U except M04 and Camouflage Central Europe.',
        footwear: 'Generic',
        note: 'Primary LRR branch uniform.'
      }),
      uniform({
        name: 'Tiger Stripes',
        authorized: 'Light Reaction Regiment personnel',
        headgear: 'Gator Ballistic Helmet Coyote Brown; Commset V Coyote Brown; ACH/MICH Helmet Mount Assembly; GPNVG-18; Battery Power Supply. Low-profile attachments only. All Coyote Brown.',
        eyewear: 'SI Ballistic J-Frame 3.0 Grey Lens.',
        facewear: 'High Gaiter, Coyote Brown.',
        vest: 'CVS Standard Coyote Brown; Line.2 PALS mount + End-User device; MOLLE placard; 3x 5.56/7.62/MBITR Pouch; Front Right M18 pouch; Front Left M83 pouch; Right 100rd SAW Pouch; Left SOF Medical Pouch V.2; Back Right AN/PRC-148 pouch; Back Left Small Upright GP; SLA to LUCK MK3 POUCH.',
        belt: 'Task Force all Coyote Brown; Right 6353D0 Paddle and 2x FLEX Mag Pouch pistol/single; Back Dump Pouch, 9022B, ACE tourniquet + Strap Tourniquet Holder; Left 2x 40° canted TMAR pouch short/pistol.',
        handwear: 'Slingshot Tactile, Coyote Brown.',
        wristwear: 'GA700UC',
        top: 'BDU - Vietnam Tiger Stripe.',
        bottom: 'BDU - Vietnam Tiger Stripe.',
        footwear: 'Generic',
        note: 'Tiger Stripe operational uniform.'
      }),
      uniform({
        name: 'Covert Uniform',
        authorized: 'Light Reaction Regiment personnel',
        headgear: 'Gator Ballistic Helmet; Commset V Olive Drab Green; ACH/MICH Helmet Mount Assembly; AN/PVS-14; Battery Power Supply. Low-profile attachments only.',
        vest: 'CVS Standard Multicam all; Line.2 PALS mount + End-User device; MOLLE placard; 3x 5.56/7.62/MBITR Pouch; Front Right M18 pouch; Front Left M83 pouch; Right 100rd SAW Pouch; Left SOF Medical Pouch V.2; Back Right AN/PRC-148 pouch; Back Left Small Upright GP; SLA to LUCK MK3 POUCH.',
        belt: 'Task Force; Right 6353D0 Paddle and 2x FLEX Mag Pouch pistol/single; Back Dump Pouch, 9022B, ACE tourniquet + Strap Tourniquet Holder; Left 2x 40° canted TMAR pouch short/pistol.',
        wristwear: 'GA700UC',
        top: 'Any civilian apparel appropriate to the environment.',
        bottom: 'Any civilian apparel appropriate to the environment.',
        footwear: 'Generic',
        note: 'Covert appearance must remain appropriate to the operating environment.'
      }),
      uniform({
        name: 'Short Sleeved Desert Camo',
        authorized: 'Light Reaction Regiment personnel',
        headgear: 'Gator Ballistic Helmet; Commset V Olive Drab Green; ACH/MICH Helmet Mount Assembly; AN/PVS-14; Battery Power Supply. Low-profile attachments only.',
        vest: 'CVS Standard Multicam all; Line.2 PALS mount + End-User device; MOLLE placard; 3x 5.56/7.62/MBITR Pouch; Front Right M18 pouch; Front Left M83 pouch; Right 100rd SAW Pouch; Left SOF Medical Pouch V.2; Back Right AN/PRC-148 pouch; Back Left Small Upright GP; SLA to LUCK MK3 POUCH.',
        belt: 'Task Force; Right 6353D0 Paddle and 2x FLEX Mag Pouch pistol/single; Back Dump Pouch, 9022B, ACE tourniquet + Strap Tourniquet Holder; Left 2x 40° canted TMAR pouch short/pistol.',
        wristwear: 'GA700UC',
        top: 'PACE RUGBY - Coyote.',
        bottom: 'SPECTRE U Bottoms.',
        footwear: 'Generic',
        note: 'Desert-oriented short-sleeved LRR uniform.'
      }),
      uniform({
        name: 'Off Duty Uniform',
        authorized: 'Light Reaction Regiment personnel',
        headgear: 'Ball Cap, Ranger Green.',
        belt: 'Task Force; Right 6354DO Holster Ranger Green. Back N/A. Left N/A.',
        wristwear: 'GA700UC',
        top: 'HOOO Brown Shirt.',
        bottom: 'SPECTER U Varicam Multicam.',
        footwear: 'Generic',
        note: 'Off duty / non-combat uniform.'
      })
    ],
    weapons: [
      weapon('MP5A4', 'Primary / SMG', 'Light Reaction Regiment', 'Stock: MP5A3 Fixed Collapsible; Magazine: MP5 9x19mm Parabellum 30rd Magazine; Optic: HWS XPS3; Barrel: Navy 8.9 with Tri-Lug OD Suppressor; Handguard: Lightweight Tri-Rail; Handguard Bottom Rail: Pistol Forward Grip + Modified; Left Rail: LLM K3; Right Rail optional.', 'Updated weapon photo will be provided later.'),
      weapon('M249', 'Primary / Support Weapon', 'Light Reaction Regiment', 'Stock: Hydraulic Collapsible Stock; Grip: ICS.02; Magazine: M249 Box Magazine 200rd; Optic: M150; Barrel: Standard 18; Handguard: SAW Heat Shield; Bottom: SAW Rail Adapter System Kit; Left Rail: CLAM-4 with Keybind for IR Light / Keybind for Laser; Right Rail optional; Bipod: Forward Foregrip BGV-MK46.', 'Updated weapon photo will be provided later.'),
      weapon('RF416 A5', 'Primary Rifle', 'Light Reaction Regiment', 'Stock: CST+SHELF; Grip: CIV; Magazine: ERMAG 30 AR/M4 Gen 3; Optic: T2 Footprint + Swift Micro / G33 + Optic Riser or HWS XPS3; Barrel: Government 11.5; Handguard: HKey 11; Top Rail: CLAM-4; Bottom Rail: BGV-C1; Left Rail optional; Right Rail M600; Muzzle: FH556RC + SOCOM556-RC2.', 'Updated weapon photo will be provided later.'),
      weapon('AUG A3', 'Primary Rifle', 'Light Reaction Regiment', 'Magazine: ERMAG 30 AR/M4 C3 Window; Optic: HWS XPS3 + G33 Magnifier / M150 ACOG; Barrel: Standard 18; Handguard: CQC; Left Rail: M300C; Right Rail: CLAM-4 with keybind for IR Light / Laser; Forward Foregrip: BGV-MK46; Muzzle: FLP3-556-M13X1 Detachable Muzzle Device + SOCOM556-MINI2.', 'Updated weapon photo will be provided later.'),
      weapon('USP45 Tactical', 'Secondary Pistol', 'Light Reaction Regiment', 'Magazine: USP .45 Auto 12x; Optic: N/A; Barrel: Standard with suppressor if needed; Handguard: OEM; Accessory Interface: Rail Mount + RML-1 if needed.', 'Updated weapon photo will be provided later.'),
      weapon('M4A1 Custom', 'Primary Rifle', 'Light Reaction Regiment', 'Stock: Carbine Buttstock Assembly Type II; Grip: A2; Magazine: ERMAG 30 AR/M4 Gen 3; Optic: T2 Footprint + Swift Micro / G33 + Optic Riser or HWS XPS3 / IMPACT 1-8x24mm F1; Iron sight optional; Barrel: Government 11.5 Carbine Slim LPGB; Handguard: 10.5 UMR MK16; Top Rail: LA-3D0C; Bottom Rail: Gunfighter Foregrip Mod 3 C-LOCK; Left Rail: M340C; Right Rail optional; Muzzle: FH556RC + SOCOM556-RC.', 'Updated weapon photo will be provided later.'),
      weapon('MX-R VIGOR 300', 'Primary Rifle', 'Light Reaction Regiment', 'Stock: Low Profile Folding Stock + SHELF; Grip: MX-RN XGEN1 OEM; Magazine: ERMAG 300 KO Marked; Optic: T2 Footprint + Swift Micro / G33 + Optic Riser or HWS XPS3 / IMPACT 1-8x24mm F1; Iron sight optional; Barrel: Standard 9; Handguard: SC 10; Top Rail: CLAM-4; Bottom Rail: Gunfighter Foregrip Mod 3 C-LOCK / BGV-C1; Left Rail: M340C; Right Rail optional; Muzzle: SILERA Flash Hider QD Detachable; Muzzle Device: SIERRA 762 8.3.', 'Updated weapon photo will be provided later.'),
      weapon('MX-R VIGOR 5.56', 'Primary Rifle', 'Light Reaction Regiment', 'Stock: Low Profile Folding Stock + SHELF; Grip: MX-RN XGEN1 OEM; Magazine: ERMAG 300 KO Marked; Optic: T2 Footprint + Swift Micro / G33 + Optic Riser or HWS XPS3 / IMPACT 1-8x24mm F1; Iron sight optional; Barrel: Standard 11.5; Handguard: SC 10; Top Rail: CLAM-4; Bottom Rail: Gunfighter Foregrip Mod 3 C-LOCK / BGV-C1; Left Rail: M340C; Right Rail optional; Muzzle: QLC3-Prong Flash Eliminator Detachable; Muzzle Device: 5.56 QLC/QB.', 'Updated weapon photo will be provided later.')
    ],
    utilities: utilities('lrr')
  },
  {
    slug: 'scout-ranger',
    name: 'Scout Ranger Company Armory',
    shortName: 'SRC',
    label: 'Branch Armory',
    description: 'Reconnaissance, field operations, and ranger-specific uniform and equipment standards.',
    cover: IMG.src,
    access: 'Scout Ranger Company personnel',
    uniforms: [
      uniform({
        name: 'Standard Uniform',
        authorized: 'Scout Ranger Company personnel',
        headgear: 'Intel Rail 3.0 Ballistic; Commset V; ACH/MICH Helmet Mount Assembly; AN/PVS-14; Battery Power Supply; Philippine Patch left loop face. IR strobes and visible lights only when authorized. All Green.',
        facewear: 'Black Ski Mask.',
        vest: 'CVS Standard; Philippine Patch on Loop Face; MOLLE placard; 3x 5.56/7.62/MBITR Pouch; Front Right M18 pouch; Front Left M83 pouch; Right 100rd SAW Pouch; Left SOF Medical Pouch V.2; Back Right AN/PRC-148 pouch; Back Left Small Upright GP; SLA to LUCK MK3 POUCH. All Green.',
        belt: 'Task Force; Right 6353D0 Paddle and 2x FLEX Mag Pouch pistol/single; Back Dump Pouch, 9022B, ACE tourniquet + Strap Tourniquet Holder; Left 2x 40° canted TMAR pouch short/pistol.',
        handwear: 'HOG (CTF) ALPHA',
        wristwear: 'WILDTRAK 401',
        top: 'PHILARPAT BDU',
        bottom: 'PHILARPAT BDU',
        footwear: 'Generic',
        note: 'SRC all-green standard uniform.'
      }),
      uniform({
        name: 'Tan Uniform',
        authorized: 'Scout Ranger Company personnel',
        headgear: 'Intel Rail 3.0 Ballistic; Commset V; L4 G24; AN/PVS-31; MS-0015 Marker; Battery Power Supply. All Tan color.',
        facewear: 'Ski mask, gaiter, and scarf.',
        vest: 'Longship v1 SAPI; Line.2 PALS Mount; MOLLE detachable flap; 3x 5.56/7.62/MBITR Pouch; Front Right and Front Left EMRAG/G36/AK5 pouches; Front Middle EMRAG/G36/AK5 pouch. All Tan.',
        backpack: 'Three-Day Patrol Backpack, Tan.',
        belt: 'Task Force; Right 635400 Paddle and 2x FLEX Mag Pouch pistol/single; Back Dump Pouch; Left 3x FLEX Mag Pouch pistol/single. All Tan.',
        handwear: 'Slingshot Tactile, Tan.',
        wristwear: 'Wildtrak 401',
        top: 'PACE Rugby, Coyote Brown.',
        bottom: 'G3 Combat Pants, AOR1 Camo.',
        footwear: 'Generic',
        note: 'SRC tan uniform for suitable deployment environments.'
      }),
      uniform({
        name: 'Off-Duty Uniform',
        authorized: 'Scout Ranger Company personnel',
        headgear: 'Beret, Tan color.',
        belt: 'Task Force; Right 6354DO Holster, Ranger Green. All Green.',
        wristwear: 'Wildtrak 401',
        top: 'H000 Black.',
        bottom: 'G3 Combat Pants, Varicam Tropic.',
        footwear: 'Generic',
        note: 'SRC off-duty / non-combat uniform.'
      })
    ],
    weapons: [
      weapon('L115A', 'Sniper Rifle', 'Scout Ranger Company', 'Stock: P3ICS 2.0; Grip: N/A; Magazine: CIP Length LPM5 .338 Lapua Magnum Magazine 5x; Optic: PM II LP/P 4/L; Barrel: Fluted 27; Bottom Rail: Universal Bipod; Muzzle Device: M18x1S MM .30/.338 Muzzle Brake.', 'Updated weapon photo will be provided later.'),
      weapon('M4A1', 'Primary Rifle', 'Scout Ranger Company', 'Stock: CST; Grip: Any grip; Magazine: USGI Magazine 30x with tape; Optic: M50 / HWS EXPS3 / HWS XPS3 / M68 CCO; Iron sight optional; Barrel: Government 1.5 Carbine FSB; Handguard: M4 RAS; Bottom Rail: BGV-MK46; Left Rail: M600; Right Rail optional; Muzzle Device: FH556RC.', 'Updated weapon photo will be provided later.'),
      weapon('MK18', 'Primary Rifle', 'Scout Ranger Company', 'Stock: Carbine Buttstock Assembly Type I-A; Grip: A2; Magazine: ERMAG 30 AR/M4 Gen 3; Optic: M150 / HWS EXPS3-0 / HWS XPS3 / M68 CCO; Iron sight optional; Barrel: Original MK18 RIS II FDO Rail CLAM-4; Bottom Rail: Gunfighter Foregrip Mod 3 C-LOCK; Left Rail optional; Right Rail M600; Muzzle Device: FH556RC + SOCOM556-RC2.', 'Updated weapon photo will be provided later.'),
      weapon('M249', 'Primary / Support Weapon', 'Scout Ranger Company', 'Stock: Hydraulic Collapsible Stock; Grip: ICS.02; Magazine: M249 Box Magazine 200rd; Optic: M150; Barrel: Standard 18; Handguard: SAW Heat Shield; Bottom: SAW Rail Adapter System Kit; Left Rail: CLAM-4 with Keybind for IR Light / Keybind for Laser; Right Rail optional; Bipod; Forward Foregrip BGV-MK46.', 'Updated weapon photo will be provided later.'),
      weapon('G17 Gen 3', 'Secondary Pistol', 'Scout Ranger Company', 'Magazine: Wagram 9mm Gen 3 Magazine 17x; Optics: N/A; Barrel: OEM 49 Thread with suppressor if needed; Handguard: OEM accessory; Interface: RML-1 if needed.', 'Updated weapon photo will be provided later.'),
      weapon('M9 Bayonet', 'Melee', 'Scout Ranger Company', 'Standard melee bayonet configuration.', 'Updated weapon photo will be provided later.')
    ],
    utilities: utilities('src')
  },
  {
    slug: 'kalasag',
    name: 'Kalasag Element Armory',
    shortName: 'Kalasag',
    label: 'Branch Armory',
    description: 'Armored, mechanized, and support element armory references for Kalasag personnel.',
    cover: IMG.kalasag,
    access: 'Kalasag Element personnel',
    uniforms: [
      uniform({
        name: 'Standard Uniform',
        authorized: 'Kalasag Element personnel',
        headgear: 'AEGIS MT Foliage Green; CommSet V Olive Drab Green; ACH-L4G24 Helmet Mount; AN/PVS-14 / AN/PVS-31. Low-profile attachments only; IR strobes and visible lights only when authorized.',
        facewear: 'High Gaiter, Ranger Green.',
        eyewear: 'Profile NVG, Ranger Green.',
        vest: 'CVS Standard; Line.2 PALS Mount Black + End User Device V20; 4F Raptor PTT + TacFix 401; MOLLE Ranger Green placard; 3x Flex Mag Pouch rifle/single depending SMG or Rifle; 1 Tourniquet front right; 5.56/7.62/MBITR water bottle pouch front left. Additional pouches/water bottles/general/equipment pouches allowed.',
        backpack: '1476A',
        belt: 'Task Force Ranger Green all; Right 6353D0 Paddle; 2x FLEX Mag Pouch pistol/single.',
        handwear: 'HOG (CTF) Alpha, Ranger Green.',
        wristwear: 'TacFix 401',
        top: 'BDU Battle Dress Uniform, Olive Green.',
        bottom: 'BDU Battle Dress Uniform, Olive Green.',
        footwear: 'Generic Black',
        note: 'Kalasag standard support/mechanized uniform.'
      }),
      uniform({
        name: 'Desert Uniform',
        authorized: 'Kalasag Element personnel',
        headgear: 'AEGIS MT Coyote 498; CommSet V Tan; PVS-31 using L4 G24 mount; Maritime Helmet Cover / Solid Stretched Tan. Low-profile attachments only.',
        facewear: 'High Gaiter.',
        vest: 'CVS Standard Coyote 489; 3x 5.56 mag pouch / 9mm SMG pouch depending SMG or Rifle; 1 Tourniquet; special accessory push-to-talk radio. Additional pouches/water bottles/general/equipment pouches allowed.',
        backpack: '1476A, Coyote 498',
        belt: 'Task Force Coyote 498 all; Right 6353D0 Paddle and 2x FLEX Mag Pouch pistol/single.',
        handwear: 'Slingshot Tactile, Tan.',
        wristwear: 'GA700UC, Tan',
        top: 'G3 Combat Shirt, Varicam Arid.',
        bottom: 'G3 Combat Pants, Varicam Arid.',
        footwear: 'Generic Tan',
        note: 'Desert environment Kalasag uniform.'
      }),
      uniform({
        name: 'Winter Uniform',
        authorized: 'Kalasag Element personnel',
        headgear: 'INTEL Rail 3.0 Ballistic Coyote 498; CommSet V Tan; PVS-31 using L4 G24 mount. Low-profile attachments only.',
        facewear: 'High Gaiter.',
        vest: 'CVS Standard Coyote 489; 3x 5.56 mag pouch / 9mm SMG pouch depending SMG or Rifle; 1 Tourniquet; Pouch Zip-On Panel 2.0; special accessory push-to-talk radio. Additional pouches/water bottles/general/equipment pouches allowed.',
        belt: 'Task Force Coyote 498 all; Right 6353D0 Paddle and 2x FLEX Mag Pouch pistol/single.',
        handwear: 'HOG (CTF) Alpha, Coyote / Dark Tone.',
        wristwear: 'WILDTRAK 401',
        top: 'Overwhites.',
        bottom: 'Overwhites; GDA BDU Olive Drab Green reference.',
        footwear: 'Generic',
        note: 'Winter environment Kalasag uniform.'
      }),
      uniform({
        name: 'New PH Standard Uniform',
        authorized: 'Kalasag Element personnel',
        headgear: 'AEGIS MT; CommSet V; ACH/L4G24 Helmet Mount; AN/PVS-31; AEGIS Multicam shell. Low-profile attachments only.',
        facewear: 'High Gaiter, Green.',
        vest: 'CVS Standard; 3x 5.56 mag pouch / 9mm SMG pouch depending SMG or Rifle; 1 Tourniquet; Pouch Zip-On Panel 2.0; special accessory push-to-talk radio. Additional pouches/water bottles/general/equipment pouches allowed. Color black fullset.',
        belt: 'Task Force Ranger Green all; Right 6353D0 Paddle and 2x FLEX Mag Pouch pistol/single. Color black fullset.',
        handwear: 'HOG (CTF) Alpha, Ranger Green / Dark Tone. Color black fullset.',
        wristwear: 'WILDTRAK 401, black fullset.',
        top: 'GDA BDU Olive Drab Green, black fullset.',
        bottom: 'GDA BDU Olive Drab Green.',
        footwear: 'Generic',
        note: 'New PH Standard Uniform for Kalasag Element.'
      }),
      uniform({
        name: 'Off Duty Uniform',
        authorized: 'Kalasag Element personnel',
        headgear: 'Ball Cap and Sun Hat, all Green.',
        belt: 'Task Force; Right 6354DO Holster Ranger Green. All Green.',
        wristwear: 'Wildtrak 401',
        top: 'PACE RUGBY, Ranger Green shirt.',
        bottom: 'Philarpat.',
        footwear: 'Generic',
        note: 'Kalasag off-duty / non-combat uniform.'
      })
    ],
    weapons: [
      weapon('AK5C', 'Primary Rifle', 'Kalasag Element', 'Primary Optic: M68 CCO; Handguard: M4; Magazine: USGI Magazine 30x Tape; Foregrip: BGV-MK46; Muzzle Device: FH556-216; Left-Barrel accessory: M600.', 'Updated weapon photo will be provided later.'),
      weapon('MK18', 'Primary Rifle', 'Kalasag Element', 'Primary Optic: Holographic Eotech sight; Foregrip: Forward Pistol Grip; Laser Module: AN/PEQ-15.', 'Updated weapon photo will be provided later.'),
      weapon('MK17 Mod 0', 'Primary Rifle', 'Kalasag Element', 'Top Rail: Primary Optic HWS XPS3 with folding rear sight 200-600m stowed; Sighting Device: Stock Rifle with upper hand accessory; Magazine: SCAR Magazine 20x Black; Bottom Rail: BGV-MK46 Side Rail Left M300C; Barrel: Standard 13 inch; Muzzle Device: FL3P-762-24LH no suppressor unless needed; Grip: OEM; Optional Attachment: Side rail right CLAM 4 Red Laser.', 'Updated weapon photo will be provided later.'),
      weapon('MP5', 'Primary / SMG', 'Kalasag Element', 'Stock/Frame: MP5 A3 Foldable Buttstock; Foregrip: Forward Pistol Grip Modified; Top Rail Mount: ECHO P-2 Low Mount; Left Rail Mount: M300C Flashlight; Right Rail Mount optional CLAM 4 Red VIS Laser.', 'Updated weapon photo will be provided later.')
    ],
    utilities: utilities('kalasag')
  },
  {
    slug: 'haribon',
    name: 'Haribon Aviation Unit Armory',
    shortName: 'Haribon',
    label: 'Branch Armory',
    description: 'Aviation unit armory references including flight and combat aviation support placeholders.',
    cover: IMG.haribon,
    access: 'Haribon Aviation Unit personnel',
    uniforms: [
      uniform({
        name: 'Standard Uniform',
        authorized: 'Haribon Aviation Unit personnel',
        headgear: 'HGU-56/P, Olive Drab.',
        accessories: 'NVG: AN/AVS-6(V)3.',
        vest: 'MPC 2.0, Ranger Green.',
        belt: 'Task Force, Ranger Green.',
        handwear: 'HOG (CTF) Alpha.',
        top: 'G3 Field Shirt, Ranger Green.',
        bottom: 'G3 Field Pant, Ranger Green.',
        footwear: 'Generic Black',
        note: 'Standard Haribon aviation uniform.'
      }),
      uniform({
        name: 'Formal Uniform',
        authorized: 'Haribon Aviation Unit personnel',
        headgear: 'Beret: Navy Blue for Officer, Teal for Member.',
        vest: 'N/A',
        belt: 'Task Force, Black.',
        top: 'ACU (2004) | UCP.',
        bottom: 'ACU (2004) | UCP.',
        footwear: 'Generic Black',
        note: 'Formal Haribon uniform.'
      })
    ],
    weapons: [
      weapon('MP5', 'Primary / SMG', 'Haribon Aviation Unit', 'Stock: 43 Collapsible Buttstock; Suppressor: Tri-Lug QD; Left-Barrel accessory: M600U; Right-Barrel accessory: CLAM-2.', 'Updated weapon photo will be provided later.'),
      weapon('UMP', 'Primary / SMG', 'Haribon Aviation Unit', 'Primary Optic: HWS EXPS3-0; Muzzle Device: UMP45 Suppressor; Foregrip: Gunfighter Foregrip Mod 3.', 'Updated weapon photo will be provided later.')
    ],
    utilities: utilities('haribon')
  },
  {
    slug: 'uav-operator',
    name: 'UAV Operator Certified Armory',
    shortName: 'UAV',
    label: 'Certification Armory',
    description: 'Certified UAV operator utilities and authorized drone support equipment.',
    cover: IMG.general,
    access: 'Certified UAV Operator role',
    uniforms: [
      uniform({
        name: 'UAV Operator Standard Uniform',
        authorized: 'Certified UAV Operator personnel',
        headgear: 'Follow assigned branch uniform unless mission command specifies otherwise.',
        vest: 'Follow assigned branch vest setup with room for UAV control/support utility placement.',
        belt: 'Follow assigned branch belt setup.',
        accessories: 'UAV controller, support battery pack, and communication tools placeholder.',
        top: 'Assigned branch uniform.',
        bottom: 'Assigned branch uniform.',
        footwear: 'Assigned branch standard.',
        note: 'Certification-based panel. Actual UAV equipment and drone models will be added later.'
      })
    ],
    weapons: [
      weapon('UAV Operator Authorized Sidearm', 'Certification Support Weapon', 'Certified UAV Operator', 'Standard authorized sidearm placeholder. Actual list pending.', 'Use only if authorized by operation command.'),
      weapon('UAV Operator Branch Primary', 'Branch Primary Weapon', 'Certified UAV Operator', 'Primary weapon follows the operator’s assigned branch authorization.', 'Branch restrictions still apply.')
    ],
    utilities: [
      utility('Matrix Drone', 'UAV / Recon Deployable', 'Certified UAV Operator', 'Primary UAV placeholder. Actual drone model details to be added later.'),
      utility('Binocular / Range Finder', 'Observation Utility', 'Certified UAV Operator', 'Used for visual confirmation and range support.'),
      utility('Compass', 'Navigation Utility', 'Certified UAV Operator', 'Standard navigation tool.'),
      utility('Road Flare 2x', 'Signal Utility', 'Certified UAV Operator', 'Signal and marking utility.'),
      utility('M80 Smoke White 2x', 'Deployable Utility', 'Certified UAV Operator', 'Smoke utility subject to command authorization.')
    ]
  },
  {
    slug: 'marksman',
    name: 'Marksman Certified Armory',
    shortName: 'Marksman',
    label: 'Certification Armory',
    description: 'Certified marksman references for authorized DMR/sniper systems and support utilities.',
    cover: IMG.general,
    access: 'Certified Marksman role',
    uniforms: [
      uniform({
        name: 'Marksman Standard Uniform',
        authorized: 'Certified Marksman personnel',
        headgear: 'Follow assigned branch uniform and environment requirement.',
        vest: 'Follow assigned branch vest setup with marksman ammunition and observation support placement.',
        belt: 'Follow assigned branch belt setup.',
        accessories: 'Range finder, binocular, compass, and marksman support utilities placeholder.',
        top: 'Assigned branch uniform.',
        bottom: 'Assigned branch uniform.',
        footwear: 'Assigned branch standard.',
        note: 'Certification-based panel. Exact marksman uniform modifications will be added later.'
      })
    ],
    weapons: [
      weapon('Authorized DMR / Sniper Rifle', 'DMR / Sniper System', 'Certified Marksman', 'Authorized rifle list pending. Add exact DMR or sniper rifle systems here.', 'Only certified personnel with role access may use certification-specific rifles.'),
      weapon('Branch Authorized Secondary', 'Secondary Weapon', 'Certified Marksman', 'Secondary weapon follows assigned branch authorization.', 'Branch restrictions still apply.')
    ],
    utilities: [
      utility('Binocular / Range Finder', 'Observation Utility', 'Certified Marksman', 'Required observation and range support utility.'),
      utility('Compass', 'Navigation Utility', 'Certified Marksman', 'Standard navigation tool.'),
      utility('Primary Magazine 8x', 'Ammunition Utility', 'Certified Marksman', 'Magazine count subject to assigned rifle system.'),
      utility('M80 Smoke White 2x', 'Deployable Utility', 'Certified Marksman', 'Smoke utility subject to command authorization.'),
      utility('Road Flare 2x', 'Signal Utility', 'Certified Marksman', 'Signal and marking utility.')
    ]
  },
  {
    slug: 'combat-medic',
    name: 'Combat Medic Certified Armory',
    shortName: 'Medic',
    label: 'Certification Armory',
    description: 'Certified combat medic loadout references, medical utilities, and support equipment.',
    cover: IMG.general,
    access: 'Certified Combat Medic role',
    uniforms: [
      uniform({
        name: 'Combat Medic Standard Uniform',
        authorized: 'Certified Combat Medic personnel',
        headgear: 'Follow assigned branch uniform unless medic identification standard is provided.',
        vest: 'Follow assigned branch vest setup with medical pouch and aid support placement.',
        belt: 'Follow assigned branch belt setup with medical support placement.',
        accessories: 'Medical pouch, bandages, dressings, vitamins, and casualty support utility placeholder.',
        top: 'Assigned branch uniform.',
        bottom: 'Assigned branch uniform.',
        footwear: 'Assigned branch standard.',
        note: 'Certification-based panel. Combat medic visual identifiers and exact medical kit will be added later.'
      })
    ],
    weapons: [
      weapon('Combat Medic Branch Primary', 'Branch Primary Weapon', 'Certified Combat Medic', 'Primary weapon follows assigned branch authorization.', 'Medic certification does not override branch restrictions.'),
      weapon('Combat Medic Authorized Sidearm', 'Secondary Weapon', 'Certified Combat Medic', 'Sidearm follows assigned branch authorization.', 'Branch restrictions still apply.')
    ],
    utilities: [
      utility('Bandage 7x', 'Medical Utility', 'Certified Combat Medic', 'Medical item count placeholder.'),
      utility('Dressing 8x', 'Medical Utility', 'Certified Combat Medic', 'Medical item count placeholder.'),
      utility('Vitamins 2x', 'Medical Utility', 'Certified Combat Medic', 'Medical item count placeholder.'),
      utility('Road Flare 2x', 'Signal Utility', 'Certified Combat Medic', 'Signal and marking utility.'),
      utility('Compass', 'Navigation Utility', 'Certified Combat Medic', 'Standard navigation tool.')
    ]
  },
  {
    slug: 'rto',
    name: 'RTO Certified Armory',
    shortName: 'RTO',
    label: 'Certification Armory',
    description: 'Certified Radio Telephone Operator communications loadout, radio equipment, and mission support utilities.',
    cover: IMG.general,
    access: 'Certified RTO / Radio Telephone Operator role',
    uniforms: [
      uniform({
        name: 'RTO Standard Uniform',
        authorized: 'Certified RTO / Radio Telephone Operator personnel',
        headgear: 'Follow assigned branch headgear unless command provides a dedicated RTO communication standard.',
        vest: 'Follow assigned branch vest setup with required radio, push-to-talk, and communication utility placement.',
        belt: 'Follow assigned branch belt setup.',
        accessories: 'Radio, push-to-talk device, communication headset, spare battery, and signal support utilities placeholder.',
        top: 'Assigned branch uniform.',
        bottom: 'Assigned branch uniform.',
        footwear: 'Assigned branch standard.',
        note: 'Certification-based panel. Exact radio models, channel plan, and communication equipment will be added later.'
      })
    ],
    weapons: [
      weapon('RTO Branch Primary', 'Branch Primary Weapon', 'Certified RTO', 'Primary weapon follows the RTO personnel’s assigned branch authorization.', 'RTO certification does not override branch weapon restrictions.'),
      weapon('RTO Authorized Sidearm', 'Secondary Weapon', 'Certified RTO', 'Sidearm follows assigned branch authorization.', 'Branch restrictions still apply.')
    ],
    utilities: [
      utility('Radio / Comms Unit', 'Communication Utility', 'Certified RTO', 'Primary communication utility placeholder. Exact model to be added later.'),
      utility('Push-to-Talk Device', 'Communication Utility', 'Certified RTO', 'PTT setup placeholder.'),
      utility('Compass', 'Navigation Utility', 'Certified RTO', 'Standard navigation tool.'),
      utility('Binocular / Range Finder', 'Observation Utility', 'Certified RTO', 'Observation and reporting support utility.'),
      utility('M80 Smoke White 2x', 'Signal / Deployable Utility', 'Certified RTO', 'Smoke utility subject to command authorization.'),
      utility('Road Flare 2x', 'Signal Utility', 'Certified RTO', 'Signal and marking utility.')
    ]
  }
];

function uniform(data) {
  return {
    uniformImage: IMG.uniform,
    wornImage: IMG.worn,
    eyewear: 'N/A',
    facewear: 'N/A',
    vest: 'N/A',
    backpack: 'N/A',
    belt: 'N/A',
    handwear: 'N/A',
    wristwear: 'N/A',
    top: 'N/A',
    bottom: 'N/A',
    footwear: 'N/A',
    accessories: 'N/A',
    note: 'N/A',
    ...data
  };
}

function weapon(name, type, unitName, details, notes) {
  return {
    name,
    image: IMG.weapon,
    type,
    authorized: unitName,
    details,
    notes,
    loadout: WEAPON_WARNING
  };
}




function utility(name, type, authorized, notes) {
  return {
    name,
    image: IMG.accessory,
    type,
    authorized,
    notes
  };
}

function utilities(section) {
  const map = {
    general: [
      ['Binocular', 'Observation Utility', 'All verified personnel', 'Standard observation utility.'],
      ['Compass', 'Navigation Utility', 'All verified personnel', 'Standard navigation tool.'],
      ['Primary Magazine 8x', 'Ammunition Utility', 'All verified personnel', 'Standard primary magazine count.'],
      ['Secondary Magazine 4x', 'Ammunition Utility', 'All verified personnel', 'Standard secondary magazine count.'],
      ['Bandage 7x', 'Medical Utility', 'All verified personnel', 'Standard medical item count.'],
      ['Dressing 8x', 'Medical Utility', 'All verified personnel', 'Standard medical item count.'],
      ['Vitamins 2x', 'Medical Utility', 'All verified personnel', 'Standard medical item count.'],
      ['M80 Smoke White 2x', 'Deployable Utility', 'All verified personnel', 'Smoke utility subject to command authorization.'],
      ['Road Flare 2x', 'Signal Utility', 'All verified personnel', 'Signal and marking utility.'],
      ['M67 Frag 2x', 'Deployable Utility', 'All verified personnel', 'Use only when authorized by command.']
    ],
    src: [
      ['Binocular / Range Finder', 'Observation Utility', 'Scout Ranger Company personnel', 'Observation and range support utility.'],
      ['Compass', 'Navigation Utility', 'Scout Ranger Company personnel', 'Standard navigation tool.'],
      ['Primary Magazine 8x', 'Ammunition Utility', 'Scout Ranger Company personnel', 'Standard primary magazine count.'],
      ['Secondary Magazine 4x', 'Ammunition Utility', 'Scout Ranger Company personnel', 'Standard secondary magazine count.'],
      ['Bandage 7x', 'Medical Utility', 'Scout Ranger Company personnel', 'Standard medical item count.'],
      ['Dressing 8x', 'Medical Utility', 'Scout Ranger Company personnel', 'Standard medical item count.'],
      ['Vitamins 2x', 'Medical Utility', 'Scout Ranger Company personnel', 'Standard medical item count.'],
      ['M80 Smoke White 2x', 'Deployable Utility', 'Scout Ranger Company personnel', 'Smoke utility subject to command authorization.'],
      ['Road Flare 2x', 'Signal Utility', 'Scout Ranger Company personnel', 'Signal and marking utility.'],
      ['M67 Frag 2x', 'Deployable Utility', 'Scout Ranger Company personnel', 'Use only when authorized by command.'],
      ['M320A1 40mm', 'Launcher / Deployable Utility', 'Scout Ranger Company personnel', 'Use only when authorized by command.']
    ],
    lrr: [
      ['Binocular / Range Finder', 'Observation Utility', 'Light Reaction Regiment personnel', 'Observation and range support utility.'],
      ['Compass', 'Navigation Utility', 'Light Reaction Regiment personnel', 'Standard navigation tool.'],
      ['Primary Magazine 8x', 'Ammunition Utility', 'Light Reaction Regiment personnel', 'Standard primary magazine count.'],
      ['Secondary Magazine 4x', 'Ammunition Utility', 'Light Reaction Regiment personnel', 'Standard secondary magazine count.'],
      ['Bandage 7x', 'Medical Utility', 'Light Reaction Regiment personnel', 'Standard medical item count.'],
      ['Dressing 8x', 'Medical Utility', 'Light Reaction Regiment personnel', 'Standard medical item count.'],
      ['Vitamins 2x', 'Medical Utility', 'Light Reaction Regiment personnel', 'Standard medical item count.'],
      ['M80 Smoke White 2x', 'Deployable Utility', 'Light Reaction Regiment personnel', 'Smoke utility subject to command authorization.'],
      ['Road Flare 2x', 'Signal Utility', 'Light Reaction Regiment personnel', 'Signal and marking utility.'],
      ['M67 Frag 2x', 'Deployable Utility', 'Light Reaction Regiment personnel', 'Use only when authorized by command.'],
      ['M320A1 40mm', 'Launcher / Deployable Utility', 'Light Reaction Regiment personnel', 'Use only when authorized by command.'],
      ['Matrix Drone', 'UAV / Recon Deployable', 'Light Reaction Regiment personnel', 'Drone utility subject to UAV authorization and command approval.']
    ],
    kalasag: [
      ['Binocular / Range Finder', 'Observation Utility', 'Kalasag Element personnel', 'Observation and range support utility.'],
      ['Compass', 'Navigation Utility', 'Kalasag Element personnel', 'Standard navigation tool.'],
      ['Primary Magazine 8x', 'Ammunition Utility', 'Kalasag Element personnel', 'Standard primary magazine count.'],
      ['Secondary Magazine 4x', 'Ammunition Utility', 'Kalasag Element personnel', 'Standard secondary magazine count.'],
      ['Bandage 7x', 'Medical Utility', 'Kalasag Element personnel', 'Standard medical item count.'],
      ['Dressing 8x', 'Medical Utility', 'Kalasag Element personnel', 'Standard medical item count.'],
      ['Vitamins 2x', 'Medical Utility', 'Kalasag Element personnel', 'Standard medical item count.'],
      ['M80 Smoke White 2x', 'Deployable Utility', 'Kalasag Element personnel', 'Smoke utility subject to command authorization.'],
      ['Road Flare 2x', 'Signal Utility', 'Kalasag Element personnel', 'Signal and marking utility.'],
      ['M67 Frag 2x', 'Deployable Utility', 'Kalasag Element personnel', 'Use only when authorized by command.']
    ],
    haribon: [
      ['Binocular / Range Finder', 'Observation Utility', 'Haribon Aviation Unit personnel', 'Observation and range support utility.'],
      ['Compass', 'Navigation Utility', 'Haribon Aviation Unit personnel', 'Standard navigation tool.'],
      ['Primary Magazine 6x', 'Ammunition Utility', 'Haribon Aviation Unit personnel', 'Standard primary magazine count.'],
      ['Secondary Magazine 3x', 'Ammunition Utility', 'Haribon Aviation Unit personnel', 'Standard secondary magazine count.'],
      ['Bandage 7x', 'Medical Utility', 'Haribon Aviation Unit personnel', 'Standard medical item count.'],
      ['Dressing 8x', 'Medical Utility', 'Haribon Aviation Unit personnel', 'Standard medical item count.'],
      ['Vitamins 2x', 'Medical Utility', 'Haribon Aviation Unit personnel', 'Standard medical item count.'],
      ['Road Flare 2x', 'Signal Utility', 'Haribon Aviation Unit personnel', 'Signal and marking utility.']
    ]
  };
  return (map[section] || []).map(item => utility(...item));
}



// V25 Company Photo Mapping
// Uploaded company photos are stored in assets/companies/.
// Some missing branch-specific photos temporarily reuse similar company images until updated photos are provided.
const RS_IMAGE_OVERRIDES = {
  general: {
    uniforms: {
      'Standard Philarpat Uniform': ['assets/companies/general/uniforms/standard-philarpat-front.png', 'assets/companies/general/uniforms/standard-philarpat-back.png'],
      'Black Standard Uniform': ['assets/companies/general/uniforms/black-standard-front.png', 'assets/companies/general/uniforms/black-standard-back.png'],
      'Green Camo Standard': ['assets/companies/general/uniforms/green-camo-front.png', 'assets/companies/general/uniforms/green-camo-back.png'],
      'Tan Camo Standard': ['assets/companies/general/uniforms/tan-camo-front.png', 'assets/companies/general/uniforms/tan-camo-back.png'],
      'Off-Duty / Training Uniform': ['assets/companies/general/uniforms/off-duty-training-front.png', 'assets/companies/general/uniforms/off-duty-training-back.png']
    },
    weapons: {
      'M4A1': 'assets/companies/general/weapons/m4a1.png',
      'G17 Gen 3': 'assets/companies/general/weapons/g17-gen-3.png',
      'M9 Bayonet': 'assets/companies/general/weapons/m9-bayonet.png'
    }
  },
  lrr: {
    uniforms: {
      'Standard Uniform': ['assets/companies/lrr/uniforms/standard-front.png', 'assets/companies/lrr/uniforms/standard-back.png'],
      'Tiger Stripes': ['assets/companies/lrr/uniforms/tiger-stripes-front.png', 'assets/companies/lrr/uniforms/tiger-stripes-back.png'],
      'Covert Uniform': ['assets/companies/general/uniforms/black-standard-front.png', 'assets/companies/general/uniforms/black-standard-back.png'],
      'Short Sleeved Desert Camo': ['assets/companies/general/uniforms/tan-camo-front.png', 'assets/companies/general/uniforms/tan-camo-back.png'],
      'Off Duty Uniform': ['assets/companies/general/uniforms/off-duty-training-front.png', 'assets/companies/general/uniforms/off-duty-training-back.png']
    },
    weapons: {
      'MP5A4': 'assets/companies/lrr/weapons/mp5a4.png',
      'M249': 'assets/companies/lrr/weapons/m249.png',
      'RF416 A5': 'assets/companies/lrr/weapons/rf416-a5.png',
      'AUG A3': 'assets/companies/lrr/weapons/aug-a3.png',
      'USP45 Tactical': 'assets/companies/lrr/weapons/usp45-tactical.png',
      'M4A1 Custom': 'assets/companies/lrr/weapons/m4a1-custom.png',
      'MX-R VIGOR 300': 'assets/companies/lrr/weapons/mx-r-vigor-300.png',
      'MX-R VIGOR 5.56': 'assets/companies/lrr/weapons/mx-r-vigor-556.png'
    }
  },
  'scout-ranger': {
    uniforms: {
      'Standard Uniform': ['assets/companies/src/uniforms/standard-front.png', 'assets/companies/src/uniforms/standard-front.png'],
      'Tan Uniform': ['assets/companies/src/uniforms/tan-front.png', 'assets/companies/src/uniforms/tan-front.png'],
      'Off-Duty Uniform': ['assets/companies/src/uniforms/off-duty-front.png', 'assets/companies/src/uniforms/off-duty-front.png']
    },
    weapons: {
      'L115A': 'assets/companies/src/weapons/l115a.png',
      'M4A1': 'assets/companies/src/weapons/m4a1.png',
      'MK18': 'assets/companies/src/weapons/mk18.png',
      'M249': 'assets/companies/src/weapons/m249.png',
      'G17 Gen 3': 'assets/companies/src/weapons/g17-gen-3.png',
      'M9 Bayonet': 'assets/companies/src/weapons/m9-bayonet.png'
    }
  },
  kalasag: {
    uniforms: {
      'Standard Uniform': ['assets/companies/general/uniforms/green-camo-front.png', 'assets/companies/general/uniforms/green-camo-back.png'],
      'Desert Uniform': ['assets/companies/general/uniforms/tan-camo-front.png', 'assets/companies/general/uniforms/tan-camo-back.png'],
      'Winter Uniform': ['assets/companies/general/uniforms/black-standard-front.png', 'assets/companies/general/uniforms/black-standard-back.png'],
      'New PH Standard Uniform': ['assets/companies/general/uniforms/standard-philarpat-front.png', 'assets/companies/general/uniforms/standard-philarpat-back.png'],
      'Off Duty Uniform': ['assets/companies/general/uniforms/off-duty-training-front.png', 'assets/companies/general/uniforms/off-duty-training-back.png']
    },
    weapons: {
      'MK18': 'assets/companies/src/weapons/mk18.png',
      'MP5': 'assets/companies/lrr/weapons/mp5a4.png'
    }
  },
  haribon: {
    uniforms: {
      'Standard Uniform': ['assets/companies/general/uniforms/green-camo-front.png', 'assets/companies/general/uniforms/green-camo-back.png'],
      'Formal Uniform': ['assets/companies/general/uniforms/black-standard-front.png', 'assets/companies/general/uniforms/black-standard-back.png']
    },
    weapons: {
      'MP5': 'assets/companies/lrr/weapons/mp5a4.png'
    }
  }
};

function applyCompanyPhotoOverrides() {
  RS_ARMORY.forEach(unit => {
    const override = RS_IMAGE_OVERRIDES[unit.slug];
    if (!override) return;

    if (override.uniforms && Array.isArray(unit.uniforms)) {
      unit.uniforms.forEach(item => {
        const imageSet = override.uniforms[item.name];
        if (imageSet) {
          item.uniformImage = imageSet[0];
          item.wornImage = imageSet[1] || imageSet[0];
          if (imageSet[0] === imageSet[1]) {
            item.temporaryImageNote = 'Temporary same-view image. Back view will be updated once provided.';
          }
        }
      });
    }

    if (override.weapons && Array.isArray(unit.weapons)) {
      unit.weapons.forEach(item => {
        const image = override.weapons[item.name];
        if (image) item.image = image;
      });
    }
  });
}

applyCompanyPhotoOverrides();

// V26: remove incorrect temporary uniform photos until correct branch photos are provided.
function clearPendingUniformPhoto(unitSlug, uniformName, noteText = 'Correct branch uniform photo pending update.') {
  const unit = RS_ARMORY.find(item => item.slug === unitSlug);
  if (!unit || !Array.isArray(unit.uniforms)) return;
  const target = unit.uniforms.find(item => item.name === uniformName);
  if (!target) return;
  target.uniformImage = IMG.uniform;
  target.wornImage = IMG.worn;
  target.temporaryImageNote = noteText;
}

clearPendingUniformPhoto('lrr', 'Covert Uniform');
clearPendingUniformPhoto('lrr', 'Short Sleeved Desert Camo');
clearPendingUniformPhoto('kalasag', 'Standard Uniform');
clearPendingUniformPhoto('kalasag', 'Desert Uniform');
clearPendingUniformPhoto('kalasag', 'Winter Uniform');
clearPendingUniformPhoto('kalasag', 'New PH Standard Uniform');
clearPendingUniformPhoto('kalasag', 'Off Duty Uniform');
clearPendingUniformPhoto('haribon', 'Standard Uniform');
clearPendingUniformPhoto('haribon', 'Formal Uniform');

