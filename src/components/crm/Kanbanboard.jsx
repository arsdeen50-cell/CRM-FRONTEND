import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency, isOverdue, PIPELINE_STAGES, STAGE_COLORS } from "@/hooks/Pipelineconstants";
// import { PIPELINE_STAGES, STAGE_COLORS, formatCurrency, isOverdue } from "./pipelineConstants";

const priorityDot = {
  Low: "bg-green-500",
  Medium: "bg-yellow-500",
  High: "bg-orange-500",
  Critical: "bg-red-500",
};

const KanbanBoard = ({ leads, currentUser, onStageChange, onEdit, onLogActivity }) => {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const handleDrop = (stage) => {
    if (draggedId) {
      if (stage === "Lost") {
        const reason = window.prompt("Reason for marking this lead as Lost (optional):") || "";
        onStageChange(draggedId, stage, currentUser, reason);
      } else {
        onStageChange(draggedId, stage, currentUser);
      }
    }
    setDraggedId(null);
    setDragOverStage(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stageLeads = leads.filter((l) => (l.pipelineStage || "Lead") === stage);
        const stageValue = stageLeads.reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);

        return (
          <div
            key={stage}
            className={`min-w-[270px] w-[270px] flex-shrink-0 rounded-lg border-2 transition-colors ${
              dragOverStage === stage ? "border-blue-400 bg-blue-50/40" : "border-transparent"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage);
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={() => handleDrop(stage)}
          >
            <div className={`rounded-t-lg border px-3 py-2 ${STAGE_COLORS[stage]}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{stage}</span>
                <span className="text-xs font-medium opacity-80">{stageLeads.length}</span>
              </div>
              <p className="text-xs opacity-70 mt-0.5">{formatCurrency(stageValue)}</p>
            </div>

            <div className="bg-gray-50 rounded-b-lg p-2 min-h-[200px] space-y-2">
              {stageLeads.map((lead) => {
                const overdue = isOverdue(lead);
                return (
                  <Card
                    key={lead._id}
                    draggable
                    onDragStart={() => setDraggedId(lead._id)}
                    onDragEnd={() => setDraggedId(null)}
                    className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                      draggedId === lead._id ? "opacity-50" : ""
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">
                          {lead.series || "Lead"}
                        </p>
                        <span
                          className={`h-2 w-2 rounded-full mt-1 flex-shrink-0 ${
                            priorityDot[lead.priority] || "bg-gray-300"
                          }`}
                          title={lead.priority || "No priority"}
                        />
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        {lead.projectAccountHandledBy || "Unassigned"}
                      </p>

                      <p className="text-sm font-semibold text-gray-800 mt-2">
                        {formatCurrency(lead.dealValue, lead.currency)}
                      </p>

                      {lead.nextFollowUpDate && (
                        <p
                          className={`text-xs mt-1 ${
                            overdue ? "text-red-600 font-semibold" : "text-gray-500"
                          }`}
                        >
                          {overdue ? "Overdue · " : "Follow-up: "}
                          {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                        </p>
                      )}

                      <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                        <button
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                          onClick={() => onEdit(lead)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Log Activity"
                          onClick={() => onLogActivity(lead)}
                        >
                          <Clock className="h-3.5 w-3.5" />
                        </button>
                        {!["Won", "Lost"].includes(stage) && (
                          <>
                            <button
                              className="p-1 text-green-600 hover:bg-green-50 rounded ml-auto"
                              title="Mark Won"
                              onClick={() => onStageChange(lead._id, "Won", currentUser)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Mark Lost"
                              onClick={() => {
                                const reason =
                                  window.prompt("Reason for marking this lead as Lost (optional):") ||
                                  "";
                                onStageChange(lead._id, "Lost", currentUser, reason);
                              }}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {stageLeads.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">No leads</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;