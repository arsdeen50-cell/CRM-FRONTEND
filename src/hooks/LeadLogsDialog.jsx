import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  Mail, 
  Phone, 
  Calendar, 
  History, 
  AlertCircle,
  X
} from "lucide-react";

const LeadLogsDialog = ({ open, onOpenChange, lead }) => {
  if (!lead) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'Call': return <Phone className="h-4 w-4 text-green-500" />;
      case 'Email': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'Meeting': return <Calendar className="h-4 w-4 text-purple-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      'Lead': 'bg-blue-100 text-blue-700',
      'Qualified': 'bg-green-100 text-green-700',
      'Proposal Sent': 'bg-yellow-100 text-yellow-700',
      'Negotiation': 'bg-orange-100 text-orange-700',
      'Won': 'bg-emerald-100 text-emerald-700',
      'Lost': 'bg-red-100 text-red-700'
    };
    return colors[stage] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-4xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold">Lead History & Logs</span>
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button> */}
          </DialogTitle>
        </DialogHeader>

        {/* Lead Info Header */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Series</p>
              <p className="font-medium text-sm">{lead.series || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Client</p>
              <p className="font-medium text-sm">{lead.clientName || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Current Stage</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStageColor(lead.pipelineStage || 'Lead')}`}>
                {lead.pipelineStage || "Lead"}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created By</p>
              <p className="font-medium text-sm">{lead.createdBy || "N/A"}</p>
            </div>
          </div>
          
          {/* Lost Reason if any */}
          {lead.lostReason && (
            <div className="mt-3 pt-3 border-t flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Lost Reason</p>
                <p className="text-sm text-red-600 font-medium">{lead.lostReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stage History & Activity Logs */}
        <div className="space-y-6">
          {/* Stage History Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Stage History</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {lead.stageHistory?.length || 0}
              </span>
            </div>
            
            {!lead.stageHistory || lead.stageHistory.length === 0 ? (
              <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                <History className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No stage history available</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px] rounded-md border p-2">
                <div className="space-y-2 pr-2">
                  {lead.stageHistory.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStageColor(item.stage)}`}>
                          {item.stage}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            By: {item.changedBy || "Unknown"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(item.changedAt)}
                          </span>
                        </div>
                        {item.reason && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Reason: {item.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Activity Logs Section */}
          {/* <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Activity Logs</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {lead.activityLog?.length || 0}
              </span>
            </div>
            
            {!lead.activityLog || lead.activityLog.length === 0 ? (
              <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No activity logs available</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px] rounded-md border p-2">
                <div className="space-y-2 pr-2">
                  {lead.activityLog.map((log, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {getActivityIcon(log.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {log.type || "Note"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(log.loggedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1 break-words">
                          {log.note || "No details provided"}
                        </p>
                        {log.loggedBy && (
                          <p className="text-xs text-gray-400 mt-1">
                            By: {log.loggedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div> */}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadLogsDialog;