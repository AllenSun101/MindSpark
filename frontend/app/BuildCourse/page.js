'use client'

import axios from "axios";
import { useState } from "react";
import { useSession } from "next-auth/react"

export default function BuildCourse(){
    const [status, setStatus] = useState("Initial");
    const [followUpQs, setFollowUpQs] = useState([]);
    const [prompt, setPrompt] = useState("");
    const [courseName, setCourseName] = useState("");
    const [generateStatus, setGenerateStatus] = useState("");
    const { data: session } = useSession();

    if(!session?.user){
        return(
            <div>
                <p>Sign In First!</p>
            </div>
        )
    }

    // displays fields- just text option for now
    function HandleInitialQuestions(event){
        event.preventDefault();

        setCourseName(event.target.courseName.value);

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
            setPrompt(response.data.prompt);
            setFollowUpQs(response.data.response);
            setStatus("Follow-Up");
        })
        .catch(error => {
            console.log(error);
        })
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
        // course created, with button to access
        // backend returns prompt v1
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const answers = Object.fromEntries(formData.entries());

        const questionAnswerMap = followUpQs.reduce((acc, question, index) => {
            acc[question] = answers[index] || ''; // Use answers[index] or fallback to ''
            return acc;
          }, {});

        axios.post("http://localhost:3001/create_course", {
            previousPrompt: prompt,
            questions: questionAnswerMap,
            courseName: courseName,
            email: session.user.email,
            name: session.user.name,
        })
        .then(response => {
            setStatus("Done");
            setGenerateStatus(response.data.message);
        })
        .catch(error => {
            console.log(error);
        })
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
                <p>{generateStatus}</p>
                <p>Successfully created your course!</p>
                <button>Go to Course</button>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-8 lg:px-16 py-12">
            <h1 className="text-center font-semibold text-3xl mb-6">Build a Course</h1>
            {status == "Initial" ? <InitialQuestions /> : status == "Follow-Up" ? <FollowUpQuestions /> : <FinishCreating />}
        </div>
    )
}