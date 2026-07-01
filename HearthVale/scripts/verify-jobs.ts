import { JOB_CLASSES, JOB_CLASS_BY_ID } from '../src/data/catalog/index.js';
import { STARTER_REGION_LEVEL_CAP } from '../src/data/progression/xpCurve.js';

const errors: string[] = [];
const seen = new Set<string>();

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
}

if (errors.length > 0) {
  console.error(`Job verification failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(
  `Job verification passed (${JOB_CLASSES.length} classes, ${baseClasses.length} base + ${
    JOB_CLASSES.length - baseClasses.length
  } advanced).`,
);
