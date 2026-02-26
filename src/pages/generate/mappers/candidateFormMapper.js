// Incremental mapper placeholder for GeneratePage refactor.
export function mapCandidateDocToForm(candidateDoc, fallbackForm) {
  if (!candidateDoc || typeof candidateDoc !== "object") {
    return fallbackForm;
  }
  return candidateDoc;
}

export function mapFormToCandidateDoc(formValue) {
  return formValue;
}
