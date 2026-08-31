require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const TARGET_EMAIL = process.argv[2];

if (!TARGET_EMAIL) {
  console.log('❌ Error: Apna email bataiye. Example: node makeAdmin.js name@gmail.com');
  process.exit(1);
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const result = await db.collection('users').updateOne(
      { email: TARGET_EMAIL },
      { $set: { isAdmin: true } }
    );

    if (result.matchedCount > 0) {
      console.log(`\n✅ Success! ${TARGET_EMAIL} ab admin ban gaya hai.`);
      console.log(`Ab aap http://localhost:3000/admin par ja sakte hain!\n`);
    } else {
      console.log(`\n❌ Error: ${TARGET_EMAIL} database me nahi mila. Kya aapne is email se signup kiya hai?\n`);
    }
  } catch(e) {
    console.log(e);
  } finally {
    mongoose.disconnect();
  }
}
run();
