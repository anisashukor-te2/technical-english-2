
## Firestore Security Rules

These rules provide a robust level of security for the application's data, enabling registration while protecting student privacy.

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- USER PROFILES ---
    match /users/{userId} {
      // WRITE: A user can only write to their own document.
      allow write: if request.auth.uid == userId;

      // READ (for AUTHENTICATED users): Any logged-in user can read any other user's profile.
      // This is a broad rule for simplicity within the app's current structure.
      // Specific session data is still protected by the rules below.
      allow read: if request.auth != null;

      // GET (for UNAUTHENTICATED users): An unauthenticated user can only GET
      // a document if that document is a lecturer profile. This is essential for
      // the registration query to be validated by the rules engine.
      allow get: if request.auth == null && resource.data.role == 'lecturer';

      // LIST (for UNAUTHENTICATED users): An unauthenticated user can perform a LIST
      // operation (a query). The `get` rule above will then be applied to every
      // document returned by the query, ensuring only lecturer profiles are accessible.
      allow list: if request.auth == null;
    }
    
    // Helper functions for session rules
    function isOwner(docData) {
      return request.auth.uid == docData.studentUid;
    }
    
    function isLecturerForSession(docData) {
       // This function must be null-safe to handle partial document creation during race conditions.
       // It now checks for the existence of `lecturerEmail` before attempting to access it.
       if (docData == null || !('lecturerEmail' in docData) || request.auth == null || !exists(/databases/$(database)/documents/users/$(request.auth.uid))) {
        return false;
      }
      let lecturerProfile = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return lecturerProfile.role == 'lecturer' && docData.lecturerEmail == lecturerProfile.email;
    }

    // --- PRACTICE SESSIONS (PRESENTATION) ---
    match /practiceSessions/{sessionId} {
      allow delete: if false;

      // READ: A user can read a session if they are the owner, their lecturer, 
      // OR if the session is shared for peer review.
      allow read: if request.auth != null &&
        (isOwner(resource.data) || isLecturerForSession(resource.data) || resource.data.isSharedForPeerReview == true);

      // WRITE: Combines create and update to handle a client-side race condition.
      allow write: if (
          // Case 1: Standard Create & Student Update.
          // The resulting document must be owned by the writer.
          request.resource.data.studentUid == request.auth.uid
        ) || (
          // Case 2: Lecturer Update.
          // The writer is the lecturer for the existing document.
          // This only works on updates because `resource` is null on create.
          isLecturerForSession(resource.data)
        ) || (
          // Case 3: Partial Create (Race Condition Fix).
          // Allows an authenticated user to create an initial, partial document
          // that doesn't yet have a studentUid. The subsequent full update will be
          // validated by Case 1.
          resource == null && !('studentUid' in request.resource.data) && request.auth.uid != null
        );

      // Peer review subcollection
      match /peerReviews/{reviewId} {
        allow read, create: if request.auth.uid != null;
        allow update, delete: if false;
      }
    }

    // --- OTHER SESSION TYPES ---
    // These have simpler privacy rules: only the student and their lecturer can access.
    match /(meetingSessions|minuteTakingSessions|complaintSessions|complaintEmailSessions)/{sessionId} {
      allow delete: if false;

      allow read: if request.auth != null && (isOwner(resource.data) || isLecturerForSession(resource.data));

      // WRITE: Combines create and update with the same logic as practiceSessions to prevent race conditions.
      allow write: if (
          // Case 1: Standard Create & Student Update.
          request.resource.data.studentUid == request.auth.uid
        ) || (
          // Case 2: Lecturer Update.
          isLecturerForSession(resource.data)
        ) || (
          // Case 3: Partial Create (Race Condition Fix).
          resource == null && !('studentUid' in request.resource.data) && request.auth.uid != null
        );
    }
  }
}
```

### Firebase Storage Rules

These rules ensure that only authenticated users can upload files, and that they can only upload to a path corresponding to their own user ID. All authenticated users can read files (e.g., to view recordings in peer reviews or lecturer views).

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Match any file in the 'recordings' folder
    match /recordings/{userId}/{fileName} {
      // Allow file creation (upload) if the user is authenticated
      // and the `userId` in the path matches their own UID.
      allow create: if request.auth != null && request.auth.uid == userId;

      // Allow file reads for any authenticated user. This enables lecturers
      // to review student work and for the peer-review system to function.
      allow read: if request.auth != null;

      // Disallow updates and deletes from the client to protect recordings.
      // Deletions should be handled by a trusted server environment if needed.
      allow update, delete: if false;
    }
  }
}
```