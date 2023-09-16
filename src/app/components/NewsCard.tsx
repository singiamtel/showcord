// author: "Theia"
// ​​
// date: 1694540975
// ​​
// detailsHTML: null
// ​​
// id: "173"
// ​​
// summaryHTML: '<p>Signups for the first ever edition of <a href="https://www.smogon.com/forums/threads/dcl-i-player-signups-custom-avatar-prize.3726796/" target="_blank">Draft Champions League</a> are open! Sign up for your chance to play SV, SS, SM, ORAS, and VGC draft in a team tour environment for the first time on Smogon with a chance to win a custom avatar!</p>'
// ​​
// title: "DCL I"

import HTML from "@/formatting/html";

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
      <span className="m-2 block">
        <HTML message={news.summaryHTML} raw />
      </span>
      {!last && <hr />}
    </div>
  );
}
