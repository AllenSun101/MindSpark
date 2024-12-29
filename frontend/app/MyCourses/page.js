"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function MyCourses() {
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [visibleCourses, setVisibleCourses] = useState(6);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    const { data: session } = useSession();

    useEffect(() => {
        const fetchCourses = async () => {
            const { data } = await axios.get("http://localhost:3001/get_courses", {
                params: {
                    email: session.user.email,
                    name: session.user.name,
                }}
            );
            setCourses(data.courses);
            setFilteredCourses(data.courses); // Initialize filtered courses
            setLoading(false);
        };
        
        if (session) {
            fetchCourses();
        }
    }, [session]);

    const handleSearch = (e) => {
        const searchValue = e.target.value.toLowerCase();
        setSearchTerm(e.target.value);
        setFilteredCourses(
            courses.filter((course) =>
                course.name.toLowerCase().includes(searchValue)
            )
        );
    };

    const handleLoadMore = () => {
        setVisibleCourses((prev) => prev + 3);
    };

    if (!session?.user) {
        return (
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <div className="mt-40 mb-40 text-center">
                    <p>Sign in to access this page!</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <div className="mt-40 mb-40 text-center">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (courses.length === 0) {
        return (
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <h1 className="text-center font-semibold text-3xl mb-6">{session.user.name}'s Courses</h1>
                <div className="mt-40 mb-20 text-center">
                    <p className="mb-4">No courses currently. Create one here!</p>
                    <Link href={"/BuildCourse"}>
                        <button className="bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] rounded-xl px-4 py-2">
                            Build Course
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-8 lg:px-16 py-12">
            <h1 className="text-center font-semibold text-3xl mb-6">{session.user.name}'s Courses</h1>
            <div className="mb-6">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search courses..."
                    className="w-full p-2 border border-gray-300 rounded-md"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.slice(0, visibleCourses).map((card) => (
                    <div
                        key={card.id}
                        className="bg-white shadow-md rounded-lg p-8 border border-gray-200 aspect-[2/2] flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between w-full">
                            <h2 className="text-lg font-semibold mb-2 text-center flex-1">{card.name}</h2>
                        </div>
                        <div className="flex flex-col justify-center items-center">
                            <Link
                                href={{ pathname: `/Course/${card.name}`, query: { course_id: card.id } }}
                            >
                                <button className="bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] rounded-xl px-4 py-2">
                                    Launch Course
                                </button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
            {visibleCourses < filteredCourses.length && (
                <div className="text-center mt-8">
                    <button
                        onClick={handleLoadMore}
                        className="bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] rounded-xl px-6 py-2"
                    >
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
}
