const admin = require("firebase-admin");
admin.initializeApp({
  projectId: "breakthrough-administration"
});

async function run() {
  try {
    const user = await admin.auth().updateUser("bI3OSSi3SneLGUClk7ziH7PPVmJ2", {
      password: "password123"
    });
    console.log("Successfully updated user", user.toJSON());
  } catch (error) {
    console.log("Error updating user:", error);
  }
}
run();
