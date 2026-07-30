import { ELEMENT_MODIFIERS } from '../src/data/combat/formulas.js';
import { JOB_CLASSES, QUESTS, SKILLS, SKILL_BY_ID } from '../src/data/catalog/index.js';

const errors: string[] = [];
const seen = new Set<string>();
const knownElements = new Set(Object.keys(ELEMENT_MODIFIERS));
const knownJobs = new Set(JOB_CLASSES.map((job) => job.id));
const knownQuests = new Set(QUESTS.map((quest) => quest.id));
const knownEvolutions = new Set(JOB_CLASSES.flatMap((job) => (job.evolutions ?? []).map((evolution) => evolution.id)));

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
  if ((skill.requiredLevel ?? 1) < 1) {
    errors.push(`[skills] ${skill.id}: requiredLevel must be positive`);
  }
  for (const jobId of skill.jobIds ?? []) {
    if (!knownJobs.has(jobId)) errors.push(`[skills] ${skill.id}: unknown job "${jobId}"`);
  }
  if (skill.jobIds && new Set(skill.jobIds).size !== skill.jobIds.length) {
    errors.push(`[skills] ${skill.id}: duplicate jobIds`);
  }
  for (const evolutionId of skill.evolutionIds ?? []) {
    if (!knownEvolutions.has(evolutionId)) errors.push(`[skills] ${skill.id}: unknown evolution "${evolutionId}"`);
  }
  if (skill.evolutionIds && new Set(skill.evolutionIds).size !== skill.evolutionIds.length) {
    errors.push(`[skills] ${skill.id}: duplicate evolutionIds`);
  }
  if (skill.evolutionIds?.length && !skill.jobIds?.length) {
    errors.push(`[skills] ${skill.id}: evolution-restricted skill must also declare jobIds`);
  }
  if (skill.unlockQuestId && !knownQuests.has(skill.unlockQuestId)) {
    errors.push(`[skills] ${skill.id}: unknown unlock quest "${skill.unlockQuestId}"`);
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
  if (job.startingSkills.length > 3) {
    errors.push(`[skills] job "${job.id}" grants more than three starting loadout skills`);
  }
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
