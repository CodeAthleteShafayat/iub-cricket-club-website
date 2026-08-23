export type MemberStatus = "pending" | "approved" | "rejected";

export type PlayerRole = "batsman" | "bowler" | "all-rounder" | "wicketkeeper";

export interface Member {
  uid: string;
  name: string;
  studentId: string;
  department: string;
  batch: string;
  role: PlayerRole;
  phone: string;
  email: string;
  photoURL: string | null;
  status: MemberStatus;
  isAdmin: boolean;
  createdAt: number;
  updatedAt: number;
  reviewedBy: string | null;
  reviewedAt: number | null;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  imageURL: string | null;
  authorUid: string;
  authorName: string;
  createdAt: number;
  updatedAt: number;
}

export interface CommunityMessage {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhotoURL: string | null;
  text: string;
  createdAt: number;
}

export interface GalleryImage {
  id: string;
  url: string;
  uploadedBy: string;
  featuredOnHome: boolean;
  createdAt: number;
}
