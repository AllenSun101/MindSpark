
export default function MyCourses(){

    var user = "Bento Sun";

    const cards = [
        { id: 1, title: 'Card 1', description: 'Description for card 1' },
        { id: 2, title: 'Card 2', description: 'Description for card 2' },
        { id: 3, title: 'Card 3', description: 'Description for card 3' },
        { id: 4, title: 'Card 4', description: 'Description for card 4' },
        { id: 5, title: 'Card 5', description: 'Description for card 5' },
        { id: 6, title: 'Card 6', description: 'Description for card 6' },
    ];

    return (
        <div className="container mx-auto px-8 lg:px-16 py-24">
            <h1 className="text-center font-semibold text-3xl mb-6">{user}'s Courses</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {cards.map((card) => (
                <div
                key={card.id}
                className="bg-white shadow-md rounded-lg p-8 border border-gray-200 aspect-[2/2] flex flex-col justify-between"
                >
                <div>
                    <h2 className="text-lg font-semibold mb-2 text-center">{card.title}</h2>
                    <p className="text-gray-600 mb-4">{card.description}</p>
                </div>
                <div className="relative h-4 w-full bg-gray-200 rounded-full">
                    <div
                    className="absolute top-0 left-0 h-4 bg-blue-500 rounded-full"
                    style={{ width: '50%' }}
                    ></div>
                </div>
                </div>
            ))}
            </div>
        </div>
    );
}