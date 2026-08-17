import React from 'react';
import ProfileMiniCard from '../components/dashboard/ProfileMiniCard';
import QuickStatsCard from '../components/dashboard/QuickStatsCard';
import WelcomeCard from '../components/dashboard/WelcomeCard';
import FeedPlaceholderCards from '../components/dashboard/FeedPlaceholderCard';
import GettingStartedCard from '../components/dashboard/GettingStartedCard';
import NewsWidget from '../components/dashboard/NewsWidget';

const DashboardPage = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
      {/* Left Column (Narrow, ~20-25% / 3 cols on md/lg) */}
      <aside className="md:col-span-4 lg:col-span-3 space-y-4">
        <ProfileMiniCard />
        <QuickStatsCard />
      </aside>

      {/* Center Column (Main Feed, ~50-55% / 5-6 cols on md/lg) */}
      <section className="md:col-span-8 lg:col-span-6 space-y-4">
        <WelcomeCard />
        <FeedPlaceholderCards />
      </section>

      {/* Right Column (Narrow, ~25% / 3 cols on lg, full on tablet/mobile) */}
      <aside className="hidden lg:block lg:col-span-3 space-y-4">
        <GettingStartedCard />
        <NewsWidget />
      </aside>
    </div>
  );
};

export default DashboardPage;
