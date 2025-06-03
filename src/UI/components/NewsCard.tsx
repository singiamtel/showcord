import HTML from '../chatFormatting/Html';

export interface News {
    author: string;
    date: number;
    detailsHTML: string;
    id: string;
    summaryHTML: string;
    title: string;
}

export default function NewsCard(
    { news, last }: Readonly<{ news: News; last?: boolean }>,
) {
    return (
        <div className="m-2">
            <h2 className="font-bold text-lg pb-0">
                {news.title}
            </h2>
            <span className="ml-2 mb-2 block">
                <span className="text-gray-125">
                    {/* The date comes in as a unix timestamp, so we need to convert it to a date */}
                    {/* FIXME: This gives different dates than the official client. (can't tell if it's us doing it wrong) */}
                    {news.author} on {new Date(news.date * 1000).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: '2-digit',
                    })}
                </span>
                <HTML message={news.summaryHTML} raw />
            </span>
            {!last && <hr />}
        </div>
    );
}
