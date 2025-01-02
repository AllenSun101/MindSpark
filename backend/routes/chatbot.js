var express = require('express');
const OpenAI = require('openai');
const path = require('path');
var router = express.Router();
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

/* POST chatbot response. */
router.post('/', async function(req, res, next) {
  console.log(req.body);
  const userPrompt = req.body.prompt;
  const pageContent = req.body.pageContent;
  const chatHistory = req.body.chatHistory;

  var chatbotPrompt = `Create a response to the user prompt. Be extremely concise. `;

  if(pageContent != ""){
    chatbotPrompt += `For context, here is the page content: ${pageContent} `;
  }
  
  chatbotPrompt += `Here is the previous chat history: ${chatHistory}. Here is the user prompt: ${userPrompt}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
        { role: "system", content: "You are a MindSpark AI, a chatbot helping users understand course content." },
        {
            role: "user",
            content: chatbotPrompt,
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
            "response": {
              "type": "string",
              "description": "Response to the user prompt",
            }
          },
          "additionalProperties": false,
        }
      }
    }
  });

  const response = JSON.parse(completion.choices[0].message.content);

  res.json( {response: response.response} )

});

module.exports = router;
