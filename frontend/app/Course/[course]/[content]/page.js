'use client'

import { useSession } from "next-auth/react"

export default function Content(){
    const { data: session } = useSession();


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
            
        </div>
    )
}