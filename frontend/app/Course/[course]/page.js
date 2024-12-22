'use client'

import { useSearchParams } from 'next/navigation';

export default function Course(){

    // database fetch
    // display outline
    const searchParams = useSearchParams()
    const courseId = searchParams.get("course_id")
    console.log(courseId);
    
    return (
        <div>
            <p>Course Home Page</p>
        </div>
    )
}