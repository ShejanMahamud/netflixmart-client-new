import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Function to send the FCM token to the backend using fetch
const sendTokenToBackend = async (token) => {
  try {
    const response = await fetch('https://netflix-mart-baf4c7cc928e.herokuapp.com/device-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }), // Send the token in the request body
    });

    if (!response.ok) {
      throw new Error('Failed to send token to server');
    }

    const data = await response.json();
    console.log('Token saved successfully:', data);
  } catch (error) {
    console.error('Error sending token:', error);
  }
};

export const requestPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_VAPID_KEY });
      if (token) {
        await sendTokenToBackend(token);
      }
    }
  } catch (error) {
    console.error('Error getting permission or token:', error);
  }
};

export { messaging };

