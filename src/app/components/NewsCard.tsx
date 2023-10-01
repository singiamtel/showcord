import HTML from '../../formatting/html';

export interface News {
    author: string;
    date: number;
    detailsHTML: string;
    id: string;
    summaryHTML: string;
    title: string;
}

export default function NewsCard(
    { news, last }: { news: News; last?: boolean },
) {
    return (
        <div className="m-2">
            <h2 className="font-bold text-lg">
                {news.title}
            </h2>
            <span className="ml-2 mb-2 block">
                <span className="text-gray-125">
                    {news.author}
                </span>
                <HTML message={news.summaryHTML} raw />
            </span>
            {!last && <hr />}
        </div>
    );
}
