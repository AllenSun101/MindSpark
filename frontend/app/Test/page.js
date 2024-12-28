'use client'

import axios from "axios";
import { useState } from "react";

export default function BuildCourse(){
    const [file, setFile] = useState();
    const [isChecked, setIsChecked] = useState(false);
    const [formState, setFormState] = useState({
        courseName: "",
        learningStyle: "",
        contentFormat: "",
        includedTopics: "",
        courseLogistics: "",
        otherRequests: ""
    });


    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormState((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        console.log(selectedFile);
        setFile(selectedFile);
    };

    const handleToggle = (event) => {
        event.preventDefault();
        setIsChecked(prev => !prev);
    };

    function HandleInitialQuestions(event){
        event.preventDefault();

        axios.post("http://localhost:3001/follow_ups", {
            courseName: formState.courseName,
            learningStyle: formState.learningStyle,
            contentFormat: formState.contentFormat,
            includedTopics: formState.includedTopics,
            limitedTopics: isChecked,
            courseLogistics: formState.courseLogistics,
            otherRequests: formState.otherRequests,
        })
        .then(response => {
            console.log(response.data);
            setPrompt(response.data.prompt);
            setFollowUpQs(response.data.response);
            setStatus("Follow-Up");
        })
        .catch(error => {
            console.log(error);
        })
    }

        // return statement can't be in separate function and component referenced.
        return (
            <div>
                <h2 className="mb-12"> To build your personalized course, fill out the initial fields below. Not all fields are 
                    required. However, for best results, it is recommended to answer thoroughly with relevant specifications 
                    only. Once you submit, follow-up questions will appear so that we can better understand your needs!
                </h2>
                <form onSubmit={HandleInitialQuestions}>
                    <div className="flex mb-6">
                        <label className="mr-4">Course Name: </label>
                        <input type="text" className="border border-gray-900 w-full max-w-xl py-1 px-2 rounded-lg border-2" 
                            name="courseName" 
                            required
                            value={formState.courseName}
                            onChange={handleInputChange}>
                        </input>
                    </div>

                    <div className="mb-2">
                        <span className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#d7acfc] to-[#7fc3fa]">Course Style</span>
                    </div>
                    <div className="flex mb-2">
                        <label>What strategies can be used to help you effectively learn?</label>
                    </div>
                    <div className="flex mb-6">
                        <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                            name="learningStyle" 
                            rows="3"
                            value={formState.learningStyle}
                            onChange={handleInputChange}>
                        </textarea>
                    </div>

                    <div className="flex mb-2">
                        <label>How should content be formatted?</label>
                    </div>
                    <div className="flex mb-6">
                        <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                            name="contentFormat" 
                            rows="3"
                            value={formState.contentFormat}
                            onChange={handleInputChange}>
                        </textarea>
                    </div>

                    <div className="mb-4">
                        <span className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#d7acfc] to-[#7fc3fa]">Course Content</span>
                        <p className="mt-2">For course content, you can upload a document, such as a syllabus, or manually specify Topics to Include.
                            You can also select a file and use the manual Topics to Include field to specify topics to add or remove.
                            If you do not specify any topics, we will select them for you!
                        </p>
                    </div>
                    <div className="flex mb-2">
                        <label>Upload File</label>
                    </div>
                    <div className="mb-4 relative w-64 h-64 bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] rounded-lg flex items-center justify-center border-dashed border-4 border-gray-500 cursor-pointer">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer mb-6"
                            onChange={handleFileChange}
                            accept=".txt, .pdf, .docx, .rtf"
                        />
                        <div className="text-gray-500 text-6xl font-bold">+</div>
                    </div>

                    <div className="mb-6">
                        {file && (
                            <div>
                                <h2 className='font-bold'>Selected File:</h2>
                                <ul>
                                    {file.name}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex mb-2">
                        <label>Topics to Include</label>
                    </div>
                    <div className="flex mb-6">
                        <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                            name="includedTopics" 
                            rows="3"
                            value={formState.includedTopics}
                            onChange={handleInputChange}>
                        </textarea>
                    </div>
                    
                    
                    
                    <div className="flex mb-2">
                        <label>How thorough, detailed, and difficult should the content be?</label>
                    </div>
                    <div className="flex mb-6">
                        <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                            name="courseLogistics" 
                            rows="3"
                            value={formState.courseLogistics}
                            onChange={handleInputChange}>
                        </textarea>
                    </div>
                    
                    <div className="mb-2">
                        <span className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#d7acfc] to-[#7fc3fa]">Additional Logistics</span>
                    </div>
                    <div className="flex mb-2">
                        <label>Other Requests</label>
                    </div>
                    <div className="flex mb-6">
                        <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                            name="otherRequests" 
                            rows="3"
                            value={formState.otherRequests}
                            onChange={handleInputChange}>
                        </textarea>
                    </div>
                    <button type="submit" className="bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] rounded-xl px-4 py-2">Next</button>
                </form>
            </div>
        )
    
}