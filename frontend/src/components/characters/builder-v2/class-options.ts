import type { BuilderState, ClassOptions } from "./types";

export type ClassOptionField = {
  key: keyof ClassOptions;
  label: string;
  description: string;
  options?: string[];
  multi?: boolean;
  placeholder?: string;
};

export type ClassOptionConfig = {
  title: string;
  summary: string;
  fields: ClassOptionField[];
};

const ELEMENTS = ["Air", "Earth", "Fire", "Metal", "Water", "Wood"];

export const CLASS_OPTION_CONFIGS: Record<string, ClassOptionConfig> = {
  alchemist: {
    title: "Alchemist Research Field",
    summary: "Record your research field so formulas, class DCs, and future features stay clear.",
    fields: [
      {
        key: "subclass",
        label: "Research field",
        description: "Examples include Bomber, Chirurgeon, Mutagenist, and Toxicologist.",
        placeholder: "Bomber, Chirurgeon, Mutagenist...",
      },
    ],
  },
  animist: {
    title: "Animist Apparitions",
    summary: "Track your primary apparition choices and any campaign-specific animist notes.",
    fields: [
      {
        key: "subclass",
        label: "Apparition",
        description: "Choose the apparition or apparition style your table is using.",
        placeholder: "Custodian, Steward, Witness...",
      },
    ],
  },
  barbarian: {
    title: "Barbarian Instinct",
    summary: "Your instinct changes Rage damage, anathema, and later feats.",
    fields: [
      {
        key: "instinct",
        label: "Instinct",
        description: "Examples include Animal, Dragon, Fury, Giant, Spirit, and Superstition.",
        placeholder: "Dragon, Giant, Animal...",
      },
    ],
  },
  bard: {
    title: "Bard Muse",
    summary: "Your muse grants class features and shapes composition spell choices.",
    fields: [
      {
        key: "muse",
        label: "Muse",
        description: "Examples include Enigma, Maestro, Polymath, Warrior, and Zoophonia.",
        placeholder: "Maestro, Enigma, Warrior...",
      },
    ],
  },
  champion: {
    title: "Champion Cause",
    summary: "Your cause controls your reaction, sanctification themes, and code.",
    fields: [
      {
        key: "cause",
        label: "Cause",
        description: "Choose the cause or tenet package your campaign uses.",
        placeholder: "Paladin, Redeemer, Liberator...",
      },
    ],
  },
  cleric: {
    title: "Cleric Doctrine",
    summary: "Your doctrine affects proficiencies, font play, and battlefield role.",
    fields: [
      {
        key: "doctrine",
        label: "Doctrine",
        description: "Most clerics choose Cloistered Cleric or Warpriest.",
        options: ["Cloistered Cleric", "Warpriest"],
      },
    ],
  },
  druid: {
    title: "Druid Order",
    summary: "Your order grants an order spell and opens order-specific feats.",
    fields: [
      {
        key: "subclass",
        label: "Order",
        description: "Examples include Animal, Leaf, Storm, Untamed, Stone, Wave, and Flame.",
        placeholder: "Animal, Leaf, Storm...",
      },
    ],
  },
  exemplar: {
    title: "Exemplar Ikons",
    summary: "Track your key ikons so your sheet carries the class's core identity.",
    fields: [
      {
        key: "subclass",
        label: "Starting ikon set",
        description: "List the body, weapon, and worn ikons you selected.",
        placeholder: "Gleaming Blade, Victor's Wreath...",
      },
    ],
  },
  gunslinger: {
    title: "Gunslinger Way",
    summary: "Your way determines reload actions and combat rhythm.",
    fields: [
      {
        key: "subclass",
        label: "Way",
        description: "Examples include Drifter, Pistolero, Sniper, Spellshot, and Vanguard.",
        placeholder: "Pistolero, Sniper, Drifter...",
      },
    ],
  },
  inventor: {
    title: "Inventor Innovation",
    summary: "Your innovation drives Overdrive, modifications, and class feats.",
    fields: [
      {
        key: "subclass",
        label: "Innovation",
        description: "Choose Armor, Construct, Weapon, or a homebrew innovation.",
        options: ["Armor Innovation", "Construct Innovation", "Weapon Innovation"],
      },
    ],
  },
  investigator: {
    title: "Investigator Methodology",
    summary: "Your methodology grants extra skill, investigation, and action support.",
    fields: [
      {
        key: "methodology",
        label: "Methodology",
        description:
          "Examples include Alchemical Sciences, Empiricism, Forensic Medicine, and Interrogation.",
        placeholder: "Empiricism, Interrogation...",
      },
    ],
  },
  kineticist: {
    title: "Kinetic Gate",
    summary:
      "Kineticist magic is built from elements and impulses, not normal spell slots. Pick the gate, elements, and starting impulses here.",
    fields: [
      {
        key: "kineticGate",
        label: "Kinetic gate",
        description: "Single gate focuses one element; dual gate starts with two elements.",
        options: ["single", "dual"],
      },
      {
        key: "kineticElements",
        label: "Elements",
        description: "Choose one element for single gate, or two elements for dual gate.",
        options: ELEMENTS,
        multi: true,
      },
      {
        key: "kineticNotes",
        label: "Kinetic notes",
        description: "Record aura junctions, gate junctions, or table rulings.",
        placeholder: "Gate junction, aura notes, overflow reminders...",
      },
    ],
  },
  magus: {
    title: "Magus Hybrid Study",
    summary: "Your hybrid study shapes Spellstrike support and martial style.",
    fields: [
      {
        key: "hybridStudy",
        label: "Hybrid study",
        description:
          "Examples include Inexorable Iron, Laughing Shadow, Sparkling Targe, Starlit Span, and Twisting Tree.",
        placeholder: "Laughing Shadow, Starlit Span...",
      },
    ],
  },
  monk: {
    title: "Monk Foundation",
    summary: "Record your stance path or class focus so future feat picks are easier to audit.",
    fields: [
      {
        key: "subclass",
        label: "Primary path",
        description: "Optional: stance, ki spell focus, weapon monk, or campaign training style.",
        placeholder: "Crane Stance, Ki spells, Monastic weaponry...",
      },
    ],
  },
  oracle: {
    title: "Oracle Mystery",
    summary: "Your mystery determines curse, revelation spells, and class identity.",
    fields: [
      {
        key: "mystery",
        label: "Mystery",
        description:
          "Examples include Battle, Bones, Cosmos, Flames, Life, Lore, Tempest, and Time.",
        placeholder: "Life, Flames, Cosmos...",
      },
    ],
  },
  psychic: {
    title: "Psychic Conscious Minds",
    summary: "Psychics need conscious and subconscious choices to make cantrips and amps readable.",
    fields: [
      {
        key: "subclass",
        label: "Conscious mind",
        description: "Choose the conscious mind that grants your psi cantrips.",
        placeholder: "Distant Grasp, Oscillating Wave...",
      },
      {
        key: "patronSkill",
        label: "Subconscious mind",
        description: "Use this to record your subconscious mind and key ability style.",
        placeholder: "Emotional Acceptance, Precise Discipline...",
      },
    ],
  },
  ranger: {
    title: "Ranger Hunter's Edge",
    summary: "Hunter's edge changes Hunt Prey benefits and attack economy.",
    fields: [
      {
        key: "subclass",
        label: "Hunter's edge",
        description: "Most rangers choose Flurry, Outwit, or Precision.",
        options: ["Flurry", "Outwit", "Precision"],
      },
    ],
  },
  rogue: {
    title: "Rogue Racket",
    summary: "Your racket affects trained skills, debilitations, and class feat direction.",
    fields: [
      {
        key: "subclass",
        label: "Racket",
        description:
          "Examples include Thief, Ruffian, Scoundrel, Mastermind, and Eldritch Trickster.",
        placeholder: "Thief, Ruffian, Scoundrel...",
      },
    ],
  },
  sorcerer: {
    title: "Sorcerer Bloodline",
    summary: "Your bloodline determines tradition, bloodline spells, and granted magic.",
    fields: [
      {
        key: "bloodline",
        label: "Bloodline",
        description: "Examples include Draconic, Elemental, Imperial, Angelic, Demonic, and Fey.",
        placeholder: "Draconic, Elemental, Fey...",
      },
    ],
  },
  summoner: {
    title: "Summoner Eidolon",
    summary:
      "Summoners need an eidolon type and tradition so the sheet can track the shared build.",
    fields: [
      {
        key: "subclass",
        label: "Eidolon type",
        description: "Examples include Angel, Beast, Dragon, Fey, Plant, Psychopomp, and Undead.",
        placeholder: "Dragon Eidolon, Beast Eidolon...",
      },
    ],
  },
  swashbuckler: {
    title: "Swashbuckler Style",
    summary: "Your style determines how you gain panache.",
    fields: [
      {
        key: "subclass",
        label: "Style",
        description: "Examples include Battledancer, Braggart, Fencer, Gymnast, and Wit.",
        placeholder: "Battledancer, Fencer, Wit...",
      },
    ],
  },
  thaumaturge: {
    title: "Thaumaturge Implement",
    summary: "Your first implement defines your reaction and core thaumaturge loop.",
    fields: [
      {
        key: "subclass",
        label: "First implement",
        description:
          "Examples include Amulet, Bell, Chalice, Lantern, Mirror, Regalia, Tome, Wand, and Weapon.",
        placeholder: "Weapon, Tome, Regalia...",
      },
    ],
  },
  witch: {
    title: "Witch Patron",
    summary: "Witches need patron/theme and familiar notes to make spellcasting setup clear.",
    fields: [
      {
        key: "patron",
        label: "Patron/theme",
        description: "Record your patron, lesson theme, or table's remaster patron option.",
        placeholder: "Faith's Flamekeeper, Spinner of Threads...",
      },
    ],
  },
  wizard: {
    title: "Wizard Curriculum",
    summary: "Record your school/curriculum and thesis so your spellbook setup is traceable.",
    fields: [
      {
        key: "subclass",
        label: "School or curriculum",
        description: "Use your remaster curriculum or legacy arcane school.",
        placeholder: "School of Mentalism, Battle Magic...",
      },
      {
        key: "thesis",
        label: "Arcane thesis",
        description:
          "Examples include Improved Familiar Attunement, Spell Blending, and Staff Nexus.",
        placeholder: "Spell Blending, Staff Nexus...",
      },
    ],
  },
};

export function classKey(name: string): string {
  return name.trim().toLowerCase();
}

export function classOptionConfigFor(name: string): ClassOptionConfig | null {
  return CLASS_OPTION_CONFIGS[classKey(name)] ?? null;
}

export function classOptionSpecials(
  state: Pick<BuilderState, "className" | "classOptions">
): string[] {
  const options = state.classOptions;
  const lines: string[] = [];
  const config = classOptionConfigFor(state.className);
  const key = classKey(state.className);

  if (config) {
    for (const field of config.fields) {
      const value = options[field.key];
      if (Array.isArray(value) && value.length > 0) {
        lines.push(`${field.label}: ${value.join(", ")}`);
      } else if (typeof value === "string" && value.trim()) {
        lines.push(`${field.label}: ${value.trim()}`);
      }
    }
  }

  if (key === "kineticist") {
    lines.push("Kinetic Aura");
    lines.push("Elemental Blast");
    lines.push("Base Kinesis");
  }

  if (options.notes?.trim()) lines.push(`Class notes: ${options.notes.trim()}`);
  return lines;
}
