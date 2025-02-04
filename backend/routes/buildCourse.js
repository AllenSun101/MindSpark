var express = require('express');
var router = express.Router();
const OpenAI = require('openai');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const RTFParser = require('rtf-parser');

const upload = multer({ storage: multer.memoryStorage() });

const { ObjectId } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
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

async function ExtractDocumentInsights(file, courseName){
  // parse file text and extract useful info + list of topics
  const fileType = file.mimetype;
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
    `useful information about the course. Be concise. The course name is ${courseName} Here is the document: ${extractedText}`;
  
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
  return documentInformation;
}

/* POST follow-up questions after sending user inputs. */
router.post('/follow_ups', upload.single('file'), async function(req, res, next) {

  var documentInformation = undefined;
  if(req.file){
    documentInformation = await ExtractDocumentInsights(req.file, req.body.courseName);
  }

  var emptyFields = [];
  var fields = {
    "Audience": req.body.audience,
    "Learning Style": req.body.learningStyle,
    "Content Format": req.body.contentFormat,
    "Document Information": documentInformation,
    "Included Topics": req.body.includedTopics,
    "Limited Topics": req.body.limitedTopics,
    "Logistics": req.body.courseLogistics,
    "Other Requests": req.body.otherRequests,
  }

  // if use Profile is true, add profile information to fields
  if(req.body.useProfile === 'true'){
    // fetch profile from MongoDB
    try{  
      const userCollection = req.db.collection("Users");
      
      const userRecord = await userCollection.findOne({ email: req.body.email });
      if(userRecord){
        console.log(userRecord.profile);

        const mappings = {
          "background": "Background",
          "learning_preferences": "Learning Preferences",
        };

        for(const key in userRecord.profile){
          fields[mappings[key]] = userRecord.profile[key];
        }
      }
      
      console.log("Fetched document");
    }
    catch(error){
      console.error('Error fetching document:', error);
    }
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

  const features = JSON.parse(req.body.features);
  const featureExtensions = JSON.parse(req.body.featureExtensions);

  const featurePrompts = {
    "Guided Examples": "Include guided examples to reinforce concepts.",
    "Practice Problems": "Include practice problem assignments to assess understanding.",
    "Flash Cards": "Include flash cards to reinforce learning.",
    "Learning Games": "Include learning games to reinforce learning.",
    "Simulations": "Include simulations to reinforce learning.",
    "Videos": "Include videos to reinforce learning.",
    "External Links": "Include external links to provide additional resources.",
    "Narrated Slides": "Include narrated slides on each page to present content.",
    "Images and Diagrams": "Include images and diagrams to help explain content.",
  }

  function extensionPrompts(feature){
    console.log(feature);
    if(feature == "Narrated Slides" || feature == "Images and Diagrams"){
      return "";
    }
    var extensionPrompt = `The user wants a frequency of ${featureExtensions[feature][`How often should ${feature.toLowerCase()} be given?`]["value"]}. `;
    if(featureExtensions[feature]["Additional Comments (Length, Difficulty, Format, etc.)"]["value"] != ""){
      extensionPrompt += `Also consider the following: ${featureExtensions[feature]["Additional Comments (Length, Difficulty, Format, etc.)"]["value"]}. `;
    }
    return extensionPrompt;
  }

  const internalExtensions = {}; // added within existing pages
  const externalExtensions = {}; // added on to new pages
  const internalFrequencies = ["No Preference", "Each Page"];
  const externalFrequencies = ["No Preference", "End of Unit", "Between Pages"];

  for(const feature in features){
    if(features[feature] === true){
      // slides and images/diagrams are always internal
      if(feature == "Narrated Slides" || feature == "Images and Diagrams"){
        internalExtensions[feature] = `${featurePrompts[feature]} ${extensionPrompts(feature)}`;
      }
      else{
        // Each page is internal, between pages and end of unit is external, no preference is both
        if(internalFrequencies.includes(featureExtensions[feature][`How often should ${feature.toLowerCase()} be given?`]["value"])){
          internalExtensions[feature] = `${featurePrompts[feature]} ${extensionPrompts(feature)}`;
        }
        if(externalFrequencies.includes(featureExtensions[feature][`How often should ${feature.toLowerCase()} be given?`]["value"])){
          externalExtensions[feature] = `${featurePrompts[feature]} ${extensionPrompts(feature)}`;
        }
      }
    }
  }

  console.log(internalExtensions);
  console.log(externalExtensions);
    
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
  res.json( {prompt: promptFields, response: response["questions"], internalExtensions: internalExtensions, externalExtensions: externalExtensions} );
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

async function ExtensionsOutline(outline, internalExtensions, externalExtensions, basicPrompt){
  var extensionsOutline = outline.outline;
  // All pages up to this point are content pages
  for (let i = 0; i < extensionsOutline.length; i++) {
    for (let j = 0; j < extensionsOutline[i].subtopics.length; j++) {
      extensionsOutline[i].subtopics[j].subtopic_type = "Content";
    }
  }

  console.log(extensionsOutline[0]);

  outline.outline = extensionsOutline;

  // add external extensions (not in content pages)
  var externalTypes = Object.keys(externalExtensions);
  externalTypes.push("Content");

  var externalPrompt = "You are adding extensions to a course outline to reinforce content. The content outline consists of topics (units) and subtopics (pages) and is " + 
  `provided here: ${JSON.stringify(outline)}. The extensions and specifications for each one are provided: ${JSON.stringify(externalExtensions)}. Your job is to add subtopics to topics in the outline considering ` + 
  `the extension specifications and overall course specifications. Course specifications are provided here: ${basicPrompt}. For each new subtopic, you will include ` + 
  `the type of extension and a description of what to include and what subtopics are reinforced. Strictly follow user specifications for each extension frequency.` + 
  `Do not change what is already in the outline- you are just adding to it.`;

  console.log(externalPrompt);

  const externalCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
        { role: "system", content: "You are adding extensions to a course outline while considering effective placement." },
        {
            role: "user",
            content: externalPrompt,
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
                                  "suptopic_type": {
                                    "type": "string",
                                    "enum": externalTypes,
                                  }
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

  outline = JSON.parse(externalCompletion.choices[0].message.content);
  
  // add internal (integrated into content pages)
  var internalPrompt = "You are adding extensions to a course outline to reinforce content. The content outline consists of topics (units) and subtopics (pages) and is " + 
  `provided here: ${outline}. The extensions and specifications for each one are provided: ${internalExtensions}. Your job is to integrate extensions into subtopics in the outline considering ` + 
  `the extension specifications and overall course specifications. Course specifications are provided here: ${basicPrompt}. For each new subtopic, you will include ` + 
  `the type of extension and a description of what to include and what subtopics are reinforced. Strictly follow user specifications for each extension frequency.` + 
  `Do not add any more pages- only modify what is already present.`;

  // API prompt to modify pages by nesting types

  // Modify content prompts to only cover content, no examples
  return outline;
}

/* POST create course and topics list. */
router.post('/create_course', async function(req, res, next) {
  console.log(req.body);

  const email = req.body.email;
  const name = req.body.name;
  const courseName = req.body.courseName;
  const internalExtensions = req.body.internalExtensions;
  const externalExtensions = req.body.externalExtensions;

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

  // Test to see if works
  outline = await ExtensionsOutline(outline, internalExtensions, externalExtensions, basicPrompt);
  console.log(outline);
  
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

    const collection = req.db.collection("Courses");
    const result = await collection.insertOne(newDocument);

    insertedId = result.insertedId;

    // insert a course reference into user document
    const userCollection = req.db.collection("Users");
    
    const userRecord = await userCollection.findOne({ email: email });
    if(!userRecord){
      status = await CreateUserDocument(req.db, email, name);
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
    
    try{
      const collection = req.db.collection("Courses");

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

    res.json( {"status": status} );
})

router.post('/regenerate_course', async function(req, res, next) {
    console.log(req.body);
    const newRequest = req.body.newRequest;
    const email = req.body.email;
    const courseId = req.body.courseId;
    const courseName = req.body.courseName;

    console.log(newRequest);

    // fetch current prompt and outline
    var prompt = "";
    var outline = "";

    var status = "Success";
    try{
      const collection = req.db.collection("Courses");
      
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
      const collection = req.db.collection("Courses");
      
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

    // rewrite outline, rewrite course
    res.json( {"status": status} );
})

module.exports = router;