import { ELEMENT_MODIFIERS } from '../src/data/combat/formulas.js';
import { JOB_CLASSES, SKILLS, SKILL_BY_ID } from '../src/data/catalog/index.js';

const errors: string[] = [];
const seen = new Set<string>();
const knownElements = new Set(Object.keys(ELEMENT_MODIFIERS));

for (const skill of SKILLS) {
  if (seen.has(skill.id)) {
    errors.push(`[skills] duplicate skill id "${skill.id}"`);
  }
  seen.add(skill.id);

  if (skill.mpCost < 0) {
    errors.push(`[skills] ${skill.id}: negative mpCost`);
  }
  if (skill.cooldown < 0) {
    errors.push(`[skills] ${skill.id}: negative cooldown`);
  }
  if (skill.element && !knownElements.has(skill.element)) {
    errors.push(`[skills] ${skill.id}: unknown element "${skill.element}"`);
  }

  const { effect } = skill;
  if (effect.kind === 'damage' && !(effect.powerMultiplier && effect.powerMultiplier > 0)) {
    errors.push(`[skills] ${skill.id}: damage effect requires a positive powerMultiplier`);
  }
  if (
    (effect.kind === 'buff' || effect.kind === 'debuff' || effect.kind === 'mark') &&
    !(effect.duration && effect.duration > 0)
  ) {
    errors.push(`[skills] ${skill.id}: ${effect.kind} effect requires a positive duration`);
  }
  if (effect.kind === 'heal' && !(effect.amount && effect.amount > 0)) {
    errors.push(`[skills] ${skill.id}: heal effect requires a positive amount`);
  }
  if ((effect.kind === 'economy' || effect.kind === 'gather') && effect.amount === undefined) {
    errors.push(`[skills] ${skill.id}: ${effect.kind} effect requires an amount`);
  }
}

// Every job's startingSkills must resolve to a real skill — otherwise a class
// grants a name with no mechanical effect.
for (const job of JOB_CLASSES) {
  for (const skillId of job.startingSkills) {
    if (!SKILL_BY_ID.has(skillId)) {
      errors.push(`[skills] job "${job.id}" references unknown skill "${skillId}"`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Skill verification failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(`Skill verification passed (${SKILLS.length} skills, all job startingSkills resolved).`);
