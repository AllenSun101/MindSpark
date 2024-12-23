'use client'

import { useSearchParams } from 'next/navigation';
import { useSession } from "next-auth/react"

export default function Course(){

    const searchParams = useSearchParams()
    const courseId = searchParams.get("course_id")
    console.log(courseId);

    const { data: session } = useSession();

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
    
    return (
        <div>
            <p>Course Home Page</p>
        </div>
    )
}