## Firestore Security Rules

These rules provide a basic level of security for the application's data.

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, update: if request.auth.uid == userId;
      allow create: if request.auth.uid != null;
    }

    // A helper function to check if the requesting user is the lecturer for a given student
    function isLecturerForStudent(studentUid) {
      let studentProfile = get(/databases/$(database)/documents/users/$(studentUid)).data;
      let lecturerProfile = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      return lecturerProfile.role == 'lecturer' && studentProfile.lecturerEmail == lecturerProfile.email;
    }
    
    // Rules for all session collections
    match /{collection}/{sessionId} {
        // Students can create sessions and read/update their own.
        // Lecturers can read sessions of students they teach.
        allow create: if request.auth.uid == request.resource.data.studentUid;
        allow read, update: if request.auth.uid == resource.data.studentUid || isLecturerForStudent(resource.data.studentUid);
        
        // Deny deletes by default for data integrity
        allow delete: if false;

        // Peer review subcollection
        match /peerReviews/{reviewId} {
            // Any authenticated user can read peer reviews and submit new ones
            allow read, create: if request.auth.uid != null;
            // Only the creator can update/delete their review (optional, disabled for simplicity)
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
