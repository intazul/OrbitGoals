/**
 * Gamer Tag / Username Generator
 * Generates totally random, unique game player names with numbers and NO SPACES.
 * E.g. ShadowNinja942, CyberPhantom718, ApexStriker404, ViperBlade88, FrostByte1337
 */

const GAMER_PREFIXES = [
  'Shadow',
  'Cyber',
  'Ghost',
  'Viper',
  'Apex',
  'Thunder',
  'Neon',
  'Frost',
  'Iron',
  'Quantum',
  'Storm',
  'Nova',
  'Blaze',
  'Echo',
  'Titan',
  'Rogue',
  'Vortex',
  'Hyper',
  'Pixel',
  'Aero',
  'Solar',
  'Lunar',
  'Mystic',
  'Chaos',
  'Delta',
  'Omega',
  'Phantom',
  'Laser',
  'Astral',
  'Nexus',
  'Specter',
  'Sniper',
  'Turbo',
  'Venom',
  'Pulse',
  'Drift',
  'Savage',
  'Reaper',
  'Matrix',
  'Velocity',
  'Cosmic',
  'Zero',
  'Vector',
  'Cipher',
  'Raptor',
  'Zenith',
  'Krypton',
  'Spectra',
  'Inferno',
  'Glitch',
];

const GAMER_SUFFIXES = [
  'Ninja',
  'Knight',
  'Striker',
  'Hunter',
  'Blade',
  'Wolf',
  'Falcon',
  'Slayer',
  'Rider',
  'Byte',
  'Vanguard',
  'Breaker',
  'Claw',
  'Hawk',
  'Samurai',
  'Assassin',
  'Warrior',
  'Phantom',
  'Ghost',
  'Beast',
  'Cyborg',
  'Spark',
  'Shadow',
  'Dragon',
  'Titan',
  'Raven',
  'Phoenix',
  'Ace',
  'Commander',
  'Sniper',
  'Rebel',
  'Pilot',
  'Viper',
  'Ranger',
  'Crusher',
  'Warden',
  'Legend',
  'Stalker',
  'Gunner',
  'Specter',
];

const SPECIAL_DIGITS = [
  '007',
  '101',
  '204',
  '305',
  '360',
  '404',
  '512',
  '707',
  '718',
  '777',
  '808',
  '88',
  '909',
  '942',
  '99',
  '999',
  '1337',
  '2026',
  '42',
  '64',
  '841',
  '623',
  '419',
  '882',
  '339',
];

/**
 * Generate a random gamer username with numbers and no spaces.
 */
export function generateRandomGamerTag(): string {
  const prefix = GAMER_PREFIXES[Math.floor(Math.random() * GAMER_PREFIXES.length)];
  let suffix = GAMER_SUFFIXES[Math.floor(Math.random() * GAMER_SUFFIXES.length)];

  // Avoid repeating identical word
  while (suffix === prefix) {
    suffix = GAMER_SUFFIXES[Math.floor(Math.random() * GAMER_SUFFIXES.length)];
  }

  // 50% chance of curated gaming numbers, 50% chance of random 2-3 digit number
  const useCurated = Math.random() > 0.4;
  const num = useCurated
    ? SPECIAL_DIGITS[Math.floor(Math.random() * SPECIAL_DIGITS.length)]
    : String(Math.floor(Math.random() * 900) + 100);

  // Return strictly without spaces
  return `${prefix}${suffix}${num}`.replace(/\s+/g, '');
}

/**
 * Clean and format any string into a valid gamer username (no spaces, numbers guaranteed).
 */
export function cleanGamerTag(raw: string): string {
  const stripped = raw.replace(/\s+/g, '');
  if (!stripped) return generateRandomGamerTag();
  // If user entered name without numbers, append a random number
  if (!/\d/.test(stripped)) {
    const num = Math.floor(Math.random() * 900) + 100;
    return `${stripped}${num}`;
  }
  return stripped;
}
