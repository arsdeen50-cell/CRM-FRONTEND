import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, PIPELINE_STAGES, STAGE_COLORS } from "@/hooks/Pipelineconstants";
// import { PIPELINE_STAGES, STAGE_COLORS, formatCurrency } from "./pipelineConstants";

const SummaryStats = ({ leads }) => {
  const totalLeads = leads.length;

  const pipelineValue = leads
    .filter((l) => !["Won", "Lost"].includes(l.pipelineStage))
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);

  const wonCount = leads.filter((l) => l.pipelineStage === "Won").length;
  const lostCount = leads.filter((l) => l.pipelineStage === "Lost").length;
  const closedCount = wonCount + lostCount;
  const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

  const stageCounts = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = leads.filter((l) => (l.pipelineStage || "Lead") === stage).length;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Total Leads</p>
          <p className="text-2xl font-semibold mt-1">{totalLeads}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Pipeline Value (Open)</p>
          <p className="text-2xl font-semibold mt-1">{formatCurrency(pipelineValue)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="text-2xl font-semibold mt-1">{conversionRate}%</p>
          <p className="text-xs text-gray-400 mt-1">{wonCount} won / {closedCount} closed</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500 mb-2">Leads by Stage</p>
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE_STAGES.map((stage) => (
              <span
                key={stage}
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STAGE_COLORS[stage]}`}
              >
                {stage} · {stageCounts[stage]}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryStats;