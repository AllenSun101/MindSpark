'use client'

import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useState } from 'react';

export default function Course(){

    const searchParams = useSearchParams()
    const courseId = searchParams.get("course_id")
    console.log(courseId);

    const { data: session } = useSession();

    const [courseData, setCourseData] = useState();

    // database fetch
    // display outline

    if(!session?.user){
        return(
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <div className="mt-40 mb-40 text-center">
                    <p>Sign in to access this page!</p>
                </div>
            </div>
        )
    }

    const fetchOutline = async () => {
        const { data } = await axios.get("http://localhost:3001/get_outline", {
            params: {
                courseId: courseId
            }
        })
        console.log(data)
        if(!courseData){
            setCourseData(data);
        }
    }

    if(!courseData){
        fetchOutline();
    }
    
    return (
        <div>
            <p>Course Home Page</p>
            {courseData && (
                <h1>{courseData.course_outline[0].topic}</h1>
            )}
        </div>
    )
}