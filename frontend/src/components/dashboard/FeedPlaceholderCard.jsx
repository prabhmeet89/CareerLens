import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Briefcase, TrendingUp, BookOpen, Clock, ChevronRight, UploadCloud } from 'lucide-react';
import Button from '../common/Button';

export const FeedPlaceholderCards = () => {
  const navigate = useNavigate();

  const cards = [
    {
      id: 1,
      badge: 'Job & Internship Matching Engine',
      badgeColor: 'bg-blue-50 text-linkedin-blue border-blue-200',
      icon: Briefcase,
      iconColor: 'text-linkedin-blue bg-linkedin-blue-light',
      title: 'Your tailored job matches will appear here',
      description:
        'Upload your PDF resume to let Anthropic Claude extract your skills, projects, and coursework. In Phase 3, our AI matching engine will compare your profile with live internships and graduate roles.',
      actionText: 'Upload Resume Now',
      actionHandler: () => navigate('/upload'),
      meta: 'AI Role Matching Engine &bull; Phase 2 Active',
      tags: ['Full Stack', 'Backend', 'Frontend', 'Data Science'],
    },
    {
      id: 2,
      badge: 'Live Skill Benchmark Graph',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: TrendingUp,
      iconColor: 'text-emerald-700 bg-emerald-50',
      title: 'Real-time Industry Skill Gap Analysis',
      description:
        'Compare your current skill stack against trending requirements for Software Engineering, Cloud Architecture, and Machine Learning roles with actionable recommendations.',
      actionText: 'View Profile Skills',
      actionHandler: () => navigate('/profile'),
      meta: 'Career Analytics Engine &bull; Phase 2 Active',
      tags: ['React', 'Node.js', 'Python', 'AWS', 'Docker'],
    },
    {
      id: 3,
      badge: 'Career Lens Daily Student Advice',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: BookOpen,
      iconColor: 'text-purple-700 bg-purple-50',
      title: 'Pro Tip: Quantify your project achievements',
      description:
        'When listing personal or academic projects, highlight quantifiable impact (e.g., "Reduced latency by 35%" or "Supports 500+ active users") rather than just tech stacks. Our Claude AI resume parser actively extracts quantified bullets higher!',
      actionText: 'Upload Updated PDF',
      actionHandler: () => navigate('/upload'),
      meta: 'Resume2Role Career Tips &bull; Always Active',
      tags: ['Resume Optimization', 'Best Practices'],
    },
  ];

  return (
    <div className="space-y-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white border border-linkedin-border rounded-[10px] p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Header with badge & icon */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${card.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded border ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                  <p className="text-[11px] text-linkedin-text-muted mt-0.5" dangerouslySetInnerHTML={{ __html: card.meta }} />
                </div>
              </div>
            </div>

            {/* Content */}
            <h3 className="text-base font-bold text-linkedin-text-primary mb-1.5">
              {card.title}
            </h3>
            <p className="text-xs sm:text-sm text-linkedin-text-secondary leading-relaxed mb-4">
              {card.description}
            </p>

            {/* Tags preview */}
            {card.tags && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] bg-gray-100 text-linkedin-text-secondary px-2 py-0.5 rounded-md font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-3 border-t border-linkedin-border flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] text-linkedin-text-muted">
                <Sparkles className="w-3.5 h-3.5 text-linkedin-blue" />
                <span>Phase 2 Pipeline Active</span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={card.actionHandler}
              >
                {card.actionText}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeedPlaceholderCards;
