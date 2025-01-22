var express = require('express');
var router = express.Router();
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { ObjectId } = require('mongodb');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
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

/* GET user courses, create user document if none. */
router.get('/get_courses', async function(req, res, next) {
  // fetch user courses, and create user document if it does not exist
  var status = "Success";

  const email = req.query.email;
  const name = req.query.name;

  try {
    const collection = req.db.collection("Users");

    const record = await collection.findOne({ email: email });
    
    var courses = {"courses": []};
    var status = "Success";

    if (record) {
      courses = record.courses;
    } else {
      status = await CreateUserDocument(req.db, email, name);
    }
  } 
  catch(error){
    console.error('Error fetching courses:', error);
    status = "Fail"
  }

  res.json( {courses: courses, status: status} );

});

router.get('/get_outline', async function(req, res, next) {
  // fetch outline given course id
  var status = "Success";

  const email = req.query.email;
  const courseId = req.query.courseId;

  try {
    const collection = req.db.collection("Courses");

    const record = await collection.findOne({ _id: ObjectId.createFromHexString(courseId) });

    var course_name = "";
    var course_outline = {"course_outline": []};
    var course_description = "";
    var status = "Success";

    var unauthorized = false;

    if (record) {
      // if different email, then restrict access
      if(record.email != email){
        unauthorized = true;
      }
      else{
        course_name = record.course_name;
        course_outline = record.course_outline.outline;
        course_description = record.course_outline.course_description;
      }
    } else {
      status = "Fail";
    }
  } 
  catch(error){
    console.error('Error fetching course outline:', error);
    status = "Fail";
  }

  console.log(unauthorized);

  if(unauthorized){
    return res.json( { unauthorized: true } );
  }

  res.json( { unauthorized: false, course_name: course_name, course_outline: course_outline, course_description: course_description, status: status } );

});

router.get('/get_content', async function(req, res, next) {
  var status = "Success";

  const courseId = req.query.courseId;
  const topicIndex = req.query.topicIndex;
  const email = req.query.email;

  try {
    const collection = req.db.collection("Courses");

    const record = await collection.findOne({ _id: ObjectId.createFromHexString(courseId) });

    var topic_data = {"topic": {},"subtopics": []};
    var outline_data = {"topic": {},"subtopics": []};
    var status = "Success";

    var unauthorized = false;

    if (record) {
      // if different email, then restrict access
      if(record.email != email){
        unauthorized = true;
      }
      else{
        topic_data = record.course_content[topicIndex]
        outline_data = record.course_outline.outline[topicIndex]
      }
    } else {
      status = "Fail"
    }    
  } 
  catch(error){
    console.error('Error fetching course content:', error);
    status = "Fail"
  }

  if(unauthorized){
    return res.json( { unauthorized: true } );
  }

  res.json( { unauthorized: false, topic_data: topic_data.topic, subtopics: topic_data.subtopics, topic_status: outline_data.topic, subtopic_status: outline_data.subtopics, status: status } );

});

router.delete('/delete_course', async function(req, res, next) {
  var status = "Success";

  const courseId = req.query.courseId;
  const email = req.query.email;

  try {
    const collection = req.db.collection("Courses");

    const record = await collection.findOneAndDelete({ _id: ObjectId.createFromHexString(courseId) });

    if (!record) {
      status = "Fail"
    }

    const userCollection = req.db.collection("Users");
    
    const filter = { email: email };
    const update = { $pull: { courses: {id: ObjectId.createFromHexString(courseId)} } };

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

  res.json( {status: status} );
});

router.patch('/rename_course', async function(req, res, next) {
  var status = "Success";

  const courseId = req.body.courseId;
  const email = req.body.email;
  const newCourseName = req.body.newCourseName;

  try {
    const collection = req.db.collection("Courses");

    const filter = { _id: ObjectId.createFromHexString(courseId) };
    const update = { 
      $set: {
        ["course_name"]: newCourseName
      } 
    };

    const updateReferenceResult = await collection.findOneAndUpdate(
      filter,
      update,
      { returnDocument: "after" }
    );

    const userCollection = req.db.collection("Users");
    
    const userFilter = { email: email, "courses.id": ObjectId.createFromHexString(courseId) };
    const userUpdate = {
      $set: {
        "courses.$.name": newCourseName
      }
    };

    const userUpdateReferenceResult = await userCollection.findOneAndUpdate(
      userFilter,
      userUpdate,
      { returnDocument: "after" } // Return the updated document
    );

  } 
  catch(error){
    console.error('Error renaming course:', error);
    status = "Fail"
  }

  res.json( {status: status} );
});

router.patch('/update_completion_status', async function(req, res, next) {
  var status = "Success";

  const courseId = req.body.courseId;
  const topicIndex = req.body.topicIndex;
  const subtopicIndex = req.body.subtopicIndex;
  const updatedStatus = req.body.updatedStatus;

  try {
    const collection = req.db.collection("Courses");

    const filter = { _id: ObjectId.createFromHexString(courseId) };
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

  res.json( {topic_status: status_data.topic, subtopic_status: status_data.subtopics, status: status} );
});

module.exports = router;
