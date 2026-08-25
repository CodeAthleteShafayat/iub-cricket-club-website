import { NextResponse } from "next/server";
import { FirebaseError } from "firebase-admin";
import { AdminAuthError, requireAdmin } from "@/lib/auth/requireAdmin";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import type { Member } from "@/lib/types";

// Deleting a member has to remove BOTH halves of their identity:
//   - members/{uid} in Firestore  -> the roster entry / profile
//   - the Firebase Auth user      -> the actual login (email + password)
// Removing only the Firestore doc leaves an orphaned login: the person can
// still sign in, and their email stays permanently taken, so they can never
// re-apply. Auth deletion needs the Admin SDK, which is why this is a route
// and not a client-side call.
export async function POST(request: Request) {
  try {
    const { uid: callerUid } = await requireAdmin(request);

    const { uid } = await request.json();
    if (typeof uid !== "string" || !uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    // Two lockout guards -- without these an admin can permanently lose
    // access to the admin panel, which nothing in the app can undo.
    if (uid === callerUid) {
      return NextResponse.json(
        { error: "You can't delete your own account." },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const targetSnap = await db.collection("members").doc(uid).get();
    const target = targetSnap.data() as Member | undefined;

    if (target?.isAdmin) {
      const admins = await db
        .collection("members")
        .where("isAdmin", "==", true)
        .get();
      if (admins.size <= 1) {
        return NextResponse.json(
          { error: "Can't delete the last remaining admin." },
          { status: 400 }
        );
      }
    }

    // Tolerate a missing Auth user: the doc may be an orphan from before
    // this route existed, and deleting the leftover doc is still correct.
    let authDeleted = true;
    try {
      await getAdminAuth().deleteUser(uid);
    } catch (error) {
      if ((error as FirebaseError).code === "auth/user-not-found") {
        authDeleted = false;
      } else {
        throw error;
      }
    }

    await db.collection("members").doc(uid).delete();

    return NextResponse.json({ deleted: true, authDeleted });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("delete-member failed:", error);
    return NextResponse.json({ error: "Could not delete this member." }, { status: 500 });
  }
}
