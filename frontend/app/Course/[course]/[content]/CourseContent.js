'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import Markdown from "react-markdown";
import React from "react";

import "katex/dist/katex.min.css";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

export default function CourseContent({data, courseId, topicIndex, subtopicIndex}){

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [selectedSubtopic, setSelectedSubtopic] = useState(Number(subtopicIndex));
    // const [topicStatus, setTopicStatus] = useState(data.topic_status.status);
    const [subtopicStatus, setSubtopicStatus] = useState(data.subtopic_status);
    const [editing, setEditing] = useState(false);

    const topic = data.topic_data.topic_name;

    const subtopics = data.subtopics;

    const updateCompletionStatus = () => {
        axios.patch("http://localhost:3001/update_completion_status", {
            courseId: courseId,
            topicIndex: topicIndex,
            subtopicIndex: selectedSubtopic,
            updatedStatus: subtopicStatus[selectedSubtopic].status === 'complete' ? "incomplete" : "complete"
        })
        .then(response => {
            console.log(response.data);
            //setTopicStatus(response.data.topic_status.status);
            setSubtopicStatus(response.data.subtopic_status);
        })
        .catch(error => {
            console.log(error);
        })
    }

    function SideBar(){
        return(
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
                    <div className={`px-1 py-2 ${selectedSubtopic == -1 ? "text-blue-400" : ""}`}>
                        <Link href={{query: { course_id: courseId, topic: topicIndex, subtopic: -1 } }}>
                            <button onClick={() => {setSelectedSubtopic(-1)}} className="text-left">Topic Overview</button>
                        </Link>
                    </div>
                    {subtopics.map((_, id) => (
                        <div key={id} className={`px-1 py-2 ${id == selectedSubtopic ? "text-blue-400" : ""}`}>
                            <Link href={{query: { course_id: courseId, topic: topicIndex, subtopic: id } }}>
                                <button onClick={() => {setSelectedSubtopic(id)}} className="text-left">{subtopics[id].subtopic_name}</button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    function CollapsedSideBar(){
        return(
            <div style={{ width: "5%" }} className="p-6">
                <button onClick={() => {setSidebarOpen(true)}}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-6 h-6">
                        <path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/>
                    </svg>
                </button>
            </div>
        );
    }

    function MainContent(){
        return(
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
                    {selectedSubtopic == -1 && (
                        <div>
                            <div className="flex items-center space-x-4 mb-6">
                                <h1 className="text-2xl font-semibold">Topic Overview</h1>
                            </div>
                            <p className="min-h-[20vh]">{data.topic_data.topic_content}</p>
                        </div>
                    )}
                    {selectedSubtopic != -1 && (
                        <div>
                            <div className="flex items-center space-x-4 mb-3">
                                <h1 className="text-2xl font-semibold">{subtopics[selectedSubtopic].subtopic_name}</h1>
                                {subtopicStatus[selectedSubtopic].status === 'complete' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="green" className="w-6 h-6">
                                        <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z"/>
                                    </svg>
                                )}
                            </div>
                            {editing ? <PageEditor/> : <ContentDisplay/>}
                        </div>
                    )}
                </div>
                <div className="mt-16 flex justify-between">
                    <Link href={{query: { course_id: courseId, topic: topicIndex, subtopic: selectedSubtopic - 1 } }}>
                        <button onClick={() => {setSelectedSubtopic(selectedSubtopic - 1)}} disabled={subtopicIndex == -1} className="flex items-center space-x-1">
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
        );
    }

    function PageEditor(){

        const [editedContent, setEditedContent] = useState(subtopics[selectedSubtopic].subtopic_content);

        useEffect(() => {
            console.log('prompt user to save or cancel page edits if in editing mode')
        }, [selectedSubtopic]);

        return(
            <div>
                <div className="flex items-center space-x-4 mb-8">
                    <button className="bg-red-500 px-4 py-2 rounded-xl w-36" onClick={() => {setEditing(false)}}>
                        Cancel
                    </button>
                    <button className="bg-green-500 px-4 py-2 rounded-xl w-36">
                        Save Changes
                    </button>
                </div>
                Editing
            </div>
        );
    }

    function ContentDisplay(){
        return(
            <div>
                <div className="flex items-center space-x-4 mb-8">
                    <button className="bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] px-4 py-2 rounded-xl" onClick={updateCompletionStatus}>
                        {subtopicStatus[selectedSubtopic].status === 'complete' ? "Mark Incomplete" : "Mark Complete"}
                    </button>
                    <button className="bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] px-4 py-2 rounded-xl flex items-center space-x-2" onClick={() => {setEditing(true)}}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" className="w-6 h-6">
                            <path d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"/>
                        </svg>
                        <span>Edit Content</span>
                    </button>
                </div>
                <div className="min-h-[20vh] mx-8">
                    <Markdown className="space-y-4" remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeHighlight]} components={{
                        h3: ({ children }) => <h3 className="font-semibold">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc pl-6 space-y-4">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-6 space-y-4">{children}</ol>,
                        li: ({ children }) => <li className="space-y-4">{children}</li>,
                        pre: ({ children }) => <pre className="bg-gray-300 p-8 mx-16 rounded-xl overflow-x-auto">{React.Children.map(children, (child) => React.cloneElement(child, { isInsidePre: true }))}</pre>,
                        code: ({ children, isInsidePre }) => (<code className={`${isInsidePre ? "" : "bg-gray-300 p-1 rounded-lg inline-block"}`}>{children}</code>),
                    }}>
                        {subtopics[selectedSubtopic].subtopic_content}
                    </Markdown>
                </div>
            </div>
        );
    }

    return(
        <div className="flex flex-row">
            {sidebarOpen ? <SideBar/> : <CollapsedSideBar/>}
            <div className="w-1 bg-gray-500"/>
            <MainContent/>
        </div>
    );
}