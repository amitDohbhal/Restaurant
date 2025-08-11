import Specialization from "@/models/Specialization";

// Utility to add a specialization if it doesn't exist
export async function addSpecializationIfNotExists(name) {
  if (!name) return;
  await Specialization.findOneAndUpdate(
    { name },
    { name },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}
