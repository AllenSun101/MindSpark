'use client'

import { useState } from "react";
import Link from "next/link";
import axios from "axios";

export default function CourseHomePage({data, courseId, session}){

    const [contentOpen, setContentOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState("content");
    const [selectedTopic, setSelectedTopic] = useState(0);

    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteResult, setDeleteResult] = useState();

    const courseName = data.course_name
    const courseDescription = data.course_description;

    const topics = data.course_outline;

    const handleDeleteCourse = async () => {
        const { data } = await axios.delete("http://localhost:3001/delete_course", {
            params: {
                email: session.user.email,
                courseId: courseId
            }
        })
        console.log(data)
        setShowDeleteConfirmation(false);
        setDeleteResult(data.status);
    };

    const grades = {
        1: { assignment: 'Rizz practical', weight: 10, grade: 89 },
        2: { assignment: 'Rizz final exam', weight: 30, grade: 76 },
        3: { assignment: 'Gyatt anticipation guide', weight: 30, grade: 100},
        4: { assignment: 'Final exam', weight: 30, grade: -1 }
    }

    function DisplayTopic(){
        return(
            <div>
                <div className="mb-4">
                    <Link className="text-2xl font-semibold" href={{ pathname: `/Course/${courseName}/${topics[selectedTopic].topic.topic}`, query: { course_id: courseId, topic: selectedTopic, subtopic: -1 } }}>{topics[selectedTopic].topic.topic}</Link>
                </div>
                {topics[selectedTopic].subtopics.map((_, id) => (
                    <div key={id} className="flex items-center space-x-2 p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill={`${topics[selectedTopic].subtopics[id].status === "complete" ? "green" : "gray"}`} className="w-3 h-3 flex-shrink-0">
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z"/>
                        </svg>
                        <Link href={{ pathname: `/Course/${courseName}/${topics[selectedTopic].topic.topic}`, query: { course_id: courseId, topic: selectedTopic, subtopic: id } }}>{topics[selectedTopic].subtopics[id].subtopic}</Link>
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
                    <div className="font-semibold" style={{ width: "70%" }}>Assignment</div>
                    <div className="text-center font-semibold" style={{ width: "15%" }}>Weight</div>
                    <div className="text-center font-semibold" style={{ width: "15%" }}>Grade</div>
                </div>
                <hr/>
                {Object.keys(grades).map((id) => (
                    <div key={id} className="flex w-full my-2">
                        <div style={{ width: "70%" }}>{grades[id].assignment}</div>
                        <div className="text-center" style={{ width: "15%" }}>{grades[id].weight}</div>
                        <div className="text-center" style={{ width: "15%" }}>{grades[id].grade === -1 ? "---" : grades[id].grade}</div>
                    </div>
                ))}
            </div>
        );
    }

    function DisplayStats(){
        var statsMap = {};
        var totalSubtopicsComplete = 0;
        var totalSubtopics = 0;
        for(const topic of topics){
            const topicName = topic.topic.topic;
            const status = topic.topic.status;
            if(status == 'complete'){
                statsMap[topicName] = [topic.subtopics.length, topic.subtopics.length];
                totalSubtopicsComplete += topic.subtopics.length;
                totalSubtopics += topic.subtopics.length;
            }
            else if(status == 'incomplete'){
                statsMap[topicName] = [0, topic.subtopics.length];
                totalSubtopics += topic.subtopics.length;
            }
            else{
                var subtopicsComplete = 0;
                for(const subtopic of topic.subtopics){
                    if(subtopic.status == 'complete'){
                        subtopicsComplete ++;
                    }
                }
                statsMap[topicName] = [subtopicsComplete, topic.subtopics.length];
                totalSubtopicsComplete += subtopicsComplete;
                totalSubtopics += topic.subtopics.length;
            }
        }
        console.log(statsMap);
        return(
            <div>
                <h1 className="text-2xl font-semibold mb-4">Completion Statistics</h1>
                <div className="flex w-full my-2">
                    <div className="font-semibold" style={{ width: "60%" }}>Topic</div>
                    <div className="text-center font-semibold" style={{ width: "20%" }}>Completed</div>
                    <div className="text-center font-semibold" style={{ width: "20%" }}>Percentage</div>
                </div>
                <hr/>
                {Object.keys(statsMap).map((topic) => (
                    <div key={topic} className="flex w-full my-2">
                        <div style={{ width: "60%" }}>{topic}</div>
                        <div className="text-center" style={{ width: "20%" }}>{statsMap[topic][0]}/{statsMap[topic][1]}</div>
                        <div className="text-center" style={{ width: "20%" }}>{(statsMap[topic][0] / statsMap[topic][1] * 100).toFixed(2)}%</div>
                    </div>
                ))}
                <hr/>
                <div className="flex w-full my-2">
                    <div className="font-semibold" style={{ width: "60%" }}>Total</div>
                    <div className="text-center font-semibold" style={{ width: "20%" }}>{totalSubtopicsComplete}/{totalSubtopics}</div>
                    <div className="text-center font-semibold" style={{ width: "20%" }}>{(totalSubtopicsComplete / totalSubtopics * 100).toFixed(2)}%</div>
                </div>
            </div>
        );
    }

    function DisplaySettings(){
        return(
            <div>
                <h1 className="text-2xl font-semibold mb-4">Course Settings</h1>
                <button className="bg-red-500 hover:bg-red-600 p-2 rounded-lg"
                onClick={() => {setShowDeleteConfirmation(true)}}
                >
                    Delete Course
                </button>
            </div>
        );
    }

    return(
        <div>
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
                            <div className="flex flex-col items-start ml-6 space-y-1">
                                {topics.map((_, id) => (
                                    <button 
                                    key={id}
                                    className={`${selectedTopic == id ? "border-blue-500" : "border-transparent"} border px-2 py-1 w-full justify-start flex items-center space-x-2`}
                                    onClick={() => {setSelectedTopic(id); setSelectedOption("content")}}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill={`${topics[id].topic.status === "incomplete" ? "gray" : topics[id].topic.status === "in progress" ? "yellow" : "green"}`} className="w-3 h-3 flex-shrink-0">
                                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512z"/>
                                        </svg>
                                        <span className="text-left">Topic {id + 1}: {topics[id].topic.topic}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <button onClick={() => {setSelectedOption("grades"); setSelectedTopic()}} className="text-lg">Grades</button>
                        <button onClick={() => {setSelectedOption("stats"); setSelectedTopic()}} className="text-lg">Completion Statistics</button>
                        <button onClick={() => {setSelectedOption("settings"); setSelectedTopic()}} className="text-lg">Course Settings</button>
                    </div>
                </div>
                <div className="w-1 bg-gray-500"></div>
                <div style={{ width: "50%" }}>
                    {selectedOption === "content" ? <DisplayTopic/> : selectedOption === "grades" ? <DisplayGrades/> : selectedOption === "stats" ? <DisplayStats/> : <DisplaySettings/>}
                </div>
            </div>

            {showDeleteConfirmation && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg p-6 w-80">
                    <p className="text-lg mb-4 text-center">Are you sure you want to delete this course?</p>
                    <div className="flex justify-between">
                    <button
                        className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition w-24"
                        onClick={handleDeleteCourse}
                    >
                        Confirm
                    </button>
                    <button
                        className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition w-24"
                        onClick={() => {setShowDeleteConfirmation(false)}}
                    >
                        Cancel
                    </button>
                    </div>
                </div>
                </div>
            )}

            {deleteResult && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg p-6 w-80 items-center flex flex-col">
                    <p className="text-lg mb-4 text-center">{deleteResult == "Success" ? "Course successfully deleted" : "Error deleting course"}</p>
                    {deleteResult == "Success" && (
                        <Link href={"/MyCourses"}>
                            <button className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition">Return to courses</button>
                        </Link>
                    )}
                    {deleteResult == "Fail" && (
                        <button className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition"
                        onClick={() => {setDeleteResult()}}
                        >
                            Close
                        </button>
                    )}
                </div>
                </div>
            )}
        </div>
    );
}