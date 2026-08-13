
import { db as firestoreDb } from "../lib/firebase";

export const db = firestoreDb;
export const logAudit = async (data: any) => console.log("Audit:", data);
export const getAuditLogs = async () => [];
export const saveInvestigationToFirestore = async (investigation: any) => {
  console.log("Saving investigation:", investigation);
};
export const fetchInvestigationsFromFirestore = async () => [];
export const subscribeInvestigationsFromFirestore = (_callback: (data: any[]) => void) => {
  console.log("Subscribing to investigations");
  return () => console.log("Unsubscribing");
};
export const testFirestoreConnection = async () => true;
