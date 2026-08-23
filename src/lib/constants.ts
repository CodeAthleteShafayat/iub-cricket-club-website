import type { PlayerRole } from "@/lib/types";

export const ROLE_OPTIONS: { value: PlayerRole; label: string }[] = [
  { value: "batsman", label: "Batsman" },
  { value: "bowler", label: "Bowler" },
  { value: "all-rounder", label: "All-rounder" },
  { value: "wicketkeeper", label: "Wicketkeeper" },
];

export const DEPARTMENTS = [
  "CSE",
  "EEE",
  "BBA",
  "Economics",
  "English",
  "Pharmacy",
  "Civil Engineering",
  "Other",
];

export const CLUB_NAME = "IUB Cricket Club";
