var express = require('express');
var router = express.Router();
const OpenAI = require('openai');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const RTFParser = require('rtf-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const upload = multer({ storage: multer.memoryStorage() });

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
router.post('/follow_ups', upload.single('file'), async function(req, res, next) {

  if(req.file){
    // parse file text and extract useful info + list of topics
    const file = req.file;
    const fileType = req.file.mimetype;
    var extractedText = "";

    if (fileType === 'text/plain') {
      extractedText = file.buffer.toString('utf8');
    } else if (fileType === 'application/pdf') {
      const pdfData = await pdfParse(file.buffer);
      extractedText = pdfData.text;
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Handle DOCX files
      const mammothResult = await mammoth.extractRawText({ buffer: req.file.buffer });
      extractedText = mammothResult.value;
    } else if (fileType === 'application/rtf') {
      extractedText = await extractRTFText(req.file.buffer);
    } else {
      extractedText = 'Unsupported file type';
    }

    const documentPrompt = "In order to build a course from a document, extract relevant topics and other " + 
      `useful information about the course. Be concise. The course name is ${req.body.courseName} Here is the document: ${extractedText}`;
    
    var documentInformation = "";
    
    const documentCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are creating intuitive and engaging course content." },
        {
            role: "user",
            content: documentPrompt,
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
              "topics": {
                "type": "array",
                "description": "An array of topics (if any found).",
                "items": {
                  "type": "string"
                }
              },
              "other_information": {
                "type": "string",
              }
            },
            "additionalProperties": false,
          }
        }
      }
    });

    documentInformation = JSON.parse(documentCompletion.choices[0].message.content);
  }

  var emptyFields = [];
  var fields = {
    "Learning Style": req.body.learningStyle,
    "Content Format": req.body.contentFormat,
    "Document Information": documentInformation,
    "Included Topics": req.body.includedTopics,
    "Limited Topics": req.body.limitedTopics,
    "Logistics": req.body.courseLogistics,
    "Other Requests": req.body.otherRequests,
  }

  console.log(fields);

  var prompt = `You are making an outline of topics for a course on ${req.body.courseName} while considering the ` +
    `following requests, if any. `;

  var promptFields = {};

  for(const key in fields){
    if(fields[key] == "" || fields[key] == undefined){
      if(key != "Other Requests" && key != "Document Information"){
        emptyFields.push(key);
      }
    }
    else if(key == "Document Information"){
      prompt += `Included Topics and style: ${fields[key]}. Note: If other request fields contradict parts of this ` + 
        "field, use the other field information for precedence. ";
      promptFields["Included Topics and style"] = fields[key] + " Note: If other request fields contradict parts of this " +
        "field, use the other field information for precedence.";
    }
    else if(key == "Limited Topics"){
      if(fields[key] && fields["Included Topics"] != ""){
        prompt += "Do not include additional topics. ";
        promptFields["Additional Topics"] = "Do not include additional topics.";
      }
      else if(!fields[key] && fields["Included Topics"] != ""){
        prompt += "Include additional relevant topics as needed. ";
        promptFields["Additional Topics"] = "Include additional relevant topics as needed.";
      }
    }
    else{
      prompt += `${key}: ${fields[key]}. `;
      promptFields[key] = fields[key];
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
  res.json( {prompt: promptFields, response: response["questions"]} );
});

