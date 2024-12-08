'use client'

import axios from "axios";
import { useState } from "react";

export default function CreateCourse(){
    const [status, setStatus] = useState("Initial");
    const [followUpQs, setFollowUpQs] = useState([]);

    // displays fields- just text option for now
    function HandleInitialQuestions(event){
        event.preventDefault();

        axios.post("http://localhost:3001/follow_ups", {
            courseName: event.target.courseName.value,
            learningStyle: event.target.learningStyle.value,
            contentFormat: event.target.contentFormat.value,
            includedTopics: event.target.includedTopics.value,
            courseLogistics: event.target.courseLogistics.value,
            otherRequests: event.target.otherRequests.value,
        })
        .then(response => {
            console.log(response.data);
            setFollowUpQs(response.data);
        })
        .catch(error => {
            console.log(error);
        })

        setStatus("Follow-Up");
    }

    function InitialQuestions(){
        return (
            <div>
                <h2>Fill out the fields below. Be as specific as possible for better results.</h2>
                <form onSubmit={HandleInitialQuestions}>
                    <label>Course Name</label>
                    <input type="text" className="border border-gray-900" name="courseName" required></input>
                    <label>Learning Style</label>
                    <textarea className="border border-gray-900" name="learningStyle"></textarea>
                    <label>Content Format</label>
                    <textarea className="border border-gray-900" name="contentFormat"></textarea>
                    <label>Topics to Include</label>
                    <textarea className="border border-gray-900" name="includedTopics"></textarea>
                    <label>Length, Depth, and Difficulty</label>
                    <textarea className="border border-gray-900" name="courseLogistics"></textarea>
                    <label>Other Requests</label>
                    <textarea className="border border-gray-900" name="otherRequests"></textarea>
                    <button type="submit" className="bg-gray-900 text-white">Next</button>
                </form>
            </div>
        )
    }

    function HandleFollowUpQuestions(event){
        // axios
        // course created, with button to access
    }

    function FollowUpQuestions(){
        // form to answer follow up questions
        return(
            <div>
                <form onSubmit={HandleFollowUpQuestions}>
                    {followUpQs.map((question, index) => {
                        return(
                            <div key={index}>
                                <label>{question}</label>
                                <textarea className="border border-gray-900" name={index}></textarea>
                            </div>
                        )
                    })}
                    <button type="submit">Create Course</button>
                </form>
            </div>
        )
    }

    function FinishCreating(){
        return(
            <div>

            </div>
        )
    }

    return (
        <div>
            <h1>Create a Course</h1>
            {status == "Initial" ? <InitialQuestions /> : status == "Follow-Up" ? <FollowUpQuestions /> : <FinishCreating />}
        </div>
    )
}