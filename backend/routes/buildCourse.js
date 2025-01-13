var express = require('express');
var router = express.Router();
const OpenAI = require('openai');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const RTFParser = require('rtf-parser');

const upload = multer({ storage: multer.memoryStorage() });

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
    
  prompt += `These request fields are empty: ${emptyFields} What follow-up questions would you ask to generate a personalized course? ` +
    `Only generate insightful questions, and try to generate as few as possible. ` +
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

async function BasicOutline(basicPrompt, courseName){
  const outlinePrompt = `Generate an outline for a course on ${courseName} while considering this user info: ` + 
  `${basicPrompt} The outline consists of topics and subtopics. For each subtopic, list out things to include. ` +  
  `Minimize redundancy in discussion points across course subtopics.`;
  
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

  return outline;
}

async function DetailedOutline(basicPrompt, courseName){
  const outlinePrompt = `Generate an outline for a course on ${courseName} while considering this user info: ` + 
  `${basicPrompt} The outline consists of topics and subtopics. For each subtopic, list out things to include. ` +  
  `Minimize redundancy in discussion points across course subtopics. It is recommended to include at least 10 ` + 
  `topics, at least 3-4 subtopics per topic, and at least 3-4 discussion points per subtopic.`;
  
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

  return outline;
}

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
    `Aim for concision without leaving out any details, and refer to the user as "I".`;
  }
  else if(Object.keys(req.body.promptFields || {}).length > 0){
    requestsPrompt = `Reformat these requests into a paragraph: ${JSON.stringify(req.body.promptFields)}. ` +
    `Aim for concision without leaving out any details, and refer to the user as "I".`;
  }
  else if(Object.keys(filteredQuestions || {}).length > 0){
    requestsPrompt = `Incorporate info from these answers into a paragraph: ${JSON.stringify(filteredQuestions)}. ` +
    `Aim for concision without leaving out any details, and refer to the user as "I".`;
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
  " Do not add audio or visual content. Do not add peer or interactive activities."

  var outline = {}
  // if no info provided, assume basic outline 
  if(requestsResponsePrompt == ""){
    outline = await BasicOutline(basicPrompt, req.body.courseName);
  }
  else{
    // determine whether outline should be basic or in-depth
    var depthPrompt = "Using this information, determine whether the user wants a basic or in-depth course. " + 
    `For basic, look for words such as "short", "brief", "simple". For in-depth, look for words like "long", ` +
    `"detailed", "complex". If there are no signal words, use your best judgement from the content. ` + 
    `The content: ${requestsResponsePrompt}`;

    const depthCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
          { role: "system", content: "You are determining user intentions from text." },
          {
              role: "user",
              content: depthPrompt,
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
              "depth": {
                "type": "string",
                "enum": ["basic", "in-depth"],
              },
            },
            "additionalProperties": false,
          }
        }
      }
    });
  
    const depth = JSON.parse(depthCompletion.choices[0].message.content).depth;
  
    if(depth == "in-depth"){
      outline = await DetailedOutline(basicPrompt, req.body.courseName);
    }
    else{
      outline = await BasicOutline(basicPrompt, req.body.courseName);
    }
  }

  var content = [];

  for(const unit of outline.outline){
    const topic = unit.topic;
    const subtopics = unit.subtopics;

    const topicPrompt = `Generate content for the topic ${topic} and all of the subtopics ${JSON.stringify(subtopics)}. ` + 
    "Use the exact subtopic names provided. For each subtopic, hit all the corresponding discussion points. " + 
    `For level of detail, writing style, and other considerations, use the user info: ${basicPrompt}. ` +
    "For equations, use Latex " + 
    "and wrap inline formulas with $ and block formulas with $$.";
    
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

router.post('/regenerate_page', async function(req, res, next) {
    const newRequest = req.body.newRequest;
    const currentPage = req.body.currentPage;
    const email = req.body.email;
    const courseId = req.body.courseId;
    const topic = req.body.topic;
    const subtopic = req.body.subtopic;

    // Adjust discussion points first so that relative scope is maintained and context considered

    console.log(currentPage);

    var prompt = `Modify the page while taking this into account: ${newRequest}. The current page: ${currentPage}` + 
    "For equations, use Latex " + 
    "and wrap inline formulas with $ and block formulas with $$.";
    
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
                "page": {"type": "string"},
              },
            "additionalProperties": false,
          }
        }
      }
    });

    const newPage = JSON.parse(completion.choices[0].message.content).page;

    console.log(newPage);

    var status = "Success";
    const dbName = "MindSpark";
    const collectionName = "Courses";
    
    try{
      await client.connect();
      const database = client.db(dbName);
      const collection = database.collection(collectionName);

      const filter = { _id: ObjectId.createFromHexString(courseId)};

      var update = {};
      if(subtopic == -1){
        var update = { $set: { [`course_content.${topic}.topic.topic_content`]: newPage} };
      }
      else{
        var update = { $set: { [`course_content.${topic}.subtopics.${subtopic}.subtopic_content`]: newPage} };
      }

      const updateResult = await collection.updateOne(
        filter,
        update      
      );
      
      console.log('Document updated');
    }
    catch(error){
      console.error('Error updating document:', error);
      status = "Fail";
    }
    finally {
      // Close the connection
      await client.close();
    }

    res.json( {"status": status} );
})

