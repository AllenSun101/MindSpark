import axios from "axios";

export default async function Test(){
    const topic = "Q-Learning with MDPs";
    const { data } = await axios.get("http://localhost:3001/youtube/get_links", {
        params: {
            query: topic,
        }
    })

    return(
        <div className="">
            {data.videos.map(video => (
                <div key={video.id} className="p-2">
                    <h3 className="text-lg font-semibold">{video.title}</h3>
                    <p className="text-sm text-gray-600">{video.channelTitle}</p>
                    <iframe
                        width="50%"
                        height="400"
                        src={`https://www.youtube.com/embed/${video.id}`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg"
                    ></iframe>
                </div>
            ))}
        </div>
    )
}