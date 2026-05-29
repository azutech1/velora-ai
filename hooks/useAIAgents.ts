"use client";

import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { initialAIAgents } from "@/lib/ai/agents";
import { AIRecommendation, generateAIRecommendations } from "@/lib/ai/recommendations";

export function useAIAgents() {
  const { isConnected } = useAccount();
  const { activities, recordActivity } = useActivityRecorder();
  const [selectedAgentId, setSelectedAgentId] = useState(initialAIAgents[0]?.id ?? "");
  const [recommendationState, setRecommendationState] = useState<Record<string, AIRecommendation["status"]>>({});

  const recommendations = useMemo(() => {
    const generated = generateAIRecommendations({
      walletConnected: isConnected,
      activities,
      selectedChain: "Arc Testnet",
      selectedToken: "USDC",
      quoteAvailable: activities.some((activity) => activity.actionType === "live_quote_success")
    });
    return generated.map((recommendation) => ({
      ...recommendation,
      status: recommendationState[recommendation.id] ?? recommendation.status
    }));
  }, [activities, isConnected, recommendationState]);

  const selectedAgent = useMemo(
    () => initialAIAgents.find((agent) => agent.id === selectedAgentId) ?? initialAIAgents[0],
    [selectedAgentId]
  );

  function openAgent(agentId: string) {
    const agent = initialAIAgents.find((item) => item.id === agentId);
    setSelectedAgentId(agentId);
    if (agent) {
      recordActivity({
        actionType: "ai_agent_viewed",
        title: "AI agent viewed",
        description: `${agent.name} was opened for review.`,
        feature: "automation",
        network: "Arc Testnet",
        status: "info",
        metadata: { agentId }
      });
    }
  }

  function createRecommendation(agentId: string) {
    const agent = initialAIAgents.find((item) => item.id === agentId);
    recordActivity({
      actionType: "ai_agent_recommendation_created",
      title: "AI recommendation created",
      description: `${agent?.name ?? "Velora AI"} created an approval-first recommendation.`,
      feature: "automation",
      token: "USDC",
      network: "Arc Testnet",
      status: "pending",
      metadata: { agentId }
    });
  }

  function updateRecommendation(recommendationId: string, status: "approved" | "rejected" | "prepared") {
    setRecommendationState((current) => ({ ...current, [recommendationId]: status }));
    const recommendation = recommendations.find((item) => item.id === recommendationId);
    recordActivity({
      actionType: status === "approved" ? "approval_approved" : status === "rejected" ? "approval_rejected" : "ai_action_prepared",
      title: status === "approved" ? "AI recommendation approved" : status === "rejected" ? "AI recommendation rejected" : "AI action prepared",
      description: recommendation?.title ?? "An AI recommendation was updated.",
      feature: "automation",
      token: recommendation?.token,
      network: recommendation?.network ?? "Arc Testnet",
      status: status === "rejected" ? "info" : "success",
      metadata: { recommendationId }
    });
  }

  return {
    agents: initialAIAgents,
    selectedAgent,
    recommendations,
    openAgent,
    createRecommendation,
    updateRecommendation
  };
}
