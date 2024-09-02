import { useCallback, useState, useEffect } from "react"
import { useLocation } from "wouter"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import useMainStore from "@/store"

const Logout = () => {
    const setToken = useMainStore((state) => state.setAuthToken);
    const [, navigate] = useLocation();
    const [showConfirmation, setShowConfirmation] = useState(true);

    const handleLogout = useCallback(() => {
        setToken("");
        navigate("/");
    }, [setToken, navigate]);

    useEffect(() => {
        if (!showConfirmation) {
            handleLogout();
        }
    }, [showConfirmation, handleLogout]);

    if (showConfirmation) {
        return (
            <Card className="w-full max-w-md mx-auto mt-8">
                <CardHeader>
                    <CardTitle>Confirm Logout</CardTitle>
                    <CardDescription>Are you sure you want to log out?</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end space-x-4">
                    <Button variant="outline" onClick={() => navigate("/")}>
                        Cancel
                    </Button>
                    <Button onClick={() => setShowConfirmation(false)}>
                        Yes, Log Out
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return <>Logging out...</>;
};

export default Logout;
