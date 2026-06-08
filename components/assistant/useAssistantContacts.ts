"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isAddress } from "viem";

export type AssistantContact = {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
};

function contactsStorageKey(walletAddress?: string) {
  return walletAddress ? `velora:assistant-contacts:${walletAddress.toLowerCase()}` : null;
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function readContacts(walletAddress?: string): AssistantContact[] {
  const key = contactsStorageKey(walletAddress);
  if (!key || typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]") as AssistantContact[];
    return Array.isArray(parsed) ? parsed.filter((contact) => contact.name && isAddress(contact.address)) : [];
  } catch {
    return [];
  }
}

function writeContacts(walletAddress: string | undefined, contacts: AssistantContact[]) {
  const key = contactsStorageKey(walletAddress);
  if (!key || typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(contacts));
}

export function useAssistantContacts(walletAddress?: string) {
  const [contacts, setContacts] = useState<AssistantContact[]>([]);

  useEffect(() => {
    setContacts(readContacts(walletAddress));
  }, [walletAddress]);

  const persist = useCallback(
    (nextContacts: AssistantContact[]) => {
      setContacts(nextContacts);
      writeContacts(walletAddress, nextContacts);
    },
    [walletAddress]
  );

  const saveContact = useCallback(
    (name: string, address: string, overwrite = false) => {
      if (!walletAddress) return { error: "Connect wallet first." };
      const cleanName = normalizeName(name);
      if (!cleanName) return { error: "Enter a contact name." };
      if (!isAddress(address)) return { error: "Enter a valid wallet address." };
      const existing = contacts.find((contact) => contact.name.toLowerCase() === cleanName.toLowerCase());
      if (existing && !overwrite) return { error: "Contact name already exists.", duplicate: existing };
      const now = new Date().toISOString();
      const nextContact: AssistantContact = {
        id: existing?.id ?? `contact_${Date.now()}`,
        name: cleanName,
        address,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      const nextContacts = existing
        ? contacts.map((contact) => (contact.id === existing.id ? nextContact : contact))
        : [nextContact, ...contacts];
      persist(nextContacts);
      return { contact: nextContact };
    },
    [contacts, persist, walletAddress]
  );

  const deleteContact = useCallback(
    (name: string) => {
      if (!walletAddress) return { error: "Connect wallet first." };
      const cleanName = normalizeName(name);
      const existing = contacts.find((contact) => contact.name.toLowerCase() === cleanName.toLowerCase());
      if (!existing) return { error: "Contact not found." };
      persist(contacts.filter((contact) => contact.id !== existing.id));
      return { contact: existing };
    },
    [contacts, persist, walletAddress]
  );

  const updateContact = useCallback(
    (name: string, address: string) => {
      if (!isAddress(address)) return { error: "Enter a valid wallet address." };
      return saveContact(name, address, true);
    },
    [saveContact]
  );

  const findExact = useCallback(
    (name: string) => {
      const cleanName = normalizeName(name).toLowerCase();
      return contacts.find((contact) => contact.name.toLowerCase() === cleanName) ?? null;
    },
    [contacts]
  );

  const findSimilar = useCallback(
    (name: string) => {
      const cleanName = normalizeName(name).toLowerCase();
      if (!cleanName) return [];
      return contacts.filter((contact) => {
        const contactName = contact.name.toLowerCase();
        return contactName.includes(cleanName) || cleanName.includes(contactName);
      });
    },
    [contacts]
  );

  return useMemo(
    () => ({
      contacts,
      saveContact,
      deleteContact,
      updateContact,
      findExact,
      findSimilar
    }),
    [contacts, deleteContact, findExact, findSimilar, saveContact, updateContact]
  );
}
