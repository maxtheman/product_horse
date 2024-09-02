import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, FileUp, Search, ChevronRight } from "lucide-react";

interface EmptyStateProps {
    showAddUser?: boolean;
    showUploadResearch?: boolean;
    showAskQuestion?: boolean;
  }
  
export const EmptyState = ({ showAddUser = true, showUploadResearch = true, showAskQuestion = true }: EmptyStateProps) => {
    const [, navigate] = useLocation();
    const numberVisibleButtons = Number(showAddUser) + Number(showUploadResearch) + Number(showAskQuestion);
    const gridColsClass = () => {
      switch (numberVisibleButtons) {
        case 1: return "md:grid-cols-1";
        case 2: return "md:grid-cols-2";
        case 3: return "md:grid-cols-3";
        default: return "md:grid-cols-1";
      }
    };
    const variantClasses = () => {
      switch (numberVisibleButtons) {
        case 1: return ['default', 'default', 'default'];
        case 2: return ['default', 'outline', 'default'];
        case 3: return ['default', 'outline', 'secondary'];
        default: return ['default', 'outline', 'secondary'];
      }
    }
    return (
      <Card className={`w-full max-w-4xl mx-auto ${variantClasses()}`}>
        <CardHeader>
          <CardTitle className="text-4xl font-bold tracking-tight">Welcome to Product Horse</CardTitle>
          <CardDescription className="text-xl">
            Streamline your product research, create insightful videos, and manage your team efficiently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 gap-4 ${gridColsClass()}`}>
            {showAddUser && (
              <Button className="justify-between w-full" size="lg" variant={variantClasses()[0] as "default" | "outline" | "secondary"} onClick={() => navigate("/new-user")}>
                <span className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Add New User
                </span>
                <ChevronRight className="w-5 h-5" />
              </Button>
            )}
            {showUploadResearch && (
              <Button className="justify-between w-full" variant={variantClasses()[1] as "default" | "outline" | "secondary"} size="lg" onClick={() => navigate("/")}>
                <span className="flex items-center">
                  <FileUp className="w-5 h-5 mr-2" />
                  Upload User Research
                </span>
                <ChevronRight className="w-5 h-5" />
              </Button>
            )}
            {showAskQuestion && (
              <Button className="justify-between w-full" variant={variantClasses()[2] as "default" | "outline" | "secondary"} size="lg" onClick={() => navigate("/utterances")}>
                <span className="flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Ask a Question
                </span>
                <ChevronRight className="w-5 h-5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }