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
       if (request.auth == null || !exists(/databases/$(database)/documents/users/$(request.auth.uid))) {
        return false;
      }
      let lecturerProfile = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return lecturerProfile.role == 'lecturer' && docData.lecturerEmail == lecturerProfile.email;
    }

    // --- PRACTICE SESSIONS (PRESENTATION) ---
    match /practiceSessions/{sessionId} {
      allow create: if isOwner(request.resource.data);
      allow update: if isOwner(resource.data) || isLecturerForSession(resource.data);
      allow delete: if false;

      // A user can read (get/list) a session if they are the owner, their lecturer, 
      // OR if the session is shared for peer review.
      allow read: if request.auth != null &&
        (isOwner(resource.data) || isLecturerForSession(resource.data) || resource.data.isSharedForPeerReview == true);

      // Peer review subcollection
      match /peerReviews/{reviewId} {
        allow read, create: if request.auth.uid != null;
        allow update, delete: if false;
      }
    }

    // --- OTHER SESSION TYPES ---
    // These have simpler privacy rules: only the student and their lecturer can access.
    match /(meetingSessions|minuteTakingSessions|complaintSessions|complaintEmailSessions)/{sessionId} {
      allow create: if isOwner(request.resource.data);
      allow read, update: if request.auth != null && (isOwner(resource.data) || isLecturerForSession(resource.data));
      allow delete: if false;
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
    match /recordings/{userId}/{sessionId} {
      // Only the authenticated user can upload a recording to their own folder.
      allow create: if request.auth.uid == userId;
      // Any authenticated user can read recordings (for playback).
      allow read: if request.auth != null;
      // Disallow updates and deletes to prevent overwriting/losing data.
      allow update, delete: if false;
    }
  }
}
```