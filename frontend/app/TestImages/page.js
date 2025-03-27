'use client'
import { useState } from "react";
import axios from "axios";

export default function ImageSearch() {
    const [query, setQuery] = useState("");
    const [images, setImages] = useState([]);

    const fetchImages = async () => {
        if (!query) return;
        try {
            const res = await axios.get("http://localhost:3001/image/get_google_images", {
                params: { q: query }
            });
            setImages(res.data.images);
        } catch (error) {
            console.error("Error fetching images:", error);
        }
    };

    return (
        <div className="p-4">
            <input
                type="text"
                placeholder="Search for images..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border p-2 rounded-md w-full"
            />
            <button onClick={fetchImages} className="bg-blue-500 text-white p-2 rounded-md mt-2">
                Search
            </button>

            <div className="grid grid-cols-2 gap-4 mt-4">
                {images.map((img, idx) => (
                    <div key={idx} className="p-2 border rounded-lg">
                        <img src={img.url} alt={img.title} className="w-full h-[300px] object-cover rounded-md" />
                        <p className="text-sm">{img.title}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
