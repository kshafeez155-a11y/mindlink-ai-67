import { Link } from "@tanstack/react-router";
import { ArrowRight, CircleDollarSign, FileText, MessageSquare, Sparkles } from "lucide-react";
import { creatorNavItems, PageHeader } from "@/components/CreatorNav";
import { DashShell } from "@/components/DashShell";
import { Card, StatsCard } from "@/components/ui/primitives";
import {
  analyticsSeries,
  conversationLog,
  dashboardStats,
  earnings,
  getCharacter,
  knowledgeSources,
  recentActivity,
} from "@/data/mock";
import type { ReactNode } from "react";

export function CreatorWorkspace({ section = "Dashboard" }: { section?: string }) {
  const page = creatorPages[section] ?? creatorPages.Dashboard;
  return (
    <DashShell items={CreatorNavItems}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">{page}</div>
    </DashShell>
  );
}

const CreatorNavItems = creatorNavItems;

const creatorPages: Record<string, ReactNode> = {
  Dashboard: <DashboardPage />,
  "My Character": <CharacterPage />,
  Knowledge: <KnowledgePage />,
  Conversations: <ConversationsPage />,
  Analytics: <AnalyticsPage />,
  Earnings: <EarningsPage />,
  Settings: <SettingsPage />,
};

function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Creator dashboard"
        subtitle="A quick view of how your AI character is helping people."
        action={
          <Link
            to="/creator/character"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-deep"
          >
            Edit character <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
            <Link to="/creator/conversations" className="text-sm font-semibold text-primary">
              View all
            </Link>
          </div>
          <div className="mt-5 divide-y divide-border">
            {recentActivity.map((item) => (
              <div key={item.title} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold">Character status</h2>
          <div className="mt-5 flex items-center gap-4">
            <img
              src={getCharacter("rahul-sharma").photo}
              alt="Rahul AI"
              className="h-16 w-16 rounded-2xl object-cover object-top"
            />
            <div>
              <p className="font-semibold">Rahul AI</p>
              <p className="mt-1 text-sm text-muted-foreground">Entrepreneur &amp; Investor</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Published
              </span>
            </div>
          </div>
          <Link
            to="/creator/character"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            Manage character <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </div>
    </>
  );
}

function CharacterPage() {
  return (
    <>
      <PageHeader
        title="My character"
        subtitle="Shape how Rahul AI represents your expertise."
        action={
          <Link
            to="/creator/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            Create another <Sparkles className="h-4 w-4" />
          </Link>
        }
      />
      <Card className="mt-8 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <img
            src={getCharacter("rahul-sharma").photo}
            alt="Rahul AI"
            className="h-24 w-24 rounded-2xl object-cover object-top"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold">Rahul AI</h2>
            <p className="mt-1 text-sm text-muted-foreground">Entrepreneur &amp; Investor</p>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Ask me about startups, business, investing, productivity and entrepreneurship.
            </p>
          </div>
          <Link to="/character/rahul-sharma" className="text-sm font-semibold text-primary">
            View profile
          </Link>
        </div>
      </Card>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatsCard value="Published" label="Status" />
        <StatsCard value="4.9 / 5" label="Audience rating" />
        <StatsCard value="12k" label="Conversations" />
      </div>
    </>
  );
}

function KnowledgePage() {
  return (
    <>
      <PageHeader
        title="Knowledge"
        subtitle="The sources your character can draw from."
        action={
          <button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">
            Add source
          </button>
        }
      />
      <Card className="mt-8 overflow-hidden">
        <div className="divide-y divide-border">
          {knowledgeSources.map((source) => (
            <div key={source.name} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{source.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {source.type} · {source.size} · Updated {source.updated}
                </p>
              </div>
              <span className="text-xs font-semibold text-success">{source.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function ConversationsPage() {
  return (
    <>
      <PageHeader title="Conversations" subtitle="See how people are using Rahul AI." />
      <Card className="mt-8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Topic</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Messages</th>
                <th className="px-5 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {conversationLog.map((row) => (
                <tr key={`${row.user}-${row.time}`}>
                  <td className="px-5 py-4 font-medium">{row.user}</td>
                  <td className="px-5 py-4 text-muted-foreground">{row.topic}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-deep">
                      {row.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{row.messages}</td>
                  <td className="px-5 py-4 text-muted-foreground">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function AnalyticsPage() {
  const max = Math.max(...analyticsSeries.map((item) => item.chats));
  return (
    <>
      <PageHeader title="Analytics" subtitle="Weekly engagement across chat and voice." />
      <Card className="mt-8 p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Conversations this week</h2>
          <span className="text-sm text-muted-foreground">Chat + voice</span>
        </div>
        <div className="mt-8 flex h-56 items-end gap-2 sm:gap-4">
          {analyticsSeries.map((item) => (
            <div
              key={item.label}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <div className="flex h-full w-full items-end justify-center gap-1">
                <div
                  className="w-1/2 rounded-t-md bg-primary"
                  style={{ height: `${(item.chats / max) * 100}%` }}
                />
                <div
                  className="w-1/2 rounded-t-md bg-indigo/40"
                  style={{ height: `${(item.voice / max) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function EarningsPage() {
  return (
    <>
      <PageHeader title="Earnings" subtitle="Track your character's conversation earnings." />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatsCard value="₹24,500" label="This month" change="+9%" />
        <StatsCard value="₹80,450" label="Total paid" />
        <StatsCard value="412" label="Paid sessions" />
      </div>
      <Card className="mt-6 overflow-hidden">
        <div className="divide-y divide-border">
          {earnings.map((item) => (
            <div key={item.month} className="flex items-center gap-4 p-5">
              <CircleDollarSign className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">{item.month}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.sessions} sessions</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{item.amount}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your creator workspace preferences." />
      <Card className="mt-8 max-w-2xl p-6">
        <div className="space-y-5">
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-semibold">Public character profile</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Let people discover Rahul AI on Explore.
              </span>
            </span>
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-primary" />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block text-sm font-semibold">Conversation notifications</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Receive a digest of new activity.
              </span>
            </span>
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-primary" />
          </label>
          <button className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white">
            Save settings
          </button>
        </div>
      </Card>
    </>
  );
}
