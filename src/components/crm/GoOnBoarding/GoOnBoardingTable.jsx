// GoOnBoardingTable.js - Add Designation Manager

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import useGoOnBoarding from "@/hooks/useGoOnBoarding";
import { Settings } from "lucide-react";
import DesignationManager from "@/components/DesignationManager";

const GoOnBoardingTable = () => {
    const navigate = useNavigate();
    const { onboardings, loading, fetchOnboardings } = useGoOnBoarding();
    const [showDesignationManager, setShowDesignationManager] = useState(false);

    useEffect(() => {
        fetchOnboardings();
    }, []);

    const getStatusBadge = (status) => {
        const colors = {
            Pending: "bg-yellow-100 text-yellow-800",
            Approved: "bg-green-100 text-green-800",
            Rejected: "bg-red-100 text-red-800",
            "In Progress": "bg-blue-100 text-blue-800",
            "Send Link To Candidate": "bg-purple-100 text-purple-800",
            "Documents Submitted": "bg-indigo-100 text-indigo-800",
        };
        return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Go Onboarding [Counts: {onboardings.length}]</CardTitle>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => setShowDesignationManager(true)}
                        className="flex items-center gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        Manage Designations
                    </Button>
                    <Button onClick={() => navigate("/crm/create-goonboarding")}>
                        Create New
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <p className="text-center text-sm text-gray-500">Loading...</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Actions</TableHead>
                                <TableHead>Candidate Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Mobile No</TableHead>
                                <TableHead>Designation</TableHead>
                                <TableHead>Date of Joining</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {onboardings.map((item) => (
                                <TableRow key={item._id}>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => navigate(`/crm/goonboarding/${item._id}`)}
                                        >
                                            View/Edit
                                        </Button>
                                    </TableCell>
                                    <TableCell>{item.candidateName}</TableCell>
                                    <TableCell>{item.email}</TableCell>
                                    <TableCell>{item.mobileNo}</TableCell>
                                    <TableCell>{item.designation}</TableCell>
                                    <TableCell>{item.doj ? new Date(item.doj).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell>{getStatusBadge(item.candidateStatus)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            <DesignationManager
                isOpen={showDesignationManager}
                onClose={() => setShowDesignationManager(false)}
            />
        </Card>
    );
};

export default GoOnBoardingTable;