var express = require('express');
var router = express.Router();
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGO_DB;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET user profile, create user document if none. */
router.get('/get_profile', async function(req, res, next) {
  // fetch user courses, and create user document if it does not exist
  const dbName = "MindSpark";
  const collectionName = "Users";
  var status = "Success";

  const email = req.query.email;
  const name = req.query.name;

  try {
    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    var record = await collection.findOne({ email: email });

    var status = "Success";

    if (!record) {
      status = await CreateUserDocument(email, name);
      record = {};
    }
  } 
  catch(error){
    console.error('Error fetching profile:', error);
    status = "Fail"
  }
  finally {
    await client.close();
  }

  res.json( {record: record, status: status} );

});

/* POST update user profile. */
router.post('/update_profile', async function(req, res, next) {
  // fetch user courses, and create user document if it does not exist
  const dbName = "MindSpark";
  const collectionName = "Users";
  var status = "Success";

  const email = req.body.email;
  const background = req.body.background;
  const learningPreferences = req.body.learningPreferences;

  try {
    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    const updateResult = await collection.updateOne(
      {email: email},
      {$set: { "profile.background": background, "profile.learning_preferences": learningPreferences}},
    );

  } 
  catch(error){
    console.error('Error updating profile:', error);
    status = "Fail"
  }
  finally {
    await client.close();
  }

  res.json( {status: status} );
})

module.exports = router;
