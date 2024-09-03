import { useLocation } from "wouter"
import { useEffect } from "react"
import { useClient } from 'urql';
import { AnimatedErrorMessage } from "@/components/AnimatedErrorMessage"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import useMainStore from "@/store";
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/EmptyState"

const UserList = () => {
  const [, navigate] = useLocation();
  const { users, getUsers } = useMainStore();
  const client = useClient();
  useEffect(() => {
    getUsers(client)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps


  if (!users.loaded) return (
    <div className="space-y-2">
      <Skeleton className="w-full h-10" />
      <Skeleton className="w-full h-10" />
      <Skeleton className="w-full h-10" />
    </div>
  );
  if (users.errors) return <AnimatedErrorMessage message={users.errors.join(", ")} />

  return (
    <div className="container py-10 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
        <Button onClick={() => navigate("/new-user")}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>
      {users.users.length === 0 ? (
        <EmptyState showAddUser={true} showUploadResearch={false} showAskQuestion={false} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Contact List</CardTitle>
            <CardDescription>Manage and view all contacts in your system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.users.map((user: { id: string; name: string }) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="text-right">
                      <Button className="p-2" variant="outline" onClick={() => navigate(`/users/${user.id}`)}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Research
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserList;