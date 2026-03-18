import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateDuration, formatDateSafe } from "@/utils/data";

const EmployeeAttendanceTable = ({ attendanceRecords }) => {
    return (
        <div>

        <Card className="mt-4">
            <CardContent className="p-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                             <TableHead>Sr. No</TableHead> 
                            <TableHead>Date</TableHead>
                            <TableHead>Punch In</TableHead>
                            <TableHead>Punch Out</TableHead>
                            <TableHead>Duration</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {attendanceRecords?.length ? (
                            attendanceRecords.map((record, index) => (
                                <TableRow key={index}>
                                     <TableCell>{index + 1}</TableCell>
                                    <TableCell>{formatDateSafe(record.punchIn, "dd MMM yyyy")}</TableCell>
                                    <TableCell>{formatDateSafe(record.punchIn, "h:mm a")}</TableCell>
                                    <TableCell>{record.punchOut ? formatDateSafe(record.punchOut, "h:mm a") : "Not punched out"}</TableCell>
                                    <TableCell>{calculateDuration(record.punchIn, record.punchOut)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan="4"
                                    className="py-4 text-center text-gray-500"
                                >
                                    No attendance records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        </div>
    );
};


export default EmployeeAttendanceTable
