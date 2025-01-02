'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/solid';
import axios from 'axios';

export default function Chatbot({ data, topicIndex, subtopicIndex }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [userPrompt, setUserPrompt] = useState("");

  var pageContent = "";
  console.log(data);
  if(subtopicIndex == -1 && data?.topic_data?.topic_content){
    pageContent = data.topic_data.topic_content;
  }
  else if(data?.subtopics[subtopicIndex]?.subtopic_content){
    pageContent = data.subtopics[subtopicIndex].subtopic_content;
  }

  // Reference to the chat container to handle outside click
  const chatRef = useRef(null);
  const chatIconRef = useRef(null);

  function GetResponse(event){
    if(userPrompt != ""){
      axios.post("http://localhost:3001/chatbot/", {
        pageContent: pageContent,
        chatHistory: chatHistory,
        prompt: userPrompt,
      })
      .then(response => {
        setChatHistory((prevItems) => [
          ...prevItems, 
          { "sender": "user", "message": userPrompt },
          { "sender": "bot", "message": response.data.response }
        ]);
        setUserPrompt("");
      })
      .catch(error => {
        console.log(error);
      })
    }
  }

  // Toggle chat open/close
  const toggleChat = () => setIsOpen(!isOpen);

  // Handle outside click to close the chat
  const handleOutsideClick = (event) => {
    if (
      chatRef.current && !chatRef.current.contains(event.target) &&
      chatIconRef.current && !chatIconRef.current.contains(event.target)
    ) {
      setIsOpen(false); // Close chat if clicked outside
    }
  };

  // Add event listener for outside click when chat is open
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }

    // Cleanup listener on component unmount or chat close
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div>
      {/* Chat Icon Button */}
      <div
        onClick={toggleChat}
        className="fixed bottom-4 right-4 bg-white shadow-lg p-4 rounded-full cursor-pointer flex items-center justify-center hover:bg-gray-100"
        ref={chatIconRef} // Attach ref to the chat icon
      >
        <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-gray-700" />
      </div>

      {/* Chatbot Panel */}
      {isOpen && (
        <div
          ref={chatRef} // Attach ref to the chat panel
          className="fixed bottom-16 right-4 bg-white shadow-lg p-6 rounded-lg w-96 max-w-full"
        >
          <h3 className="text-lg font-semibold mb-2">MindSpark AI</h3>
          <p className='text-gray-600 text-sm'>Ask me any questions you have about the content!</p>
          <hr className='mt-1 mb-2'/>
          <div className="h-96 overflow-y-auto">
            {chatHistory.map((msg, index) => (
              <div
                key={index} // Use index as key, ensure uniqueness
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`${
                    msg.sender === 'user'
                      ? 'bg-gray-200 text-black'
                      : 'bg-white'
                  } p-2 rounded-lg max-w-xs text-gray-600 text-sm mb-1`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          {/* Input Field */}
          <div className="mt-4 flex items-center space-x-2">
            <textarea
              rows="2"
              className="flex-1 border rounded-lg p-2"
              placeholder="Type your message..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && GetResponse()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
