## Firestore Security Rules

These rules provide a robust level of security for the application's data, enabling registration while protecting student privacy.

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- USER PROFILES ---
    // This re-architected rule resolves the persistent "Missing or insufficient permissions"
    // error during student registration by combining all read logic into a single block.
    match /users/{userId} {
      // WRITE permissions are simple: a user can only write to their own document.
      allow write: if request.auth.uid == userId;

      // READ permissions are combined to avoid evaluation conflicts:
      allow read: if
        // 1. Anyone can read a lecturer's profile. This is CRITICAL for registration.
        resource.data.role == 'lecturer' ||
        // 2. An authenticated user can read their own profile.
        (request.auth != null && request.auth.uid == userId) ||
        // 3. A lecturer can read the profiles of their own students.
        (
          request.auth != null &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'lecturer' &&
          resource.data.role == 'student' &&
          resource.data.lecturerEmail == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.email
        );
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

    // --- SESSIONS ---
    // This rule is updated to fix the "Peer Review" loading error.
    match /(practiceSessions|meetingSessions|minuteTakingSessions|complaintSessions|complaintEmailSessions)/{sessionId} {
      // CREATE: A student can create their own session.
      allow create: if isOwner(request.resource.data);
      
      // READ: Who can read/query sessions.
      allow read: if request.auth != null && (
        // 1. The student who owns the session.
        isOwner(resource.data) ||
        // 2. The student's lecturer.
        isLecturerForSession(resource.data) ||
        // 3. Any authenticated user can read a session shared for peer review.
        resource.data.isSharedForPeerReview == true
      );

      // UPDATE: Who can update sessions. Note this is more restrictive than read.
      allow update: if isOwner(resource.data) || isLecturerForSession(resource.data);
      
      allow delete: if false;

      // Peer review subcollection
      match /peerReviews/{reviewId} {
        allow read, create: if request.auth.uid != null;
        allow update, delete: if false;
      }
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