router.post('/regenerate_course', async function(req, res, next) {
    console.log(req.body);
    const newRequest = req.body.newRequest;
    const currentPage = req.body.page;
    const email = req.body.email;
    const courseId = req.body.courseId;
    const courseName = req.body.courseName;

    console.log(newRequest);

    const dbName = "MindSpark";
    const collectionName = "Courses";

    // fetch current prompt and outline
    var prompt = "";
    var outline = "";

    var status = "Success";
    try{
      await client.connect();
      const database = client.db(dbName);
      const collection = database.collection(collectionName);
      
      const filter = { _id: ObjectId.createFromHexString(courseId)};
      
      // get prompt and outline
      const documentInfo = await collection.findOne(
        filter, // Query filter
        { projection: { generating_prompt: 1, course_outline: 1, _id: 0 } } // Projection
      );

      console.log(documentInfo);

      prompt = documentInfo.generating_prompt;
      outline = documentInfo.course_outline;
      
      console.log('Document found');
    }
    catch(error){
      console.error('Error finding document:', error);
      status = "Fail";
    }
    finally {
      // Close the connection
      await client.close();
    }

    // generate new outline with old outline, current prompt, and new request 
    var outlinePrompt = `This outline: ${JSON.stringify(outline)}
    for course ${courseName} was generated using prompt ${prompt}. 
    The user wants these changes: ${newRequest}.
    Generate a new outline that considers these changes.`;

    console.log(outlinePrompt);

    const outlineCompletion = await openai.chat.completions.create({
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

    var newOutline;
    try {
      if (typeof outlineCompletion.choices[0].message.content === "string") {
        newOutline = JSON.parse(outlineCompletion.choices[0].message.content);
      } else {
        newOutline = outlineCompletion.choices[0].message; // If it's already an object
      }
      console.log(newOutline);
    } catch (error) {
      console.error("Error parsing response:", error);
    }

    // generate content for the new outline, emphasizing requested changes
    var content = [];

    for(const unit of newOutline.outline){
      const topic = unit.topic;
      const subtopics = unit.subtopics;

      const topicPrompt = `Generate content for the topic ${topic} and all of the subtopics ${JSON.stringify(subtopics)}. ` + 
      "Use the exact subtopic names provided. For each subtopic, hit all the corresponding discussion points. " + 
      `For level of detail, writing style, and other considerations, use the user info: ${prompt} ` + 
      `and ${newRequest}.`;

      console.log(topicPrompt);
      
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
    for(let i = 0; i < newOutline.outline.length; i++){
      const tempTopic = newOutline.outline[i].topic;
      newOutline.outline[i].topic = {
        "topic": tempTopic,
        "status": "incomplete"
      };
      for(let j = 0; j < newOutline.outline[i].subtopics.length; j++){
        const tempSubtopic = newOutline.outline[i].subtopics[j];
        newOutline.outline[i].subtopics[j] = {
          "subtopic": tempSubtopic,
          "status": "incomplete"
        };
      }
    }

    try{
      await client.connect();
      const database = client.db(dbName);
      const collection = database.collection(collectionName);
      
      const filter = { _id: ObjectId.createFromHexString(courseId)};
      const update = { $set: { "course_outline": newOutline, "course_content": content} };
      
      const updateResult = await collection.updateOne(
        filter,
        update      
      );
      
      console.log('Document updated');
    }
    catch(error){
      console.error('Error inserting document:', error);
      status = "Fail";
    }
    finally {
      // Close the connection
      await client.close();
    }

    // rewrite outline, rewrite course
    res.json( {"status": status} );
})

module.exports = router;