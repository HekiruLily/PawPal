// Kept as the module boundary in the project TXT. Cloud I/O lives in services/.
export { observePets, savePet, deletePet } from '../services/petService';
export { uploadImage, isUploadConfigured } from '../services/uploadService';
export type { Pet, PetDraft } from '../services/petService';
