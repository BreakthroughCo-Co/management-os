const admin = require('firebase-admin');

// Ensure firebase-admin is initialized.
admin.initializeApp({
  projectId: "breakthrough-administration"
});

async function main() {
  try {
    const user = await admin.auth().getUserByEmail('admin@breakthroughconsult.com.au');
    await admin.auth().updateUser(user.uid, {
      password: 'Password123!'
    });
    console.log('Password successfully updated for user:', user.uid);
  } catch (error) {
    console.error('Error updating password:', error);
  }
}

main();
