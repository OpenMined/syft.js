import { PlanTrainerCheckpoint } from '@openmined/syft.js';

/**
 * Example of checkpoint serialization and storage.
 *
 * @param {string} name - Checkpoint name
 * @param {PlanTrainerCheckpoint} checkpoint - Checkpoint itself
 */
export const storeCheckpoint = async (name, checkpoint) => {
  const serializedCheckpoint = JSON.stringify(await checkpoint.toJSON());
  localStorage.setItem(name, serializedCheckpoint);
}

/**
 * Example of checkpoint retrieval and deserialization.
 *
 * @param {string} name - Checkpoint name
 * @return {PlanTrainerCheckpoint|boolean}
 */
export const retrieveCheckpoint = (name) => {
  const serializedCheckpoint = localStorage.getItem(name);
  if (serializedCheckpoint) {
    const checkpointJSON = JSON.parse(serializedCheckpoint);
    return PlanTrainerCheckpoint.fromJSON(null, checkpointJSON);
  }
  return false;
}
