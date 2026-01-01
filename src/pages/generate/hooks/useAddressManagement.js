import { useState, useRef, useEffect } from "react";
import { parseGermanAddress, formatGermanAddress } from "../utils/addressUtils";

export function useAddressManagement(initialAddress = "") {
  const [addressFields, setAddressFields] = useState(() =>
    parseGermanAddress(initialAddress)
  );
  const lastSyncedAddressRef = useRef("");
  const internalAddressUpdateRef = useRef(false);

  const syncAddressToFields = (addressString) => {
    const addr = String(addressString || "").trim();
    if (addr === lastSyncedAddressRef.current) return;
    if (internalAddressUpdateRef.current) {
      internalAddressUpdateRef.current = false;
      return;
    }
    lastSyncedAddressRef.current = addr;
    setAddressFields(parseGermanAddress(addr));
  };

  const syncFieldsToAddress = () => {
    internalAddressUpdateRef.current = true;
    const formatted = formatGermanAddress(addressFields);
    lastSyncedAddressRef.current = formatted;
    return formatted;
  };

  return {
    addressFields,
    setAddressFields,
    syncAddressToFields,
    syncFieldsToAddress,
  };
}
