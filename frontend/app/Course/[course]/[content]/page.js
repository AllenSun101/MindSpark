'use client'

import { useSession } from "next-auth/react";
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import CourseContent from "./CourseContent";
import Chatbot from "./Chatbot";

export default function Content(){

    const searchParams = useSearchParams()
    const courseId = searchParams.get("course_id")
    const topicIndex = searchParams.get("topic")
    const subtopicIndex = searchParams.get("subtopic")

    const { data: session } = useSession();

    const [topicContent, setTopicContent] = useState();


    if(!session?.user){
        return(
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <div className="mt-40 mb-40 text-center">
                    <p>Sign in to access this page!</p>
                </div>
            </div>
        )
    }

    const fetchContent = async () => {
        const { data } = await axios.get("http://localhost:3001/get_content", {
            params: {
                courseId: courseId,
                topicIndex: topicIndex
            }
        })
        if(!topicContent){
            setTopicContent(data);
        }
    }

    if(!topicContent){
        fetchContent();
    }
    
    return (
        <div>
            <Chatbot data={topicContent} topicIndex={topicIndex} subtopicIndex={subtopicIndex}/>
            {topicContent && (
                <CourseContent data={topicContent} courseId={courseId} topicIndex={topicIndex} subtopicIndex={subtopicIndex}/>
            )}        
        </div>
    )
}