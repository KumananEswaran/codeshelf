import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthStatusCardProps {
  icon: LucideIcon;
  iconClassName?: string;
  iconBgClassName?: string;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}

export default function AuthStatusCard({
  icon: Icon,
  iconClassName = "text-primary",
  iconBgClassName = "bg-primary/10",
  title,
  description,
  children,
}: AuthStatusCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div
          className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${iconBgClassName}`}
        >
          <Icon className={`h-6 w-6 ${iconClassName}`} />
        </div>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
