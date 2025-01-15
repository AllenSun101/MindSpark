'use client'

import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useState, useEffect } from 'react';
import CourseHomePage from './CourseHomePage';

export default function Course(){

    const searchParams = useSearchParams()
    const courseId = searchParams.get("course_id")

    const { data: session } = useSession();

    const [courseData, setCourseData] = useState();

    useEffect(() => {
        const fetchOutline = async () => {
            const { data } = await axios.get("http://localhost:3001/get_outline", {
                params: {
                    courseId: courseId
                }
            })
            setCourseData(data);
        };
        
        if (session) {
            fetchOutline();
        }
    }, [session]);
    
    if(!session?.user){
        return(
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <div className="mt-40 mb-64 text-center">
                    <p>Sign in to access this page!</p>
                </div>
            </div>
        )
    }
    if(!courseData){
        return(
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <div className="mt-40 mb-64 text-center">
                    <p>Loading...</p>
                </div>
            </div>
        )
    }
    
    return (
        <div>
            <CourseHomePage data={courseData} courseId={courseId} session={session}/>
        </div>
    )
}