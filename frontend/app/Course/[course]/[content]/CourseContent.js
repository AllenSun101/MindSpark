'use client'

import { useState } from "react";
import Link from "next/link";

export default function CourseContent({data, courseId, topicIndex, subtopicIndex}){

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedSubtopic, setSelectedSubtopic] = useState(Number(subtopicIndex));

    const topic = data.topic_data.topic_name;

    const subtopics = data.subtopics;

    return(
        <div className="flex flex-row">
            {sidebarOpen && (
                <div style={{ width: "20%" }} className="p-6">
                    <div className="flex justify-between items-center space-x-2">
                        <span className="text-xl truncate">{topic}</span>
                        <button onClick={() => {setSidebarOpen(false)}}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-6 h-6">
                                <path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/>
                            </svg>
                        </button>
                    </div>
                    <hr className="my-2 border-gray-600"/>
                    <div className="px-2">
                        {subtopics.map((_, id) => (
                            <div key={id} className={`px-1 py-2 ${id == selectedSubtopic ? "text-blue-400" : ""}`}>
                                <Link href={{query: { course_id: courseId, topic: topicIndex, subtopic: id } }}>
                                    <button onClick={() => {setSelectedSubtopic(id)}} className="text-left">{subtopics[id].subtopic_name}</button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {!sidebarOpen && (
                <div style={{ width: "5%" }} className="p-6">
                    <button onClick={() => {setSidebarOpen(true)}}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-6 h-6">
                            <path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/>
                        </svg>
                    </button>
                </div>
            )}
            <div className="w-1 bg-gray-500"></div>
            <div className="px-16 py-6" style={{ width: sidebarOpen ? "80%" : "95%" }}>
                <Link href={{ pathname: `./`, query: { course_id: courseId } }}>
                    <button className="mb-8 flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-4 h-4">
                            <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/>
                        </svg>
                        <span>Back to Course</span>
                    </button>
                </Link>
                <div>
                    <div className="flex items-center space-x-4 mb-6">
                        <h1 className="text-2xl font-semibold">{subtopics[selectedSubtopic].subtopic_name}</h1>
                        {subtopics[selectedSubtopic].status === 'complete' && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="green" className="w-6 h-6">
                                <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"/>
                            </svg>
                        )}
                    </div>
                    <p className="min-h-[20vh]">{subtopics[selectedSubtopic].subtopic_content}</p>
                </div>
                <div className="mt-16 flex justify-between">
                    <Link href={{query: { course_id: courseId, topic: topicIndex, subtopic: selectedSubtopic - 1 } }}>
                        <button onClick={() => {setSelectedSubtopic(selectedSubtopic - 1)}} disabled={subtopicIndex == 0} className="flex items-center space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor" className="w-4 h-4">
                                <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                            </svg>
                            <span>Previous</span>
                        </button>
                    </Link>
                    <Link href={{query: { course_id: courseId, topic: topicIndex, subtopic: selectedSubtopic + 1 } }}>
                        <button onClick={() => {setSelectedSubtopic(selectedSubtopic + 1)}} disabled={subtopicIndex == subtopics.length - 1} className="flex items-center space-x-1">
                            <span>Next</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor" className="w-4 h-4">
                                <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/>
                            </svg>
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}