import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { getPublicDb } from "@/lib/firebase/publicServer";
import { toJsDate } from "@/lib/utils/bst";
import type { Post, Tournament } from "@/lib/types";

/**
 * Server-side reads of public content, used for SEO: page metadata, social
 * link previews, and getting article text into the initial HTML so crawlers
 * (which do not run the client's useEffect fetches) can actually see it.
 *
 * Every read here goes through the unauthenticated public Firestore handle,
 * so it can only reach collections whose rules already say
 * `allow read: if true`. See src/lib/firebase/publicServer.ts.
 *
 * All functions swallow errors and return null/[]: a Firestore hiccup should
 * degrade the page to its existing client-side fetch, never crash the route.
 */

export async function getPostServer(id: string): Promise<Post | null> {
  try {
    const snap = await getDoc(doc(getPublicDb(), "posts", id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Post) : null;
  } catch (error) {
    console.error(`getPostServer(${id}) failed:`, error);
    return null;
  }
}

export async function getTournamentServer(
  id: string
): Promise<Tournament | null> {
  try {
    const snap = await getDoc(doc(getPublicDb(), "tournaments", id));
    return snap.exists()
      ? ({ id: snap.id, ...snap.data() } as Tournament)
      : null;
  } catch (error) {
    console.error(`getTournamentServer(${id}) failed:`, error);
    return null;
  }
}

/** Ids + last-modified dates only -- all the sitemap needs.
 *
 *  createdAt/updatedAt are typed as `number` but Firestore actually returns
 *  Timestamp objects, so they go through toJsDate() rather than
 *  `new Date(...)` -- which yields an Invalid Date and throws on
 *  .toISOString() during sitemap generation. */
export async function getAllPostsForSitemap(): Promise<
  { id: string; lastModified: Date | null }[]
> {
  try {
    const snap = await getDocs(
      query(collection(getPublicDb(), "posts"), orderBy("createdAt", "desc"))
    );
    return snap.docs.map((d) => {
      const data = d.data() as Post;
      return {
        id: d.id,
        lastModified: toJsDate(data.updatedAt) ?? toJsDate(data.createdAt),
      };
    });
  } catch (error) {
    console.error("getAllPostsForSitemap failed:", error);
    return [];
  }
}

export async function getAllTournamentsForSitemap(): Promise<
  { id: string }[]
> {
  try {
    const snap = await getDocs(collection(getPublicDb(), "tournaments"));
    return snap.docs.map((d) => ({ id: d.id }));
  } catch (error) {
    console.error("getAllTournamentsForSitemap failed:", error);
    return [];
  }
}
