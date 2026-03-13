import {
  generateAndUploadPersonalfragebogen as servicePersonalfragebogen,
  generateAndUploadMotivationLetter as serviceMotivationLetter,
} from "../../services/pdfGenerators/formGenerators";

export function buildGenerateAndUploadPersonalfragebogen(formCv, docCv) {
  return async () => servicePersonalfragebogen(formCv, docCv);
}

export function buildGenerateAndUploadMotivationLetter(formCv, addressFields) {
  return async () => serviceMotivationLetter(formCv, addressFields);
}
