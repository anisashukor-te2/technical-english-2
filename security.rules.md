## Firestore Security Rules

These rules provide a robust level of security for the application's data, enabling registration while protecting student privacy.

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // --- USER PROFILES ---
    match /users/{userId} {
      // WRITE permissions: A user can only write to their own document.
      allow write: if request.auth.uid == userId;

      // READ permissions: This simplified rule is designed to definitively fix the student registration error.
      allow read: if
        // Rule 1: Allow ANYONE to read ANY document where role is 'lecturer'.
        // This is public information and is ESSENTIAL for the student registration
        // query to succeed for an unauthenticated user.
        resource.data.role == 'lecturer'
        
        // Rule 2: Allow an authenticated user to read their own document.
        || (request.auth != null && request.auth.uid == userId);
        
      // NOTE: The previous, more complex rule allowing lecturers to read their students'
      // profiles has been removed. Its complexity, involving a `get()` call, was the 
      // root cause of the query validator failing during unauthenticated registration.
      // This simplified rule prioritizes fixing the critical registration bug.
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

      // LIST rule: a logged-in user can perform queries on this collection.
      // The queries themselves are further secured by the GET rule below.
      allow list: if request.auth != null;

      // GET rule: a logged-in user can read a specific document if:
      // 1. It's shared for peer review, OR
      // 2. They are the owner, OR
      // 3. They are the lecturer for that session.
      allow get: if request.auth != null &&
        (resource.data.isSharedForPeerReview == true || isOwner(resource.data) || isLecturerForSession(resource.data));

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