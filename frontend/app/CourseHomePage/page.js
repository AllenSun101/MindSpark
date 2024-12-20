'use client'

import { useState } from "react";

export default function CourseHomePage(){

    const [contentOpen, setContentOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState("content");
    const [selectedTopic, setSelectedTopic] = useState(1);

    const courseName = "Introduction to Basic Brain Rot Terms";
    const courseDescription = "This is a beginner-friendly, yet in depth course, going into detail over various brain rot terms and their origins";

    //0 = incomplete, 1 = in progress, 2 = complete
    const topics = {
        1: { title: 'Rizz', subtopics: [], status: 2 },
        2: { title: 'Gyatt', subtopics: [], status: 2 },
        3: { title: 'Skibidi', subtopics: [], status: 1 },
        4: { title: 'Sigma', subtopics: [], status: 0 }
    }

    function DisplayTopic(){
        return(
            <div>
                {topics[selectedTopic].title}
            </div>
        );
    }

    function DisplayGrades(){
        return(
            <div>
                Grades
            </div>
        );
    }
    
    return(
        <div className="flex flex-row space-x-10 px-24 py-16">
            <div style={{ width: "30%" }}>
                <h1 className="text-2xl font-bold mb-4">{courseName}</h1>
                <h2>{courseDescription}</h2>
                <div className="mt-8 flex flex-col items-start space-y-2">
                    <button className="text-lg flex items-center space-x-1" onClick={() => {setContentOpen(!contentOpen)}}>
                        <span>Course Content</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor" className="w-6 h-6">
                            <path d={`${contentOpen ? "M182.6 137.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8l256 0c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-128-128z" : "M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"}`}/>
                        </svg>
                    </button>
                    {contentOpen && (
                        <div className="flex flex-col items-start ml-6">
                            {Object.keys(topics).map((id) => (
                                <button 
                                key={id}
                                className={`${selectedTopic == id ? "border-blue-500" : "border-transparent"} border px-2 py-1 w-full justify-start flex items-center space-x-2`}
                                onClick={() => {setSelectedTopic(id); setSelectedOption("content")}}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill={`${topics[id].status === 0 ? "gray" : topics[id].status === 1 ? "yellow" : "green"}`} className="w-3 h-3">
                                        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z"/>
                                    </svg>
                                    <span>Topic {id}: {topics[id].title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <button onClick={() => {setSelectedOption("grades"); setSelectedTopic()}} className="text-lg">Grades</button>
                </div>
            </div>
            <div>
                {selectedOption === "content" ? <DisplayTopic/> : <DisplayGrades/>}
            </div>
        </div>
    );
}