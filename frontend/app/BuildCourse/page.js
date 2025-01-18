'use client'

import axios from "axios";
import { useState } from "react";
import { useSession } from "next-auth/react"
import Link from "next/link";

export default function BuildCourse(){
    const [file, setFile] = useState();
    const [status, setStatus] = useState("Initial");
    const [followUpQs, setFollowUpQs] = useState([]);
    const [prompt, setPrompt] = useState({});
    const [generateStatus, setGenerateStatus] = useState("");
    const { data: session } = useSession();
    const [isChecked, setIsChecked] = useState(false);
    const [courseId, setCourseId] = useState();
    const [formState, setFormState] = useState({
        courseName: "",
        audience: "",
        useProfile: false,
        learningStyle: "",
        contentFormat: "",
        includedTopics: "",
        courseLogistics: "",
        otherRequests: "", 
        features: {
            "Guided Examples": false,
            "Practice Problems": false,
            "Flash Cards": false,
            "Learning Games": false,
            "Simulations": false,
            "Videos": false,
            "External Links": false,
            "Narrated Slides": false,
            "Images and Diagrams": false,
        },
        featureDescriptions: {
            "Guided Examples": "These can be short example problems or longer walkthroughs!",
            "Practice Problems": "These can be true/false, multiple choice, free response, and multi-part! You can also get feedback with our MindSpark Grader!",
            "Learning Games": "Make learning fun with our personalized learning games!",
            "Simulations": "Add practical value to your learning with immersive MindSpark Simulations!",
            "Narrated Slides": "Accompanying narrated lecture slides!",
            "Images and Diagrams": "Integrate visual content into your course!",
        },
        featureExtensions: {
            "Guided Examples": {
                "How often should guided examples be given?": {type: "buttons", options: ["Each Page", "End of Unit", "No Preference"], value: "No Preference"},
                "Additional Comments (Length, Difficulty, Format, etc.)": {type: "text", value: ""},
            },
            "Practice Problems": {
                "How often should practice problems be given?": {type: "buttons", options: ["Each Page", "End of Unit", "No Preference"], value: "No Preference"},
                "Use MindSpark Grader?": {type: "buttons", options: ["Yes", "No"], value: "Yes"},
                "Additional Comments (Length, Difficulty, Format, etc.)": {type: "text", value: ""},
            },
            "Flash Cards": {
                "How often should flash cards be provided?": {type: "buttons", options: ["Each Page", "End of Unit", "No Preference"], value: "No Preference"},
                "Additional Comments (Length, Difficulty, Format, etc.)": {type: "text", value: ""},         
            },
            "Learning Games": {
                "How often should practice problems be given?": {type: "buttons", options: ["Between Pages", "End of Unit", "No Preference"], value: "No Preference"},
                "Additional Comments (Length, Difficulty, Format, etc.)": {type: "text", value: ""},
            },
            "Simulations": {
                "How often should simulations be given?": {type: "buttons", options: ["Between Pages", "End of Unit", "No Preference"], value: "No Preference"},
                "Additional Comments (Length, Difficulty, Format, etc.)": {type: "text", value: ""},
            },
            "Videos": {
                "How often should videos be given?": {type: "buttons", options: ["Each Page", "Between Pages", "End of Unit", "No Preference"], value: "No Preference"},
                "Additional Comments (Purpose, Content, etc.)": {type: "text", value: ""},
            },
            "External Links": {
                "How often external links be given?": {type: "buttons", options: ["Each Page", "End of Unit", "No Preference"], value: "No Preference"},
                "Additional Comments (Purpose, Content, etc.)": {type: "text", value: ""},
            },
        }
    });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormState((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleFeatureValueChange = (event) => {
        console.log(event.target);
        const { name, value } = event.target;
        setFormState((prevState) => ({
            ...prev,
            featureExtensions: {
                ...prev.features,
                [name]: !prev.features[name], // Dynamically toggle the specific feature
            },
        }));
    };

    if(!session?.user){
        return(
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <div className="mt-40 mb-64 text-center">
                    <p>Sign in to access this page!</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <h1 className="text-center font-semibold text-3xl mb-6">Build a Course</h1>
                <div className="mt-40 mb-64 text-center">
                    <p>Loading...</p>
                    <p>Course generation can take a while, depending on depth. Please be patient!</p>
                </div>
            </div>
        );
    }

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        console.log(selectedFile);
        setFile(selectedFile);
    };

    const handleToggle = () => {
        setIsChecked(prev => !prev);
    };

    const handleProfileToggle = () => {
        setFormState(prev => ({
            ...prev,
            useProfile: !prev.useProfile,
        }));    
    };

    const handleAddOnsToggle = (event) => {
        const name = event.target.name;
        setFormState(prev => ({
            ...prev,
            features: {
                ...prev.features,
                [name]: !prev.features[name], // Dynamically toggle the specific feature
            },
        }));    
    };

    function HandleInitialQuestions(event){
        event.preventDefault();
        setLoading(true);
        console.log(file);

        const formData = new FormData();

        formData.append("courseName", formState.courseName);
        formData.append("useProfile", formState.useProfile);
        formData.append("audience", formState.audience);
        formData.append("learningStyle", formState.learningStyle);
        formData.append("contentFormat", formState.contentFormat);
        formData.append("file", file);
        formData.append("includedTopics", formState.includedTopics);
        formData.append("limitedTopics", isChecked);
        formData.append("courseLogistics", formState.courseLogistics);
        formData.append("otherRequests", formState.otherRequests);
        formData.append("email", session.user.email);
        formData.append("features", formState.features);
        formData.append("featureExtensions", formState.featureExtensions)

        axios.post("http://localhost:3001/buildCourse/follow_ups", formData, {
            headers: {
                "Content-Type": "multipart/form-data", 
            },
        })
        .then(response => {
            console.log(response.data);
            setPrompt(response.data.prompt);
            setFollowUpQs(response.data.response);
            setStatus("Follow-Up");
            setLoading(false);
        })
        .catch(error => {
            console.log(error);
        })
    }

    if(status == "Initial"){
        return (
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <h1 className="text-center font-semibold text-3xl mb-6">Build a Course</h1>
                <div>
                    <h2 className="mb-12"> To build your personalized course, fill out the initial fields below. Not all fields are 
                        required. However, for best results, it is recommended to answer thoroughly with relevant specifications 
                        only. Once you submit, follow-up questions will appear so that we can better understand your needs!
                    </h2>
                    <form onSubmit={HandleInitialQuestions}>
                        <div className="flex mb-6">
                            <label className="mr-4">Course Name: </label>
                            <input type="text" className="border border-gray-900 w-full max-w-xl py-1 px-2 rounded-lg border-2" 
                                name="courseName" 
                                required
                                value={formState.courseName}
                                onChange={handleInputChange}>
                            </input>
                        </div>

                        <div className="mb-2">
                            <span className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#d7acfc] to-[#7fc3fa]">Course Style</span>
                        </div>
                        <div className="flex mb-2">
                            <label>Who is this course for, and what is the audience background?</label>
                        </div>
                        <div className="flex mb-6">
                            <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                                name="audience" 
                                rows="3"
                                value={formState.audience}
                                onChange={handleInputChange}>
                            </textarea>
                        </div>

                        <div className="mb-6 flex items-center space-x-4">
                            <span>And/or, use your Profile to generate the course?</span>
                            <div className="flex items-center space-x-4">
                                {/* No on the left */}
                                <span className={`${formState.useProfile ? 'text-gray-500' : 'text-gray-700'}`}>No</span>

                                {/* Switch */}
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        id="switch"
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={formState.useProfile}
                                        onChange={handleProfileToggle}
                                    />
                                    <div className="h-6 w-11 rounded-full border bg-slate-200 peer-checked:bg-gradient-to-r peer-checked:from-[#d7acfc] peer-checked:to-[#7fc3fa] relative">
                                        <div
                                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full border border-gray-300 bg-white transition-all ${
                                            formState.useProfile ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                        ></div>
                                    </div>
                                </label>

                                {/* Yes on the right */}
                                <span className={`${formState.useProfile  ? 'text-gray-700' : 'text-gray-500'}`}>Yes</span>
                            </div>
                        </div>

                        <div className="flex mb-2">
                            <label>What strategies can be used to help the audience effectively learn?</label>
                        </div>
                        <div className="flex mb-6">
                            <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                                name="learningStyle" 
                                rows="3"
                                value={formState.learningStyle}
                                onChange={handleInputChange}>
                            </textarea>
                        </div>

                        <div className="flex mb-2">
                            <label>How should content be formatted and organized?</label>
                        </div>
                        <div className="flex mb-6">
                            <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                                name="contentFormat" 
                                rows="3"
                                value={formState.contentFormat}
                                onChange={handleInputChange}>
                            </textarea>
                        </div>

                        <div className="mb-4">
                            <span className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#d7acfc] to-[#7fc3fa]">Course Content</span>
                            <p className="mt-2">For course content, you can upload a document, such as a syllabus, or manually specify Topics to Include.
                                You can also select a file and use the manual Topics to Include field to specify topics to add or remove.
                                If you do not specify any topics, we will select them for you!
                            </p>
                        </div>
                        <div className="flex mb-2">
                            <label>Upload File</label>
                        </div>
                        <div className="mb-4 relative w-64 h-64 bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] rounded-lg flex items-center justify-center border-dashed border-4 border-gray-500 cursor-pointer">
                            <input
                                type="file"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer mb-6"
                                onChange={handleFileChange}
                                accept=".txt, .pdf, .docx, .rtf"
                            />
                            <div className="text-gray-500 text-6xl font-bold">+</div>
                        </div>

                        <div className="mb-6">
                            {file && (
                                <div>
                                    <h2 className='font-bold'>Selected File:</h2>
                                    <ul>
                                        {file.name}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="flex mb-2">
                            <label>Topics to Include</label>
                        </div>
                        <div className="flex mb-6">
                            <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                                name="includedTopics" 
                                rows="3"
                                value={formState.includedTopics}
                                onChange={handleInputChange}>
                            </textarea>
                        </div>
                        
                        <div className="mb-6 flex items-center space-x-4">
                            <span>Limit only to specified topics (in document and/or Topics to Include field)?</span>
                            <div className="flex items-center space-x-4">
                                {/* No on the left */}
                                <span className={`${isChecked ? 'text-gray-500' : 'text-gray-700'}`}>No</span>

                                {/* Switch */}
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input
                                        id="switch"
                                        type="checkbox"
                                        className="peer sr-only"
                                        checked={isChecked}
                                        onChange={handleToggle}
                                    />
                                    <div className="h-6 w-11 rounded-full border bg-slate-200 peer-checked:bg-gradient-to-r peer-checked:from-[#d7acfc] peer-checked:to-[#7fc3fa] relative">
                                        <div
                                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full border border-gray-300 bg-white transition-all ${
                                            isChecked ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                        ></div>
                                    </div>
                                </label>

                                {/* Yes on the right */}
                                <span className={`${isChecked ? 'text-gray-700' : 'text-gray-500'}`}>Yes</span>
                            </div>
                        </div>
                        
                        <div className="flex mb-2">
                            <label>How thorough, detailed, and difficult should the content be?</label>
                        </div>
                        <div className="flex mb-6">
                            <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                                name="courseLogistics" 
                                rows="3"
                                value={formState.courseLogistics}
                                onChange={handleInputChange}>
                            </textarea>
                        </div>

                        <div className="mb-4">
                            <span className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#d7acfc] to-[#7fc3fa]">Add-Ons</span>
                            <p className="mt-2">Include the following?</p>
                        </div>

                        <div>
                        {Object.entries(formState.features).map(([key, value]) => {
                            return (
                                <div key={key}>
                                    <div className="flex mb-2">
                                        <div className="mb-2 flex items-center space-x-4">
                                            <span>{key}</span>
                                            <div className="flex items-center space-x-4">
                                                {/* No on the left */}
                                                <span
                                                    className={`${
                                                        formState.features[key] ? "text-gray-500" : "text-gray-700"
                                                    }`}
                                                >
                                                    No
                                                </span>

                                                {/* Switch */}
                                                <label className="relative inline-flex cursor-pointer items-center">
                                                    <input
                                                        id="switch"
                                                        type="checkbox"
                                                        className="peer sr-only"
                                                        checked={formState.features[key]}
                                                        name={key}
                                                        onChange={handleAddOnsToggle}
                                                    />
                                                    <div className="h-6 w-11 rounded-full border bg-slate-200 peer-checked:bg-gradient-to-r peer-checked:from-[#d7acfc] peer-checked:to-[#7fc3fa] relative">
                                                        <div
                                                            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full border border-gray-300 bg-white transition-all ${
                                                                formState.features[key] ? "translate-x-5" : "translate-x-0"
                                                            }`}
                                                        ></div>
                                                    </div>
                                                </label>

                                                {/* Yes on the right */}
                                                <span
                                                    className={`${
                                                        formState.features[key] ? "text-gray-700" : "text-gray-500"
                                                    }`}
                                                >
                                                    Yes
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                        {value && formState.featureExtensions[key] && (
                                            <div className="pl-4 mb-4" key={key}>
                                                {Object.entries(formState.featureExtensions[key]).map(([extensionKey, extensionValue]) => (
                                                    <div key={extensionKey}>
                                                        <p className="mb-1">{extensionKey}</p>
                                                        {extensionValue.type == "buttons" &&
                                                            <div className="mb-1">
                                                                <p>Buttons</p>
                                                            </div>
                                                        }
                                                        {extensionValue.type == "text" &&
                                                            <div className="flex mb-1">
                                                                <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                                                                    name={extensionKey} 
                                                                    rows="3"
                                                                    value={extensionValue.value}
                                                                    onChange={handleFeatureValueChange}>
                                                                </textarea>
                                                            </div>
                                                        }
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="mb-2">
                            <span className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#d7acfc] to-[#7fc3fa]">Additional Logistics</span>
                        </div>
                        <div className="flex mb-2">
                            <label>Other Requests</label>
                        </div>
                        <div className="flex mb-6">
                            <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" 
                                name="otherRequests" 
                                rows="3"
                                value={formState.otherRequests}
                                onChange={handleInputChange}>
                            </textarea>
                        </div>
                        <button type="submit" className="bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] rounded-xl px-4 py-2">Next</button>
                    </form>
                </div>
            </div>
        )
    }

    function HandleFollowUpQuestions(event){
        // course created, with button to access
        event.preventDefault();
        setLoading(true);

        const form = event.target;
        const formData = new FormData(form);
        const answers = Object.fromEntries(formData.entries());

        const questionAnswerMap = followUpQs.reduce((acc, question, index) => {
            acc[question] = answers[index] || ''; // Use answers[index] or fallback to ''
            return acc;
          }, {});

        axios.post("http://localhost:3001/buildCourse/create_course", {
            promptFields: prompt,
            questions: questionAnswerMap,
            courseName: formState.courseName,
            email: session.user.email,
            name: session.user.name,
        })
        .then(response => {
            setStatus("Done");
            setGenerateStatus(response.data.message);
            setCourseId(response.data.course_id);
            setLoading(false);
        })
        .catch(error => {
            console.log(error);
        })
    }

    if(status == "Follow-Up"){
        // form to answer follow up questions
        return(
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <h1 className="text-center font-semibold text-3xl mb-6">Build a Course</h1>
                <div>
                    <h2 className="mb-12">Answer the follow-up questions and then submit to start generating your
                        course. Not all questions are required, but it is recommended to clarify your specifications
                        as necessary. 
                    </h2>
                    <form onSubmit={HandleFollowUpQuestions}>
                        {followUpQs.map((question, index) => {
                            return(
                                <div key={index}>
                                    <div className="flex mb-2">
                                        <label>{question}</label>
                                    </div>
                                    <div className="flex mb-6">
                                        <textarea className="border border-gray-900 w-full py-2 px-2 rounded-lg border-2" name={index}></textarea>
                                    </div>
                                </div>
                            )
                        })}
                        <button type="submit" className="bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] rounded-xl px-4 py-2">Create Course</button>
                    </form>
                </div>
            </div>
        )
    }
    
    if(generateStatus == "Fail"){
        return(
            <div className="container mx-auto px-8 lg:px-16 py-12">
                <h1 className="text-center font-semibold text-3xl mb-6">Build a Course</h1>
                <div className="mt-40 mb-40 text-center">
                    <p>An error came up while generating your course. Please try again.</p>
                </div>
            </div>
        )
    }
    
    return(
        <div className="container mx-auto px-8 lg:px-16 py-12">
            <h1 className="text-center font-semibold text-3xl mb-6">Build a Course</h1>
            <div className="mt-40 mb-40 text-center">
                <p className="mb-4">Successfully created your course!</p>
                <Link href={{ pathname: `/Course/${formState.courseName}`, query: { course_id: courseId } }}>
                    <button className="bg-gradient-to-r from-[#f2e6fc] to-[#bce1ff] rounded-xl px-4 py-2">Go to Course</button>
                </Link>
            </div>
        </div>
    )
}