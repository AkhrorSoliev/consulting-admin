import {
  generateAndUploadRozilikXati as serviceRozilikXati,
  generateAndUploadNomzodRozilikXati as serviceNomzodRozilikXati,
} from "../../services/pdfGenerators/uzbekGenerators";

export function buildGenerateAndUploadRozilikXati(formCv) {
  return async () => serviceRozilikXati(formCv);
}

export function buildGenerateAndUploadNomzodRozilikXati(formCv) {
  return async () => serviceNomzodRozilikXati(formCv);
}
