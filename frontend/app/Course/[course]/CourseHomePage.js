'use client'

import { useState } from "react";
import Link from "next/link";

export default function CourseHomePage({data, courseId}){

    const [contentOpen, setContentOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState("content");
    const [selectedTopic, setSelectedTopic] = useState(0);

    const courseName = data.course_name
    const courseDescription = "No Description";

    //0 = incomplete, 1 = in progress, 2 = complete
    const topics = data.course_outline;

    const grades = {
        1: { assignment: 'Rizz practical', weight: 10, grade: 89 },
        2: { assignment: 'Rizz final exam', weight: 30, grade: 76 },
        3: { assignment: 'Gyatt anticipation guide', weight: 30, grade: 100},
        4: { assignment: 'Final exam', weight: 30, grade: -1 }
    }

    function DisplayTopic(){
        return(
            <div>
                <h1 className="text-2xl font-semibold mb-4">{topics[selectedTopic].topic}</h1>
                {topics[selectedTopic].subtopics.map((_, id) => (
                    <div key={id} className="flex items-center space-x-2 p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill={`${topics[selectedTopic].subtopics[id].status === "complete" ? "green" : "gray"}`} className="w-3 h-3">
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z"/>
                        </svg>
                        <Link href={{ pathname: `/Course/${courseName}/${topics[selectedTopic].topic}`, query: { course_id: courseId, topic: selectedTopic, subtopic: id } }}>{topics[selectedTopic].subtopics[id]}</Link>
                    </div>
                ))}
            </div>
        );
    }

    function DisplayGrades(){
        return(
            <div>
                <h1 className="text-2xl font-semibold mb-4">Grades</h1>
                <div className="flex w-full my-2">
                    <div className="col-span-4 font-semibold" style={{ width: "70%" }}>Assignment</div>
                    <div className="col-span-1 text-center font-semibold" style={{ width: "15%" }}>Weight</div>
                    <div className="col-span-1 text-center font-semibold" style={{ width: "15%" }}>Grade</div>
                </div>
                <hr/>
                {Object.keys(grades).map((id) => (
                    <div key={id} className="flex w-full my-2">
                        <div className="col-span-4" style={{ width: "70%" }}>{grades[id].assignment}</div>
                        <div className="col-span-1 text-center" style={{ width: "15%" }}>{grades[id].weight}</div>
                        <div className="col-span-1 text-center" style={{ width: "15%" }}>{grades[id].grade === -1 ? "---" : grades[id].grade}</div>
                    </div>
                ))}
            </div>
        );
    }
    
    return(
        <div className="flex flex-row space-x-20 px-24 py-16">
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
                            {topics.map((_, id) => (
                                <button 
                                key={id}
                                className={`${selectedTopic == id ? "border-blue-500" : "border-transparent"} border px-2 py-1 w-full justify-start flex items-center space-x-2`}
                                onClick={() => {setSelectedTopic(id); setSelectedOption("content")}}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill={`${topics[id].status === 0 ? "gray" : topics[id].status === 1 ? "yellow" : "green"}`} className="w-3 h-3">
                                        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z"/>
                                    </svg>
                                    <span>Topic {id + 1}: {topics[id].topic}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <button onClick={() => {setSelectedOption("grades"); setSelectedTopic()}} className="text-lg">Grades</button>
                </div>
            </div>
            <div className="w-1 bg-gray-500"></div>
            <div style={{ width: "50%" }}>
                {selectedOption === "content" ? <DisplayTopic/> : <DisplayGrades/>}
            </div>
        </div>
    );
}