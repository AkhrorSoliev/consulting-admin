import { buildGenerateAndUploadBeratungsvertrag } from "./generateBeratungsvertrag";
import { buildGenerateAndUploadVermittlungsvertrag } from "./generateVermittlungsvertrag";
import {
  buildGenerateAndUploadVollmacht,
  buildGenerateAndUploadVollmachtArbeitgeber,
} from "./generateVollmacht";
import {
  buildGenerateAndUploadRozilikXati,
  buildGenerateAndUploadNomzodRozilikXati,
} from "./generateUzbekDocs";
import {
  buildGenerateAndUploadMitarbeiterwohnung,
  buildGenerateAndUploadSprachsbestaetigung,
  buildGenerateAndUploadEinwilligungserklaerung,
  buildGenerateAndUploadFotoVideoRozilik,
} from "./generateMiscDocs";
import {
  buildGenerateAndUploadPersonalfragebogen,
  buildGenerateAndUploadMotivationLetter,
} from "./generateFormDocs";

export function usePdfGeneration(formCv, addressFields, docCv) {
  return {
    generateAndUploadBeratungsvertrag:
      buildGenerateAndUploadBeratungsvertrag(formCv, addressFields),
    generateAndUploadVermittlungsvertrag:
      buildGenerateAndUploadVermittlungsvertrag(formCv, addressFields),
    generateAndUploadVollmacht:
      buildGenerateAndUploadVollmacht(formCv, addressFields),
    generateAndUploadVollmachtArbeitgeber:
      buildGenerateAndUploadVollmachtArbeitgeber(formCv, addressFields),
    generateAndUploadRozilikXati:
      buildGenerateAndUploadRozilikXati(formCv),
    generateAndUploadNomzodRozilikXati:
      buildGenerateAndUploadNomzodRozilikXati(formCv),
    generateAndUploadMitarbeiterwohnung:
      buildGenerateAndUploadMitarbeiterwohnung(formCv),
    generateAndUploadSprachsbestaetigung:
      buildGenerateAndUploadSprachsbestaetigung(formCv),
    generateAndUploadEinwilligungserklaerung:
      buildGenerateAndUploadEinwilligungserklaerung(formCv),
    generateAndUploadFotoVideoRozilik:
      buildGenerateAndUploadFotoVideoRozilik(formCv),
    generateAndUploadPersonalfragebogen:
      buildGenerateAndUploadPersonalfragebogen(formCv, docCv),
    generateAndUploadMotivationLetter:
      buildGenerateAndUploadMotivationLetter(formCv, addressFields),
  };
}
