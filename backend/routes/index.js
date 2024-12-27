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

/* POST follow-up questions after sending user inputs. */
router.post('/follow_ups', async function(req, res, next) {
  console.log(req.body);

  var emptyFields = [];
  var fields = {
    "Learning Style": req.body.learningStyle,
    "Content Format": req.body.contentFormat,
    "Included Topics": req.body.includedTopics,
    "Logistics": req.body.courseLogistics,
    "Other Requests": req.body.otherRequests,
  }

  var prompt = `You are making an outline of topics for a course on ${req.body.courseName} while considering the ` +
    `following requests, if any. `;

  var promptTemplate = `for a course on ${req.body.courseName} while considering the ` +
    `following requests, if any. `;

  for(const key in fields){
    if(fields[key] == ""){
      if(key != "Other Requests"){
        emptyFields.push(key);
      }
    }
    else{
      prompt += `${key}: ${fields[key]}. `;
      promptTemplate += `${key}: ${fields[key]}. `;
    }
  }
    
  prompt += `These request fields are empty: ${emptyFields} What follow-up questions would you ask to generate a robust personalized course? ` +
    `Only generate questions that will actually help, but generate as many as you need to.` +
    `Do not ask about deadlines or future content releases. At the moment, you don't have audio or visual content support. ` + 
    `You also cannot do peer or interactive activities.`;

  const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
          { role: "system", content: "You are creating intuitive and engaging course content." },
          {
              role: "user",
              content: prompt,
          }
      ],
      n: 1,
      response_format: {
        "type": "json_schema",
        "json_schema": {
          "name": "response_schema",
          "schema": {
            "type": "object",
            "properties": {
              "questions": {
                "type": "array",
                "description": "An array of questions",
                "items": {
                  "type": "string"
                }
              },
            },
            "additionalProperties": false,
          }
        }
      }
  });

  const response = JSON.parse(completion.choices[0].message.content);
  res.json( {prompt: promptTemplate, response: response["questions"]} );
});


/* POST create course and topics list. */
router.post('/create_course', async function(req, res, next) {
  console.log(req.body);
  var basicPrompt = req.body.previousPrompt + 
  "At the moment, you don't have audio or visual content support. You also cannot do peer or interactive " + 
  "activities. Additionally, here are some clarifying questions and answers. Consider the answers if given. ";
  
  const addedQs = req.body.questions;
  const courseName = req.body.courseName;
  const email = req.body.email;
  const name = req.body.name;
  
  for (const key in addedQs) {
    if(addedQs[key] != ""){
      basicPrompt += `${key}: ${addedQs[key]} `;
    }
  }

  const outlinePrompt = "Generate an outline " + basicPrompt + "Ensure that topics and subtopics would have " +
  "substantial enough information.";

  console.log(outlinePrompt);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
        { role: "system", content: "You are creating intuitive and engaging course content." },
        {
            role: "user",
            content: outlinePrompt,
        }
    ],
    n: 1,
    response_format: {
      "type": "json_schema",
      "json_schema": {
        "name": "response_schema",
        "schema": {
          "type": "object",
            "properties": {
              "outline": {
                  "type": "array",
                  "items": {
                      "type": "object",
                      "properties": {
                          "topic": { "type": "string" },
                          "subtopics": {
                              "type": "array",
                              "items": { "type": "string" }
                          }
                      },
                      "required": ["topic", "subtopics"]
                  }
              }
            },
            required: ["outline"],
          "additionalProperties": false,
        }
      }
    }
  });

  const outline = JSON.parse(completion.choices[0].message.content);
  console.log(outline);

  var content = [];

  for(const unit of outline.outline){
    const topic = unit.topic;
    const subtopics = unit.subtopics;

    const topicPrompt = `Generate content for the topic ${topic} and each of the subtopics ${subtopics}.` + 
    `This is ${basicPrompt}. Also keep in mind the content already generated and avoid redundancy: ${content}`;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
          { role: "system", content: "You are creating intuitive and engaging course content." },
          {
              role: "user",
              content: topicPrompt,
          }
      ],
      n: 1,
      response_format: {
        "type": "json_schema",
        "json_schema": {
          "name": "response_schema",
          "schema": {
            "type": "object",
              "properties": {
                "topic": {
                  "type": "object",
                    "properties": {
                      "topic_name": { "type": "string" },
                      "topic_content": { "type": "string" },
                      },
                      "required": ["topic_name", "topic_content"]
                },
                "subtopics": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "subtopic_name": { "type": "string" },
                        "subtopic_content": { "type": "string" },
                      },
                      "required": ["subtopic_name", "subtopic_content"]
                    }
                }
              },
              required: ["topic", "subtopics"],
            "additionalProperties": false,
          }
        }
      }
    });

    const topicContent = JSON.parse(completion.choices[0].message.content);
    content.push(topicContent);
    console.log("YEET");
  }

  const dbName = "MindSpark";
  const collectionName = "Courses";

  // create course document
  var status = "Success";
  var insertedId = "";
  try{
    const newDocument = {
      email: email,
      name: name,
      course_name: courseName,
      generating_prompt: basicPrompt,
      course_outline: outline,
      course_content: content,
    };

    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const result = await collection.insertOne(newDocument);

    insertedId = result.insertedId;

    // insert a course reference into user document
    const userCollectionName = "Users"
    const userCollection = database.collection(userCollectionName);
    
    const userRecord = await userCollection.findOne({ email: email });
    if(!userRecord){
      status = await CreateUserDocument(email, name);
    }
    
    const filter = { email: email };
    const update = { $push: { courses: {id: insertedId, name: courseName} } };

    const updateReferenceResult = await userCollection.findOneAndUpdate(
      filter,
      update,
      { returnDocument: "after" } // Return the updated document
    );
    
    console.log('Document inserted with _id:', result.insertedId);
  }
  catch(error){
    console.error('Error inserting document:', error);
    status = "Fail";
  }
  finally {
    // Close the connection
    await client.close();
  }

  res.json( {"message": status, "course_id": insertedId} );
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
    var status = "Success";

    if (record) {
      course_name = record.course_name;
      course_outline = record.course_outline.outline;
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

  res.json( {course_name: course_name, course_outline: course_outline, status: status} );

});

module.exports = router;
