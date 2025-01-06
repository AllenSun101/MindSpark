var express = require('express');
var router = express.Router();
const OpenAI = require('openai');
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

const uri = process.env.MONGO_DB;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

run().catch(console.dir);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


async function CreateUserDocument(email, name){
  const dbName = "MindSpark";
  const collectionName = "Users";
  var status = "Success";

  try{
    const newDocument = {
      email: email,
      name: name,
      courses: [],
    };

    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const result = await collection.insertOne(newDocument);

    console.log('Document inserted with _id:', result.insertedId);
  }
  catch(error){
    console.error('Error inserting document:', error);
    status = "Fail"
  }
  finally {
    // Close the connection
    await client.close();
  }

  return status;
}


/* GET user courses, create user document if none. */
router.get('/get_courses', async function(req, res, next) {
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

    const record = await collection.findOne({ email: email });

    var courses = {"courses": []};
    var status = "Success";

    if (record) {
      courses = record.courses;
    } else {
      status = await CreateUserDocument(email, name);
    }
  } 
  catch(error){
    console.error('Error fetching courses:', error);
    status = "Fail"
  }
  finally {
    await client.close();
  }

  res.json( {courses: courses, status: status} );

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

  res.json( {profile: record, status: status} );

});

router.get('/get_outline', async function(req, res, next) {
  // fetch outline given course id
  const dbName = "MindSpark";
  const collectionName = "Courses";
  var status = "Success";

  const courseId = req.query.courseId;

  try {
    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    const record = await collection.findOne({ _id: new ObjectId(courseId) });

    var course_name = "";
    var course_outline = {"course_outline": []};
    var course_description = "";
    var status = "Success";

    if (record) {
      course_name = record.course_name;
      course_outline = record.course_outline.outline;
      course_description = record.course_outline.course_description;
    } else {
      status = "Fail"
    }
  } 
  catch(error){
    console.error('Error fetching course outline:', error);
    status = "Fail"
  }
  finally {
    await client.close();
  }

  res.json( {course_name: course_name, course_outline: course_outline, course_description: course_description, status: status} );

});

router.get('/get_content', async function(req, res, next) {
  const dbName = "MindSpark";
  const collectionName = "Courses";
  var status = "Success";

  const courseId = req.query.courseId;
  const topicIndex = req.query.topicIndex;

  try {
    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    const record = await collection.findOne({ _id: new ObjectId(courseId) });

    var topic_data = {"topic": {},"subtopics": []};
    var outline_data = {"topic": {},"subtopics": []};
    var status = "Success";

    if (record) {
      topic_data = record.course_content[topicIndex]
      outline_data = record.course_outline.outline[topicIndex]
    } else {
      status = "Fail"
    }    
  } 
  catch(error){
    console.error('Error fetching course content:', error);
    status = "Fail"
  }
  finally {
    await client.close();
  }

  res.json( {topic_data: topic_data.topic, subtopics: topic_data.subtopics, topic_status: outline_data.topic, subtopic_status: outline_data.subtopics, status: status} );

});

router.delete('/delete_course', async function(req, res, next) {
  const dbName = "MindSpark";
  const collectionName = "Courses";
  var status = "Success";

  const courseId = req.query.courseId;
  const email = req.query.email;

  try {
    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    const record = await collection.findOneAndDelete({ _id: new ObjectId(courseId) });

    if (!record) {
      status = "Fail"
    }

    const userCollectionName = "Users"
    const userCollection = database.collection(userCollectionName);
    
    const userRecord = await userCollection.findOne({ email: email });
    
    const filter = { email: email };
    const update = { $pull: { courses: {id: new ObjectId(courseId)} } };

    const updateReferenceResult = await userCollection.findOneAndUpdate(
      filter,
      update,
      { returnDocument: "after" } // Return the updated document
    );

    console.log(updateReferenceResult.value);
  } 
  catch(error){
    console.error('Error deleting course:', error);
    status = "Fail"
  }
  finally {
    await client.close();
  }

  res.json( {status: status} );
});

router.patch('/update_completion_status', async function(req, res, next) {
  const dbName = "MindSpark";
  const collectionName = "Courses";
  var status = "Success";

  const courseId = req.body.courseId;
  const topicIndex = req.body.topicIndex;
  const subtopicIndex = req.body.subtopicIndex;
  const updatedStatus = req.body.updatedStatus;

  try {
    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    const filter = { _id: new ObjectId(courseId) };
    const update = { 
      $set: {
        [`course_outline.outline.${topicIndex}.subtopics.${subtopicIndex}.status`]: updatedStatus
      } 
    };

    const updateReferenceResult = await collection.findOneAndUpdate(
      filter,
      update,
      { returnDocument: "after" }
    );

    var status_data = updateReferenceResult.course_outline.outline[topicIndex];

    //update overall topic completion status if necessary
    var amountComplete = 0;
    for(const subtopic of status_data.subtopics){
      if(subtopic.status == 'complete'){
        amountComplete ++;
      }
    }

    var topicCompletionStatus = (amountComplete == 0 ? "incomplete" : amountComplete == status_data.subtopics.length ? "complete" : "in progress");
    if(topicCompletionStatus != status_data.topic.status){
      const topicUpdate = { 
        $set: {
          [`course_outline.outline.${topicIndex}.topic.status`]: topicCompletionStatus
        } 
      };

      const updatedResult = await collection.findOneAndUpdate(
        filter,
        topicUpdate,
        { returnDocument: "after" }
      );

      status_data = updatedResult.course_outline.outline[topicIndex];
    }
  } 
  catch(error){
    console.error('Error updating completion status:', error);
    status = "Fail"
  }
  finally {
    await client.close();
  }

  res.json( {topic_status: status_data.topic, subtopic_status: status_data.subtopics, status: status} );
});

module.exports = router;
