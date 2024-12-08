var express = require('express');
var router = express.Router();
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET follow-up questions after sending user inputs. */
router.post('/follow_ups', async function(req, res, next) {
  console.log(req.body);

  const prompt = `You are making an outline of topics for a course on ${req.body.courseName} while considering the ` +
    `following requests, if any. Learning Style: ${req.body.learningStyle}. Content Format: ${req.body.contentFormat}. ` +
    `Included Topics: ${req.body.includedTopics}. Logistics: ${req.body.courseLogistics}. Additional requests: ` +
    `${req.body.otherRequests}. What follow-up questions would you ask to generate a robust personalized course?` +
    `Only generate questions that will actually help, but generate as many as you need to.`;

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
  res.json( response["questions"] );
});

/* GET create course and topics list. */
router.get('/create_course', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
