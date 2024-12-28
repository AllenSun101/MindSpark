import axios from "axios";
import { auth } from "../auth"
import Link from "next/link";

export default async function MyCourses(){

    const session = await auth()

    if(!session?.user){
        return(
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <div className="mt-40 mb-40 text-center">
                    <p>Sign in to access this page!</p>
                </div>
            </div>
        )
    }

    // fetch user courses from database
    const { data } = await axios.get("http://localhost:3001/get_courses", {
        params: {
            email: session.user.email,
            name: session.user.name,
        }
    })

    console.log(data);

    var user = session.user.name;

    if(data.courses.length == 0){
        return(
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <h1 className="text-center font-semibold text-3xl mb-6">{user}'s Courses</h1>
                <div className="mt-40 mb-20 text-center">
                    <p className="mb-4">No courses currently. Create one here!</p>
                    <Link href={"/BuildCourse"}>
                        <button className="bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] rounded-xl px-4 py-2">
                            Build Course
                        </button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-8 lg:px-16 py-12">
            <h1 className="text-center font-semibold text-3xl mb-6">{user}'s Courses</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.courses.map((card) => (
                <div
                key={card.id}
                className="bg-white shadow-md rounded-lg p-8 border border-gray-200 aspect-[2/2] flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between w-full">
                        <h2 className="text-lg font-semibold mb-2 text-center flex-1">{card.name}</h2>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" className="w-2 h-5 ml-auto">
                            <path d="M64 360a56 56 0 1 0 0 112 56 56 0 1 0 0-112zm0-160a56 56 0 1 0 0 112 56 56 0 1 0 0-112zM120 96A56 56 0 1 0 8 96a56 56 0 1 0 112 0z"/>
                        </svg>
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <Link href={{ pathname: `/Course/${card.name}`, query: { course_id: card.id } }}>
                            <button className="bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] rounded-xl px-4 py-2">
                                Launch Course
                            </button>
                        </Link>
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
}