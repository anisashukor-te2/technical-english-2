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

      // --- READ PERMISSIONS ---

      // Rule 1: UNAUTHENTICATED ACCESS
      // An unauthenticated user can ONLY read documents where the role is 'lecturer'.
      // This is the critical rule that allows the student registration query to succeed.
      allow read: if request.auth == null && resource.data.role == 'lecturer';
      
      // Rule 2: AUTHENTICATED ACCESS
      // A logged-in user has more complex permissions.
      allow read: if request.auth != null && (
        // A user can read their own profile.
        request.auth.uid == userId ||
        // Any authenticated user can read any lecturer's profile.
        resource.data.role == 'lecturer' ||
        // A lecturer can read the profiles of their own students.
        (
          exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'lecturer' &&
          resource.data.role == 'student' &&
          resource.data.lecturerEmail == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.email
        )
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

    // --- PRACTICE SESSIONS (PRESENTATION) ---
    match /practiceSessions/{sessionId} {
      allow create: if isOwner(request.resource.data);
      allow update: if isOwner(resource.data) || isLecturerForSession(resource.data);
      allow delete: if false;

      // Rule 1: Allow any authenticated user to read sessions shared for peer review.
      // This rule specifically enables the public peer review query.
      allow read: if request.auth != null && resource.data.isSharedForPeerReview == true;

      // Rule 2: Allow owners and lecturers to read their own NON-SHARED sessions.
      // Making this rule mutually exclusive from Rule 1 by adding `isSharedForPeerReview != true`
      // resolves the query conflict that caused the "insufficient permissions" error.
      allow read: if request.auth != null && resource.data.isSharedForPeerReview != true && (isOwner(resource.data) || isLecturerForSession(resource.data));

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