import { useEffect, useRef, useState } from "react";
import { parseGermanAddress, formatGermanAddress } from "../../utils";
import { REGION_POSTAL_CODES } from "../../../../constants/regionPostalCodes";

/**
 * Manages address field parsing/syncing, and auto-fills postal codes
 * when city or birthPlace changes.
 */
export function useAddressSync({
  initialForm,
  formCv,
  setFormCv,
  formInitialized,
  baselineInitializedRef,
}) {
  const [addressFields, setAddressFields] = useState(() =>
    parseGermanAddress(initialForm.personalInfo.address),
  );
  const lastSyncedAddressRef = useRef("");
  const internalAddressUpdateRef = useRef(false);
  const previousCityRef = useRef("");
  const previousBirthPlaceRef = useRef("");

  // Helper: apply address fields and sync back to form
  function applyAddressFields(nextFields) {
    setAddressFields(nextFields);
    const formatted = formatGermanAddress(nextFields);
    internalAddressUpdateRef.current = true;
    setFormCv((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, address: formatted },
    }));
  }

  // Address field sync: form address string -> parsed fields
  useEffect(() => {
    const raw = String(formCv?.personalInfo?.address || "").trim();
    if (internalAddressUpdateRef.current) {
      internalAddressUpdateRef.current = false;
      lastSyncedAddressRef.current = raw;
      return;
    }
    if (raw === lastSyncedAddressRef.current) return;
    lastSyncedAddressRef.current = raw;
    setAddressFields(parseGermanAddress(raw));
  }, [formCv?.personalInfo?.address]);

  // Postal code auto-fill from city change
  useEffect(() => {
    if (!formInitialized || !baselineInitializedRef.current) return;

    const currentCity = addressFields?.city;

    if (previousCityRef.current && previousCityRef.current !== currentCity) {
      if (currentCity && REGION_POSTAL_CODES[currentCity]) {
        const postalCode = REGION_POSTAL_CODES[currentCity];
        if (addressFields.postalCode !== postalCode) {
          applyAddressFields({
            ...addressFields,
            postalCode: postalCode,
          });
        }
      }
    }

    previousCityRef.current = currentCity;
  }, [addressFields?.city, formInitialized]);

  // Postal code auto-fill from birthPlace change
  useEffect(() => {
    if (!formInitialized || !baselineInitializedRef.current) return;

    const currentBirthPlace = formCv?.personalInfo?.birthPlace;

    if (
      previousBirthPlaceRef.current &&
      previousBirthPlaceRef.current !== currentBirthPlace
    ) {
      if (currentBirthPlace && REGION_POSTAL_CODES[currentBirthPlace]) {
        const postalCode = REGION_POSTAL_CODES[currentBirthPlace];
        if (addressFields.postalCode !== postalCode) {
          applyAddressFields({
            ...addressFields,
            postalCode: postalCode,
          });
        }
      }
    }

    previousBirthPlaceRef.current = currentBirthPlace;
  }, [formCv?.personalInfo?.birthPlace, formInitialized]);

  return {
    addressFields,
    setAddressFields,
    applyAddressFields,
    lastSyncedAddressRef,
    internalAddressUpdateRef,
    previousCityRef,
    previousBirthPlaceRef,
  };
}
