import { JOB_CLASSES, JOB_CLASS_BY_ID, QUESTS, SKILL_BY_ID } from '../src/data/catalog/index.js';
import { CURRENT_CAMPAIGN_LEVEL_CAP, STARTER_REGION_LEVEL_CAP } from '../src/data/progression/xpCurve.js';

const errors: string[] = [];
const seen = new Set<string>();
const masteryIds = new Set<string>();
const evolutionIds = new Set<string>();
const knownQuests = new Set(QUESTS.map((quest) => quest.id));
const masteryBonusKeys = new Set([
  'hp', 'mp', 'atk', 'def', 'spd', 'crit', 'powerPercent', 'healingPercent',
  'evasion', 'buyPrice', 'dropRate', 'stackMax',
]);

const baseClasses = JOB_CLASSES.filter((job) => job.tier === 0);
if (baseClasses.length !== 1) {
  errors.push(`[jobs] expected exactly one tier-0 base class, found ${baseClasses.length}`);
}

for (const job of JOB_CLASSES) {
  if (seen.has(job.id)) {
    errors.push(`[jobs] duplicate job id "${job.id}"`);
  }
  seen.add(job.id);

  if (job.tier === 0) {
    if (job.baseClassId) {
      errors.push(`[jobs] ${job.id}: tier-0 base class must not set baseClassId`);
    }
  } else {
    if (!job.baseClassId) {
      errors.push(`[jobs] ${job.id}: tier-${job.tier} class must set baseClassId`);
    } else if (!JOB_CLASS_BY_ID.has(job.baseClassId)) {
      errors.push(`[jobs] ${job.id}: unknown baseClassId "${job.baseClassId}"`);
    } else if (JOB_CLASS_BY_ID.get(job.baseClassId)!.tier >= job.tier) {
      errors.push(`[jobs] ${job.id}: baseClassId "${job.baseClassId}" is not a lower tier`);
    }
  }

  if (job.requiredLevel < 1 || job.requiredLevel > STARTER_REGION_LEVEL_CAP) {
    errors.push(
      `[jobs] ${job.id}: requiredLevel ${job.requiredLevel} outside 1..${STARTER_REGION_LEVEL_CAP}`,
    );
  }

  for (const [stat, value] of Object.entries(job.growth)) {
    if (value < 0) {
      errors.push(`[jobs] ${job.id}: negative growth on ${stat}`);
    }
  }

  if (job.startingSkills.length === 0) {
    errors.push(`[jobs] ${job.id}: no startingSkills`);
  }
  if (new Set(job.startingSkills).size !== job.startingSkills.length) {
    errors.push(`[jobs] ${job.id}: duplicate startingSkills`);
  }

  const masteries = job.masteries ?? [];
  if (job.tier === 0 && masteries.length > 0) {
    errors.push(`[jobs] ${job.id}: tier-0 base class must not define masteries`);
  }
  if (job.tier > 0 && masteries.length !== 2) {
    errors.push(`[jobs] ${job.id}: expected exactly two masteries, found ${masteries.length}`);
  }
  for (const mastery of masteries) {
    if (masteryIds.has(mastery.id)) errors.push(`[jobs] duplicate mastery id "${mastery.id}"`);
    masteryIds.add(mastery.id);
    if (mastery.requiredLevel < job.requiredLevel || mastery.requiredLevel > CURRENT_CAMPAIGN_LEVEL_CAP) {
      errors.push(`[jobs] ${job.id}/${mastery.id}: requiredLevel ${mastery.requiredLevel} outside ${job.requiredLevel}..${CURRENT_CAMPAIGN_LEVEL_CAP}`);
    }
    const bonuses = Object.entries(mastery.bonuses);
    if (bonuses.length === 0) errors.push(`[jobs] ${job.id}/${mastery.id}: no bonuses`);
    for (const [key, value] of bonuses) {
      if (!masteryBonusKeys.has(key)) errors.push(`[jobs] ${job.id}/${mastery.id}: unsupported bonus "${key}"`);
      if (!Number.isFinite(value) || value === 0 || value < (key === 'buyPrice' ? -25 : 0) || value > 100) {
        errors.push(`[jobs] ${job.id}/${mastery.id}: invalid ${key} bonus ${value}`);
      }
    }
  }

  const evolutions = job.evolutions ?? [];
  if (job.tier === 0 && evolutions.length > 0) {
    errors.push(`[jobs] ${job.id}: tier-0 base class must not define evolutions`);
  }
  if (job.tier > 0 && evolutions.length !== 2) {
    errors.push(`[jobs] ${job.id}: expected exactly two evolutions, found ${evolutions.length}`);
  }
  for (const evolution of evolutions) {
    if (evolutionIds.has(evolution.id)) errors.push(`[jobs] duplicate evolution id "${evolution.id}"`);
    evolutionIds.add(evolution.id);
    if (evolution.requiredLevel < job.requiredLevel || evolution.requiredLevel > CURRENT_CAMPAIGN_LEVEL_CAP) {
      errors.push(`[jobs] ${job.id}/${evolution.id}: requiredLevel ${evolution.requiredLevel} outside ${job.requiredLevel}..${CURRENT_CAMPAIGN_LEVEL_CAP}`);
    }
    if (!knownQuests.has(evolution.unlockQuestId)) {
      errors.push(`[jobs] ${job.id}/${evolution.id}: unknown unlock quest "${evolution.unlockQuestId}"`);
    }
    if (!SKILL_BY_ID.has(evolution.skillId)) {
      errors.push(`[jobs] ${job.id}/${evolution.id}: unknown evolution skill "${evolution.skillId}"`);
    }
    const bonuses = Object.entries(evolution.bonuses);
    if (bonuses.length === 0) errors.push(`[jobs] ${job.id}/${evolution.id}: no bonuses`);
    for (const [key, value] of bonuses) {
      if (!masteryBonusKeys.has(key)) errors.push(`[jobs] ${job.id}/${evolution.id}: unsupported bonus "${key}"`);
      if (!Number.isFinite(value) || value === 0 || value < (key === 'buyPrice' ? -25 : 0) || value > 100) {
        errors.push(`[jobs] ${job.id}/${evolution.id}: invalid ${key} bonus ${value}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Job verification failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(
  `Job verification passed (${JOB_CLASSES.length} classes, ${baseClasses.length} base + ${
    JOB_CLASSES.length - baseClasses.length
  } advanced, ${masteryIds.size} masteries, ${evolutionIds.size} evolutions).`,
);
