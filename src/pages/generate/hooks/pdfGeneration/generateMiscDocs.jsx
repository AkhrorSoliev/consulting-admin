import {
  generateAndUploadMitarbeiterwohnung as serviceMitarbeiterwohnung,
  generateAndUploadSprachsbestaetigung as serviceSprachsbestaetigung,
  generateAndUploadEinwilligungserklaerung as serviceEinwilligungserklaerung,
  generateAndUploadFotoVideoRozilik as serviceFotoVideoRozilik,
} from "../../services/pdfGenerators/miscGenerators";

export function buildGenerateAndUploadMitarbeiterwohnung(formCv) {
  return async () => serviceMitarbeiterwohnung(formCv);
}

export function buildGenerateAndUploadSprachsbestaetigung(formCv) {
  return async () => serviceSprachsbestaetigung(formCv);
}

export function buildGenerateAndUploadEinwilligungserklaerung(formCv) {
  return async () => serviceEinwilligungserklaerung(formCv);
}

export function buildGenerateAndUploadFotoVideoRozilik(formCv) {
  return async () => serviceFotoVideoRozilik(formCv);
}
