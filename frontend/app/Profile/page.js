'use client'

import axios from "axios"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react";

export default function Profile(){
    // fetch profile info, create document it not exist
    const { data: session } = useSession();

    useEffect(() => {
        const fetchProfile = async () => {
                const { data } = await axios.get("http://localhost:3001/get_profile", {
                    params: {
                        email: session.user.email,
                        name: session.user.name,
                    }
                })
            console.log(data);
        }

        if(session){
            fetchProfile();
        }
    }, [session]);

    if(!session?.user){
        return(
            <div>
                <p>Sign In First!</p>
            </div>
        )
    }

    return(
        <div>
            <p>Profile</p>
        </div>
    )
}