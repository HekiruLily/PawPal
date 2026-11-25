// Public Firebase web configuration. Fill in values from your group's Firebase project.
// These identify the project; database.rules.json enforces access to its data.
export const firebaseConfig = {
  apiKey: 'AIzaSyA7fQYPL33vRQZfLDsVwAqbD9UR1_fMyAU',
  authDomain: 'pawpal-e40a5.firebaseapp.com',
  databaseURL:
    'https://pawpal-e40a5-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'pawpal-e40a5',
  appId: '1:1017876063946:web:507e796d02884cbc593633',
};

export const cloudinaryConfig = {
  cloudName: '',
  unsignedPreset: '',
};

// Android emulator uses 10.0.2.2; a physical phone needs the computer's LAN address.
// Keep disabled for the group's actual Firebase project.
export const firebaseEmulators = {
  enabled: false,
  host: '10.0.2.2',
  authPort: 9099,
  databasePort: 9000,
};
