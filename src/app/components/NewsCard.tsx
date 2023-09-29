import HTML from "../../formatting/html";

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
        {news.title} - by {news.author}
      </h2>
      <span className="m-2 block">
        <HTML message={news.summaryHTML} raw />
      </span>
      {!last && <hr />}
    </div>
  );
}