/* POST create course and topics list. */
router.post('/create_course', async function(req, res, next) {
  console.log(req.body);

  const email = req.body.email;
  const name = req.body.name;
  const courseName = req.body.courseName;

  // filter out questions with response
  const filteredQuestions = Object.fromEntries(
    Object.entries(req.body.questions).filter(([key, value]) => value !== "" && value !== undefined)
  );

  var requestsPrompt = "";
  var requestsResponsePrompt = "";
  if(Object.keys(req.body.promptFields || {}).length > 0 && Object.keys(filteredQuestions || {}).length > 0){
    requestsPrompt = `Reformat these requests into a paragraph: ${JSON.stringify(req.body.promptFields)}. ` +
    `Also, incorporate info from these answers into the paragraph: ${JSON.stringify(filteredQuestions)}. ` + 
    `Aim for concision without leaving out any details, and refer to the user as "I".`
  }
  else if(Object.keys(req.body.promptFields || {}).length > 0){
    requestsPrompt = `Reformat these requests into a paragraph: ${JSON.stringify(req.body.promptFields)}. ` +
    `Aim for concision without leaving out any details, and refer to the user as "I".`
  }
  else if(Object.keys(filteredQuestions || {}).length > 0){
    requestsPrompt = `Incorporate info from these answers into a paragraph: ${JSON.stringify(filteredQuestions)}. ` +
    `Aim for concision without leaving out any details, and refer to the user as "I".`
  }

  console.log(requestsPrompt);

  if(requestsPrompt != ""){
    const requestsCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
          { role: "system", content: "You are translating json into paragraph form." },
          {
              role: "user",
              content: requestsPrompt,
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
              "prompt": {
                "type": "string",
              },
            },
            "additionalProperties": false,
          }
        }
      }
    });
    
    requestsResponsePrompt = JSON.parse(requestsCompletion.choices[0].message.content).prompt;
    
    console.log(requestsResponsePrompt);
  }

  var basicPrompt = requestsResponsePrompt + 
  " Do not add audio or visual content. Do not add peer or interactive activities. "

  const outlinePrompt = "Generate an outline for a course on " + req.body.courseName + " while considering this user info: " + basicPrompt + " The outline consists of topics and subtopics. " +
  "There should be 2-7 subtopics per topic. For each subtopic, list out things to include. If the user wants a " + 
  "basic course, stick to fewer broader topics and/or fewer discussion points per subtopic. For more in-depth courses, " + 
  "include a larger amount of more specific topics and/or more discussion points per subtopic. Minimize redundancy in discussion " + 
  "points across course subtopics.";
  
  console.log(outlinePrompt);

  var completion = await openai.chat.completions.create({
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
              "course_description": {
                "type": "string",
                "description": "one sentence description of the course",
              },
              "outline": {
                  "type": "array",
                  "items": {
                      "type": "object",
                      "properties": {
                          "topic": { "type": "string" },
                          "subtopics": {
                              "type": "array",
                              "items": { 
                                "type": "object",
                                "properties": {
                                  "subtopic": { "type": "string" },
                                  "discussion_points": { 
                                    "type": "array",
                                    "items": {"type": "string"},
                                  },
                                },
                                "required": ["subtopic", "discussion_points"]
                              }
                          }
                      },
                      "required": ["topic", "subtopics"]
                  }
              }
            },
            required: ["course_description", "outline"],
          "additionalProperties": false,
        }
      }
    }
  });

  var outline = JSON.parse(completion.choices[0].message.content);
  console.log(outline);

  var content = [];

  for(const unit of outline.outline){
    const topic = unit.topic;
    const subtopics = unit.subtopics;

    const topicPrompt = `Generate content for the topic ${topic} and all of the subtopics ${JSON.stringify(subtopics)}. ` + 
    "Use the exact subtopic names provided. For each subtopic, hit all the corresponding discussion points. " + 
    `For level of detail, writing style, and other considerations, use the user info: ${basicPrompt}`;
    
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

  // Add completion status
  for(let i = 0; i < outline.outline.length; i++){
    const tempTopic = outline.outline[i].topic;
    outline.outline[i].topic = {
      "topic": tempTopic,
      "status": "incomplete"
    };
    for(let j = 0; j < outline.outline[i].subtopics.length; j++){
      const tempSubtopic = outline.outline[i].subtopics[j];
      outline.outline[i].subtopics[j] = {
        "subtopic": tempSubtopic,
        "status": "incomplete"
      };
    }
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
