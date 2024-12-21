var express = require('express');
var router = express.Router();
const OpenAI = require('openai');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
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

  // None if not given?

  const prompt = `You are making an outline of topics for a course on ${req.body.courseName} while considering the ` +
    `following requests, if any. Learning Style: ${req.body.learningStyle}. Content Format: ${req.body.contentFormat}. ` +
    `Included Topics: ${req.body.includedTopics}. Logistics: ${req.body.courseLogistics}. Additional requests: ` +
    `${req.body.otherRequests}. What follow-up questions would you ask to generate a robust personalized course? ` +
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

  const promptTemplate = `for a course on ${req.body.courseName} while considering the ` +
    `following requests, if any. Learning Style: ${req.body.learningStyle}. Content Format: ${req.body.contentFormat}. ` +
    `Included Topics: ${req.body.includedTopics}. Logistics: ${req.body.courseLogistics}. Additional requests: ` +
    `${req.body.otherRequests}.`

  const response = JSON.parse(completion.choices[0].message.content);
  res.json( {prompt: promptTemplate, response: response["questions"]} );
});


/* POST create course and topics list. */
router.post('/create_course', async function(req, res, next) {
  console.log(req.body);
  var basicPrompt = req.body.previousPrompt + 
  "At the moment, you don't have audio or visual content support. You also cannot do peer or interactive" + 
  "activities. Additionally, here are some clarifying questions and answers. Consider the answers if given.";
  
  const addedQs = req.body.questions;
  const courseName = req.body.courseName;
  
  for (const key in addedQs) {
    basicPrompt += `${key}: ${addedQs[key]}`;
  }

  const outlinePrompt = "Generate an outline " + basicPrompt;

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
  try{
    const newDocument = {
      name: 'Brendon Urie', // get from login state
      account_id: 0,
      course_name: courseName,
      generating_prompt: basicPrompt,
      course_outline: outline,
      course_content: content,
    };

    await client.connect();
    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const result = await collection.insertOne(newDocument);

    console.log('Document inserted with _id:', result.insertedId);
  }
  catch{
    console.error('Error inserting document:', error);
    status = "Fail"
  }
  finally {
    // Close the connection
    await client.close();
  }

  res.json( {"message": status} );
});


module.exports = router;
