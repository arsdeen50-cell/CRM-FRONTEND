// components/UserTable.jsx
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PencilLine, Trash } from "lucide-react";
import { formatDateSafe } from "@/utils/data";
import { Badge } from "@/components/ui/badge";
import useUser from "@/hooks/useUser";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import EditUserSheet from "./EditUserSheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const UserTable = () => {
    const { users } = useSelector((state) => state.user);
    const { fetchUsers, updateUser, deleteUser } = useUser();
    const [selectedUser, setSelectedUser] = useState(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [filters, setFilters] = useState({
        empId: "",
        fullname: "",
        role: "all",
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const filtered = users.filter((user) => {
            return (
                (filters.empId === "" || user.empId?.toString().includes(filters.empId)) &&
                (filters.fullname === "" || user.fullname.toLowerCase().includes(filters.fullname.toLowerCase())) &&
                (filters.role === "all" || user.role === filters.role)
            );
        });
        setFilteredUsers(filtered);
    }, [users, filters]);

    const openEditModal = (user) => {
        setSelectedUser(user);
        setSheetOpen(true);
    };

    const handleDelete = async (userId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this user?");
        if (confirmDelete) {
            await deleteUser(userId);
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const resetFilters = () => {
        setFilters({
            empId: "",
            fullname: "",
            role: "all",
        });
    };

    return (
        <Card>
            <div className="space-y-4 p-4">
                <div className="flex flex-col gap-4 md:flex-row">
                    <Input
                        placeholder="Filter by Employee ID"
                        value={filters.empId}
                        onChange={(e) => handleFilterChange("empId", e.target.value)}
                        className="max-w-xs"
                    />
                    <Input
                        placeholder="Filter by Full Name"
                        value={filters.fullname}
                        onChange={(e) => handleFilterChange("fullname", e.target.value)}
                        className="max-w-xs"
                    />
                    <Select
                        value={filters.role}
                        onValueChange={(value) => handleFilterChange("role", value === "all" ? "all" : value)}
                    >
                        <SelectTrigger className="max-w-xs">
                            <SelectValue placeholder="Filter by Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="employee">Employee</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="destructive"
                        onClick={resetFilters}
                    >
                        Reset Filters
                    </Button>
                </div>
            </div>
            <CardContent className="p-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Sr.no</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Employee ID</TableHead>
                            <TableHead>Full Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone Number</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length ? (
                            filteredUsers.map((user, index) => (
                                <TableRow key={user._id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-x-4">
                                            <button
                                                className="text-blue-500 dark:text-blue-600"
                                                onClick={() => openEditModal(user)}
                                            >
                                                <PencilLine size={20} />
                                            </button>
                                            <button
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => handleDelete(user._id)}
                                                title="Delete record"
                                            >
                                                <Trash size={20} />
                                            </button>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.empId || "-"}</TableCell>
                                    <TableCell>{user.fullname}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.phoneNumber}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === "admin" ? "destructive" : "default"}>{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>{formatDateSafe(user.createdAt, "dd MMM yyyy")}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan="7"
                                    className="py-4 text-center text-gray-500"
                                >
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <EditUserSheet
                open={sheetOpen}
                setOpen={setSheetOpen}
                user={selectedUser}
                onUpdate={(updatedUser) => {
                    updateUser(updatedUser._id, updatedUser);
                }}
            />
        </Card>
    );
};

export default UserTable;
