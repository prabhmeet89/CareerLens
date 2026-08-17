import React from 'react';
import { TrendingUp, Info } from 'lucide-react';

const NewsWidget = () => {
  const newsItems = [
    {
      id: 1,
      title: 'Full Stack & AI Engineer Surge',
      readers: 'Top hiring trend across startups & enterprise',
      time: '1h ago',
    },
    {
      id: 2,
      title: 'Summer 2026 Tech Internships',
      readers: 'Over 1,200 openings opening next quarter',
      time: '3h ago',
    },
    {
      id: 3,
      title: 'TypeScript & Python in High Demand',
      readers: 'Present in 78% of job descriptions',
      time: '6h ago',
    },
    {
      id: 4,
      title: 'ATS Resume Scoring Criteria',
      readers: 'How recruiters filter keyword relevance',
      time: '1d ago',
    },
  ];

  return (
    <div className="bg-white border border-linkedin-border rounded-[10px] p-4 shadow-sm text-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 font-bold text-linkedin-text-primary">
          <span>Trending Career Insights</span>
        </div>
        <Info className="w-3.5 h-3.5 text-linkedin-text-secondary cursor-pointer hover:text-linkedin-blue" />
      </div>

      <div className="space-y-3">
        {newsItems.map((item) => (
          <div
            key={item.id}
            className="cursor-pointer group block"
          >
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-linkedin-blue mt-1.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-linkedin-text-primary group-hover:text-linkedin-blue transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-linkedin-text-muted mt-0.5">
                  {item.time} &bull; {item.readers}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer copyright */}
      <div className="mt-4 pt-3 border-t border-linkedin-border text-[10px] text-linkedin-text-muted text-center leading-normal">
        <p>Resume2Role Corporation &copy; 2026</p>
        <div className="flex justify-center gap-2 mt-1">
          <span className="hover:underline cursor-pointer">About</span>
          <span>&bull;</span>
          <span className="hover:underline cursor-pointer">Help Center</span>
          <span>&bull;</span>
          <span className="hover:underline cursor-pointer">Privacy &amp; Terms</span>
        </div>
      </div>
    </div>
  );
};

export default NewsWidget;
