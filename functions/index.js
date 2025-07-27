// functions/index.js

// The Firebase Admin SDK to access Firestore and FCM
const admin = require('firebase-admin');

// IMPORTANT: Directly import the V2 Firestore event trigger
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

// --- IMPORTANT: Initialize the Firebase Admin SDK ---
// When deployed to Cloud Functions, this is automatically configured
// using the service account associated with your project.
admin.initializeApp();

// --- Cloud Function to send notifications when a new TRIP is created ---
// Using V2 (2nd Generation) functions syntax
exports.sendNotificationOnNewTrip = onDocumentCreated( // <<< CORRECT: Use onDocumentCreated directly
  'trips/{tripId}', // Path to listen for new documents in the 'trips' collection
  async (event) => { // V2 functions pass a single 'event' object
    // V2 functions: snapshot data is accessed via event.data
    const snap = event.data;

    // Check if snapshot data exists
    if (!snap) {
      console.log('No data associated with the event. Exiting.');
      return null;
    }

    const newTrip = snap.data(); // Get the data of the newly created trip
    const tripName = newTrip.tripName || 'New Trip'; // Get trip name, or a default

    const tripMembersData = newTrip.members; // This is an array of maps like {uid: '...', displayName: '...'}

    // 1. Basic Validation: Check if there are members to notify
    if (!tripMembersData || tripMembersData.length === 0) {
      console.log('No members specified for this trip. No notifications sent.');
      return null;
    }

    // Extract UIDs from the 'members' array to query the 'users' collection
    const memberUids = tripMembersData.map(member => member.uid);

    // 2. Fetch Device Tokens for all relevant members
    const recipientTokens = [];

    try {
      // Handle 'in' query limit (max 10).
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', memberUids)
        .get();

      // Iterate through the fetched user documents
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.deviceTokens && Array.isArray(userData.deviceTokens) && userData.deviceTokens.length > 0) {
          recipientTokens.push(...userData.deviceTokens);
        }
      });

      const uniqueRecipientTokens = [...new Set(recipientTokens)];

      if (uniqueRecipientTokens.length === 0) {
        console.log('No valid device tokens found for trip members. Not sending notifications.');
        return null;
      }

      // 3. Construct the Notification Message
      const message = {
        notification: {
          title: `You've Been Invited! 🎉`,
          body: `You've been added to the trip: "${tripName}"!`,
        },
        data: {
          type: 'newTrip',
          tripId: event.params.tripId, // Access wildcard params via event.params
        },
        tokens: uniqueRecipientTokens,
      };

      // 4. Send the Notification using FCM
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log('Successfully sent messages:', response);

      // --- OPTIONAL BUT RECOMMENDED: Handle Failed Tokens ---
      if (response.responses) {
        const tokensToRemove = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            console.error(
              `Failed to send message to token ${uniqueRecipientTokens[idx]}:`,
              resp.error.code,
              resp.error.message
            );
            if (resp.error.code === 'messaging/invalid-registration-token' ||
                resp.error.code === 'messaging/registration-token-not-registered' ||
                resp.error.code === 'messaging/not-found') {
              tokensToRemove.push(uniqueRecipientTokens[idx]);
            }
          }
        });

        if (tokensToRemove.length > 0) {
          console.log('Removing invalid tokens:', tokensToRemove);
          const updates = [];
          usersSnapshot.forEach(doc => {
            const userId = doc.id;
            const userData = doc.data();
            const currentTokens = userData.deviceTokens || [];
            const newTokens = currentTokens.filter(token => !tokensToRemove.includes(token));
            if (newTokens.length !== currentTokens.length) {
              updates.push(
                admin.firestore().collection('users').doc(userId).update({
                  deviceTokens: newTokens
                })
              );
            }
          });
          if (updates.length > 0) {
             await Promise.all(updates);
             console.log('Invalid tokens removed from Firestore.');
          }
        }
      }

    } catch (error) {
      console.error('Error sending notification for new trip:', error);
    }

    return null;
  }
);