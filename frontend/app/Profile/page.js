'use client'

import axios from "axios"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react";

export default function Profile(){
    // fetch profile info, create document it not exist
    const { data: session } = useSession();
    const [background, setBackground] = useState("");
    const [learningPreferences, setLearningPreferences] = useState("");
    const [updateProfileConfirmation, setUpdateProfileConfirmation] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            const { data } = await axios.get("http://localhost:3001/users/get_profile", {
                params: {
                    email: session.user.email,
                    name: session.user.name,
                }
            })
            if(data?.record?.profile?.background != undefined){
                setBackground(data?.record?.profile?.background);
            }
            if(data?.record?.profile?.learning_preferences != undefined){
                setLearningPreferences(data?.record?.profile?.learning_preferences);
            }
            console.log(data);
        }

        if(session){
            fetchProfile();
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

    async function HandleLearningStyle(event){
        event.preventDefault();

        const { data } = await axios.post("http://localhost:3001/users/update_profile", {
            email: session.user.email,
            background: background,
            learningPreferences: learningPreferences,
        });

        if(data.status == "Success"){
            setUpdateProfileConfirmation("Successfully saved changes.");
        }
        else{
            setUpdateProfileConfirmation("Failed to saved changes. Please try again.");
        }
    }

    return(
        <div className="container mx-auto px-8 lg:px-16 py-12">
            <h1 className="text-center font-semibold text-3xl mb-6">{session.user.name}&apos;s Profile</h1>
            <div>
                <form onSubmit={HandleLearningStyle}>
                    <div className="mb-2">
                        <span className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#d7acfc] to-[#7fc3fa]">Learning Style</span>
                    </div>
                    <div className="flex mb-2">
                        <label>My background</label>
                    </div>
                    <div className="flex mb-6">
                        <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                            name="background" 
                            rows="3"
                            value={background}
                            onChange={(event) => setBackground(event.target.value)}>
                        </textarea>
                    </div>

                    <div className="flex mb-2">
                        <label>My Learning Preferences</label>
                    </div>
                    <div className="flex mb-6">
                        <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                            name="learningPreferences" 
                            rows="3"value={learningPreferences}
                            onChange={(event) => setLearningPreferences(event.target.value)}>
                        </textarea>
                    </div>

                    <button type="submit" className="bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] rounded-xl px-4 py-2">Save Changes</button>
                    <p className="mt-2">{updateProfileConfirmation}</p>
                </form>
            </div>
        </div>
    )
}