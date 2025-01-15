var express = require('express');
var router = express.Router();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

async function CreateUserDocument(db, email, name){
  var status = "Success";

  try{
    const newDocument = {
      email: email,
      name: name,
      courses: [],
    };

    const collection = db.collection('Users');
    const result = await collection.insertOne(newDocument);

    console.log('Document inserted with _id:', result.insertedId);
  }
  catch(error){
    console.error('Error inserting document:', error);
    status = "Fail";
  }
  return status;
}

/* GET user profile, create user document if none. */
router.get('/get_profile', async function(req, res, next) {
  // fetch user courses, and create user document if it does not exist
  var status = "Success";

  const email = req.query.email;
  const name = req.query.name;

  try {
    const collection = req.db.collection('Users');

    var record = await collection.findOne({ email: email });

    var status = "Success";

    if (!record) {
      status = await CreateUserDocument(req.db, email, name);
      record = {};
    }
  } 
  catch(error){
    console.error('Error fetching profile:', error);
    status = "Fail"
  }

  res.json( {record: record, status: status} );

});

/* POST update user profile. */
router.post('/update_profile', async function(req, res, next) {
  // fetch user courses, and create user document if it does not exist
  var status = "Success";

  const email = req.body.email;
  const background = req.body.background;
  const learningPreferences = req.body.learningPreferences;

  try {
    const collection = req.db.collection('Users'); 

    const updateResult = await collection.updateOne(
      {email: email},
      {$set: { "profile.background": background, "profile.learning_preferences": learningPreferences}},
    );

  } 
  catch(error){
    console.error('Error updating profile:', error);
    status = "Fail"
  }

  res.json( {status: status} );
})

module.exports = router;
